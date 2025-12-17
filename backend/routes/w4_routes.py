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

from models import FederalW4Form, StateWithholdingForm, db
from services.production_tax_engine import production_tax_engine

w4_bp = Blueprint('w4', __name__, url_prefix='/api/w4')


def _normalize_federal_filing_status(status: str) -> str:
    mapping = {
        'single': 'single',
        'married_jointly': 'married_filing_jointly',
        'married_separately': 'married_filing_separately',
        'head_of_household': 'head_of_household',
        'qualifying_surviving_spouse': 'married_filing_jointly',
    }
    return mapping.get(status, 'single')


def _parse_iso_date(value: str) -> date:
    return datetime.fromisoformat(value).date()


@w4_bp.route('/employee/<employee_id>', methods=['GET'])
@jwt_required()
def get_employee_w4(employee_id):
    """Get current W-4 for an employee"""
    w4 = (
        FederalW4Form.query.filter(FederalW4Form.employee_id == int(employee_id))
        .filter(FederalW4Form.status == 'active')
        .order_by(FederalW4Form.submitted_at.desc())
        .first()
    )

    if not w4:
        return jsonify({
            'success': True,
            'w4': None,
            'message': 'No W-4 on file'
        })

    return jsonify({'success': True, 'w4': w4.to_dict()})


@w4_bp.route('/employee/<employee_id>/history', methods=['GET'])
@jwt_required()
def get_employee_w4_history(employee_id):
    """Get W-4 history for an employee"""
    history = (
        FederalW4Form.query.filter(FederalW4Form.employee_id == int(employee_id))
        .order_by(FederalW4Form.submitted_at.desc())
        .all()
    )

    return jsonify({'success': True, 'history': [h.to_dict() for h in history]})


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

    valid_statuses = ['single', 'married_jointly', 'married_separately', 
                      'head_of_household', 'qualifying_surviving_spouse']
    if data['filing_status'] not in valid_statuses:
        return jsonify({
            'success': False,
            'message': f'Invalid filing status. Must be one of: {valid_statuses}'
        }), 400

    employee_id = int(data['employee_id'])

    active = (
        FederalW4Form.query.filter(FederalW4Form.employee_id == employee_id)
        .filter(FederalW4Form.status == 'active')
        .all()
    )
    for form in active:
        form.status = 'superseded'
        form.superseded_at = datetime.utcnow()

    # Check for exempt status
    is_exempt = data.get('claim_exempt', False)
    exempt_expiration = None
    if is_exempt:
        # Exempt expires Feb 15 of next year
        current_year = date.today().year
        exempt_expiration = date.fromisoformat(f"{current_year + 1}-02-15")

    effective_date = _parse_iso_date(data.get('effective_date', date.today().isoformat()))
    signature_date = _parse_iso_date(data.get('signature_date', date.today().isoformat()))

    w4 = FederalW4Form(
        employee_id=employee_id,
        submitted_by=int(user_id),
        tax_year=int(data.get('tax_year', date.today().year)),
        status='active',
        filing_status=data['filing_status'],
        step2_checkbox=bool(data.get('step2_checkbox', False)),
        step2_additional=float(data.get('step2_additional', 0) or 0),
        qualifying_children=int(data.get('qualifying_children', 0) or 0),
        other_dependents=int(data.get('other_dependents', 0) or 0),
        other_income=float(data.get('other_income', 0) or 0),
        deductions=float(data.get('deductions', 0) or 0),
        extra_withholding=float(data.get('extra_withholding', 0) or 0),
        claim_exempt=bool(is_exempt),
        exempt_expiration=exempt_expiration,
        effective_date=effective_date,
        signature=data.get('signature'),
        signature_date=signature_date,
    )

    db.session.add(w4)
    db.session.commit()

    return jsonify({
        'success': True,
        'w4': w4.to_dict(),
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
    pay_frequency = data['pay_frequency']
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
    claim_exempt = bool(data.get('claim_exempt', False))

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

    dependent_credit = (qualifying_children * 2000) + (other_dependents * 500)

    w4_calc = {
        'dependents_amount': dependent_credit,
        'other_income': other_income,
        'deductions': deductions,
        'extra_withholding': extra_withholding,
        'exempt': claim_exempt,
    }

    fit = production_tax_engine.calculate_federal_income_tax(
        gross_wages=taxable_pay,
        pay_frequency=pay_frequency,
        filing_status=_normalize_federal_filing_status(filing_status),
        w4_data=w4_calc,
        ytd_gross=float(data.get('ytd_gross', 0) or 0),
    )

    period_withholding = float(fit.get('per_period_tax', 0) or 0)
    total_withholding = period_withholding

    return jsonify({
        'success': True,
        'calculation': {
            'gross_pay': gross_pay,
            'pre_tax_deductions': pre_tax_deductions,
            'taxable_pay': taxable_pay,
            'annual_wages': float(fit.get('adjusted_wages', 0) or 0),
            'standard_deduction': float(fit.get('standard_deduction', 0) or 0),
            'additional_deductions': deductions,
            'taxable_income': float(fit.get('adjusted_wages', 0) or 0),
            'dependent_credit': dependent_credit,
            'annual_tax': float(fit.get('annual_tax', 0) or 0),
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

    if not employee_id:
        return jsonify({'success': False, 'message': 'Missing required field: employee_id'}), 400

    w4 = (
        FederalW4Form.query.filter(FederalW4Form.employee_id == int(employee_id))
        .filter(FederalW4Form.status == 'active')
        .order_by(FederalW4Form.submitted_at.desc())
        .first()
    )

    if not w4:
        return jsonify({
            'success': True,
            'exempt': False,
            'message': 'No active W-4 found'
        })

    if not w4.claim_exempt:
        return jsonify({
            'success': True,
            'exempt': False,
            'message': 'Employee does not claim exempt'
        })

    expiration = w4.exempt_expiration
    if expiration and expiration < date.today():
        return jsonify({
            'success': True,
            'exempt': False,
            'expired': True,
            'message': 'Exempt status expired. Employee must recertify or withholding will resume.'
        })

    return jsonify({
        'success': True,
        'exempt': True,
        'expiration': expiration.isoformat() if expiration else None,
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

    employee_id = int(data['employee_id'])
    active = (
        StateWithholdingForm.query.filter(StateWithholdingForm.employee_id == employee_id)
        .filter(StateWithholdingForm.state == state)
        .filter(StateWithholdingForm.status == 'active')
        .all()
    )
    for form in active:
        form.status = 'superseded'
        form.superseded_at = datetime.utcnow()

    effective_date = _parse_iso_date(data.get('effective_date', date.today().isoformat()))

    state_form = StateWithholdingForm(
        employee_id=employee_id,
        submitted_by=int(user_id),
        state=state,
        form_name=template.get('form_name', f'{state} State Withholding'),
        status='active',
        filing_status=data.get('filing_status', 'single'),
        allowances=int(data.get('allowances', 0) or 0),
        additional_withholding=float(data.get('additional_withholding', 0) or 0),
        claim_exempt=bool(data.get('claim_exempt', False)),
        nyc_resident=bool(data.get('nyc_resident', False)),
        yonkers_resident=bool(data.get('yonkers_resident', False)),
        local_tax_jurisdiction=data.get('local_tax_jurisdiction'),
        effective_date=effective_date,
    )

    db.session.add(state_form)
    db.session.commit()

    return jsonify({
        'success': True,
        'state_form': state_form.to_dict(),
        'message': f'{state} withholding form submitted successfully'
    }), 201


@w4_bp.route('/state/employee/<employee_id>', methods=['GET'])
@jwt_required()
def get_employee_state_forms(employee_id):
    """Get all state withholding forms for an employee"""
    forms = (
        StateWithholdingForm.query.filter(StateWithholdingForm.employee_id == int(employee_id))
        .filter(StateWithholdingForm.status == 'active')
        .order_by(StateWithholdingForm.submitted_at.desc())
        .all()
    )

    return jsonify({'success': True, 'state_forms': [f.to_dict() for f in forms]})


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
    allowances = int(data.get('allowances', 0) or 0)
    additional = float(data.get('additional_withholding', 0) or 0)
    pre_tax = float(data.get('pre_tax_deductions', 0) or 0)

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

    state_calc = production_tax_engine.calculate_state_income_tax(
        state=state,
        gross_wages=taxable,
        pay_frequency=pay_frequency,
        filing_status=filing_status,
        allowances=allowances,
        additional_withholding=additional,
        ytd_gross=float(data.get('ytd_gross', 0) or 0),
    )

    return jsonify({
        'success': True,
        'state': state,
        'taxable_wages': taxable,
        'allowances': allowances,
        'withholding': float(state_calc.get('tax', 0) or 0),
        'additional': additional,
        'method': 'engine'
    })
