"""
📧 EMAIL ROUTES
Email notification endpoints
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db
from services.email_service import email_service

email_bp = Blueprint('email', __name__)


@email_bp.route('/api/email/send-paystub', methods=['POST'])
@jwt_required()
def send_paystub_email():
    """Send paystub notification to employee."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    recipient = data.get('recipient')
    employee_name = data.get('employee_name')
    pay_date = data.get('pay_date')
    paystub_url = data.get('paystub_url')
    
    if not all([recipient, employee_name, pay_date]):
        return jsonify({
            'success': False,
            'message': 'Missing required fields: recipient, employee_name, pay_date'
        }), 400
    
    success = email_service.send_paystub_notification(
        recipient=recipient,
        employee_name=employee_name,
        pay_date=pay_date,
        paystub_url=paystub_url
    )
    
    if success:
        return jsonify({
            'success': True,
            'message': f'Paystub notification sent to {recipient}'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to send email. Please try again.'
        }), 500


@email_bp.route('/api/email/send-welcome', methods=['POST'])
@jwt_required()
def send_welcome_email():
    """Send welcome email to new user (admin endpoint)."""
    data = request.get_json()
    
    recipient = data.get('recipient')
    user_name = data.get('user_name')
    
    if not all([recipient, user_name]):
        return jsonify({
            'success': False,
            'message': 'Missing required fields: recipient, user_name'
        }), 400
    
    success = email_service.send_welcome_email(
        recipient=recipient,
        user_name=user_name
    )
    
    if success:
        return jsonify({
            'success': True,
            'message': f'Welcome email sent to {recipient}'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to send welcome email.'
        }), 500


@email_bp.route('/api/email/password-reset', methods=['POST'])
def request_password_reset():
    """Send password reset email (public endpoint)."""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({
            'success': False,
            'message': 'Email address is required'
        }), 400
    
    # Find user
    user = User.query.filter_by(email=email).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return jsonify({
            'success': True,
            'message': 'If an account exists with this email, a reset link will be sent.'
        }), 200
    
    # Generate reset token
    import secrets
    reset_token = secrets.token_urlsafe(32)
    
    # Build reset link
    reset_link = f"https://saurellius.drpaystub.com/reset-password?token={reset_token}"
    
    success = email_service.send_password_reset(
        recipient=email,
        reset_link=reset_link
    )
    
    return jsonify({
        'success': True,
        'message': 'If an account exists with this email, a reset link will be sent.'
    }), 200


@email_bp.route('/api/email/subscription-confirmed', methods=['POST'])
@jwt_required()
def send_subscription_email():
    """Send subscription confirmation email."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    data = request.get_json()
    plan_name = data.get('plan_name', 'Professional')
    monthly_price = data.get('monthly_price', 100.00)
    
    success = email_service.send_subscription_confirmation(
        recipient=user.email,
        user_name=user.full_name,
        plan_name=plan_name,
        monthly_price=monthly_price
    )
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Subscription confirmation sent'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to send confirmation email.'
        }), 500


@email_bp.route('/api/email/test', methods=['POST'])
@jwt_required()
def send_test_email():
    """Send a test email to verify configuration."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    subject = "Test Email - Saurellius"
    body_html = """
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1473FF;"> Test Email Successful!</h1>
        <p>Your Resend email configuration is working correctly.</p>
        <p style="color: #666;">Sent from Saurellius Cloud Payroll Management</p>
    </body>
    </html>
    """
    
    success = email_service.send_email(
        recipient=user.email,
        subject=subject,
        body_html=body_html,
        body_text="Test email successful! Your email configuration is working correctly."
    )
    
    if success:
        return jsonify({
            'success': True,
            'message': f'Test email sent to {user.email}'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to send test email. Check your Resend configuration.'
        }), 500
