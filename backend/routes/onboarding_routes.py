"""
ONBOARDING ROUTES
Employee onboarding workflows, tasks, documents API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

onboarding_bp = Blueprint('onboarding', __name__, url_prefix='/api/onboarding')


@onboarding_bp.route('', methods=['GET'])
@jwt_required()
def get_all_onboardings():
    """Get all onboarding workflows"""
    from services.onboarding_service import onboarding_service
    
    status = request.args.get('status')
    department = request.args.get('department')
    
    onboardings = onboarding_service.get_all_onboardings(
        status=status,
        department=department
    )
    
    return jsonify({'success': True, 'onboardings': onboardings})


@onboarding_bp.route('', methods=['POST'])
@jwt_required()
def create_onboarding():
    """Create onboarding for new employee"""
    from services.onboarding_service import onboarding_service
    
    data = request.get_json()
    data['created_by'] = get_jwt_identity()
    
    try:
        onboarding = onboarding_service.create_onboarding(
            employee_id=data['employee_id'],
            data=data
        )
        return jsonify({'success': True, 'onboarding': onboarding}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@onboarding_bp.route('/<onboarding_id>', methods=['GET'])
@jwt_required()
def get_onboarding(onboarding_id):
    """Get onboarding by ID"""
    from services.onboarding_service import onboarding_service
    
    onboarding = onboarding_service.get_onboarding(onboarding_id)
    if not onboarding:
        return jsonify({'success': False, 'message': 'Onboarding not found'}), 404
    
    return jsonify({'success': True, 'onboarding': onboarding})


@onboarding_bp.route('/employee/<employee_id>', methods=['GET'])
@jwt_required()
def get_onboarding_by_employee(employee_id):
    """Get onboarding for an employee"""
    from services.onboarding_service import onboarding_service
    
    onboarding = onboarding_service.get_onboarding_by_employee(employee_id)
    if not onboarding:
        return jsonify({'success': False, 'message': 'No onboarding found for employee'}), 404
    
    return jsonify({'success': True, 'onboarding': onboarding})


@onboarding_bp.route('/<onboarding_id>/start', methods=['POST'])
@jwt_required()
def start_onboarding(onboarding_id):
    """Start onboarding workflow"""
    from services.onboarding_service import onboarding_service
    
    try:
        onboarding = onboarding_service.start_onboarding(onboarding_id)
        return jsonify({'success': True, 'onboarding': onboarding})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@onboarding_bp.route('/<onboarding_id>/tasks/<task_id>/submit', methods=['POST'])
@jwt_required()
def submit_task_data(onboarding_id, task_id):
    """Submit data for a task"""
    from services.onboarding_service import onboarding_service
    
    data = request.get_json()
    
    try:
        task = onboarding_service.submit_task_data(onboarding_id, task_id, data)
        return jsonify({'success': True, 'task': task})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@onboarding_bp.route('/<onboarding_id>/tasks/<task_id>/complete', methods=['POST'])
@jwt_required()
def complete_task(onboarding_id, task_id):
    """Complete a task"""
    from services.onboarding_service import onboarding_service
    
    data = request.get_json() or {}
    completed_by = get_jwt_identity()
    
    try:
        task = onboarding_service.complete_task(
            onboarding_id, 
            task_id, 
            completed_by,
            data=data.get('data')
        )
        return jsonify({'success': True, 'task': task})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@onboarding_bp.route('/<onboarding_id>/documents', methods=['POST'])
@jwt_required()
def upload_document(onboarding_id):
    """Upload a document"""
    from services.onboarding_service import onboarding_service
    
    data = request.get_json()
    data['uploaded_by'] = get_jwt_identity()
    
    try:
        document = onboarding_service.upload_document(
            onboarding_id,
            task_id=data['task_id'],
            document_data=data
        )
        return jsonify({'success': True, 'document': document}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@onboarding_bp.route('/<onboarding_id>/signatures', methods=['POST'])
@jwt_required()
def request_signature(onboarding_id):
    """Request e-signature"""
    from services.onboarding_service import onboarding_service
    
    data = request.get_json()
    
    try:
        signature = onboarding_service.request_signature(
            onboarding_id,
            document_id=data['document_id'],
            signer_id=data['signer_id'],
            signer_email=data['signer_email']
        )
        return jsonify({'success': True, 'signature_request': signature}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@onboarding_bp.route('/signatures/<signature_id>/sign', methods=['POST'])
@jwt_required()
def record_signature(signature_id):
    """Record an e-signature"""
    from services.onboarding_service import onboarding_service
    
    data = request.get_json()
    data['ip_address'] = request.remote_addr
    data['user_agent'] = request.user_agent.string
    
    try:
        signature = onboarding_service.record_signature(signature_id, data)
        return jsonify({'success': True, 'signature': signature})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@onboarding_bp.route('/<onboarding_id>/complete', methods=['POST'])
@jwt_required()
def complete_onboarding(onboarding_id):
    """Complete onboarding workflow"""
    from services.onboarding_service import onboarding_service
    
    completed_by = get_jwt_identity()
    
    try:
        onboarding = onboarding_service.complete_onboarding(onboarding_id, completed_by)
        return jsonify({'success': True, 'onboarding': onboarding})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@onboarding_bp.route('/pending-tasks', methods=['GET'])
@jwt_required()
def get_pending_tasks():
    """Get pending tasks for current user"""
    from services.onboarding_service import onboarding_service
    
    assignee_id = get_jwt_identity()
    tasks = onboarding_service.get_pending_tasks(assignee_id)
    
    return jsonify({'success': True, 'tasks': tasks})


@onboarding_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_metrics():
    """Get onboarding metrics"""
    from services.onboarding_service import onboarding_service
    
    metrics = onboarding_service.get_onboarding_metrics()
    
    return jsonify({'success': True, 'metrics': metrics})


@onboarding_bp.route('/<onboarding_id>/reminder', methods=['POST'])
@jwt_required()
def send_reminder(onboarding_id):
    """Send reminder for incomplete onboarding"""
    from services.onboarding_service import onboarding_service
    
    try:
        result = onboarding_service.send_reminder(onboarding_id)
        return jsonify({'success': True, 'reminder': result})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
