/**
 * PAYSTUBS SERVICE
 * Frontend service for paystub management and generation
 */

import api from './api';

// Types
export interface Paystub {
  id: number;
  employee_id: number;
  employee_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  gross_pay: number;
  total_taxes: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  theme: string;
  verification_id: string;
  created_at: string;
}

export interface PaystubDetail extends Paystub {
  company: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    ein: string;
  };
  employee: {
    name: string;
    address: string;
    ssn_last_four: string;
    employee_id: string;
  };
  earnings: {
    regular_hours: number;
    regular_rate: number;
    overtime_hours: number;
    overtime_rate: number;
    bonuses: number;
    commissions: number;
  };
  taxes: {
    federal: number;
    state: number;
    social_security: number;
    medicare: number;
    local?: number;
  };
  deductions: {
    health_insurance: number;
    dental: number;
    vision: number;
    retirement_401k: number;
    hsa: number;
    other: number;
  };
  ytd: {
    gross: number;
    taxes: number;
    deductions: number;
    net: number;
  };
}

export interface GeneratePaystubData {
  employee_id?: number;
  company: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    zip?: string;
    ein?: string;
  };
  employee: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    ssn_last_four?: string;
    employee_id?: string;
  };
  pay_period: {
    start: string;
    end: string;
    pay_date: string;
    pay_frequency?: string;
  };
  earnings: {
    regular_hours: number;
    regular_rate?: number;
    hourly_rate?: number;
    overtime_hours?: number;
    overtime_rate?: number;
    bonus?: number;
    bonuses?: number;
    commission?: number;
    commissions?: number;
  };
  tax_info?: {
    filing_status?: string;
    allowances?: number;
    work_state?: string;
  };
  taxes?: {
    federal?: number;
    state?: number;
    social_security?: number;
    medicare?: number;
  };
  deductions?: {
    health_insurance?: number;
    dental?: number;
    vision?: number;
    retirement_401k?: number;
    hsa?: number;
    other?: number;
  };
  ytd?: {
    gross?: number;
    federal_tax?: number;
    state_tax?: number;
    social_security?: number;
    medicare?: number;
  };
  totals?: {
    gross_pay?: number;
    gross_pay_ytd?: number;
    total_taxes?: number;
    net_pay?: number;
    net_pay_ytd?: number;
    total_deductions?: number;
  };
  check_number?: string;
  earnings_details?: any[];
  deductions_details?: any[];
  theme?: string;
}

// Get all paystubs
export const getPaystubs = async (page: number = 1, limit: number = 20): Promise<{
  paystubs: Paystub[];
  total: number;
  page: number;
  pages: number;
}> => {
  const response = await api.get('/api/paystubs', {
    params: { page, limit },
  });
  return response.data.data;
};

// Get paystub by ID
export const getPaystubById = async (id: number): Promise<PaystubDetail> => {
  const response = await api.get(`/api/paystubs/${id}`);
  return response.data.data;
};

// Generate paystub with advanced PDF generator
export const generatePaystub = async (data: GeneratePaystubData): Promise<{
  paystub_id: number;
  verification_id: string;
  pdf_generated: boolean;
  pdf_base64?: string;
  theme: string;
}> => {
  const response = await api.post('/api/paystubs/generate', data);
  return response.data.data;
};

// Generate standalone paystub (no employee required)
export const generateStandalonePaystub = async (data: GeneratePaystubData): Promise<{
  pdf_base64: string;
  verification_id: string;
}> => {
  const response = await api.post('/api/paystub-generator/generate', data);
  return response.data;
};

// Download paystub PDF
export const downloadPaystub = async (id: number): Promise<Blob> => {
  const response = await api.get(`/api/paystubs/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

// Email paystub
export const emailPaystub = async (id: number, email: string): Promise<void> => {
  await api.post(`/api/paystubs/${id}/email`, { email });
};

// Verify paystub
export const verifyPaystub = async (verificationId: string): Promise<{
  valid: boolean;
  paystub: Paystub;
}> => {
  const response = await api.get(`/api/paystubs/verify/${verificationId}`);
  return response.data.data;
};

// Get paystub themes
export const getThemes = async (): Promise<string[]> => {
  const response = await api.get('/api/paystub-generator/themes');
  return response.data.themes;
};

// Delete paystub
export const deletePaystub = async (id: number): Promise<void> => {
  await api.delete(`/api/paystubs/${id}`);
};

// Get paystub history for employee
export const getEmployeePaystubs = async (employeeId: number): Promise<Paystub[]> => {
  const response = await api.get(`/api/paystubs/employee/${employeeId}`);
  return response.data.data;
};

// Batch generate paystubs
export const batchGeneratePaystubs = async (employeeIds: number[], payPeriod: {
  start: string;
  end: string;
  pay_date: string;
}): Promise<{
  generated: number;
  paystub_ids: number[];
}> => {
  const response = await api.post('/api/paystubs/batch-generate', {
    employee_ids: employeeIds,
    pay_period: payPeriod,
  });
  return response.data.data;
};

export default {
  getPaystubs,
  getPaystubById,
  generatePaystub,
  generateStandalonePaystub,
  downloadPaystub,
  emailPaystub,
  verifyPaystub,
  getThemes,
  deletePaystub,
  getEmployeePaystubs,
  batchGeneratePaystubs,
};
