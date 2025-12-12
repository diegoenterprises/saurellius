"""
SAURELLIUS COMMUNICATIONS API ROUTES
RESTful API for the enterprise messaging system
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.messaging_service import (
    communications_hub,
    RECOGNITION_BADGES,
    MessageType,
    ChannelType
)

messaging_bp = Blueprint('messaging', __name__, url_prefix='/api/messaging')


# ==================== DIRECT MESSAGES ====================

@messaging_bp.route('/dm/send', methods=['POST'])
@jwt_required()
def send_direct_message():
    """Send a direct message to another user."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    recipient_id = data.get('recipient_id')
    content = data.get('content')
    subject = data.get('subject')
    priority = data.get('priority', 'normal')
    attachments = data.get('attachments', [])
    
    if not recipient_id or not content:
        return jsonify({'success': False, 'error': 'recipient_id and content required'}), 400
    
    result = communications_hub.send_direct_message(
        sender_id=user_id,
        recipient_id=recipient_id,
        content=content,
        subject=subject,
        priority=priority,
        attachments=attachments
    )
    
    return jsonify(result)


@messaging_bp.route('/dm/conversation/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_conversation(other_user_id):
    """Get conversation with another user."""
    user_id = get_jwt_identity()
    
    result = communications_hub.get_conversation(user_id, other_user_id)
    return jsonify(result)


@messaging_bp.route('/dm/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get all conversations for the current user."""
    user_id = get_jwt_identity()
    
    result = communications_hub.get_user_conversations(user_id)
    return jsonify(result)


# ==================== CHANNELS ====================

@messaging_bp.route('/channels', methods=['GET'])
@jwt_required()
def get_channels():
    """Get all channels the user is a member of."""
    user_id = get_jwt_identity()
    
    result = communications_hub.get_user_channels(user_id)
    return jsonify(result)


@messaging_bp.route('/channels', methods=['POST'])
@jwt_required()
def create_channel():
    """Create a new channel."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    name = data.get('name')
    channel_type = data.get('channel_type', 'team')
    description = data.get('description', '')
    is_private = data.get('is_private', False)
    initial_members = data.get('members', [])
    
    if not name:
        return jsonify({'success': False, 'error': 'Channel name required'}), 400
    
    result = communications_hub.create_channel(
        name=name,
        channel_type=channel_type,
        created_by=user_id,
        description=description,
        is_private=is_private,
        initial_members=initial_members
    )
    
    return jsonify(result)


@messaging_bp.route('/channels/<channel_id>/messages', methods=['GET'])
@jwt_required()
def get_channel_messages(channel_id):
    """Get messages from a channel."""
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 50, type=int)
    before = request.args.get('before')
    
    result = communications_hub.get_channel_messages(
        channel_id=channel_id,
        user_id=user_id,
        limit=limit,
        before=before
    )
    
    return jsonify(result)


@messaging_bp.route('/channels/<channel_id>/send', methods=['POST'])
@jwt_required()
def send_channel_message(channel_id):
    """Send a message to a channel."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    content = data.get('content')
    priority = data.get('priority', 'normal')
    attachments = data.get('attachments', [])
    mentions = data.get('mentions', [])
    
    if not content:
        return jsonify({'success': False, 'error': 'Content required'}), 400
    
    result = communications_hub.send_channel_message(
        sender_id=user_id,
        channel_id=channel_id,
        content=content,
        priority=priority,
        attachments=attachments,
        mention_users=mentions
    )
    
    return jsonify(result)


# ==================== ANNOUNCEMENTS ====================

@messaging_bp.route('/announcements', methods=['GET'])
@jwt_required()
def get_announcements():
    """Get announcements for the current user."""
    user_id = get_jwt_identity()
    include_expired = request.args.get('include_expired', 'false').lower() == 'true'
    
    result = communications_hub.get_announcements(user_id, include_expired)
    return jsonify(result)


@messaging_bp.route('/announcements', methods=['POST'])
@jwt_required()
def send_announcement():
    """Send an announcement (manager/admin only)."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    title = data.get('title')
    content = data.get('content')
    target = data.get('target', 'company')
    target_id = data.get('target_id')
    priority = data.get('priority', 'normal')
    require_acknowledgment = data.get('require_acknowledgment', False)
    
    if not title or not content:
        return jsonify({'success': False, 'error': 'Title and content required'}), 400
    
    result = communications_hub.send_announcement(
        sender_id=user_id,
        title=title,
        content=content,
        target=target,
        target_id=target_id,
        priority=priority,
        require_acknowledgment=require_acknowledgment
    )
    
    return jsonify(result)


# ==================== RECOGNITION / KUDOS ====================

@messaging_bp.route('/recognition/badges', methods=['GET'])
@jwt_required()
def get_recognition_badges():
    """Get available recognition badges."""
    return jsonify({
        'success': True,
        'badges': RECOGNITION_BADGES
    })


@messaging_bp.route('/recognition/send', methods=['POST'])
@jwt_required()
def send_recognition():
    """Send recognition/kudos to an employee."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    recipient_id = data.get('recipient_id')
    recognition_type = data.get('recognition_type', 'kudos')
    message = data.get('message')
    is_public = data.get('is_public', True)
    company_value = data.get('company_value')
    
    if not recipient_id or not message:
        return jsonify({'success': False, 'error': 'recipient_id and message required'}), 400
    
    if user_id == recipient_id:
        return jsonify({'success': False, 'error': 'Cannot send recognition to yourself'}), 400
    
    result = communications_hub.send_recognition(
        sender_id=user_id,
        recipient_id=recipient_id,
        recognition_type=recognition_type,
        message=message,
        is_public=is_public,
        company_value=company_value
    )
    
    return jsonify(result)


@messaging_bp.route('/recognition/feed', methods=['GET'])
@jwt_required()
def get_recognition_feed():
    """Get the public recognition feed."""
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 20, type=int)
    
    result = communications_hub.get_recognition_feed(public_only=True, limit=limit)
    return jsonify(result)


@messaging_bp.route('/recognition/my-stats', methods=['GET'])
@jwt_required()
def get_my_recognition_stats():
    """Get recognition statistics for the current user."""
    user_id = get_jwt_identity()
    
    result = communications_hub.get_user_recognition_stats(user_id)
    return jsonify(result)


@messaging_bp.route('/recognition/user/<int:target_user_id>', methods=['GET'])
@jwt_required()
def get_user_recognition(target_user_id):
    """Get recognition for a specific user."""
    
    result = communications_hub.get_user_recognition_stats(target_user_id)
    return jsonify(result)


# ==================== SCHEDULE SWAP ====================

@messaging_bp.route('/schedule-swap/request', methods=['POST'])
@jwt_required()
def request_schedule_swap():
    """Request a schedule swap with another employee."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    target_id = data.get('target_id')
    my_shift = data.get('my_shift')
    their_shift = data.get('their_shift')
    reason = data.get('reason', '')
    
    if not target_id or not my_shift or not their_shift:
        return jsonify({'success': False, 'error': 'target_id, my_shift, and their_shift required'}), 400
    
    result = communications_hub.request_schedule_swap(
        requester_id=user_id,
        target_id=target_id,
        requester_shift=my_shift,
        target_shift=their_shift,
        reason=reason
    )
    
    return jsonify(result)


@messaging_bp.route('/schedule-swap/<swap_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_swap(swap_id):
    """Respond to a schedule swap request."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    accept = data.get('accept', False)
    message = data.get('message', '')
    
    result = communications_hub.respond_to_swap(
        swap_id=swap_id,
        user_id=user_id,
        accept=accept,
        message=message
    )
    
    return jsonify(result)


@messaging_bp.route('/schedule-swap/my-requests', methods=['GET'])
@jwt_required()
def get_my_swap_requests():
    """Get schedule swap requests for the current user."""
    user_id = get_jwt_identity()
    
    result = communications_hub.get_swap_requests(user_id)
    return jsonify(result)


# ==================== NOTIFICATIONS ====================

@messaging_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for the current user."""
    user_id = get_jwt_identity()
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    result = communications_hub.get_notifications(user_id, unread_only)
    return jsonify(result)


@messaging_bp.route('/notifications/mark-read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    """Mark notifications as read."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    notification_ids = data.get('notification_ids', [])
    
    result = communications_hub.mark_notifications_read(user_id, notification_ids)
    return jsonify(result)


# ==================== PRESENCE ====================

@messaging_bp.route('/presence/update', methods=['POST'])
@jwt_required()
def update_presence():
    """Update user presence status."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    status = data.get('status', 'online')
    custom_message = data.get('custom_message', '')
    
    result = communications_hub.update_presence(user_id, status, custom_message)
    return jsonify(result)


@messaging_bp.route('/presence', methods=['POST'])
@jwt_required()
def get_presence():
    """Get presence status for multiple users."""
    data = request.get_json()
    user_ids = data.get('user_ids', [])
    
    result = communications_hub.get_presence(user_ids)
    return jsonify(result)


# ==================== SEARCH ====================

@messaging_bp.route('/search', methods=['GET'])
@jwt_required()
def search_messages():
    """Search messages."""
    user_id = get_jwt_identity()
    
    query = request.args.get('q', '')
    message_type = request.args.get('type')
    channel_id = request.args.get('channel_id')
    sender_id = request.args.get('sender_id', type=int)
    limit = request.args.get('limit', 20, type=int)
    
    if not query:
        return jsonify({'success': False, 'error': 'Query parameter q required'}), 400
    
    result = communications_hub.search_messages(
        user_id=user_id,
        query=query,
        message_type=message_type,
        channel_id=channel_id,
        sender_id=sender_id,
        limit=limit
    )
    
    return jsonify(result)


# ==================== MESSAGE ACTIONS ====================

@messaging_bp.route('/messages/<message_id>/read', methods=['POST'])
@jwt_required()
def mark_message_read(message_id):
    """Mark a message as read."""
    user_id = get_jwt_identity()
    
    result = communications_hub.mark_message_read(message_id, user_id)
    return jsonify(result)


@messaging_bp.route('/messages/<message_id>/react', methods=['POST'])
@jwt_required()
def add_reaction(message_id):
    """Add a reaction to a message."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    emoji = data.get('emoji')
    if not emoji:
        return jsonify({'success': False, 'error': 'Emoji required'}), 400
    
    result = communications_hub.add_reaction(message_id, user_id, emoji)
    return jsonify(result)


@messaging_bp.route('/messages/<message_id>/pin', methods=['POST'])
@jwt_required()
def pin_message(message_id):
    """Pin or unpin a message."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    pin = data.get('pin', True)
    
    result = communications_hub.pin_message(message_id, user_id, pin)
    return jsonify(result)


# ==================== STATS ====================

@messaging_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_messaging_stats():
    """Get messaging statistics for the current user."""
    user_id = get_jwt_identity()
    
    # Get conversations
    convs = communications_hub.get_user_conversations(user_id)
    
    # Get notifications
    notifs = communications_hub.get_notifications(user_id)
    
    # Get recognition stats
    recognition = communications_hub.get_user_recognition_stats(user_id)
    
    # Get swap requests
    swaps = communications_hub.get_swap_requests(user_id)
    
    return jsonify({
        'success': True,
        'stats': {
            'total_conversations': len(convs.get('conversations', [])),
            'total_unread_messages': convs.get('total_unread', 0),
            'unread_notifications': notifs.get('unread_count', 0),
            'recognition_points': recognition.get('total_points', 0),
            'recognition_received': recognition.get('total_received', 0),
            'pending_swap_requests': len([s for s in swaps.get('incoming', []) if s['status'] == 'pending'])
        }
    })
