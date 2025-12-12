/**
 * DASHBOARD SERVICE
 * Frontend service for dashboard data
 */

import api from './api';

// Types
export interface DashboardStats {
  total_employees: number;
  total_paystubs: number;
  paystubs_this_month: number;
  total_processed_this_month: number;
  avg_net_pay: number;
  pending_approvals: number;
  active_users: number;
}

export interface RecentPaystub {
  id: number;
  employee_name: string;
  pay_date: string;
  gross_pay: number;
  net_pay: number;
  status: string;
}

export interface PayrollSummary {
  total_gross: number;
  total_taxes: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
}

export interface RewardsData {
  current_tier: string;
  current_points: number;
  tier_progress: number;
  points_to_next_tier: number;
  next_tier: string;
  lifetime_points: number;
  badges: string[];
}

// Get dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/api/dashboard/stats');
  return response.data.data;
};

// Get recent paystubs
export const getRecentPaystubs = async (limit: number = 5): Promise<RecentPaystub[]> => {
  const response = await api.get('/api/dashboard/recent-paystubs', {
    params: { limit },
  });
  return response.data.data;
};

// Get payroll summary
export const getPayrollSummary = async (period?: string): Promise<PayrollSummary> => {
  const response = await api.get('/api/dashboard/payroll-summary', {
    params: period ? { period } : undefined,
  });
  return response.data.data;
};

// Get rewards data
export const getRewardsData = async (): Promise<RewardsData> => {
  const response = await api.get('/api/dashboard/rewards');
  return response.data.data;
};

// Get activity feed
export const getActivityFeed = async (limit: number = 10): Promise<any[]> => {
  const response = await api.get('/api/dashboard/activity', {
    params: { limit },
  });
  return response.data.data;
};

// Get quick actions
export const getQuickActions = async (): Promise<any[]> => {
  const response = await api.get('/api/dashboard/quick-actions');
  return response.data.data;
};

// Get notifications
export const getNotifications = async (): Promise<any[]> => {
  const response = await api.get('/api/dashboard/notifications');
  return response.data.data;
};

// Mark notification as read
export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await api.put(`/api/dashboard/notifications/${notificationId}/read`);
};

export default {
  getDashboardStats,
  getRecentPaystubs,
  getPayrollSummary,
  getRewardsData,
  getActivityFeed,
  getQuickActions,
  getNotifications,
  markNotificationRead,
};
