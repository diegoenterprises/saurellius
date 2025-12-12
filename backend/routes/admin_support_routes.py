"""
ADMIN SUPPORT ROUTES
Customer support and account management for platform admin
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import or_, and_, func
from models import db, User

admin_support_bp = Blueprint('admin_support', __name__, url_prefix='/api/admin/support')


def require_admin():
    """Check if user is platform admin."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return None
    return user


# =============================================================================
# CUSTOMER MANAGEMENT
# =============================================================================

@admin_support_bp.route('/customers', methods=['GET'])
@jwt_required()
def get_customers():
    """Get paginated list of all customers with search and filter."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Search
        search = request.args.get('search', '').strip()
        
        # Filters
        tier_filter = request.args.get('tier', '')
        status_filter = request.args.get('status', '')
        role_filter = request.args.get('role', '')
        
        # Build query
        query = User.query.filter(User.is_admin != True)  # Exclude admin
        
        # Apply search
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    User.email.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term)
                )
            )
        
        # Apply filters
        if tier_filter:
            query = query.filter(User.subscription_tier == tier_filter)
        if status_filter:
            query = query.filter(User.subscription_status == status_filter)
        if role_filter and hasattr(User, 'role'):
            query = query.filter(User.role == role_filter)
        
        # Order by most recent
        if hasattr(User, 'created_at'):
            query = query.order_by(User.created_at.desc())
        else:
            query = query.order_by(User.id.desc())
        
        # Paginate
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        customers = []
        for user in paginated.items:
            customers.append({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name or ''} {user.last_name or ''}".strip(),
                'role': getattr(user, 'role', 'employer'),
                'subscription_tier': user.subscription_tier,
                'subscription_status': user.subscription_status,
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
                'last_login': user.last_login.isoformat() if hasattr(user, 'last_login') and user.last_login else None,
            })
        
        return jsonify({
            'success': True,
            'customers': customers,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_support_bp.route('/customers/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer_detail(customer_id):
    """Get detailed customer information."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        customer = User.query.get(customer_id)
        if not customer:
            return jsonify({'success': False, 'message': 'Customer not found'}), 404
        
        detail = {
            'id': customer.id,
            'email': customer.email,
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'full_name': f"{customer.first_name or ''} {customer.last_name or ''}".strip(),
            'phone': getattr(customer, 'phone', None),
            'role': getattr(customer, 'role', 'employer'),
            'subscription_tier': customer.subscription_tier,
            'subscription_status': customer.subscription_status,
            'is_admin': customer.is_admin,
            'reward_points': getattr(customer, 'reward_points', 0),
            'created_at': customer.created_at.isoformat() if hasattr(customer, 'created_at') and customer.created_at else None,
            'last_login': customer.last_login.isoformat() if hasattr(customer, 'last_login') and customer.last_login else None,
        }
        
        return jsonify({'success': True, 'customer': detail}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_support_bp.route('/customers/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """Update customer account details."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        customer = User.query.get(customer_id)
        if not customer:
            return jsonify({'success': False, 'message': 'Customer not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            customer.first_name = data['first_name']
        if 'last_name' in data:
            customer.last_name = data['last_name']
        if 'subscription_tier' in data:
            customer.subscription_tier = data['subscription_tier']
        if 'subscription_status' in data:
            customer.subscription_status = data['subscription_status']
        if 'role' in data and hasattr(customer, 'role'):
            customer.role = data['role']
        if 'reward_points' in data and hasattr(customer, 'reward_points'):
            customer.reward_points = data['reward_points']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Customer updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_support_bp.route('/customers/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """Delete a customer account."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        customer = User.query.get(customer_id)
        if not customer:
            return jsonify({'success': False, 'message': 'Customer not found'}), 404
        
        if customer.is_admin:
            return jsonify({'success': False, 'message': 'Cannot delete admin accounts'}), 403
        
        # Store info for response
        email = customer.email
        
        # Delete the user
        db.session.delete(customer)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Customer {email} deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_support_bp.route('/customers/<int:customer_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_customer_password(customer_id):
    """Reset customer password (admin action)."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    try:
        customer = User.query.get(customer_id)
        if not customer:
            return jsonify({'success': False, 'message': 'Customer not found'}), 404
        
        data = request.get_json()
        new_password = data.get('new_password')
        
        if not new_password or len(new_password) < 8:
            return jsonify({'success': False, 'message': 'Password must be at least 8 characters'}), 400
        
        customer.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password reset successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# =============================================================================
# SUPPORT TICKETS
# =============================================================================

# In-memory tickets store (in production, use database table)
SUPPORT_TICKETS = []
TICKET_COUNTER = 0


@admin_support_bp.route('/tickets', methods=['GET'])
@jwt_required()
def get_tickets():
    """Get all support tickets."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    status_filter = request.args.get('status', '')
    priority_filter = request.args.get('priority', '')
    
    tickets = SUPPORT_TICKETS.copy()
    
    if status_filter:
        tickets = [t for t in tickets if t['status'] == status_filter]
    if priority_filter:
        tickets = [t for t in tickets if t['priority'] == priority_filter]
    
    # Sort by created date descending
    tickets.sort(key=lambda x: x['created_at'], reverse=True)
    
    return jsonify({
        'success': True,
        'tickets': tickets,
        'stats': {
            'total': len(SUPPORT_TICKETS),
            'open': len([t for t in SUPPORT_TICKETS if t['status'] == 'open']),
            'in_progress': len([t for t in SUPPORT_TICKETS if t['status'] == 'in_progress']),
            'resolved': len([t for t in SUPPORT_TICKETS if t['status'] == 'resolved']),
            'closed': len([t for t in SUPPORT_TICKETS if t['status'] == 'closed']),
        }
    }), 200


@admin_support_bp.route('/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    """Create a new support ticket."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    global TICKET_COUNTER
    
    try:
        data = request.get_json()
        
        TICKET_COUNTER += 1
        ticket = {
            'id': TICKET_COUNTER,
            'ticket_number': f'TKT-{TICKET_COUNTER:05d}',
            'customer_id': data.get('customer_id'),
            'customer_email': data.get('customer_email', ''),
            'customer_name': data.get('customer_name', ''),
            'subject': data.get('subject', 'No Subject'),
            'description': data.get('description', ''),
            'category': data.get('category', 'general'),
            'priority': data.get('priority', 'medium'),
            'status': 'open',
            'assigned_to': None,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'notes': [],
        }
        
        SUPPORT_TICKETS.append(ticket)
        
        return jsonify({
            'success': True,
            'ticket': ticket,
            'message': f'Ticket {ticket["ticket_number"]} created'
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_support_bp.route('/tickets/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket_detail(ticket_id):
    """Get ticket details."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    ticket = next((t for t in SUPPORT_TICKETS if t['id'] == ticket_id), None)
    if not ticket:
        return jsonify({'success': False, 'message': 'Ticket not found'}), 404
    
    return jsonify({'success': True, 'ticket': ticket}), 200


@admin_support_bp.route('/tickets/<int:ticket_id>', methods=['PUT'])
@jwt_required()
def update_ticket(ticket_id):
    """Update a support ticket."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    ticket = next((t for t in SUPPORT_TICKETS if t['id'] == ticket_id), None)
    if not ticket:
        return jsonify({'success': False, 'message': 'Ticket not found'}), 404
    
    data = request.get_json()
    
    if 'status' in data:
        ticket['status'] = data['status']
    if 'priority' in data:
        ticket['priority'] = data['priority']
    if 'assigned_to' in data:
        ticket['assigned_to'] = data['assigned_to']
    if 'category' in data:
        ticket['category'] = data['category']
    
    ticket['updated_at'] = datetime.utcnow().isoformat()
    
    return jsonify({
        'success': True,
        'ticket': ticket,
        'message': 'Ticket updated'
    }), 200


@admin_support_bp.route('/tickets/<int:ticket_id>/notes', methods=['POST'])
@jwt_required()
def add_ticket_note(ticket_id):
    """Add a note to a ticket."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    ticket = next((t for t in SUPPORT_TICKETS if t['id'] == ticket_id), None)
    if not ticket:
        return jsonify({'success': False, 'message': 'Ticket not found'}), 404
    
    data = request.get_json()
    
    note = {
        'id': len(ticket['notes']) + 1,
        'author': f"{admin.first_name} {admin.last_name}",
        'content': data.get('content', ''),
        'created_at': datetime.utcnow().isoformat(),
        'is_internal': data.get('is_internal', True),
    }
    
    ticket['notes'].append(note)
    ticket['updated_at'] = datetime.utcnow().isoformat()
    
    return jsonify({
        'success': True,
        'note': note,
        'message': 'Note added'
    }), 201


@admin_support_bp.route('/tickets/<int:ticket_id>', methods=['DELETE'])
@jwt_required()
def delete_ticket(ticket_id):
    """Delete a support ticket."""
    admin = require_admin()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    global SUPPORT_TICKETS
    
    ticket = next((t for t in SUPPORT_TICKETS if t['id'] == ticket_id), None)
    if not ticket:
        return jsonify({'success': False, 'message': 'Ticket not found'}), 404
    
    SUPPORT_TICKETS = [t for t in SUPPORT_TICKETS if t['id'] != ticket_id]
    
    return jsonify({
        'success': True,
        'message': f'Ticket {ticket["ticket_number"]} deleted'
    }), 200
