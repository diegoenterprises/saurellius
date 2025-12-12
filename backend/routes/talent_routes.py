# Talent Management Routes
# ATS, Performance Reviews, Goals, LMS, 360 Feedback

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

talent_bp = Blueprint('talent', __name__)

# In-memory storage (replace with database in production)
job_postings = {}
applications = {}
performance_reviews = {}
goals = {}
training_courses = {}
feedback_360 = {}
succession_plans = {}


# =============================================================================
# APPLICANT TRACKING SYSTEM (ATS)
# =============================================================================

@talent_bp.route('/api/talent/jobs', methods=['GET'])
@jwt_required()
def get_job_postings():
    """Get all job postings."""
    company_id = request.args.get('company_id')
    status = request.args.get('status', 'active')
    
    jobs = [j for j in job_postings.values() 
            if j.get('company_id') == company_id and j.get('status') == status]
    
    return jsonify({'success': True, 'jobs': jobs}), 200


@talent_bp.route('/api/talent/jobs', methods=['POST'])
@jwt_required()
def create_job_posting():
    """Create a new job posting."""
    data = request.get_json()
    job_id = str(uuid.uuid4())
    
    job = {
        'id': job_id,
        'company_id': data.get('company_id'),
        'title': data.get('title'),
        'department': data.get('department'),
        'location': data.get('location'),
        'type': data.get('type', 'full-time'),
        'salary_range': data.get('salary_range'),
        'description': data.get('description'),
        'requirements': data.get('requirements', []),
        'benefits': data.get('benefits', []),
        'status': 'active',
        'post_to_boards': data.get('post_to_boards', []),
        'created_at': datetime.now().isoformat(),
        'applications_count': 0
    }
    
    job_postings[job_id] = job
    return jsonify({'success': True, 'job': job}), 201


@talent_bp.route('/api/talent/jobs/<job_id>', methods=['PUT'])
@jwt_required()
def update_job_posting(job_id):
    """Update a job posting."""
    if job_id not in job_postings:
        return jsonify({'success': False, 'message': 'Job not found'}), 404
    
    data = request.get_json()
    job_postings[job_id].update(data)
    job_postings[job_id]['updated_at'] = datetime.now().isoformat()
    
    return jsonify({'success': True, 'job': job_postings[job_id]}), 200


@talent_bp.route('/api/talent/applications', methods=['GET'])
@jwt_required()
def get_applications():
    """Get applications for a job."""
    job_id = request.args.get('job_id')
    status = request.args.get('status')
    
    apps = [a for a in applications.values() if a.get('job_id') == job_id]
    if status:
        apps = [a for a in apps if a.get('status') == status]
    
    return jsonify({'success': True, 'applications': apps}), 200


@talent_bp.route('/api/talent/applications', methods=['POST'])
@jwt_required()
def create_application():
    """Submit a job application."""
    data = request.get_json()
    app_id = str(uuid.uuid4())
    
    application = {
        'id': app_id,
        'job_id': data.get('job_id'),
        'candidate': {
            'name': data.get('name'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'resume_url': data.get('resume_url'),
            'linkedin': data.get('linkedin'),
            'cover_letter': data.get('cover_letter')
        },
        'status': 'new',
        'stage': 'applied',
        'rating': None,
        'notes': [],
        'interviews': [],
        'applied_at': datetime.now().isoformat()
    }
    
    applications[app_id] = application
    
    if data.get('job_id') in job_postings:
        job_postings[data.get('job_id')]['applications_count'] += 1
    
    return jsonify({'success': True, 'application': application}), 201


@talent_bp.route('/api/talent/applications/<app_id>/stage', methods=['PUT'])
@jwt_required()
def update_application_stage(app_id):
    """Update application stage in the pipeline."""
    if app_id not in applications:
        return jsonify({'success': False, 'message': 'Application not found'}), 404
    
    data = request.get_json()
    applications[app_id]['stage'] = data.get('stage')
    applications[app_id]['status'] = data.get('status', applications[app_id]['status'])
    
    return jsonify({'success': True, 'application': applications[app_id]}), 200


@talent_bp.route('/api/talent/applications/<app_id>/interview', methods=['POST'])
@jwt_required()
def schedule_interview(app_id):
    """Schedule an interview for an application."""
    if app_id not in applications:
        return jsonify({'success': False, 'message': 'Application not found'}), 404
    
    data = request.get_json()
    interview = {
        'id': str(uuid.uuid4()),
        'type': data.get('type', 'video'),
        'scheduled_at': data.get('scheduled_at'),
        'duration_minutes': data.get('duration_minutes', 60),
        'interviewers': data.get('interviewers', []),
        'location': data.get('location'),
        'notes': data.get('notes'),
        'status': 'scheduled'
    }
    
    applications[app_id]['interviews'].append(interview)
    applications[app_id]['stage'] = 'interviewing'
    
    return jsonify({'success': True, 'interview': interview}), 201


# =============================================================================
# PERFORMANCE MANAGEMENT
# =============================================================================

@talent_bp.route('/api/talent/reviews', methods=['GET'])
@jwt_required()
def get_performance_reviews():
    """Get performance reviews."""
    employee_id = request.args.get('employee_id')
    period = request.args.get('period')
    
    reviews = list(performance_reviews.values())
    if employee_id:
        reviews = [r for r in reviews if r.get('employee_id') == employee_id]
    if period:
        reviews = [r for r in reviews if r.get('period') == period]
    
    return jsonify({'success': True, 'reviews': reviews}), 200


@talent_bp.route('/api/talent/reviews', methods=['POST'])
@jwt_required()
def create_performance_review():
    """Create a performance review."""
    data = request.get_json()
    review_id = str(uuid.uuid4())
    
    review = {
        'id': review_id,
        'employee_id': data.get('employee_id'),
        'reviewer_id': data.get('reviewer_id'),
        'period': data.get('period'),
        'type': data.get('type', 'annual'),
        'status': 'draft',
        'ratings': {
            'overall': None,
            'performance': None,
            'collaboration': None,
            'communication': None,
            'leadership': None,
            'technical_skills': None
        },
        'goals_achieved': [],
        'strengths': [],
        'areas_for_improvement': [],
        'comments': data.get('comments'),
        'employee_comments': None,
        'development_plan': [],
        'created_at': datetime.now().isoformat()
    }
    
    performance_reviews[review_id] = review
    return jsonify({'success': True, 'review': review}), 201


@talent_bp.route('/api/talent/reviews/<review_id>', methods=['PUT'])
@jwt_required()
def update_performance_review(review_id):
    """Update a performance review."""
    if review_id not in performance_reviews:
        return jsonify({'success': False, 'message': 'Review not found'}), 404
    
    data = request.get_json()
    performance_reviews[review_id].update(data)
    performance_reviews[review_id]['updated_at'] = datetime.now().isoformat()
    
    return jsonify({'success': True, 'review': performance_reviews[review_id]}), 200


# =============================================================================
# GOALS & OKRS
# =============================================================================

@talent_bp.route('/api/talent/goals', methods=['GET'])
@jwt_required()
def get_goals():
    """Get goals for an employee or team."""
    employee_id = request.args.get('employee_id')
    team_id = request.args.get('team_id')
    status = request.args.get('status')
    
    goal_list = list(goals.values())
    if employee_id:
        goal_list = [g for g in goal_list if g.get('employee_id') == employee_id]
    if team_id:
        goal_list = [g for g in goal_list if g.get('team_id') == team_id]
    if status:
        goal_list = [g for g in goal_list if g.get('status') == status]
    
    return jsonify({'success': True, 'goals': goal_list}), 200


@talent_bp.route('/api/talent/goals', methods=['POST'])
@jwt_required()
def create_goal():
    """Create a new goal."""
    data = request.get_json()
    goal_id = str(uuid.uuid4())
    
    goal = {
        'id': goal_id,
        'employee_id': data.get('employee_id'),
        'team_id': data.get('team_id'),
        'title': data.get('title'),
        'description': data.get('description'),
        'type': data.get('type', 'individual'),
        'category': data.get('category'),
        'key_results': data.get('key_results', []),
        'progress': 0,
        'status': 'active',
        'priority': data.get('priority', 'medium'),
        'due_date': data.get('due_date'),
        'aligned_to': data.get('aligned_to'),
        'created_at': datetime.now().isoformat()
    }
    
    goals[goal_id] = goal
    return jsonify({'success': True, 'goal': goal}), 201


@talent_bp.route('/api/talent/goals/<goal_id>/progress', methods=['PUT'])
@jwt_required()
def update_goal_progress(goal_id):
    """Update goal progress."""
    if goal_id not in goals:
        return jsonify({'success': False, 'message': 'Goal not found'}), 404
    
    data = request.get_json()
    goals[goal_id]['progress'] = data.get('progress', 0)
    
    if data.get('key_results'):
        goals[goal_id]['key_results'] = data.get('key_results')
    
    if goals[goal_id]['progress'] >= 100:
        goals[goal_id]['status'] = 'completed'
    
    return jsonify({'success': True, 'goal': goals[goal_id]}), 200


# =============================================================================
# LEARNING MANAGEMENT SYSTEM (LMS)
# =============================================================================

@talent_bp.route('/api/talent/courses', methods=['GET'])
@jwt_required()
def get_training_courses():
    """Get available training courses."""
    category = request.args.get('category')
    required = request.args.get('required')
    
    courses = list(training_courses.values())
    if category:
        courses = [c for c in courses if c.get('category') == category]
    if required:
        courses = [c for c in courses if c.get('required') == (required == 'true')]
    
    return jsonify({'success': True, 'courses': courses}), 200


@talent_bp.route('/api/talent/courses', methods=['POST'])
@jwt_required()
def create_training_course():
    """Create a new training course."""
    data = request.get_json()
    course_id = str(uuid.uuid4())
    
    course = {
        'id': course_id,
        'title': data.get('title'),
        'description': data.get('description'),
        'category': data.get('category'),
        'type': data.get('type', 'online'),
        'duration_hours': data.get('duration_hours'),
        'modules': data.get('modules', []),
        'required': data.get('required', False),
        'compliance_related': data.get('compliance_related', False),
        'certification': data.get('certification'),
        'passing_score': data.get('passing_score', 80),
        'created_at': datetime.now().isoformat()
    }
    
    training_courses[course_id] = course
    return jsonify({'success': True, 'course': course}), 201


@talent_bp.route('/api/talent/courses/<course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_in_course(course_id):
    """Enroll an employee in a course."""
    if course_id not in training_courses:
        return jsonify({'success': False, 'message': 'Course not found'}), 404
    
    data = request.get_json()
    enrollment = {
        'id': str(uuid.uuid4()),
        'course_id': course_id,
        'employee_id': data.get('employee_id'),
        'status': 'enrolled',
        'progress': 0,
        'score': None,
        'enrolled_at': datetime.now().isoformat(),
        'completed_at': None
    }
    
    return jsonify({'success': True, 'enrollment': enrollment}), 201


# =============================================================================
# 360-DEGREE FEEDBACK
# =============================================================================

@talent_bp.route('/api/talent/feedback-360', methods=['GET'])
@jwt_required()
def get_360_feedback():
    """Get 360 feedback for an employee."""
    employee_id = request.args.get('employee_id')
    period = request.args.get('period')
    
    feedback_list = [f for f in feedback_360.values() 
                     if f.get('employee_id') == employee_id]
    if period:
        feedback_list = [f for f in feedback_list if f.get('period') == period]
    
    return jsonify({'success': True, 'feedback': feedback_list}), 200


@talent_bp.route('/api/talent/feedback-360', methods=['POST'])
@jwt_required()
def create_360_feedback():
    """Create a 360 feedback request."""
    data = request.get_json()
    feedback_id = str(uuid.uuid4())
    
    feedback = {
        'id': feedback_id,
        'employee_id': data.get('employee_id'),
        'period': data.get('period'),
        'reviewers': data.get('reviewers', []),
        'questions': data.get('questions', []),
        'responses': [],
        'status': 'pending',
        'anonymous': data.get('anonymous', True),
        'due_date': data.get('due_date'),
        'created_at': datetime.now().isoformat()
    }
    
    feedback_360[feedback_id] = feedback
    return jsonify({'success': True, 'feedback': feedback}), 201


@talent_bp.route('/api/talent/feedback-360/<feedback_id>/respond', methods=['POST'])
@jwt_required()
def submit_360_response(feedback_id):
    """Submit a 360 feedback response."""
    if feedback_id not in feedback_360:
        return jsonify({'success': False, 'message': 'Feedback request not found'}), 404
    
    data = request.get_json()
    response = {
        'reviewer_id': data.get('reviewer_id') if not feedback_360[feedback_id]['anonymous'] else None,
        'relationship': data.get('relationship'),
        'answers': data.get('answers', []),
        'comments': data.get('comments'),
        'submitted_at': datetime.now().isoformat()
    }
    
    feedback_360[feedback_id]['responses'].append(response)
    
    return jsonify({'success': True, 'message': 'Response submitted'}), 201


# =============================================================================
# SUCCESSION PLANNING
# =============================================================================

@talent_bp.route('/api/talent/succession', methods=['GET'])
@jwt_required()
def get_succession_plans():
    """Get succession plans."""
    position_id = request.args.get('position_id')
    
    plans = list(succession_plans.values())
    if position_id:
        plans = [p for p in plans if p.get('position_id') == position_id]
    
    return jsonify({'success': True, 'plans': plans}), 200


@talent_bp.route('/api/talent/succession', methods=['POST'])
@jwt_required()
def create_succession_plan():
    """Create a succession plan."""
    data = request.get_json()
    plan_id = str(uuid.uuid4())
    
    plan = {
        'id': plan_id,
        'position_id': data.get('position_id'),
        'position_title': data.get('position_title'),
        'current_holder': data.get('current_holder'),
        'criticality': data.get('criticality', 'medium'),
        'successors': data.get('successors', []),
        'development_actions': data.get('development_actions', []),
        'timeline': data.get('timeline'),
        'risk_level': data.get('risk_level'),
        'created_at': datetime.now().isoformat()
    }
    
    succession_plans[plan_id] = plan
    return jsonify({'success': True, 'plan': plan}), 201


# =============================================================================
# COMPENSATION BENCHMARKING
# =============================================================================

@talent_bp.route('/api/talent/compensation/benchmark', methods=['POST'])
@jwt_required()
def get_compensation_benchmark():
    """Get compensation benchmarking data."""
    data = request.get_json()
    
    benchmark = {
        'job_title': data.get('job_title'),
        'location': data.get('location'),
        'industry': data.get('industry'),
        'experience_level': data.get('experience_level'),
        'market_data': {
            'percentile_25': 65000,
            'percentile_50': 85000,
            'percentile_75': 110000,
            'percentile_90': 135000
        },
        'recommendations': {
            'competitive_range': {'min': 75000, 'max': 95000},
            'adjustment_needed': None
        },
        'generated_at': datetime.now().isoformat()
    }
    
    return jsonify({'success': True, 'benchmark': benchmark}), 200
