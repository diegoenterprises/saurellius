"""
TAX FILING ROUTES
W-2, 1099, Form 940/941, tax deposits API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date

tax_filing_bp = Blueprint('tax_filing', __name__, url_prefix='/api/tax-filing')


@tax_filing_bp.route('/w2', methods=['GET'])
@jwt_required()
def get_w2_forms():
    """Get W-2 forms"""
    from services.tax_filing_service import tax_filing_service
    
    tax_year = request.args.get('tax_year', type=int)
    employee_id = request.args.get('employee_id')
    status = request.args.get('status')
    
    forms = tax_filing_service.get_w2_forms(
        tax_year=tax_year,
        employee_id=employee_id,
        status=status
    )
    
    return jsonify({'success': True, 'forms': forms})


@tax_filing_bp.route('/w2/generate', methods=['POST'])
@jwt_required()
def generate_w2():
    """Generate W-2 for an employee"""
    from services.tax_filing_service import tax_filing_service
    
    data = request.get_json()
    
    try:
        w2 = tax_filing_service.generate_w2(
            employee_id=data['employee_id'],
            tax_year=data.get('tax_year', date.today().year - 1),
            payroll_data=data['payroll_data']
        )
        return jsonify({'success': True, 'w2': w2}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@tax_filing_bp.route('/w3/generate', methods=['POST'])
@jwt_required()
def generate_w3():
    """Generate W-3 transmittal"""
    from services.tax_filing_service import tax_filing_service
    
    data = request.get_json()
    tax_year = data.get('tax_year', date.today().year - 1)
    
    try:
        w3 = tax_filing_service.generate_w3(tax_year)
        return jsonify({'success': True, 'w3': w3}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@tax_filing_bp.route('/filings', methods=['GET'])
@jwt_required()
def get_tax_filings():
    """Get tax filings"""
    from services.tax_filing_service import tax_filing_service
    
    tax_year = request.args.get('tax_year', type=int)
    form_type = request.args.get('form_type')
    status = request.args.get('status')
    
    filings = tax_filing_service.get_tax_filings(
        tax_year=tax_year,
        form_type=form_type,
        status=status
    )
    
    return jsonify({'success': True, 'filings': filings})


@tax_filing_bp.route('/941/generate', methods=['POST'])
@jwt_required()
def generate_941():
    """Generate Form 941"""
    from services.tax_filing_service import tax_filing_service
    
    data = request.get_json()
    
    try:
        form = tax_filing_service.generate_form_941(
            tax_year=data['tax_year'],
            quarter=data['quarter'],
            payroll_data=data['payroll_data']
        )
        return jsonify({'success': True, 'form': form}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@tax_filing_bp.route('/940/generate', methods=['POST'])
@jwt_required()
def generate_940():
    """Generate Form 940"""
    from services.tax_filing_service import tax_filing_service
    
    data = request.get_json()
    
    try:
        form = tax_filing_service.generate_form_940(
            tax_year=data['tax_year'],
            payroll_data=data['payroll_data']
        )
        return jsonify({'success': True, 'form': form}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@tax_filing_bp.route('/filings/<filing_id>/file', methods=['POST'])
@jwt_required()
def file_form(filing_id):
    """Mark form as filed"""
    from services.tax_filing_service import tax_filing_service
    
    try:
        filing = tax_filing_service.file_form(filing_id)
        return jsonify({'success': True, 'filing': filing})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@tax_filing_bp.route('/deposits', methods=['POST'])
@jwt_required()
def record_deposit():
    """Record a tax deposit"""
    from services.tax_filing_service import tax_filing_service
    from decimal import Decimal
    
    data = request.get_json()
    
    deposit = tax_filing_service.record_tax_deposit(
        deposit_type=data['deposit_type'],
        amount=Decimal(str(data['amount'])),
        deposit_date=date.fromisoformat(data['deposit_date']),
        period=data['period']
    )
    
    return jsonify({'success': True, 'deposit': deposit}), 201


@tax_filing_bp.route('/deposit-schedule', methods=['GET'])
@jwt_required()
def get_deposit_schedule():
    """Get deposit schedule based on lookback"""
    from services.tax_filing_service import tax_filing_service
    from decimal import Decimal
    
    lookback = request.args.get('lookback_liability', '0')
    
    schedule = tax_filing_service.get_deposit_schedule(Decimal(lookback))
    
    return jsonify({'success': True, 'schedule': schedule})


@tax_filing_bp.route('/next-deposit-date', methods=['GET'])
@jwt_required()
def get_next_deposit_date():
    """Get next deposit due date"""
    from services.tax_filing_service import tax_filing_service
    
    pay_date_str = request.args.get('pay_date', date.today().isoformat())
    pay_date = date.fromisoformat(pay_date_str)
    
    next_date = tax_filing_service.get_next_deposit_due_date(pay_date)
    
    return jsonify({'success': True, 'due_date': next_date.isoformat()})


@tax_filing_bp.route('/state-requirements/<state>', methods=['GET'])
@jwt_required()
def get_state_requirements(state):
    """Get state filing requirements"""
    from services.tax_filing_service import tax_filing_service
    
    requirements = tax_filing_service.get_state_filing_requirements(state)
    
    return jsonify({'success': True, 'requirements': requirements})


@tax_filing_bp.route('/quarterly-liability', methods=['POST'])
@jwt_required()
def calculate_quarterly_liability():
    """Calculate quarterly tax liability"""
    from services.tax_filing_service import tax_filing_service
    
    data = request.get_json()
    payroll_summaries = data.get('payroll_summaries', [])
    
    liability = tax_filing_service.calculate_quarterly_liability(payroll_summaries)
    
    return jsonify({'success': True, 'liability': liability})


@tax_filing_bp.route('/calendar/<int:year>', methods=['GET'])
@jwt_required()
def get_filing_calendar(year):
    """Get filing calendar for a year"""
    from services.tax_filing_service import tax_filing_service
    
    calendar = tax_filing_service.get_filing_calendar(year)
    
    return jsonify({'success': True, 'calendar': calendar})


@tax_filing_bp.route('/export', methods=['POST'])
@jwt_required()
def export_efile_data():
    """Export data for e-filing"""
    from services.tax_filing_service import tax_filing_service
    
    data = request.get_json()
    
    export = tax_filing_service.export_efile_data(
        form_type=data['form_type'],
        tax_year=data['tax_year']
    )
    
    return jsonify({'success': True, 'export': export})
