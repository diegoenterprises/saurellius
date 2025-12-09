"""
CONTRACTOR ROUTES
1099 Contractors, Payments, and Tax Forms API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date

contractor_bp = Blueprint('contractors', __name__, url_prefix='/api/contractors')


@contractor_bp.route('', methods=['GET'])
@jwt_required()
def get_contractors():
    """Get all contractors"""
    from services.contractor_service import contractor_service
    
    status = request.args.get('status')
    contractors = contractor_service.get_all_contractors(status=status)
    
    return jsonify({'success': True, 'contractors': contractors})


@contractor_bp.route('', methods=['POST'])
@jwt_required()
def create_contractor():
    """Create a new contractor"""
    from services.contractor_service import contractor_service
    
    data = request.get_json()
    
    try:
        contractor = contractor_service.create_contractor(data)
        return jsonify({'success': True, 'contractor': contractor}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@contractor_bp.route('/<contractor_id>', methods=['GET'])
@jwt_required()
def get_contractor(contractor_id):
    """Get contractor by ID"""
    from services.contractor_service import contractor_service
    
    contractor = contractor_service.get_contractor(contractor_id)
    if not contractor:
        return jsonify({'success': False, 'message': 'Contractor not found'}), 404
    
    return jsonify({'success': True, 'contractor': contractor})


@contractor_bp.route('/<contractor_id>', methods=['PUT'])
@jwt_required()
def update_contractor(contractor_id):
    """Update contractor"""
    from services.contractor_service import contractor_service
    
    data = request.get_json()
    
    try:
        contractor = contractor_service.update_contractor(contractor_id, data)
        return jsonify({'success': True, 'contractor': contractor})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@contractor_bp.route('/<contractor_id>/payments', methods=['GET'])
@jwt_required()
def get_contractor_payments(contractor_id):
    """Get payments for a contractor"""
    from services.contractor_service import contractor_service
    
    year = request.args.get('year', type=int)
    payments = contractor_service.get_contractor_payments(contractor_id, year=year)
    
    return jsonify({'success': True, 'payments': payments})


@contractor_bp.route('/<contractor_id>/payments', methods=['POST'])
@jwt_required()
def create_payment(contractor_id):
    """Create payment to contractor"""
    from services.contractor_service import contractor_service
    
    data = request.get_json()
    
    try:
        payment = contractor_service.create_payment(contractor_id, data)
        return jsonify({'success': True, 'payment': payment}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@contractor_bp.route('/<contractor_id>/ytd-summary', methods=['GET'])
@jwt_required()
def get_contractor_ytd(contractor_id):
    """Get YTD summary for contractor"""
    from services.contractor_service import contractor_service
    
    year = request.args.get('year', date.today().year, type=int)
    
    try:
        summary = contractor_service.get_contractor_ytd_summary(contractor_id, year)
        return jsonify({'success': True, 'summary': summary})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@contractor_bp.route('/payments', methods=['GET'])
@jwt_required()
def get_all_payments():
    """Get all contractor payments"""
    from services.contractor_service import contractor_service
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')
    
    payments = contractor_service.get_all_payments(
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        status=status
    )
    
    return jsonify({'success': True, 'payments': payments})


@contractor_bp.route('/payments/<payment_id>/process', methods=['POST'])
@jwt_required()
def process_payment(payment_id):
    """Process a payment"""
    from services.contractor_service import contractor_service
    
    try:
        payment = contractor_service.process_payment(payment_id)
        return jsonify({'success': True, 'payment': payment})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@contractor_bp.route('/payments/<payment_id>/paid', methods=['POST'])
@jwt_required()
def mark_payment_paid(payment_id):
    """Mark payment as paid"""
    from services.contractor_service import contractor_service
    
    data = request.get_json() or {}
    
    try:
        payment = contractor_service.mark_payment_paid(
            payment_id, 
            transaction_id=data.get('transaction_id')
        )
        return jsonify({'success': True, 'payment': payment})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


# 1099 Routes
@contractor_bp.route('/1099', methods=['GET'])
@jwt_required()
def get_1099_forms():
    """Get all 1099 forms"""
    from services.contractor_service import contractor_service
    
    tax_year = request.args.get('tax_year', type=int)
    contractor_id = request.args.get('contractor_id')
    
    forms = contractor_service.get_1099_forms(
        tax_year=tax_year,
        contractor_id=contractor_id
    )
    
    return jsonify({'success': True, 'forms': forms})


@contractor_bp.route('/1099/generate', methods=['POST'])
@jwt_required()
def generate_1099():
    """Generate 1099 for a contractor"""
    from services.contractor_service import contractor_service
    
    data = request.get_json()
    contractor_id = data.get('contractor_id')
    tax_year = data.get('tax_year', date.today().year - 1)
    
    try:
        form = contractor_service.generate_1099_nec(contractor_id, tax_year)
        if form:
            return jsonify({'success': True, 'form': form}), 201
        else:
            return jsonify({
                'success': True, 
                'message': 'Below $600 threshold - no 1099 required'
            })
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@contractor_bp.route('/1099/generate-all', methods=['POST'])
@jwt_required()
def generate_all_1099s():
    """Generate all 1099s for a tax year"""
    from services.contractor_service import contractor_service
    
    data = request.get_json()
    tax_year = data.get('tax_year', date.today().year - 1)
    
    results = contractor_service.generate_all_1099s(tax_year)
    
    return jsonify({'success': True, 'results': results})


@contractor_bp.route('/1099/<form_id>/file', methods=['POST'])
@jwt_required()
def file_1099(form_id):
    """Mark 1099 as filed"""
    from services.contractor_service import contractor_service
    
    try:
        form = contractor_service.file_1099(form_id)
        return jsonify({'success': True, 'form': form})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@contractor_bp.route('/summary/<int:year>', methods=['GET'])
@jwt_required()
def get_company_summary(year):
    """Get company contractor summary for a year"""
    from services.contractor_service import contractor_service
    
    summary = contractor_service.get_company_contractor_summary(year)
    
    return jsonify({'success': True, 'summary': summary})


@contractor_bp.route('/w9/validate', methods=['POST'])
@jwt_required()
def validate_w9():
    """Validate W-9 data"""
    from services.contractor_service import contractor_service
    
    data = request.get_json()
    result = contractor_service.validate_w9_data(data)
    
    return jsonify({'success': True, 'validation': result})
