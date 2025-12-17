"""
Communications Routes
Kudos, Messages, and Notifications - Complete Backend Integration
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Kudos, Message, Notification, Company, Employee, ContractorAccount
from datetime import datetime
import json
import logging

communications_bp = Blueprint('communications', __name__)


def get_current_user():
    """Get current user from JWT identity"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user


def get_recipient(recipient_type: str, recipient_id: str):
    """Get recipient by type and ID"""
    if recipient_type == 'employer':
        return Company.query.get(recipient_id)
    elif recipient_type == 'employee':
        return Employee.query.get(recipient_id)
    elif recipient_type == 'contractor':
        return ContractorAccount.query.get(recipient_id)
    return None


def get_user_type(user):
    """Determine user type"""
    if hasattr(user, 'is_admin') and user.is_admin:
        return 'admin'
    if hasattr(user, 'legal_business_name'):
        return 'employer'
    if hasattr(user, 'employer_id'):
        return 'employee'
    return 'contractor'


# ============= KUDOS ENDPOINTS =============

@communications_bp.route('/api/communications/kudos/send', methods=['POST'])
@jwt_required()
def send_kudos():
    """
    Send kudos to a user
    Complete backend implementation with notifications
    """
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.json
        
        # Validate required fields
        required = ['recipient_type', 'recipient_id', 'message']
        if not all(k in data for k in required):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        if data['recipient_type'] not in ['employer', 'employee', 'contractor']:
            return jsonify({'success': False, 'error': 'Invalid recipient type'}), 400
        
        # Verify recipient exists
        recipient = get_recipient(data['recipient_type'], data['recipient_id'])
        if not recipient:
            return jsonify({'success': False, 'error': 'Recipient not found'}), 404
        
        # Create kudos record
        kudos = Kudos(
            sender_id=current_user.id,
            sender_type=get_user_type(current_user),
            recipient_id=data['recipient_id'],
            recipient_type=data['recipient_type'],
            message=data['message'],
            badge_type=data.get('badge_type', 'star'),
            visibility=data.get('visibility', 'private'),
            created_at=datetime.now()
        )
        db.session.add(kudos)
        
        # Create notification for recipient
        notification = Notification(
            user_id=data['recipient_id'],
            user_type=data['recipient_type'],
            type='kudos_received',
            title='You received kudos!',
            message=f'{current_user.first_name} sent you kudos: {data["message"][:50]}...',
            data=json.dumps({'kudos_id': str(kudos.id), 'badge_type': kudos.badge_type}),
            created_at=datetime.now()
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Kudos sent successfully',
            'kudos_id': str(kudos.id)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error sending kudos: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to send kudos'}), 500


@communications_bp.route('/api/communications/kudos/received', methods=['GET'])
@jwt_required()
def get_received_kudos():
    """Get kudos received by current user"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 25, type=int)
        
        user_type = get_user_type(current_user)
        
        kudos_query = Kudos.query.filter_by(
            recipient_id=current_user.id,
            recipient_type=user_type
        ).order_by(Kudos.created_at.desc())
        
        total = kudos_query.count()
        kudos_list = kudos_query.offset((page - 1) * limit).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': {
                'kudos': [k.to_dict() for k in kudos_list],
                'total': total,
                'page': page,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching received kudos: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch kudos'}), 500


@communications_bp.route('/api/communications/kudos/sent', methods=['GET'])
@jwt_required()
def get_sent_kudos():
    """Get kudos sent by current user"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 25, type=int)
        
        user_type = get_user_type(current_user)
        
        kudos_query = Kudos.query.filter_by(
            sender_id=current_user.id,
            sender_type=user_type
        ).order_by(Kudos.created_at.desc())
        
        total = kudos_query.count()
        kudos_list = kudos_query.offset((page - 1) * limit).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': {
                'kudos': [k.to_dict() for k in kudos_list],
                'total': total,
                'page': page,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching sent kudos: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch kudos'}), 500


@communications_bp.route('/api/communications/kudos/wall', methods=['GET'])
@jwt_required()
def get_kudos_wall():
    """Get public kudos wall"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        
        kudos_query = Kudos.query.filter(
            Kudos.visibility.in_(['company', 'public'])
        ).order_by(Kudos.created_at.desc())
        
        total = kudos_query.count()
        kudos_list = kudos_query.offset((page - 1) * limit).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': {
                'kudos': [k.to_dict() for k in kudos_list],
                'total': total,
                'page': page,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching kudos wall: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch kudos wall'}), 500


# ============= MESSAGES ENDPOINTS =============

@communications_bp.route('/api/communications/messages/send', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message to another user"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.json
        
        # Validate required fields
        required = ['recipient_type', 'recipient_id', 'subject', 'message']
        if not all(k in data for k in required):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Verify recipient exists
        recipient = get_recipient(data['recipient_type'], data['recipient_id'])
        if not recipient:
            return jsonify({'success': False, 'error': 'Recipient not found'}), 404
        
        # Create message record
        message = Message(
            sender_id=current_user.id,
            sender_type=get_user_type(current_user),
            recipient_id=data['recipient_id'],
            recipient_type=data['recipient_type'],
            subject=data['subject'],
            message=data['message'],
            priority=data.get('priority', 'normal'),
            status='sent',
            created_at=datetime.now()
        )
        db.session.add(message)
        
        # Create notification for recipient
        notification = Notification(
            user_id=data['recipient_id'],
            user_type=data['recipient_type'],
            type='message_received',
            title='New message',
            message=f'New message from {current_user.first_name}: {data["subject"]}',
            data=json.dumps({'message_id': str(message.id)}),
            created_at=datetime.now()
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully',
            'message_id': str(message.id)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error sending message: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to send message'}), 500


@communications_bp.route('/api/communications/messages/inbox', methods=['GET'])
@jwt_required()
def get_inbox():
    """Get user's inbox messages"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 25, type=int)
        status = request.args.get('status', 'all')
        
        user_type = get_user_type(current_user)
        
        messages_query = Message.query.filter_by(
            recipient_id=current_user.id,
            recipient_type=user_type
        ).filter(Message.status != 'deleted')
        
        if status == 'unread':
            messages_query = messages_query.filter(Message.read_at.is_(None))
        elif status == 'read':
            messages_query = messages_query.filter(Message.read_at.isnot(None))
        elif status == 'archived':
            messages_query = messages_query.filter(Message.status == 'archived')
        
        messages_query = messages_query.order_by(Message.created_at.desc())
        
        total = messages_query.count()
        unread_count = Message.query.filter_by(
            recipient_id=current_user.id,
            recipient_type=user_type
        ).filter(Message.read_at.is_(None)).count()
        
        messages = messages_query.offset((page - 1) * limit).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': {
                'messages': [m.to_dict() for m in messages],
                'unread_count': unread_count,
                'total': total,
                'page': page,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching inbox: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch inbox'}), 500


@communications_bp.route('/api/communications/messages/<message_id>', methods=['GET'])
@jwt_required()
def get_message(message_id):
    """Get a specific message"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({'success': False, 'error': 'Message not found'}), 404
        
        user_type = get_user_type(current_user)
        
        # Check if user is sender or recipient
        is_recipient = (message.recipient_id == current_user.id and message.recipient_type == user_type)
        is_sender = (message.sender_id == current_user.id and message.sender_type == user_type)
        
        if not (is_recipient or is_sender):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        return jsonify({
            'success': True,
            'data': message.to_dict()
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching message: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch message'}), 500


@communications_bp.route('/api/communications/messages/<message_id>/read', methods=['PUT'])
@jwt_required()
def mark_message_read(message_id):
    """Mark a message as read"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({'success': False, 'error': 'Message not found'}), 404
        
        user_type = get_user_type(current_user)
        
        if message.recipient_id != current_user.id or message.recipient_type != user_type:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        message.read_at = datetime.now()
        message.status = 'read'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Message marked as read'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error marking message as read: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to mark message as read'}), 500


@communications_bp.route('/api/communications/messages/<message_id>/reply', methods=['POST'])
@jwt_required()
def reply_to_message(message_id):
    """Reply to a message"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        original = Message.query.get(message_id)
        if not original:
            return jsonify({'success': False, 'error': 'Original message not found'}), 404
        
        data = request.json
        if not data.get('message'):
            return jsonify({'success': False, 'error': 'Message content required'}), 400
        
        user_type = get_user_type(current_user)
        
        # Create reply message
        reply = Message(
            thread_id=original.thread_id or original.id,
            sender_id=current_user.id,
            sender_type=user_type,
            recipient_id=original.sender_id,
            recipient_type=original.sender_type,
            subject=f"Re: {original.subject}",
            message=data['message'],
            priority=original.priority,
            status='sent',
            created_at=datetime.now()
        )
        db.session.add(reply)
        
        # Update original message
        original.replied_at = datetime.now()
        
        # Create notification
        notification = Notification(
            user_id=original.sender_id,
            user_type=original.sender_type,
            type='message_reply',
            title='New reply',
            message=f'{current_user.first_name} replied to: {original.subject}',
            data=json.dumps({'message_id': str(reply.id)}),
            created_at=datetime.now()
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Reply sent successfully',
            'message_id': str(reply.id)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error replying to message: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to send reply'}), 500


@communications_bp.route('/api/communications/messages/<message_id>/archive', methods=['PUT'])
@jwt_required()
def archive_message(message_id):
    """Archive a message"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({'success': False, 'error': 'Message not found'}), 404
        
        message.status = 'archived'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Message archived'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error archiving message: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to archive message'}), 500


@communications_bp.route('/api/communications/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete a message"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({'success': False, 'error': 'Message not found'}), 404
        
        message.status = 'deleted'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Message deleted'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error deleting message: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to delete message'}), 500
