"""
Employee Termination Processing Routes
Handles terminations with state-specific final pay rules
"""

from flask import Blueprint, request, jsonify
from datetime import date, datetime
from decimal import Decimal

termination_bp = Blueprint('termination', __name__, url_prefix='/api/terminations')

# State final pay rules
FINAL_PAY_RULES = {
    'CA': {'involuntary': 'immediate', 'voluntary': '72_hours', 'pto_payout': True},
    'CO': {'involuntary': 'immediate', 'voluntary': 'next_payday', 'pto_payout': True},
    'MA': {'involuntary': 'immediate', 'voluntary': 'next_payday', 'pto_payout': True},
    'AZ': {'involuntary': '7_days', 'voluntary': 'next_payday', 'pto_payout': False},
    'TX': {'involuntary': '6_days', 'voluntary': 'next_payday', 'pto_payout': False},
    'NY': {'involuntary': 'next_payday', 'voluntary': 'next_payday', 'pto_payout': False},
    'FL': {'involuntary': 'next_payday', 'voluntary': 'next_payday', 'pto_payout': False},
    'IL': {'involuntary': 'next_payday', 'voluntary': 'next_payday', 'pto_payout': True},
    'PA': {'involuntary': 'next_payday', 'voluntary': 'next_payday', 'pto_payout': False},
    'NJ': {'involuntary': 'next_payday', 'voluntary': 'next_payday', 'pto_payout': False},
}

# In-memory storage for terminations
terminations = {}


@termination_bp.route('/state-rules/<state>', methods=['GET'])
def get_state_rules(state):
    """Get final pay rules for a state"""
    state = state.upper()
    rules = FINAL_PAY_RULES.get(state, {
        'involuntary': 'next_payday',
        'voluntary': 'next_payday', 
        'pto_payout': False
    })
    return jsonify({"state": state, "rules": rules}), 200


@termination_bp.route('/calculate', methods=['POST'])
def calculate_final_pay():
    """Calculate final paycheck for a termination"""
    data = request.get_json()
    
    required = ['employee_id', 'termination_date', 'termination_type', 'work_state']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    try:
        term_date = datetime.strptime(data['termination_date'], '%Y-%m-%d').date()
        state = data['work_state'].upper()
        term_type = data['termination_type']  # voluntary, involuntary, retirement
        
        # Get state rules
        rules = FINAL_PAY_RULES.get(state, {'involuntary': 'next_payday', 'voluntary': 'next_payday', 'pto_payout': False})
        
        # Calculate due date
        due_rule = rules.get('involuntary' if term_type == 'involuntary' else 'voluntary', 'next_payday')
        
        if due_rule == 'immediate':
            due_date = term_date
        elif due_rule == '72_hours':
            due_date = term_date + timedelta(days=3)
        elif due_rule == '6_days':
            due_date = term_date + timedelta(days=6)
        elif due_rule == '7_days':
            due_date = term_date + timedelta(days=7)
        else:  # next_payday
            # Assume biweekly, find next Friday
            days_until_friday = (4 - term_date.weekday()) % 7
            if days_until_friday == 0:
                days_until_friday = 7
            due_date = term_date + timedelta(days=days_until_friday)
        
        # Calculate components
        regular_pay = Decimal(str(data.get('regular_pay', 0)))
        pto_hours = Decimal(str(data.get('pto_hours_remaining', 0)))
        hourly_rate = Decimal(str(data.get('hourly_rate', 0)))
        
        pto_payout = Decimal('0')
        if rules.get('pto_payout', False) and pto_hours > 0:
            pto_payout = pto_hours * hourly_rate
        
        expense_reimb = Decimal(str(data.get('expense_reimbursements', 0)))
        garnishments = Decimal(str(data.get('outstanding_garnishments', 0)))
        deductions = Decimal(str(data.get('final_deductions', 0)))
        
        gross_pay = regular_pay + pto_payout + expense_reimb
        
        # Estimate taxes (simplified)
        federal_tax = (gross_pay * Decimal('0.22')).quantize(Decimal('0.01'))
        state_tax = (gross_pay * Decimal('0.05')).quantize(Decimal('0.01'))
        fica = (gross_pay * Decimal('0.0765')).quantize(Decimal('0.01'))
        
        total_taxes = federal_tax + state_tax + fica
        net_pay = gross_pay - total_taxes - deductions - garnishments
        
        result = {
            "employee_id": data['employee_id'],
            "termination_date": term_date.isoformat(),
            "termination_type": term_type,
            "work_state": state,
            "final_pay_due_date": due_date.isoformat(),
            "state_rule": due_rule,
            "pto_payout_required": rules.get('pto_payout', False),
            "breakdown": {
                "regular_pay": float(regular_pay),
                "pto_payout": float(pto_payout),
                "pto_hours": float(pto_hours),
                "expense_reimbursements": float(expense_reimb),
                "gross_pay": float(gross_pay),
                "federal_tax": float(federal_tax),
                "state_tax": float(state_tax),
                "fica": float(fica),
                "total_taxes": float(total_taxes),
                "deductions": float(deductions),
                "garnishments": float(garnishments),
                "net_pay": float(net_pay)
            },
            "cobra_required": True,
            "notes": []
        }
        
        # Add notes based on state
        if state == 'CA':
            result['notes'].append("California: Final pay must include all accrued but unused vacation/PTO")
            if term_type == 'involuntary':
                result['notes'].append("Payment due immediately at time of termination")
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@termination_bp.route('/', methods=['POST'])
def process_termination():
    """Process an employee termination"""
    data = request.get_json()
    
    required = ['employee_id', 'termination_date', 'termination_type', 'reason']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    try:
        import uuid
        term_id = str(uuid.uuid4())
        
        termination = {
            "id": term_id,
            "employee_id": data['employee_id'],
            "termination_date": data['termination_date'],
            "termination_type": data['termination_type'],
            "reason": data['reason'],
            "reason_details": data.get('reason_details', ''),
            "last_work_date": data.get('last_work_date', data['termination_date']),
            "final_pay_date": data.get('final_pay_date'),
            "pto_payout_hours": data.get('pto_payout_hours', 0),
            "severance_amount": data.get('severance_amount', 0),
            "severance_weeks": data.get('severance_weeks', 0),
            "cobra_offered": data.get('cobra_offered', True),
            "exit_interview_scheduled": data.get('exit_interview_scheduled', False),
            "equipment_returned": data.get('equipment_returned', False),
            "access_revoked": data.get('access_revoked', False),
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "created_by": data.get('created_by', 'system'),
            "checklist": {
                "final_pay_calculated": False,
                "benefits_terminated": False,
                "cobra_notice_sent": False,
                "equipment_collected": False,
                "access_revoked": False,
                "exit_interview_completed": False,
                "documentation_filed": False
            }
        }
        
        terminations[term_id] = termination
        return jsonify({"termination": termination, "message": "Termination created"}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@termination_bp.route('/', methods=['GET'])
def get_terminations():
    """Get all terminations with filters"""
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = list(terminations.values())
    
    if status:
        result = [t for t in result if t['status'] == status]
    
    return jsonify({"terminations": result}), 200


@termination_bp.route('/<term_id>', methods=['GET'])
def get_termination(term_id):
    """Get a specific termination"""
    if term_id not in terminations:
        return jsonify({"error": "Termination not found"}), 404
    
    return jsonify(terminations[term_id]), 200


@termination_bp.route('/<term_id>/checklist', methods=['PUT'])
def update_checklist(term_id):
    """Update termination checklist items"""
    if term_id not in terminations:
        return jsonify({"error": "Termination not found"}), 404
    
    data = request.get_json()
    
    for key, value in data.items():
        if key in terminations[term_id]['checklist']:
            terminations[term_id]['checklist'][key] = value
    
    # Check if all items complete
    if all(terminations[term_id]['checklist'].values()):
        terminations[term_id]['status'] = 'completed'
    
    return jsonify(terminations[term_id]), 200


@termination_bp.route('/<term_id>/complete', methods=['POST'])
def complete_termination(term_id):
    """Mark termination as complete"""
    if term_id not in terminations:
        return jsonify({"error": "Termination not found"}), 404
    
    terminations[term_id]['status'] = 'completed'
    terminations[term_id]['completed_at'] = datetime.now().isoformat()
    
    return jsonify(terminations[term_id]), 200


# Import timedelta at the top
from datetime import timedelta
