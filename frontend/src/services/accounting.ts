/**
 * 📊 ACCOUNTING SERVICE
 * Frontend service for Chart of Accounts, Journal Entries, and Financial Reports
 */

import api from './api';

// Types
export interface Account {
  id: string;
  account_number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string;
  balance: number;
  is_active: boolean;
  parent_id?: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference_number: string;
  lines: JournalLine[];
  status: 'draft' | 'posted' | 'reversed';
  created_by: string;
  created_at: string;
}

export interface JournalLine {
  account_id: string;
  account_name: string;
  debit: number;
  credit: number;
  memo?: string;
}

// Chart of Accounts
export const getChartOfAccounts = async () => {
  const response = await api.get('/api/accounting/accounts');
  return response.data;
};

export const getAccount = async (accountId: string) => {
  const response = await api.get(`/api/accounting/accounts/${accountId}`);
  return response.data;
};

export const createAccount = async (account: Partial<Account>) => {
  const response = await api.post('/api/accounting/accounts', account);
  return response.data;
};

export const updateAccount = async (accountId: string, data: Partial<Account>) => {
  const response = await api.put(`/api/accounting/accounts/${accountId}`, data);
  return response.data;
};

// Journal Entries
export const getJournalEntries = async (params?: { 
  start_date?: string; 
  end_date?: string;
  status?: string;
}) => {
  const response = await api.get('/api/accounting/journal-entries', { params });
  return response.data;
};

export const getJournalEntry = async (entryId: string) => {
  const response = await api.get(`/api/accounting/journal-entries/${entryId}`);
  return response.data;
};

export const createJournalEntry = async (entry: Partial<JournalEntry>) => {
  const response = await api.post('/api/accounting/journal-entries', entry);
  return response.data;
};

export const postJournalEntry = async (entryId: string) => {
  const response = await api.post(`/api/accounting/journal-entries/${entryId}/post`);
  return response.data;
};

export const reverseJournalEntry = async (entryId: string, reason: string) => {
  const response = await api.post(`/api/accounting/journal-entries/${entryId}/reverse`, { reason });
  return response.data;
};

// Financial Reports
export const getTrialBalance = async (asOfDate: string) => {
  const response = await api.get('/api/accounting/reports/trial-balance', { 
    params: { as_of_date: asOfDate } 
  });
  return response.data;
};

export const getIncomeStatement = async (startDate: string, endDate: string) => {
  const response = await api.get('/api/accounting/reports/income-statement', { 
    params: { start_date: startDate, end_date: endDate } 
  });
  return response.data;
};

export const getBalanceSheet = async (asOfDate: string) => {
  const response = await api.get('/api/accounting/reports/balance-sheet', { 
    params: { as_of_date: asOfDate } 
  });
  return response.data;
};

export const getGeneralLedger = async (accountId: string, startDate: string, endDate: string) => {
  const response = await api.get('/api/accounting/reports/general-ledger', { 
    params: { account_id: accountId, start_date: startDate, end_date: endDate } 
  });
  return response.data;
};

// Payroll Journal Entries
export const createPayrollJournalEntry = async (payrollRunId: string) => {
  const response = await api.post('/api/accounting/payroll-journal-entry', { payroll_run_id: payrollRunId });
  return response.data;
};

export default {
  getChartOfAccounts,
  getAccount,
  createAccount,
  updateAccount,
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  postJournalEntry,
  reverseJournalEntry,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  getGeneralLedger,
  createPayrollJournalEntry,
};
