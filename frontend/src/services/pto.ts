/**
 * PTO SERVICE
 * Frontend service for PTO/Leave Management
 */

import api from './api';

// Types
export interface PTOPolicy {
  id: string;
  name: string;
  type: 'vacation' | 'sick' | 'personal' | 'parental' | 'bereavement' | 'jury_duty' | 'military';
  accrual_rate: number;
  accrual_frequency: 'per_pay_period' | 'monthly' | 'yearly';
  max_balance: number;
  carryover_limit: number;
  waiting_period_days: number;
  is_paid: boolean;
  is_active: boolean;
}

export interface LeaveBalance {
  employee_id: string;
  employee_name: string;
  policy_id: string;
  policy_name: string;
  balance_hours: number;
  used_hours: number;
  pending_hours: number;
  available_hours: number;
  accrued_ytd: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  policy_id: string;
  policy_name: string;
  start_date: string;
  end_date: string;
  hours_requested: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reason?: string;
  approver_id?: string;
  approver_notes?: string;
  created_at: string;
}

// Policies
export const getPTOPolicies = async () => {
  const response = await api.get('/api/pto/policies');
  return response.data;
};

export const getPTOPolicy = async (policyId: string) => {
  const response = await api.get(`/api/pto/policies/${policyId}`);
  return response.data;
};

export const createPTOPolicy = async (policy: Partial<PTOPolicy>) => {
  const response = await api.post('/api/pto/policies', policy);
  return response.data;
};

export const updatePTOPolicy = async (policyId: string, data: Partial<PTOPolicy>) => {
  const response = await api.put(`/api/pto/policies/${policyId}`, data);
  return response.data;
};

// Balances
export const getLeaveBalances = async (employeeId?: string) => {
  const params = employeeId ? { employee_id: employeeId } : {};
  const response = await api.get('/api/pto/balances', { params });
  return response.data;
};

export const getEmployeeBalance = async (employeeId: string) => {
  const response = await api.get(`/api/pto/balances/${employeeId}`);
  return response.data;
};

export const adjustBalance = async (employeeId: string, policyId: string, adjustment: {
  hours: number;
  reason: string;
}) => {
  const response = await api.post(`/api/pto/balances/${employeeId}/adjust`, {
    policy_id: policyId,
    ...adjustment
  });
  return response.data;
};

// Leave Requests
export const getLeaveRequests = async (params?: {
  employee_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const response = await api.get('/api/pto/requests', { params });
  return response.data;
};

export const getLeaveRequest = async (requestId: string) => {
  const response = await api.get(`/api/pto/requests/${requestId}`);
  return response.data;
};

export const createLeaveRequest = async (request: {
  employee_id: string;
  policy_id: string;
  start_date: string;
  end_date: string;
  hours_requested: number;
  reason?: string;
}) => {
  const response = await api.post('/api/pto/requests', request);
  return response.data;
};

export const approveLeaveRequest = async (requestId: string, notes?: string) => {
  const response = await api.post(`/api/pto/requests/${requestId}/approve`, { notes });
  return response.data;
};

export const denyLeaveRequest = async (requestId: string, reason: string) => {
  const response = await api.post(`/api/pto/requests/${requestId}/deny`, { reason });
  return response.data;
};

export const cancelLeaveRequest = async (requestId: string) => {
  const response = await api.post(`/api/pto/requests/${requestId}/cancel`);
  return response.data;
};

// Calendar & Reports
export const getLeaveCalendar = async (year: number, month: number) => {
  const response = await api.get('/api/pto/calendar', { params: { year, month } });
  return response.data;
};

export const getHolidays = async (year: number) => {
  const response = await api.get('/api/pto/holidays', { params: { year } });
  return response.data;
};

export const getPTOLiabilityReport = async () => {
  const response = await api.get('/api/pto/reports/liability');
  return response.data;
};

// Accruals
export const runAccruals = async (payPeriodEnd: string) => {
  const response = await api.post('/api/pto/accruals/run', { pay_period_end: payPeriodEnd });
  return response.data;
};

export const processYearEndCarryover = async (year: number) => {
  const response = await api.post('/api/pto/year-end-carryover', { year });
  return response.data;
};

export default {
  getPTOPolicies,
  getPTOPolicy,
  createPTOPolicy,
  updatePTOPolicy,
  getLeaveBalances,
  getEmployeeBalance,
  adjustBalance,
  getLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  approveLeaveRequest,
  denyLeaveRequest,
  cancelLeaveRequest,
  getLeaveCalendar,
  getHolidays,
  getPTOLiabilityReport,
  runAccruals,
  processYearEndCarryover,
};
