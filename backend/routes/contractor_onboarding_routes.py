"""
CONTRACTOR ONBOARDING ROUTES
1099 contractor registration API with W-9 compliance
Automated 1099-NEC tracking and generation
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.contractor_onboarding_service import contractor_onboarding_service

contractor_onboarding_bp = Blueprint('contractor_onboarding', __name__, url_prefix='/api/contractor-onboarding')


# ============================================================================
# ONBOARDING WORKFLOW
# ============================================================================

@contractor_onboarding_bp.route('/start', methods=['POST'])
@jwt_required()
def start_onboarding():
    """Start new contractor onboarding."""
    data = request.get_json()
    company_id = data.get('company_id')
    
    if not company_id:
        return jsonify({'success': False, 'message': 'Company ID is required'}), 400
    
    contractor = contractor_onboarding_service.create_contractor(company_id, data)
    
    return jsonify({
        'success': True,
        'contractor': contractor,
        'message': 'Contractor onboarding started.',
        'steps': [
            {'step': 1, 'name': 'Contractor Information', 'description': 'Basic contact and business information'},
            {'step': 2, 'name': 'W-9 Form', 'description': 'IRS Form W-9 for tax identification'},
            {'step': 3, 'name': 'Payment Setup', 'description': 'Bank account and payment preferences'}
        ]
    }), 201


@contractor_onboarding_bp.route('/<contractor_id>', methods=['GET'])
@jwt_required()
def get_contractor(contractor_id):
    """Get contractor details."""
    contractor = contractor_onboarding_service.get_contractor(contractor_id)
    
    if not contractor:
        return jsonify({'success': False, 'message': 'Contractor not found'}), 404
    
    return jsonify({'success': True, 'contractor': contractor})


@contractor_onboarding_bp.route('/<contractor_id>/step/<int:step>', methods=['POST'])
@jwt_required()
def submit_step(contractor_id, step):
    """Submit data for a contractor onboarding step."""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    result = contractor_onboarding_service.submit_step(contractor_id, step, data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@contractor_onboarding_bp.route('/company/<company_id>', methods=['GET'])
@jwt_required()
def get_company_contractors(company_id):
    """Get all contractors for a company."""
    status = request.args.get('status')
    
    contractors = contractor_onboarding_service.get_company_contractors(company_id, status)
    
    return jsonify({
        'success': True,
        'contractors': contractors,
        'count': len(contractors)
    })


@contractor_onboarding_bp.route('/<contractor_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_contractor(contractor_id):
    """Deactivate a contractor."""
    data = request.get_json() or {}
    reason = data.get('reason', '')
    
    result = contractor_onboarding_service.deactivate_contractor(contractor_id, reason)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# W-9 FORM
# ============================================================================

@contractor_onboarding_bp.route('/w9/tax-classifications', methods=['GET'])
def get_tax_classifications():
    """Get W-9 tax classification options."""
    return jsonify({
        'success': True,
        'tax_classifications': contractor_onboarding_service.TAX_CLASSIFICATIONS
    })


@contractor_onboarding_bp.route('/w9/exempt-payee-codes', methods=['GET'])
def get_exempt_payee_codes():
    """Get exempt payee codes for W-9."""
    return jsonify({
        'success': True,
        'exempt_payee_codes': contractor_onboarding_service.EXEMPT_PAYEE_CODES
    })


@contractor_onboarding_bp.route('/w9/fatca-codes', methods=['GET'])
def get_fatca_codes():
    """Get FATCA exemption codes for W-9."""
    return jsonify({
        'success': True,
        'fatca_exemption_codes': contractor_onboarding_service.FATCA_EXEMPTION_CODES
    })


@contractor_onboarding_bp.route('/validate/w9', methods=['POST'])
@jwt_required()
def validate_w9():
    """Validate W-9 form data."""
    data = request.get_json()
    
    valid, errors = contractor_onboarding_service.validate_w9(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


@contractor_onboarding_bp.route('/validate/tin', methods=['POST'])
@jwt_required()
def validate_tin():
    """Validate TIN (SSN or EIN)."""
    data = request.get_json()
    tin = data.get('tin', '')
    tin_type = data.get('tin_type', 'ssn')
    
    valid, message = contractor_onboarding_service.validate_tin(tin, tin_type)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'message': message
    })


# ============================================================================
# PAYMENT TRACKING
# ============================================================================

@contractor_onboarding_bp.route('/<contractor_id>/payment', methods=['POST'])
@jwt_required()
def record_payment(contractor_id):
    """Record a payment to contractor."""
    data = request.get_json()
    amount = data.get('amount')
    description = data.get('description', '')
    
    if not amount:
        return jsonify({'success': False, 'message': 'Amount is required'}), 400
    
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid amount'}), 400
    
    result = contractor_onboarding_service.record_payment(contractor_id, amount, description)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@contractor_onboarding_bp.route('/<contractor_id>/payments', methods=['GET'])
@jwt_required()
def get_payments(contractor_id):
    """Get payment history for contractor."""
    contractor = contractor_onboarding_service.get_contractor(contractor_id)
    
    if not contractor:
        return jsonify({'success': False, 'message': 'Contractor not found'}), 404
    
    return jsonify({
        'success': True,
        'payments': contractor.get('payments', []),
        'ytd_payments': contractor.get('ytd_payments', 0),
        'requires_1099': contractor.get('requires_1099', False)
    })


# ============================================================================
# 1099 TRACKING
# ============================================================================

@contractor_onboarding_bp.route('/<contractor_id>/1099-status', methods=['GET'])
@jwt_required()
def get_1099_status(contractor_id):
    """Check 1099 reporting status for contractor."""
    status = contractor_onboarding_service.check_1099_threshold(contractor_id)
    
    if 'error' in status:
        return jsonify({'success': False, 'message': status['error']}), 404
    
    return jsonify({
        'success': True,
        'status': status
    })


@contractor_onboarding_bp.route('/company/<company_id>/1099-summary', methods=['GET'])
@jwt_required()
def get_1099_summary(company_id):
    """Get 1099 summary for all contractors."""
    tax_year = request.args.get('year', type=int) or 2024
    
    summary = contractor_onboarding_service.get_1099_summary(company_id, tax_year)
    
    return jsonify({
        'success': True,
        'summary': summary
    })


@contractor_onboarding_bp.route('/<contractor_id>/backup-withholding', methods=['GET'])
@jwt_required()
def get_backup_withholding_status(contractor_id):
    """Check if backup withholding is required."""
    status = contractor_onboarding_service.determine_backup_withholding(contractor_id)
    
    if 'error' in status:
        return jsonify({'success': False, 'message': status['error']}), 404
    
    return jsonify({
        'success': True,
        'status': status
    })


# ============================================================================
# VALIDATION
# ============================================================================

@contractor_onboarding_bp.route('/validate/contractor-info', methods=['POST'])
@jwt_required()
def validate_contractor_info():
    """Validate contractor information."""
    data = request.get_json()
    
    valid, errors = contractor_onboarding_service.validate_contractor_info(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


@contractor_onboarding_bp.route('/validate/payment-info', methods=['POST'])
@jwt_required()
def validate_payment_info():
    """Validate payment information."""
    data = request.get_json()
    
    valid, errors = contractor_onboarding_service.validate_payment_info(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })
