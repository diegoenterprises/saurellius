"""
BETA INVITATION ROUTES
Endpoints for managing beta user invitations
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, User
from services.email_service import email_service

beta_invite_bp = Blueprint('beta_invite', __name__, url_prefix='/api/beta')


@beta_invite_bp.route('/invite', methods=['POST'])
@jwt_required()
def send_beta_invite():
    """Send a single beta invitation email."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can send invites
    if not user or not user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    email = data.get('email')
    name = data.get('name', 'there')
    invite_code = data.get('invite_code')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    success = email_service.send_beta_invitation(email, name, invite_code)
    
    if success:
        return jsonify({
            'message': 'Beta invitation sent successfully',
            'email': email
        }), 200
    else:
        return jsonify({'error': 'Failed to send invitation'}), 500


@beta_invite_bp.route('/invite/bulk', methods=['POST'])
@jwt_required()
def send_bulk_beta_invites():
    """Send beta invitations to multiple recipients."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can send invites
    if not user or not user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    recipients = data.get('recipients', [])
    
    if not recipients:
        return jsonify({'error': 'Recipients list is required'}), 400
    
    if len(recipients) > 100:
        return jsonify({'error': 'Maximum 100 recipients per batch'}), 400
    
    results = email_service.send_bulk_beta_invitations(recipients)
    
    return jsonify({
        'message': f"Sent {results['sent']} invitations, {results['failed']} failed",
        'results': results
    }), 200


@beta_invite_bp.route('/invite/test', methods=['POST'])
@jwt_required()
def send_test_invite():
    """Send a test beta invitation to yourself."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    success = email_service.send_beta_invitation(
        user.email, 
        user.first_name or 'Beta Tester'
    )
    
    if success:
        return jsonify({
            'message': 'Test invitation sent to your email',
            'email': user.email
        }), 200
    else:
        return jsonify({'error': 'Failed to send test invitation'}), 500
