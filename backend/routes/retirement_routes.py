# Retirement & 401(k) Administration Routes
# 401(k) management, contributions, vesting, loans

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

retirement_bp = Blueprint('retirement', __name__)

# In-memory storage
retirement_plans = {}
employee_enrollments = {}
contributions = {}
loans = {}


@retirement_bp.route('/api/retirement/plans', methods=['GET'])
@jwt_required()
def get_retirement_plans():
    """Get company retirement plans."""
    company_id = request.args.get('company_id')
    plans = [p for p in retirement_plans.values() if p.get('company_id') == company_id]
    return jsonify({'success': True, 'plans': plans}), 200


@retirement_bp.route('/api/retirement/plans', methods=['POST'])
@jwt_required()
def create_retirement_plan():
    """Create a new retirement plan."""
    data = request.get_json()
    plan_id = str(uuid.uuid4())
    
    plan = {
        'id': plan_id,
        'company_id': data.get('company_id'),
        'name': data.get('name'),
        'type': data.get('type', '401k'),
        'provider': data.get('provider'),
        'employer_match': {
            'enabled': data.get('match_enabled', True),
            'percentage': data.get('match_percentage', 100),
            'up_to_percentage': data.get('match_up_to', 6),
            'vesting_schedule': data.get('vesting_schedule', 'immediate')
        },
        'contribution_limits': {
            'employee_annual': 23500,
            'catch_up_50_plus': 7500,
            'employer_annual': 46500
        },
        'eligibility': {
            'waiting_period_days': data.get('waiting_period', 90),
            'minimum_age': data.get('minimum_age', 21),
            'minimum_hours': data.get('minimum_hours', 1000)
        },
        'auto_enrollment': data.get('auto_enrollment', False),
        'auto_escalation': data.get('auto_escalation', False),
        'status': 'active',
        'created_at': datetime.now().isoformat()
    }
    
    retirement_plans[plan_id] = plan
    return jsonify({'success': True, 'plan': plan}), 201


@retirement_bp.route('/api/retirement/enrollments', methods=['GET'])
@jwt_required()
def get_enrollments():
    """Get employee enrollments."""
    employee_id = request.args.get('employee_id')
    plan_id = request.args.get('plan_id')
    
    enrollments = list(employee_enrollments.values())
    if employee_id:
        enrollments = [e for e in enrollments if e.get('employee_id') == employee_id]
    if plan_id:
        enrollments = [e for e in enrollments if e.get('plan_id') == plan_id]
    
    return jsonify({'success': True, 'enrollments': enrollments}), 200


@retirement_bp.route('/api/retirement/enrollments', methods=['POST'])
@jwt_required()
def create_enrollment():
    """Enroll employee in retirement plan."""
    data = request.get_json()
    enrollment_id = str(uuid.uuid4())
    
    enrollment = {
        'id': enrollment_id,
        'employee_id': data.get('employee_id'),
        'plan_id': data.get('plan_id'),
        'contribution_type': data.get('contribution_type', 'percentage'),
        'contribution_amount': data.get('contribution_amount', 6),
        'roth_contribution': data.get('roth_contribution', 0),
        'catch_up_eligible': data.get('catch_up_eligible', False),
        'investment_elections': data.get('investment_elections', []),
        'beneficiaries': data.get('beneficiaries', []),
        'vesting_percentage': 0,
        'status': 'active',
        'enrolled_at': datetime.now().isoformat()
    }
    
    employee_enrollments[enrollment_id] = enrollment
    return jsonify({'success': True, 'enrollment': enrollment}), 201


@retirement_bp.route('/api/retirement/contributions', methods=['GET'])
@jwt_required()
def get_contributions():
    """Get contribution history."""
    employee_id = request.args.get('employee_id')
    year = request.args.get('year', datetime.now().year)
    
    contribs = [c for c in contributions.values() 
                if c.get('employee_id') == employee_id and c.get('year') == int(year)]
    
    total_employee = sum(c.get('employee_amount', 0) for c in contribs)
    total_employer = sum(c.get('employer_amount', 0) for c in contribs)
    
    return jsonify({
        'success': True,
        'contributions': contribs,
        'ytd_employee': total_employee,
        'ytd_employer': total_employer,
        'ytd_total': total_employee + total_employer
    }), 200


@retirement_bp.route('/api/retirement/loans', methods=['GET'])
@jwt_required()
def get_loans():
    """Get 401(k) loans."""
    employee_id = request.args.get('employee_id')
    loans_list = [l for l in loans.values() if l.get('employee_id') == employee_id]
    return jsonify({'success': True, 'loans': loans_list}), 200


@retirement_bp.route('/api/retirement/loans', methods=['POST'])
@jwt_required()
def request_loan():
    """Request a 401(k) loan."""
    data = request.get_json()
    loan_id = str(uuid.uuid4())
    
    loan = {
        'id': loan_id,
        'employee_id': data.get('employee_id'),
        'plan_id': data.get('plan_id'),
        'amount': data.get('amount'),
        'term_months': data.get('term_months', 60),
        'interest_rate': data.get('interest_rate', 5.5),
        'purpose': data.get('purpose'),
        'status': 'pending',
        'requested_at': datetime.now().isoformat()
    }
    
    loans[loan_id] = loan
    return jsonify({'success': True, 'loan': loan}), 201


@retirement_bp.route('/api/retirement/vesting/<employee_id>', methods=['GET'])
@jwt_required()
def get_vesting_status(employee_id):
    """Get vesting status for an employee."""
    vesting = {
        'employee_id': employee_id,
        'years_of_service': 3.5,
        'vesting_percentage': 60,
        'vested_balance': 45000,
        'unvested_balance': 30000,
        'schedule': [
            {'year': 1, 'percentage': 0},
            {'year': 2, 'percentage': 20},
            {'year': 3, 'percentage': 40},
            {'year': 4, 'percentage': 60},
            {'year': 5, 'percentage': 80},
            {'year': 6, 'percentage': 100}
        ],
        'next_vesting_date': '2025-06-15',
        'next_vesting_percentage': 80
    }
    return jsonify({'success': True, 'vesting': vesting}), 200
