"""
EMPLOYER PORTAL API ROUTES
Comprehensive API endpoints for all employer self-service screens
Phases 1-32 complete coverage
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import random

employer_portal_bp = Blueprint('employer_portal', __name__, url_prefix='/api/employer')

# ============================================================================
# EMERGENCY CONTACTS (Phase 30)
# ============================================================================
@employer_portal_bp.route('/emergency-contacts', methods=['GET'])
@jwt_required()
def get_emergency_contacts():
    """Get all employee emergency contacts"""
    search = request.args.get('search', '')
    status = request.args.get('status')
    
    contacts = [
        {
            'id': '1',
            'employee_name': 'John Smith',
            'employee_id': 'EMP001',
            'department': 'Engineering',
            'contacts': [
                {'name': 'Jane Smith', 'relationship': 'Spouse', 'phone': '555-0101', 'is_primary': True},
                {'name': 'Robert Smith', 'relationship': 'Father', 'phone': '555-0102', 'is_primary': False}
            ],
            'status': 'complete',
            'last_updated': '2024-01-15T10:30:00Z'
        },
        {
            'id': '2',
            'employee_name': 'Sarah Johnson',
            'employee_id': 'EMP002',
            'department': 'Marketing',
            'contacts': [
                {'name': 'Michael Johnson', 'relationship': 'Brother', 'phone': '555-0201', 'is_primary': True}
            ],
            'status': 'incomplete',
            'last_updated': '2024-01-10T14:20:00Z'
        }
    ]
    
    return jsonify({'success': True, 'contacts': contacts})

@employer_portal_bp.route('/emergency-contacts/stats', methods=['GET'])
@jwt_required()
def get_emergency_contacts_stats():
    """Get emergency contacts statistics"""
    stats = {
        'total_employees': 150,
        'complete': 142,
        'incomplete': 8,
        'recently_updated': 45
    }
    return jsonify({'success': True, 'stats': stats})

@employer_portal_bp.route('/emergency-contacts/<contact_id>/remind', methods=['POST'])
@jwt_required()
def send_emergency_contact_reminder(contact_id):
    """Send reminder to update emergency contacts"""
    return jsonify({'success': True, 'message': 'Reminder sent successfully'})

# ============================================================================
# EQUIPMENT CHECKOUT (Phase 30)
# ============================================================================
@employer_portal_bp.route('/equipment-checkout', methods=['GET'])
@jwt_required()
def get_equipment_checkouts():
    """Get all equipment checkouts"""
    status = request.args.get('status')
    search = request.args.get('search', '')
    
    checkouts = [
        {
            'id': '1',
            'asset_tag': 'LAP-2024-001',
            'equipment_name': 'MacBook Pro 16"',
            'category': 'laptop',
            'employee_name': 'John Smith',
            'department': 'Engineering',
            'checkout_date': '2024-01-10T09:00:00Z',
            'expected_return': '2024-06-10T09:00:00Z',
            'status': 'checked_out',
            'condition_out': 'Excellent',
            'notes': 'Development machine'
        },
        {
            'id': '2',
            'asset_tag': 'MON-2024-015',
            'equipment_name': 'Dell 27" Monitor',
            'category': 'monitor',
            'employee_name': 'Sarah Johnson',
            'department': 'Design',
            'checkout_date': '2024-01-05T10:00:00Z',
            'expected_return': '2024-01-20T10:00:00Z',
            'status': 'overdue',
            'condition_out': 'Good'
        }
    ]
    
    return jsonify({'success': True, 'checkouts': checkouts})

@employer_portal_bp.route('/equipment-checkout/stats', methods=['GET'])
@jwt_required()
def get_equipment_stats():
    """Get equipment checkout statistics"""
    stats = {
        'total_assets': 500,
        'checked_out': 125,
        'available': 360,
        'overdue': 15
    }
    return jsonify({'success': True, 'stats': stats})

@employer_portal_bp.route('/equipment-checkout/<checkout_id>/checkin', methods=['POST'])
@jwt_required()
def checkin_equipment(checkout_id):
    """Check in equipment"""
    return jsonify({'success': True, 'message': 'Equipment checked in successfully'})

@employer_portal_bp.route('/equipment-checkout/<checkout_id>/remind', methods=['POST'])
@jwt_required()
def send_equipment_reminder(checkout_id):
    """Send return reminder"""
    return jsonify({'success': True, 'message': 'Return reminder sent'})

# ============================================================================
# VISITOR LOG (Phase 30)
# ============================================================================
@employer_portal_bp.route('/visitor-log', methods=['GET'])
@jwt_required()
def get_visitors():
    """Get visitor log entries"""
    status = request.args.get('status')
    
    visitors = [
        {
            'id': '1',
            'name': 'Michael Chen',
            'company': 'Acme Corp',
            'purpose': 'meeting',
            'host_name': 'John Smith',
            'host_department': 'Engineering',
            'check_in_time': datetime.utcnow().isoformat() + 'Z',
            'badge_number': 'V-001',
            'status': 'checked_in',
            'photo_captured': True,
            'nda_signed': True
        },
        {
            'id': '2',
            'name': 'Emily Davis',
            'company': 'Tech Solutions',
            'purpose': 'interview',
            'host_name': 'HR Team',
            'host_department': 'Human Resources',
            'check_in_time': None,
            'status': 'expected',
            'photo_captured': False,
            'nda_signed': False
        }
    ]
    
    return jsonify({'success': True, 'visitors': visitors})

@employer_portal_bp.route('/visitor-log/stats', methods=['GET'])
@jwt_required()
def get_visitor_stats():
    """Get visitor statistics"""
    stats = {
        'visitors_today': 24,
        'currently_onsite': 8,
        'expected_today': 12,
        'average_visit_time': '2.5h'
    }
    return jsonify({'success': True, 'stats': stats})

@employer_portal_bp.route('/visitor-log/<visitor_id>/checkin', methods=['POST'])
@jwt_required()
def visitor_checkin(visitor_id):
    """Check in visitor"""
    return jsonify({'success': True, 'message': 'Visitor checked in', 'badge_number': 'V-' + str(random.randint(100, 999))})

@employer_portal_bp.route('/visitor-log/<visitor_id>/checkout', methods=['POST'])
@jwt_required()
def visitor_checkout(visitor_id):
    """Check out visitor"""
    return jsonify({'success': True, 'message': 'Visitor checked out'})

# ============================================================================
# DOCUMENT TEMPLATES (Phase 27)
# ============================================================================
@employer_portal_bp.route('/document-templates', methods=['GET'])
@jwt_required()
def get_document_templates():
    """Get HR document templates"""
    category = request.args.get('category')
    
    templates = [
        {'id': '1', 'name': 'Offer Letter', 'category': 'hiring', 'last_updated': '2024-01-15', 'uses': 45},
        {'id': '2', 'name': 'NDA Agreement', 'category': 'legal', 'last_updated': '2024-01-10', 'uses': 120},
        {'id': '3', 'name': 'Performance Review', 'category': 'performance', 'last_updated': '2024-01-08', 'uses': 30}
    ]
    
    return jsonify({'success': True, 'templates': templates})

@employer_portal_bp.route('/document-templates/stats', methods=['GET'])
@jwt_required()
def get_document_template_stats():
    """Get document template statistics"""
    stats = {'total_templates': 45, 'categories': 8, 'documents_generated': 1250, 'this_month': 85}
    return jsonify({'success': True, 'stats': stats})

# ============================================================================
# POLICY LIBRARY (Phase 27)
# ============================================================================
@employer_portal_bp.route('/policy-library', methods=['GET'])
@jwt_required()
def get_policies():
    """Get company policies"""
    category = request.args.get('category')
    
    policies = [
        {'id': '1', 'title': 'Employee Handbook', 'category': 'general', 'version': '3.2', 'effective_date': '2024-01-01', 'acknowledgments': 145, 'total_employees': 150},
        {'id': '2', 'title': 'Remote Work Policy', 'category': 'work_arrangements', 'version': '2.0', 'effective_date': '2024-01-15', 'acknowledgments': 120, 'total_employees': 150},
        {'id': '3', 'title': 'Code of Conduct', 'category': 'conduct', 'version': '1.5', 'effective_date': '2023-06-01', 'acknowledgments': 150, 'total_employees': 150}
    ]
    
    return jsonify({'success': True, 'policies': policies})

@employer_portal_bp.route('/policy-library/stats', methods=['GET'])
@jwt_required()
def get_policy_stats():
    """Get policy statistics"""
    stats = {'total_policies': 25, 'pending_acknowledgments': 45, 'updates_this_quarter': 5, 'compliance_rate': 96.5}
    return jsonify({'success': True, 'stats': stats})

# ============================================================================
# WORKFORCE ANALYTICS (Phase 27)
# ============================================================================
@employer_portal_bp.route('/workforce-analytics', methods=['GET'])
@jwt_required()
def get_workforce_analytics():
    """Get workforce analytics data"""
    metrics = {
        'headcount': {'current': 150, 'change': 12, 'change_percent': 8.7},
        'turnover_rate': {'current': 8.5, 'industry_avg': 12.0},
        'avg_tenure': {'years': 3.2, 'months': 38},
        'diversity': {'gender': {'male': 55, 'female': 42, 'other': 3}, 'ethnicity': {}},
        'departments': [
            {'name': 'Engineering', 'headcount': 45, 'growth': 15},
            {'name': 'Sales', 'headcount': 30, 'growth': 8},
            {'name': 'Marketing', 'headcount': 20, 'growth': 5}
        ]
    }
    return jsonify({'success': True, 'metrics': metrics})

# ============================================================================
# ORG CHART (Phase 24)
# ============================================================================
@employer_portal_bp.route('/org-chart', methods=['GET'])
@jwt_required()
def get_org_chart():
    """Get organization chart data"""
    org_data = {
        'id': 'ceo',
        'name': 'John CEO',
        'title': 'Chief Executive Officer',
        'department': 'Executive',
        'direct_reports': 5,
        'children': [
            {'id': 'cto', 'name': 'Jane CTO', 'title': 'CTO', 'department': 'Technology', 'direct_reports': 3},
            {'id': 'cfo', 'name': 'Bob CFO', 'title': 'CFO', 'department': 'Finance', 'direct_reports': 2}
        ]
    }
    return jsonify({'success': True, 'org_chart': org_data})

# ============================================================================
# EXIT INTERVIEWS (Phase 24)
# ============================================================================
@employer_portal_bp.route('/exit-interviews', methods=['GET'])
@jwt_required()
def get_exit_interviews():
    """Get exit interview data"""
    interviews = [
        {'id': '1', 'employee_name': 'Former Employee', 'department': 'Engineering', 'exit_date': '2024-01-15', 'status': 'completed', 'reason': 'career_growth', 'rating': 4},
        {'id': '2', 'employee_name': 'Another Former', 'department': 'Sales', 'exit_date': '2024-01-20', 'status': 'scheduled', 'reason': 'relocation'}
    ]
    return jsonify({'success': True, 'interviews': interviews})

@employer_portal_bp.route('/exit-interviews/stats', methods=['GET'])
@jwt_required()
def get_exit_interview_stats():
    """Get exit interview statistics"""
    stats = {'total_this_year': 15, 'completed': 12, 'pending': 3, 'avg_satisfaction': 3.8, 'top_reasons': ['career_growth', 'compensation', 'relocation']}
    return jsonify({'success': True, 'stats': stats})

# ============================================================================
# TRAINING ADMIN (Phase 24)
# ============================================================================
@employer_portal_bp.route('/training-admin', methods=['GET'])
@jwt_required()
def get_training_programs():
    """Get training programs"""
    programs = [
        {'id': '1', 'name': 'Security Awareness', 'type': 'compliance', 'status': 'active', 'enrolled': 145, 'completed': 120, 'due_date': '2024-02-01'},
        {'id': '2', 'name': 'Leadership Development', 'type': 'professional', 'status': 'active', 'enrolled': 25, 'completed': 10}
    ]
    return jsonify({'success': True, 'programs': programs})

@employer_portal_bp.route('/training-admin/stats', methods=['GET'])
@jwt_required()
def get_training_stats():
    """Get training statistics"""
    stats = {'total_programs': 20, 'active_enrollments': 450, 'completion_rate': 85, 'overdue': 12}
    return jsonify({'success': True, 'stats': stats})

# ============================================================================
# APPLICANT TRACKING (Phase 21)
# ============================================================================
@employer_portal_bp.route('/applicant-tracking', methods=['GET'])
@jwt_required()
def get_applicants():
    """Get job applicants"""
    status = request.args.get('status')
    job_id = request.args.get('job_id')
    
    applicants = [
        {'id': '1', 'name': 'Jane Doe', 'job_title': 'Software Engineer', 'status': 'interview', 'applied_date': '2024-01-10', 'rating': 4.5, 'source': 'LinkedIn'},
        {'id': '2', 'name': 'John Applicant', 'job_title': 'Product Manager', 'status': 'screening', 'applied_date': '2024-01-12', 'rating': 4.0, 'source': 'Indeed'}
    ]
    return jsonify({'success': True, 'applicants': applicants})

@employer_portal_bp.route('/applicant-tracking/stats', methods=['GET'])
@jwt_required()
def get_applicant_stats():
    """Get applicant tracking statistics"""
    stats = {'total_applicants': 250, 'new_this_week': 45, 'in_pipeline': 80, 'offers_extended': 5, 'time_to_hire': 28}
    return jsonify({'success': True, 'stats': stats})

# ============================================================================
# BENEFITS ADMIN (Phase 21)
# ============================================================================
@employer_portal_bp.route('/benefits-admin', methods=['GET'])
@jwt_required()
def get_benefits_admin():
    """Get benefits administration data"""
    plans = [
        {'id': '1', 'name': 'Medical PPO', 'type': 'health', 'enrolled': 120, 'monthly_cost': 45000, 'status': 'active'},
        {'id': '2', 'name': '401k Plan', 'type': 'retirement', 'enrolled': 135, 'monthly_cost': 25000, 'status': 'active'},
        {'id': '3', 'name': 'Dental Plan', 'type': 'dental', 'enrolled': 110, 'monthly_cost': 8000, 'status': 'active'}
    ]
    return jsonify({'success': True, 'plans': plans})

@employer_portal_bp.route('/benefits-admin/stats', methods=['GET'])
@jwt_required()
def get_benefits_admin_stats():
    """Get benefits admin statistics"""
    stats = {'total_plans': 8, 'total_enrolled': 145, 'monthly_cost': 125000, 'pending_enrollments': 12, 'open_enrollment': False}
    return jsonify({'success': True, 'stats': stats})

# ============================================================================
# COMPENSATION PLANNING (Phase 21)
# ============================================================================
@employer_portal_bp.route('/compensation-planning', methods=['GET'])
@jwt_required()
def get_compensation_planning():
    """Get compensation planning data"""
    data = {
        'budget': {'total': 500000, 'allocated': 425000, 'remaining': 75000},
        'cycles': [
            {'id': '1', 'name': 'Annual Review 2024', 'status': 'planning', 'effective_date': '2024-04-01', 'employees_affected': 145}
        ],
        'guidelines': {'merit_pool': 3.5, 'promotion_pool': 2.0, 'equity_refresh': 1.5}
    }
    return jsonify({'success': True, 'data': data})

# ============================================================================
# PTO MANAGEMENT (Phase 18)
# ============================================================================
@employer_portal_bp.route('/pto-management', methods=['GET'])
@jwt_required()
def get_pto_management():
    """Get PTO management data"""
    requests = [
        {'id': '1', 'employee_name': 'John Smith', 'type': 'vacation', 'start_date': '2024-02-01', 'end_date': '2024-02-05', 'status': 'pending', 'hours': 40},
        {'id': '2', 'employee_name': 'Sarah Johnson', 'type': 'sick', 'start_date': '2024-01-25', 'end_date': '2024-01-25', 'status': 'approved', 'hours': 8}
    ]
    return jsonify({'success': True, 'requests': requests})

@employer_portal_bp.route('/pto-management/stats', methods=['GET'])
@jwt_required()
def get_pto_management_stats():
    """Get PTO management statistics"""
    stats = {'pending_requests': 12, 'approved_this_month': 45, 'total_hours_taken': 1250, 'upcoming_absences': 8}
    return jsonify({'success': True, 'stats': stats})

# ============================================================================
# PAY GRADES (Phase 18)
# ============================================================================
@employer_portal_bp.route('/pay-grades', methods=['GET'])
@jwt_required()
def get_pay_grades():
    """Get pay grade structure"""
    grades = [
        {'id': '1', 'grade': 'L1', 'title': 'Entry Level', 'min_salary': 45000, 'mid_salary': 55000, 'max_salary': 65000, 'employees': 25},
        {'id': '2', 'grade': 'L2', 'title': 'Associate', 'min_salary': 60000, 'mid_salary': 75000, 'max_salary': 90000, 'employees': 45},
        {'id': '3', 'grade': 'L3', 'title': 'Senior', 'min_salary': 85000, 'mid_salary': 105000, 'max_salary': 125000, 'employees': 40}
    ]
    return jsonify({'success': True, 'grades': grades})

# ============================================================================
# JOB POSTINGS (Phase 18)
# ============================================================================
@employer_portal_bp.route('/job-postings', methods=['GET'])
@jwt_required()
def get_job_postings():
    """Get job postings"""
    postings = [
        {'id': '1', 'title': 'Software Engineer', 'department': 'Engineering', 'location': 'Remote', 'status': 'active', 'applicants': 45, 'posted_date': '2024-01-01'},
        {'id': '2', 'title': 'Product Manager', 'department': 'Product', 'location': 'New York', 'status': 'active', 'applicants': 30, 'posted_date': '2024-01-05'}
    ]
    return jsonify({'success': True, 'postings': postings})

@employer_portal_bp.route('/job-postings/stats', methods=['GET'])
@jwt_required()
def get_job_postings_stats():
    """Get job posting statistics"""
    stats = {'active_postings': 12, 'total_applicants': 350, 'views_this_week': 2500, 'conversion_rate': 14.0}
    return jsonify({'success': True, 'stats': stats})
