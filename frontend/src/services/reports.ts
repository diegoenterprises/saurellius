/**
 * REPORTS SERVICE
 * Frontend service for Payroll Reports and Analytics
 */

import api from './api';

// Types
export interface Report {
  id: string;
  name: string;
  type: string;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  parameters: Record<string, any>;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  file_url?: string;
  created_at: string;
  completed_at?: string;
}

export interface ScheduledReport {
  id: string;
  report_type: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'yearly';
  format: string;
  recipients: string[];
  next_run: string;
  last_run?: string;
  is_active: boolean;
}

export interface DashboardMetrics {
  total_payroll_ytd: number;
  total_employees: number;
  total_contractors: number;
  tax_liability_ytd: number;
  avg_salary: number;
  turnover_rate: number;
  payroll_by_department: { department: string; amount: number }[];
  monthly_payroll: { month: string; amount: number }[];
}

// Standard Reports
export const generatePayrollSummary = async (params: {
  start_date: string;
  end_date: string;
  format?: string;
}) => {
  const response = await api.post('/api/reporting/payroll-summary', params);
  return response.data;
};

export const generatePayrollRegister = async (params: {
  payroll_run_id?: string;
  start_date?: string;
  end_date?: string;
  format?: string;
}) => {
  const response = await api.post('/api/reporting/payroll-register', params);
  return response.data;
};

export const generateTaxLiabilityReport = async (params: {
  year: number;
  quarter?: number;
  format?: string;
}) => {
  const response = await api.post('/api/reporting/tax-liability', params);
  return response.data;
};

export const generateEmployeeEarningsReport = async (params: {
  employee_id?: string;
  start_date: string;
  end_date: string;
  format?: string;
}) => {
  const response = await api.post('/api/reporting/employee-earnings', params);
  return response.data;
};

export const generateDepartmentSummary = async (params: {
  start_date: string;
  end_date: string;
  department_id?: string;
  format?: string;
}) => {
  const response = await api.post('/api/reporting/department-summary', params);
  return response.data;
};

export const generateLaborCostReport = async (params: {
  start_date: string;
  end_date: string;
  group_by?: 'department' | 'location' | 'job_title';
  format?: string;
}) => {
  const response = await api.post('/api/reporting/labor-cost', params);
  return response.data;
};

export const generatePTOBalanceReport = async (params?: {
  as_of_date?: string;
  format?: string;
}) => {
  const response = await api.post('/api/reporting/pto-balance', params || {});
  return response.data;
};

export const generateDeductionsReport = async (params: {
  start_date: string;
  end_date: string;
  deduction_type?: string;
  format?: string;
}) => {
  const response = await api.post('/api/reporting/deductions', params);
  return response.data;
};

// Report Management
export const getReports = async (params?: { type?: string; status?: string }) => {
  const response = await api.get('/api/reporting/reports', { params });
  return response.data;
};

export const getReport = async (reportId: string) => {
  const response = await api.get(`/api/reporting/reports/${reportId}`);
  return response.data;
};

export const downloadReport = async (reportId: string) => {
  const response = await api.get(`/api/reporting/reports/${reportId}/download`, { 
    responseType: 'blob' 
  });
  return response.data;
};

export const deleteReport = async (reportId: string) => {
  const response = await api.delete(`/api/reporting/reports/${reportId}`);
  return response.data;
};

// Scheduled Reports
export const getScheduledReports = async () => {
  const response = await api.get('/api/reporting/scheduled');
  return response.data;
};

export const createScheduledReport = async (schedule: Partial<ScheduledReport>) => {
  const response = await api.post('/api/reporting/scheduled', schedule);
  return response.data;
};

export const updateScheduledReport = async (scheduleId: string, data: Partial<ScheduledReport>) => {
  const response = await api.put(`/api/reporting/scheduled/${scheduleId}`, data);
  return response.data;
};

export const deleteScheduledReport = async (scheduleId: string) => {
  const response = await api.delete(`/api/reporting/scheduled/${scheduleId}`);
  return response.data;
};

export const runScheduledReport = async (scheduleId: string) => {
  const response = await api.post(`/api/reporting/scheduled/${scheduleId}/run`);
  return response.data;
};

// Analytics Dashboard
export const getDashboardMetrics = async () => {
  const response = await api.get('/api/reporting/dashboard');
  return response.data;
};

export const getAnalyticsSummary = async (params: {
  start_date: string;
  end_date: string;
}) => {
  const response = await api.get('/api/reporting/analytics', { params });
  return response.data;
};

// Export Functions
export const exportToCSV = async (reportType: string, params: Record<string, any>) => {
  const response = await api.post('/api/reporting/export/csv', { 
    report_type: reportType, 
    ...params 
  }, { responseType: 'blob' });
  return response.data;
};

export const exportToExcel = async (reportType: string, params: Record<string, any>) => {
  const response = await api.post('/api/reporting/export/excel', { 
    report_type: reportType, 
    ...params 
  }, { responseType: 'blob' });
  return response.data;
};

export const exportToPDF = async (reportType: string, params: Record<string, any>) => {
  const response = await api.post('/api/reporting/export/pdf', { 
    report_type: reportType, 
    ...params 
  }, { responseType: 'blob' });
  return response.data;
};

export default {
  generatePayrollSummary,
  generatePayrollRegister,
  generateTaxLiabilityReport,
  generateEmployeeEarningsReport,
  generateDepartmentSummary,
  generateLaborCostReport,
  generatePTOBalanceReport,
  generateDeductionsReport,
  getReports,
  getReport,
  downloadReport,
  deleteReport,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  runScheduledReport,
  getDashboardMetrics,
  getAnalyticsSummary,
  exportToCSV,
  exportToExcel,
  exportToPDF,
};
