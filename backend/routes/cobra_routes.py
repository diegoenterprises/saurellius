"""
COBRA ADMINISTRATION ROUTES
COBRA notification, enrollment, and premium management
For employers with 20+ employees
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
import uuid

cobra_bp = Blueprint('cobra', __name__, url_prefix='/api/cobra')

# In-memory storage
COBRA_EVENTS = {}
COBRA_ENROLLMENTS = {}
COBRA_PAYMENTS = {}

# COBRA qualifying events
QUALIFYING_EVENTS = {
    'termination': {
        'name': 'Termination (not gross misconduct)',
        'coverage_months': 18,
        'notice_deadline_days': 14,
    },
    'reduction_hours': {
        'name': 'Reduction of hours',
        'coverage_months': 18,
        'notice_deadline_days': 14,
    },
    'divorce': {
        'name': 'Divorce or legal separation',
        'coverage_months': 36,
        'notice_deadline_days': 60,  # Employer has 14 days after notification
    },
    'death': {
        'name': 'Death of covered employee',
        'coverage_months': 36,
        'notice_deadline_days': 14,
    },
    'medicare_entitlement': {
        'name': 'Employee entitled to Medicare',
        'coverage_months': 36,
        'notice_deadline_days': 14,
    },
    'child_loss_dependent': {
        'name': 'Child loses dependent status',
        'coverage_months': 36,
        'notice_deadline_days': 60,
    },
}


@cobra_bp.route('/events', methods=['GET'])
def get_qualifying_events():
    """Get list of COBRA qualifying events"""
    return jsonify({
        'success': True,
        'qualifying_events': QUALIFYING_EVENTS
    })


@cobra_bp.route('/event', methods=['POST'])
@jwt_required()
def create_cobra_event():
    """Create a COBRA qualifying event"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    required = ['employee_id', 'event_type', 'event_date']
    for field in required:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    event_type = data['event_type']
    if event_type not in QUALIFYING_EVENTS:
        return jsonify({
            'success': False,
            'message': f'Invalid event type. Valid types: {list(QUALIFYING_EVENTS.keys())}'
        }), 400
    
    event_info = QUALIFYING_EVENTS[event_type]
    event_date = date.fromisoformat(data['event_date'])
    
    # Calculate deadlines
    notice_deadline = event_date + timedelta(days=event_info['notice_deadline_days'])
    election_deadline = notice_deadline + timedelta(days=60)  # 60 days to elect
    coverage_end = event_date + timedelta(days=event_info['coverage_months'] * 30)
    
    event_id = f"COBRA-{uuid.uuid4().hex[:8].upper()}"
    
    cobra_event = {
        'id': event_id,
        'employee_id': data['employee_id'],
        'employee_name': data.get('employee_name'),
        'event_type': event_type,
        'event_description': event_info['name'],
        'event_date': event_date.isoformat(),
        
        # Beneficiaries who can elect COBRA
        'beneficiaries': data.get('beneficiaries', []),  # List of {name, relationship, dob}
        
        # Health plan information
        'health_plan': data.get('health_plan'),
        'coverage_type': data.get('coverage_type'),  # employee_only, employee_spouse, family
        'monthly_premium': float(data.get('monthly_premium', 0)),
        'admin_fee_rate': 0.02,  # 2% administrative fee
        
        # Calculated fields
        'cobra_premium': round(float(data.get('monthly_premium', 0)) * 1.02, 2),  # 102% of premium
        'coverage_months': event_info['coverage_months'],
        'coverage_end_date': coverage_end.isoformat(),
        
        # Deadlines
        'notice_deadline': notice_deadline.isoformat(),
        'election_deadline': election_deadline.isoformat(),
        
        # Status tracking
        'notice_sent': False,
        'notice_sent_date': None,
        'election_received': False,
        'election_date': None,
        'election_status': 'pending',  # pending, elected, waived, expired
        
        # Metadata
        'created_at': datetime.utcnow().isoformat(),
        'created_by': user_id,
        'notes': data.get('notes'),
    }
    
    COBRA_EVENTS[event_id] = cobra_event
    
    return jsonify({
        'success': True,
        'cobra_event': cobra_event,
        'message': f'COBRA event created. Notice must be sent by {notice_deadline.isoformat()}'
    }), 201


@cobra_bp.route('/event/<event_id>', methods=['GET'])
@jwt_required()
def get_cobra_event(event_id):
    """Get COBRA event details"""
    if event_id not in COBRA_EVENTS:
        return jsonify({'success': False, 'message': 'Event not found'}), 404
    
    event = COBRA_EVENTS[event_id]
    
    # Get related enrollments and payments
    enrollments = [e for e in COBRA_ENROLLMENTS.values() if e['event_id'] == event_id]
    payments = [p for p in COBRA_PAYMENTS.values() if p['event_id'] == event_id]
    
    return jsonify({
        'success': True,
        'event': event,
        'enrollments': enrollments,
        'payments': payments
    })


@cobra_bp.route('/event/<event_id>/send-notice', methods=['POST'])
@jwt_required()
def send_cobra_notice(event_id):
    """Mark COBRA notice as sent"""
    if event_id not in COBRA_EVENTS:
        return jsonify({'success': False, 'message': 'Event not found'}), 404
    
    data = request.get_json()
    user_id = get_jwt_identity()
    event = COBRA_EVENTS[event_id]
    
    event['notice_sent'] = True
    event['notice_sent_date'] = datetime.utcnow().isoformat()
    event['notice_sent_by'] = user_id
    event['notice_method'] = data.get('method', 'mail')  # mail, email, certified_mail
    event['notice_tracking'] = data.get('tracking_number')
    
    COBRA_EVENTS[event_id] = event
    
    return jsonify({
        'success': True,
        'event': event,
        'message': 'COBRA notice marked as sent'
    })


@cobra_bp.route('/event/<event_id>/elect', methods=['POST'])
@jwt_required()
def elect_cobra(event_id):
    """Process COBRA election"""
    if event_id not in COBRA_EVENTS:
        return jsonify({'success': False, 'message': 'Event not found'}), 404
    
    data = request.get_json()
    user_id = get_jwt_identity()
    event = COBRA_EVENTS[event_id]
    
    # Check if within election period
    election_deadline = date.fromisoformat(event['election_deadline'])
    if date.today() > election_deadline:
        return jsonify({
            'success': False,
            'message': 'Election deadline has passed'
        }), 400
    
    election_choice = data.get('choice', 'elect')  # elect, waive
    
    if election_choice == 'waive':
        event['election_status'] = 'waived'
        event['election_date'] = datetime.utcnow().isoformat()
        event['election_received'] = True
        COBRA_EVENTS[event_id] = event
        
        return jsonify({
            'success': True,
            'event': event,
            'message': 'COBRA coverage waived'
        })
    
    # Create enrollment
    enrollment_id = f"COBRA-ENR-{uuid.uuid4().hex[:8].upper()}"
    
    enrollment = {
        'id': enrollment_id,
        'event_id': event_id,
        'employee_id': event['employee_id'],
        
        # Coverage details
        'coverage_type': data.get('coverage_type', event['coverage_type']),
        'covered_individuals': data.get('covered_individuals', event.get('beneficiaries', [])),
        
        # Dates
        'coverage_start': event['event_date'],  # Retroactive to event date
        'coverage_end': event['coverage_end_date'],
        'enrolled_at': datetime.utcnow().isoformat(),
        
        # Premium
        'monthly_premium': event['cobra_premium'],
        'payment_due_day': 1,  # 1st of each month
        'grace_period_days': 30,
        
        # Status
        'status': 'active',
        'payments_made': 0,
        'payments_missed': 0,
        'last_payment_date': None,
        
        'created_by': user_id,
    }
    
    COBRA_ENROLLMENTS[enrollment_id] = enrollment
    
    # Update event
    event['election_status'] = 'elected'
    event['election_date'] = datetime.utcnow().isoformat()
    event['election_received'] = True
    event['enrollment_id'] = enrollment_id
    COBRA_EVENTS[event_id] = event
    
    # Calculate initial premium due (retroactive)
    event_date = date.fromisoformat(event['event_date'])
    months_retroactive = (date.today().year - event_date.year) * 12 + (date.today().month - event_date.month)
    initial_premium = event['cobra_premium'] * max(1, months_retroactive)
    
    return jsonify({
        'success': True,
        'enrollment': enrollment,
        'event': event,
        'initial_premium_due': initial_premium,
        'message': f'COBRA coverage elected. Initial premium of ${initial_premium:.2f} due within 45 days.'
    })


@cobra_bp.route('/enrollment/<enrollment_id>/payment', methods=['POST'])
@jwt_required()
def record_cobra_payment(enrollment_id):
    """Record a COBRA premium payment"""
    if enrollment_id not in COBRA_ENROLLMENTS:
        return jsonify({'success': False, 'message': 'Enrollment not found'}), 404
    
    data = request.get_json()
    user_id = get_jwt_identity()
    enrollment = COBRA_ENROLLMENTS[enrollment_id]
    
    payment_id = f"COBRA-PAY-{uuid.uuid4().hex[:8].upper()}"
    
    payment = {
        'id': payment_id,
        'enrollment_id': enrollment_id,
        'event_id': enrollment['event_id'],
        'employee_id': enrollment['employee_id'],
        
        'amount': float(data['amount']),
        'payment_date': data.get('payment_date', date.today().isoformat()),
        'payment_method': data.get('payment_method', 'check'),  # check, credit_card, ach
        'reference_number': data.get('reference_number'),
        
        'coverage_month': data.get('coverage_month'),
        
        'received_at': datetime.utcnow().isoformat(),
        'recorded_by': user_id,
    }
    
    COBRA_PAYMENTS[payment_id] = payment
    
    # Update enrollment
    enrollment['payments_made'] += 1
    enrollment['last_payment_date'] = payment['payment_date']
    COBRA_ENROLLMENTS[enrollment_id] = enrollment
    
    return jsonify({
        'success': True,
        'payment': payment,
        'enrollment': enrollment
    })


@cobra_bp.route('/enrollments/active', methods=['GET'])
@jwt_required()
def get_active_enrollments():
    """Get all active COBRA enrollments"""
    active = [e for e in COBRA_ENROLLMENTS.values() if e['status'] == 'active']
    
    # Add payment status
    for enrollment in active:
        enrollment['payments'] = [p for p in COBRA_PAYMENTS.values() 
                                  if p['enrollment_id'] == enrollment['id']]
        enrollment['total_paid'] = sum(p['amount'] for p in enrollment['payments'])
    
    return jsonify({
        'success': True,
        'enrollments': active,
        'count': len(active)
    })


@cobra_bp.route('/pending-notices', methods=['GET'])
@jwt_required()
def get_pending_notices():
    """Get COBRA events needing notice"""
    pending = [e for e in COBRA_EVENTS.values() 
               if not e['notice_sent'] and e['election_status'] == 'pending']
    
    # Sort by notice deadline
    pending.sort(key=lambda x: x['notice_deadline'])
    
    # Check for overdue notices
    for event in pending:
        deadline = date.fromisoformat(event['notice_deadline'])
        event['overdue'] = date.today() > deadline
        event['days_remaining'] = (deadline - date.today()).days
    
    return jsonify({
        'success': True,
        'pending_notices': pending,
        'count': len(pending),
        'overdue_count': sum(1 for e in pending if e['overdue'])
    })


@cobra_bp.route('/pending-elections', methods=['GET'])
@jwt_required()
def get_pending_elections():
    """Get COBRA events awaiting election"""
    pending = [e for e in COBRA_EVENTS.values() 
               if e['notice_sent'] and e['election_status'] == 'pending']
    
    for event in pending:
        deadline = date.fromisoformat(event['election_deadline'])
        event['days_remaining'] = (deadline - date.today()).days
        event['expired'] = date.today() > deadline
        
        # Auto-expire if past deadline
        if event['expired'] and event['election_status'] == 'pending':
            event['election_status'] = 'expired'
            COBRA_EVENTS[event['id']] = event
    
    pending.sort(key=lambda x: x['election_deadline'])
    
    return jsonify({
        'success': True,
        'pending_elections': pending,
        'count': len(pending)
    })


@cobra_bp.route('/payment-delinquent', methods=['GET'])
@jwt_required()
def get_delinquent_payments():
    """Get enrollments with overdue payments"""
    delinquent = []
    
    for enrollment in COBRA_ENROLLMENTS.values():
        if enrollment['status'] != 'active':
            continue
        
        # Check if payment is due
        if enrollment['last_payment_date']:
            last_payment = date.fromisoformat(enrollment['last_payment_date'])
        else:
            # First payment due 45 days after election
            event = COBRA_EVENTS.get(enrollment['event_id'], {})
            election_date = event.get('election_date', enrollment['enrolled_at'])
            last_payment = date.fromisoformat(election_date[:10]) - timedelta(days=15)
        
        # Next payment due
        next_due = date(last_payment.year, last_payment.month, 1) + timedelta(days=32)
        next_due = date(next_due.year, next_due.month, 1)  # First of next month
        
        grace_end = next_due + timedelta(days=enrollment['grace_period_days'])
        
        if date.today() > grace_end:
            # Beyond grace period - coverage terminates
            enrollment['status'] = 'terminated_nonpayment'
            COBRA_ENROLLMENTS[enrollment['id']] = enrollment
            delinquent.append({
                **enrollment,
                'next_due_date': next_due.isoformat(),
                'grace_period_end': grace_end.isoformat(),
                'days_overdue': (date.today() - grace_end).days,
                'terminated': True
            })
        elif date.today() > next_due:
            # In grace period
            delinquent.append({
                **enrollment,
                'next_due_date': next_due.isoformat(),
                'grace_period_end': grace_end.isoformat(),
                'days_overdue': (date.today() - next_due).days,
                'in_grace_period': True
            })
    
    return jsonify({
        'success': True,
        'delinquent': delinquent,
        'count': len(delinquent)
    })


@cobra_bp.route('/calculate-premium', methods=['POST'])
@jwt_required()
def calculate_cobra_premium():
    """Calculate COBRA premium for a terminated employee"""
    data = request.get_json()
    
    monthly_group_rate = float(data.get('monthly_group_rate', 0))
    employee_contribution = float(data.get('employee_contribution', 0))
    employer_contribution = float(data.get('employer_contribution', 0))
    
    # Full premium is what employer + employee were paying
    full_premium = employee_contribution + employer_contribution
    
    # COBRA allows 102% charge
    admin_fee = full_premium * 0.02
    cobra_premium = full_premium + admin_fee
    
    # For disability extension (29 months), can charge 150%
    disability_premium = full_premium * 1.50
    
    return jsonify({
        'success': True,
        'calculation': {
            'full_monthly_premium': round(full_premium, 2),
            'admin_fee_2_percent': round(admin_fee, 2),
            'cobra_premium_102_percent': round(cobra_premium, 2),
            'disability_premium_150_percent': round(disability_premium, 2),
            'annual_cobra_cost': round(cobra_premium * 12, 2),
            'max_coverage_18_months': round(cobra_premium * 18, 2),
            'max_coverage_36_months': round(cobra_premium * 36, 2),
        }
    })


@cobra_bp.route('/report', methods=['GET'])
@jwt_required()
def generate_cobra_report():
    """Generate COBRA administration report"""
    
    total_events = len(COBRA_EVENTS)
    notices_sent = sum(1 for e in COBRA_EVENTS.values() if e['notice_sent'])
    notices_pending = total_events - notices_sent
    
    elections = sum(1 for e in COBRA_EVENTS.values() if e['election_status'] == 'elected')
    waivers = sum(1 for e in COBRA_EVENTS.values() if e['election_status'] == 'waived')
    expired = sum(1 for e in COBRA_EVENTS.values() if e['election_status'] == 'expired')
    
    active_enrollments = sum(1 for e in COBRA_ENROLLMENTS.values() if e['status'] == 'active')
    terminated_enrollments = sum(1 for e in COBRA_ENROLLMENTS.values() if 'terminated' in e['status'])
    
    total_premium_collected = sum(p['amount'] for p in COBRA_PAYMENTS.values())
    
    return jsonify({
        'success': True,
        'report': {
            'generated_at': datetime.utcnow().isoformat(),
            
            'events': {
                'total': total_events,
                'notices_sent': notices_sent,
                'notices_pending': notices_pending,
            },
            
            'elections': {
                'elected': elections,
                'waived': waivers,
                'expired': expired,
                'election_rate': round(elections / total_events * 100, 2) if total_events > 0 else 0,
            },
            
            'enrollments': {
                'active': active_enrollments,
                'terminated': terminated_enrollments,
            },
            
            'financials': {
                'total_premium_collected': round(total_premium_collected, 2),
                'monthly_premium_revenue': round(active_enrollments * 
                    (list(COBRA_ENROLLMENTS.values())[0]['monthly_premium'] if COBRA_ENROLLMENTS else 0), 2),
            }
        }
    })
