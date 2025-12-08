"""
💳 STRIPE ROUTES
Stripe payment, subscription, and webhook endpoints
"""

import stripe
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Subscription, Invoice, db
from services.email_service import email_service
from billing import BillingManager

stripe_bp = Blueprint('stripe', __name__)


@stripe_bp.route('/api/stripe/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Create Stripe checkout session for subscription."""
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    data = request.get_json()
    plan = data.get('plan', 'starter')
    
    # Get price ID for plan
    price_id = BillingManager.get_stripe_price_id(plan)
    if not price_id:
        return jsonify({'success': False, 'message': 'Invalid plan'}), 400
    
    try:
        # Create or retrieve Stripe customer
        if user.stripe_customer_id:
            customer_id = user.stripe_customer_id
        else:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.full_name,
                metadata={'user_id': user.id}
            )
            customer_id = customer.id
            user.stripe_customer_id = customer_id
            db.session.commit()
        
        # Create checkout session
        base_url = request.host_url.rstrip('/')
        
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{base_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/subscription/cancel",
            metadata={
                'user_id': str(user.id),
                'plan': plan
            }
        )
        
        return jsonify({
            'success': True,
            'session_id': session.id,
            'url': session.url
        }), 200
        
    except stripe.error.StripeError as e:
        current_app.logger.error(f"Stripe error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 400


@stripe_bp.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events."""
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    webhook_secret = current_app.config['STRIPE_WEBHOOK_SECRET']
    
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        current_app.logger.error(f"Invalid webhook payload: {e}")
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        current_app.logger.error(f"Invalid webhook signature: {e}")
        return jsonify({'error': 'Invalid signature'}), 400
    
    event_type = event['type']
    current_app.logger.info(f"Processing Stripe webhook: {event_type}")
    
    # Handle subscription events
    if event_type == 'checkout.session.completed':
        session = event['data']['object']
        handle_successful_checkout(session)
    
    elif event_type == 'customer.subscription.created':
        subscription = event['data']['object']
        handle_subscription_created(subscription)
    
    elif event_type == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_update(subscription)
    
    elif event_type == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_cancelled(subscription)
    
    elif event_type == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_successful_payment(invoice)
    
    elif event_type == 'invoice.payment_failed':
        invoice = event['data']['object']
        handle_failed_payment(invoice)
    
    elif event_type == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_intent_succeeded(payment_intent)
    
    elif event_type == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        handle_payment_intent_failed(payment_intent)
    
    return jsonify({'success': True, 'event': event_type}), 200


def handle_successful_checkout(session):
    """Handle successful checkout completion."""
    user_id = session['metadata'].get('user_id')
    plan = session['metadata'].get('plan')
    subscription_id = session.get('subscription')
    customer_id = session.get('customer')
    
    user = User.query.get(user_id)
    if user:
        user.subscription_tier = plan
        user.stripe_subscription_id = subscription_id
        user.stripe_customer_id = customer_id
        user.subscription_status = 'active'
        user.paystubs_this_month = 0  # Reset usage
        db.session.commit()
        
        # Send confirmation email
        billing = BillingManager(user)
        plan_info = billing.get_plan_info(plan)
        try:
            email_service.send_subscription_confirmation(
                recipient=user.email,
                user_name=user.full_name,
                plan_name=plan_info['name'],
                monthly_price=plan_info['monthly_price']
            )
        except Exception as e:
            current_app.logger.warning(f"Failed to send confirmation email: {e}")
        
        current_app.logger.info(f"User {user_id} subscribed to {plan} plan")


def handle_subscription_created(subscription):
    """Handle new subscription creation."""
    customer_id = subscription['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user:
        user.stripe_subscription_id = subscription['id']
        user.subscription_status = subscription['status']
        db.session.commit()
        current_app.logger.info(f"Subscription created for user {user.id}")


def handle_subscription_update(subscription):
    """Handle subscription update (plan change, renewal, etc)."""
    customer_id = subscription['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user:
        user.subscription_status = subscription['status']
        
        # Check for plan change
        if subscription.get('items', {}).get('data'):
            price_id = subscription['items']['data'][0].get('price', {}).get('id')
            # Map price ID to plan name
            for plan_name, plan_price_id in current_app.config.get('STRIPE_PRICES', {}).items():
                if plan_price_id == price_id:
                    user.subscription_tier = plan_name
                    break
        
        db.session.commit()
        current_app.logger.info(f"Subscription updated for user {user.id}")


def handle_subscription_cancelled(subscription):
    """Handle subscription cancellation."""
    customer_id = subscription['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user:
        user.subscription_status = 'cancelled'
        user.subscription_tier = 'free'
        db.session.commit()
        current_app.logger.info(f"Subscription cancelled for user {user.id}")


def handle_successful_payment(invoice):
    """Handle successful invoice payment."""
    customer_id = invoice['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user:
        if user.subscription_status != 'active':
            user.subscription_status = 'active'
        
        # Reset monthly usage on successful payment (new billing cycle)
        user.paystubs_this_month = 0
        db.session.commit()
        
        current_app.logger.info(f"Payment succeeded for user {user.id}")


def handle_failed_payment(invoice):
    """Handle failed payment."""
    customer_id = invoice['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user:
        user.subscription_status = 'past_due'
        db.session.commit()
        
        # Send payment failed email
        amount = invoice.get('amount_due', 0) / 100
        try:
            email_service.send_payment_failed(
                recipient=user.email,
                user_name=user.full_name,
                amount=amount
            )
        except Exception as e:
            current_app.logger.warning(f"Failed to send payment failed email: {e}")
        
        current_app.logger.warning(f"Payment failed for user {user.id}")


def handle_payment_intent_succeeded(payment_intent):
    """Handle successful payment intent."""
    customer_id = payment_intent.get('customer')
    amount = payment_intent.get('amount', 0) / 100
    
    if customer_id:
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            current_app.logger.info(f"Payment intent succeeded for user {user.id}: ${amount:.2f}")


def handle_payment_intent_failed(payment_intent):
    """Handle failed payment intent."""
    customer_id = payment_intent.get('customer')
    error_message = payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
    
    if customer_id:
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            current_app.logger.warning(f"Payment intent failed for user {user.id}: {error_message}")


@stripe_bp.route('/api/stripe/billing-portal', methods=['POST'])
@jwt_required()
def create_billing_portal():
    """Create Stripe customer portal session."""
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    if not user.stripe_customer_id:
        return jsonify({
            'success': False,
            'message': 'No billing account found. Please subscribe first.'
        }), 404
    
    try:
        base_url = request.host_url.rstrip('/')
        
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{base_url}/settings/billing"
        )
        
        return jsonify({
            'success': True,
            'url': portal_session.url
        }), 200
        
    except stripe.error.StripeError as e:
        current_app.logger.error(f"Stripe portal error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 400


@stripe_bp.route('/api/stripe/subscription', methods=['GET'])
@jwt_required()
def get_subscription():
    """Get user's current subscription details."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    billing = BillingManager(user)
    usage = billing.get_usage_summary()
    
    return jsonify({
        'success': True,
        'subscription': {
            'tier': user.subscription_tier,
            'status': user.subscription_status,
            'stripe_subscription_id': user.stripe_subscription_id
        },
        'usage': usage
    }), 200


@stripe_bp.route('/api/stripe/plans', methods=['GET'])
def get_plans():
    """Get available subscription plans."""
    billing = BillingManager()
    plans = billing.get_all_plans()
    
    return jsonify({
        'success': True,
        'plans': plans
    }), 200
