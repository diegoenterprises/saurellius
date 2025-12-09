"""
SAURELLIUS BENEFITS API ROUTES
Complete benefits administration endpoints including:
- Plan Management
- Enrollment & Waiver
- Dependent Management
- Life Events
- COBRA Administration
- Benefits Summary & Calculations
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date, datetime

from services.benefits_service import (
    benefits_service,
    BenefitType,
    CoverageLevel,
    EnrollmentStatus,
    LifeEvent,
    INSURANCE_CARRIERS,
    MEDICAL_PLANS,
    DENTAL_PLANS,
    VISION_PLANS,
    LIFE_INSURANCE_OPTIONS,
    DISABILITY_PLANS,
    RETIREMENT_PLANS,
    FSA_HSA_LIMITS,
    COBRA_RULES
)

benefits_bp = Blueprint('benefits', __name__, url_prefix='/api/benefits')


# =============================================================================
# PLAN MANAGEMENT
# =============================================================================

@benefits_bp.route('/plans', methods=['GET'])
@jwt_required()
def get_available_plans():
    """Get all available benefit plans."""
    benefit_type = request.args.get('type')
    company_id = request.args.get('company_id', 1, type=int)
    
    plans = benefits_service.get_available_plans(company_id, benefit_type)
    
    return jsonify({
        "success": True,
        "plans": plans,
        "count": len(plans)
    })


@benefits_bp.route('/plans/<plan_id>', methods=['GET'])
@jwt_required()
def get_plan_details(plan_id):
    """Get detailed information about a specific plan."""
    plan = benefits_service.get_plan_details(plan_id)
    
    if not plan:
        return jsonify({"success": False, "error": "Plan not found"}), 404
    
    return jsonify({
        "success": True,
        "plan": plan
    })


@benefits_bp.route('/plans/<plan_id>/costs', methods=['GET'])
@jwt_required()
def get_plan_costs(plan_id):
    """Calculate costs for a specific plan and coverage level."""
    coverage_level = request.args.get('coverage_level', 'employee_only')
    annual_salary = request.args.get('annual_salary', type=float)
    
    costs = benefits_service.get_plan_costs(plan_id, coverage_level, annual_salary)
    
    if "error" in costs:
        return jsonify({"success": False, "error": costs["error"]}), 404
    
    return jsonify({
        "success": True,
        "costs": costs
    })


@benefits_bp.route('/plans/compare', methods=['POST'])
@jwt_required()
def compare_plans():
    """Compare multiple plans side by side."""
    data = request.get_json()
    plan_ids = data.get('plan_ids', [])
    coverage_level = data.get('coverage_level', 'employee_only')
    
    comparisons = []
    for plan_id in plan_ids:
        plan = benefits_service.get_plan_details(plan_id)
        costs = benefits_service.get_plan_costs(plan_id, coverage_level)
        if plan:
            comparisons.append({
                "plan": plan,
                "costs": costs
            })
    
    return jsonify({
        "success": True,
        "comparisons": comparisons,
        "coverage_level": coverage_level
    })


# =============================================================================
# ENROLLMENT MANAGEMENT
# =============================================================================

@benefits_bp.route('/enroll', methods=['POST'])
@jwt_required()
def enroll_in_plan():
    """Enroll an employee in a benefit plan."""
    data = request.get_json()
    
    employee_id = data.get('employee_id')
    plan_id = data.get('plan_id')
    coverage_level = data.get('coverage_level', 'employee_only')
    effective_date_str = data.get('effective_date')
    dependents = data.get('dependents', [])
    election_details = data.get('election_details', {})
    
    if not all([employee_id, plan_id]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
    
    # Parse effective date
    if effective_date_str:
        effective_date = datetime.strptime(effective_date_str, '%Y-%m-%d').date()
    else:
        effective_date = date.today()
    
    result = benefits_service.enroll_employee(
        employee_id=employee_id,
        plan_id=plan_id,
        coverage_level=coverage_level,
        effective_date=effective_date,
        dependents=dependents,
        election_details=election_details
    )
    
    if not result["success"]:
        return jsonify(result), 400
    
    return jsonify(result), 201


@benefits_bp.route('/waive', methods=['POST'])
@jwt_required()
def waive_coverage():
    """Waive coverage for a benefit plan."""
    data = request.get_json()
    
    employee_id = data.get('employee_id')
    plan_id = data.get('plan_id')
    reason = data.get('reason')
    
    if not all([employee_id, plan_id]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
    
    result = benefits_service.waive_coverage(employee_id, plan_id, reason)
    
    return jsonify(result)


@benefits_bp.route('/enrollments', methods=['GET'])
@jwt_required()
def get_employee_enrollments():
    """Get all enrollments for an employee."""
    employee_id = request.args.get('employee_id', type=int)
    
    if not employee_id:
        # Get current user's enrollments
        employee_id = get_jwt_identity()
    
    enrollments = benefits_service.get_employee_enrollments(employee_id)
    
    return jsonify({
        "success": True,
        "enrollments": enrollments,
        "count": len(enrollments)
    })


@benefits_bp.route('/enrollments/<enrollment_id>/terminate', methods=['POST'])
@jwt_required()
def terminate_enrollment(enrollment_id):
    """Terminate a benefit enrollment."""
    data = request.get_json()
    
    termination_date_str = data.get('termination_date')
    reason = data.get('reason', 'employment_termination')
    
    if termination_date_str:
        termination_date = datetime.strptime(termination_date_str, '%Y-%m-%d').date()
    else:
        termination_date = date.today()
    
    result = benefits_service.terminate_enrollment(enrollment_id, termination_date, reason)
    
    if not result["success"]:
        return jsonify(result), 404
    
    return jsonify(result)


# =============================================================================
# DEPENDENT MANAGEMENT
# =============================================================================

@benefits_bp.route('/dependents', methods=['GET'])
@jwt_required()
def get_dependents():
    """Get all dependents for an employee."""
    employee_id = request.args.get('employee_id', type=int)
    
    if not employee_id:
        employee_id = get_jwt_identity()
    
    dependents = benefits_service.get_employee_dependents(employee_id)
    
    return jsonify({
        "success": True,
        "dependents": dependents,
        "count": len(dependents)
    })


@benefits_bp.route('/dependents', methods=['POST'])
@jwt_required()
def add_dependent():
    """Add a dependent for an employee."""
    data = request.get_json()
    
    employee_id = data.get('employee_id')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    relationship = data.get('relationship')
    date_of_birth_str = data.get('date_of_birth')
    
    if not all([employee_id, first_name, last_name, relationship, date_of_birth_str]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
    
    date_of_birth = datetime.strptime(date_of_birth_str, '%Y-%m-%d').date()
    
    # Optional fields
    optional_fields = {}
    if 'ssn_last_four' in data:
        optional_fields['ssn_last_four'] = data['ssn_last_four']
    if 'gender' in data:
        optional_fields['gender'] = data['gender']
    if 'is_student' in data:
        optional_fields['is_student'] = data['is_student']
    if 'is_disabled' in data:
        optional_fields['is_disabled'] = data['is_disabled']
    
    result = benefits_service.add_dependent(
        employee_id=employee_id,
        first_name=first_name,
        last_name=last_name,
        relationship=relationship,
        date_of_birth=date_of_birth,
        **optional_fields
    )
    
    return jsonify(result), 201


@benefits_bp.route('/dependents/<dependent_id>', methods=['DELETE'])
@jwt_required()
def remove_dependent(dependent_id):
    """Remove a dependent."""
    result = benefits_service.remove_dependent(dependent_id)
    
    if not result["success"]:
        return jsonify(result), 404
    
    return jsonify(result)


# =============================================================================
# LIFE EVENTS
# =============================================================================

@benefits_bp.route('/life-events', methods=['GET'])
@jwt_required()
def get_life_events():
    """Get all life events for an employee."""
    employee_id = request.args.get('employee_id', type=int)
    
    if not employee_id:
        employee_id = get_jwt_identity()
    
    events = benefits_service.get_employee_life_events(employee_id)
    
    return jsonify({
        "success": True,
        "life_events": events,
        "count": len(events)
    })


@benefits_bp.route('/life-events', methods=['POST'])
@jwt_required()
def record_life_event():
    """Record a qualifying life event."""
    data = request.get_json()
    
    employee_id = data.get('employee_id')
    event_type = data.get('event_type')
    event_date_str = data.get('event_date')
    documentation = data.get('documentation', {})
    
    if not all([employee_id, event_type, event_date_str]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
    
    event_date = datetime.strptime(event_date_str, '%Y-%m-%d').date()
    
    result = benefits_service.record_life_event(
        employee_id=employee_id,
        event_type=event_type,
        event_date=event_date,
        documentation=documentation
    )
    
    return jsonify(result), 201


@benefits_bp.route('/life-events/types', methods=['GET'])
@jwt_required()
def get_life_event_types():
    """Get all qualifying life event types."""
    events = [
        {"type": e.value, "name": e.value.replace("_", " ").title()}
        for e in LifeEvent
    ]
    
    return jsonify({
        "success": True,
        "event_types": events
    })


# =============================================================================
# COBRA ADMINISTRATION
# =============================================================================

@benefits_bp.route('/cobra/initiate', methods=['POST'])
@jwt_required()
def initiate_cobra():
    """Initiate COBRA continuation coverage."""
    data = request.get_json()
    
    employee_id = data.get('employee_id')
    event_type = data.get('event_type')
    event_date_str = data.get('event_date')
    beneficiaries = data.get('beneficiaries', [])
    
    if not all([employee_id, event_type, event_date_str]):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
    
    event_date = datetime.strptime(event_date_str, '%Y-%m-%d').date()
    
    result = benefits_service.initiate_cobra(
        employee_id=employee_id,
        event_type=event_type,
        event_date=event_date,
        beneficiaries=beneficiaries
    )
    
    if not result["success"]:
        return jsonify(result), 400
    
    return jsonify(result), 201


@benefits_bp.route('/cobra/<event_id>/elect', methods=['POST'])
@jwt_required()
def elect_cobra(event_id):
    """Process COBRA election."""
    data = request.get_json()
    
    elected_plans = data.get('elected_plans', [])
    beneficiary_elections = data.get('beneficiary_elections', {})
    
    result = benefits_service.elect_cobra(
        event_id=event_id,
        elected_plans=elected_plans,
        beneficiary_elections=beneficiary_elections
    )
    
    if not result["success"]:
        return jsonify(result), 400
    
    return jsonify(result)


@benefits_bp.route('/cobra/status', methods=['GET'])
@jwt_required()
def get_cobra_status():
    """Get COBRA status for an employee."""
    employee_id = request.args.get('employee_id', type=int)
    
    if not employee_id:
        employee_id = get_jwt_identity()
    
    events = benefits_service.get_cobra_status(employee_id)
    
    return jsonify({
        "success": True,
        "cobra_events": events,
        "count": len(events)
    })


@benefits_bp.route('/cobra/rules', methods=['GET'])
@jwt_required()
def get_cobra_rules():
    """Get COBRA rules and requirements."""
    rules = benefits_service.get_cobra_rules()
    
    return jsonify({
        "success": True,
        "rules": rules
    })


# =============================================================================
# BENEFITS SUMMARY
# =============================================================================

@benefits_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_benefits_summary():
    """Get complete benefits summary for an employee."""
    employee_id = request.args.get('employee_id', type=int)
    
    if not employee_id:
        employee_id = get_jwt_identity()
    
    summary = benefits_service.get_benefits_summary(employee_id)
    
    return jsonify({
        "success": True,
        "summary": summary
    })


@benefits_bp.route('/deductions', methods=['GET'])
@jwt_required()
def get_benefit_deductions():
    """Get benefit deductions for payroll."""
    employee_id = request.args.get('employee_id', type=int)
    pay_frequency = request.args.get('pay_frequency', 'biweekly')
    
    if not employee_id:
        employee_id = get_jwt_identity()
    
    summary = benefits_service.get_benefits_summary(employee_id)
    
    # Calculate deductions based on pay frequency
    monthly_cost = summary["total_employee_cost_monthly"]
    
    if pay_frequency == 'weekly':
        deduction = monthly_cost * 12 / 52
    elif pay_frequency == 'biweekly':
        deduction = monthly_cost * 12 / 26
    elif pay_frequency == 'semimonthly':
        deduction = monthly_cost / 2
    else:  # monthly
        deduction = monthly_cost
    
    # Break down by type
    deductions = []
    for enrollment in summary["enrollments"]:
        if enrollment["status"] == "enrolled":
            emp_cost = enrollment["employee_contribution"]
            if pay_frequency == 'weekly':
                per_paycheck = emp_cost * 12 / 52
            elif pay_frequency == 'biweekly':
                per_paycheck = emp_cost * 12 / 26
            elif pay_frequency == 'semimonthly':
                per_paycheck = emp_cost / 2
            else:
                per_paycheck = emp_cost
            
            deductions.append({
                "plan_name": enrollment.get("plan_name", enrollment["plan_id"]),
                "benefit_type": enrollment.get("benefit_type"),
                "monthly_amount": emp_cost,
                "per_paycheck": round(per_paycheck, 2),
                "pre_tax": enrollment.get("benefit_type") in ["medical", "dental", "vision", "hsa", "fsa", "401k"]
            })
    
    return jsonify({
        "success": True,
        "employee_id": employee_id,
        "pay_frequency": pay_frequency,
        "total_deduction_per_paycheck": round(deduction, 2),
        "total_monthly": monthly_cost,
        "deductions": deductions
    })


# =============================================================================
# CARRIERS & REFERENCE DATA
# =============================================================================

@benefits_bp.route('/carriers', methods=['GET'])
@jwt_required()
def get_carriers():
    """Get available insurance carriers."""
    benefit_type = request.args.get('type')
    
    carriers = benefits_service.get_carriers(benefit_type)
    
    return jsonify({
        "success": True,
        "carriers": carriers,
        "count": len(carriers)
    })


@benefits_bp.route('/templates/<benefit_type>', methods=['GET'])
@jwt_required()
def get_plan_templates(benefit_type):
    """Get plan templates for a benefit type."""
    templates = benefits_service.get_plan_templates(benefit_type)
    
    return jsonify({
        "success": True,
        "benefit_type": benefit_type,
        "templates": templates
    })


@benefits_bp.route('/limits', methods=['GET'])
@jwt_required()
def get_contribution_limits():
    """Get current year contribution limits for FSA/HSA/401k."""
    limits = benefits_service.get_contribution_limits()
    
    return jsonify({
        "success": True,
        "year": 2025,
        "limits": limits
    })


@benefits_bp.route('/benefit-types', methods=['GET'])
@jwt_required()
def get_benefit_types():
    """Get all available benefit types."""
    types = [
        {"type": bt.value, "name": bt.value.replace("_", " ").title()}
        for bt in BenefitType
    ]
    
    return jsonify({
        "success": True,
        "benefit_types": types
    })


@benefits_bp.route('/coverage-levels', methods=['GET'])
@jwt_required()
def get_coverage_levels():
    """Get all coverage level options."""
    levels = [
        {"level": cl.value, "name": cl.value.replace("_", " ").title()}
        for cl in CoverageLevel
    ]
    
    return jsonify({
        "success": True,
        "coverage_levels": levels
    })


# =============================================================================
# OPEN ENROLLMENT
# =============================================================================

@benefits_bp.route('/open-enrollment/status', methods=['GET'])
@jwt_required()
def get_open_enrollment_status():
    """Get open enrollment period status."""
    # Example open enrollment period
    today = date.today()
    oe_start = date(today.year, 11, 1)
    oe_end = date(today.year, 11, 30)
    
    is_open = oe_start <= today <= oe_end
    
    return jsonify({
        "success": True,
        "open_enrollment": {
            "is_open": is_open,
            "start_date": oe_start.isoformat(),
            "end_date": oe_end.isoformat(),
            "effective_date": date(today.year + 1, 1, 1).isoformat(),
            "days_remaining": max(0, (oe_end - today).days) if is_open else None
        }
    })


@benefits_bp.route('/open-enrollment/elections', methods=['POST'])
@jwt_required()
def submit_open_enrollment_elections():
    """Submit open enrollment elections."""
    data = request.get_json()
    
    employee_id = data.get('employee_id')
    elections = data.get('elections', [])  # List of {plan_id, coverage_level, dependents, action}
    
    if not employee_id:
        return jsonify({"success": False, "error": "Employee ID required"}), 400
    
    results = []
    effective_date = date(date.today().year + 1, 1, 1)
    
    for election in elections:
        action = election.get('action', 'enroll')
        
        if action == 'enroll':
            result = benefits_service.enroll_employee(
                employee_id=employee_id,
                plan_id=election['plan_id'],
                coverage_level=election.get('coverage_level', 'employee_only'),
                effective_date=effective_date,
                dependents=election.get('dependents', [])
            )
        elif action == 'waive':
            result = benefits_service.waive_coverage(
                employee_id=employee_id,
                plan_id=election['plan_id'],
                reason="Open enrollment waiver"
            )
        else:
            result = {"success": False, "error": f"Unknown action: {action}"}
        
        results.append({
            "plan_id": election['plan_id'],
            "action": action,
            "result": result
        })
    
    return jsonify({
        "success": True,
        "effective_date": effective_date.isoformat(),
        "elections_processed": len(results),
        "results": results
    })
