"""
GARNISHMENT ROUTES
Wage garnishments, child support, tax levies API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from decimal import Decimal

garnishment_bp = Blueprint('garnishments', __name__, url_prefix='/api/garnishments')


@garnishment_bp.route('', methods=['GET'])
@jwt_required()
def get_all_garnishments():
    """Get all garnishments"""
    from services.garnishment_service import garnishment_service
    
    employee_id = request.args.get('employee_id')
    status = request.args.get('status')
    
    if employee_id:
        garnishments = garnishment_service.get_employee_garnishments(employee_id, status=status)
    else:
        garnishments = []
        for emp_id in set(g['employee_id'] for g in garnishment_service.garnishments.values()):
            garnishments.extend(garnishment_service.get_employee_garnishments(emp_id, status=status))
    
    return jsonify({'success': True, 'garnishments': garnishments})


@garnishment_bp.route('', methods=['POST'])
@jwt_required()
def create_garnishment():
    """Create a new garnishment"""
    from services.garnishment_service import garnishment_service
    
    data = request.get_json()
    
    try:
        garnishment = garnishment_service.create_garnishment(
            employee_id=data['employee_id'],
            data=data
        )
        return jsonify({'success': True, 'garnishment': garnishment}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@garnishment_bp.route('/<garnishment_id>', methods=['GET'])
@jwt_required()
def get_garnishment(garnishment_id):
    """Get garnishment by ID"""
    from services.garnishment_service import garnishment_service
    
    garnishment = garnishment_service.get_garnishment(garnishment_id)
    if not garnishment:
        return jsonify({'success': False, 'message': 'Garnishment not found'}), 404
    
    return jsonify({'success': True, 'garnishment': garnishment})


@garnishment_bp.route('/<garnishment_id>', methods=['PUT'])
@jwt_required()
def update_garnishment(garnishment_id):
    """Update garnishment"""
    from services.garnishment_service import garnishment_service
    
    data = request.get_json()
    
    try:
        garnishment = garnishment_service.update_garnishment(garnishment_id, data)
        return jsonify({'success': True, 'garnishment': garnishment})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@garnishment_bp.route('/<garnishment_id>/terminate', methods=['POST'])
@jwt_required()
def terminate_garnishment(garnishment_id):
    """Terminate a garnishment"""
    from services.garnishment_service import garnishment_service
    
    data = request.get_json()
    reason = data.get('reason', 'Terminated by user')
    
    try:
        garnishment = garnishment_service.terminate_garnishment(garnishment_id, reason)
        return jsonify({'success': True, 'garnishment': garnishment})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@garnishment_bp.route('/calculate', methods=['POST'])
@jwt_required()
def calculate_garnishment():
    """Calculate garnishment amounts for payroll"""
    from services.garnishment_service import garnishment_service
    
    data = request.get_json()
    
    result = garnishment_service.calculate_garnishment_amount(
        employee_id=data['employee_id'],
        gross_pay=Decimal(str(data['gross_pay'])),
        disposable_earnings=Decimal(str(data['disposable_earnings'])),
        pay_period_hours=data.get('pay_period_hours', 40)
    )
    
    return jsonify({'success': True, 'calculation': result})


@garnishment_bp.route('/deductions', methods=['POST'])
@jwt_required()
def record_deduction():
    """Record a garnishment deduction"""
    from services.garnishment_service import garnishment_service
    
    data = request.get_json()
    
    try:
        deduction = garnishment_service.record_deduction(
            garnishment_id=data['garnishment_id'],
            amount=Decimal(str(data['amount'])),
            pay_date=date.fromisoformat(data['pay_date']),
            payroll_id=data['payroll_id']
        )
        return jsonify({'success': True, 'deduction': deduction}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@garnishment_bp.route('/deductions/history', methods=['GET'])
@jwt_required()
def get_deduction_history():
    """Get deduction history"""
    from services.garnishment_service import garnishment_service
    
    employee_id = request.args.get('employee_id')
    garnishment_id = request.args.get('garnishment_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    history = garnishment_service.get_deduction_history(
        employee_id=employee_id,
        garnishment_id=garnishment_id,
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None
    )
    
    return jsonify({'success': True, 'history': history})


@garnishment_bp.route('/remittances/pending', methods=['GET'])
@jwt_required()
def get_pending_remittances():
    """Get pending remittances"""
    from services.garnishment_service import garnishment_service
    
    pending = garnishment_service.get_pending_remittances()
    
    return jsonify({'success': True, 'pending': pending})


@garnishment_bp.route('/remittances', methods=['POST'])
@jwt_required()
def record_remittance():
    """Record remittance of garnishment funds"""
    from services.garnishment_service import garnishment_service
    
    data = request.get_json()
    
    try:
        remittance = garnishment_service.record_remittance(
            deduction_ids=data['deduction_ids'],
            remittance_date=date.fromisoformat(data['remittance_date']),
            payment_method=data['payment_method'],
            confirmation=data.get('confirmation_number')
        )
        return jsonify({'success': True, 'remittance': remittance}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@garnishment_bp.route('/employee/<employee_id>/summary', methods=['GET'])
@jwt_required()
def get_employee_summary(employee_id):
    """Get garnishment summary for an employee"""
    from services.garnishment_service import garnishment_service
    
    summary = garnishment_service.get_garnishment_summary(employee_id)
    
    return jsonify({'success': True, 'summary': summary})
