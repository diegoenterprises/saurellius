"""
PAYROLL RUN ROUTES
Payroll processing, calculations, and paychecks API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date

payroll_run_bp = Blueprint('payroll_runs', __name__, url_prefix='/api/payroll-runs')


@payroll_run_bp.route('', methods=['GET'])
@jwt_required()
def get_payroll_runs():
    """Get all payroll runs"""
    from services.payroll_run_service import payroll_run_service
    
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    runs = payroll_run_service.get_payroll_runs(
        status=status,
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None
    )
    
    return jsonify({'success': True, 'payroll_runs': runs})


@payroll_run_bp.route('', methods=['POST'])
@jwt_required()
def create_payroll_run():
    """Create a new payroll run"""
    from services.payroll_run_service import payroll_run_service
    
    data = request.get_json()
    data['created_by'] = get_jwt_identity()
    
    try:
        run = payroll_run_service.create_payroll_run(data)
        return jsonify({'success': True, 'payroll_run': run}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@payroll_run_bp.route('/<run_id>', methods=['GET'])
@jwt_required()
def get_payroll_run(run_id):
    """Get payroll run by ID"""
    from services.payroll_run_service import payroll_run_service
    
    run = payroll_run_service.get_payroll_run(run_id)
    if not run:
        return jsonify({'success': False, 'message': 'Payroll run not found'}), 404
    
    return jsonify({'success': True, 'payroll_run': run})


@payroll_run_bp.route('/<run_id>/employees', methods=['POST'])
@jwt_required()
def add_employee_to_payroll(run_id):
    """Add an employee to the payroll run"""
    from services.payroll_run_service import payroll_run_service
    
    data = request.get_json()
    
    try:
        paycheck = payroll_run_service.add_employee_to_payroll(run_id, data)
        return jsonify({'success': True, 'paycheck': paycheck}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@payroll_run_bp.route('/<run_id>/employees/batch', methods=['POST'])
@jwt_required()
def add_employees_batch(run_id):
    """Add multiple employees to payroll"""
    from services.payroll_run_service import payroll_run_service
    
    data = request.get_json()
    employees = data.get('employees', [])
    
    results = {'success': [], 'errors': []}
    
    for employee_data in employees:
        try:
            paycheck = payroll_run_service.add_employee_to_payroll(run_id, employee_data)
            results['success'].append({
                'employee_id': employee_data['employee_id'],
                'paycheck_id': paycheck['id']
            })
        except ValueError as e:
            results['errors'].append({
                'employee_id': employee_data.get('employee_id'),
                'error': str(e)
            })
    
    return jsonify({
        'success': True,
        'results': results,
        'total_added': len(results['success']),
        'total_errors': len(results['errors'])
    })


@payroll_run_bp.route('/<run_id>/paychecks', methods=['GET'])
@jwt_required()
def get_paychecks(run_id):
    """Get all paychecks for a payroll run"""
    from services.payroll_run_service import payroll_run_service
    
    paychecks = payroll_run_service.get_paychecks_for_run(run_id)
    
    return jsonify({'success': True, 'paychecks': paychecks})


@payroll_run_bp.route('/<run_id>/submit', methods=['POST'])
@jwt_required()
def submit_for_approval(run_id):
    """Submit payroll for approval"""
    from services.payroll_run_service import payroll_run_service
    
    try:
        run = payroll_run_service.submit_for_approval(run_id)
        return jsonify({'success': True, 'payroll_run': run})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@payroll_run_bp.route('/<run_id>/approve', methods=['POST'])
@jwt_required()
def approve_payroll(run_id):
    """Approve payroll for processing"""
    from services.payroll_run_service import payroll_run_service
    
    approver_id = get_jwt_identity()
    
    try:
        run = payroll_run_service.approve_payroll(run_id, approver_id)
        return jsonify({'success': True, 'payroll_run': run})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@payroll_run_bp.route('/<run_id>/process', methods=['POST'])
@jwt_required()
def process_payroll(run_id):
    """Process approved payroll"""
    from services.payroll_run_service import payroll_run_service
    
    try:
        run = payroll_run_service.process_payroll(run_id)
        return jsonify({'success': True, 'payroll_run': run})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@payroll_run_bp.route('/<run_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_payroll(run_id):
    """Cancel a payroll run"""
    from services.payroll_run_service import payroll_run_service
    
    data = request.get_json()
    reason = data.get('reason', 'Cancelled by user')
    
    try:
        run = payroll_run_service.cancel_payroll(run_id, reason)
        return jsonify({'success': True, 'payroll_run': run})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@payroll_run_bp.route('/calculate-preview', methods=['POST'])
@jwt_required()
def calculate_preview():
    """Calculate payroll preview without creating run"""
    from services.payroll_run_service import payroll_run_service
    from decimal import Decimal
    
    data = request.get_json()
    
    # Mock payroll run for calculations
    mock_run = {
        'pay_frequency': data.get('pay_frequency', 'biweekly'),
        'pay_period_start': data.get('pay_period_start'),
        'pay_period_end': data.get('pay_period_end'),
        'pay_date': data.get('pay_date')
    }
    
    # Calculate for single employee
    employee_data = data.get('employee', {})
    
    earnings = payroll_run_service._calculate_earnings(employee_data, mock_run['pay_frequency'])
    taxes = payroll_run_service._calculate_taxes(employee_data, earnings['total'], mock_run)
    deductions = payroll_run_service._calculate_deductions(employee_data, earnings['total'])
    employer_taxes = payroll_run_service._calculate_employer_taxes(employee_data, earnings['total'])
    
    total_taxes = sum(Decimal(str(v)) for v in taxes.values())
    total_deductions = sum(Decimal(str(v)) for v in deductions.values())
    net_pay = earnings['total'] - total_taxes - total_deductions
    
    return jsonify({
        'success': True,
        'preview': {
            'gross_pay': float(earnings['total']),
            'earnings_breakdown': {k: float(v) for k, v in earnings.items()},
            'taxes': {k: float(v) for k, v in taxes.items()},
            'total_taxes': float(total_taxes),
            'deductions': {k: float(v) for k, v in deductions.items()},
            'total_deductions': float(total_deductions),
            'net_pay': float(net_pay),
            'employer_taxes': {k: float(v) for k, v in employer_taxes.items()},
            'total_employer_cost': float(earnings['total'] + sum(Decimal(str(v)) for v in employer_taxes.values()))
        }
    })


@payroll_run_bp.route('/upcoming-deadlines', methods=['GET'])
@jwt_required()
def get_upcoming_deadlines():
    """Get upcoming payroll deadlines"""
    today = date.today()
    
    # Calculate common payroll dates
    deadlines = []
    
    # Next Friday (common pay date)
    days_until_friday = (4 - today.weekday()) % 7
    if days_until_friday == 0:
        days_until_friday = 7
    next_friday = today + __import__('datetime').timedelta(days=days_until_friday)
    
    deadlines.append({
        'type': 'pay_date',
        'date': next_friday.isoformat(),
        'description': 'Next weekly/bi-weekly pay date'
    })
    
    # 15th and last day (semi-monthly)
    if today.day < 15:
        deadlines.append({
            'type': 'semi_monthly',
            'date': date(today.year, today.month, 15).isoformat(),
            'description': 'Semi-monthly pay date (15th)'
        })
    
    # Tax deposit deadline
    if today.day < 15:
        deadlines.append({
            'type': 'tax_deposit',
            'date': date(today.year, today.month, 15).isoformat(),
            'description': 'Monthly tax deposit deadline'
        })
    
    return jsonify({
        'success': True,
        'deadlines': sorted(deadlines, key=lambda x: x['date'])
    })
