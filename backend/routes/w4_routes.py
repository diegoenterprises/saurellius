"""
W-4 TAX WITHHOLDING ROUTES
Electronic W-4 form submission and state withholding management
Supports 2020+ W-4 format with all 5 steps
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from decimal import Decimal
import uuid

w4_bp = Blueprint('w4', __name__, url_prefix='/api/w4')

# In-memory storage (replace with database in production)
W4_FORMS = {}
STATE_WITHHOLDING_FORMS = {}

# 2024 Standard Deductions
STANDARD_DEDUCTIONS = {
    'single': 14600,
    'married_jointly': 29200,
    'married_separately': 14600,
    'head_of_household': 21900,
    'qualifying_surviving_spouse': 29200
}

# 2024 Tax Brackets (simplified for withholding)
FEDERAL_TAX_BRACKETS = {
    'single': [
        (11600, 0.10),
        (47150, 0.12),
        (100525, 0.22),
        (191950, 0.24),
        (243725, 0.32),
        (609350, 0.35),
        (float('inf'), 0.37)
    ],
    'married_jointly': [
        (23200, 0.10),
        (94300, 0.12),
        (201050, 0.22),
        (383900, 0.24),
        (487450, 0.32),
        (731200, 0.35),
        (float('inf'), 0.37)
    ]
}


@w4_bp.route('/employee/<employee_id>', methods=['GET'])
@jwt_required()
def get_employee_w4(employee_id):
    """Get current W-4 for an employee"""
    w4 = None
    for form in W4_FORMS.values():
        if form['employee_id'] == employee_id and form['status'] == 'active':
            w4 = form
            break
    
    if not w4:
        return jsonify({
            'success': True,
            'w4': None,
            'message': 'No W-4 on file'
        })
    
    return jsonify({'success': True, 'w4': w4})


@w4_bp.route('/employee/<employee_id>/history', methods=['GET'])
@jwt_required()
def get_employee_w4_history(employee_id):
    """Get W-4 history for an employee"""
    history = [f for f in W4_FORMS.values() if f['employee_id'] == employee_id]
    history.sort(key=lambda x: x['submitted_at'], reverse=True)
    
    return jsonify({'success': True, 'history': history})


@w4_bp.route('', methods=['POST'])
@jwt_required()
def submit_w4():
    """Submit a new W-4 form"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    required_fields = ['employee_id', 'filing_status']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    # Validate filing status
    valid_statuses = ['single', 'married_jointly', 'married_separately', 
                      'head_of_household', 'qualifying_surviving_spouse']
    if data['filing_status'] not in valid_statuses:
        return jsonify({
            'success': False,
            'message': f'Invalid filing status. Must be one of: {valid_statuses}'
        }), 400
    
    # Deactivate previous W-4
    for form_id, form in W4_FORMS.items():
        if form['employee_id'] == data['employee_id'] and form['status'] == 'active':
            W4_FORMS[form_id]['status'] = 'superseded'
            W4_FORMS[form_id]['superseded_at'] = datetime.utcnow().isoformat()
    
    # Create new W-4
    w4_id = f"W4-{uuid.uuid4().hex[:8].upper()}"
    
    # Check for exempt status
    is_exempt = data.get('claim_exempt', False)
    exempt_expiration = None
    if is_exempt:
        # Exempt expires Feb 15 of next year
        current_year = date.today().year
        exempt_expiration = f"{current_year + 1}-02-15"
    
    w4 = {
        'id': w4_id,
        'employee_id': data['employee_id'],
        'tax_year': data.get('tax_year', date.today().year),
        'status': 'active',
        
        # Step 1: Personal Information
        'filing_status': data['filing_status'],
        
        # Step 2: Multiple Jobs or Spouse Works
        'multiple_jobs_worksheet': data.get('multiple_jobs_worksheet'),
        'step2_checkbox': data.get('step2_checkbox', False),  # Two jobs similar pay
        'step2_additional': data.get('step2_additional', 0),  # From worksheet
        
        # Step 3: Claim Dependents
        'qualifying_children': data.get('qualifying_children', 0),  # $2000 each
        'other_dependents': data.get('other_dependents', 0),  # $500 each
        'step3_total': (data.get('qualifying_children', 0) * 2000) + 
                       (data.get('other_dependents', 0) * 500),
        
        # Step 4: Other Adjustments
        'other_income': data.get('other_income', 0),  # 4(a) - increases withholding
        'deductions': data.get('deductions', 0),  # 4(b) - decreases withholding
        'extra_withholding': data.get('extra_withholding', 0),  # 4(c) - fixed extra
        
        # Exempt status
        'claim_exempt': is_exempt,
        'exempt_expiration': exempt_expiration,
        
        # Metadata
        'submitted_at': datetime.utcnow().isoformat(),
        'submitted_by': user_id,
        'effective_date': data.get('effective_date', date.today().isoformat()),
        'signature': data.get('signature'),
        'signature_date': data.get('signature_date', date.today().isoformat()),
        
        # Calculated withholding parameters
        'standard_deduction': STANDARD_DEDUCTIONS.get(data['filing_status'], 14600),
    }
    
    # Calculate annual withholding adjustment
    w4['annual_withholding_adjustment'] = calculate_withholding_adjustment(w4)
    
    W4_FORMS[w4_id] = w4
    
    return jsonify({
        'success': True,
        'w4': w4,
        'message': 'W-4 submitted successfully. Effective next payroll.'
    }), 201


def calculate_withholding_adjustment(w4):
    """Calculate the annual withholding adjustment based on W-4 entries"""
    adjustment = 0
    
    # Step 2 additions (multiple jobs)
    adjustment += w4.get('step2_additional', 0)
    
    # Step 3 subtractions (dependents)
    adjustment -= w4.get('step3_total', 0)
    
    # Step 4(a) additions (other income)
    adjustment += w4.get('other_income', 0)
    
    # Step 4(b) subtractions (deductions beyond standard)
    adjustment -= w4.get('deductions', 0)
    
    return adjustment


@w4_bp.route('/calculate-withholding', methods=['POST'])
@jwt_required()
def calculate_withholding():
    """Calculate federal withholding for a pay period"""
    data = request.get_json()
    
    required = ['gross_pay', 'pay_frequency', 'filing_status']
    for field in required:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    gross_pay = float(data['gross_pay'])
    pay_frequency = data['pay_frequency']  # weekly, biweekly, semimonthly, monthly
    filing_status = data['filing_status']
    
    # Pre-tax deductions reduce taxable income
    pre_tax_deductions = float(data.get('pre_tax_deductions', 0))
    taxable_pay = gross_pay - pre_tax_deductions
    
    # W-4 adjustments
    qualifying_children = int(data.get('qualifying_children', 0))
    other_dependents = int(data.get('other_dependents', 0))
    other_income = float(data.get('other_income', 0))
    deductions = float(data.get('deductions', 0))
    extra_withholding = float(data.get('extra_withholding', 0))
    claim_exempt = data.get('claim_exempt', False)
    
    # If exempt, no federal withholding
    if claim_exempt:
        return jsonify({
            'success': True,
            'calculation': {
                'gross_pay': gross_pay,
                'taxable_pay': taxable_pay,
                'federal_withholding': 0,
                'extra_withholding': 0,
                'total_withholding': 0,
                'exempt': True,
                'notes': ['Employee claims exempt status']
            }
        })
    
    # Pay periods per year
    periods = {
        'weekly': 52,
        'biweekly': 26,
        'semimonthly': 24,
        'monthly': 12
    }
    periods_per_year = periods.get(pay_frequency, 26)
    
    # Annualize wages
    annual_wages = taxable_pay * periods_per_year
    
    # Add other income (Step 4a)
    annual_wages += other_income
    
    # Get standard deduction
    standard_deduction = STANDARD_DEDUCTIONS.get(filing_status, 14600)
    
    # Additional deductions (Step 4b)
    total_deductions = standard_deduction + deductions
    
    # Dependent credits
    dependent_credit = (qualifying_children * 2000) + (other_dependents * 500)
    
    # Taxable income
    taxable_income = max(0, annual_wages - total_deductions)
    
    # Calculate tax using brackets
    brackets = FEDERAL_TAX_BRACKETS.get(
        'married_jointly' if filing_status in ['married_jointly', 'qualifying_surviving_spouse'] 
        else 'single',
        FEDERAL_TAX_BRACKETS['single']
    )
    
    annual_tax = 0
    remaining_income = taxable_income
    prev_bracket = 0
    
    for bracket_limit, rate in brackets:
        if remaining_income <= 0:
            break
        taxable_in_bracket = min(remaining_income, bracket_limit - prev_bracket)
        annual_tax += taxable_in_bracket * rate
        remaining_income -= taxable_in_bracket
        prev_bracket = bracket_limit
    
    # Subtract dependent credits
    annual_tax = max(0, annual_tax - dependent_credit)
    
    # Per-period withholding
    period_withholding = annual_tax / periods_per_year
    
    # Add extra withholding (Step 4c)
    total_withholding = period_withholding + extra_withholding
    
    return jsonify({
        'success': True,
        'calculation': {
            'gross_pay': gross_pay,
            'pre_tax_deductions': pre_tax_deductions,
            'taxable_pay': taxable_pay,
            'annual_wages': annual_wages,
            'standard_deduction': standard_deduction,
            'additional_deductions': deductions,
            'taxable_income': taxable_income,
            'dependent_credit': dependent_credit,
            'annual_tax': round(annual_tax, 2),
            'federal_withholding': round(period_withholding, 2),
            'extra_withholding': extra_withholding,
            'total_withholding': round(total_withholding, 2),
            'filing_status': filing_status,
            'pay_frequency': pay_frequency,
            'exempt': False
        }
    })


@w4_bp.route('/validate-exempt', methods=['POST'])
@jwt_required()
def validate_exempt():
    """Check if exempt status should expire"""
    data = request.get_json()
    employee_id = data.get('employee_id')
    
    w4 = None
    for form in W4_FORMS.values():
        if form['employee_id'] == employee_id and form['status'] == 'active':
            w4 = form
            break
    
    if not w4:
        return jsonify({
            'success': True,
            'exempt': False,
            'message': 'No active W-4 found'
        })
    
    if not w4.get('claim_exempt'):
        return jsonify({
            'success': True,
            'exempt': False,
            'message': 'Employee does not claim exempt'
        })
    
    # Check expiration
    expiration = w4.get('exempt_expiration')
    if expiration and date.fromisoformat(expiration) < date.today():
        return jsonify({
            'success': True,
            'exempt': False,
            'expired': True,
            'message': 'Exempt status expired. Employee must recertify or withholding will resume.'
        })
    
    return jsonify({
        'success': True,
        'exempt': True,
        'expiration': expiration,
        'message': 'Exempt status is valid'
    })


# =====================================================
# STATE WITHHOLDING FORMS
# =====================================================

STATE_FORM_TEMPLATES = {
    'CA': {'form_name': 'DE 4', 'has_allowances': True, 'has_additional': True},
    'NY': {'form_name': 'IT-2104', 'has_allowances': True, 'has_nyc_tax': True, 'has_yonkers_tax': True},
    'PA': {'form_name': 'REV-419', 'flat_rate': 0.0307, 'has_local_taxes': True},
    'TX': {'no_state_tax': True},
    'FL': {'no_state_tax': True},
    'WA': {'no_state_tax': True, 'has_pfml': True},
    'NJ': {'form_name': 'NJ-W4', 'has_allowances': True},
    'MA': {'form_name': 'M-4', 'has_allowances': True},
    'IL': {'form_name': 'IL-W-4', 'has_allowances': True, 'flat_rate': 0.0495},
    'OH': {'form_name': 'IT-4', 'has_allowances': True, 'has_local_taxes': True},
    'CO': {'form_name': 'DR 0004', 'has_allowances': True, 'has_famli': True},
}

# Reciprocity agreements - employee only pays tax in home state
RECIPROCITY_AGREEMENTS = {
    ('NJ', 'PA'): 'NJ',  # NJ resident working in PA pays NJ tax
    ('PA', 'NJ'): 'PA',  # PA resident working in NJ pays PA tax
    ('PA', 'OH'): 'PA',
    ('PA', 'IN'): 'PA',
    ('PA', 'MD'): 'PA',
    ('PA', 'VA'): 'PA',
    ('PA', 'WV'): 'PA',
    ('DC', 'VA'): 'DC',
    ('DC', 'MD'): 'DC',
}


@w4_bp.route('/state/<state>', methods=['GET'])
def get_state_form_template(state):
    """Get state withholding form template"""
    state = state.upper()
    template = STATE_FORM_TEMPLATES.get(state)
    
    if not template:
        return jsonify({
            'success': False,
            'message': f'No template found for state: {state}'
        }), 404
    
    return jsonify({
        'success': True,
        'state': state,
        'template': template
    })


@w4_bp.route('/state', methods=['POST'])
@jwt_required()
def submit_state_withholding():
    """Submit state withholding form"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    required = ['employee_id', 'state']
    for field in required:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    state = data['state'].upper()
    template = STATE_FORM_TEMPLATES.get(state, {})
    
    # No state tax states
    if template.get('no_state_tax'):
        return jsonify({
            'success': True,
            'message': f'{state} has no state income tax. No form required.',
            'state_withholding': 0
        })
    
    # Deactivate previous state form
    for form_id, form in STATE_WITHHOLDING_FORMS.items():
        if (form['employee_id'] == data['employee_id'] and 
            form['state'] == state and form['status'] == 'active'):
            STATE_WITHHOLDING_FORMS[form_id]['status'] = 'superseded'
    
    form_id = f"STATE-{state}-{uuid.uuid4().hex[:8].upper()}"
    
    state_form = {
        'id': form_id,
        'employee_id': data['employee_id'],
        'state': state,
        'form_name': template.get('form_name', f'{state} State Withholding'),
        'status': 'active',
        
        # Common fields
        'filing_status': data.get('filing_status', 'single'),
        'allowances': data.get('allowances', 0),
        'additional_withholding': data.get('additional_withholding', 0),
        'claim_exempt': data.get('claim_exempt', False),
        
        # State-specific fields
        'nyc_resident': data.get('nyc_resident', False),
        'yonkers_resident': data.get('yonkers_resident', False),
        'local_tax_jurisdiction': data.get('local_tax_jurisdiction'),
        
        # Metadata
        'submitted_at': datetime.utcnow().isoformat(),
        'submitted_by': user_id,
        'effective_date': data.get('effective_date', date.today().isoformat()),
    }
    
    STATE_WITHHOLDING_FORMS[form_id] = state_form
    
    return jsonify({
        'success': True,
        'state_form': state_form,
        'message': f'{state} withholding form submitted successfully'
    }), 201


@w4_bp.route('/state/employee/<employee_id>', methods=['GET'])
@jwt_required()
def get_employee_state_forms(employee_id):
    """Get all state withholding forms for an employee"""
    forms = [f for f in STATE_WITHHOLDING_FORMS.values() 
             if f['employee_id'] == employee_id and f['status'] == 'active']
    
    return jsonify({'success': True, 'state_forms': forms})


@w4_bp.route('/reciprocity', methods=['POST'])
@jwt_required()
def check_reciprocity():
    """Check if reciprocity agreement exists between states"""
    data = request.get_json()
    
    home_state = data.get('home_state', '').upper()
    work_state = data.get('work_state', '').upper()
    
    if home_state == work_state:
        return jsonify({
            'success': True,
            'reciprocity': False,
            'withhold_state': home_state,
            'message': 'Same state - no reciprocity applicable'
        })
    
    reciprocity_key = (home_state, work_state)
    withhold_state = RECIPROCITY_AGREEMENTS.get(reciprocity_key)
    
    if withhold_state:
        return jsonify({
            'success': True,
            'reciprocity': True,
            'home_state': home_state,
            'work_state': work_state,
            'withhold_state': withhold_state,
            'message': f'Reciprocity agreement exists. Withhold {withhold_state} tax only.'
        })
    
    return jsonify({
        'success': True,
        'reciprocity': False,
        'home_state': home_state,
        'work_state': work_state,
        'message': f'No reciprocity. May need to withhold for both states.'
    })


@w4_bp.route('/calculate-state', methods=['POST'])
@jwt_required()
def calculate_state_withholding():
    """Calculate state tax withholding"""
    data = request.get_json()
    
    state = data.get('state', '').upper()
    gross_pay = float(data.get('gross_pay', 0))
    pay_frequency = data.get('pay_frequency', 'biweekly')
    filing_status = data.get('filing_status', 'single')
    allowances = int(data.get('allowances', 0))
    additional = float(data.get('additional_withholding', 0))
    pre_tax = float(data.get('pre_tax_deductions', 0))
    
    template = STATE_FORM_TEMPLATES.get(state, {})
    
    # No state tax
    if template.get('no_state_tax'):
        return jsonify({
            'success': True,
            'state': state,
            'withholding': 0,
            'message': f'{state} has no state income tax'
        })
    
    taxable = gross_pay - pre_tax
    
    # Flat rate states (PA, IL)
    if template.get('flat_rate'):
        rate = template['flat_rate']
        withholding = taxable * rate + additional
        return jsonify({
            'success': True,
            'state': state,
            'taxable_wages': taxable,
            'rate': rate,
            'withholding': round(withholding, 2),
            'additional': additional,
            'method': 'flat_rate'
        })
    
    # Simplified graduated calculation
    # In production, use actual state tax tables
    periods = {'weekly': 52, 'biweekly': 26, 'semimonthly': 24, 'monthly': 12}
    annual = taxable * periods.get(pay_frequency, 26)
    
    # Allowance value per year (approximate)
    allowance_value = 4000  # Simplified
    taxable_annual = max(0, annual - (allowances * allowance_value))
    
    # Estimated state rate (simplified - use actual tables in production)
    estimated_rates = {
        'CA': 0.0725,
        'NY': 0.0685,
        'NJ': 0.0637,
        'MA': 0.05,
        'OH': 0.04,
        'CO': 0.044,
    }
    
    rate = estimated_rates.get(state, 0.05)
    annual_tax = taxable_annual * rate
    period_withholding = annual_tax / periods.get(pay_frequency, 26)
    
    return jsonify({
        'success': True,
        'state': state,
        'taxable_wages': taxable,
        'annual_taxable': taxable_annual,
        'allowances': allowances,
        'estimated_rate': rate,
        'withholding': round(period_withholding + additional, 2),
        'additional': additional,
        'method': 'estimated_graduated',
        'note': 'Use actual state tax tables for production'
    })
