"""
DOCUGINUITY COMPLIANCE API ROUTES
Document compliance management endpoints

Features:
- Employee document checklists
- Company compliance status
- Form library and definitions
- Filing deadline tracking
- Onboarding workflows
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.compliance_service import compliance_service

compliance_bp = Blueprint('compliance', __name__)


# =============================================================================
# EMPLOYEE DOCUMENT ENDPOINTS
# =============================================================================

@compliance_bp.route('/api/compliance/employee/required-documents', methods=['GET'])
@jwt_required()
def get_employee_required_documents():
    """
    Get list of required documents for an employee.
    
    Query params:
    - state: State code (required)
    - employee_type: 'w2' or '1099' (default: 'w2')
    - is_new_hire: 'true' or 'false' (default: 'true')
    """
    state_code = request.args.get('state', 'CA')
    employee_type = request.args.get('employee_type', 'w2')
    is_new_hire = request.args.get('is_new_hire', 'true').lower() == 'true'
    
    documents = compliance_service.get_employee_required_documents(
        state_code, 
        employee_type, 
        is_new_hire
    )
    
    return jsonify({
        'success': True,
        'data': {
            'state': state_code,
            'employee_type': employee_type,
            'is_new_hire': is_new_hire,
            'documents': documents,
            'total': len(documents),
        }
    })


@compliance_bp.route('/api/compliance/onboarding/checklist', methods=['POST'])
@jwt_required()
def create_onboarding_checklist():
    """
    Create a document checklist for employee onboarding.
    
    Request body:
    {
        "employee_id": "emp_123",
        "company_id": "comp_456",
        "state_code": "CA",
        "employee_type": "w2",
        "hire_date": "2025-01-15"
    }
    """
    data = request.get_json()
    
    employee_id = data.get('employee_id')
    company_id = data.get('company_id')
    state_code = data.get('state_code', 'CA')
    employee_type = data.get('employee_type', 'w2')
    hire_date = data.get('hire_date')
    
    if not employee_id or not company_id:
        return jsonify({
            'success': False,
            'error': 'employee_id and company_id are required'
        }), 400
    
    checklist = compliance_service.create_onboarding_checklist(
        employee_id,
        company_id,
        state_code,
        employee_type,
        hire_date
    )
    
    return jsonify({
        'success': True,
        'data': checklist
    }), 201


@compliance_bp.route('/api/compliance/onboarding/checklist/<checklist_id>/document', methods=['PUT'])
@jwt_required()
def update_document_status(checklist_id):
    """
    Update the status of a document in a checklist.
    
    Request body:
    {
        "form_id": "I-9",
        "status": "completed",
        "completed_date": "2025-01-16"
    }
    """
    data = request.get_json()
    
    form_id = data.get('form_id')
    status = data.get('status')
    completed_date = data.get('completed_date')
    
    if not form_id or not status:
        return jsonify({
            'success': False,
            'error': 'form_id and status are required'
        }), 400
    
    result = compliance_service.update_document_status(
        checklist_id,
        form_id,
        status,
        completed_date
    )
    
    return jsonify({
        'success': True,
        'data': result
    })


# =============================================================================
# COMPANY COMPLIANCE ENDPOINTS
# =============================================================================

@compliance_bp.route('/api/compliance/company/required-documents', methods=['GET'])
@jwt_required()
def get_company_required_documents():
    """
    Get list of required documents for a company.
    
    Query params:
    - states: Comma-separated state codes (default: 'CA')
    - employee_count: Number of employees (default: 10)
    - has_contractors: 'true' or 'false' (default: 'false')
    """
    states = request.args.get('states', 'CA').split(',')
    employee_count = int(request.args.get('employee_count', 10))
    has_contractors = request.args.get('has_contractors', 'false').lower() == 'true'
    
    documents = compliance_service.get_company_required_documents(
        states,
        employee_count,
        has_contractors
    )
    
    return jsonify({
        'success': True,
        'data': {
            'states': states,
            'employee_count': employee_count,
            'has_contractors': has_contractors,
            'documents': documents,
            'total': len(documents),
        }
    })


@compliance_bp.route('/api/compliance/company/<company_id>/status', methods=['GET'])
@jwt_required()
def check_company_compliance(company_id):
    """Check overall compliance status for a company."""
    # Mock employee data - in production, would fetch from database
    mock_employees = [
        {'id': '1', 'state': 'CA', 'type': 'w2'},
        {'id': '2', 'state': 'CA', 'type': 'w2'},
        {'id': '3', 'state': 'NY', 'type': 'w2'},
        {'id': '4', 'state': 'TX', 'type': '1099'},
    ]
    
    result = compliance_service.check_company_compliance(company_id, mock_employees)
    
    return jsonify({
        'success': True,
        'data': result
    })


# =============================================================================
# FORM LIBRARY ENDPOINTS
# =============================================================================

@compliance_bp.route('/api/compliance/forms', methods=['GET'])
@jwt_required()
def get_all_forms():
    """Get all federal form definitions."""
    forms = compliance_service.get_all_federal_forms()
    
    return jsonify({
        'success': True,
        'data': {
            'forms': forms,
            'total': len(forms),
        }
    })


@compliance_bp.route('/api/compliance/forms/<form_id>', methods=['GET'])
@jwt_required()
def get_form_details(form_id):
    """Get details about a specific form."""
    jurisdiction = request.args.get('jurisdiction', 'FED')
    
    form = compliance_service.get_form_details(form_id, jurisdiction)
    
    if not form:
        return jsonify({
            'success': False,
            'error': f'Form {form_id} not found for jurisdiction {jurisdiction}'
        }), 404
    
    return jsonify({
        'success': True,
        'data': form
    })


@compliance_bp.route('/api/compliance/forms/state/<state_code>/withholding', methods=['GET'])
@jwt_required()
def get_state_withholding_form(state_code):
    """Get the state-specific withholding form for a state."""
    state_code = state_code.upper()
    form = compliance_service.get_state_withholding_form(state_code)
    
    if not form:
        return jsonify({
            'success': True,
            'data': {
                'state': state_code,
                'has_state_form': False,
                'message': f'{state_code} uses the Federal W-4 or has no state income tax'
            }
        })
    
    return jsonify({
        'success': True,
        'data': {
            'state': state_code,
            'has_state_form': True,
            **form
        }
    })


# =============================================================================
# DEADLINE TRACKING ENDPOINTS
# =============================================================================

@compliance_bp.route('/api/compliance/deadlines', methods=['GET'])
@jwt_required()
def get_upcoming_deadlines():
    """
    Get upcoming filing deadlines.
    
    Query params:
    - days: Number of days to look ahead (default: 30)
    """
    days = int(request.args.get('days', 30))
    
    deadlines = compliance_service.get_upcoming_deadlines(days)
    
    return jsonify({
        'success': True,
        'data': {
            'days_ahead': days,
            'deadlines': deadlines,
            'total': len(deadlines),
        }
    })


@compliance_bp.route('/api/compliance/calendar/<year>', methods=['GET'])
@jwt_required()
def get_filing_calendar(year):
    """Get the full filing calendar for a year."""
    # Currently only 2025 is implemented
    if year != '2025':
        return jsonify({
            'success': False,
            'error': 'Only 2025 calendar is currently available'
        }), 400
    
    return jsonify({
        'success': True,
        'data': {
            'year': year,
            'calendar': compliance_service.FILING_CALENDAR_2025,
        }
    })


# =============================================================================
# DASHBOARD SUMMARY ENDPOINT
# =============================================================================

@compliance_bp.route('/api/compliance/dashboard', methods=['GET'])
@jwt_required()
def get_compliance_dashboard():
    """Get compliance dashboard summary for the current user."""
    user_id = get_jwt_identity()
    
    # Mock data - in production would fetch real data
    return jsonify({
        'success': True,
        'data': {
            'compliance_score': 87,
            'status': 'mostly_compliant',
            'pending_documents': 3,
            'expiring_soon': 1,
            'upcoming_deadlines': compliance_service.get_upcoming_deadlines(14),
            'recent_activity': [
                {'action': 'completed', 'form': 'I-9', 'employee': 'John Doe', 'date': '2025-01-14'},
                {'action': 'submitted', 'form': 'W-4', 'employee': 'Jane Smith', 'date': '2025-01-13'},
            ],
            'quick_stats': {
                'total_employees': 45,
                'documents_collected': 178,
                'pending_signatures': 5,
                'forms_filed_ytd': 12,
            }
        }
    })
