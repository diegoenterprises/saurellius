/**
 * STRIPE FINANCIAL CONNECTIONS SERVICE
 * Bank account linking via Stripe Financial Connections API
 * Similar to Plaid - allows users to securely link bank accounts
 */

import api from './api';

export interface LinkedAccount {
  id: string;
  institution_name: string;
  last4: string;
  account_type: string;
  status: string;
  linked_at?: string;
  balance?: {
    current: number;
    available?: number;
    as_of?: string;
  };
}

export interface FinancialConnectionsSession {
  client_secret: string;
  session_id: string;
}

export interface AccountOwnership {
  owners: Array<{
    name: string;
    email?: string;
    phone?: string;
    ownership_type?: string;
  }>;
  verified: boolean;
}

/**
 * Create a Financial Connections session for bank linking
 * @param permissions - Array of permissions to request (payment_method, balances, ownership)
 * @param returnUrl - URL to redirect to after linking
 */
export const createSession = async (
  permissions: string[] = ['payment_method', 'balances', 'ownership'],
  returnUrl?: string
): Promise<FinancialConnectionsSession> => {
  const response = await api.post('/api/financial-connections/create-session', {
    permissions,
    return_url: returnUrl,
  });
  return response.data;
};

/**
 * List all linked bank accounts for the current user
 */
export const listLinkedAccounts = async (): Promise<LinkedAccount[]> => {
  const response = await api.get('/api/financial-connections/accounts');
  return response.data.accounts;
};

/**
 * Get details of a specific linked account
 * @param accountId - The Stripe Financial Connections account ID
 */
export const getAccountDetails = async (accountId: string): Promise<LinkedAccount> => {
  const response = await api.get(`/api/financial-connections/accounts/${accountId}`);
  return response.data.account;
};

/**
 * Disconnect a linked bank account
 * @param accountId - The account ID to disconnect
 */
export const disconnectAccount = async (accountId: string): Promise<void> => {
  await api.post(`/api/financial-connections/accounts/${accountId}/disconnect`);
};

/**
 * Complete the linking process after user authorization
 * @param sessionId - The session ID from the completed flow
 */
export const completeLinking = async (sessionId: string): Promise<LinkedAccount[]> => {
  const response = await api.post('/api/financial-connections/link-complete', {
    session_id: sessionId,
  });
  return response.data.accounts;
};

/**
 * Create a payment method from a linked account
 * @param accountId - The linked account ID
 */
export const createPaymentMethod = async (accountId: string): Promise<string> => {
  const response = await api.post('/api/financial-connections/create-payment-method', {
    account_id: accountId,
  });
  return response.data.payment_method_id;
};

/**
 * Verify ownership of a linked account
 * @param accountId - The account ID to verify
 */
export const verifyOwnership = async (accountId: string): Promise<AccountOwnership | null> => {
  const response = await api.post('/api/financial-connections/verify-ownership', {
    account_id: accountId,
  });
  return response.data.ownership;
};

export default {
  createSession,
  listLinkedAccounts,
  getAccountDetails,
  disconnectAccount,
  completeLinking,
  createPaymentMethod,
  verifyOwnership,
};
