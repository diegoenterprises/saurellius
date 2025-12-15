"""
STRIPE FINANCIAL CONNECTIONS ROUTES
Bank account linking via Stripe Financial Connections API
Similar to Plaid - allows users to securely link bank accounts
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
import os
from datetime import datetime
from models import db, User

financial_connections_bp = Blueprint('financial_connections', __name__, url_prefix='/api/financial-connections')

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


@financial_connections_bp.route('/create-session', methods=['POST'])
@jwt_required()
def create_financial_connections_session():
    """
    Create a Financial Connections session for bank account linking.
    This generates a client secret for the frontend to use with Stripe.js
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json() or {}
        
        # Determine permissions based on use case
        permissions = data.get('permissions', ['payment_method', 'balances', 'ownership'])
        
        # Create Financial Connections Session
        session = stripe.financial_connections.Session.create(
            account_holder={
                'type': 'customer',
                'customer': user.stripe_customer_id if hasattr(user, 'stripe_customer_id') and user.stripe_customer_id else None,
            } if hasattr(user, 'stripe_customer_id') and user.stripe_customer_id else {
                'type': 'account',
            },
            permissions=permissions,
            filters={
                'countries': ['US'],
            },
            return_url=data.get('return_url', 'https://saurellius.drpaystub.com/settings/bank-accounts'),
        )
        
        return jsonify({
            'success': True,
            'client_secret': session.client_secret,
            'session_id': session.id,
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({
            'success': False,
            'message': f'Stripe error: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error creating session: {str(e)}'
        }), 500


@financial_connections_bp.route('/accounts', methods=['GET'])
@jwt_required()
def list_linked_accounts():
    """
    List all linked bank accounts for the current user.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get linked accounts from our database
        # In production, you'd also verify with Stripe
        linked_accounts = []
        
        if hasattr(user, 'linked_bank_accounts') and user.linked_bank_accounts:
            for account in user.linked_bank_accounts:
                linked_accounts.append({
                    'id': account.get('id'),
                    'institution_name': account.get('institution_name'),
                    'last4': account.get('last4'),
                    'account_type': account.get('account_type'),
                    'status': account.get('status', 'active'),
                    'linked_at': account.get('linked_at'),
                })
        
        return jsonify({
            'success': True,
            'accounts': linked_accounts,
            'count': len(linked_accounts)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error listing accounts: {str(e)}'
        }), 500


@financial_connections_bp.route('/accounts/<account_id>', methods=['GET'])
@jwt_required()
def get_account_details(account_id):
    """
    Get details of a specific linked account including balance.
    """
    try:
        user_id = get_jwt_identity()
        
        # Retrieve account from Stripe
        account = stripe.financial_connections.Account.retrieve(account_id)
        
        # Get balance if permission was granted
        balance = None
        try:
            balance_refresh = stripe.financial_connections.Account.refresh_account(
                account_id,
                features=['balance'],
            )
            if balance_refresh.balance:
                balance = {
                    'current': balance_refresh.balance.current / 100,  # Convert from cents
                    'available': balance_refresh.balance.available / 100 if balance_refresh.balance.available else None,
                    'as_of': balance_refresh.balance.as_of,
                }
        except:
            pass  # Balance not available
        
        return jsonify({
            'success': True,
            'account': {
                'id': account.id,
                'institution_name': account.institution_name,
                'last4': account.last4,
                'account_type': account.subcategory,
                'status': account.status,
                'supported_payment_method_types': account.supported_payment_method_types,
                'balance': balance,
            }
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({
            'success': False,
            'message': f'Stripe error: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting account: {str(e)}'
        }), 500


@financial_connections_bp.route('/accounts/<account_id>/disconnect', methods=['POST'])
@jwt_required()
def disconnect_account(account_id):
    """
    Disconnect a linked bank account.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Disconnect from Stripe
        try:
            stripe.financial_connections.Account.disconnect(account_id)
        except stripe.error.StripeError:
            pass  # May already be disconnected
        
        # Remove from user's linked accounts in database
        if hasattr(user, 'linked_bank_accounts') and user.linked_bank_accounts:
            user.linked_bank_accounts = [
                acc for acc in user.linked_bank_accounts 
                if acc.get('id') != account_id
            ]
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Account disconnected successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error disconnecting account: {str(e)}'
        }), 500


@financial_connections_bp.route('/link-complete', methods=['POST'])
@jwt_required()
def link_complete():
    """
    Called after user completes the Financial Connections flow.
    Stores the linked account info in the database.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                'success': False,
                'message': 'Session ID required'
            }), 400
        
        # Retrieve the session to get linked accounts
        session = stripe.financial_connections.Session.retrieve(
            session_id,
            expand=['accounts']
        )
        
        # Store linked accounts
        linked_accounts = []
        for account in session.accounts.data:
            account_data = {
                'id': account.id,
                'institution_name': account.institution_name,
                'last4': account.last4,
                'account_type': account.subcategory,
                'status': account.status,
                'linked_at': datetime.utcnow().isoformat(),
            }
            linked_accounts.append(account_data)
        
        # Update user's linked bank accounts
        if not hasattr(user, 'linked_bank_accounts') or not user.linked_bank_accounts:
            user.linked_bank_accounts = []
        
        # Add new accounts (avoid duplicates)
        existing_ids = {acc.get('id') for acc in user.linked_bank_accounts}
        for acc in linked_accounts:
            if acc['id'] not in existing_ids:
                user.linked_bank_accounts.append(acc)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{len(linked_accounts)} account(s) linked successfully',
            'accounts': linked_accounts
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({
            'success': False,
            'message': f'Stripe error: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error completing link: {str(e)}'
        }), 500


@financial_connections_bp.route('/create-payment-method', methods=['POST'])
@jwt_required()
def create_payment_method():
    """
    Create a payment method from a linked Financial Connections account.
    This allows the user to use the linked account for payments.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        account_id = data.get('account_id')
        
        if not account_id:
            return jsonify({
                'success': False,
                'message': 'Account ID required'
            }), 400
        
        # Create payment method from Financial Connections account
        payment_method = stripe.PaymentMethod.create(
            type='us_bank_account',
            us_bank_account={
                'financial_connections_account': account_id,
            },
        )
        
        # Attach to customer if they have a Stripe customer ID
        if hasattr(user, 'stripe_customer_id') and user.stripe_customer_id:
            stripe.PaymentMethod.attach(
                payment_method.id,
                customer=user.stripe_customer_id,
            )
        
        return jsonify({
            'success': True,
            'payment_method_id': payment_method.id,
            'message': 'Payment method created successfully'
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({
            'success': False,
            'message': f'Stripe error: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error creating payment method: {str(e)}'
        }), 500


@financial_connections_bp.route('/verify-ownership', methods=['POST'])
@jwt_required()
def verify_account_ownership():
    """
    Verify ownership of a linked account.
    Uses Stripe's ownership verification feature.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        account_id = data.get('account_id')
        
        if not account_id:
            return jsonify({
                'success': False,
                'message': 'Account ID required'
            }), 400
        
        # Refresh ownership data
        account = stripe.financial_connections.Account.refresh_account(
            account_id,
            features=['ownership'],
        )
        
        # Get ownership details
        ownership = None
        if account.ownership:
            owners = []
            for owner in account.ownership.owners:
                owners.append({
                    'name': owner.name,
                    'email': owner.email,
                    'phone': owner.phone,
                    'ownership_type': owner.ownership_type,
                })
            ownership = {
                'owners': owners,
                'verified': True,
            }
        
        return jsonify({
            'success': True,
            'account_id': account_id,
            'ownership': ownership
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({
            'success': False,
            'message': f'Stripe error: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error verifying ownership: {str(e)}'
        }), 500
