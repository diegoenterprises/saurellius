"""
REGULATORY FILING ROUTES
API endpoints for government form submission and compliance
IRS, SSA, State, and Local filing endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from services.regulatory_filing_service import regulatory_filing_service

regulatory_bp = Blueprint('regulatory_filing', __name__, url_prefix='/api/regulatory')


# ============================================================================
# IRS FIRE SYSTEM - 1099 Filing
# ============================================================================

@regulatory_bp.route('/irs/1099/submit', methods=['POST'])
@jwt_required()
def submit_1099_forms():
    """Submit 1099 forms to IRS FIRE system."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    forms = data.get('forms', [])
    tax_year = data.get('tax_year', datetime.utcnow().year - 1)
    is_correction = data.get('is_correction', False)
    
    if not forms:
        return jsonify({'success': False, 'error': 'No 1099 forms provided'}), 400
    
    result = regulatory_filing_service.submit_1099_fire(
        company_id=company_id,
        forms=forms,
        tax_year=tax_year,
        is_correction=is_correction
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# SSA BSO - W-2/W-3 Filing
# ============================================================================

@regulatory_bp.route('/ssa/w2/submit', methods=['POST'])
@jwt_required()
def submit_w2_forms():
    """Submit W-2/W-3 forms to SSA BSO."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    w2_forms = data.get('w2_forms', [])
    w3_form = data.get('w3_form', {})
    tax_year = data.get('tax_year', datetime.utcnow().year - 1)
    
    if not w2_forms:
        return jsonify({'success': False, 'error': 'No W-2 forms provided'}), 400
    
    if not w3_form:
        return jsonify({'success': False, 'error': 'W-3 form required'}), 400
    
    result = regulatory_filing_service.submit_w2_ssa(
        company_id=company_id,
        w2_forms=w2_forms,
        w3_form=w3_form,
        tax_year=tax_year
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# EFTPS - Federal Tax Deposits
# ============================================================================

@regulatory_bp.route('/eftps/deposit', methods=['POST'])
@jwt_required()
def submit_eftps_deposit():
    """Submit federal tax deposit via EFTPS."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    ein = data.get('ein')
    deposit_type = data.get('deposit_type')  # 941, 944, 940
    amount = data.get('amount')
    tax_period = data.get('tax_period')
    settlement_date = data.get('settlement_date')
    
    if not all([ein, deposit_type, amount, tax_period]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    result = regulatory_filing_service.submit_eftps_deposit(
        company_id=company_id,
        ein=ein,
        deposit_type=deposit_type,
        amount=amount,
        tax_period=tax_period,
        settlement_date=settlement_date
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@regulatory_bp.route('/eftps/schedule', methods=['GET'])
@jwt_required()
def get_deposit_schedule():
    """Get FICA deposit schedule requirements."""
    return jsonify({
        'success': True,
        'schedules': {
            'monthly': {
                'description': 'Deposit by 15th of following month',
                'threshold': 'Total tax liability under $50,000 in lookback period',
                'example': 'January taxes due by February 15'
            },
            'semi_weekly': {
                'description': 'Deposit within 3 business days',
                'threshold': 'Total tax liability $50,000 or more in lookback period',
                'rules': [
                    'Wednesday, Thursday, Friday paydays: Deposit by following Wednesday',
                    'Saturday, Sunday, Monday, Tuesday paydays: Deposit by following Friday'
                ]
            },
            'next_day': {
                'description': 'Deposit by next business day',
                'threshold': 'Accumulated $100,000 or more in taxes on any day',
                'note': 'Immediately becomes semi-weekly depositor for rest of year and next year'
            }
        }
    })


# ============================================================================
# STATE FILINGS
# ============================================================================

@regulatory_bp.route('/state/submit', methods=['POST'])
@jwt_required()
def submit_state_filing():
    """Submit state tax filing."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    state = data.get('state')
    filing_type = data.get('filing_type')
    tax_period = data.get('tax_period')
    filing_data = data.get('data', {})
    
    if not all([state, filing_type, tax_period]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    result = regulatory_filing_service.submit_state_filing(
        company_id=company_id,
        state=state,
        filing_type=filing_type,
        tax_period=tax_period,
        data=filing_data
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@regulatory_bp.route('/state/new-hire', methods=['POST'])
@jwt_required()
def submit_new_hire_report():
    """Submit new hire report to state."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    state = data.get('state')
    employee_data = data.get('employee', {})
    
    if not state or not employee_data:
        return jsonify({'success': False, 'error': 'State and employee data required'}), 400
    
    result = regulatory_filing_service.submit_state_new_hire(
        company_id=company_id,
        state=state,
        employee_data=employee_data
    )
    
    return jsonify(result)


@regulatory_bp.route('/state/unemployment', methods=['POST'])
@jwt_required()
def submit_suta():
    """Submit state unemployment (SUTA) quarterly report."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    state = data.get('state')
    quarter = data.get('quarter')
    year = data.get('year', datetime.utcnow().year)
    filing_data = data.get('data', {})
    
    if not all([state, quarter]):
        return jsonify({'success': False, 'error': 'State and quarter required'}), 400
    
    result = regulatory_filing_service.submit_state_unemployment(
        company_id=company_id,
        state=state,
        quarter=quarter,
        year=year,
        data=filing_data
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


@regulatory_bp.route('/state/requirements/<state>', methods=['GET'])
@jwt_required()
def get_state_requirements(state):
    """Get state-specific filing requirements."""
    requirements = regulatory_filing_service.get_state_requirements(state.upper())
    
    return jsonify({
        'success': True,
        'requirements': requirements
    })


@regulatory_bp.route('/state/agencies', methods=['GET'])
def get_all_state_agencies():
    """Get all state tax agency information."""
    return jsonify({
        'success': True,
        'agencies': regulatory_filing_service.STATE_AGENCIES
    })


# ============================================================================
# LOCAL/MUNICIPAL FILINGS
# ============================================================================

@regulatory_bp.route('/local/submit', methods=['POST'])
@jwt_required()
def submit_local_filing():
    """Submit local/municipal tax filing."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    jurisdiction = data.get('jurisdiction')
    jurisdiction_type = data.get('jurisdiction_type')
    filing_type = data.get('filing_type')
    tax_period = data.get('tax_period')
    filing_data = data.get('data', {})
    
    if not all([jurisdiction, filing_type, tax_period]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    result = regulatory_filing_service.submit_local_filing(
        company_id=company_id,
        jurisdiction=jurisdiction,
        jurisdiction_type=jurisdiction_type or 'city',
        filing_type=filing_type,
        tax_period=tax_period,
        data=filing_data
    )
    
    return jsonify(result)


# ============================================================================
# FILING CALENDAR & DEADLINES
# ============================================================================

@regulatory_bp.route('/calendar', methods=['GET'])
@jwt_required()
def get_filing_calendar():
    """Get filing calendar for the year."""
    user_id = get_jwt_identity()
    
    company_id = request.args.get('company_id')
    year = request.args.get('year', datetime.utcnow().year, type=int)
    states = request.args.getlist('states')
    
    calendar = regulatory_filing_service.get_filing_calendar(
        company_id=company_id,
        year=year,
        states=states if states else None
    )
    
    return jsonify({
        'success': True,
        **calendar
    })


@regulatory_bp.route('/deadlines', methods=['GET'])
@jwt_required()
def get_upcoming_deadlines():
    """Get upcoming filing deadlines."""
    user_id = get_jwt_identity()
    
    company_id = request.args.get('company_id')
    days_ahead = request.args.get('days', 30, type=int)
    
    deadlines = regulatory_filing_service.get_upcoming_deadlines(
        company_id=company_id,
        days_ahead=days_ahead
    )
    
    return jsonify({
        'success': True,
        'deadlines': deadlines,
        'count': len(deadlines)
    })


# ============================================================================
# COMPLIANCE VERIFICATION
# ============================================================================

@regulatory_bp.route('/compliance/verify', methods=['GET'])
@jwt_required()
def verify_compliance():
    """Verify compliance status for a company."""
    user_id = get_jwt_identity()
    
    company_id = request.args.get('company_id')
    year = request.args.get('year', datetime.utcnow().year, type=int)
    
    if not company_id:
        return jsonify({'success': False, 'error': 'Company ID required'}), 400
    
    result = regulatory_filing_service.verify_compliance(
        company_id=company_id,
        year=year
    )
    
    return jsonify({
        'success': True,
        **result
    })


@regulatory_bp.route('/compliance/audit-trail', methods=['GET'])
@jwt_required()
def get_audit_trail():
    """Get audit trail for company filings."""
    user_id = get_jwt_identity()
    
    company_id = request.args.get('company_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not company_id:
        return jsonify({'success': False, 'error': 'Company ID required'}), 400
    
    trail = regulatory_filing_service.get_audit_trail(
        company_id=company_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return jsonify({
        'success': True,
        'audit_trail': trail,
        'count': len(trail)
    })


# ============================================================================
# FILING STATUS & HISTORY
# ============================================================================

@regulatory_bp.route('/filings/<filing_id>', methods=['GET'])
@jwt_required()
def get_filing_status(filing_id):
    """Get status of a specific filing."""
    filing = regulatory_filing_service.get_filing_status(filing_id)
    
    if not filing:
        return jsonify({'success': False, 'error': 'Filing not found'}), 404
    
    return jsonify({
        'success': True,
        'filing': filing
    })


@regulatory_bp.route('/filings', methods=['GET'])
@jwt_required()
def get_filing_history():
    """Get filing history for a company."""
    user_id = get_jwt_identity()
    
    company_id = request.args.get('company_id')
    year = request.args.get('year', type=int)
    agency = request.args.get('agency')
    
    if not company_id:
        return jsonify({'success': False, 'error': 'Company ID required'}), 400
    
    filings = regulatory_filing_service.get_filing_history(
        company_id=company_id,
        year=year,
        agency=agency
    )
    
    return jsonify({
        'success': True,
        'filings': filings,
        'count': len(filings)
    })


# ============================================================================
# FORM 941 QUARTERLY FILING
# ============================================================================

@regulatory_bp.route('/irs/941/submit', methods=['POST'])
@jwt_required()
def submit_form_941():
    """Submit Form 941 quarterly filing."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    quarter = data.get('quarter')
    year = data.get('year', datetime.utcnow().year)
    form_data = data.get('data', {})
    
    if not quarter:
        return jsonify({'success': False, 'error': 'Quarter required'}), 400
    
    # Use existing tax filing service for form generation
    from services.government_forms_service import GovernmentFormsService
    gov_forms = GovernmentFormsService()
    
    # Generate form
    form_941 = gov_forms.generate_941(
        company=form_data.get('company', {}),
        quarter=quarter,
        tax_year=year,
        payroll_data=form_data.get('payroll_data', {})
    )
    
    return jsonify({
        'success': True,
        'form': form_941,
        'message': f'Form 941 generated for Q{quarter} {year}'
    })


# ============================================================================
# FORM 940 ANNUAL FILING
# ============================================================================

@regulatory_bp.route('/irs/940/submit', methods=['POST'])
@jwt_required()
def submit_form_940():
    """Submit Form 940 annual FUTA filing."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company_id = data.get('company_id')
    year = data.get('year', datetime.utcnow().year - 1)
    form_data = data.get('data', {})
    
    from services.tax_filing_service import SaurelliusTaxFiling
    tax_filing = SaurelliusTaxFiling(company_id)
    
    form_940 = tax_filing.generate_form_940(
        tax_year=year,
        payroll_data=form_data.get('payroll_data', {})
    )
    
    return jsonify({
        'success': True,
        'form': form_940,
        'message': f'Form 940 generated for {year}'
    })


# ============================================================================
# REFERENCE DATA
# ============================================================================

@regulatory_bp.route('/forms', methods=['GET'])
def get_supported_forms():
    """Get list of supported government forms."""
    return jsonify({
        'success': True,
        'federal_forms': {
            'W-2': {'name': 'Wage and Tax Statement', 'frequency': 'annual', 'agency': 'SSA', 'deadline': 'January 31'},
            'W-3': {'name': 'Transmittal of Wage and Tax Statements', 'frequency': 'annual', 'agency': 'SSA', 'deadline': 'January 31'},
            '1099-NEC': {'name': 'Nonemployee Compensation', 'frequency': 'annual', 'agency': 'IRS', 'deadline': 'January 31'},
            '1099-MISC': {'name': 'Miscellaneous Income', 'frequency': 'annual', 'agency': 'IRS', 'deadline': 'February 28'},
            '941': {'name': 'Employer Quarterly Federal Tax Return', 'frequency': 'quarterly', 'agency': 'IRS'},
            '940': {'name': 'Employer Annual Federal Unemployment Tax Return', 'frequency': 'annual', 'agency': 'IRS', 'deadline': 'January 31'},
            '944': {'name': 'Employer Annual Federal Tax Return', 'frequency': 'annual', 'agency': 'IRS', 'deadline': 'January 31'},
        },
        'state_forms': {
            'withholding': 'State income tax withholding return',
            'unemployment': 'State unemployment (SUTA) quarterly report',
            'new_hire': 'New hire reporting (within 20 days)',
            'annual_reconciliation': 'Annual wage reconciliation'
        },
        'local_forms': {
            'city_withholding': 'Municipal income tax withholding',
            'school_district': 'School district tax',
            'transit': 'Transit/transportation tax'
        }
    })


@regulatory_bp.route('/agencies', methods=['GET'])
def get_agencies():
    """Get list of filing agencies."""
    return jsonify({
        'success': True,
        'agencies': {
            'IRS': {
                'name': 'Internal Revenue Service',
                'url': 'https://www.irs.gov',
                'electronic_systems': ['FIRE', 'e-file', 'EFTPS']
            },
            'SSA': {
                'name': 'Social Security Administration',
                'url': 'https://www.ssa.gov',
                'electronic_systems': ['BSO (Business Services Online)']
            },
            'EFTPS': {
                'name': 'Electronic Federal Tax Payment System',
                'url': 'https://www.eftps.gov',
                'description': 'Federal tax deposits'
            }
        }
    })
