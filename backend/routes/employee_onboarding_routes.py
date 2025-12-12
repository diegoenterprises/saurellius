"""
EMPLOYEE ONBOARDING ROUTES
Complete employee self-service onboarding API
W-4, I-9, direct deposit, benefits enrollment - zero HR intervention
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.employee_onboarding_service import employee_onboarding_service

employee_onboarding_bp = Blueprint('employee_onboarding', __name__, url_prefix='/api/employee-onboarding')


# ============================================================================
# ONBOARDING WORKFLOW
# ============================================================================

@employee_onboarding_bp.route('/start', methods=['POST'])
@jwt_required()
def start_onboarding():
    """Start new employee onboarding."""
    data = request.get_json()
    company_id = data.get('company_id')
    
    if not company_id:
        return jsonify({'success': False, 'message': 'Company ID is required'}), 400
    
    onboarding = employee_onboarding_service.create_onboarding(company_id, data)
    
    return jsonify({
        'success': True,
        'onboarding': onboarding,
        'message': 'Employee onboarding started. Complete all steps.',
        'steps': [
            {'step': 1, 'name': 'Personal Information', 'description': 'Your personal and contact details'},
            {'step': 2, 'name': 'Employment Details', 'description': 'Job title, department, compensation'},
            {'step': 3, 'name': 'Federal W-4', 'description': 'Federal tax withholding elections'},
            {'step': 4, 'name': 'State Tax Forms', 'description': 'State-specific tax forms'},
            {'step': 5, 'name': 'Form I-9 Section 1', 'description': 'Employment eligibility verification'},
            {'step': 6, 'name': 'Direct Deposit', 'description': 'Bank account for payroll'},
            {'step': 7, 'name': 'Benefits Enrollment', 'description': 'Health, dental, vision, 401(k)'},
            {'step': 8, 'name': 'Policy Acknowledgments', 'description': 'Company policies and handbook'}
        ]
    }), 201


@employee_onboarding_bp.route('/<onboarding_id>', methods=['GET'])
@jwt_required()
def get_onboarding(onboarding_id):
    """Get onboarding status and progress."""
    onboarding = employee_onboarding_service.onboardings.get(onboarding_id)
    
    if not onboarding:
        return jsonify({'success': False, 'message': 'Onboarding not found'}), 404
    
    return jsonify({'success': True, 'onboarding': onboarding})


@employee_onboarding_bp.route('/<onboarding_id>/step/<int:step>', methods=['POST'])
@jwt_required()
def submit_step(onboarding_id, step):
    """Submit data for an onboarding step."""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    result = employee_onboarding_service.submit_step(onboarding_id, step, data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@employee_onboarding_bp.route('/<onboarding_id>/step/<int:step>', methods=['GET'])
@jwt_required()
def get_step(onboarding_id, step):
    """Get data for a specific onboarding step."""
    onboarding = employee_onboarding_service.onboardings.get(onboarding_id)
    
    if not onboarding:
        return jsonify({'success': False, 'message': 'Onboarding not found'}), 404
    
    step_data = onboarding.get('steps', {}).get(step)
    if not step_data:
        return jsonify({'success': False, 'message': 'Step not found'}), 404
    
    return jsonify({
        'success': True,
        'step': step,
        'data': step_data
    })


# ============================================================================
# I-9 PROCESSING
# ============================================================================

@employee_onboarding_bp.route('/<onboarding_id>/i9/section2', methods=['POST'])
@jwt_required()
def submit_i9_section2(onboarding_id):
    """Submit I-9 Section 2 (employer verification)."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    result = employee_onboarding_service.complete_i9_section2(onboarding_id, data, user_id)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@employee_onboarding_bp.route('/i9/documents/list-a', methods=['GET'])
def get_list_a_documents():
    """Get List A documents for I-9."""
    return jsonify({
        'success': True,
        'documents': employee_onboarding_service.I9_LIST_A_DOCUMENTS,
        'description': 'Documents that establish both identity AND employment authorization'
    })


@employee_onboarding_bp.route('/i9/documents/list-b', methods=['GET'])
def get_list_b_documents():
    """Get List B documents for I-9."""
    return jsonify({
        'success': True,
        'documents': employee_onboarding_service.I9_LIST_B_DOCUMENTS,
        'description': 'Documents that establish identity only'
    })


@employee_onboarding_bp.route('/i9/documents/list-c', methods=['GET'])
def get_list_c_documents():
    """Get List C documents for I-9."""
    return jsonify({
        'success': True,
        'documents': employee_onboarding_service.I9_LIST_C_DOCUMENTS,
        'description': 'Documents that establish employment authorization only'
    })


@employee_onboarding_bp.route('/i9/citizenship-statuses', methods=['GET'])
def get_citizenship_statuses():
    """Get citizenship status options for I-9."""
    return jsonify({
        'success': True,
        'statuses': employee_onboarding_service.I9_CITIZENSHIP_STATUS
    })


# ============================================================================
# W-4 PROCESSING
# ============================================================================

@employee_onboarding_bp.route('/w4/filing-statuses', methods=['GET'])
def get_w4_filing_statuses():
    """Get W-4 filing status options."""
    return jsonify({
        'success': True,
        'filing_statuses': employee_onboarding_service.W4_FILING_STATUSES
    })


@employee_onboarding_bp.route('/w4/calculate-withholding', methods=['POST'])
@jwt_required()
def calculate_w4_withholding():
    """Calculate withholding parameters from W-4 data."""
    data = request.get_json()
    
    parameters = employee_onboarding_service.calculate_w4_withholding_parameters(data)
    
    return jsonify({
        'success': True,
        'withholding_parameters': parameters
    })


# ============================================================================
# STATE TAX FORMS
# ============================================================================

@employee_onboarding_bp.route('/state-forms/<work_state>/<residence_state>', methods=['GET'])
@jwt_required()
def get_required_state_forms(work_state, residence_state):
    """Get required state tax forms based on work and residence states."""
    forms = employee_onboarding_service.get_required_state_forms(work_state, residence_state)
    
    return jsonify({
        'success': True,
        'work_state': work_state.upper(),
        'residence_state': residence_state.upper(),
        'required_forms': forms
    })


@employee_onboarding_bp.route('/state-forms', methods=['GET'])
def get_all_state_forms():
    """Get all state tax form requirements."""
    return jsonify({
        'success': True,
        'state_forms': employee_onboarding_service.STATE_TAX_FORMS
    })


# ============================================================================
# DIRECT DEPOSIT
# ============================================================================

@employee_onboarding_bp.route('/<onboarding_id>/direct-deposit/validate', methods=['POST'])
@jwt_required()
def validate_direct_deposit(onboarding_id):
    """Validate direct deposit information."""
    data = request.get_json()
    
    valid, errors = employee_onboarding_service.validate_direct_deposit(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


# ============================================================================
# BENEFITS ENROLLMENT
# ============================================================================

@employee_onboarding_bp.route('/<onboarding_id>/benefits/validate', methods=['POST'])
@jwt_required()
def validate_benefits(onboarding_id):
    """Validate benefits enrollment selections."""
    data = request.get_json()
    available_plans = data.get('available_plans', {})
    
    valid, errors = employee_onboarding_service.validate_benefits_enrollment(data, available_plans)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


# ============================================================================
# POLICY ACKNOWLEDGMENTS
# ============================================================================

@employee_onboarding_bp.route('/<onboarding_id>/policies', methods=['GET'])
@jwt_required()
def get_required_policies(onboarding_id):
    """Get required policy acknowledgments."""
    onboarding = employee_onboarding_service.onboardings.get(onboarding_id)
    
    if not onboarding:
        return jsonify({'success': False, 'message': 'Onboarding not found'}), 404
    
    policies = employee_onboarding_service.get_required_acknowledgments(onboarding['company_id'])
    
    return jsonify({
        'success': True,
        'policies': policies
    })


# ============================================================================
# APPROVAL & COMPLETION
# ============================================================================

@employee_onboarding_bp.route('/<onboarding_id>/approve', methods=['POST'])
@jwt_required()
def approve_onboarding(onboarding_id):
    """Approve completed onboarding (manager/HR action)."""
    user_id = get_jwt_identity()
    
    result = employee_onboarding_service.approve_onboarding(onboarding_id, user_id)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@employee_onboarding_bp.route('/<onboarding_id>/checklist', methods=['GET'])
@jwt_required()
def get_checklist(onboarding_id):
    """Get onboarding checklist status."""
    onboarding = employee_onboarding_service.onboardings.get(onboarding_id)
    
    if not onboarding:
        return jsonify({'success': False, 'message': 'Onboarding not found'}), 404
    
    checklist = onboarding.get('checklist', {})
    complete_count = sum(1 for v in checklist.values() if v)
    total_count = len(checklist)
    
    return jsonify({
        'success': True,
        'checklist': checklist,
        'complete': complete_count,
        'total': total_count,
        'percentage': round((complete_count / total_count) * 100, 1) if total_count > 0 else 0
    })


# ============================================================================
# VALIDATION HELPERS
# ============================================================================

@employee_onboarding_bp.route('/validate/ssn', methods=['POST'])
@jwt_required()
def validate_ssn():
    """Validate SSN format."""
    data = request.get_json()
    ssn = data.get('ssn', '')
    
    valid, message = employee_onboarding_service.validate_ssn(ssn)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'message': message
    })


@employee_onboarding_bp.route('/validate/personal-info', methods=['POST'])
@jwt_required()
def validate_personal_info():
    """Validate personal information."""
    data = request.get_json()
    
    valid, errors = employee_onboarding_service.validate_personal_info(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


@employee_onboarding_bp.route('/validate/employment-info', methods=['POST'])
@jwt_required()
def validate_employment_info():
    """Validate employment information."""
    data = request.get_json()
    
    valid, errors = employee_onboarding_service.validate_employment_info(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


@employee_onboarding_bp.route('/validate/w4', methods=['POST'])
@jwt_required()
def validate_w4():
    """Validate W-4 form data."""
    data = request.get_json()
    
    valid, errors = employee_onboarding_service.validate_w4(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


@employee_onboarding_bp.route('/validate/i9-section1', methods=['POST'])
@jwt_required()
def validate_i9_section1():
    """Validate I-9 Section 1 data."""
    data = request.get_json()
    
    valid, errors = employee_onboarding_service.validate_i9_section1(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


@employee_onboarding_bp.route('/validate/i9-section2', methods=['POST'])
@jwt_required()
def validate_i9_section2():
    """Validate I-9 Section 2 data."""
    data = request.get_json()
    
    valid, errors = employee_onboarding_service.validate_i9_section2(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })
