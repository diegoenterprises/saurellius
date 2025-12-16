"""
SAURELLIUS API CLIENT MANAGEMENT ROUTES
Tax Engine API client management for admin portal
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import func, desc
import secrets
import hashlib
from models import db, User, APIClient, APILog, Notification

api_clients_bp = Blueprint('api_clients', __name__, url_prefix='/api/admin/tax-engine')


def generate_api_key():
    """Generate a unique API key."""
    return 'sk_live_' + secrets.token_hex(24)


def generate_api_secret():
    """Generate an API secret."""
    return secrets.token_hex(32)


def hash_secret(secret):
    """Hash an API secret for storage."""
    return hashlib.sha256(secret.encode()).hexdigest()


def require_admin(f):
    """Decorator to require admin access."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


@api_clients_bp.route('/clients', methods=['GET'])
@jwt_required()
@require_admin
def get_clients():
    """Get all API clients."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status_filter = request.args.get('status')
        tier_filter = request.args.get('tier')
        
        query = APIClient.query
        
        if status_filter:
            query = query.filter(APIClient.status == status_filter)
        if tier_filter:
            query = query.filter(APIClient.api_tier == tier_filter)
        
        query = query.order_by(desc(APIClient.created_at))
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        clients = [client.to_dict() for client in pagination.items]
        
        # Get summary stats
        total_clients = APIClient.query.count()
        active_clients = APIClient.query.filter(APIClient.status == 'active').count()
        total_requests = db.session.query(func.sum(APIClient.requests_this_month)).scalar() or 0
        
        return jsonify({
            'success': True,
            'clients': clients,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            },
            'summary': {
                'total_clients': total_clients,
                'active_clients': active_clients,
                'total_requests_this_month': total_requests
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_clients_bp.route('/clients', methods=['POST'])
@jwt_required()
@require_admin
def create_client():
    """Create a new API client."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        company_name = data.get('company_name')
        contact_name = data.get('contact_name')
        contact_email = data.get('contact_email')
        api_tier = data.get('api_tier', 'basic')
        rate_limit = data.get('rate_limit', 1000)
        
        if not company_name or not contact_email:
            return jsonify({'success': False, 'error': 'Company name and contact email required'}), 400
        
        # Check if email already exists
        existing = APIClient.query.filter_by(contact_email=contact_email).first()
        if existing:
            return jsonify({'success': False, 'error': 'Client with this email already exists'}), 400
        
        # Generate credentials
        api_key = generate_api_key()
        api_secret = generate_api_secret()
        
        # Create client
        client = APIClient(
            company_name=company_name,
            contact_name=contact_name,
            contact_email=contact_email,
            api_type='tax_engine',
            api_key=api_key,
            api_secret_hash=hash_secret(api_secret),
            api_tier=api_tier,
            rate_limit=rate_limit,
            status='active',
            created_by=user_id
        )
        
        db.session.add(client)
        db.session.commit()
        
        # Return the full credentials (only shown once)
        return jsonify({
            'success': True,
            'message': 'API client created successfully',
            'client': client.to_dict(),
            'credentials': {
                'api_key': api_key,
                'api_secret': api_secret,
                'note': 'Save these credentials securely. The secret will not be shown again.'
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@api_clients_bp.route('/clients/<int:client_id>', methods=['GET'])
@jwt_required()
@require_admin
def get_client(client_id):
    """Get a specific API client."""
    try:
        client = APIClient.query.get(client_id)
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        # Get usage stats
        logs = APILog.query.filter_by(client_id=client_id).order_by(desc(APILog.created_at)).limit(100).all()
        
        return jsonify({
            'success': True,
            'client': client.to_dict(),
            'recent_requests': [{
                'endpoint': log.endpoint,
                'method': log.method,
                'status_code': log.status_code,
                'response_time_ms': log.response_time_ms,
                'created_at': log.created_at.isoformat() if log.created_at else None
            } for log in logs]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_clients_bp.route('/clients/<int:client_id>', methods=['PUT'])
@jwt_required()
@require_admin
def update_client(client_id):
    """Update an API client."""
    try:
        client = APIClient.query.get(client_id)
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        data = request.get_json()
        
        if 'company_name' in data:
            client.company_name = data['company_name']
        if 'contact_name' in data:
            client.contact_name = data['contact_name']
        if 'contact_email' in data:
            client.contact_email = data['contact_email']
        if 'api_tier' in data:
            client.api_tier = data['api_tier']
        if 'rate_limit' in data:
            client.rate_limit = data['rate_limit']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Client updated successfully',
            'client': client.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@api_clients_bp.route('/clients/<int:client_id>/suspend', methods=['POST'])
@jwt_required()
@require_admin
def suspend_client(client_id):
    """Suspend an API client."""
    try:
        user_id = get_jwt_identity()
        client = APIClient.query.get(client_id)
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        client.status = 'suspended'
        client.suspended_at = datetime.utcnow()
        client.suspended_by = user_id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Client {client.company_name} suspended',
            'client': client.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@api_clients_bp.route('/clients/<int:client_id>/reactivate', methods=['POST'])
@jwt_required()
@require_admin
def reactivate_client(client_id):
    """Reactivate a suspended API client."""
    try:
        client = APIClient.query.get(client_id)
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        client.status = 'active'
        client.suspended_at = None
        client.suspended_by = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Client {client.company_name} reactivated',
            'client': client.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@api_clients_bp.route('/clients/<int:client_id>/regenerate-key', methods=['POST'])
@jwt_required()
@require_admin
def regenerate_key(client_id):
    """Regenerate API credentials for a client."""
    try:
        user_id = get_jwt_identity()
        client = APIClient.query.get(client_id)
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        # Generate new credentials
        new_api_key = generate_api_key()
        new_api_secret = generate_api_secret()
        
        client.api_key = new_api_key
        client.api_secret_hash = hash_secret(new_api_secret)
        client.key_regenerated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API credentials regenerated',
            'credentials': {
                'api_key': new_api_key,
                'api_secret': new_api_secret,
                'note': 'Save these credentials securely. The secret will not be shown again.'
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@api_clients_bp.route('/usage', methods=['GET'])
@jwt_required()
@require_admin
def get_usage_stats():
    """Get API usage statistics."""
    try:
        from datetime import timedelta
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # Total requests this month
        total_requests = db.session.query(func.count(APILog.id)).filter(
            APILog.created_at >= thirty_days_ago
        ).scalar() or 0
        
        # Requests by status code
        status_breakdown = db.session.query(
            APILog.status_code,
            func.count(APILog.id)
        ).filter(
            APILog.created_at >= thirty_days_ago
        ).group_by(APILog.status_code).all()
        
        # Top clients by usage
        top_clients = db.session.query(
            APIClient.company_name,
            APIClient.requests_this_month
        ).order_by(desc(APIClient.requests_this_month)).limit(10).all()
        
        # Average response time
        avg_response_time = db.session.query(
            func.avg(APILog.response_time_ms)
        ).filter(
            APILog.created_at >= thirty_days_ago
        ).scalar() or 0
        
        return jsonify({
            'success': True,
            'usage': {
                'total_requests_30d': total_requests,
                'avg_response_time_ms': round(avg_response_time, 2),
                'status_breakdown': {str(code): count for code, count in status_breakdown},
                'top_clients': [{'company': name, 'requests': count} for name, count in top_clients]
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_clients_bp.route('/clients/<int:client_id>/usage', methods=['GET'])
@jwt_required()
@require_admin
def get_client_usage(client_id):
    """Get usage statistics for a specific client."""
    try:
        from datetime import timedelta
        client = APIClient.query.get(client_id)
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # Daily usage for last 30 days
        daily_usage = db.session.query(
            func.date(APILog.created_at),
            func.count(APILog.id)
        ).filter(
            APILog.client_id == client_id,
            APILog.created_at >= thirty_days_ago
        ).group_by(func.date(APILog.created_at)).all()
        
        # Endpoint breakdown
        endpoint_usage = db.session.query(
            APILog.endpoint,
            func.count(APILog.id)
        ).filter(
            APILog.client_id == client_id,
            APILog.created_at >= thirty_days_ago
        ).group_by(APILog.endpoint).all()
        
        return jsonify({
            'success': True,
            'client': client.to_dict(),
            'usage': {
                'daily': [{
                    'date': str(date),
                    'requests': count
                } for date, count in daily_usage],
                'by_endpoint': [{
                    'endpoint': endpoint,
                    'requests': count
                } for endpoint, count in endpoint_usage]
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
