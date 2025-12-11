/**
 * ACH/Direct Deposit Service
 * API calls for bank account and ACH management
 */

import api from './api';

export interface BankAccount {
  id: string;
  owner_id: string;
  owner_type: 'employee' | 'contractor';
  bank_name: string;
  routing_number_last4: string;
  account_number_last4: string;
  account_type: 'checking' | 'savings';
  is_primary: boolean;
  status: 'pending' | 'verified' | 'failed';
  split_type?: 'percentage' | 'fixed' | 'remainder';
  split_amount?: number;
  created_at: string;
}

export interface ACHBatch {
  id: string;
  batch_type: string;
  effective_date: string;
  status: string;
  transaction_count: number;
  total_amount: number;
  created_at: string;
}

// Bank Account Management
export const getBankAccounts = async (ownerId: string, ownerType: string = 'employee') => {
  const response = await api.get(`/api/ach/bank-accounts?owner_id=${ownerId}&owner_type=${ownerType}`);
  return response.data;
};

export const addBankAccount = async (data: {
  owner_id: string;
  owner_type?: string;
  routing_number: string;
  account_number: string;
  account_type: 'checking' | 'savings';
  bank_name?: string;
  account_holder_name?: string;
  is_primary?: boolean;
  split_type?: 'percentage' | 'fixed' | 'remainder';
  split_amount?: number;
}) => {
  const response = await api.post('/api/ach/bank-accounts', data);
  return response.data;
};

export const updateBankAccount = async (accountId: string, data: Partial<BankAccount>) => {
  const response = await api.put(`/api/ach/bank-accounts/${accountId}`, data);
  return response.data;
};

export const deleteBankAccount = async (accountId: string) => {
  const response = await api.delete(`/api/ach/bank-accounts/${accountId}`);
  return response.data;
};

// Verification
export const verifyBankAccount = async (accountId: string, method: 'micro_deposits' | 'prenote' = 'micro_deposits') => {
  const response = await api.post(`/api/ach/bank-accounts/${accountId}/verify`, { method });
  return response.data;
};

export const confirmMicroDeposits = async (accountId: string, amount1: number, amount2: number) => {
  const response = await api.post(`/api/ach/bank-accounts/${accountId}/confirm`, { amount1, amount2 });
  return response.data;
};

// Split Deposits
export const getSplitDeposits = async (ownerId: string) => {
  const response = await api.get(`/api/ach/split-deposits/${ownerId}`);
  return response.data;
};

export const configureSplitDeposits = async (ownerId: string, accounts: Array<{
  account_id: string;
  split_type: 'percentage' | 'fixed' | 'remainder';
  split_amount?: number;
}>) => {
  const response = await api.post(`/api/ach/split-deposits/${ownerId}`, { accounts });
  return response.data;
};

// ACH Batches
export const getACHBatches = async (status?: string, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const response = await api.get(`/api/ach/batches?${params.toString()}`);
  return response.data;
};

export const getACHBatch = async (batchId: string) => {
  const response = await api.get(`/api/ach/batches/${batchId}`);
  return response.data;
};

export const createACHBatch = async (data: {
  batch_type: string;
  effective_date: string;
  transactions: Array<{
    account_id: string;
    amount: number;
    type: 'credit' | 'debit';
    description?: string;
  }>;
  description?: string;
}) => {
  const response = await api.post('/api/ach/batches', data);
  return response.data;
};

export const submitACHBatch = async (batchId: string) => {
  const response = await api.post(`/api/ach/batches/${batchId}/submit`);
  return response.data;
};

// NACHA File
export const generateNACHAFile = async (batchIds: string[]) => {
  const response = await api.post('/api/ach/nacha/generate', { batch_ids: batchIds });
  return response.data;
};

export const downloadNACHAFile = async (batchId: string) => {
  const response = await api.get(`/api/ach/nacha/download/${batchId}`, { responseType: 'blob' });
  return response.data;
};

// Routing Validation
export const validateRoutingNumber = async (routingNumber: string) => {
  const response = await api.post('/api/ach/validate-routing', { routing_number: routingNumber });
  return response.data;
};

// ACH Returns
export const processACHReturn = async (transactionId: string, returnCode: string, returnReason: string) => {
  const response = await api.post('/api/ach/returns', {
    transaction_id: transactionId,
    return_code: returnCode,
    return_reason: returnReason,
  });
  return response.data;
};

// Prenotes
export const getPendingPrenotes = async () => {
  const response = await api.get('/api/ach/prenotes/pending');
  return response.data;
};

export default {
  getBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  verifyBankAccount,
  confirmMicroDeposits,
  getSplitDeposits,
  configureSplitDeposits,
  getACHBatches,
  getACHBatch,
  createACHBatch,
  submitACHBatch,
  generateNACHAFile,
  downloadNACHAFile,
  validateRoutingNumber,
  processACHReturn,
  getPendingPrenotes,
};
