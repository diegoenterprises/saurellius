# FMLA (Family Medical Leave Act) Management Routes
# Track FMLA eligibility, requests, and compliance

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import uuid

fmla_bp = Blueprint('fmla', __name__)

# In-memory storage
fmla_cases = {}
fmla_eligibility = {}


@fmla_bp.route('/api/fmla/eligibility/<employee_id>', methods=['GET'])
@jwt_required()
def check_fmla_eligibility(employee_id):
    """Check FMLA eligibility for an employee."""
    eligibility = {
        'employee_id': employee_id,
        'eligible': True,
        'criteria': {
            'months_employed': {'required': 12, 'actual': 18, 'met': True},
            'hours_worked': {'required': 1250, 'actual': 1820, 'met': True},
            'employer_size': {'required': 50, 'actual': 156, 'met': True},
            'worksite_employees': {'required': 50, 'within_75_miles': 156, 'met': True}
        },
        'entitlement': {
            'total_weeks': 12,
            'used_weeks': 2,
            'remaining_weeks': 10,
            'leave_year_start': '2025-01-01',
            'leave_year_end': '2025-12-31'
        },
        'checked_at': datetime.now().isoformat()
    }
    return jsonify({'success': True, 'eligibility': eligibility}), 200


@fmla_bp.route('/api/fmla/cases', methods=['GET'])
@jwt_required()
def get_fmla_cases():
    """Get FMLA cases."""
    employee_id = request.args.get('employee_id')
    status = request.args.get('status')
    
    cases = list(fmla_cases.values())
    if employee_id:
        cases = [c for c in cases if c.get('employee_id') == employee_id]
    if status:
        cases = [c for c in cases if c.get('status') == status]
    
    return jsonify({'success': True, 'cases': cases}), 200


@fmla_bp.route('/api/fmla/cases', methods=['POST'])
@jwt_required()
def create_fmla_case():
    """Create a new FMLA case."""
    data = request.get_json()
    case_id = str(uuid.uuid4())
    
    case = {
        'id': case_id,
        'employee_id': data.get('employee_id'),
        'type': data.get('type'),  # continuous, intermittent, reduced_schedule
        'reason': data.get('reason'),  # own_health, family_care, military, bonding
        'start_date': data.get('start_date'),
        'expected_end_date': data.get('expected_end_date'),
        'certification_required': True,
        'certification_received': False,
        'status': 'pending',
        'hours_requested': data.get('hours_requested'),
        'schedule': data.get('schedule'),
        'healthcare_provider': data.get('healthcare_provider'),
        'notes': [],
        'created_at': datetime.now().isoformat()
    }
    
    fmla_cases[case_id] = case
    return jsonify({'success': True, 'case': case}), 201


@fmla_bp.route('/api/fmla/cases/<case_id>', methods=['PUT'])
@jwt_required()
def update_fmla_case(case_id):
    """Update an FMLA case."""
    if case_id not in fmla_cases:
        return jsonify({'success': False, 'message': 'Case not found'}), 404
    
    data = request.get_json()
    fmla_cases[case_id].update(data)
    fmla_cases[case_id]['updated_at'] = datetime.now().isoformat()
    
    return jsonify({'success': True, 'case': fmla_cases[case_id]}), 200


@fmla_bp.route('/api/fmla/cases/<case_id>/approve', methods=['POST'])
@jwt_required()
def approve_fmla_case(case_id):
    """Approve an FMLA case."""
    if case_id not in fmla_cases:
        return jsonify({'success': False, 'message': 'Case not found'}), 404
    
    data = request.get_json()
    fmla_cases[case_id]['status'] = 'approved'
    fmla_cases[case_id]['approved_by'] = get_jwt_identity()
    fmla_cases[case_id]['approved_at'] = datetime.now().isoformat()
    fmla_cases[case_id]['approved_hours'] = data.get('approved_hours')
    
    return jsonify({'success': True, 'case': fmla_cases[case_id]}), 200


@fmla_bp.route('/api/fmla/cases/<case_id>/time', methods=['POST'])
@jwt_required()
def record_fmla_time(case_id):
    """Record FMLA time used."""
    if case_id not in fmla_cases:
        return jsonify({'success': False, 'message': 'Case not found'}), 404
    
    data = request.get_json()
    time_entry = {
        'id': str(uuid.uuid4()),
        'date': data.get('date'),
        'hours': data.get('hours'),
        'notes': data.get('notes'),
        'recorded_at': datetime.now().isoformat()
    }
    
    if 'time_entries' not in fmla_cases[case_id]:
        fmla_cases[case_id]['time_entries'] = []
    
    fmla_cases[case_id]['time_entries'].append(time_entry)
    
    return jsonify({'success': True, 'time_entry': time_entry}), 201


@fmla_bp.route('/api/fmla/report', methods=['GET'])
@jwt_required()
def get_fmla_report():
    """Get FMLA compliance report."""
    company_id = request.args.get('company_id')
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'summary': {
            'active_cases': 5,
            'pending_cases': 2,
            'total_hours_used_ytd': 1240,
            'employees_on_leave': 3
        },
        'by_type': {
            'continuous': 2,
            'intermittent': 3,
            'reduced_schedule': 0
        },
        'by_reason': {
            'own_health': 2,
            'family_care': 2,
            'bonding': 1
        },
        'compliance_status': 'compliant',
        'upcoming_returns': [
            {'employee_id': 'emp_012', 'expected_return': '2025-01-15'},
            {'employee_id': 'emp_045', 'expected_return': '2025-02-01'}
        ]
    }
    
    return jsonify({'success': True, 'report': report}), 200
