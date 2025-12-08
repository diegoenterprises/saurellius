"""
🔄 SAURELLIUS SWIPE API ROUTES
Schedule swap management endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.swipe_service import swipe_service, POSITION_COLORS

swipe_bp = Blueprint('swipe', __name__, url_prefix='/api/swipe')


# ==================== SHIFTS ====================

@swipe_bp.route('/shifts', methods=['GET'])
@jwt_required()
def get_my_shifts():
    """Get current user's shifts."""
    user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = swipe_service.get_employee_shifts(user_id, start_date, end_date)
    return jsonify(result)


@swipe_bp.route('/shifts/<shift_id>', methods=['GET'])
@jwt_required()
def get_shift(shift_id):
    """Get a specific shift."""
    result = swipe_service.get_shift(shift_id)
    return jsonify(result)


@swipe_bp.route('/shifts/<shift_id>/available', methods=['POST'])
@jwt_required()
def mark_available(shift_id):
    """Mark a shift as available for swap."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    note = data.get('note', '')
    
    result = swipe_service.mark_shift_available(shift_id, user_id, note)
    return jsonify(result)


@swipe_bp.route('/available', methods=['GET'])
@jwt_required()
def get_available_shifts():
    """Get all shifts available for swap."""
    user_id = get_jwt_identity()
    result = swipe_service.get_available_shifts(user_id)
    return jsonify(result)


# ==================== SWAP REQUESTS ====================

@swipe_bp.route('/request', methods=['POST'])
@jwt_required()
def create_swap_request():
    """Create a new swap request."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    requester_name = data.get('requester_name', f'User {user_id}')
    requester_shift_id = data.get('my_shift_id')
    target_id = data.get('target_id')
    target_name = data.get('target_name', f'User {target_id}')
    target_shift_id = data.get('target_shift_id')
    reason = data.get('reason', '')
    
    if not all([requester_shift_id, target_id, target_shift_id]):
        return jsonify({
            'success': False,
            'error': 'my_shift_id, target_id, and target_shift_id are required'
        }), 400
    
    result = swipe_service.create_swap_request(
        requester_id=user_id,
        requester_name=requester_name,
        requester_shift_id=requester_shift_id,
        target_id=target_id,
        target_name=target_name,
        target_shift_id=target_shift_id,
        reason=reason
    )
    
    return jsonify(result)


@swipe_bp.route('/request/<request_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_request(request_id):
    """Respond to a swap request (accept/decline)."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    accept = data.get('accept', False)
    message = data.get('message', '')
    
    result = swipe_service.respond_to_request(request_id, user_id, accept, message)
    return jsonify(result)


@swipe_bp.route('/requests/my', methods=['GET'])
@jwt_required()
def get_my_requests():
    """Get swap requests for current user."""
    user_id = get_jwt_identity()
    result = swipe_service.get_requests_for_employee(user_id)
    return jsonify(result)


@swipe_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get swap history."""
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 50, type=int)
    result = swipe_service.get_swap_history(user_id, limit)
    return jsonify(result)


# ==================== MANAGER APPROVAL ====================

@swipe_bp.route('/approval/pending', methods=['GET'])
@jwt_required()
def get_pending_approvals():
    """Get all requests pending manager approval."""
    department = request.args.get('department')
    result = swipe_service.get_pending_requests_for_manager(department)
    return jsonify(result)


@swipe_bp.route('/approval/<request_id>/review', methods=['POST'])
@jwt_required()
def manager_review(request_id):
    """Manager reviews and approves/denies a swap request."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    approve = data.get('approve', False)
    manager_name = data.get('manager_name', f'Manager {user_id}')
    notes = data.get('notes', '')
    
    result = swipe_service.manager_review(
        request_id=request_id,
        manager_id=user_id,
        manager_name=manager_name,
        approve=approve,
        notes=notes
    )
    
    return jsonify(result)


# ==================== UTILITIES ====================

@swipe_bp.route('/positions', methods=['GET'])
@jwt_required()
def get_positions():
    """Get available position colors."""
    return jsonify({
        'success': True,
        'positions': POSITION_COLORS
    })
