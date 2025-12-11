# Employee Experience Routes
# Financial wellness, charitable giving, engagement surveys

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

employee_exp_bp = Blueprint('employee_experience', __name__)

# In-memory storage
wellness_assessments = {}
charitable_donations = {}
engagement_surveys = {}
survey_responses = {}


# =============================================================================
# FINANCIAL WELLNESS
# =============================================================================

@employee_exp_bp.route('/api/employee-experience/wellness/assessment', methods=['GET'])
@jwt_required()
def get_wellness_assessment():
    """Get financial wellness assessment for an employee."""
    employee_id = request.args.get('employee_id')
    
    assessment = {
        'employee_id': employee_id,
        'overall_score': 72,
        'categories': {
            'savings': {'score': 65, 'status': 'needs_attention'},
            'debt_management': {'score': 78, 'status': 'good'},
            'retirement_planning': {'score': 70, 'status': 'fair'},
            'emergency_fund': {'score': 55, 'status': 'needs_attention'},
            'budgeting': {'score': 85, 'status': 'excellent'}
        },
        'recommendations': [
            {'priority': 'high', 'action': 'Build emergency fund to cover 3-6 months expenses'},
            {'priority': 'medium', 'action': 'Increase 401(k) contribution to maximize employer match'},
            {'priority': 'low', 'action': 'Consider debt consolidation for lower interest rates'}
        ],
        'resources': [
            {'type': 'article', 'title': 'Building Your Emergency Fund', 'url': '/resources/emergency-fund'},
            {'type': 'calculator', 'title': 'Retirement Savings Calculator', 'url': '/tools/retirement-calc'},
            {'type': 'webinar', 'title': 'Debt Management Strategies', 'url': '/webinars/debt-management'}
        ],
        'assessed_at': datetime.now().isoformat()
    }
    
    return jsonify({'success': True, 'assessment': assessment}), 200


@employee_exp_bp.route('/api/employee-experience/wellness/goals', methods=['GET'])
@jwt_required()
def get_wellness_goals():
    """Get financial wellness goals for an employee."""
    employee_id = request.args.get('employee_id')
    
    goals = [
        {
            'id': 'goal_001',
            'title': 'Build Emergency Fund',
            'target_amount': 10000,
            'current_amount': 3500,
            'progress': 35,
            'due_date': '2025-12-31'
        },
        {
            'id': 'goal_002',
            'title': 'Pay Off Credit Card',
            'target_amount': 5000,
            'current_amount': 2200,
            'progress': 56,
            'due_date': '2025-06-30'
        }
    ]
    
    return jsonify({'success': True, 'goals': goals}), 200


@employee_exp_bp.route('/api/employee-experience/wellness/goals', methods=['POST'])
@jwt_required()
def create_wellness_goal():
    """Create a financial wellness goal."""
    data = request.get_json()
    goal_id = str(uuid.uuid4())
    
    goal = {
        'id': goal_id,
        'employee_id': data.get('employee_id'),
        'title': data.get('title'),
        'description': data.get('description'),
        'target_amount': data.get('target_amount'),
        'current_amount': 0,
        'progress': 0,
        'due_date': data.get('due_date'),
        'category': data.get('category'),
        'created_at': datetime.now().isoformat()
    }
    
    return jsonify({'success': True, 'goal': goal}), 201


# =============================================================================
# CHARITABLE GIVING
# =============================================================================

@employee_exp_bp.route('/api/employee-experience/charitable/organizations', methods=['GET'])
@jwt_required()
def get_charitable_organizations():
    """Get available charitable organizations."""
    organizations = [
        {'id': 'org_001', 'name': 'American Red Cross', 'category': 'Humanitarian', 'ein': '53-0196605'},
        {'id': 'org_002', 'name': 'United Way', 'category': 'Community', 'ein': '13-1635294'},
        {'id': 'org_003', 'name': 'Habitat for Humanity', 'category': 'Housing', 'ein': '91-1914868'},
        {'id': 'org_004', 'name': 'World Wildlife Fund', 'category': 'Environment', 'ein': '52-1693387'},
        {'id': 'org_005', 'name': 'St. Jude Children\'s Research', 'category': 'Health', 'ein': '62-0646012'}
    ]
    return jsonify({'success': True, 'organizations': organizations}), 200


@employee_exp_bp.route('/api/employee-experience/charitable/donations', methods=['GET'])
@jwt_required()
def get_employee_donations():
    """Get employee's charitable donations."""
    employee_id = request.args.get('employee_id')
    
    donations = [d for d in charitable_donations.values() 
                 if d.get('employee_id') == employee_id]
    
    total_ytd = sum(d.get('amount', 0) * d.get('frequency_multiplier', 1) for d in donations)
    
    return jsonify({
        'success': True, 
        'donations': donations,
        'total_ytd': total_ytd
    }), 200


@employee_exp_bp.route('/api/employee-experience/charitable/donations', methods=['POST'])
@jwt_required()
def setup_charitable_donation():
    """Set up recurring charitable donation from paycheck."""
    data = request.get_json()
    donation_id = str(uuid.uuid4())
    
    donation = {
        'id': donation_id,
        'employee_id': data.get('employee_id'),
        'organization_id': data.get('organization_id'),
        'organization_name': data.get('organization_name'),
        'amount': data.get('amount'),
        'frequency': data.get('frequency', 'per_paycheck'),
        'frequency_multiplier': 26 if data.get('frequency') == 'per_paycheck' else 12,
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date'),
        'active': True,
        'tax_deductible': True,
        'created_at': datetime.now().isoformat()
    }
    
    charitable_donations[donation_id] = donation
    return jsonify({'success': True, 'donation': donation}), 201


@employee_exp_bp.route('/api/employee-experience/charitable/matching', methods=['GET'])
@jwt_required()
def get_employer_matching():
    """Get employer matching program details."""
    company_id = request.args.get('company_id')
    
    matching = {
        'enabled': True,
        'match_ratio': 1.0,
        'max_match_per_year': 2500,
        'eligible_organizations': 'all_501c3',
        'waiting_period_days': 90,
        'employee_matched_ytd': 850,
        'remaining_match': 1650
    }
    
    return jsonify({'success': True, 'matching': matching}), 200


# =============================================================================
# ENGAGEMENT SURVEYS
# =============================================================================

@employee_exp_bp.route('/api/employee-experience/surveys', methods=['GET'])
@jwt_required()
def get_surveys():
    """Get available surveys."""
    company_id = request.args.get('company_id')
    status = request.args.get('status', 'active')
    
    surveys = [s for s in engagement_surveys.values() 
               if s.get('company_id') == company_id and s.get('status') == status]
    
    return jsonify({'success': True, 'surveys': surveys}), 200


@employee_exp_bp.route('/api/employee-experience/surveys', methods=['POST'])
@jwt_required()
def create_survey():
    """Create an engagement survey."""
    data = request.get_json()
    survey_id = str(uuid.uuid4())
    
    survey = {
        'id': survey_id,
        'company_id': data.get('company_id'),
        'title': data.get('title'),
        'description': data.get('description'),
        'type': data.get('type', 'engagement'),
        'questions': data.get('questions', []),
        'anonymous': data.get('anonymous', True),
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date'),
        'status': 'draft',
        'response_count': 0,
        'created_at': datetime.now().isoformat()
    }
    
    engagement_surveys[survey_id] = survey
    return jsonify({'success': True, 'survey': survey}), 201


@employee_exp_bp.route('/api/employee-experience/surveys/<survey_id>/respond', methods=['POST'])
@jwt_required()
def submit_survey_response(survey_id):
    """Submit a survey response."""
    if survey_id not in engagement_surveys:
        return jsonify({'success': False, 'message': 'Survey not found'}), 404
    
    data = request.get_json()
    response_id = str(uuid.uuid4())
    
    response = {
        'id': response_id,
        'survey_id': survey_id,
        'employee_id': None if engagement_surveys[survey_id]['anonymous'] else data.get('employee_id'),
        'answers': data.get('answers', []),
        'submitted_at': datetime.now().isoformat()
    }
    
    survey_responses[response_id] = response
    engagement_surveys[survey_id]['response_count'] += 1
    
    return jsonify({'success': True, 'message': 'Response submitted'}), 201


@employee_exp_bp.route('/api/employee-experience/surveys/<survey_id>/results', methods=['GET'])
@jwt_required()
def get_survey_results(survey_id):
    """Get survey results and analytics."""
    if survey_id not in engagement_surveys:
        return jsonify({'success': False, 'message': 'Survey not found'}), 404
    
    results = {
        'survey_id': survey_id,
        'response_count': engagement_surveys[survey_id]['response_count'],
        'response_rate': 78.5,
        'overall_score': 4.2,
        'by_question': [
            {'question': 'Job satisfaction', 'avg_score': 4.3, 'responses': 125},
            {'question': 'Work-life balance', 'avg_score': 3.8, 'responses': 125},
            {'question': 'Management support', 'avg_score': 4.1, 'responses': 125}
        ],
        'trends': {
            'vs_last_survey': '+0.3',
            'vs_industry': '+0.5'
        },
        'key_insights': [
            'Work-life balance scores decreased 5% from last quarter',
            'Management support improved significantly after training program'
        ]
    }
    
    return jsonify({'success': True, 'results': results}), 200


# =============================================================================
# RECOGNITION & REWARDS (Enhanced)
# =============================================================================

@employee_exp_bp.route('/api/employee-experience/recognition/give', methods=['POST'])
@jwt_required()
def give_recognition():
    """Give recognition to a colleague."""
    data = request.get_json()
    recognition_id = str(uuid.uuid4())
    
    recognition = {
        'id': recognition_id,
        'from_employee_id': data.get('from_employee_id'),
        'to_employee_id': data.get('to_employee_id'),
        'type': data.get('type', 'kudos'),
        'category': data.get('category'),
        'message': data.get('message'),
        'points': data.get('points', 10),
        'public': data.get('public', True),
        'created_at': datetime.now().isoformat()
    }
    
    return jsonify({'success': True, 'recognition': recognition}), 201


@employee_exp_bp.route('/api/employee-experience/recognition/leaderboard', methods=['GET'])
@jwt_required()
def get_recognition_leaderboard():
    """Get recognition leaderboard."""
    company_id = request.args.get('company_id')
    period = request.args.get('period', 'month')
    
    leaderboard = {
        'period': period,
        'top_receivers': [
            {'employee_id': 'emp_001', 'name': 'John Smith', 'points': 250, 'recognitions': 12},
            {'employee_id': 'emp_015', 'name': 'Sarah Johnson', 'points': 220, 'recognitions': 10},
            {'employee_id': 'emp_032', 'name': 'Mike Brown', 'points': 180, 'recognitions': 8}
        ],
        'top_givers': [
            {'employee_id': 'emp_008', 'name': 'Lisa Davis', 'given': 15},
            {'employee_id': 'emp_022', 'name': 'Tom Wilson', 'given': 12}
        ],
        'by_department': [
            {'department': 'Engineering', 'total_points': 850},
            {'department': 'Sales', 'total_points': 720}
        ]
    }
    
    return jsonify({'success': True, 'leaderboard': leaderboard}), 200
