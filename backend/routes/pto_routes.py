"""
PTO/LEAVE MANAGEMENT ROUTES
Leave requests, balances, policies, and calendar API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date

pto_bp = Blueprint('pto', __name__, url_prefix='/api/pto')


@pto_bp.route('/policies', methods=['GET'])
@jwt_required()
def get_policies():
    """Get all PTO policies"""
    from services.pto_service import pto_service
    
    leave_type = request.args.get('leave_type')
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    
    policies = pto_service.get_all_policies(leave_type=leave_type, active_only=active_only)
    
    return jsonify({'success': True, 'policies': policies})


@pto_bp.route('/policies', methods=['POST'])
@jwt_required()
def create_policy():
    """Create a new PTO policy"""
    from services.pto_service import pto_service
    
    data = request.get_json()
    
    try:
        policy = pto_service.create_policy(data)
        return jsonify({'success': True, 'policy': policy}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/policies/<policy_id>', methods=['GET'])
@jwt_required()
def get_policy(policy_id):
    """Get policy by ID"""
    from services.pto_service import pto_service
    
    policy = pto_service.get_policy(policy_id)
    if not policy:
        return jsonify({'success': False, 'message': 'Policy not found'}), 404
    
    return jsonify({'success': True, 'policy': policy})


@pto_bp.route('/enroll', methods=['POST'])
@jwt_required()
def enroll_employee():
    """Enroll employee in PTO policies"""
    from services.pto_service import pto_service
    
    data = request.get_json()
    
    try:
        balances = pto_service.enroll_employee(
            employee_id=data['employee_id'],
            hire_date=data['hire_date'],
            policy_ids=data.get('policy_ids')
        )
        return jsonify({'success': True, 'balances': balances}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/balances/<employee_id>', methods=['GET'])
@jwt_required()
def get_balances(employee_id):
    """Get PTO balances for an employee"""
    from services.pto_service import pto_service
    
    try:
        balances = pto_service.get_employee_balances(employee_id)
        return jsonify({'success': True, 'balances': balances})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 404


@pto_bp.route('/accrual', methods=['POST'])
@jwt_required()
def process_accrual():
    """Process PTO accrual for an employee"""
    from services.pto_service import pto_service
    
    data = request.get_json()
    
    try:
        result = pto_service.process_accrual(
            employee_id=data['employee_id'],
            policy_id=data['policy_id'],
            pay_period_end=date.fromisoformat(data['pay_period_end']),
            hours_worked=data.get('hours_worked')
        )
        return jsonify({'success': True, 'accrual': result})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_leave_requests():
    """Get leave requests"""
    from services.pto_service import pto_service
    
    employee_id = request.args.get('employee_id')
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    requests = pto_service.get_leave_requests(
        employee_id=employee_id,
        status=status,
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None
    )
    
    return jsonify({'success': True, 'requests': requests})


@pto_bp.route('/requests', methods=['POST'])
@jwt_required()
def submit_leave_request():
    """Submit a leave request"""
    from services.pto_service import pto_service
    
    data = request.get_json()
    employee_id = data.get('employee_id') or get_jwt_identity()
    
    try:
        request_obj = pto_service.submit_leave_request(employee_id, data)
        return jsonify({'success': True, 'request': request_obj}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/requests/<request_id>/approve', methods=['POST'])
@jwt_required()
def approve_request(request_id):
    """Approve a leave request"""
    from services.pto_service import pto_service
    
    reviewer_id = get_jwt_identity()
    
    try:
        request_obj = pto_service.approve_request(request_id, reviewer_id)
        return jsonify({'success': True, 'request': request_obj})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/requests/<request_id>/deny', methods=['POST'])
@jwt_required()
def deny_request(request_id):
    """Deny a leave request"""
    from services.pto_service import pto_service
    
    data = request.get_json()
    reviewer_id = get_jwt_identity()
    reason = data.get('reason', 'Request denied')
    
    try:
        request_obj = pto_service.deny_request(request_id, reviewer_id, reason)
        return jsonify({'success': True, 'request': request_obj})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/requests/<request_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_request(request_id):
    """Cancel a leave request"""
    from services.pto_service import pto_service
    
    employee_id = get_jwt_identity()
    
    try:
        request_obj = pto_service.cancel_request(request_id, employee_id)
        return jsonify({'success': True, 'request': request_obj})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/requests/<request_id>/taken', methods=['POST'])
@jwt_required()
def mark_leave_taken(request_id):
    """Mark leave as taken"""
    from services.pto_service import pto_service
    
    try:
        request_obj = pto_service.mark_leave_taken(request_id)
        return jsonify({'success': True, 'request': request_obj})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_team_calendar():
    """Get team leave calendar"""
    from services.pto_service import pto_service
    
    employee_ids = request.args.getlist('employee_ids')
    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)
    
    calendar = pto_service.get_team_calendar(employee_ids, month, year)
    
    return jsonify({'success': True, 'calendar': calendar})


@pto_bp.route('/holidays', methods=['GET'])
@jwt_required()
def get_holidays():
    """Get company holidays"""
    from services.pto_service import pto_service
    
    year = request.args.get('year', type=int)
    holidays = pto_service.get_holidays(year=year)
    
    return jsonify({'success': True, 'holidays': holidays})


@pto_bp.route('/year-end-carryover', methods=['POST'])
@jwt_required()
def process_carryover():
    """Process year-end balance carryover"""
    from services.pto_service import pto_service
    
    data = request.get_json()
    employee_id = data['employee_id']
    
    try:
        result = pto_service.process_year_end_carryover(employee_id)
        return jsonify({'success': True, 'result': result})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@pto_bp.route('/liability-report', methods=['GET'])
@jwt_required()
def get_liability_report():
    """Get PTO liability report"""
    from services.pto_service import pto_service
    
    report = pto_service.get_pto_liability_report()
    
    return jsonify({'success': True, 'report': report})
