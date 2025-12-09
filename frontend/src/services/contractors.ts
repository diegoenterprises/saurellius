/**
 * 👷 CONTRACTORS SERVICE
 * Frontend service for 1099 Contractor Management
 */

import api from './api';

// Types
export interface Contractor {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  business_name?: string;
  tax_classification: 'individual' | 'sole_proprietor' | 'llc' | 'corporation' | 's_corp';
  ein_or_ssn_last4: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  payment_method: 'check' | 'direct_deposit' | 'paypal' | 'venmo';
  bank_info?: {
    routing_number: string;
    account_number_last4: string;
    account_type: 'checking' | 'savings';
  };
  w9_received: boolean;
  w9_received_date?: string;
  status: 'active' | 'inactive';
  ytd_payments: number;
  created_at: string;
}

export interface ContractorPayment {
  id: string;
  contractor_id: string;
  contractor_name: string;
  amount: number;
  payment_date: string;
  description: string;
  invoice_number?: string;
  payment_method: string;
  status: 'pending' | 'processed' | 'failed';
  created_at: string;
}

export interface Form1099 {
  id: string;
  contractor_id: string;
  contractor_name: string;
  tax_year: number;
  box1_nonemployee_compensation: number;
  box2_payer_made_direct_sales: boolean;
  box4_federal_tax_withheld: number;
  status: 'draft' | 'generated' | 'filed' | 'corrected';
  generated_at?: string;
  filed_at?: string;
}

// Contractor Management
export const getContractors = async (params?: { status?: string }) => {
  const response = await api.get('/api/contractors', { params });
  return response.data;
};

export const getContractor = async (contractorId: string) => {
  const response = await api.get(`/api/contractors/${contractorId}`);
  return response.data;
};

export const createContractor = async (contractor: Partial<Contractor>) => {
  const response = await api.post('/api/contractors', contractor);
  return response.data;
};

export const updateContractor = async (contractorId: string, data: Partial<Contractor>) => {
  const response = await api.put(`/api/contractors/${contractorId}`, data);
  return response.data;
};

export const deactivateContractor = async (contractorId: string) => {
  const response = await api.post(`/api/contractors/${contractorId}/deactivate`);
  return response.data;
};

// Payments
export const getPayments = async (params?: { 
  contractor_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}) => {
  const response = await api.get('/api/contractors/payments', { params });
  return response.data;
};

export const getPayment = async (paymentId: string) => {
  const response = await api.get(`/api/contractors/payments/${paymentId}`);
  return response.data;
};

export const createPayment = async (payment: {
  contractor_id: string;
  amount: number;
  payment_date: string;
  description: string;
  invoice_number?: string;
}) => {
  const response = await api.post('/api/contractors/payments', payment);
  return response.data;
};

export const processPayment = async (paymentId: string) => {
  const response = await api.post(`/api/contractors/payments/${paymentId}/process`);
  return response.data;
};

export const voidPayment = async (paymentId: string, reason: string) => {
  const response = await api.post(`/api/contractors/payments/${paymentId}/void`, { reason });
  return response.data;
};

// 1099 Forms
export const get1099Forms = async (taxYear: number) => {
  const response = await api.get('/api/contractors/1099', { params: { tax_year: taxYear } });
  return response.data;
};

export const get1099Form = async (formId: string) => {
  const response = await api.get(`/api/contractors/1099/${formId}`);
  return response.data;
};

export const generate1099 = async (contractorId: string, taxYear: number) => {
  const response = await api.post('/api/contractors/1099/generate', { 
    contractor_id: contractorId, 
    tax_year: taxYear 
  });
  return response.data;
};

export const generateAll1099s = async (taxYear: number) => {
  const response = await api.post('/api/contractors/1099/generate-all', { tax_year: taxYear });
  return response.data;
};

export const download1099 = async (formId: string) => {
  const response = await api.get(`/api/contractors/1099/${formId}/download`, { responseType: 'blob' });
  return response.data;
};

export const file1099 = async (formId: string) => {
  const response = await api.post(`/api/contractors/1099/${formId}/file`);
  return response.data;
};

// W-9 Management
export const validateW9 = async (contractorId: string) => {
  const response = await api.post(`/api/contractors/${contractorId}/validate-w9`);
  return response.data;
};

export const requestW9 = async (contractorId: string) => {
  const response = await api.post(`/api/contractors/${contractorId}/request-w9`);
  return response.data;
};

// Reports
export const getContractorSummary = async (taxYear: number) => {
  const response = await api.get('/api/contractors/reports/summary', { params: { tax_year: taxYear } });
  return response.data;
};

export default {
  getContractors,
  getContractor,
  createContractor,
  updateContractor,
  deactivateContractor,
  getPayments,
  getPayment,
  createPayment,
  processPayment,
  voidPayment,
  get1099Forms,
  get1099Form,
  generate1099,
  generateAll1099s,
  download1099,
  file1099,
  validateW9,
  requestW9,
  getContractorSummary,
};
