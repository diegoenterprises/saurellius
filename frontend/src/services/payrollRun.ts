/**
 * PAYROLL RUN SERVICE
 * Frontend service for processing payroll runs
 */

import api from './api';

// Types
export interface PayrollRun {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  payroll_type: 'regular' | 'off_cycle' | 'bonus' | 'final';
  status: 'draft' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'failed';
  total_gross_pay: number;
  total_taxes: number;
  total_deductions: number;
  total_net_pay: number;
  employee_count: number;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface PayrollCalculation {
  employee_id: string;
  employee_name: string;
  regular_hours: number;
  overtime_hours: number;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  local_tax: number;
  social_security: number;
  medicare: number;
  deductions: { name: string; amount: number }[];
  net_pay: number;
}

// Payroll Run Operations
export const getPayrollRuns = async (params?: { status?: string; year?: number }) => {
  const response = await api.get('/api/payroll-run', { params });
  return response.data;
};

export const getPayrollRun = async (runId: string) => {
  const response = await api.get(`/api/payroll-run/${runId}`);
  return response.data;
};

export const createPayrollRun = async (data: {
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  payroll_type?: string;
}) => {
  const response = await api.post('/api/payroll-run', data);
  return response.data;
};

export const calculatePayrollPreview = async (runId: string) => {
  const response = await api.post(`/api/payroll-run/${runId}/calculate`);
  return response.data;
};

export const submitForApproval = async (runId: string) => {
  const response = await api.post(`/api/payroll-run/${runId}/submit`);
  return response.data;
};

export const approvePayrollRun = async (runId: string) => {
  const response = await api.post(`/api/payroll-run/${runId}/approve`);
  return response.data;
};

export const processPayrollRun = async (runId: string) => {
  const response = await api.post(`/api/payroll-run/${runId}/process`);
  return response.data;
};

export const voidPayrollRun = async (runId: string, reason: string) => {
  const response = await api.post(`/api/payroll-run/${runId}/void`, { reason });
  return response.data;
};

// Employee Calculations
export const getPayrollCalculations = async (runId: string) => {
  const response = await api.get(`/api/payroll-run/${runId}/calculations`);
  return response.data;
};

export const updateEmployeeHours = async (runId: string, employeeId: string, hours: {
  regular_hours: number;
  overtime_hours: number;
  pto_hours?: number;
  sick_hours?: number;
}) => {
  const response = await api.put(`/api/payroll-run/${runId}/employee/${employeeId}/hours`, hours);
  return response.data;
};

export const addBonus = async (runId: string, employeeId: string, bonus: {
  amount: number;
  type: string;
  description?: string;
}) => {
  const response = await api.post(`/api/payroll-run/${runId}/employee/${employeeId}/bonus`, bonus);
  return response.data;
};

// Reports
export const getPayrollSummary = async (runId: string) => {
  const response = await api.get(`/api/payroll-run/${runId}/summary`);
  return response.data;
};

export const getPayrollRegister = async (runId: string) => {
  const response = await api.get(`/api/payroll-run/${runId}/register`);
  return response.data;
};

export const downloadPaystubs = async (runId: string) => {
  const response = await api.get(`/api/payroll-run/${runId}/paystubs`, { responseType: 'blob' });
  return response.data;
};

export default {
  getPayrollRuns,
  getPayrollRun,
  createPayrollRun,
  calculatePayrollPreview,
  submitForApproval,
  approvePayrollRun,
  processPayrollRun,
  voidPayrollRun,
  getPayrollCalculations,
  updateEmployeeHours,
  addBonus,
  getPayrollSummary,
  getPayrollRegister,
  downloadPaystubs,
};
