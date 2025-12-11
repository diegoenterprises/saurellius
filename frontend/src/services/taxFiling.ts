/**
 * TAX FILING SERVICE
 * Frontend service for Tax Forms, Filings, and Deposits
 */

import api from './api';

// Types
export interface TaxForm {
  id: string;
  form_type: 'w2' | 'w3' | '940' | '941' | '943' | '944' | '1099_nec' | '1099_misc';
  tax_year: number;
  quarter?: number;
  employee_id?: string;
  employee_name?: string;
  status: 'draft' | 'generated' | 'reviewed' | 'filed' | 'corrected';
  data: Record<string, any>;
  generated_at?: string;
  filed_at?: string;
  file_url?: string;
}

export interface TaxDeposit {
  id: string;
  deposit_type: 'federal' | 'state' | 'local';
  tax_type: string;
  amount: number;
  due_date: string;
  deposit_date?: string;
  status: 'pending' | 'scheduled' | 'deposited' | 'late';
  confirmation_number?: string;
  payroll_run_id?: string;
}

export interface TaxLiability {
  jurisdiction: string;
  tax_type: string;
  period: string;
  liability_amount: number;
  deposited_amount: number;
  balance_due: number;
  due_date: string;
}

// W-2 Forms
export const getW2Forms = async (taxYear: number) => {
  const response = await api.get('/api/tax-filing/w2', { params: { tax_year: taxYear } });
  return response.data;
};

export const getW2Form = async (formId: string) => {
  const response = await api.get(`/api/tax-filing/w2/${formId}`);
  return response.data;
};

export const generateW2 = async (employeeId: string, taxYear: number) => {
  const response = await api.post('/api/tax-filing/w2/generate', { 
    employee_id: employeeId, 
    tax_year: taxYear 
  });
  return response.data;
};

export const generateAllW2s = async (taxYear: number) => {
  const response = await api.post('/api/tax-filing/w2/generate-all', { tax_year: taxYear });
  return response.data;
};

export const downloadW2 = async (formId: string) => {
  const response = await api.get(`/api/tax-filing/w2/${formId}/download`, { responseType: 'blob' });
  return response.data;
};

// W-3 Forms
export const generateW3 = async (taxYear: number) => {
  const response = await api.post('/api/tax-filing/w3/generate', { tax_year: taxYear });
  return response.data;
};

// Quarterly Forms (940, 941)
export const generate941 = async (taxYear: number, quarter: number) => {
  const response = await api.post('/api/tax-filing/941/generate', { 
    tax_year: taxYear, 
    quarter 
  });
  return response.data;
};

export const generate940 = async (taxYear: number) => {
  const response = await api.post('/api/tax-filing/940/generate', { tax_year: taxYear });
  return response.data;
};

export const getTaxFilings = async (params?: {
  tax_year?: number;
  form_type?: string;
  status?: string;
}) => {
  const response = await api.get('/api/tax-filing/filings', { params });
  return response.data;
};

export const fileTaxForm = async (formId: string) => {
  const response = await api.post(`/api/tax-filing/filings/${formId}/file`);
  return response.data;
};

// Tax Deposits
export const getTaxDeposits = async (params?: {
  start_date?: string;
  end_date?: string;
  status?: string;
  deposit_type?: string;
}) => {
  const response = await api.get('/api/tax-filing/deposits', { params });
  return response.data;
};

export const scheduleDeposit = async (deposit: {
  deposit_type: string;
  tax_type: string;
  amount: number;
  deposit_date: string;
  payroll_run_id?: string;
}) => {
  const response = await api.post('/api/tax-filing/deposits/schedule', deposit);
  return response.data;
};

export const recordDeposit = async (depositId: string, confirmationNumber: string) => {
  const response = await api.post(`/api/tax-filing/deposits/${depositId}/record`, { 
    confirmation_number: confirmationNumber 
  });
  return response.data;
};

export const getNextDepositDue = async () => {
  const response = await api.get('/api/tax-filing/deposits/next-due');
  return response.data;
};

// Tax Liability
export const getTaxLiability = async (params: {
  year: number;
  quarter?: number;
}) => {
  const response = await api.get('/api/tax-filing/liability', { params });
  return response.data;
};

export const getQuarterlyLiability = async (year: number, quarter: number) => {
  const response = await api.get('/api/tax-filing/liability/quarterly', { 
    params: { year, quarter } 
  });
  return response.data;
};

// State Requirements
export const getStateRequirements = async (stateCode: string) => {
  const response = await api.get(`/api/tax-filing/state-requirements/${stateCode}`);
  return response.data;
};

export const getAllStateRequirements = async () => {
  const response = await api.get('/api/tax-filing/state-requirements');
  return response.data;
};

// Filing Calendar
export const getFilingCalendar = async (year: number) => {
  const response = await api.get('/api/tax-filing/calendar', { params: { year } });
  return response.data;
};

export const getUpcomingDeadlines = async (days?: number) => {
  const response = await api.get('/api/tax-filing/deadlines', { params: { days: days || 30 } });
  return response.data;
};

export default {
  getW2Forms,
  getW2Form,
  generateW2,
  generateAllW2s,
  downloadW2,
  generateW3,
  generate941,
  generate940,
  getTaxFilings,
  fileTaxForm,
  getTaxDeposits,
  scheduleDeposit,
  recordDeposit,
  getNextDepositDue,
  getTaxLiability,
  getQuarterlyLiability,
  getStateRequirements,
  getAllStateRequirements,
  getFilingCalendar,
  getUpcomingDeadlines,
};
