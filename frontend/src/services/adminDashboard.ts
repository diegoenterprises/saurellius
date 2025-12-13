/**
 * SAURELLIUS ADMIN DASHBOARD SERVICE
 * API service for platform owner admin dashboard
 */

import api from './api';

export const adminDashboardService = {
  // Main Dashboard
  async getOverview() {
    const response = await api.get('/admin-dashboard/overview');
    return response.data;
  },

  // Users Management
  async getUsersOverview() {
    const response = await api.get('/admin-dashboard/users/overview');
    return response.data;
  },

  async getEmployersList(page = 1, perPage = 25, status = 'all') {
    const response = await api.get('/admin-dashboard/employers/list', {
      params: { page, per_page: perPage, status }
    });
    return response.data;
  },

  async getEmployerDetail(employerId: string) {
    const response = await api.get(`/admin-dashboard/employers/${employerId}`);
    return response.data;
  },

  async getEmployeesList(page = 1, perPage = 25) {
    const response = await api.get('/admin-dashboard/employees/list', {
      params: { page, per_page: perPage }
    });
    return response.data;
  },

  async getContractorsList() {
    const response = await api.get('/admin-dashboard/contractors/list');
    return response.data;
  },

  async getActivityLogs() {
    const response = await api.get('/admin-dashboard/activity-logs');
    return response.data;
  },

  // Revenue & Financial
  async getRevenueOverview() {
    const response = await api.get('/admin-dashboard/revenue/overview');
    return response.data;
  },

  async getSubscriptionsOverview() {
    const response = await api.get('/admin-dashboard/subscriptions/overview');
    return response.data;
  },

  async getPaymentsOverview() {
    const response = await api.get('/admin-dashboard/payments/overview');
    return response.data;
  },

  // API Management
  async getAPIOverview() {
    const response = await api.get('/admin-dashboard/api/overview');
    return response.data;
  },

  async getAPIPartners() {
    const response = await api.get('/admin-dashboard/api/partners');
    return response.data;
  },

  async getAPIUsage() {
    const response = await api.get('/admin-dashboard/api/usage');
    return response.data;
  },

  // System Health
  async getSystemHealth() {
    const response = await api.get('/admin-dashboard/system/health');
    return response.data;
  },

  // Compliance
  async getComplianceOverview() {
    const response = await api.get('/admin-dashboard/compliance/overview');
    return response.data;
  },

  // AI Usage
  async getAIUsage() {
    const response = await api.get('/admin-dashboard/ai/usage');
    return response.data;
  },
};

export default adminDashboardService;
