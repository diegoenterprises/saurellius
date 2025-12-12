"""
EMPLOYEE SELF-SERVICE ROUTES
Complete API for employee registration, onboarding, and portal
Zero-touch HR administration endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from services.employee_self_service import employee_self_service

employee_ss_bp = Blueprint('employee_self_service', __name__, url_prefix='/api/employee')


# ============================================================================
# REGISTRATION - PATH 1: SELF-SERVICE
# ============================================================================

@employee_ss_bp.route('/register', methods=['POST'])
def self_service_register():
    """Self-service employee registration."""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    result = employee_self_service.self_service_register(data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


@employee_ss_bp.route('/verify/email', methods=['POST'])
def verify_email():
    """Verify email with code."""
    data = request.get_json()
    employee_id = data.get('employee_id')
    code = data.get('code')
    
    if not employee_id or not code:
        return jsonify({'success': False, 'error': 'Employee ID and code required'}), 400
    
    result = employee_self_service.verify_email(employee_id, code)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@employee_ss_bp.route('/verify/phone', methods=['POST'])
def verify_phone():
    """Verify phone with SMS code."""
    data = request.get_json()
    employee_id = data.get('employee_id')
    code = data.get('code')
    
    if not employee_id or not code:
        return jsonify({'success': False, 'error': 'Employee ID and code required'}), 400
    
    result = employee_self_service.verify_phone(employee_id, code)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@employee_ss_bp.route('/verify/resend', methods=['POST'])
def resend_verification():
    """Resend verification code."""
    data = request.get_json()
    employee_id = data.get('employee_id')
    verification_type = data.get('type')  # 'email' or 'phone'
    
    if not employee_id or not verification_type:
        return jsonify({'success': False, 'error': 'Employee ID and type required'}), 400
    
    # Generate new code
    code = employee_self_service.generate_verification_code()
    # In production: Send via email or SMS
    
    return jsonify({
        'success': True,
        'message': f'Verification code sent to {verification_type}'
    })


# ============================================================================
# REGISTRATION - PATH 2: EMPLOYER-INVITED
# ============================================================================

@employee_ss_bp.route('/invitation/<token>', methods=['GET'])
def get_invitation(token):
    """Get invitation details."""
    invitation = None
    for inv in employee_self_service.invitations.values():
        if inv.get('token') == token:
            invitation = inv
            break
    
    if not invitation:
        return jsonify({'success': False, 'error': 'Invalid invitation'}), 404
    
    # Return safe invitation data (no sensitive info)
    return jsonify({
        'success': True,
        'invitation': {
            'employer_name': 'Company Name',  # Fetch from employer
            'employee_email': invitation['employee_email'],
            'employee_name': invitation.get('employee_name', ''),
            'hire_date': invitation.get('hire_date'),
            'job_title': invitation.get('job_title'),
            'personal_message': invitation.get('personal_message'),
            'expires_at': invitation['expires_at']
        }
    })


@employee_ss_bp.route('/invitation/accept', methods=['POST'])
def accept_invitation():
    """Accept employer invitation."""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'success': False, 'error': 'Invitation token required'}), 400
    
    result = employee_self_service.accept_invitation(token, data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# EMPLOYER SEARCH & CONNECTION
# ============================================================================

@employee_ss_bp.route('/employers/search', methods=['GET'])
@jwt_required()
def search_employers():
    """Search for employers."""
    query = request.args.get('q', '')
    
    if len(query) < 2:
        return jsonify({'success': False, 'error': 'Search query too short'}), 400
    
    results = employee_self_service.search_employers(query)
    
    return jsonify({
        'success': True,
        'employers': results
    })


@employee_ss_bp.route('/employers/join', methods=['POST'])
@jwt_required()
def request_to_join():
    """Request to join an employer."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    employer_id = data.get('employer_id')
    message = data.get('message', '')
    
    if not employer_id:
        return jsonify({'success': False, 'error': 'Employer ID required'}), 400
    
    result = employee_self_service.request_to_join_employer(employee_id, employer_id, message)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# ONBOARDING WORKFLOW (10 Sections)
# ============================================================================

@employee_ss_bp.route('/onboarding/status', methods=['GET'])
@jwt_required()
def get_onboarding_status():
    """Get onboarding status and progress."""
    employee_id = get_jwt_identity()
    
    status = employee_self_service.get_onboarding_status(employee_id)
    
    if 'error' in status:
        return jsonify({'success': False, 'error': status['error']}), 404
    
    return jsonify({
        'success': True,
        'status': status
    })


@employee_ss_bp.route('/onboarding/sections', methods=['GET'])
def get_onboarding_sections():
    """Get list of onboarding sections."""
    return jsonify({
        'success': True,
        'sections': [
            {'number': num, **info}
            for num, info in employee_self_service.ONBOARDING_SECTIONS.items()
        ]
    })


@employee_ss_bp.route('/onboarding/section/<int:section>', methods=['GET'])
@jwt_required()
def get_onboarding_section(section):
    """Get data for specific onboarding section."""
    employee_id = get_jwt_identity()
    
    employee = employee_self_service.employees.get(employee_id)
    if not employee:
        return jsonify({'success': False, 'error': 'Employee not found'}), 404
    
    section_data = employee.get('onboarding', {}).get(f'section_{section}', {})
    
    return jsonify({
        'success': True,
        'section': section,
        'section_name': employee_self_service.ONBOARDING_SECTIONS.get(section, {}).get('name'),
        'data': section_data.get('data', {}),
        'status': section_data.get('status', 'not_started')
    })


@employee_ss_bp.route('/onboarding/section/<int:section>', methods=['POST'])
@jwt_required()
def submit_onboarding_section(section):
    """Submit data for onboarding section."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    result = employee_self_service.submit_onboarding_section(employee_id, section, data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@employee_ss_bp.route('/onboarding/submit', methods=['POST'])
@jwt_required()
def submit_onboarding():
    """Submit completed onboarding."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    signature = data.get('signature')
    
    result = employee_self_service.submit_onboarding(employee_id, signature)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# W-4 WIZARD HELPERS
# ============================================================================

@employee_ss_bp.route('/onboarding/w4/filing-statuses', methods=['GET'])
def get_w4_filing_statuses():
    """Get W-4 filing status options."""
    return jsonify({
        'success': True,
        'filing_statuses': [
            {'value': 'single', 'label': 'Single or Married filing separately'},
            {'value': 'married_filing_jointly', 'label': 'Married filing jointly'},
            {'value': 'head_of_household', 'label': 'Head of household'}
        ],
        'help_text': {
            'single': "Choose if you're unmarried, divorced, or legally separated.",
            'married_filing_jointly': "Choose if you're married and file a joint tax return with your spouse.",
            'head_of_household': "Choose if you're unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual."
        }
    })


@employee_ss_bp.route('/onboarding/w4/calculate', methods=['POST'])
@jwt_required()
def calculate_w4_withholding():
    """Calculate W-4 withholding preview."""
    data = request.get_json()
    
    # Basic calculation preview
    filing_status = data.get('filing_status', 'single')
    salary = float(data.get('annual_salary', 0))
    dependents_amount = float(data.get('dependents_amount', 0))
    other_income = float(data.get('other_income', 0))
    deductions = float(data.get('deductions', 0))
    
    # Standard deductions
    standard_deductions = {
        'single': 14600,
        'married_filing_jointly': 29200,
        'head_of_household': 21900
    }
    
    std_ded = standard_deductions.get(filing_status, 14600)
    taxable_income = salary + other_income - max(deductions, std_ded) - dependents_amount
    
    # Simplified tax estimate
    if filing_status == 'married_filing_jointly':
        if taxable_income <= 23200:
            tax = taxable_income * 0.10
        elif taxable_income <= 94300:
            tax = 2320 + (taxable_income - 23200) * 0.12
        else:
            tax = 10852 + (taxable_income - 94300) * 0.22
    else:
        if taxable_income <= 11600:
            tax = taxable_income * 0.10
        elif taxable_income <= 47150:
            tax = 1160 + (taxable_income - 11600) * 0.12
        else:
            tax = 5426 + (taxable_income - 47150) * 0.22
    
    tax = max(0, tax)
    
    return jsonify({
        'success': True,
        'calculation': {
            'estimated_annual_tax': round(tax, 2),
            'estimated_per_paycheck': round(tax / 26, 2),  # Biweekly
            'standard_deduction': std_ded,
            'taxable_income': round(taxable_income, 2)
        }
    })


# ============================================================================
# I-9 HELPERS
# ============================================================================

@employee_ss_bp.route('/onboarding/i9/citizenship-statuses', methods=['GET'])
def get_citizenship_statuses():
    """Get I-9 citizenship status options."""
    return jsonify({
        'success': True,
        'statuses': [
            {
                'value': 'citizen',
                'label': 'A citizen of the United States',
                'help': 'You were born in the United States, certain U.S. territories, or became a U.S. citizen through naturalization.'
            },
            {
                'value': 'noncitizen_national',
                'label': 'A noncitizen national of the United States',
                'help': 'You were born in American Samoa or Swains Island.'
            },
            {
                'value': 'permanent_resident',
                'label': 'A lawful permanent resident',
                'help': 'You have a Permanent Resident Card (Green Card).',
                'requires': ['alien_number']
            },
            {
                'value': 'alien_authorized',
                'label': 'A noncitizen authorized to work',
                'help': 'You have a work visa, EAD, or other work authorization.',
                'requires': ['expiration_date', 'work_authorization_doc']
            }
        ]
    })


@employee_ss_bp.route('/onboarding/i9/documents', methods=['GET'])
def get_i9_documents():
    """Get I-9 acceptable documents."""
    return jsonify({
        'success': True,
        'list_a': [
            'U.S. Passport or U.S. Passport Card',
            'Permanent Resident Card (Form I-551)',
            'Foreign passport with temporary I-551 stamp',
            'Employment Authorization Document (Form I-766)',
            'Foreign passport with Form I-94'
        ],
        'list_b': [
            "Driver's license or ID card issued by a U.S. state",
            'ID card issued by federal, state, or local government',
            'School ID card with photograph',
            "Voter's registration card",
            'U.S. Military card or draft record'
        ],
        'list_c': [
            'Social Security Account Number card (unrestricted)',
            'Birth certificate issued by a U.S. state or territory',
            'Native American tribal document',
            'U.S. Citizen ID Card (Form I-197)',
            'Employment authorization document issued by DHS'
        ],
        'instructions': 'Present ONE document from List A, OR ONE document from List B AND ONE document from List C'
    })


# ============================================================================
# EMPLOYEE PORTAL - DASHBOARD
# ============================================================================

@employee_ss_bp.route('/portal/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get employee portal dashboard."""
    employee_id = get_jwt_identity()
    
    dashboard = employee_self_service.get_dashboard(employee_id)
    
    if 'error' in dashboard:
        return jsonify({'success': False, 'error': dashboard['error']}), 404
    
    return jsonify({
        'success': True,
        'dashboard': dashboard
    })


# ============================================================================
# EMPLOYEE PORTAL - PROFILE
# ============================================================================

@employee_ss_bp.route('/portal/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get employee profile."""
    employee_id = get_jwt_identity()
    
    employee = employee_self_service.employees.get(employee_id)
    if not employee:
        return jsonify({'success': False, 'error': 'Employee not found'}), 404
    
    # Return safe profile data (no encrypted fields)
    safe_fields = [
        'id', 'first_name', 'middle_name', 'last_name', 'preferred_name',
        'email', 'phone', 'date_of_birth', 'street_address', 'city',
        'state', 'zip_code', 'job_title', 'department', 'hire_date',
        'employment_type', 'status'
    ]
    
    profile = {k: employee.get(k) for k in safe_fields}
    
    return jsonify({
        'success': True,
        'profile': profile
    })


@employee_ss_bp.route('/portal/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update employee profile."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    result = employee_self_service.update_profile(employee_id, data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# EMPLOYEE PORTAL - PAYSTUBS
# ============================================================================

@employee_ss_bp.route('/portal/paystubs', methods=['GET'])
@jwt_required()
def get_paystubs():
    """Get employee paystubs."""
    employee_id = get_jwt_identity()
    year = request.args.get('year', type=int)
    limit = request.args.get('limit', default=10, type=int)
    
    result = employee_self_service.get_paystubs(employee_id, year, limit)
    
    if 'error' in result:
        return jsonify({'success': False, 'error': result['error']}), 404
    
    return jsonify({
        'success': True,
        **result
    })


@employee_ss_bp.route('/portal/paystubs/<paystub_id>', methods=['GET'])
@jwt_required()
def get_paystub_detail(paystub_id):
    """Get specific paystub details."""
    employee_id = get_jwt_identity()
    
    # In production: Fetch paystub from database
    return jsonify({
        'success': True,
        'paystub': {
            'id': paystub_id,
            'message': 'Paystub detail endpoint'
        }
    })


# ============================================================================
# EMPLOYEE PORTAL - TAX DOCUMENTS
# ============================================================================

@employee_ss_bp.route('/portal/tax', methods=['GET'])
@jwt_required()
def get_tax_documents():
    """Get tax documents."""
    employee_id = get_jwt_identity()
    
    result = employee_self_service.get_tax_documents(employee_id)
    
    if 'error' in result:
        return jsonify({'success': False, 'error': result['error']}), 404
    
    return jsonify({
        'success': True,
        **result
    })


@employee_ss_bp.route('/portal/tax/w4', methods=['PUT'])
@jwt_required()
def update_w4():
    """Update W-4 form."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate and save new W-4
    result = employee_self_service.submit_onboarding_section(employee_id, 3, data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify({
        'success': True,
        'message': 'W-4 updated successfully. Changes effective next payroll.'
    })


# ============================================================================
# EMPLOYEE PORTAL - BENEFITS
# ============================================================================

@employee_ss_bp.route('/portal/benefits', methods=['GET'])
@jwt_required()
def get_benefits():
    """Get benefits information."""
    employee_id = get_jwt_identity()
    
    result = employee_self_service.get_benefits(employee_id)
    
    if 'error' in result:
        return jsonify({'success': False, 'error': result['error']}), 404
    
    return jsonify({
        'success': True,
        **result
    })


@employee_ss_bp.route('/portal/benefits/life-event', methods=['POST'])
@jwt_required()
def report_life_event():
    """Report qualifying life event."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    event_type = data.get('event_type')
    event_date = data.get('event_date')
    
    valid_events = [
        'marriage', 'divorce', 'birth_adoption', 'death_of_dependent',
        'loss_of_coverage', 'employment_status_change'
    ]
    
    if event_type not in valid_events:
        return jsonify({'success': False, 'error': 'Invalid life event type'}), 400
    
    return jsonify({
        'success': True,
        'message': 'Life event reported. You have 30 days to make benefit changes.',
        'enrollment_deadline': (datetime.utcnow() + timedelta(days=30)).isoformat(),
        'allowed_changes': ['medical', 'dental', 'vision', 'life', 'fsa']
    })


# ============================================================================
# EMPLOYEE PORTAL - TIME OFF
# ============================================================================

@employee_ss_bp.route('/portal/pto/balance', methods=['GET'])
@jwt_required()
def get_pto_balance():
    """Get PTO balances."""
    employee_id = get_jwt_identity()
    
    result = employee_self_service.get_time_off_balance(employee_id)
    
    if 'error' in result:
        return jsonify({'success': False, 'error': result['error']}), 404
    
    return jsonify({
        'success': True,
        **result
    })


@employee_ss_bp.route('/portal/pto/request', methods=['POST'])
@jwt_required()
def request_pto():
    """Request time off."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    result = employee_self_service.request_time_off(
        employee_id,
        data.get('start_date'),
        data.get('end_date'),
        data.get('pto_type'),
        data.get('notes', '')
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@employee_ss_bp.route('/portal/pto/requests', methods=['GET'])
@jwt_required()
def get_pto_requests():
    """Get PTO request history."""
    employee_id = get_jwt_identity()
    
    employee = employee_self_service.employees.get(employee_id)
    if not employee:
        return jsonify({'success': False, 'error': 'Employee not found'}), 404
    
    return jsonify({
        'success': True,
        'pending': employee.get('pending_pto_requests', []),
        'approved': employee.get('approved_pto_requests', []),
        'denied': employee.get('denied_pto_requests', [])
    })


# ============================================================================
# EMPLOYEE PORTAL - DIRECT DEPOSIT
# ============================================================================

@employee_ss_bp.route('/portal/direct-deposit', methods=['GET'])
@jwt_required()
def get_direct_deposit():
    """Get direct deposit accounts."""
    employee_id = get_jwt_identity()
    
    employee = employee_self_service.employees.get(employee_id)
    if not employee:
        return jsonify({'success': False, 'error': 'Employee not found'}), 404
    
    accounts = employee.get('direct_deposit_accounts', [])
    
    # Mask sensitive data
    safe_accounts = []
    for acc in accounts:
        safe_accounts.append({
            'bank_name': acc.get('bank_name'),
            'account_type': acc.get('account_type'),
            'account_last_four': acc.get('account_last_four', '****'),
            'routing_number': acc.get('routing_number'),
            'amount_type': acc.get('amount_type'),
            'amount': acc.get('amount')
        })
    
    return jsonify({
        'success': True,
        'accounts': safe_accounts
    })


@employee_ss_bp.route('/portal/direct-deposit', methods=['PUT'])
@jwt_required()
def update_direct_deposit():
    """Update direct deposit accounts."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    accounts = data.get('accounts', [])
    
    result = employee_self_service.update_direct_deposit(employee_id, accounts)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# EMPLOYEE PORTAL - DOCUMENTS
# ============================================================================

@employee_ss_bp.route('/portal/documents', methods=['GET'])
@jwt_required()
def get_documents():
    """Get employee documents."""
    employee_id = get_jwt_identity()
    category = request.args.get('category')
    
    # In production: Fetch from document storage
    return jsonify({
        'success': True,
        'documents': [],
        'categories': ['paystubs', 'tax_documents', 'benefits', 'policies', 'certifications']
    })


@employee_ss_bp.route('/portal/documents/upload', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload document."""
    employee_id = get_jwt_identity()
    
    # In production: Handle file upload
    return jsonify({
        'success': True,
        'message': 'Document uploaded successfully'
    })


# ============================================================================
# EMPLOYEE PORTAL - NOTIFICATIONS
# ============================================================================

@employee_ss_bp.route('/portal/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications."""
    employee_id = get_jwt_identity()
    
    employee = employee_self_service.employees.get(employee_id)
    if not employee:
        return jsonify({'success': False, 'error': 'Employee not found'}), 404
    
    return jsonify({
        'success': True,
        'notifications': employee.get('notifications', []),
        'unread_count': len([n for n in employee.get('notifications', []) if not n.get('read')])
    })


@employee_ss_bp.route('/portal/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark notification as read."""
    employee_id = get_jwt_identity()
    
    # In production: Update notification
    return jsonify({
        'success': True,
        'message': 'Notification marked as read'
    })


@employee_ss_bp.route('/portal/notifications/preferences', methods=['GET', 'PUT'])
@jwt_required()
def notification_preferences():
    """Get or update notification preferences."""
    employee_id = get_jwt_identity()
    
    if request.method == 'GET':
        employee = employee_self_service.employees.get(employee_id)
        return jsonify({
            'success': True,
            'preferences': employee.get('notification_preferences', {
                'email_paystub': True,
                'email_tax_documents': True,
                'sms_paystub': False,
                'push_paystub': True,
                'push_pto_status': True,
                'push_schedule_changes': True
            })
        })
    else:
        # Update preferences
        return jsonify({
            'success': True,
            'message': 'Preferences updated'
        })


# ============================================================================
# VALIDATION ENDPOINTS
# ============================================================================

@employee_ss_bp.route('/validate/password', methods=['POST'])
def validate_password():
    """Validate password strength."""
    data = request.get_json()
    password = data.get('password', '')
    
    valid, errors = employee_self_service.validate_password(password)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors,
        'requirements': employee_self_service.PASSWORD_REQUIREMENTS
    })


@employee_ss_bp.route('/validate/email', methods=['POST'])
def validate_email_format():
    """Validate email format."""
    data = request.get_json()
    email = data.get('email', '')
    
    valid, message = employee_self_service.validate_email(email)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'message': message
    })


@employee_ss_bp.route('/validate/phone', methods=['POST'])
def validate_phone_format():
    """Validate phone format."""
    data = request.get_json()
    phone = data.get('phone', '')
    
    valid, message = employee_self_service.validate_phone(phone)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'message': message
    })


# ============================================================================
# OPTIONS / LOOKUPS
# ============================================================================

@employee_ss_bp.route('/options/employment-types', methods=['GET'])
def get_employment_types():
    """Get employment type options."""
    return jsonify({
        'success': True,
        'employment_types': [
            {'value': 'full_time', 'label': 'Full-time'},
            {'value': 'part_time', 'label': 'Part-time'},
            {'value': 'temporary', 'label': 'Temporary'},
            {'value': 'seasonal', 'label': 'Seasonal'},
            {'value': 'intern', 'label': 'Intern/Trainee'}
        ]
    })


@employee_ss_bp.route('/options/demographics', methods=['GET'])
def get_demographic_options():
    """Get demographic options for EEO-1."""
    return jsonify({
        'success': True,
        'gender': [
            {'value': 'male', 'label': 'Male'},
            {'value': 'female', 'label': 'Female'},
            {'value': 'non_binary', 'label': 'Non-binary'},
            {'value': 'prefer_not_to_disclose', 'label': 'Prefer not to disclose'}
        ],
        'ethnicity': [
            {'value': 'hispanic_latino', 'label': 'Hispanic or Latino'},
            {'value': 'white', 'label': 'White (not Hispanic or Latino)'},
            {'value': 'black_african_american', 'label': 'Black or African American'},
            {'value': 'native_hawaiian_pacific_islander', 'label': 'Native Hawaiian or Pacific Islander'},
            {'value': 'asian', 'label': 'Asian'},
            {'value': 'american_indian_alaska_native', 'label': 'American Indian or Alaska Native'},
            {'value': 'two_or_more_races', 'label': 'Two or More Races'},
            {'value': 'prefer_not_to_disclose', 'label': 'Prefer not to disclose'}
        ],
        'veteran_status': [
            {'value': 'protected_veteran', 'label': 'I am a protected veteran'},
            {'value': 'not_protected_veteran', 'label': 'I am not a protected veteran'},
            {'value': 'prefer_not_to_disclose', 'label': 'I prefer not to disclose'}
        ],
        'disability_status': [
            {'value': 'yes_disability', 'label': 'Yes, I have a disability'},
            {'value': 'no_disability', 'label': 'No, I do not have a disability'},
            {'value': 'prefer_not_to_answer', 'label': 'I prefer not to answer'}
        ],
        'voluntary_notice': 'This information is collected voluntarily for EEO-1 compliance and will not affect your employment.'
    })


@employee_ss_bp.route('/options/states', methods=['GET'])
def get_states():
    """Get US states list."""
    states = [
        {'value': 'AL', 'label': 'Alabama'}, {'value': 'AK', 'label': 'Alaska'},
        {'value': 'AZ', 'label': 'Arizona'}, {'value': 'AR', 'label': 'Arkansas'},
        {'value': 'CA', 'label': 'California'}, {'value': 'CO', 'label': 'Colorado'},
        {'value': 'CT', 'label': 'Connecticut'}, {'value': 'DE', 'label': 'Delaware'},
        {'value': 'DC', 'label': 'District of Columbia'}, {'value': 'FL', 'label': 'Florida'},
        {'value': 'GA', 'label': 'Georgia'}, {'value': 'HI', 'label': 'Hawaii'},
        {'value': 'ID', 'label': 'Idaho'}, {'value': 'IL', 'label': 'Illinois'},
        {'value': 'IN', 'label': 'Indiana'}, {'value': 'IA', 'label': 'Iowa'},
        {'value': 'KS', 'label': 'Kansas'}, {'value': 'KY', 'label': 'Kentucky'},
        {'value': 'LA', 'label': 'Louisiana'}, {'value': 'ME', 'label': 'Maine'},
        {'value': 'MD', 'label': 'Maryland'}, {'value': 'MA', 'label': 'Massachusetts'},
        {'value': 'MI', 'label': 'Michigan'}, {'value': 'MN', 'label': 'Minnesota'},
        {'value': 'MS', 'label': 'Mississippi'}, {'value': 'MO', 'label': 'Missouri'},
        {'value': 'MT', 'label': 'Montana'}, {'value': 'NE', 'label': 'Nebraska'},
        {'value': 'NV', 'label': 'Nevada'}, {'value': 'NH', 'label': 'New Hampshire'},
        {'value': 'NJ', 'label': 'New Jersey'}, {'value': 'NM', 'label': 'New Mexico'},
        {'value': 'NY', 'label': 'New York'}, {'value': 'NC', 'label': 'North Carolina'},
        {'value': 'ND', 'label': 'North Dakota'}, {'value': 'OH', 'label': 'Ohio'},
        {'value': 'OK', 'label': 'Oklahoma'}, {'value': 'OR', 'label': 'Oregon'},
        {'value': 'PA', 'label': 'Pennsylvania'}, {'value': 'RI', 'label': 'Rhode Island'},
        {'value': 'SC', 'label': 'South Carolina'}, {'value': 'SD', 'label': 'South Dakota'},
        {'value': 'TN', 'label': 'Tennessee'}, {'value': 'TX', 'label': 'Texas'},
        {'value': 'UT', 'label': 'Utah'}, {'value': 'VT', 'label': 'Vermont'},
        {'value': 'VA', 'label': 'Virginia'}, {'value': 'WA', 'label': 'Washington'},
        {'value': 'WV', 'label': 'West Virginia'}, {'value': 'WI', 'label': 'Wisconsin'},
        {'value': 'WY', 'label': 'Wyoming'}
    ]
    return jsonify({'success': True, 'states': states})
