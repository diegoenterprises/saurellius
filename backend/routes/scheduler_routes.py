"""
Saurellius Scheduler API Routes
Endpoints for tax update scheduling, rate changes, and compliance deadlines.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date, datetime
from services.scheduler_service import get_scheduler

scheduler_bp = Blueprint('scheduler', __name__, url_prefix='/api/scheduler')


@scheduler_bp.route('/status', methods=['GET'])
@jwt_required()
def get_scheduler_status():
    """
    Get the current status of the tax update scheduler.
    
    Returns:
        - Scheduler running status
        - Last update check timestamp
        - Current tax year and rates
        - Number of pending updates
        - Scheduled jobs
    """
    scheduler = get_scheduler()
    status = scheduler.get_status()
    
    return jsonify({
        'success': True,
        'data': status
    })


@scheduler_bp.route('/current-rates', methods=['GET'])
@jwt_required()
def get_current_rates():
    """
    Get the current effective federal tax rates.
    Automatically returns rates for the current date.
    """
    scheduler = get_scheduler()
    
    # Optional: get rates for a specific date
    as_of = request.args.get('as_of')
    if as_of:
        try:
            as_of_date = datetime.strptime(as_of, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        as_of_date = date.today()
    
    rates = scheduler.get_effective_federal_rates(as_of_date)
    
    return jsonify({
        'success': True,
        'as_of_date': as_of_date.isoformat(),
        'tax_year': as_of_date.year,
        'federal_rates': {
            'social_security': {
                'rate': rates['social_security_rate'],
                'wage_base': rates['social_security_wage_base']
            },
            'medicare': {
                'rate': rates['medicare_rate'],
                'additional_rate': rates['additional_medicare_rate'],
                'additional_threshold': rates['additional_medicare_threshold']
            },
            'futa': {
                'rate': rates['futa_rate'],
                'wage_base': rates['futa_wage_base']
            },
            'standard_deductions': rates['standard_deductions'],
            'tax_brackets': {
                filing_status: [
                    {'threshold': bracket[0], 'rate': bracket[1]}
                    for bracket in brackets
                ]
                for filing_status, brackets in rates['federal_brackets'].items()
            }
        }
    })


@scheduler_bp.route('/current-rates/state/<state_code>', methods=['GET'])
@jwt_required()
def get_current_state_rates(state_code: str):
    """
    Get the current effective state-specific rates.
    Includes SDI, PFML, and other state-specific taxes.
    """
    scheduler = get_scheduler()
    state_code = state_code.upper()
    
    as_of = request.args.get('as_of')
    if as_of:
        try:
            as_of_date = datetime.strptime(as_of, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        as_of_date = date.today()
    
    rates = scheduler.get_effective_state_rates(state_code, as_of_date)
    minimum_wage = scheduler.get_effective_minimum_wage(state_code, as_of_date)
    
    return jsonify({
        'success': True,
        'state': state_code,
        'as_of_date': as_of_date.isoformat(),
        'rates': rates,
        'minimum_wage': minimum_wage
    })


@scheduler_bp.route('/pending-updates', methods=['GET'])
@jwt_required()
def get_pending_updates():
    """
    Get all pending rate changes that will take effect in the future.
    Includes federal, state, and minimum wage updates.
    """
    scheduler = get_scheduler()
    pending = scheduler.get_pending_rate_changes()
    
    return jsonify({
        'success': True,
        'count': len(pending),
        'pending_updates': pending
    })


@scheduler_bp.route('/deadlines', methods=['GET'])
@jwt_required()
def get_upcoming_deadlines():
    """
    Get upcoming compliance deadlines.
    
    Query params:
        - days: Number of days ahead to look (default: 30)
    """
    scheduler = get_scheduler()
    days = request.args.get('days', 30, type=int)
    
    deadlines = scheduler.get_upcoming_deadlines(days_ahead=days)
    
    return jsonify({
        'success': True,
        'days_ahead': days,
        'count': len(deadlines),
        'deadlines': deadlines
    })


@scheduler_bp.route('/check-updates', methods=['POST'])
@jwt_required()
def trigger_update_check():
    """
    Manually trigger a check for tax updates.
    Admin only endpoint.
    """
    scheduler = get_scheduler()
    result = scheduler.check_and_apply_updates()
    
    return jsonify({
        'success': True,
        'message': 'Update check completed',
        'result': result
    })


@scheduler_bp.route('/minimum-wage/<state_code>', methods=['GET'])
@jwt_required()
def get_minimum_wage(state_code: str):
    """
    Get the current minimum wage for a state.
    """
    scheduler = get_scheduler()
    state_code = state_code.upper()
    
    as_of = request.args.get('as_of')
    if as_of:
        try:
            as_of_date = datetime.strptime(as_of, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        as_of_date = date.today()
    
    rate = scheduler.get_effective_minimum_wage(state_code, as_of_date)
    
    return jsonify({
        'success': True,
        'state': state_code,
        'as_of_date': as_of_date.isoformat(),
        'minimum_wage': rate,
        'federal_minimum': 7.25
    })


@scheduler_bp.route('/tax-year/<int:year>', methods=['GET'])
@jwt_required()
def get_tax_year_info(year: int):
    """
    Get tax year information including key dates and rates.
    """
    scheduler = get_scheduler()
    
    if year not in scheduler.federal_rates_by_year:
        return jsonify({
            'error': f'Tax year {year} not available',
            'available_years': list(scheduler.federal_rates_by_year.keys())
        }), 404
    
    rates = scheduler.federal_rates_by_year[year]
    dates = scheduler.tax_year_dates.get(year, {})
    
    return jsonify({
        'success': True,
        'tax_year': year,
        'key_dates': {
            k: v.isoformat() if isinstance(v, date) else v 
            for k, v in dates.items()
        },
        'social_security_wage_base': rates['social_security_wage_base'],
        'standard_deductions': rates['standard_deductions'],
        'bracket_count': len(rates['federal_brackets']['single'])
    })


@scheduler_bp.route('/calendar/<int:year>', methods=['GET'])
@jwt_required()
def get_tax_calendar(year: int):
    """
    Get the full tax calendar for a year with all deadlines.
    """
    scheduler = get_scheduler()
    
    # Filter deadlines for the specified year
    year_deadlines = [
        d for d in scheduler.compliance_deadlines
        if d['deadline'].year == year or 
           (d['deadline'].year == year + 1 and d['deadline'].month <= 3)
    ]
    
    # Sort by date
    year_deadlines.sort(key=lambda x: x['deadline'])
    
    # Format for response
    calendar = [
        {
            'form': d['form'],
            'quarter': d['quarter'],
            'deadline': d['deadline'].isoformat(),
            'description': d['description']
        }
        for d in year_deadlines
    ]
    
    return jsonify({
        'success': True,
        'tax_year': year,
        'deadline_count': len(calendar),
        'calendar': calendar
    })
