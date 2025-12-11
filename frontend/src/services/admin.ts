/**
 * ADMIN SERVICE
 * Frontend service for Admin Portal - Platform Analytics & Management
 */

import api from './api';

// Types
export interface PlatformMetrics {
  total_users: number;
  active_users: number;
  new_users_today: number;
  new_users_this_month: number;
  total_companies: number;
  total_paystubs_generated: number;
  total_payroll_processed: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churn_rate: number;
  conversion_rate: number;
}

export interface UserActivity {
  date: string;
  active_users: number;
  new_signups: number;
  paystubs_generated: number;
  revenue: number;
}

export interface SubscriptionMetrics {
  tier: string;
  subscriber_count: number;
  mrr: number;
  churn_count: number;
}

export interface TaxEngineAPIUsage {
  client_id: string;
  client_name: string;
  tier: string;
  requests_today: number;
  requests_this_month: number;
  monthly_limit: number;
  usage_percentage: number;
  total_revenue: number;
  status: 'active' | 'suspended' | 'over_limit';
}

export interface APIAnalytics {
  total_requests_today: number;
  total_requests_this_month: number;
  avg_response_time_ms: number;
  error_rate: number;
  top_endpoints: { endpoint: string; count: number }[];
  requests_by_tier: { tier: string; count: number }[];
  revenue_by_tier: { tier: string; revenue: number }[];
}

export interface SystemHealth {
  api_status: 'operational' | 'degraded' | 'down';
  database_status: 'operational' | 'degraded' | 'down';
  payment_processor_status: 'operational' | 'degraded' | 'down';
  email_service_status: 'operational' | 'degraded' | 'down';
  uptime_percentage: number;
  last_incident?: string;
}

// Platform Metrics
export const getPlatformMetrics = async () => {
  const response = await api.get('/api/admin/metrics');
  return response.data;
};

export const getUserActivityTrends = async (params: {
  start_date: string;
  end_date: string;
  granularity?: 'day' | 'week' | 'month';
}) => {
  const response = await api.get('/api/admin/activity-trends', { params });
  return response.data;
};

export const getRevenueTrends = async (params: {
  start_date: string;
  end_date: string;
}) => {
  const response = await api.get('/api/admin/revenue-trends', { params });
  return response.data;
};

// User Management
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tier?: string;
}) => {
  const response = await api.get('/api/admin/users', { params });
  return response.data;
};

export const getUser = async (userId: string) => {
  const response = await api.get(`/api/admin/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId: string, data: any) => {
  const response = await api.put(`/api/admin/users/${userId}`, data);
  return response.data;
};

export const suspendUser = async (userId: string, reason: string) => {
  const response = await api.post(`/api/admin/users/${userId}/suspend`, { reason });
  return response.data;
};

export const reactivateUser = async (userId: string) => {
  const response = await api.post(`/api/admin/users/${userId}/reactivate`);
  return response.data;
};

export const impersonateUser = async (userId: string) => {
  const response = await api.post(`/api/admin/users/${userId}/impersonate`);
  return response.data;
};

// Subscription Management
export const getSubscriptionMetrics = async () => {
  const response = await api.get('/api/admin/subscriptions/metrics');
  return response.data;
};

export const getSubscriptions = async (params?: {
  tier?: string;
  status?: string;
}) => {
  const response = await api.get('/api/admin/subscriptions', { params });
  return response.data;
};

export const updateSubscription = async (subscriptionId: string, data: any) => {
  const response = await api.put(`/api/admin/subscriptions/${subscriptionId}`, data);
  return response.data;
};

export const cancelSubscription = async (subscriptionId: string, reason: string) => {
  const response = await api.post(`/api/admin/subscriptions/${subscriptionId}/cancel`, { reason });
  return response.data;
};

// Tax Engine API Management
export const getAPIClients = async (params?: {
  tier?: string;
  status?: string;
}) => {
  const response = await api.get('/api/admin/tax-engine/clients', { params });
  return response.data;
};

export const getAPIClient = async (clientId: string) => {
  const response = await api.get(`/api/admin/tax-engine/clients/${clientId}`);
  return response.data;
};

export const createAPIClient = async (data: {
  company_name: string;
  email: string;
  tier: string;
}) => {
  const response = await api.post('/api/admin/tax-engine/clients', data);
  return response.data;
};

export const updateAPIClient = async (clientId: string, data: any) => {
  const response = await api.put(`/api/admin/tax-engine/clients/${clientId}`, data);
  return response.data;
};

export const regenerateAPIKey = async (clientId: string) => {
  const response = await api.post(`/api/admin/tax-engine/clients/${clientId}/regenerate-key`);
  return response.data;
};

export const suspendAPIClient = async (clientId: string, reason: string) => {
  const response = await api.post(`/api/admin/tax-engine/clients/${clientId}/suspend`, { reason });
  return response.data;
};

export const getAPIUsageAnalytics = async (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  const response = await api.get('/api/admin/tax-engine/analytics', { params });
  return response.data;
};

export const getAPIUsageByClient = async (clientId: string, params?: {
  start_date?: string;
  end_date?: string;
}) => {
  const response = await api.get(`/api/admin/tax-engine/clients/${clientId}/usage`, { params });
  return response.data;
};

export const getAPIRevenue = async (params?: {
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
}) => {
  const response = await api.get('/api/admin/tax-engine/revenue', { params });
  return response.data;
};

// System Health & Monitoring
export const getSystemHealth = async () => {
  const response = await api.get('/api/admin/system/health');
  return response.data;
};

export const getErrorLogs = async (params?: {
  start_date?: string;
  end_date?: string;
  severity?: string;
  limit?: number;
}) => {
  const response = await api.get('/api/admin/system/errors', { params });
  return response.data;
};

export const getAuditLogs = async (params?: {
  start_date?: string;
  end_date?: string;
  user_id?: string;
  action_type?: string;
  limit?: number;
}) => {
  const response = await api.get('/api/admin/system/audit-logs', { params });
  return response.data;
};

// Feature Flags
export const getFeatureFlags = async () => {
  const response = await api.get('/api/admin/feature-flags');
  return response.data;
};

export const updateFeatureFlag = async (flagId: string, enabled: boolean) => {
  const response = await api.put(`/api/admin/feature-flags/${flagId}`, { enabled });
  return response.data;
};

// Notifications & Announcements
export const sendBroadcast = async (data: {
  title: string;
  message: string;
  target: 'all' | 'tier' | 'specific_users';
  tier?: string;
  user_ids?: string[];
  channel: 'email' | 'in_app' | 'both';
}) => {
  const response = await api.post('/api/admin/broadcast', data);
  return response.data;
};

export default {
  getPlatformMetrics,
  getUserActivityTrends,
  getRevenueTrends,
  getUsers,
  getUser,
  updateUser,
  suspendUser,
  reactivateUser,
  impersonateUser,
  getSubscriptionMetrics,
  getSubscriptions,
  updateSubscription,
  cancelSubscription,
  getAPIClients,
  getAPIClient,
  createAPIClient,
  updateAPIClient,
  regenerateAPIKey,
  suspendAPIClient,
  getAPIUsageAnalytics,
  getAPIUsageByClient,
  getAPIRevenue,
  getSystemHealth,
  getErrorLogs,
  getAuditLogs,
  getFeatureFlags,
  updateFeatureFlag,
  sendBroadcast,
};
