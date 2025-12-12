"""
EMPLOYER REGISTRATION ROUTES
Complete employer registration API for production onboarding
Zero manual intervention - fully automated signup flow
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from services.employer_registration_service import employer_registration_service

employer_registration_bp = Blueprint('employer_registration', __name__, url_prefix='/api/employer-registration')


# ============================================================================
# REGISTRATION FLOW
# ============================================================================

@employer_registration_bp.route('/start', methods=['POST'])
@jwt_required()
def start_registration():
    """Start new employer registration."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    registration = employer_registration_service.create_registration(user_id, data)
    
    return jsonify({
        'success': True,
        'registration': registration,
        'message': 'Registration started. Complete all steps to activate your account.',
        'steps': [
            {'step': 1, 'name': 'Company Information'},
            {'step': 2, 'name': 'Federal Tax Registration'},
            {'step': 3, 'name': 'State Tax Registration'},
            {'step': 4, 'name': 'Banking & ACH Setup'},
            {'step': 5, 'name': 'Workers Compensation'},
            {'step': 6, 'name': 'Regulatory Compliance'},
            {'step': 7, 'name': 'Subscription & Billing'}
        ]
    }), 201


@employer_registration_bp.route('/<registration_id>', methods=['GET'])
@jwt_required()
def get_registration(registration_id):
    """Get registration status and data."""
    registration = employer_registration_service.registrations.get(registration_id)
    
    if not registration:
        return jsonify({'success': False, 'message': 'Registration not found'}), 404
    
    return jsonify({'success': True, 'registration': registration})


@employer_registration_bp.route('/<registration_id>/step/<int:step>', methods=['POST'])
@jwt_required()
def submit_step(registration_id, step):
    """Submit data for a registration step."""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    result = employer_registration_service.submit_step(registration_id, step, data)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@employer_registration_bp.route('/<registration_id>/complete', methods=['POST'])
@jwt_required()
def complete_registration(registration_id):
    """Complete registration and create company."""
    result = employer_registration_service.complete_registration(registration_id)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# VALIDATION ENDPOINTS
# ============================================================================

@employer_registration_bp.route('/validate/ein', methods=['POST'])
@jwt_required()
def validate_ein():
    """Validate EIN format."""
    data = request.get_json()
    ein = data.get('ein', '')
    
    valid, message = employer_registration_service.validate_ein(ein)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'message': message
    })


@employer_registration_bp.route('/validate/routing', methods=['POST'])
@jwt_required()
def validate_routing():
    """Validate bank routing number."""
    data = request.get_json()
    routing = data.get('routing_number', '')
    
    valid, message = employer_registration_service.validate_routing_number(routing)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'message': message
    })


@employer_registration_bp.route('/validate/company-info', methods=['POST'])
@jwt_required()
def validate_company_info():
    """Validate company information."""
    data = request.get_json()
    
    valid, errors = employer_registration_service.validate_company_info(data)
    
    return jsonify({
        'success': True,
        'valid': valid,
        'errors': errors
    })


# ============================================================================
# BANK VERIFICATION
# ============================================================================

@employer_registration_bp.route('/<registration_id>/bank/verify/start', methods=['POST'])
@jwt_required()
def start_bank_verification(registration_id):
    """Initiate bank account verification."""
    data = request.get_json()
    method = data.get('method', 'micro_deposit')
    
    result = employer_registration_service.initiate_bank_verification(registration_id, method)
    
    return jsonify({
        'success': True,
        'verification': result
    })


@employer_registration_bp.route('/<registration_id>/bank/verify/confirm', methods=['POST'])
@jwt_required()
def confirm_bank_verification(registration_id):
    """Confirm micro-deposit amounts."""
    data = request.get_json()
    amounts = data.get('amounts', [])
    
    if len(amounts) != 2:
        return jsonify({'success': False, 'message': 'Two deposit amounts required'}), 400
    
    valid, message = employer_registration_service.verify_bank_micro_deposits(registration_id, amounts)
    
    return jsonify({
        'success': valid,
        'message': message
    })


# ============================================================================
# STATE REQUIREMENTS
# ============================================================================

@employer_registration_bp.route('/state-requirements/<state>', methods=['GET'])
@jwt_required()
def get_state_requirements(state):
    """Get state-specific registration requirements."""
    requirements = employer_registration_service.get_state_requirements(state.upper())
    
    return jsonify({
        'success': True,
        'state': state.upper(),
        'requirements': requirements
    })


@employer_registration_bp.route('/state-requirements', methods=['GET'])
@jwt_required()
def get_all_state_requirements():
    """Get all state registration requirements."""
    return jsonify({
        'success': True,
        'states': employer_registration_service.STATE_REQUIREMENTS
    })


# ============================================================================
# COMPLIANCE & PLANS
# ============================================================================

@employer_registration_bp.route('/compliance-checklist', methods=['POST'])
@jwt_required()
def get_compliance_checklist():
    """Get compliance checklist based on company profile."""
    data = request.get_json()
    
    checklist = employer_registration_service.get_compliance_checklist(data)
    
    return jsonify({
        'success': True,
        'checklist': checklist
    })


@employer_registration_bp.route('/recommend-plan', methods=['POST'])
@jwt_required()
def recommend_plan():
    """Get plan recommendation based on needs."""
    data = request.get_json()
    employee_count = data.get('employee_count', 1)
    features_needed = data.get('features', [])
    
    recommendation = employer_registration_service.calculate_recommended_plan(employee_count, features_needed)
    
    return jsonify({
        'success': True,
        'recommendation': recommendation
    })


# ============================================================================
# ENTITY TYPES & LOOKUPS
# ============================================================================

@employer_registration_bp.route('/entity-types', methods=['GET'])
def get_entity_types():
    """Get list of valid entity types."""
    return jsonify({
        'success': True,
        'entity_types': employer_registration_service.ENTITY_TYPES
    })


@employer_registration_bp.route('/fica-schedules', methods=['GET'])
def get_fica_schedules():
    """Get FICA deposit schedule information."""
    return jsonify({
        'success': True,
        'schedules': employer_registration_service.FICA_DEPOSIT_SCHEDULES
    })
