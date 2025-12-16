/**
 * COMMUNICATIONS SERVICE
 * API service for kudos, messaging, and notifications
 */

import api from './api';

export interface SendKudosData {
  recipient_type: 'employer' | 'employee' | 'contractor';
  recipient_id: string;
  message: string;
  badge_type?: 'star' | 'trophy' | 'medal' | 'crown' | 'heart' | 'rocket';
  visibility?: 'private' | 'team' | 'company';
}

export interface SendMessageData {
  recipient_type: 'employer' | 'employee' | 'contractor';
  recipient_id: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export const communicationsService = {
  // ============= KUDOS =============
  
  async sendKudos(data: SendKudosData) {
    const response = await api.post('/communications/kudos/send', data);
    return response.data;
  },

  async getReceivedKudos(page = 1, limit = 25) {
    const response = await api.get('/communications/kudos/received', {
      params: { page, limit }
    });
    return response.data;
  },

  async getSentKudos(page = 1, limit = 25) {
    const response = await api.get('/communications/kudos/sent', {
      params: { page, limit }
    });
    return response.data;
  },

  async getKudosWall(page = 1, limit = 50) {
    const response = await api.get('/communications/kudos/wall', {
      params: { page, limit }
    });
    return response.data;
  },

  // ============= MESSAGES =============

  async sendMessage(data: SendMessageData) {
    const response = await api.post('/communications/messages/send', data);
    return response.data;
  },

  async getInbox(status = 'all', page = 1, limit = 25) {
    const response = await api.get('/communications/messages/inbox', {
      params: { status, page, limit }
    });
    return response.data;
  },

  async getSentMessages(page = 1, limit = 25) {
    const response = await api.get('/communications/messages/sent', {
      params: { page, limit }
    });
    return response.data;
  },

  async getMessage(messageId: string) {
    const response = await api.get(`/communications/messages/${messageId}`);
    return response.data;
  },

  async markAsRead(messageId: string) {
    const response = await api.put(`/communications/messages/${messageId}/read`);
    return response.data;
  },

  async replyToMessage(messageId: string, message: string) {
    const response = await api.post(`/communications/messages/${messageId}/reply`, {
      message
    });
    return response.data;
  },

  async archiveMessage(messageId: string) {
    const response = await api.put(`/communications/messages/${messageId}/archive`);
    return response.data;
  },

  async deleteMessage(messageId: string) {
    const response = await api.delete(`/communications/messages/${messageId}`);
    return response.data;
  },

  // ============= NOTIFICATIONS =============

  async getNotifications(page = 1, limit = 50) {
    const response = await api.get('/settings/api/notifications', {
      params: { page, limit }
    });
    return response.data;
  },

  async markNotificationRead(notificationId: number) {
    const response = await api.put(`/settings/api/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllNotificationsRead() {
    const response = await api.put('/settings/api/notifications/read-all');
    return response.data;
  },

  // ============= USER SEARCH (for recipient selection) =============

  async searchUsers(query: string, type?: 'employer' | 'employee' | 'contractor') {
    const response = await api.get('/admin-dashboard/users/search', {
      params: { q: query, type }
    });
    return response.data;
  },
};

export default communicationsService;
