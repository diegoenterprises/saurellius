"""
AUTH ROUTES
Authentication endpoints for login, signup, and token management
"""

from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from models import User, db
from services.email_service import email_service

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register a new user."""
    data = request.get_json()
    
    email = data.get('email', '').lower().strip()
    password = data.get('password')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    
    # Validation
    if not email or not password:
        return jsonify({
            'success': False,
            'message': 'Email and password are required'
        }), 400
    
    if len(password) < 8:
        return jsonify({
            'success': False,
            'message': 'Password must be at least 8 characters'
        }), 400
    
    # Check if user exists
    if User.query.filter_by(email=email).first():
        return jsonify({
            'success': False,
            'message': 'An account with this email already exists'
        }), 409
    
    # Create user
    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        subscription_tier='free',
        subscription_status='active'
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    # Send welcome email
    try:
        email_service.send_welcome_email(
            recipient=email,
            user_name=first_name or email.split('@')[0]
        )
    except Exception as e:
        current_app.logger.warning(f"Failed to send welcome email: {e}")
    
    return jsonify({
        'success': True,
        'message': 'Account created successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return tokens."""
    data = request.get_json()
    
    email = data.get('email', '').lower().strip()
    password = data.get('password')
    
    if not email or not password:
        return jsonify({
            'success': False,
            'message': 'Email and password are required'
        }), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({
            'success': False,
            'message': 'Invalid email or password'
        }), 401
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@auth_bp.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    
    return jsonify({
        'success': True,
        'access_token': access_token
    }), 200


@auth_bp.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/api/auth/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    data = request.get_json()
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Profile updated',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/api/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({
            'success': False,
            'message': 'Current and new password are required'
        }), 400
    
    if not user.check_password(current_password):
        return jsonify({
            'success': False,
            'message': 'Current password is incorrect'
        }), 401
    
    if len(new_password) < 8:
        return jsonify({
            'success': False,
            'message': 'New password must be at least 8 characters'
        }), 400
    
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Password changed successfully'
    }), 200


@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset email."""
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    
    if not email:
        return jsonify({
            'success': False,
            'message': 'Email is required'
        }), 400
    
    user = User.query.filter_by(email=email).first()
    
    # Always return success to prevent email enumeration
    if user:
        # Generate reset token (simplified - in production use proper token)
        import secrets
        reset_token = secrets.token_urlsafe(32)
        
        # Store token (in production, save to database with expiry)
        # user.reset_token = reset_token
        # user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        # db.session.commit()
        
        reset_link = f"https://saurellius.drpaystub.com/reset-password?token={reset_token}"
        
        try:
            email_service.send_password_reset(
                recipient=email,
                reset_link=reset_link
            )
        except Exception as e:
            current_app.logger.error(f"Failed to send reset email: {e}")
    
    return jsonify({
        'success': True,
        'message': 'If an account exists, a reset link will be sent'
    }), 200


@auth_bp.route('/api/auth/profile-picture', methods=['POST'])
@jwt_required()
def update_profile_picture():
    """Update user's profile picture."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    data = request.get_json()
    profile_picture = data.get('profile_picture')  # Base64 encoded image
    
    if not profile_picture:
        return jsonify({
            'success': False,
            'message': 'Profile picture data is required'
        }), 400
    
    # Validate base64 image (basic check)
    if not profile_picture.startswith('data:image'):
        return jsonify({
            'success': False,
            'message': 'Invalid image format. Must be base64 encoded image.'
        }), 400
    
    # Check size (limit to ~2MB base64)
    if len(profile_picture) > 2 * 1024 * 1024:
        return jsonify({
            'success': False,
            'message': 'Image too large. Maximum size is 2MB.'
        }), 400
    
    user.profile_picture = profile_picture
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Profile picture updated successfully',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/api/auth/profile-picture', methods=['DELETE'])
@jwt_required()
def delete_profile_picture():
    """Remove user's profile picture."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    user.profile_picture = None
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Profile picture removed',
        'user': user.to_dict()
    }), 200
