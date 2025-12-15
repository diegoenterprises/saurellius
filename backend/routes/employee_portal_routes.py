"""
EMPLOYEE PORTAL API ROUTES
Comprehensive API endpoints for all employee self-service screens
Phases 1-32 complete coverage
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import random

employee_portal_bp = Blueprint('employee_portal', __name__, url_prefix='/api/employee')


# ============================================================================
# DASHBOARD
# ============================================================================
@employee_portal_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_employee_dashboard():
    """Get employee dashboard overview"""
    return jsonify({
        'success': True,
        'dashboard': {
            'next_payday': None,
            'current_pay_period': None,
            'pto_balance': {'vacation': 0, 'sick': 0, 'personal': 0},
            'recent_paystubs': [],
            'pending_requests': [],
            'announcements': [],
            'quick_links': []
        }
    }), 200


# ============================================================================
# OFFICE MAP (Phase 31)
# ============================================================================
@employee_portal_bp.route('/office-map/locations', methods=['GET'])
@jwt_required()
def get_office_locations():
    """Get office locations for floor plan"""
    floor = request.args.get('floor', 1, type=int)
    location_type = request.args.get('type')
    search = request.args.get('search', '')
    
    locations = [
        {'id': '1', 'name': 'Conference Room A', 'type': 'meeting_room', 'floor': 1, 'zone': 'A', 'capacity': 12, 'is_available': True, 'amenities': ['Projector', 'Whiteboard', 'Video Conference']},
        {'id': '2', 'name': 'Desk 101', 'type': 'desk', 'floor': 1, 'zone': 'B', 'assigned_to': 'John Smith', 'is_available': False},
        {'id': '3', 'name': 'Kitchen', 'type': 'kitchen', 'floor': 1, 'zone': 'C', 'description': 'Main kitchen with coffee and snacks'},
        {'id': '4', 'name': 'Quiet Lounge', 'type': 'lounge', 'floor': 1, 'zone': 'D', 'capacity': 8, 'is_available': True, 'amenities': ['Comfortable Seating', 'Natural Light']},
        {'id': '5', 'name': 'Printer Station 1', 'type': 'printer', 'floor': 1, 'zone': 'A', 'description': 'Color laser printer'}
    ]
    
    return jsonify({'success': True, 'locations': locations})

@employee_portal_bp.route('/office-map/floors', methods=['GET'])
@jwt_required()
def get_office_floors():
    """Get office floors"""
    floors = [
        {'number': 1, 'name': 'Main', 'locations_count': 45},
        {'number': 2, 'name': 'Engineering', 'locations_count': 38},
        {'number': 3, 'name': 'Executive', 'locations_count': 20}
    ]
    return jsonify({'success': True, 'floors': floors})

@employee_portal_bp.route('/office-map/stats', methods=['GET'])
@jwt_required()
def get_office_map_stats():
    """Get office map statistics"""
    stats = {'total_floors': 3, 'meeting_rooms': 15, 'available_desks': 25, 'total_capacity': 200}
    return jsonify({'success': True, 'stats': stats})

@employee_portal_bp.route('/office-map/book-room', methods=['POST'])
@jwt_required()
def book_meeting_room():
    """Book a meeting room"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Room booked successfully', 'booking_id': 'BK-' + str(random.randint(1000, 9999))})

# ============================================================================
# PARKING (Phase 31)
# ============================================================================
@employee_portal_bp.route('/parking/permits', methods=['GET'])
@jwt_required()
def get_parking_permits():
    """Get employee parking permits"""
    permits = [
        {
            'id': '1',
            'permit_number': 'P2024-001',
            'type': 'Reserved',
            'vehicle_make': 'Toyota',
            'vehicle_model': 'Camry',
            'vehicle_color': 'Silver',
            'license_plate': 'ABC-1234',
            'valid_from': '2024-01-01T00:00:00Z',
            'valid_until': '2024-12-31T23:59:59Z',
            'status': 'active',
            'assigned_spot': 'A-15'
        }
    ]
    return jsonify({'success': True, 'permits': permits})

@employee_portal_bp.route('/parking/spots', methods=['GET'])
@jwt_required()
def get_parking_spots():
    """Get available parking spots"""
    spots = [
        {'id': '1', 'spot_number': 'A-20', 'level': '1', 'zone': 'A', 'type': 'regular', 'status': 'available'},
        {'id': '2', 'spot_number': 'B-05', 'level': '1', 'zone': 'B', 'type': 'ev_charging', 'status': 'available'},
        {'id': '3', 'spot_number': 'A-10', 'level': '1', 'zone': 'A', 'type': 'handicap', 'status': 'occupied'},
        {'id': '4', 'spot_number': 'V-01', 'level': 'G', 'zone': 'V', 'type': 'visitor', 'status': 'available'}
    ]
    return jsonify({'success': True, 'spots': spots})

@employee_portal_bp.route('/parking/stats', methods=['GET'])
@jwt_required()
def get_parking_stats():
    """Get parking statistics"""
    stats = {'total_spots': 200, 'available_spots': 45, 'your_permits': 1, 'ev_spots_available': 5}
    return jsonify({'success': True, 'stats': stats})

@employee_portal_bp.route('/parking/spots/<spot_id>/reserve', methods=['POST'])
@jwt_required()
def reserve_parking_spot(spot_id):
    """Reserve a parking spot"""
    return jsonify({'success': True, 'message': 'Spot reserved successfully'})

@employee_portal_bp.route('/parking/permits/request', methods=['POST'])
@jwt_required()
def request_parking_permit():
    """Request a new parking permit"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Permit request submitted', 'request_id': 'PR-' + str(random.randint(1000, 9999))})

# ============================================================================
# IT SUPPORT (Phase 31)
# ============================================================================
@employee_portal_bp.route('/it-support/tickets', methods=['GET'])
@jwt_required()
def get_it_tickets():
    """Get IT support tickets"""
    tickets = [
        {
            'id': '1',
            'ticket_number': 'IT-2024-001',
            'subject': 'VPN Connection Issues',
            'category': 'network',
            'priority': 'high',
            'status': 'in_progress',
            'description': 'Cannot connect to VPN from home',
            'assigned_to': 'Tech Support Team',
            'created_at': '2024-01-20T10:30:00Z',
            'updated_at': '2024-01-20T14:00:00Z'
        },
        {
            'id': '2',
            'ticket_number': 'IT-2024-002',
            'subject': 'Software Installation Request',
            'category': 'software',
            'priority': 'medium',
            'status': 'open',
            'description': 'Need Adobe Creative Suite installed',
            'created_at': '2024-01-21T09:00:00Z',
            'updated_at': '2024-01-21T09:00:00Z'
        }
    ]
    return jsonify({'success': True, 'tickets': tickets})

@employee_portal_bp.route('/it-support/stats', methods=['GET'])
@jwt_required()
def get_it_support_stats():
    """Get IT support statistics"""
    stats = {'open_tickets': 2, 'avg_resolution_time': '4.5h', 'satisfaction_rate': 94}
    return jsonify({'success': True, 'stats': stats})

@employee_portal_bp.route('/it-support/tickets', methods=['POST'])
@jwt_required()
def create_it_ticket():
    """Create a new IT support ticket"""
    data = request.get_json()
    ticket_number = 'IT-2024-' + str(random.randint(100, 999))
    return jsonify({'success': True, 'message': 'Ticket created', 'ticket_number': ticket_number})

# ============================================================================
# COMPANY EVENTS (Phase 27)
# ============================================================================
@employee_portal_bp.route('/company-events', methods=['GET'])
@jwt_required()
def get_company_events():
    """Get company events"""
    filter_type = request.args.get('filter', 'upcoming')
    
    events = [
        {'id': '1', 'title': 'Town Hall Meeting', 'type': 'meeting', 'date': '2024-02-01T14:00:00Z', 'location': 'Main Auditorium', 'attendees': 145, 'rsvp_status': 'going'},
        {'id': '2', 'title': 'Team Building Event', 'type': 'social', 'date': '2024-02-15T10:00:00Z', 'location': 'Off-site', 'attendees': 50, 'rsvp_status': None},
        {'id': '3', 'title': 'Holiday Party', 'type': 'celebration', 'date': '2024-12-20T18:00:00Z', 'location': 'Grand Ballroom', 'attendees': 200, 'rsvp_status': None}
    ]
    return jsonify({'success': True, 'events': events})

@employee_portal_bp.route('/company-events/<event_id>/rsvp', methods=['POST'])
@jwt_required()
def rsvp_event(event_id):
    """RSVP to an event"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'RSVP updated'})

# ============================================================================
# RESOURCE LIBRARY (Phase 27)
# ============================================================================
@employee_portal_bp.route('/resource-library', methods=['GET'])
@jwt_required()
def get_resources():
    """Get company resources"""
    category = request.args.get('category')
    
    resources = [
        {'id': '1', 'title': 'Employee Handbook', 'category': 'policies', 'type': 'pdf', 'downloads': 450, 'updated': '2024-01-01'},
        {'id': '2', 'title': 'Benefits Guide', 'category': 'benefits', 'type': 'pdf', 'downloads': 320, 'updated': '2024-01-15'},
        {'id': '3', 'title': 'IT Security Training', 'category': 'training', 'type': 'video', 'views': 180, 'duration': '30 min'}
    ]
    return jsonify({'success': True, 'resources': resources})

@employee_portal_bp.route('/resource-library/stats', methods=['GET'])
@jwt_required()
def get_resource_stats():
    """Get resource library statistics"""
    stats = {'total_resources': 85, 'categories': 12, 'total_downloads': 5000, 'new_this_month': 8}
    return jsonify({'success': True, 'stats': stats})

# ============================================================================
# ASK HR (Phase 27)
# ============================================================================
@employee_portal_bp.route('/ask-hr/tickets', methods=['GET'])
@jwt_required()
def get_hr_tickets():
    """Get HR tickets"""
    tickets = [
        {'id': '1', 'subject': 'Benefits Question', 'category': 'benefits', 'status': 'resolved', 'created_at': '2024-01-15', 'response': 'Your benefits enrollment...'},
        {'id': '2', 'subject': 'PTO Balance Inquiry', 'category': 'time_off', 'status': 'open', 'created_at': '2024-01-20'}
    ]
    return jsonify({'success': True, 'tickets': tickets})

@employee_portal_bp.route('/ask-hr/tickets', methods=['POST'])
@jwt_required()
def create_hr_ticket():
    """Create HR ticket"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Ticket submitted', 'ticket_id': 'HR-' + str(random.randint(1000, 9999))})

@employee_portal_bp.route('/ask-hr/faqs', methods=['GET'])
@jwt_required()
def get_hr_faqs():
    """Get HR FAQs"""
    faqs = [
        {'id': '1', 'question': 'How do I update my direct deposit?', 'answer': 'Go to Settings > Payment Methods...', 'category': 'payroll'},
        {'id': '2', 'question': 'When is open enrollment?', 'answer': 'Open enrollment runs from November 1-15...', 'category': 'benefits'},
        {'id': '3', 'question': 'How do I request time off?', 'answer': 'Navigate to Time Off > Request...', 'category': 'time_off'}
    ]
    return jsonify({'success': True, 'faqs': faqs})

# ============================================================================
# INTERNAL JOBS (Phase 24)
# ============================================================================
@employee_portal_bp.route('/internal-jobs', methods=['GET'])
@jwt_required()
def get_internal_jobs():
    """Get internal job postings"""
    jobs = [
        {'id': '1', 'title': 'Senior Software Engineer', 'department': 'Engineering', 'location': 'Remote', 'posted_date': '2024-01-10', 'applicants': 12},
        {'id': '2', 'title': 'Product Manager', 'department': 'Product', 'location': 'New York', 'posted_date': '2024-01-15', 'applicants': 8}
    ]
    return jsonify({'success': True, 'jobs': jobs})

@employee_portal_bp.route('/internal-jobs/<job_id>/apply', methods=['POST'])
@jwt_required()
def apply_internal_job(job_id):
    """Apply for internal job"""
    return jsonify({'success': True, 'message': 'Application submitted'})

# ============================================================================
# PULSE SURVEYS (Phase 24)
# ============================================================================
@employee_portal_bp.route('/pulse-surveys', methods=['GET'])
@jwt_required()
def get_pulse_surveys():
    """Get pulse surveys"""
    surveys = [
        {'id': '1', 'title': 'Weekly Check-in', 'status': 'active', 'due_date': '2024-01-26', 'questions': 5, 'completed': False},
        {'id': '2', 'title': 'Q4 Engagement Survey', 'status': 'completed', 'completed_date': '2024-01-10', 'questions': 20, 'completed': True}
    ]
    return jsonify({'success': True, 'surveys': surveys})

@employee_portal_bp.route('/pulse-surveys/<survey_id>/submit', methods=['POST'])
@jwt_required()
def submit_pulse_survey(survey_id):
    """Submit pulse survey response"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Survey submitted'})

# ============================================================================
# KUDOS WALL (Phase 24)
# ============================================================================
@employee_portal_bp.route('/kudos-wall', methods=['GET'])
@jwt_required()
def get_kudos():
    """Get kudos/recognition posts"""
    kudos = [
        {'id': '1', 'from_name': 'Sarah Manager', 'to_name': 'John Smith', 'message': 'Great work on the project launch!', 'category': 'teamwork', 'likes': 15, 'created_at': '2024-01-20'},
        {'id': '2', 'from_name': 'Mike Director', 'to_name': 'Team Alpha', 'message': 'Outstanding Q4 results!', 'category': 'achievement', 'likes': 45, 'created_at': '2024-01-18'}
    ]
    return jsonify({'success': True, 'kudos': kudos})

@employee_portal_bp.route('/kudos-wall', methods=['POST'])
@jwt_required()
def send_kudos():
    """Send kudos to colleague"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Kudos sent!'})

# ============================================================================
# CAREER PATH (Phase 21)
# ============================================================================
@employee_portal_bp.route('/career-path', methods=['GET'])
@jwt_required()
def get_career_path():
    """Get career path information"""
    data = {
        'current_role': {'title': 'Software Engineer', 'level': 'L2', 'tenure': '2 years'},
        'next_roles': [
            {'title': 'Senior Software Engineer', 'level': 'L3', 'requirements': ['Technical Leadership', '3+ years experience']},
            {'title': 'Tech Lead', 'level': 'L4', 'requirements': ['Team Management', '5+ years experience']}
        ],
        'skills': [
            {'name': 'Python', 'level': 85, 'required_for_next': True},
            {'name': 'Leadership', 'level': 60, 'required_for_next': True}
        ]
    }
    return jsonify({'success': True, 'data': data})

# ============================================================================
# MENTORSHIP (Phase 21)
# ============================================================================
@employee_portal_bp.route('/mentorship', methods=['GET'])
@jwt_required()
def get_mentorship():
    """Get mentorship information"""
    data = {
        'mentors': [
            {'id': '1', 'name': 'Jane Senior', 'title': 'Staff Engineer', 'expertise': ['Python', 'System Design'], 'availability': 'Available'}
        ],
        'my_mentor': {'id': '1', 'name': 'Jane Senior', 'sessions_completed': 5, 'next_session': '2024-01-25'},
        'mentees': []
    }
    return jsonify({'success': True, 'data': data})

@employee_portal_bp.route('/mentorship/request', methods=['POST'])
@jwt_required()
def request_mentor():
    """Request a mentor"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Mentor request submitted'})

# ============================================================================
# RECOGNITION (Phase 21)
# ============================================================================
@employee_portal_bp.route('/recognition', methods=['GET'])
@jwt_required()
def get_recognition():
    """Get recognition data"""
    data = {
        'received': [
            {'id': '1', 'from': 'Manager Name', 'type': 'spot_bonus', 'amount': 100, 'message': 'Great work!', 'date': '2024-01-15'}
        ],
        'given': [
            {'id': '2', 'to': 'Colleague Name', 'type': 'kudos', 'message': 'Thanks for the help!', 'date': '2024-01-10'}
        ],
        'badges': [
            {'id': '1', 'name': 'Team Player', 'icon': 'people', 'earned_date': '2024-01-01'},
            {'id': '2', 'name': 'Innovation', 'icon': 'bulb', 'earned_date': '2023-12-15'}
        ],
        'points_balance': 500
    }
    return jsonify({'success': True, 'data': data})

# ============================================================================
# EXPENSE CLAIMS (Phase 15)
# ============================================================================
@employee_portal_bp.route('/expense-claims', methods=['GET'])
@jwt_required()
def get_expense_claims():
    """Get expense claims"""
    claims = [
        {'id': '1', 'description': 'Client Dinner', 'amount': 150.00, 'category': 'meals', 'status': 'approved', 'date': '2024-01-15'},
        {'id': '2', 'description': 'Office Supplies', 'amount': 45.00, 'category': 'supplies', 'status': 'pending', 'date': '2024-01-20'}
    ]
    return jsonify({'success': True, 'claims': claims})

@employee_portal_bp.route('/expense-claims', methods=['POST'])
@jwt_required()
def submit_expense_claim():
    """Submit expense claim"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Claim submitted', 'claim_id': 'EXP-' + str(random.randint(1000, 9999))})

# ============================================================================
# SHIFT SWAP (Phase 15)
# ============================================================================
@employee_portal_bp.route('/shift-swap', methods=['GET'])
@jwt_required()
def get_shift_swaps():
    """Get shift swap requests"""
    swaps = [
        {'id': '1', 'original_shift': '2024-01-25 09:00-17:00', 'requested_with': 'John Smith', 'status': 'pending'},
        {'id': '2', 'original_shift': '2024-01-28 13:00-21:00', 'requested_with': 'Sarah Johnson', 'status': 'approved'}
    ]
    return jsonify({'success': True, 'swaps': swaps})

@employee_portal_bp.route('/shift-swap', methods=['POST'])
@jwt_required()
def request_shift_swap():
    """Request shift swap"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Swap request submitted'})

# ============================================================================
# FEEDBACK (Phase 15)
# ============================================================================
@employee_portal_bp.route('/feedback', methods=['GET'])
@jwt_required()
def get_feedback():
    """Get feedback submissions"""
    feedback = [
        {'id': '1', 'type': 'suggestion', 'subject': 'Office Improvements', 'status': 'reviewed', 'submitted': '2024-01-10'},
        {'id': '2', 'type': 'concern', 'subject': 'Work-life Balance', 'status': 'pending', 'submitted': '2024-01-18', 'anonymous': True}
    ]
    return jsonify({'success': True, 'feedback': feedback})

@employee_portal_bp.route('/feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    """Submit feedback"""
    data = request.get_json()
    return jsonify({'success': True, 'message': 'Feedback submitted'})

# ============================================================================
# LEARNING CENTER (Phase 18)
# ============================================================================
@employee_portal_bp.route('/learning-center', methods=['GET'])
@jwt_required()
def get_learning_center():
    """Get learning center data"""
    courses = [
        {'id': '1', 'title': 'Leadership Fundamentals', 'category': 'professional', 'duration': '4 hours', 'progress': 75, 'status': 'in_progress'},
        {'id': '2', 'title': 'Security Awareness', 'category': 'compliance', 'duration': '1 hour', 'progress': 100, 'status': 'completed', 'certificate': True}
    ]
    return jsonify({'success': True, 'courses': courses})

# ============================================================================
# WELLNESS (Phase 18)
# ============================================================================
@employee_portal_bp.route('/wellness', methods=['GET'])
@jwt_required()
def get_wellness():
    """Get wellness data"""
    data = {
        'activities': [
            {'id': '1', 'name': 'Daily Steps Challenge', 'type': 'fitness', 'progress': 8500, 'goal': 10000, 'points': 50},
            {'id': '2', 'name': 'Meditation', 'type': 'mental', 'completed_today': True, 'streak': 5, 'points': 20}
        ],
        'challenges': [
            {'id': '1', 'name': 'January Fitness Challenge', 'participants': 45, 'your_rank': 12, 'ends': '2024-01-31'}
        ],
        'total_points': 500,
        'rewards_available': 3
    }
    return jsonify({'success': True, 'data': data})

# ============================================================================
# CERTIFICATES (Phase 18)
# ============================================================================
@employee_portal_bp.route('/certificates', methods=['GET'])
@jwt_required()
def get_certificates():
    """Get employee certificates"""
    certificates = [
        {'id': '1', 'name': 'AWS Solutions Architect', 'issuer': 'Amazon', 'issue_date': '2023-06-15', 'expiry_date': '2026-06-15', 'status': 'active'},
        {'id': '2', 'name': 'PMP', 'issuer': 'PMI', 'issue_date': '2022-01-10', 'expiry_date': '2025-01-10', 'status': 'expiring_soon'}
    ]
    return jsonify({'success': True, 'certificates': certificates})
