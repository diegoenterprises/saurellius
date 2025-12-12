"""
CONTRACTOR SELF-SERVICE ROUTES
Complete API for contractor registration, onboarding, and portal
Zero-touch contractor administration with full IRS compliance
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from datetime import datetime
from services.contractor_self_service import contractor_self_service

contractor_ss_bp = Blueprint('contractor_self_service', __name__, url_prefix='/api/contractor')


# ============================================================================
# REGISTRATION - SELF-SERVICE
# ============================================================================

@contractor_ss_bp.route('/register', methods=['POST'])
def self_service_register():
    """Self-service contractor registration."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    result = contractor_self_service.self_service_register(data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


@contractor_ss_bp.route('/verify/email', methods=['POST'])
def verify_email():
    """Verify email with code."""
    data = request.get_json()
    contractor_id = data.get('contractor_id')
    code = data.get('code')
    
    if not contractor_id or not code:
        return jsonify({'success': False, 'error': 'Contractor ID and code required'}), 400
    
    result = contractor_self_service.verify_email(contractor_id, code)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@contractor_ss_bp.route('/verify/phone', methods=['POST'])
def verify_phone():
    """Verify phone with SMS code."""
    data = request.get_json()
    contractor_id = data.get('contractor_id')
    code = data.get('code')
    
    if not contractor_id or not code:
        return jsonify({'success': False, 'error': 'Contractor ID and code required'}), 400
    
    result = contractor_self_service.verify_phone(contractor_id, code)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# REGISTRATION - CLIENT INVITATION
# ============================================================================

@contractor_ss_bp.route('/invitation/<token>', methods=['GET'])
def get_invitation(token):
    """Get invitation details."""
    invitation = None
    for inv in contractor_self_service.invitations.values():
        if inv.get('token') == token:
            invitation = inv
            break
    
    if not invitation:
        return jsonify({'success': False, 'error': 'Invalid invitation'}), 404
    
    return jsonify({
        'success': True,
        'invitation': {
            'client_id': invitation['client_id'],
            'contractor_email': invitation['contractor_email'],
            'contractor_name': invitation.get('contractor_name', ''),
            'start_date': invitation.get('start_date'),
            'project_description': invitation.get('project_description'),
            'personal_message': invitation.get('personal_message'),
            'expires_at': invitation['expires_at']
        }
    })


@contractor_ss_bp.route('/invitation/accept', methods=['POST'])
def accept_invitation():
    """Accept client invitation."""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'success': False, 'error': 'Invitation token required'}), 400
    
    result = contractor_self_service.accept_invitation(token, data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@contractor_ss_bp.route('/invitation', methods=['POST'])
@jwt_required()
def create_invitation():
    """Create invitation for contractor (client action)."""
    client_id = get_jwt_identity()
    data = request.get_json()
    
    result = contractor_self_service.create_client_invitation(client_id, data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


# ============================================================================
# CLIENT SEARCH & CONNECTION
# ============================================================================

@contractor_ss_bp.route('/clients/search', methods=['GET'])
@jwt_required()
def search_clients():
    """Search for clients."""
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify({'success': False, 'error': 'Search query too short'}), 400
    
    results = contractor_self_service.search_clients(query)
    return jsonify({'success': True, 'clients': results})


@contractor_ss_bp.route('/clients/join', methods=['POST'])
@jwt_required()
def request_to_join():
    """Request to join a client."""
    contractor_id = get_jwt_identity()
    data = request.get_json()
    
    client_id = data.get('client_id')
    message = data.get('message', '')
    
    if not client_id:
        return jsonify({'success': False, 'error': 'Client ID required'}), 400
    
    result = contractor_self_service.request_to_join_client(contractor_id, client_id, message)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# ONBOARDING - W-9 FORM
# ============================================================================

@contractor_ss_bp.route('/w9', methods=['POST'])
@jwt_required()
def submit_w9():
    """Submit W-9 form."""
    contractor_id = get_jwt_identity()
    data = request.get_json()
    data['ip_address'] = request.remote_addr
    
    result = contractor_self_service.submit_w9(contractor_id, data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@contractor_ss_bp.route('/w9', methods=['GET'])
@jwt_required()
def get_w9():
    """Get W-9 form data (masked)."""
    contractor_id = get_jwt_identity()
    
    w9 = contractor_self_service.get_w9(contractor_id)
    if 'error' in w9:
        return jsonify({'success': False, 'error': w9['error']}), 404
    
    return jsonify({'success': True, 'w9': w9})


@contractor_ss_bp.route('/w9/tax-classifications', methods=['GET'])
def get_tax_classifications():
    """Get W-9 tax classification options."""
    return jsonify({
        'success': True,
        'classifications': [
            {'value': 'individual', 'label': 'Individual/sole proprietor or single-member LLC'},
            {'value': 'c_corp', 'label': 'C Corporation'},
            {'value': 's_corp', 'label': 'S Corporation'},
            {'value': 'partnership', 'label': 'Partnership'},
            {'value': 'trust_estate', 'label': 'Trust/estate'},
            {'value': 'llc_c', 'label': 'Limited liability company - C Corporation'},
            {'value': 'llc_s', 'label': 'Limited liability company - S Corporation'},
            {'value': 'llc_p', 'label': 'Limited liability company - Partnership'}
        ]
    })


# ============================================================================
# ONBOARDING - PAYMENT METHODS
# ============================================================================

@contractor_ss_bp.route('/payment-method', methods=['POST'])
@jwt_required()
def setup_payment_method():
    """Set up payment method."""
    contractor_id = get_jwt_identity()
    data = request.get_json()
    
    result = contractor_self_service.setup_payment_method(contractor_id, data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@contractor_ss_bp.route('/payment-method', methods=['GET'])
@jwt_required()
def get_payment_method():
    """Get current payment method."""
    contractor_id = get_jwt_identity()
    contractor = contractor_self_service.contractors.get(contractor_id)
    
    if not contractor:
        return jsonify({'success': False, 'error': 'Contractor not found'}), 404
    
    payment = contractor.get('payment_method', {})
    # Mask sensitive data
    safe_payment = {
        'method': payment.get('method'),
        'bank_name': payment.get('bank_name'),
        'account_type': payment.get('account_type'),
        'account_last_four': payment.get('account_last_four'),
        'routing_number': payment.get('routing_number'),
        'created_at': payment.get('created_at')
    }
    
    return jsonify({'success': True, 'payment_method': safe_payment})


# ============================================================================
# ONBOARDING STATUS
# ============================================================================

@contractor_ss_bp.route('/onboarding/status', methods=['GET'])
@jwt_required()
def get_onboarding_status():
    """Get onboarding status."""
    contractor_id = get_jwt_identity()
    
    status = contractor_self_service.get_onboarding_status(contractor_id)
    if 'error' in status:
        return jsonify({'success': False, 'error': status['error']}), 404
    
    return jsonify({'success': True, 'status': status})


@contractor_ss_bp.route('/onboarding/sections', methods=['GET'])
def get_onboarding_sections():
    """Get list of onboarding sections."""
    return jsonify({
        'success': True,
        'sections': [
            {'number': num, **info}
            for num, info in contractor_self_service.ONBOARDING_SECTIONS.items()
        ]
    })


# ============================================================================
# INVOICING
# ============================================================================

@contractor_ss_bp.route('/invoices', methods=['POST'])
@jwt_required()
def create_invoice():
    """Create a new invoice."""
    contractor_id = get_jwt_identity()
    data = request.get_json()
    
    result = contractor_self_service.create_invoice(contractor_id, data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


@contractor_ss_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    """Get contractor's invoices."""
    contractor_id = get_jwt_identity()
    status = request.args.get('status')
    
    invoices = contractor_self_service.get_invoices(contractor_id, status)
    return jsonify({'success': True, 'invoices': invoices})


@contractor_ss_bp.route('/invoices/<invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    """Get specific invoice."""
    contractor_id = get_jwt_identity()
    
    invoice = contractor_self_service.invoices.get(invoice_id)
    if not invoice or invoice['contractor_id'] != contractor_id:
        return jsonify({'success': False, 'error': 'Invoice not found'}), 404
    
    return jsonify({'success': True, 'invoice': invoice})


@contractor_ss_bp.route('/invoices/<invoice_id>/send', methods=['POST'])
@jwt_required()
def send_invoice(invoice_id):
    """Send invoice to client."""
    contractor_id = get_jwt_identity()
    
    result = contractor_self_service.send_invoice(contractor_id, invoice_id)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@contractor_ss_bp.route('/invoices/<invoice_id>/payment', methods=['POST'])
@jwt_required()
def record_payment(invoice_id):
    """Record payment for invoice."""
    contractor_id = get_jwt_identity()
    data = request.get_json()
    
    result = contractor_self_service.record_payment(contractor_id, invoice_id, data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# EXPENSES
# ============================================================================

@contractor_ss_bp.route('/expenses', methods=['POST'])
@jwt_required()
def add_expense():
    """Add a business expense."""
    contractor_id = get_jwt_identity()
    data = request.get_json()
    
    result = contractor_self_service.add_expense(contractor_id, data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


@contractor_ss_bp.route('/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    """Get expenses with summary."""
    contractor_id = get_jwt_identity()
    year = request.args.get('year', type=int)
    category = request.args.get('category')
    
    result = contractor_self_service.get_expenses(contractor_id, year, category)
    return jsonify({'success': True, **result})


@contractor_ss_bp.route('/expenses/categories', methods=['GET'])
def get_expense_categories():
    """Get expense category options."""
    return jsonify({
        'success': True,
        'categories': [
            {'value': 'home_office', 'label': 'Home Office'},
            {'value': 'vehicle', 'label': 'Vehicle/Transportation'},
            {'value': 'equipment', 'label': 'Equipment & Supplies'},
            {'value': 'software', 'label': 'Software & Subscriptions'},
            {'value': 'professional_services', 'label': 'Professional Services'},
            {'value': 'insurance', 'label': 'Business Insurance'},
            {'value': 'education', 'label': 'Education & Training'},
            {'value': 'travel', 'label': 'Travel'},
            {'value': 'meals', 'label': 'Meals (50% deductible)'},
            {'value': 'marketing', 'label': 'Marketing & Advertising'},
            {'value': 'subcontractors', 'label': 'Subcontractor Payments'},
            {'value': 'phone_internet', 'label': 'Phone & Internet'},
            {'value': 'other', 'label': 'Other'}
        ]
    })


# ============================================================================
# MILEAGE TRACKING
# ============================================================================

@contractor_ss_bp.route('/mileage', methods=['POST'])
@jwt_required()
def log_mileage():
    """Log business mileage."""
    contractor_id = get_jwt_identity()
    data = request.get_json()
    
    result = contractor_self_service.log_mileage(contractor_id, data)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


@contractor_ss_bp.route('/mileage', methods=['GET'])
@jwt_required()
def get_mileage():
    """Get mileage summary."""
    contractor_id = get_jwt_identity()
    year = request.args.get('year', type=int)
    
    result = contractor_self_service.get_mileage_summary(contractor_id, year)
    return jsonify({'success': True, **result})


@contractor_ss_bp.route('/mileage/rate', methods=['GET'])
def get_mileage_rate():
    """Get current IRS mileage rate."""
    return jsonify({
        'success': True,
        'rate': float(contractor_self_service.IRS_MILEAGE_RATE),
        'year': datetime.utcnow().year,
        'description': 'IRS standard mileage rate for business use of vehicle'
    })


# ============================================================================
# 1099-NEC
# ============================================================================

@contractor_ss_bp.route('/1099/eligibility', methods=['GET'])
@jwt_required()
def check_1099_eligibility():
    """Check 1099-NEC eligibility."""
    contractor_id = get_jwt_identity()
    year = request.args.get('year', default=datetime.utcnow().year, type=int)
    
    result = contractor_self_service.check_1099_eligibility(contractor_id, year)
    return jsonify({'success': True, **result})


@contractor_ss_bp.route('/1099', methods=['GET'])
@jwt_required()
def get_1099_forms():
    """Get contractor's 1099 forms."""
    contractor_id = get_jwt_identity()
    year = request.args.get('year', type=int)
    
    forms = contractor_self_service.get_1099_forms(contractor_id, year)
    return jsonify({'success': True, 'forms': forms})


@contractor_ss_bp.route('/1099/generate', methods=['POST'])
@jwt_required()
def generate_1099():
    """Generate 1099-NEC (client action)."""
    client_id = get_jwt_identity()
    data = request.get_json()
    
    contractor_id = data.get('contractor_id')
    year = data.get('year', datetime.utcnow().year - 1)
    
    if not contractor_id:
        return jsonify({'success': False, 'error': 'Contractor ID required'}), 400
    
    result = contractor_self_service.generate_1099_nec(contractor_id, year, client_id)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@contractor_ss_bp.route('/1099/file', methods=['POST'])
@jwt_required()
def file_1099_to_irs():
    """File all 1099-NEC forms to IRS FIRE system."""
    client_id = get_jwt_identity()
    data = request.get_json()
    
    year = data.get('year', datetime.utcnow().year - 1)
    
    result = contractor_self_service.file_1099_to_irs(client_id, year)
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# TAX CENTER
# ============================================================================

@contractor_ss_bp.route('/tax/estimated', methods=['GET'])
@jwt_required()
def get_estimated_taxes():
    """Get estimated quarterly taxes."""
    contractor_id = get_jwt_identity()
    year = request.args.get('year', default=datetime.utcnow().year, type=int)
    
    result = contractor_self_service.calculate_estimated_taxes(contractor_id, year)
    return jsonify({'success': True, **result})


@contractor_ss_bp.route('/tax/deadlines', methods=['GET'])
def get_tax_deadlines():
    """Get tax deadline information."""
    year = datetime.utcnow().year
    return jsonify({
        'success': True,
        'quarterly_deadlines': [
            {'quarter': 'Q1', 'period': 'Jan 1 - Mar 31', 'due_date': f'{year}-04-15'},
            {'quarter': 'Q2', 'period': 'Apr 1 - May 31', 'due_date': f'{year}-06-15'},
            {'quarter': 'Q3', 'period': 'Jun 1 - Aug 31', 'due_date': f'{year}-09-15'},
            {'quarter': 'Q4', 'period': 'Sep 1 - Dec 31', 'due_date': f'{year + 1}-01-15'}
        ],
        'annual_deadline': f'{year + 1}-04-15',
        'extension_deadline': f'{year + 1}-10-15',
        'w9_deadline': 'Before first payment',
        '1099_deadline': f'{year + 1}-01-31'
    })


@contractor_ss_bp.route('/tax/rates', methods=['GET'])
def get_tax_rates():
    """Get self-employment tax rates."""
    return jsonify({
        'success': True,
        'self_employment_tax': {
            'total_rate': 15.3,
            'social_security_rate': 12.4,
            'medicare_rate': 2.9,
            'description': 'Self-employment tax covers Social Security and Medicare'
        },
        'backup_withholding_rate': 24.0,
        'mileage_rate': float(contractor_self_service.IRS_MILEAGE_RATE),
        '1099_threshold': float(contractor_self_service.THRESHOLD_1099)
    })


# ============================================================================
# PORTAL DASHBOARD
# ============================================================================

@contractor_ss_bp.route('/portal/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get contractor portal dashboard."""
    contractor_id = get_jwt_identity()
    
    dashboard = contractor_self_service.get_dashboard(contractor_id)
    if 'error' in dashboard:
        return jsonify({'success': False, 'error': dashboard['error']}), 404
    
    return jsonify({'success': True, 'dashboard': dashboard})


# ============================================================================
# PROFILE
# ============================================================================

@contractor_ss_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get contractor profile."""
    contractor_id = get_jwt_identity()
    contractor = contractor_self_service.contractors.get(contractor_id)
    
    if not contractor:
        return jsonify({'success': False, 'error': 'Contractor not found'}), 404
    
    safe_fields = [
        'id', 'email', 'phone', 'business_classification', 'legal_name',
        'business_name', 'dba_name', 'status', 'created_at'
    ]
    profile = {k: contractor.get(k) for k in safe_fields}
    profile['w9_complete'] = contractor.get('w9_complete', False)
    profile['payment_setup_complete'] = contractor.get('payment_setup_complete', False)
    
    return jsonify({'success': True, 'profile': profile})


@contractor_ss_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update contractor profile."""
    contractor_id = get_jwt_identity()
    data = request.get_json()
    
    contractor = contractor_self_service.contractors.get(contractor_id)
    if not contractor:
        return jsonify({'success': False, 'error': 'Contractor not found'}), 404
    
    editable_fields = [
        'business_name', 'dba_name', 'phone', 'business_address',
        'mailing_address', 'business_phone', 'business_email', 'website'
    ]
    
    for field in editable_fields:
        if field in data:
            contractor[field] = data[field]
    
    contractor['updated_at'] = datetime.utcnow().isoformat()
    
    return jsonify({'success': True, 'message': 'Profile updated'})


# ============================================================================
# BUSINESS CLASSIFICATIONS
# ============================================================================

@contractor_ss_bp.route('/options/business-classifications', methods=['GET'])
def get_business_classifications():
    """Get business classification options."""
    return jsonify({
        'success': True,
        'classifications': [
            {'value': k, 'label': v}
            for k, v in contractor_self_service.BUSINESS_CLASSIFICATIONS.items()
        ]
    })


@contractor_ss_bp.route('/options/industries', methods=['GET'])
def get_industries():
    """Get industry category options."""
    return jsonify({
        'success': True,
        'industries': [
            {'value': 'construction', 'label': 'Construction'},
            {'value': 'consulting', 'label': 'Consulting'},
            {'value': 'creative_services', 'label': 'Creative Services (Design, Writing, Photography)'},
            {'value': 'healthcare', 'label': 'Healthcare Services'},
            {'value': 'it_technology', 'label': 'IT/Technology Services'},
            {'value': 'legal_services', 'label': 'Legal Services'},
            {'value': 'marketing_advertising', 'label': 'Marketing/Advertising'},
            {'value': 'professional_services', 'label': 'Professional Services'},
            {'value': 'real_estate', 'label': 'Real Estate'},
            {'value': 'transportation_delivery', 'label': 'Transportation/Delivery'},
            {'value': 'other', 'label': 'Other'}
        ]
    })


# ============================================================================
# VALIDATION
# ============================================================================

@contractor_ss_bp.route('/validate/password', methods=['POST'])
def validate_password():
    """Validate password strength."""
    data = request.get_json()
    password = data.get('password', '')
    
    valid, errors = contractor_self_service.validate_password(password)
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors,
        'requirements': contractor_self_service.PASSWORD_REQUIREMENTS
    })


@contractor_ss_bp.route('/validate/ein', methods=['POST'])
def validate_ein():
    """Validate EIN format."""
    data = request.get_json()
    ein = data.get('ein', '')
    
    valid, message = contractor_self_service.validate_ein(ein)
    return jsonify({'success': True, 'valid': valid, 'message': message})


@contractor_ss_bp.route('/validate/ssn', methods=['POST'])
def validate_ssn():
    """Validate SSN format."""
    data = request.get_json()
    ssn = data.get('ssn', '')
    
    valid, message = contractor_self_service.validate_ssn(ssn)
    return jsonify({'success': True, 'valid': valid, 'message': message})


@contractor_ss_bp.route('/validate/routing', methods=['POST'])
def validate_routing():
    """Validate routing number."""
    data = request.get_json()
    routing = data.get('routing_number', '')
    
    valid, message = contractor_self_service.validate_routing_number(routing)
    return jsonify({'success': True, 'valid': valid, 'message': message})
