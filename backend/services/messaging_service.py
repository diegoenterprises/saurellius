"""
SAURELLIUS COMMUNICATIONS HUB
Enterprise-grade messaging system for workforce communication
Features:
- Direct Messages (DM)
- Group Channels (Teams, Departments)
- Announcements (Company-wide, Team-wide)
- Recognition & Kudos System
- Schedule Swap Requests
- Manager Communication Pipeline
- Read Receipts & Delivery Status
- Message Search & Archive
- Priority/Urgent Messaging
- File Attachments
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import uuid
import json


class MessageType(Enum):
    DIRECT = "direct"
    GROUP = "group"
    ANNOUNCEMENT = "announcement"
    RECOGNITION = "recognition"
    SCHEDULE_SWAP = "schedule_swap"
    FEEDBACK = "feedback"
    SYSTEM = "system"


class MessagePriority(Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class MessageStatus(Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    ARCHIVED = "archived"


class RecognitionType(Enum):
    KUDOS = "kudos"
    PRAISE = "praise"
    THANK_YOU = "thank_you"
    GREAT_WORK = "great_work"
    TEAM_PLAYER = "team_player"
    ABOVE_AND_BEYOND = "above_and_beyond"
    CUSTOMER_SERVICE = "customer_service"
    INNOVATION = "innovation"
    LEADERSHIP = "leadership"
    MILESTONE = "milestone"


class ChannelType(Enum):
    COMPANY = "company"
    DEPARTMENT = "department"
    TEAM = "team"
    PROJECT = "project"
    PRIVATE_GROUP = "private_group"
    ANNOUNCEMENTS = "announcements"
    HR = "hr"
    MANAGERS = "managers"


# Recognition badges with emojis and point values
RECOGNITION_BADGES = {
    "kudos": {"emoji": "👏", "points": 10, "name": "Kudos", "description": "General appreciation"},
    "praise": {"emoji": "⭐", "points": 15, "name": "Praise", "description": "Outstanding work"},
    "thank_you": {"emoji": "🙏", "points": 10, "name": "Thank You", "description": "Gratitude for help"},
    "great_work": {"emoji": "🏆", "points": 20, "name": "Great Work", "description": "Exceptional performance"},
    "team_player": {"emoji": "🤝", "points": 25, "name": "Team Player", "description": "Excellent collaboration"},
    "above_and_beyond": {"emoji": "🚀", "points": 50, "name": "Above & Beyond", "description": "Exceeded expectations"},
    "customer_service": {"emoji": "💎", "points": 30, "name": "Customer Hero", "description": "Outstanding customer care"},
    "innovation": {"emoji": "💡", "points": 40, "name": "Innovator", "description": "Creative problem solving"},
    "leadership": {"emoji": "👑", "points": 35, "name": "Leader", "description": "Inspiring leadership"},
    "milestone": {"emoji": "🎯", "points": 100, "name": "Milestone", "description": "Achievement unlocked"},
}


class Message:
    """Individual message object."""
    
    def __init__(
        self,
        sender_id: int,
        message_type: MessageType,
        content: str,
        recipient_id: Optional[int] = None,
        channel_id: Optional[str] = None,
        priority: MessagePriority = MessagePriority.NORMAL,
        subject: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
        metadata: Optional[Dict] = None
    ):
        self.id = str(uuid.uuid4())
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        self.channel_id = channel_id
        self.message_type = message_type
        self.content = content
        self.subject = subject
        self.priority = priority
        self.status = MessageStatus.SENT
        self.attachments = attachments or []
        self.metadata = metadata or {}
        self.created_at = datetime.utcnow()
        self.delivered_at = None
        self.read_at = None
        self.reactions = []
        self.replies = []
        self.is_pinned = False
        self.is_deleted = False
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "recipient_id": self.recipient_id,
            "channel_id": self.channel_id,
            "message_type": self.message_type.value,
            "content": self.content,
            "subject": self.subject,
            "priority": self.priority.value,
            "status": self.status.value,
            "attachments": self.attachments,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "reactions": self.reactions,
            "reply_count": len(self.replies),
            "is_pinned": self.is_pinned,
        }


class Channel:
    """Communication channel (group, team, department)."""
    
    def __init__(
        self,
        name: str,
        channel_type: ChannelType,
        created_by: int,
        description: str = "",
        is_private: bool = False
    ):
        self.id = str(uuid.uuid4())
        self.name = name
        self.channel_type = channel_type
        self.description = description
        self.created_by = created_by
        self.is_private = is_private
        self.members = [created_by]
        self.admins = [created_by]
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.pinned_messages = []
        self.settings = {
            "allow_reactions": True,
            "allow_replies": True,
            "allow_file_sharing": True,
            "notification_preference": "all"
        }
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "channel_type": self.channel_type.value,
            "description": self.description,
            "created_by": self.created_by,
            "is_private": self.is_private,
            "member_count": len(self.members),
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "settings": self.settings,
        }


class Conversation:
    """Direct message conversation between two users."""
    
    def __init__(self, user1_id: int, user2_id: int):
        self.id = f"dm_{min(user1_id, user2_id)}_{max(user1_id, user2_id)}"
        self.participants = [user1_id, user2_id]
        self.created_at = datetime.utcnow()
        self.last_message_at = None
        self.unread_count = {user1_id: 0, user2_id: 0}
        self.is_muted = {user1_id: False, user2_id: False}
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "participants": self.participants,
            "created_at": self.created_at.isoformat(),
            "last_message_at": self.last_message_at.isoformat() if self.last_message_at else None,
        }


class ScheduleSwapRequest:
    """Schedule swap request between employees."""
    
    def __init__(
        self,
        requester_id: int,
        target_id: int,
        requester_shift: Dict,
        target_shift: Dict,
        reason: str = ""
    ):
        self.id = str(uuid.uuid4())
        self.requester_id = requester_id
        self.target_id = target_id
        self.requester_shift = requester_shift  # {"date": "2025-12-15", "start": "09:00", "end": "17:00"}
        self.target_shift = target_shift
        self.reason = reason
        self.status = "pending"  # pending, accepted, declined, cancelled, manager_approved
        self.created_at = datetime.utcnow()
        self.responded_at = None
        self.manager_approval_required = True
        self.manager_approved = False
        self.manager_id = None
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "requester_id": self.requester_id,
            "target_id": self.target_id,
            "requester_shift": self.requester_shift,
            "target_shift": self.target_shift,
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "responded_at": self.responded_at.isoformat() if self.responded_at else None,
            "manager_approval_required": self.manager_approval_required,
            "manager_approved": self.manager_approved,
        }


class Recognition:
    """Employee recognition/kudos."""
    
    def __init__(
        self,
        sender_id: int,
        recipient_id: int,
        recognition_type: str,
        message: str,
        is_public: bool = True,
        company_value: Optional[str] = None
    ):
        self.id = str(uuid.uuid4())
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        self.recognition_type = recognition_type
        self.message = message
        self.is_public = is_public
        self.company_value = company_value
        self.badge = RECOGNITION_BADGES.get(recognition_type, RECOGNITION_BADGES["kudos"])
        self.points = self.badge["points"]
        self.created_at = datetime.utcnow()
        self.reactions = []
        self.comments = []
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "recipient_id": self.recipient_id,
            "recognition_type": self.recognition_type,
            "message": self.message,
            "is_public": self.is_public,
            "company_value": self.company_value,
            "badge": self.badge,
            "points": self.points,
            "created_at": self.created_at.isoformat(),
            "reaction_count": len(self.reactions),
            "comment_count": len(self.comments),
        }


class SaurelliusCommunicationsHub:
    """
    Enterprise Communication System
    Handles all messaging, channels, recognition, and notifications.
    """
    
    def __init__(self):
        # In-memory storage (replace with database in production)
        self.messages: Dict[str, Message] = {}
        self.channels: Dict[str, Channel] = {}
        self.conversations: Dict[str, Conversation] = {}
        self.recognitions: Dict[str, Recognition] = {}
        self.schedule_swaps: Dict[str, ScheduleSwapRequest] = {}
        self.notifications: Dict[int, List[Dict]] = {}  # user_id -> notifications
        self.user_presence: Dict[int, Dict] = {}  # user_id -> presence status
        
        # Initialize default channels
        self._create_default_channels()
    
    def _create_default_channels(self):
        """Create default company-wide channels."""
        default_channels = [
            ("company-announcements", ChannelType.ANNOUNCEMENTS, "Official company announcements"),
            ("general", ChannelType.COMPANY, "General company discussion"),
            ("random", ChannelType.COMPANY, "Off-topic and fun"),
            ("hr-updates", ChannelType.HR, "HR policies and updates"),
            ("kudos-wall", ChannelType.COMPANY, "Public recognition and appreciation"),
        ]
        
        for name, channel_type, description in default_channels:
            channel = Channel(
                name=name,
                channel_type=channel_type,
                created_by=0,  # System
                description=description,
                is_private=False
            )
            channel.id = name  # Use name as ID for defaults
            self.channels[channel.id] = channel
    
    # ==================== DIRECT MESSAGING ====================
    
    def send_direct_message(
        self,
        sender_id: int,
        recipient_id: int,
        content: str,
        subject: Optional[str] = None,
        priority: str = "normal",
        attachments: Optional[List[Dict]] = None
    ) -> Dict:
        """Send a direct message to another user."""
        
        # Get or create conversation
        conv_id = f"dm_{min(sender_id, recipient_id)}_{max(sender_id, recipient_id)}"
        if conv_id not in self.conversations:
            self.conversations[conv_id] = Conversation(sender_id, recipient_id)
        
        conversation = self.conversations[conv_id]
        
        # Create message
        message = Message(
            sender_id=sender_id,
            recipient_id=recipient_id,
            message_type=MessageType.DIRECT,
            content=content,
            subject=subject,
            priority=MessagePriority[priority.upper()],
            attachments=attachments
        )
        
        self.messages[message.id] = message
        conversation.last_message_at = message.created_at
        conversation.unread_count[recipient_id] = conversation.unread_count.get(recipient_id, 0) + 1
        
        # Create notification
        self._create_notification(
            recipient_id,
            "new_message",
            f"New message from User {sender_id}",
            {"message_id": message.id, "conversation_id": conv_id}
        )
        
        return {
            "success": True,
            "message_id": message.id,
            "conversation_id": conv_id,
            "sent_at": message.created_at.isoformat()
        }
    
    def get_conversation(self, user_id: int, other_user_id: int) -> Dict:
        """Get direct message conversation between two users."""
        conv_id = f"dm_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
        
        if conv_id not in self.conversations:
            return {"success": False, "error": "Conversation not found"}
        
        conversation = self.conversations[conv_id]
        
        # Get messages for this conversation
        messages = [
            msg.to_dict() for msg in self.messages.values()
            if msg.message_type == MessageType.DIRECT
            and set([msg.sender_id, msg.recipient_id]) == set([user_id, other_user_id])
            and not msg.is_deleted
        ]
        messages.sort(key=lambda x: x["created_at"])
        
        return {
            "success": True,
            "conversation": conversation.to_dict(),
            "messages": messages,
            "unread_count": conversation.unread_count.get(user_id, 0)
        }
    
    def get_user_conversations(self, user_id: int) -> Dict:
        """Get all conversations for a user."""
        user_convs = []
        
        for conv in self.conversations.values():
            if user_id in conv.participants:
                other_user = [p for p in conv.participants if p != user_id][0]
                
                # Get last message
                conv_messages = [
                    msg for msg in self.messages.values()
                    if msg.message_type == MessageType.DIRECT
                    and set([msg.sender_id, msg.recipient_id]) == set(conv.participants)
                ]
                last_message = max(conv_messages, key=lambda x: x.created_at) if conv_messages else None
                
                user_convs.append({
                    "conversation_id": conv.id,
                    "other_user_id": other_user,
                    "unread_count": conv.unread_count.get(user_id, 0),
                    "is_muted": conv.is_muted.get(user_id, False),
                    "last_message": last_message.to_dict() if last_message else None,
                    "last_activity": conv.last_message_at.isoformat() if conv.last_message_at else None
                })
        
        user_convs.sort(key=lambda x: x["last_activity"] or "", reverse=True)
        
        return {
            "success": True,
            "conversations": user_convs,
            "total_unread": sum(c["unread_count"] for c in user_convs)
        }
    
    # ==================== CHANNELS ====================
    
    def create_channel(
        self,
        name: str,
        channel_type: str,
        created_by: int,
        description: str = "",
        is_private: bool = False,
        initial_members: Optional[List[int]] = None
    ) -> Dict:
        """Create a new channel."""
        
        channel = Channel(
            name=name,
            channel_type=ChannelType[channel_type.upper()],
            created_by=created_by,
            description=description,
            is_private=is_private
        )
        
        if initial_members:
            channel.members.extend([m for m in initial_members if m != created_by])
        
        self.channels[channel.id] = channel
        
        return {
            "success": True,
            "channel": channel.to_dict()
        }
    
    def send_channel_message(
        self,
        sender_id: int,
        channel_id: str,
        content: str,
        priority: str = "normal",
        attachments: Optional[List[Dict]] = None,
        mention_users: Optional[List[int]] = None
    ) -> Dict:
        """Send a message to a channel."""
        
        if channel_id not in self.channels:
            return {"success": False, "error": "Channel not found"}
        
        channel = self.channels[channel_id]
        
        if sender_id not in channel.members and not channel.is_private:
            # Auto-join public channels
            channel.members.append(sender_id)
        elif sender_id not in channel.members:
            return {"success": False, "error": "Not a member of this channel"}
        
        message = Message(
            sender_id=sender_id,
            channel_id=channel_id,
            message_type=MessageType.GROUP,
            content=content,
            priority=MessagePriority[priority.upper()],
            attachments=attachments,
            metadata={"mentions": mention_users or []}
        )
        
        self.messages[message.id] = message
        channel.last_activity = message.created_at
        
        # Notify mentioned users
        if mention_users:
            for user_id in mention_users:
                self._create_notification(
                    user_id,
                    "mention",
                    f"You were mentioned in #{channel.name}",
                    {"message_id": message.id, "channel_id": channel_id}
                )
        
        return {
            "success": True,
            "message_id": message.id,
            "channel_id": channel_id
        }
    
    def get_channel_messages(
        self,
        channel_id: str,
        user_id: int,
        limit: int = 50,
        before: Optional[str] = None
    ) -> Dict:
        """Get messages from a channel."""
        
        if channel_id not in self.channels:
            return {"success": False, "error": "Channel not found"}
        
        channel = self.channels[channel_id]
        
        messages = [
            msg.to_dict() for msg in self.messages.values()
            if msg.channel_id == channel_id and not msg.is_deleted
        ]
        messages.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "success": True,
            "channel": channel.to_dict(),
            "messages": messages[:limit],
            "has_more": len(messages) > limit
        }
    
    def get_user_channels(self, user_id: int) -> Dict:
        """Get all channels a user is a member of."""
        
        user_channels = []
        for channel in self.channels.values():
            if user_id in channel.members or not channel.is_private:
                # Get unread count
                channel_messages = [
                    msg for msg in self.messages.values()
                    if msg.channel_id == channel.id
                ]
                
                user_channels.append({
                    **channel.to_dict(),
                    "is_member": user_id in channel.members,
                    "message_count": len(channel_messages)
                })
        
        return {
            "success": True,
            "channels": user_channels
        }
    
    # ==================== ANNOUNCEMENTS ====================
    
    def send_announcement(
        self,
        sender_id: int,
        title: str,
        content: str,
        target: str = "company",  # company, department, team
        target_id: Optional[str] = None,
        priority: str = "normal",
        expires_at: Optional[datetime] = None,
        require_acknowledgment: bool = False
    ) -> Dict:
        """Send an announcement."""
        
        message = Message(
            sender_id=sender_id,
            message_type=MessageType.ANNOUNCEMENT,
            content=content,
            subject=title,
            priority=MessagePriority[priority.upper()],
            metadata={
                "target": target,
                "target_id": target_id,
                "expires_at": expires_at.isoformat() if expires_at else None,
                "require_acknowledgment": require_acknowledgment,
                "acknowledgments": []
            }
        )
        
        self.messages[message.id] = message
        
        # Send to announcements channel
        if "company-announcements" in self.channels:
            message.channel_id = "company-announcements"
        
        return {
            "success": True,
            "announcement_id": message.id,
            "title": title,
            "target": target
        }
    
    def get_announcements(
        self,
        user_id: int,
        include_expired: bool = False
    ) -> Dict:
        """Get announcements relevant to a user."""
        
        announcements = []
        now = datetime.utcnow()
        
        for msg in self.messages.values():
            if msg.message_type != MessageType.ANNOUNCEMENT:
                continue
            
            expires_at = msg.metadata.get("expires_at")
            if expires_at and not include_expired:
                if datetime.fromisoformat(expires_at) < now:
                    continue
            
            announcements.append({
                **msg.to_dict(),
                "acknowledged": user_id in msg.metadata.get("acknowledgments", [])
            })
        
        announcements.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "success": True,
            "announcements": announcements
        }
    
    # ==================== RECOGNITION / KUDOS ====================
    
    def send_recognition(
        self,
        sender_id: int,
        recipient_id: int,
        recognition_type: str,
        message: str,
        is_public: bool = True,
        company_value: Optional[str] = None
    ) -> Dict:
        """Send recognition/kudos to an employee."""
        
        if recognition_type not in RECOGNITION_BADGES:
            recognition_type = "kudos"
        
        recognition = Recognition(
            sender_id=sender_id,
            recipient_id=recipient_id,
            recognition_type=recognition_type,
            message=message,
            is_public=is_public,
            company_value=company_value
        )
        
        self.recognitions[recognition.id] = recognition
        
        # Notify recipient
        badge = recognition.badge
        self._create_notification(
            recipient_id,
            "recognition",
            f"You received {badge['emoji']} {badge['name']} from a colleague!",
            {"recognition_id": recognition.id, "points": recognition.points}
        )
        
        # Post to kudos wall if public
        if is_public and "kudos-wall" in self.channels:
            self.send_channel_message(
                sender_id=0,  # System
                channel_id="kudos-wall",
                content=f"{badge['emoji']} **Recognition Alert!**\nUser {sender_id} gave {badge['name']} to User {recipient_id}:\n> {message}",
                priority="normal"
            )
        
        return {
            "success": True,
            "recognition": recognition.to_dict()
        }
    
    def get_recognition_feed(
        self,
        user_id: Optional[int] = None,
        public_only: bool = True,
        limit: int = 20
    ) -> Dict:
        """Get recognition feed."""
        
        recognitions = []
        for rec in self.recognitions.values():
            if public_only and not rec.is_public:
                continue
            if user_id and rec.recipient_id != user_id and rec.sender_id != user_id:
                if not rec.is_public:
                    continue
            
            recognitions.append(rec.to_dict())
        
        recognitions.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "success": True,
            "recognitions": recognitions[:limit],
            "total": len(recognitions)
        }
    
    def get_user_recognition_stats(self, user_id: int) -> Dict:
        """Get recognition statistics for a user."""
        
        received = [r for r in self.recognitions.values() if r.recipient_id == user_id]
        given = [r for r in self.recognitions.values() if r.sender_id == user_id]
        
        # Calculate points
        total_points = sum(r.points for r in received)
        
        # Badge breakdown
        badge_counts = {}
        for r in received:
            badge_type = r.recognition_type
            badge_counts[badge_type] = badge_counts.get(badge_type, 0) + 1
        
        return {
            "success": True,
            "user_id": user_id,
            "total_received": len(received),
            "total_given": len(given),
            "total_points": total_points,
            "badge_breakdown": badge_counts,
            "recent_received": [r.to_dict() for r in sorted(received, key=lambda x: x.created_at, reverse=True)[:5]],
            "available_badges": RECOGNITION_BADGES
        }
    
    # ==================== SCHEDULE SWAP ====================
    
    def request_schedule_swap(
        self,
        requester_id: int,
        target_id: int,
        requester_shift: Dict,
        target_shift: Dict,
        reason: str = ""
    ) -> Dict:
        """Request a schedule swap with another employee."""
        
        swap = ScheduleSwapRequest(
            requester_id=requester_id,
            target_id=target_id,
            requester_shift=requester_shift,
            target_shift=target_shift,
            reason=reason
        )
        
        self.schedule_swaps[swap.id] = swap
        
        # Notify target employee
        self._create_notification(
            target_id,
            "schedule_swap",
            f"User {requester_id} wants to swap shifts with you",
            {"swap_id": swap.id}
        )
        
        # Send DM
        self.send_direct_message(
            sender_id=requester_id,
            recipient_id=target_id,
            content=f"Hi! I'd like to swap shifts with you.\n\n**My shift:** {requester_shift['date']} ({requester_shift['start']} - {requester_shift['end']})\n**Your shift:** {target_shift['date']} ({target_shift['start']} - {target_shift['end']})\n\n{reason if reason else 'Would you be interested?'}",
            subject="Schedule Swap Request",
            priority="high"
        )
        
        return {
            "success": True,
            "swap_request": swap.to_dict()
        }
    
    def respond_to_swap(
        self,
        swap_id: str,
        user_id: int,
        accept: bool,
        message: str = ""
    ) -> Dict:
        """Respond to a schedule swap request."""
        
        if swap_id not in self.schedule_swaps:
            return {"success": False, "error": "Swap request not found"}
        
        swap = self.schedule_swaps[swap_id]
        
        if swap.target_id != user_id:
            return {"success": False, "error": "Not authorized"}
        
        swap.status = "accepted" if accept else "declined"
        swap.responded_at = datetime.utcnow()
        
        # Notify requester
        status_text = "accepted" if accept else "declined"
        self._create_notification(
            swap.requester_id,
            "schedule_swap_response",
            f"Your schedule swap request was {status_text}",
            {"swap_id": swap.id}
        )
        
        # If accepted, notify manager for approval
        if accept and swap.manager_approval_required:
            swap.status = "pending_manager"
            # TODO: Get manager ID and notify
        
        return {
            "success": True,
            "swap_request": swap.to_dict()
        }
    
    def get_swap_requests(self, user_id: int) -> Dict:
        """Get schedule swap requests for a user."""
        
        incoming = [s.to_dict() for s in self.schedule_swaps.values() if s.target_id == user_id]
        outgoing = [s.to_dict() for s in self.schedule_swaps.values() if s.requester_id == user_id]
        
        return {
            "success": True,
            "incoming": incoming,
            "outgoing": outgoing
        }
    
    # ==================== NOTIFICATIONS ====================
    
    def _create_notification(
        self,
        user_id: int,
        notification_type: str,
        message: str,
        data: Dict
    ):
        """Create a notification for a user."""
        
        if user_id not in self.notifications:
            self.notifications[user_id] = []
        
        notification = {
            "id": str(uuid.uuid4()),
            "type": notification_type,
            "message": message,
            "data": data,
            "created_at": datetime.utcnow().isoformat(),
            "read": False
        }
        
        self.notifications[user_id].insert(0, notification)
        
        # Keep only last 100 notifications
        self.notifications[user_id] = self.notifications[user_id][:100]
    
    def get_notifications(self, user_id: int, unread_only: bool = False) -> Dict:
        """Get notifications for a user."""
        
        user_notifs = self.notifications.get(user_id, [])
        
        if unread_only:
            user_notifs = [n for n in user_notifs if not n["read"]]
        
        return {
            "success": True,
            "notifications": user_notifs,
            "unread_count": sum(1 for n in self.notifications.get(user_id, []) if not n["read"])
        }
    
    def mark_notifications_read(self, user_id: int, notification_ids: List[str]) -> Dict:
        """Mark notifications as read."""
        
        if user_id not in self.notifications:
            return {"success": True, "marked": 0}
        
        marked = 0
        for notif in self.notifications[user_id]:
            if notif["id"] in notification_ids:
                notif["read"] = True
                marked += 1
        
        return {"success": True, "marked": marked}
    
    # ==================== PRESENCE ====================
    
    def update_presence(self, user_id: int, status: str, custom_message: str = "") -> Dict:
        """Update user presence status."""
        
        valid_statuses = ["online", "away", "busy", "dnd", "offline"]
        if status not in valid_statuses:
            status = "online"
        
        self.user_presence[user_id] = {
            "status": status,
            "custom_message": custom_message,
            "last_seen": datetime.utcnow().isoformat()
        }
        
        return {"success": True, "presence": self.user_presence[user_id]}
    
    def get_presence(self, user_ids: List[int]) -> Dict:
        """Get presence status for multiple users."""
        
        presence = {}
        for user_id in user_ids:
            if user_id in self.user_presence:
                presence[user_id] = self.user_presence[user_id]
            else:
                presence[user_id] = {"status": "offline", "last_seen": None}
        
        return {"success": True, "presence": presence}
    
    # ==================== SEARCH ====================
    
    def search_messages(
        self,
        user_id: int,
        query: str,
        message_type: Optional[str] = None,
        channel_id: Optional[str] = None,
        sender_id: Optional[int] = None,
        limit: int = 20
    ) -> Dict:
        """Search messages."""
        
        results = []
        query_lower = query.lower()
        
        for msg in self.messages.values():
            if msg.is_deleted:
                continue
            
            # Check if user has access
            if msg.message_type == MessageType.DIRECT:
                if user_id not in [msg.sender_id, msg.recipient_id]:
                    continue
            elif msg.channel_id:
                channel = self.channels.get(msg.channel_id)
                if channel and channel.is_private and user_id not in channel.members:
                    continue
            
            # Apply filters
            if message_type and msg.message_type.value != message_type:
                continue
            if channel_id and msg.channel_id != channel_id:
                continue
            if sender_id and msg.sender_id != sender_id:
                continue
            
            # Search content
            if query_lower in msg.content.lower():
                results.append(msg.to_dict())
            elif msg.subject and query_lower in msg.subject.lower():
                results.append(msg.to_dict())
        
        results.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "success": True,
            "query": query,
            "results": results[:limit],
            "total": len(results)
        }
    
    # ==================== MESSAGE ACTIONS ====================
    
    def mark_message_read(self, message_id: str, user_id: int) -> Dict:
        """Mark a message as read."""
        
        if message_id not in self.messages:
            return {"success": False, "error": "Message not found"}
        
        message = self.messages[message_id]
        
        if message.recipient_id == user_id:
            message.status = MessageStatus.READ
            message.read_at = datetime.utcnow()
            
            # Update conversation unread count
            if message.message_type == MessageType.DIRECT:
                conv_id = f"dm_{min(message.sender_id, user_id)}_{max(message.sender_id, user_id)}"
                if conv_id in self.conversations:
                    conv = self.conversations[conv_id]
                    conv.unread_count[user_id] = max(0, conv.unread_count.get(user_id, 0) - 1)
        
        return {"success": True, "read_at": message.read_at.isoformat() if message.read_at else None}
    
    def add_reaction(self, message_id: str, user_id: int, emoji: str) -> Dict:
        """Add a reaction to a message."""
        
        if message_id not in self.messages:
            return {"success": False, "error": "Message not found"}
        
        message = self.messages[message_id]
        
        # Remove existing reaction from this user
        message.reactions = [r for r in message.reactions if r["user_id"] != user_id]
        
        # Add new reaction
        message.reactions.append({
            "user_id": user_id,
            "emoji": emoji,
            "created_at": datetime.utcnow().isoformat()
        })
        
        return {"success": True, "reactions": message.reactions}
    
    def pin_message(self, message_id: str, user_id: int, pin: bool = True) -> Dict:
        """Pin or unpin a message."""
        
        if message_id not in self.messages:
            return {"success": False, "error": "Message not found"}
        
        message = self.messages[message_id]
        message.is_pinned = pin
        
        if message.channel_id and message.channel_id in self.channels:
            channel = self.channels[message.channel_id]
            if pin:
                if message_id not in channel.pinned_messages:
                    channel.pinned_messages.append(message_id)
            else:
                channel.pinned_messages = [m for m in channel.pinned_messages if m != message_id]
        
        return {"success": True, "is_pinned": message.is_pinned}


# Global instance
communications_hub = SaurelliusCommunicationsHub()
