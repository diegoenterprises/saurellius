/**
 * SAURELLIUS COMMUNICATIONS SERVICE
 * Frontend API client for enterprise messaging
 */

import api from './api';

// Types
export interface Message {
  id: string;
  sender_id: number;
  recipient_id?: number;
  channel_id?: string;
  message_type: 'direct' | 'group' | 'announcement' | 'recognition';
  content: string;
  subject?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read';
  attachments: Attachment[];
  created_at: string;
  read_at?: string;
  reactions: Reaction[];
  is_pinned: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface Reaction {
  user_id: number;
  emoji: string;
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  other_user_id: number;
  unread_count: number;
  is_muted: boolean;
  last_message?: Message;
  last_activity?: string;
}

export interface Channel {
  id: string;
  name: string;
  channel_type: string;
  description: string;
  member_count: number;
  is_private: boolean;
  is_member: boolean;
}

export interface Recognition {
  id: string;
  sender_id: number;
  recipient_id: number;
  recognition_type: string;
  message: string;
  badge: RecognitionBadge;
  points: number;
  created_at: string;
}

export interface RecognitionBadge {
  emoji: string;
  points: number;
  name: string;
  description: string;
}

export interface ScheduleSwapRequest {
  id: string;
  requester_id: number;
  target_id: number;
  requester_shift: ShiftInfo;
  target_shift: ShiftInfo;
  reason: string;
  status: 'pending' | 'accepted' | 'declined' | 'pending_manager';
  created_at: string;
}

export interface ShiftInfo {
  date: string;
  start: string;
  end: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  data: any;
  created_at: string;
  read: boolean;
}

// ==================== DIRECT MESSAGES ====================

export const sendDirectMessage = async (
  recipientId: number,
  content: string,
  options?: {
    subject?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    attachments?: Attachment[];
  }
): Promise<{ success: boolean; message_id: string; conversation_id: string }> => {
  const response = await api.post('/messaging/dm/send', {
    recipient_id: recipientId,
    content,
    ...options,
  });
  return response.data;
};

export const getConversation = async (
  otherUserId: number
): Promise<{ conversation: Conversation; messages: Message[]; unread_count: number }> => {
  const response = await api.get(`/messaging/dm/conversation/${otherUserId}`);
  return response.data;
};

export const getConversations = async (): Promise<{
  conversations: Conversation[];
  total_unread: number;
}> => {
  const response = await api.get('/messaging/dm/conversations');
  return response.data;
};

// ==================== CHANNELS ====================

export const getChannels = async (): Promise<{ channels: Channel[] }> => {
  const response = await api.get('/messaging/channels');
  return response.data;
};

export const createChannel = async (
  name: string,
  options?: {
    channel_type?: string;
    description?: string;
    is_private?: boolean;
    members?: number[];
  }
): Promise<{ channel: Channel }> => {
  const response = await api.post('/messaging/channels', {
    name,
    ...options,
  });
  return response.data;
};

export const getChannelMessages = async (
  channelId: string,
  limit?: number
): Promise<{ channel: Channel; messages: Message[]; has_more: boolean }> => {
  const response = await api.get(`/messaging/channels/${channelId}/messages`, {
    params: { limit },
  });
  return response.data;
};

export const sendChannelMessage = async (
  channelId: string,
  content: string,
  options?: {
    priority?: string;
    attachments?: Attachment[];
    mentions?: number[];
  }
): Promise<{ message_id: string }> => {
  const response = await api.post(`/messaging/channels/${channelId}/send`, {
    content,
    ...options,
  });
  return response.data;
};

// ==================== ANNOUNCEMENTS ====================

export const getAnnouncements = async (
  includeExpired?: boolean
): Promise<{ announcements: Message[] }> => {
  const response = await api.get('/messaging/announcements', {
    params: { include_expired: includeExpired },
  });
  return response.data;
};

export const sendAnnouncement = async (
  title: string,
  content: string,
  options?: {
    target?: 'company' | 'department' | 'team';
    target_id?: string;
    priority?: string;
    require_acknowledgment?: boolean;
  }
): Promise<{ announcement_id: string }> => {
  const response = await api.post('/messaging/announcements', {
    title,
    content,
    ...options,
  });
  return response.data;
};

// ==================== RECOGNITION / KUDOS ====================

export const getRecognitionBadges = async (): Promise<{
  badges: Record<string, RecognitionBadge>;
}> => {
  const response = await api.get('/messaging/recognition/badges');
  return response.data;
};

export const sendRecognition = async (
  recipientId: number,
  recognitionType: string,
  message: string,
  options?: {
    is_public?: boolean;
    company_value?: string;
  }
): Promise<{ recognition: Recognition }> => {
  const response = await api.post('/messaging/recognition/send', {
    recipient_id: recipientId,
    recognition_type: recognitionType,
    message,
    ...options,
  });
  return response.data;
};

export const getRecognitionFeed = async (
  limit?: number
): Promise<{ recognitions: Recognition[] }> => {
  const response = await api.get('/messaging/recognition/feed', {
    params: { limit },
  });
  return response.data;
};

export const getMyRecognitionStats = async (): Promise<{
  total_received: number;
  total_given: number;
  total_points: number;
  badge_breakdown: Record<string, number>;
  recent_received: Recognition[];
  available_badges: Record<string, RecognitionBadge>;
}> => {
  const response = await api.get('/messaging/recognition/my-stats');
  return response.data;
};

// ==================== SCHEDULE SWAP ====================

export const requestScheduleSwap = async (
  targetId: number,
  myShift: ShiftInfo,
  theirShift: ShiftInfo,
  reason?: string
): Promise<{ swap_request: ScheduleSwapRequest }> => {
  const response = await api.post('/messaging/schedule-swap/request', {
    target_id: targetId,
    my_shift: myShift,
    their_shift: theirShift,
    reason,
  });
  return response.data;
};

export const respondToSwap = async (
  swapId: string,
  accept: boolean,
  message?: string
): Promise<{ swap_request: ScheduleSwapRequest }> => {
  const response = await api.post(`/messaging/schedule-swap/${swapId}/respond`, {
    accept,
    message,
  });
  return response.data;
};

export const getMySwapRequests = async (): Promise<{
  incoming: ScheduleSwapRequest[];
  outgoing: ScheduleSwapRequest[];
}> => {
  const response = await api.get('/messaging/schedule-swap/my-requests');
  return response.data;
};

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (
  unreadOnly?: boolean
): Promise<{ notifications: Notification[]; unread_count: number }> => {
  const response = await api.get('/messaging/notifications', {
    params: { unread_only: unreadOnly },
  });
  return response.data;
};

export const markNotificationsRead = async (
  notificationIds: string[]
): Promise<{ marked: number }> => {
  const response = await api.post('/messaging/notifications/mark-read', {
    notification_ids: notificationIds,
  });
  return response.data;
};

// ==================== PRESENCE ====================

export const updatePresence = async (
  status: 'online' | 'away' | 'busy' | 'dnd' | 'offline',
  customMessage?: string
): Promise<{ presence: { status: string; custom_message: string } }> => {
  const response = await api.post('/messaging/presence/update', {
    status,
    custom_message: customMessage,
  });
  return response.data;
};

export const getPresence = async (
  userIds: number[]
): Promise<{ presence: Record<number, { status: string; last_seen: string }> }> => {
  const response = await api.post('/messaging/presence', {
    user_ids: userIds,
  });
  return response.data;
};

// ==================== SEARCH ====================

export const searchMessages = async (
  query: string,
  options?: {
    type?: string;
    channel_id?: string;
    sender_id?: number;
    limit?: number;
  }
): Promise<{ results: Message[]; total: number }> => {
  const response = await api.get('/messaging/search', {
    params: { q: query, ...options },
  });
  return response.data;
};

// ==================== MESSAGE ACTIONS ====================

export const markMessageRead = async (messageId: string): Promise<{ read_at: string }> => {
  const response = await api.post(`/messaging/messages/${messageId}/read`);
  return response.data;
};

export const addReaction = async (
  messageId: string,
  emoji: string
): Promise<{ reactions: Reaction[] }> => {
  const response = await api.post(`/messaging/messages/${messageId}/react`, {
    emoji,
  });
  return response.data;
};

export const pinMessage = async (
  messageId: string,
  pin: boolean
): Promise<{ is_pinned: boolean }> => {
  const response = await api.post(`/messaging/messages/${messageId}/pin`, {
    pin,
  });
  return response.data;
};

// ==================== STATS ====================

export const getMessagingStats = async (): Promise<{
  stats: {
    total_conversations: number;
    total_unread_messages: number;
    unread_notifications: number;
    recognition_points: number;
    recognition_received: number;
    pending_swap_requests: number;
  };
}> => {
  const response = await api.get('/messaging/stats');
  return response.data;
};

export default {
  // DM
  sendDirectMessage,
  getConversation,
  getConversations,
  // Channels
  getChannels,
  createChannel,
  getChannelMessages,
  sendChannelMessage,
  // Announcements
  getAnnouncements,
  sendAnnouncement,
  // Recognition
  getRecognitionBadges,
  sendRecognition,
  getRecognitionFeed,
  getMyRecognitionStats,
  // Schedule Swap
  requestScheduleSwap,
  respondToSwap,
  getMySwapRequests,
  // Notifications
  getNotifications,
  markNotificationsRead,
  // Presence
  updatePresence,
  getPresence,
  // Search
  searchMessages,
  // Actions
  markMessageRead,
  addReaction,
  pinMessage,
  // Stats
  getMessagingStats,
};
