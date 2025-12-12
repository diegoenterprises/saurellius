/**
 * SAURELLIUS DIGITAL WALLET SERVICE
 * Employer and Employee wallet management
 */

import api from './api';

// Types
export interface WalletBalance {
  wallet_id: string;
  balance: number;
  available: number;
  payroll_reserve?: number;
  ewa_available?: number;
  ewa_limit?: number;
  ytd_wages?: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface FundingResult {
  transaction_id: string;
  funded: number;
  fee: number;
  net: number;
  new_balance: number;
}

export interface PaymentResult {
  employee_id: string;
  amount: number;
  employee_balance: number;
}

export interface EWAResult {
  transaction_id: string;
  requested: number;
  fee: number;
  received: number;
  new_balance: number;
  ewa_remaining: number;
}

export interface TransferResult {
  transaction_id: string;
  amount: number;
  fee: number;
  net: number;
  speed: 'instant' | 'standard';
  eta: string;
  new_balance: number;
}

export interface BankAccount {
  id: string;
  last4: string;
  type: 'checking' | 'savings';
  status: string;
}

// === EMPLOYER WALLET ===

export const getEmployerWallet = async (): Promise<WalletBalance> => {
  const response = await api.get('/api/wallet/employer');
  return response.data.data;
};

export const fundEmployerWallet = async (
  amount: number,
  source: 'bank' | 'card' = 'bank'
): Promise<FundingResult> => {
  const response = await api.post('/api/wallet/employer/fund', { amount, source });
  return response.data.data;
};

export const setPayrollReserve = async (
  amount: number,
  payrollDate?: string
): Promise<{ reserved: number; available: number; reserve: number }> => {
  const response = await api.post('/api/wallet/employer/reserve', { amount, payroll_date: payrollDate });
  return response.data.data;
};

export const payEmployee = async (
  employeeId: string,
  amount: number
): Promise<PaymentResult> => {
  const response = await api.post('/api/wallet/employer/pay', {
    employee_id: employeeId,
    amount,
  });
  return response.data.data;
};

export const batchPayEmployees = async (
  payments: Array<{ employee_id: string; amount: number }>
): Promise<{ total_paid: number; count: number; payments: PaymentResult[] }> => {
  const response = await api.post('/api/wallet/employer/batch-pay', { payments });
  return response.data.data;
};

// === EMPLOYEE WALLET ===

export const getEmployeeWallet = async (): Promise<WalletBalance> => {
  const response = await api.get('/api/wallet/employee');
  return response.data.data;
};

export const requestEWA = async (
  amount: number,
  reason?: string
): Promise<EWAResult> => {
  const response = await api.post('/api/wallet/employee/ewa', { amount, reason });
  return response.data.data;
};

export const transferToBank = async (
  amount: number,
  speed: 'instant' | 'standard' = 'standard'
): Promise<TransferResult> => {
  const response = await api.post('/api/wallet/employee/transfer', { amount, speed });
  return response.data.data;
};

// === SHARED ===

export const getTransactions = async (
  walletType: 'employer' | 'employee' = 'employee',
  limit: number = 50
): Promise<{ transactions: Transaction[]; total: number }> => {
  const response = await api.get('/api/wallet/transactions', {
    params: { type: walletType, limit },
  });
  return response.data.data;
};

export const linkBankAccount = async (
  walletType: 'employer' | 'employee',
  accountHolderName: string,
  routingNumber: string,
  accountNumber: string,
  accountType: 'checking' | 'savings' = 'checking'
): Promise<BankAccount> => {
  const response = await api.post('/api/wallet/link-bank', {
    wallet_type: walletType,
    account_holder_name: accountHolderName,
    routing_number: routingNumber,
    account_number: accountNumber,
    account_type: accountType,
  });
  return response.data.data;
};

export const getWalletSummary = async (): Promise<{
  employer: { balance: number; reserve: number };
  employee: { balance: number; ewa_available: number };
}> => {
  const response = await api.get('/api/wallet/summary');
  return response.data.data;
};

// === UTILITY ===

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getTransactionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    deposit: 'arrow-down-circle-outline',
    withdrawal: 'arrow-up-circle-outline',
    payout: 'send-outline',
    batch_payout: 'people-outline',
    wage: 'cash-outline',
    ewa: 'flash-outline',
    transfer: 'swap-horizontal-outline',
    reserve: 'lock-closed-outline',
    fee: 'card-outline',
  };
  return icons[type] || 'receipt-outline';
};

export const getTransactionColor = (amount: number): string => {
  return amount >= 0 ? '#22C55E' : '#EF4444';
};

export default {
  // Employer
  getEmployerWallet,
  fundEmployerWallet,
  setPayrollReserve,
  payEmployee,
  batchPayEmployees,
  // Employee
  getEmployeeWallet,
  requestEWA,
  transferToBank,
  // Shared
  getTransactions,
  linkBankAccount,
  getWalletSummary,
  // Utility
  formatCurrency,
  getTransactionIcon,
  getTransactionColor,
};
