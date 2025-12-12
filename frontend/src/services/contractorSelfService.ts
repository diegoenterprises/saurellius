/**
 * CONTRACTOR SELF-SERVICE API SERVICE
 * Complete API integration for contractor registration, onboarding, and portal
 * Zero-touch contractor administration with full IRS compliance
 */

import api from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface ContractorRegistration {
  email: string;
  password: string;
  password_confirm: string;
  phone: string;
  business_classification: string;
  legal_name?: string;
  business_name?: string;
  dba_name?: string;
  date_of_birth?: string;
  working_status?: string;
  accept_terms: boolean;
  accept_privacy: boolean;
  accept_electronic_communications: boolean;
  accept_contractor_acknowledgment: boolean;
}

export interface W9FormData {
  name: string;
  business_name?: string;
  tax_classification: string;
  llc_tax_classification?: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  tin_type: 'ssn' | 'ein';
  tin: string;
  subject_to_backup_withholding?: boolean;
  certify_tin_correct: boolean;
  certify_not_subject_backup: boolean;
  certify_us_person: boolean;
  certify_fatca?: boolean;
  signature: string;
}

export interface PaymentMethodData {
  payment_method: 'direct_deposit' | 'check' | 'wire' | 'wallet';
  bank_name?: string;
  routing_number?: string;
  account_number?: string;
  account_number_confirm?: string;
  account_type?: 'checking' | 'savings';
  account_holder_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  swift_code?: string;
  wallet_pin?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
}

export interface InvoiceData {
  client_id: string;
  project_id?: string;
  invoice_number?: string;
  line_items: InvoiceLineItem[];
  tax_rate?: number;
  invoice_date?: string;
  due_date?: string;
  payment_terms?: string;
  notes?: string;
  terms?: string;
  currency?: string;
}

export interface ExpenseData {
  date?: string;
  category: string;
  description?: string;
  vendor?: string;
  amount: number;
  currency?: string;
  is_billable?: boolean;
  client_id?: string;
  project_id?: string;
  receipt_url?: string;
  tax_deductible?: boolean;
}

export interface MileageData {
  date?: string;
  miles: number;
  purpose?: string;
  from_location?: string;
  to_location?: string;
  client_id?: string;
  project_id?: string;
  is_round_trip?: boolean;
}

export interface ContractorDashboard {
  contractor_id: string;
  business_name: string;
  status: string;
  quick_stats: {
    ytd_earnings: number;
    outstanding_invoices: number;
    outstanding_amount: number;
    clients_count: number;
    pending_invoices: number;
  };
  recent_payments: any[];
  recent_invoices: any[];
  w9_status: string;
  payment_method_status: string;
  onboarding_complete: boolean;
}

export interface OnboardingStatus {
  contractor_id: string;
  overall_status: string;
  progress_percent: number;
  sections_completed: number;
  total_sections: number;
  required_complete: boolean;
  sections: Record<number, {
    name: string;
    required: boolean;
    status: string;
    completed_at?: string;
  }>;
  can_submit: boolean;
}

// ============================================================================
// API SERVICE
// ============================================================================

export const contractorSelfServiceAPI = {
  // ==========================================================================
  // REGISTRATION
  // ==========================================================================

  register: async (data: ContractorRegistration) => {
    const response = await api.post('/api/contractor/register', data);
    return response.data;
  },

  verifyEmail: async (contractorId: string, code: string) => {
    const response = await api.post('/api/contractor/verify/email', {
      contractor_id: contractorId,
      code
    });
    return response.data;
  },

  verifyPhone: async (contractorId: string, code: string) => {
    const response = await api.post('/api/contractor/verify/phone', {
      contractor_id: contractorId,
      code
    });
    return response.data;
  },

  // ==========================================================================
  // INVITATIONS
  // ==========================================================================

  getInvitation: async (token: string) => {
    const response = await api.get(`/api/contractor/invitation/${token}`);
    return response.data;
  },

  acceptInvitation: async (token: string, data: Partial<ContractorRegistration>) => {
    const response = await api.post('/api/contractor/invitation/accept', { token, ...data });
    return response.data;
  },

  createInvitation: async (data: {
    contractor_email: string;
    contractor_name?: string;
    start_date?: string;
    project_description?: string;
    personal_message?: string;
  }) => {
    const response = await api.post('/api/contractor/invitation', data);
    return response.data;
  },

  // ==========================================================================
  // CLIENT CONNECTION
  // ==========================================================================

  searchClients: async (query: string) => {
    const response = await api.get('/api/contractor/clients/search', { params: { q: query } });
    return response.data;
  },

  requestToJoinClient: async (clientId: string, message?: string) => {
    const response = await api.post('/api/contractor/clients/join', {
      client_id: clientId,
      message
    });
    return response.data;
  },

  // ==========================================================================
  // W-9 FORM
  // ==========================================================================

  submitW9: async (data: W9FormData) => {
    const response = await api.post('/api/contractor/w9', data);
    return response.data;
  },

  getW9: async () => {
    const response = await api.get('/api/contractor/w9');
    return response.data;
  },

  getTaxClassifications: async () => {
    const response = await api.get('/api/contractor/w9/tax-classifications');
    return response.data;
  },

  // ==========================================================================
  // PAYMENT METHODS
  // ==========================================================================

  setupPaymentMethod: async (data: PaymentMethodData) => {
    const response = await api.post('/api/contractor/payment-method', data);
    return response.data;
  },

  getPaymentMethod: async () => {
    const response = await api.get('/api/contractor/payment-method');
    return response.data;
  },

  // ==========================================================================
  // ONBOARDING
  // ==========================================================================

  getOnboardingStatus: async (): Promise<{ success: boolean; status: OnboardingStatus }> => {
    const response = await api.get('/api/contractor/onboarding/status');
    return response.data;
  },

  getOnboardingSections: async () => {
    const response = await api.get('/api/contractor/onboarding/sections');
    return response.data;
  },

  // ==========================================================================
  // INVOICING
  // ==========================================================================

  createInvoice: async (data: InvoiceData) => {
    const response = await api.post('/api/contractor/invoices', data);
    return response.data;
  },

  getInvoices: async (status?: string) => {
    const response = await api.get('/api/contractor/invoices', { params: { status } });
    return response.data;
  },

  getInvoice: async (invoiceId: string) => {
    const response = await api.get(`/api/contractor/invoices/${invoiceId}`);
    return response.data;
  },

  sendInvoice: async (invoiceId: string) => {
    const response = await api.post(`/api/contractor/invoices/${invoiceId}/send`);
    return response.data;
  },

  recordPayment: async (invoiceId: string, data: {
    amount: number;
    payment_method?: string;
    payment_date?: string;
    reference_number?: string;
    notes?: string;
  }) => {
    const response = await api.post(`/api/contractor/invoices/${invoiceId}/payment`, data);
    return response.data;
  },

  // ==========================================================================
  // EXPENSES
  // ==========================================================================

  addExpense: async (data: ExpenseData) => {
    const response = await api.post('/api/contractor/expenses', data);
    return response.data;
  },

  getExpenses: async (year?: number, category?: string) => {
    const response = await api.get('/api/contractor/expenses', { params: { year, category } });
    return response.data;
  },

  getExpenseCategories: async () => {
    const response = await api.get('/api/contractor/expenses/categories');
    return response.data;
  },

  // ==========================================================================
  // MILEAGE
  // ==========================================================================

  logMileage: async (data: MileageData) => {
    const response = await api.post('/api/contractor/mileage', data);
    return response.data;
  },

  getMileage: async (year?: number) => {
    const response = await api.get('/api/contractor/mileage', { params: { year } });
    return response.data;
  },

  getMileageRate: async () => {
    const response = await api.get('/api/contractor/mileage/rate');
    return response.data;
  },

  // ==========================================================================
  // 1099-NEC
  // ==========================================================================

  check1099Eligibility: async (year?: number) => {
    const response = await api.get('/api/contractor/1099/eligibility', { params: { year } });
    return response.data;
  },

  get1099Forms: async (year?: number) => {
    const response = await api.get('/api/contractor/1099', { params: { year } });
    return response.data;
  },

  generate1099: async (contractorId: string, year: number) => {
    const response = await api.post('/api/contractor/1099/generate', {
      contractor_id: contractorId,
      year
    });
    return response.data;
  },

  // ==========================================================================
  // TAX CENTER
  // ==========================================================================

  getEstimatedTaxes: async (year?: number) => {
    const response = await api.get('/api/contractor/tax/estimated', { params: { year } });
    return response.data;
  },

  getTaxDeadlines: async () => {
    const response = await api.get('/api/contractor/tax/deadlines');
    return response.data;
  },

  getTaxRates: async () => {
    const response = await api.get('/api/contractor/tax/rates');
    return response.data;
  },

  // ==========================================================================
  // PORTAL
  // ==========================================================================

  getDashboard: async (): Promise<{ success: boolean; dashboard: ContractorDashboard }> => {
    const response = await api.get('/api/contractor/portal/dashboard');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/contractor/profile');
    return response.data;
  },

  updateProfile: async (data: Record<string, any>) => {
    const response = await api.put('/api/contractor/profile', data);
    return response.data;
  },

  // ==========================================================================
  // OPTIONS & LOOKUPS
  // ==========================================================================

  getBusinessClassifications: async () => {
    const response = await api.get('/api/contractor/options/business-classifications');
    return response.data;
  },

  getIndustries: async () => {
    const response = await api.get('/api/contractor/options/industries');
    return response.data;
  },

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  validatePassword: async (password: string) => {
    const response = await api.post('/api/contractor/validate/password', { password });
    return response.data;
  },

  validateEIN: async (ein: string) => {
    const response = await api.post('/api/contractor/validate/ein', { ein });
    return response.data;
  },

  validateSSN: async (ssn: string) => {
    const response = await api.post('/api/contractor/validate/ssn', { ssn });
    return response.data;
  },

  validateRoutingNumber: async (routingNumber: string) => {
    const response = await api.post('/api/contractor/validate/routing', { routing_number: routingNumber });
    return response.data;
  }
};

export default contractorSelfServiceAPI;
