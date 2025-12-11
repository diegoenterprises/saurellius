"""
SAURELLIUS WORKFORCE API ROUTES
Real-time workforce monitoring and schedule management endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.workforce_service import workforce_service, POSITION_COLORS, DAYS_OF_WEEK

workforce_bp = Blueprint('workforce', __name__, url_prefix='/api/workforce')


# ==================== SCHEDULE GRID ====================

@workforce_bp.route('/schedule', methods=['GET'])
@jwt_required()
def get_weekly_schedule():
    """
    Get the weekly schedule grid - the captain's observation tower view.
    Returns all employees and their shifts for the week.
    """
    week_start = request.args.get('week_start')
    department = request.args.get('department')
    location = request.args.get('location')
    positions = request.args.getlist('positions')
    
    result = workforce_service.get_weekly_schedule(
        week_start=week_start,
        department=department,
        location=location,
        positions=positions if positions else None
    )
    
    return jsonify(result)


@workforce_bp.route('/schedule/daily', methods=['GET'])
@jwt_required()
def get_daily_schedule():
    """Get all shifts for a specific day."""
    target_date = request.args.get('date')
    result = workforce_service.get_daily_view(target_date)
    return jsonify(result)


@workforce_bp.route('/schedule/publish', methods=['POST'])
@jwt_required()
def publish_schedule():
    """Publish the schedule for a week and notify employees."""
    data = request.get_json()
    week_start = data.get('week_start')
    notify = data.get('notify', True)
    
    if not week_start:
        return jsonify({'success': False, 'error': 'week_start is required'}), 400
    
    result = workforce_service.publish_schedule(week_start, notify)
    return jsonify(result)


# ==================== REAL-TIME STATUS ====================

@workforce_bp.route('/live', methods=['GET'])
@jwt_required()
def get_live_status():
    """
    Get real-time status of all employees.
    Who is clocked in, on break, or clocked out.
    """
    department = request.args.get('department')
    result = workforce_service.get_live_status(department)
    return jsonify(result)


@workforce_bp.route('/clock-in', methods=['POST'])
@jwt_required()
def clock_in():
    """Clock in the current user."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    location = data.get('location', '')
    
    result = workforce_service.clock_in(user_id, location)
    return jsonify(result)


@workforce_bp.route('/clock-out', methods=['POST'])
@jwt_required()
def clock_out():
    """Clock out the current user."""
    user_id = get_jwt_identity()
    result = workforce_service.clock_out(user_id)
    return jsonify(result)


@workforce_bp.route('/break/start', methods=['POST'])
@jwt_required()
def start_break():
    """Start break for current user."""
    user_id = get_jwt_identity()
    result = workforce_service.start_break(user_id)
    return jsonify(result)


@workforce_bp.route('/break/end', methods=['POST'])
@jwt_required()
def end_break():
    """End break for current user."""
    user_id = get_jwt_identity()
    result = workforce_service.end_break(user_id)
    return jsonify(result)


# ==================== SHIFT MANAGEMENT ====================

@workforce_bp.route('/shifts', methods=['POST'])
@jwt_required()
def create_shift():
    """Create a new shift."""
    data = request.get_json()
    
    employee_id = data.get('employee_id')
    shift_date = data.get('date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    notes = data.get('notes', '')
    
    if not all([employee_id, shift_date, start_time, end_time]):
        return jsonify({
            'success': False,
            'error': 'employee_id, date, start_time, and end_time are required'
        }), 400
    
    result = workforce_service.create_shift(
        employee_id=employee_id,
        shift_date=shift_date,
        start_time=start_time,
        end_time=end_time,
        notes=notes
    )
    
    return jsonify(result)


@workforce_bp.route('/shifts/<shift_id>', methods=['PUT'])
@jwt_required()
def update_shift(shift_id):
    """Update an existing shift."""
    data = request.get_json()
    
    result = workforce_service.update_shift(
        shift_id=shift_id,
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        notes=data.get('notes')
    )
    
    return jsonify(result)


@workforce_bp.route('/shifts/<shift_id>', methods=['DELETE'])
@jwt_required()
def delete_shift(shift_id):
    """Delete a shift."""
    result = workforce_service.delete_shift(shift_id)
    return jsonify(result)


# ==================== TIME OFF ====================

@workforce_bp.route('/time-off/request', methods=['POST'])
@jwt_required()
def request_time_off():
    """Submit a time off request."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    time_off_type = data.get('type', 'personal')
    reason = data.get('reason', '')
    
    if not start_date or not end_date:
        return jsonify({
            'success': False,
            'error': 'start_date and end_date are required'
        }), 400
    
    result = workforce_service.request_time_off(
        employee_id=user_id,
        start_date=start_date,
        end_date=end_date,
        time_off_type=time_off_type,
        reason=reason
    )
    
    return jsonify(result)


@workforce_bp.route('/time-off/requests', methods=['GET'])
@jwt_required()
def get_time_off_requests():
    """Get all time off requests."""
    status = request.args.get('status')
    result = workforce_service.get_time_off_requests(status)
    return jsonify(result)


@workforce_bp.route('/time-off/<request_id>/review', methods=['POST'])
@jwt_required()
def review_time_off(request_id):
    """Approve or deny a time off request."""
    user_id = get_jwt_identity()
    data = request.get_json()
    approve = data.get('approve', False)
    
    result = workforce_service.review_time_off(request_id, approve, user_id)
    return jsonify(result)


# ==================== EMPLOYEES ====================

@workforce_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    """Get all employees."""
    department = request.args.get('department')
    position = request.args.get('position')
    result = workforce_service.get_employees(department, position)
    return jsonify(result)


@workforce_bp.route('/employees/<int:employee_id>', methods=['GET'])
@jwt_required()
def get_employee(employee_id):
    """Get a specific employee."""
    result = workforce_service.get_employee(employee_id)
    return jsonify(result)


# ==================== ANALYTICS ====================

@workforce_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get workforce statistics."""
    week_start = request.args.get('week_start')
    result = workforce_service.get_workforce_stats(week_start)
    return jsonify(result)


# ==================== UTILITIES ====================

@workforce_bp.route('/positions', methods=['GET'])
@jwt_required()
def get_positions():
    """Get available positions with their colors."""
    return jsonify({
        'success': True,
        'positions': POSITION_COLORS,
        'days_of_week': DAYS_OF_WEEK
    })
