"""
 STATE RULES ROUTES
API endpoints for state-by-state payroll compliance rules
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.state_payroll_rules import state_payroll_rules

state_rules_bp = Blueprint('state_rules', __name__)


@state_rules_bp.route('/api/states', methods=['GET'])
@jwt_required()
def get_all_states():
    """Get list of all states with basic info."""
    states_list = [
        {'code': 'AL', 'name': 'Alabama'},
        {'code': 'AK', 'name': 'Alaska'},
        {'code': 'AZ', 'name': 'Arizona'},
        {'code': 'AR', 'name': 'Arkansas'},
        {'code': 'CA', 'name': 'California'},
        {'code': 'CO', 'name': 'Colorado'},
        {'code': 'CT', 'name': 'Connecticut'},
        {'code': 'DE', 'name': 'Delaware'},
        {'code': 'DC', 'name': 'District of Columbia'},
        {'code': 'FL', 'name': 'Florida'},
        {'code': 'GA', 'name': 'Georgia'},
        {'code': 'HI', 'name': 'Hawaii'},
        {'code': 'ID', 'name': 'Idaho'},
        {'code': 'IL', 'name': 'Illinois'},
        {'code': 'IN', 'name': 'Indiana'},
        {'code': 'IA', 'name': 'Iowa'},
        {'code': 'KS', 'name': 'Kansas'},
        {'code': 'KY', 'name': 'Kentucky'},
        {'code': 'LA', 'name': 'Louisiana'},
        {'code': 'ME', 'name': 'Maine'},
        {'code': 'MD', 'name': 'Maryland'},
        {'code': 'MA', 'name': 'Massachusetts'},
        {'code': 'MI', 'name': 'Michigan'},
        {'code': 'MN', 'name': 'Minnesota'},
        {'code': 'MS', 'name': 'Mississippi'},
        {'code': 'MO', 'name': 'Missouri'},
        {'code': 'MT', 'name': 'Montana'},
        {'code': 'NE', 'name': 'Nebraska'},
        {'code': 'NV', 'name': 'Nevada'},
        {'code': 'NH', 'name': 'New Hampshire'},
        {'code': 'NJ', 'name': 'New Jersey'},
        {'code': 'NM', 'name': 'New Mexico'},
        {'code': 'NY', 'name': 'New York'},
        {'code': 'NC', 'name': 'North Carolina'},
        {'code': 'ND', 'name': 'North Dakota'},
        {'code': 'OH', 'name': 'Ohio'},
        {'code': 'OK', 'name': 'Oklahoma'},
        {'code': 'OR', 'name': 'Oregon'},
        {'code': 'PA', 'name': 'Pennsylvania'},
        {'code': 'RI', 'name': 'Rhode Island'},
        {'code': 'SC', 'name': 'South Carolina'},
        {'code': 'SD', 'name': 'South Dakota'},
        {'code': 'TN', 'name': 'Tennessee'},
        {'code': 'TX', 'name': 'Texas'},
        {'code': 'UT', 'name': 'Utah'},
        {'code': 'VT', 'name': 'Vermont'},
        {'code': 'VA', 'name': 'Virginia'},
        {'code': 'WA', 'name': 'Washington'},
        {'code': 'WV', 'name': 'West Virginia'},
        {'code': 'WI', 'name': 'Wisconsin'},
        {'code': 'WY', 'name': 'Wyoming'},
    ]
    
    # Add minimum wage and tax status to each
    for state in states_list:
        code = state['code']
        state['minimum_wage'] = float(state_payroll_rules.get_minimum_wage(code))
        state['has_income_tax'] = state_payroll_rules.has_state_income_tax(code)
        state['has_sdi'] = state_payroll_rules.has_state_disability(code)
        state['has_pfl'] = state_payroll_rules.has_paid_family_leave(code)
    
    return jsonify({
        'success': True,
        'states': states_list
    }), 200


@state_rules_bp.route('/api/states/<state_code>', methods=['GET'])
@jwt_required()
def get_state_details(state_code: str):
    """Get comprehensive payroll rules for a specific state."""
    state_code = state_code.upper()
    
    valid_states = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
        'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
        'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
        'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
        'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ]
    
    if state_code not in valid_states:
        return jsonify({
            'success': False,
            'message': f'Invalid state code: {state_code}'
        }), 400
    
    summary = state_payroll_rules.get_state_summary(state_code)
    
    # Add state name
    state_names = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
        'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
        'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
        'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
        'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
        'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
        'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
        'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
        'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
        'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
        'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
    }
    summary['state_name'] = state_names.get(state_code, state_code)
    
    return jsonify({
        'success': True,
        'state': summary
    }), 200


@state_rules_bp.route('/api/states/<state_code>/minimum-wage', methods=['GET'])
@jwt_required()
def get_minimum_wage(state_code: str):
    """Get minimum wage for a state."""
    wage = state_payroll_rules.get_minimum_wage(state_code)
    return jsonify({
        'success': True,
        'state_code': state_code.upper(),
        'minimum_wage': float(wage),
        'federal_minimum': 7.25
    }), 200


@state_rules_bp.route('/api/states/<state_code>/overtime', methods=['GET'])
@jwt_required()
def get_overtime_rules(state_code: str):
    """Get overtime rules for a state."""
    rules = state_payroll_rules.get_overtime_rule(state_code)
    
    # Convert Decimal to float for JSON
    rules_json = {
        'threshold_weekly': rules.get('threshold_weekly'),
        'threshold_daily': rules.get('threshold_daily'),
        'rate': float(rules.get('rate', 1.5)),
        'double_time': rules.get('double_time'),
    }
    
    return jsonify({
        'success': True,
        'state_code': state_code.upper(),
        'overtime_rules': rules_json
    }), 200


@state_rules_bp.route('/api/states/<state_code>/final-pay', methods=['GET'])
@jwt_required()
def get_final_pay_rules(state_code: str):
    """Get final pay requirements for a state."""
    rules = state_payroll_rules.get_final_pay_rule(state_code)
    return jsonify({
        'success': True,
        'state_code': state_code.upper(),
        'final_pay_rules': rules
    }), 200


@state_rules_bp.route('/api/states/<state_code>/breaks', methods=['GET'])
@jwt_required()
def get_break_requirements(state_code: str):
    """Get meal/rest break requirements for a state."""
    breaks = state_payroll_rules.get_break_requirements(state_code)
    
    if not breaks:
        return jsonify({
            'success': True,
            'state_code': state_code.upper(),
            'break_requirements': None,
            'message': 'No state-mandated break requirements'
        }), 200
    
    return jsonify({
        'success': True,
        'state_code': state_code.upper(),
        'break_requirements': breaks
    }), 200


@state_rules_bp.route('/api/states/no-income-tax', methods=['GET'])
@jwt_required()
def get_no_income_tax_states():
    """Get list of states with no income tax."""
    states = state_payroll_rules.NO_INCOME_TAX_STATES
    return jsonify({
        'success': True,
        'states': states,
        'count': len(states)
    }), 200


@state_rules_bp.route('/api/states/with-sdi', methods=['GET'])
@jwt_required()
def get_sdi_states():
    """Get list of states with State Disability Insurance."""
    sdi_states = []
    for code, info in state_payroll_rules.SDI_STATES.items():
        sdi_states.append({
            'state_code': code,
            'rate': float(info['rate']),
            'wage_base': float(info['wage_base']) if info['wage_base'] else None,
            'employee_paid': info['employee_paid']
        })
    
    return jsonify({
        'success': True,
        'states': sdi_states,
        'count': len(sdi_states)
    }), 200


@state_rules_bp.route('/api/states/with-pfl', methods=['GET'])
@jwt_required()
def get_pfl_states():
    """Get list of states with Paid Family Leave."""
    pfl_states = []
    for code, info in state_payroll_rules.PAID_FAMILY_LEAVE_STATES.items():
        pfl_states.append({
            'state_code': code,
            'rate': float(info['rate']),
            'max_weeks': info['max_weeks'],
            'wage_replacement': float(info['wage_replacement'])
        })
    
    return jsonify({
        'success': True,
        'states': pfl_states,
        'count': len(pfl_states)
    }), 200


@state_rules_bp.route('/api/states/all-rules', methods=['GET'])
@jwt_required()
def get_all_state_rules():
    """Get comprehensive rules for all states (large response)."""
    all_states = state_payroll_rules.get_all_states_summary()
    
    # Convert Decimal values to float for JSON serialization
    for state_code, rules in all_states.items():
        if rules.get('sdi_info'):
            rules['sdi_info'] = {
                k: float(v) if hasattr(v, '__float__') else v
                for k, v in rules['sdi_info'].items()
            }
        if rules.get('pfl_info'):
            rules['pfl_info'] = {
                k: float(v) if hasattr(v, '__float__') else v
                for k, v in rules['pfl_info'].items()
            }
        if rules.get('overtime') and rules['overtime'].get('rate'):
            rules['overtime']['rate'] = float(rules['overtime']['rate'])
    
    return jsonify({
        'success': True,
        'states': all_states,
        'total_states': len(all_states)
    }), 200


# =============================================================================
# OnPay Compliance Endpoints (from extracted PDFs)
# =============================================================================

@state_rules_bp.route('/api/states/<state_code>/workers-comp', methods=['GET'])
@jwt_required()
def get_workers_comp(state_code: str):
    """Get workers compensation requirements for a state (from OnPay)."""
    req = state_payroll_rules.get_workers_comp_requirement(state_code)
    return jsonify({
        'success': True,
        'state_code': state_code.upper(),
        'workers_comp': req
    }), 200


@state_rules_bp.route('/api/states/<state_code>/harassment-training', methods=['GET'])
@jwt_required()
def get_harassment_training(state_code: str):
    """Get sexual harassment training requirements for a state (from OnPay)."""
    req = state_payroll_rules.get_harassment_training_requirement(state_code)
    return jsonify({
        'success': True,
        'state_code': state_code.upper(),
        'harassment_training': req,
        'required': req.get('required', False)
    }), 200


@state_rules_bp.route('/api/states/<state_code>/e-verify', methods=['GET'])
@jwt_required()
def get_everify(state_code: str):
    """Get E-Verify requirements for a state (from OnPay)."""
    req = state_payroll_rules.get_everify_requirement(state_code)
    return jsonify({
        'success': True,
        'state_code': state_code.upper(),
        'e_verify': req,
        'required': req is not None
    }), 200


@state_rules_bp.route('/api/states/requiring-harassment-training', methods=['GET'])
@jwt_required()
def get_states_requiring_harassment_training():
    """Get list of states that require sexual harassment training."""
    required_states = []
    for code, info in state_payroll_rules.HARASSMENT_TRAINING_REQUIRED.items():
        if info.get('required'):
            required_states.append({
                'state_code': code,
                'threshold': info.get('threshold'),
                'notes': info.get('notes')
            })
    
    return jsonify({
        'success': True,
        'states': required_states,
        'count': len(required_states)
    }), 200


@state_rules_bp.route('/api/states/requiring-e-verify', methods=['GET'])
@jwt_required()
def get_states_requiring_everify():
    """Get list of states that require E-Verify."""
    everify_states = []
    for code, info in state_payroll_rules.E_VERIFY_REQUIRED.items():
        everify_states.append({
            'state_code': code,
            'threshold': info.get('threshold'),
            'notes': info.get('notes')
        })
    
    return jsonify({
        'success': True,
        'states': everify_states,
        'count': len(everify_states)
    }), 200


@state_rules_bp.route('/api/states/compliance-summary', methods=['GET'])
@jwt_required()
def get_compliance_summary():
    """Get quick compliance summary across all states."""
    return jsonify({
        'success': True,
        'summary': {
            'no_income_tax_states': state_payroll_rules.NO_INCOME_TAX_STATES,
            'flat_tax_states': list(state_payroll_rules.FLAT_TAX_STATES.keys()),
            'sdi_states': list(state_payroll_rules.SDI_STATES.keys()),
            'pfl_states': list(state_payroll_rules.PAID_FAMILY_LEAVE_STATES.keys()),
            'harassment_training_required': [
                k for k, v in state_payroll_rules.HARASSMENT_TRAINING_REQUIRED.items()
                if v.get('required')
            ],
            'e_verify_required': list(state_payroll_rules.E_VERIFY_REQUIRED.keys()),
            'texas_workers_comp_not_required': True,  # Only state
        }
    }), 200
