"""
Settings Routes
API endpoints for user and company settings
"""

import os
import base64
import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db

settings_bp = Blueprint('settings', __name__)

UPLOAD_FOLDER = '/var/www/saurellius-api/uploads/avatars'


# ============================================================================
# PROFILE PICTURE UPLOAD
# ============================================================================

@settings_bp.route('/api/profile/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """Upload user profile picture."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    data = request.get_json()
    image_data = data.get('image')  # Base64 encoded image
    
    if not image_data:
        return jsonify({'success': False, 'message': 'No image provided'}), 400
    
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        # Generate unique filename
        filename = f"{user_id}_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save image
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        
        # Update user's avatar URL in database
        avatar_url = f"/uploads/avatars/{filename}"
        user.avatar_url = avatar_url
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile picture updated',
            'avatar_url': avatar_url
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@settings_bp.route('/api/profile/avatar', methods=['GET'])
@jwt_required()
def get_avatar():
    """Get user's current avatar URL."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    return jsonify({
        'success': True,
        'avatar_url': getattr(user, 'avatar_url', None)
    })


# ============================================================================
# NOTIFICATION PREFERENCES
# ============================================================================

@settings_bp.route('/api/notifications/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Get user's notification preferences."""
    user_id = get_jwt_identity()
    
    # In production, fetch from database
    preferences = {
        'push_enabled': True,
        'email_enabled': True,
        'paystub_ready': True,
        'payroll_reminders': True,
        'tax_deadlines': True,
        'employee_updates': True,
        'security_alerts': True,
        'marketing': False,
    }
    
    return jsonify({
        'success': True,
        'data': preferences
    })


@settings_bp.route('/api/notifications/preferences', methods=['PUT'])
@jwt_required()
def update_notification_preferences():
    """Update user's notification preferences."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    preferences = {
        'push_enabled': data.get('push_enabled', True),
        'email_enabled': data.get('email_enabled', True),
        'paystub_ready': data.get('paystub_ready', True),
        'payroll_reminders': data.get('payroll_reminders', True),
        'tax_deadlines': data.get('tax_deadlines', True),
        'employee_updates': data.get('employee_updates', True),
        'security_alerts': data.get('security_alerts', True),
        'marketing': data.get('marketing', False),
    }
    
    return jsonify({
        'success': True,
        'message': 'Notification preferences updated',
        'data': preferences
    })


# ============================================================================
# COMPANY INFO
# ============================================================================

@settings_bp.route('/api/company/info', methods=['GET'])
@jwt_required()
def get_company_info():
    """Get company information."""
    user_id = get_jwt_identity()
    
    company_info = {
        'company_name': 'Diego Enterprises LLC',
        'ein': 'XX-XXXXXXX',
        'address': '123 Business Center Dr',
        'city': 'Houston',
        'state': 'TX',
        'zip': '77001',
        'phone': '(555) 123-4567',
        'email': 'payroll@diegoenterprises.com',
        'industry': 'Technology',
        'employee_count': 25,
        'founded_year': 2020,
    }
    
    return jsonify({
        'success': True,
        'data': company_info
    })


@settings_bp.route('/api/company/info', methods=['PUT'])
@jwt_required()
def update_company_info():
    """Update company information."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    updated_info = {
        'company_name': data.get('company_name'),
        'address': data.get('address'),
        'city': data.get('city'),
        'state': data.get('state'),
        'zip': data.get('zip'),
        'phone': data.get('phone'),
        'email': data.get('email'),
    }
    
    return jsonify({
        'success': True,
        'message': 'Company information updated',
        'data': updated_info
    })


# ============================================================================
# SECURITY SETTINGS
# ============================================================================

@settings_bp.route('/api/security/settings', methods=['GET'])
@jwt_required()
def get_security_settings():
    """Get user's security settings."""
    user_id = get_jwt_identity()
    
    settings = {
        'two_factor_enabled': True,
        'sms_auth': False,
        'email_auth': True,
        'app_auth': False,
        'login_notifications': True,
        'active_sessions': 1,
        'last_password_change': '2024-11-15',
        'password_expires_in_days': 90,
    }
    
    return jsonify({
        'success': True,
        'data': settings
    })


@settings_bp.route('/api/security/settings', methods=['PUT'])
@jwt_required()
def update_security_settings():
    """Update user's security settings."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    updated_settings = {}
    
    if 'two_factor_enabled' in data:
        updated_settings['two_factor_enabled'] = data['two_factor_enabled']
    if 'sms_auth' in data:
        updated_settings['sms_auth'] = data['sms_auth']
    if 'email_auth' in data:
        updated_settings['email_auth'] = data['email_auth']
    if 'app_auth' in data:
        updated_settings['app_auth'] = data['app_auth']
    if 'login_notifications' in data:
        updated_settings['login_notifications'] = data['login_notifications']
    
    return jsonify({
        'success': True,
        'message': 'Security settings updated',
        'data': updated_settings
    })


# ============================================================================
# PAYMENT METHODS
# ============================================================================

@settings_bp.route('/api/billing/payment-methods', methods=['GET'])
@jwt_required()
def get_payment_methods():
    """Get user's payment methods."""
    user_id = get_jwt_identity()
    
    payment_methods = [
        {
            'id': 'pm_1',
            'type': 'card',
            'last4': '4242',
            'brand': 'Visa',
            'exp_month': 12,
            'exp_year': 2026,
            'isDefault': True,
        },
        {
            'id': 'pm_2',
            'type': 'card',
            'last4': '5555',
            'brand': 'Mastercard',
            'exp_month': 6,
            'exp_year': 2025,
            'isDefault': False,
        },
    ]
    
    return jsonify({
        'success': True,
        'data': payment_methods
    })


@settings_bp.route('/api/billing/payment-methods/<method_id>/default', methods=['PUT'])
@jwt_required()
def set_default_payment_method(method_id):
    """Set a payment method as default."""
    user_id = get_jwt_identity()
    
    return jsonify({
        'success': True,
        'message': f'Payment method {method_id} set as default'
    })


@settings_bp.route('/api/billing/payment-methods/<method_id>', methods=['DELETE'])
@jwt_required()
def delete_payment_method(method_id):
    """Delete a payment method."""
    user_id = get_jwt_identity()
    
    return jsonify({
        'success': True,
        'message': f'Payment method {method_id} deleted'
    })


# ============================================================================
# USER PREFERENCES
# ============================================================================

@settings_bp.route('/api/settings/preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get user's app preferences."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    preferences = {
        'language': getattr(user, 'language', 'en') or 'en',
        'timezone': getattr(user, 'timezone', 'America/Chicago') or 'America/Chicago',
        'dark_mode': getattr(user, 'dark_mode', True),
        'auto_clock_out': getattr(user, 'auto_clock_out', False),
        'date_format': getattr(user, 'date_format', 'MM/DD/YYYY') or 'MM/DD/YYYY',
        'currency': getattr(user, 'currency', 'USD') or 'USD',
    }
    
    return jsonify({
        'success': True,
        'data': preferences
    })


@settings_bp.route('/api/settings/preferences', methods=['PUT'])
@jwt_required()
def update_user_preferences():
    """Update user's app preferences."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    data = request.get_json()
    
    updated = {}
    for key in ['language', 'timezone', 'dark_mode', 'auto_clock_out', 'date_format', 'currency']:
        if key in data:
            setattr(user, key, data[key])
            updated[key] = data[key]
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    
    return jsonify({
        'success': True,
        'message': 'Preferences updated',
        'data': updated
    })


# ============================================================================
# LOGOUT ALL SESSIONS
# ============================================================================

@settings_bp.route('/api/auth/logout-all', methods=['POST'])
@jwt_required()
def logout_all_sessions():
    """Log out from all devices."""
    user_id = get_jwt_identity()
    
    # In production, invalidate all tokens for this user
    
    return jsonify({
        'success': True,
        'message': 'Logged out from all devices'
    })
