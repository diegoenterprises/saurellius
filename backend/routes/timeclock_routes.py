"""
TIME CLOCK & ATTENDANCE ROUTES
Clock in/out, break tracking, overtime calculation
Supports California daily OT, 7th consecutive day rules
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
import uuid

timeclock_bp = Blueprint('timeclock', __name__, url_prefix='/api/timeclock')

# In-memory storage
TIME_ENTRIES = {}
PUNCH_RECORDS = {}

# State-specific overtime rules
STATE_OT_RULES = {
    'CA': {
        'daily_ot_threshold': 8,
        'daily_double_threshold': 12,
        'weekly_ot_threshold': 40,
        'seventh_day_rule': True,  # 1.5x first 8 hrs, 2x after
        'meal_break_required': True,
        'meal_break_hours': 5,
        'meal_break_minutes': 30,
        'rest_break_per_hours': 4,
        'rest_break_minutes': 10,
    },
    'CO': {
        'daily_ot_threshold': 12,
        'weekly_ot_threshold': 40,
    },
    'AK': {
        'daily_ot_threshold': 8,
        'weekly_ot_threshold': 40,
    },
    'NV': {
        'daily_ot_threshold': 8,
        'weekly_ot_threshold': 40,
        'daily_ot_condition': 'hourly_rate_under_1.5x_minimum',
    },
    'DEFAULT': {
        'weekly_ot_threshold': 40,
    }
}


@timeclock_bp.route('/punch', methods=['POST'])
@jwt_required()
def punch():
    """Record clock in or clock out punch"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    employee_id = data.get('employee_id', user_id)
    punch_type = data.get('punch_type')  # clock_in, clock_out, break_start, break_end
    
    if punch_type not in ['clock_in', 'clock_out', 'break_start', 'break_end']:
        return jsonify({
            'success': False,
            'message': 'Invalid punch type. Use: clock_in, clock_out, break_start, break_end'
        }), 400
    
    punch_id = f"PUNCH-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow()
    
    punch_record = {
        'id': punch_id,
        'employee_id': employee_id,
        'punch_type': punch_type,
        'timestamp': now.isoformat(),
        'date': now.date().isoformat(),
        'time': now.strftime('%H:%M:%S'),
        'location': data.get('location'),
        'ip_address': request.remote_addr,
        'device': data.get('device'),
        'notes': data.get('notes'),
        'created_by': user_id,
    }
    
    # GPS coordinates if provided
    if data.get('latitude') and data.get('longitude'):
        punch_record['coordinates'] = {
            'latitude': data['latitude'],
            'longitude': data['longitude']
        }
    
    PUNCH_RECORDS[punch_id] = punch_record
    
    # Auto-create or update time entry
    if punch_type == 'clock_in':
        entry_id = create_time_entry(employee_id, now)
        punch_record['time_entry_id'] = entry_id
    elif punch_type == 'clock_out':
        entry_id = close_time_entry(employee_id, now)
        punch_record['time_entry_id'] = entry_id
    
    return jsonify({
        'success': True,
        'punch': punch_record,
        'message': f'{punch_type.replace("_", " ").title()} recorded at {now.strftime("%I:%M %p")}'
    }), 201


def create_time_entry(employee_id, clock_in_time):
    """Create a new time entry when clocking in"""
    entry_id = f"TIME-{uuid.uuid4().hex[:8].upper()}"
    
    TIME_ENTRIES[entry_id] = {
        'id': entry_id,
        'employee_id': employee_id,
        'date': clock_in_time.date().isoformat(),
        'clock_in': clock_in_time.isoformat(),
        'clock_out': None,
        'breaks': [],
        'total_hours': 0,
        'regular_hours': 0,
        'overtime_hours': 0,
        'double_time_hours': 0,
        'status': 'active',
        'created_at': datetime.utcnow().isoformat(),
    }
    
    return entry_id


def close_time_entry(employee_id, clock_out_time):
    """Close time entry when clocking out"""
    # Find active entry
    active_entry = None
    for entry in TIME_ENTRIES.values():
        if entry['employee_id'] == employee_id and entry['status'] == 'active':
            active_entry = entry
            break
    
    if not active_entry:
        return None
    
    clock_in = datetime.fromisoformat(active_entry['clock_in'])
    total_minutes = (clock_out_time - clock_in).total_seconds() / 60
    
    # Subtract break time
    break_minutes = sum(b.get('duration_minutes', 0) for b in active_entry.get('breaks', []))
    worked_minutes = total_minutes - break_minutes
    
    active_entry['clock_out'] = clock_out_time.isoformat()
    active_entry['total_hours'] = round(worked_minutes / 60, 2)
    active_entry['status'] = 'complete'
    
    return active_entry['id']


@timeclock_bp.route('/status/<employee_id>', methods=['GET'])
@jwt_required()
def get_clock_status(employee_id):
    """Get current clock status for an employee"""
    active_entry = None
    for entry in TIME_ENTRIES.values():
        if entry['employee_id'] == employee_id and entry['status'] == 'active':
            active_entry = entry
            break
    
    if active_entry:
        clock_in = datetime.fromisoformat(active_entry['clock_in'])
        elapsed = datetime.utcnow() - clock_in
        hours_worked = round(elapsed.total_seconds() / 3600, 2)
        
        return jsonify({
            'success': True,
            'clocked_in': True,
            'clock_in_time': active_entry['clock_in'],
            'hours_worked': hours_worked,
            'on_break': any(b.get('end') is None for b in active_entry.get('breaks', [])),
            'entry_id': active_entry['id']
        })
    
    return jsonify({
        'success': True,
        'clocked_in': False
    })


@timeclock_bp.route('/entries', methods=['GET'])
@jwt_required()
def get_time_entries():
    """Get time entries with filtering"""
    employee_id = request.args.get('employee_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    
    entries = list(TIME_ENTRIES.values())
    
    if employee_id:
        entries = [e for e in entries if e['employee_id'] == employee_id]
    
    if start_date:
        entries = [e for e in entries if e['date'] >= start_date]
    
    if end_date:
        entries = [e for e in entries if e['date'] <= end_date]
    
    if status:
        entries = [e for e in entries if e['status'] == status]
    
    entries.sort(key=lambda x: x['date'], reverse=True)
    
    return jsonify({'success': True, 'entries': entries})


@timeclock_bp.route('/entries/<entry_id>', methods=['PUT'])
@jwt_required()
def update_time_entry(entry_id):
    """Update/correct a time entry"""
    if entry_id not in TIME_ENTRIES:
        return jsonify({'success': False, 'message': 'Entry not found'}), 404
    
    data = request.get_json()
    user_id = get_jwt_identity()
    entry = TIME_ENTRIES[entry_id]
    
    # Track changes for audit
    if 'audit_trail' not in entry:
        entry['audit_trail'] = []
    
    changes = []
    
    if 'clock_in' in data and data['clock_in'] != entry['clock_in']:
        changes.append({'field': 'clock_in', 'old': entry['clock_in'], 'new': data['clock_in']})
        entry['clock_in'] = data['clock_in']
    
    if 'clock_out' in data and data['clock_out'] != entry['clock_out']:
        changes.append({'field': 'clock_out', 'old': entry['clock_out'], 'new': data['clock_out']})
        entry['clock_out'] = data['clock_out']
    
    if changes:
        entry['audit_trail'].append({
            'timestamp': datetime.utcnow().isoformat(),
            'changed_by': user_id,
            'reason': data.get('reason', 'Correction'),
            'changes': changes
        })
        
        # Recalculate hours
        if entry['clock_in'] and entry['clock_out']:
            clock_in = datetime.fromisoformat(entry['clock_in'])
            clock_out = datetime.fromisoformat(entry['clock_out'])
            total_minutes = (clock_out - clock_in).total_seconds() / 60
            break_minutes = sum(b.get('duration_minutes', 0) for b in entry.get('breaks', []))
            entry['total_hours'] = round((total_minutes - break_minutes) / 60, 2)
    
    TIME_ENTRIES[entry_id] = entry
    
    return jsonify({'success': True, 'entry': entry})


@timeclock_bp.route('/calculate-overtime', methods=['POST'])
@jwt_required()
def calculate_overtime():
    """Calculate overtime for a pay period with state-specific rules"""
    data = request.get_json()
    
    employee_id = data['employee_id']
    work_state = data.get('work_state', 'DEFAULT').upper()
    start_date = date.fromisoformat(data['start_date'])
    end_date = date.fromisoformat(data['end_date'])
    hourly_rate = float(data.get('hourly_rate', 0))
    
    # Get state rules
    rules = STATE_OT_RULES.get(work_state, STATE_OT_RULES['DEFAULT'])
    daily_ot_threshold = rules.get('daily_ot_threshold')
    daily_double_threshold = rules.get('daily_double_threshold')
    weekly_ot_threshold = rules.get('weekly_ot_threshold', 40)
    seventh_day_rule = rules.get('seventh_day_rule', False)
    
    # Get entries for the period
    entries = [e for e in TIME_ENTRIES.values() 
               if e['employee_id'] == employee_id 
               and start_date.isoformat() <= e['date'] <= end_date.isoformat()]
    
    entries.sort(key=lambda x: x['date'])
    
    # Calculate by week
    weeks = {}
    for entry in entries:
        entry_date = date.fromisoformat(entry['date'])
        # Get start of week (Monday)
        week_start = entry_date - timedelta(days=entry_date.weekday())
        week_key = week_start.isoformat()
        
        if week_key not in weeks:
            weeks[week_key] = {
                'days': {},
                'total_hours': 0,
                'regular_hours': 0,
                'overtime_hours': 0,
                'double_time_hours': 0,
                'consecutive_days': 0,
            }
        
        day_key = entry['date']
        if day_key not in weeks[week_key]['days']:
            weeks[week_key]['days'][day_key] = {
                'hours': 0,
                'regular': 0,
                'overtime': 0,
                'double_time': 0,
            }
        
        weeks[week_key]['days'][day_key]['hours'] += entry.get('total_hours', 0)
        weeks[week_key]['total_hours'] += entry.get('total_hours', 0)
    
    # Process each week
    total_regular = 0
    total_ot = 0
    total_dt = 0
    
    for week_key, week_data in weeks.items():
        weekly_regular_used = 0
        days_worked = sorted(week_data['days'].keys())
        
        for i, day_key in enumerate(days_worked):
            day = week_data['days'][day_key]
            hours = day['hours']
            day_regular = 0
            day_ot = 0
            day_dt = 0
            
            # California 7th consecutive day rule
            is_seventh_day = seventh_day_rule and i >= 6
            
            if is_seventh_day:
                # 7th day: first 8 hours at 1.5x, over 8 at 2x
                if hours <= 8:
                    day_ot = hours
                else:
                    day_ot = 8
                    day_dt = hours - 8
            elif daily_ot_threshold:
                # Daily overtime states (CA, CO, AK)
                if hours <= daily_ot_threshold:
                    day_regular = hours
                elif daily_double_threshold and hours > daily_double_threshold:
                    day_regular = daily_ot_threshold
                    day_ot = daily_double_threshold - daily_ot_threshold
                    day_dt = hours - daily_double_threshold
                else:
                    day_regular = daily_ot_threshold
                    day_ot = hours - daily_ot_threshold
            else:
                # Federal rules - weekly only
                day_regular = hours
            
            day['regular'] = day_regular
            day['overtime'] = day_ot
            day['double_time'] = day_dt
            
            weekly_regular_used += day_regular
        
        # Weekly overtime (for non-daily OT states)
        if not daily_ot_threshold:
            total_week_hours = sum(d['hours'] for d in week_data['days'].values())
            if total_week_hours > weekly_ot_threshold:
                # Redistribute to weekly OT
                week_regular = weekly_ot_threshold
                week_ot = total_week_hours - weekly_ot_threshold
            else:
                week_regular = total_week_hours
                week_ot = 0
            
            week_data['regular_hours'] = week_regular
            week_data['overtime_hours'] = week_ot
            total_regular += week_regular
            total_ot += week_ot
        else:
            # Sum daily calculations
            week_data['regular_hours'] = sum(d['regular'] for d in week_data['days'].values())
            week_data['overtime_hours'] = sum(d['overtime'] for d in week_data['days'].values())
            week_data['double_time_hours'] = sum(d['double_time'] for d in week_data['days'].values())
            
            # Also check weekly cap for daily OT states
            if week_data['regular_hours'] > weekly_ot_threshold:
                excess = week_data['regular_hours'] - weekly_ot_threshold
                week_data['overtime_hours'] += excess
                week_data['regular_hours'] = weekly_ot_threshold
            
            total_regular += week_data['regular_hours']
            total_ot += week_data['overtime_hours']
            total_dt += week_data['double_time_hours']
    
    # Calculate pay
    regular_pay = round(total_regular * hourly_rate, 2)
    ot_pay = round(total_ot * hourly_rate * 1.5, 2)
    dt_pay = round(total_dt * hourly_rate * 2, 2)
    total_pay = regular_pay + ot_pay + dt_pay
    
    return jsonify({
        'success': True,
        'calculation': {
            'employee_id': employee_id,
            'period': f'{start_date.isoformat()} to {end_date.isoformat()}',
            'work_state': work_state,
            'rules_applied': rules,
            'hourly_rate': hourly_rate,
            
            'hours': {
                'regular': round(total_regular, 2),
                'overtime': round(total_ot, 2),
                'double_time': round(total_dt, 2),
                'total': round(total_regular + total_ot + total_dt, 2),
            },
            
            'pay': {
                'regular': regular_pay,
                'overtime': ot_pay,
                'double_time': dt_pay,
                'total': total_pay,
            },
            
            'weekly_breakdown': weeks,
        }
    })


@timeclock_bp.route('/meal-break-violations', methods=['GET'])
@jwt_required()
def check_meal_break_violations():
    """Check for California meal/rest break violations"""
    employee_id = request.args.get('employee_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    entries = list(TIME_ENTRIES.values())
    
    if employee_id:
        entries = [e for e in entries if e['employee_id'] == employee_id]
    
    if start_date:
        entries = [e for e in entries if e['date'] >= start_date]
    
    if end_date:
        entries = [e for e in entries if e['date'] <= end_date]
    
    violations = []
    
    for entry in entries:
        hours_worked = entry.get('total_hours', 0)
        breaks = entry.get('breaks', [])
        
        # California rules
        if hours_worked > 5:
            # Must have 30-minute meal break
            meal_breaks = [b for b in breaks if b.get('type') == 'meal' and b.get('duration_minutes', 0) >= 30]
            if not meal_breaks:
                violations.append({
                    'entry_id': entry['id'],
                    'employee_id': entry['employee_id'],
                    'date': entry['date'],
                    'violation_type': 'missing_meal_break',
                    'hours_worked': hours_worked,
                    'penalty': 'One hour of pay at regular rate',
                    'description': 'Worked over 5 hours without 30-minute meal break'
                })
        
        if hours_worked > 10:
            # Must have second meal break
            meal_breaks = [b for b in breaks if b.get('type') == 'meal' and b.get('duration_minutes', 0) >= 30]
            if len(meal_breaks) < 2:
                violations.append({
                    'entry_id': entry['id'],
                    'employee_id': entry['employee_id'],
                    'date': entry['date'],
                    'violation_type': 'missing_second_meal_break',
                    'hours_worked': hours_worked,
                    'penalty': 'One hour of pay at regular rate',
                    'description': 'Worked over 10 hours without second 30-minute meal break'
                })
        
        # Rest break check (every 4 hours)
        rest_periods_required = int(hours_worked / 4)
        rest_breaks = [b for b in breaks if b.get('type') == 'rest']
        if len(rest_breaks) < rest_periods_required:
            violations.append({
                'entry_id': entry['id'],
                'employee_id': entry['employee_id'],
                'date': entry['date'],
                'violation_type': 'missing_rest_break',
                'hours_worked': hours_worked,
                'rest_periods_required': rest_periods_required,
                'rest_periods_taken': len(rest_breaks),
                'penalty': 'One hour of pay at regular rate',
                'description': f'Required {rest_periods_required} rest breaks, only {len(rest_breaks)} taken'
            })
    
    return jsonify({
        'success': True,
        'violations': violations,
        'count': len(violations),
        'total_penalty_hours': len(violations)  # Each violation = 1 hour penalty
    })


@timeclock_bp.route('/weekly-summary/<employee_id>', methods=['GET'])
@jwt_required()
def get_weekly_summary(employee_id):
    """Get weekly hours summary for an employee"""
    week_start = request.args.get('week_start')
    
    if week_start:
        start_date = date.fromisoformat(week_start)
    else:
        today = date.today()
        start_date = today - timedelta(days=today.weekday())  # Monday
    
    end_date = start_date + timedelta(days=6)  # Sunday
    
    entries = [e for e in TIME_ENTRIES.values()
               if e['employee_id'] == employee_id
               and start_date.isoformat() <= e['date'] <= end_date.isoformat()]
    
    daily_hours = {}
    for i in range(7):
        day = start_date + timedelta(days=i)
        day_entries = [e for e in entries if e['date'] == day.isoformat()]
        daily_hours[day.strftime('%A')] = {
            'date': day.isoformat(),
            'hours': sum(e.get('total_hours', 0) for e in day_entries),
            'entries': len(day_entries)
        }
    
    total_hours = sum(d['hours'] for d in daily_hours.values())
    
    return jsonify({
        'success': True,
        'employee_id': employee_id,
        'week_start': start_date.isoformat(),
        'week_end': end_date.isoformat(),
        'daily_hours': daily_hours,
        'total_hours': round(total_hours, 2),
        'overtime_hours': max(0, round(total_hours - 40, 2)),
        'days_worked': sum(1 for d in daily_hours.values() if d['hours'] > 0)
    })


@timeclock_bp.route('/approve', methods=['POST'])
@jwt_required()
def approve_timesheet():
    """Manager approves employee timesheet"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    employee_id = data['employee_id']
    start_date = data['start_date']
    end_date = data['end_date']
    
    entries = [e for e in TIME_ENTRIES.values()
               if e['employee_id'] == employee_id
               and start_date <= e['date'] <= end_date]
    
    approved_count = 0
    for entry in entries:
        if entry['status'] == 'complete':
            entry['status'] = 'approved'
            entry['approved_by'] = user_id
            entry['approved_at'] = datetime.utcnow().isoformat()
            TIME_ENTRIES[entry['id']] = entry
            approved_count += 1
    
    return jsonify({
        'success': True,
        'approved_count': approved_count,
        'message': f'Approved {approved_count} time entries for {employee_id}'
    })
