/**
 * EMPLOYEE SELF-SERVICE API SERVICE
 * Complete API integration for employee registration, onboarding, and portal
 */

import api from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface RegistrationData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  preferred_name?: string;
  phone: string;
  date_of_birth: string;
  employment_status?: string;
  accept_terms: boolean;
  accept_privacy: boolean;
  accept_electronic_communications: boolean;
  accept_marketing?: boolean;
}

export interface OnboardingSection {
  number: number;
  name: string;
  required: boolean;
  status: 'not_started' | 'in_progress' | 'complete';
  completed_at?: string;
}

export interface OnboardingStatus {
  employee_id: string;
  overall_status: string;
  progress_percent: number;
  sections_completed: number;
  total_sections: number;
  sections: Record<number, OnboardingSection>;
  can_submit: boolean;
}

export interface DirectDepositAccount {
  bank_name: string;
  routing_number: string;
  account_number?: string;
  account_last_four?: string;
  account_type: 'checking' | 'savings';
  amount_type: 'percent' | 'fixed' | 'remainder';
  amount?: number;
}

export interface PTOBalance {
  vacation: number;
  sick: number;
  personal: number;
}

export interface Paystub {
  id: string;
  pay_date: string;
  pay_period_start: string;
  pay_period_end: string;
  gross_pay: number;
  net_pay: number;
  year: number;
}

export interface DashboardData {
  welcome_message: string;
  quick_stats: {
    next_payday: string;
    days_until_payday: number;
    ytd_earnings: number;
    available_pto: number;
    benefits_cost_monthly: number;
  };
  upcoming_events: Array<{
    type: string;
    date: string;
    description: string;
  }>;
  recent_activity: Array<{
    type: string;
    description: string;
    date: string;
  }>;
  notifications: Array<{
    id: string;
    message: string;
    read: boolean;
    created_at: string;
  }>;
  profile_completion: number;
}

// ============================================================================
// REGISTRATION APIs
// ============================================================================

export const employeeSelfServiceAPI = {
  // Self-service registration
  register: async (data: RegistrationData) => {
    const response = await api.post('/api/employee/register', data);
    return response.data;
  },

  // Verify email with code
  verifyEmail: async (employeeId: string, code: string) => {
    const response = await api.post('/api/employee/verify/email', {
      employee_id: employeeId,
      code
    });
    return response.data;
  },

  // Verify phone with code
  verifyPhone: async (employeeId: string, code: string) => {
    const response = await api.post('/api/employee/verify/phone', {
      employee_id: employeeId,
      code
    });
    return response.data;
  },

  // Resend verification code
  resendVerification: async (employeeId: string, type: 'email' | 'phone') => {
    const response = await api.post('/api/employee/verify/resend', {
      employee_id: employeeId,
      type
    });
    return response.data;
  },

  // Get invitation details
  getInvitation: async (token: string) => {
    const response = await api.get(`/api/employee/invitation/${token}`);
    return response.data;
  },

  // Accept employer invitation
  acceptInvitation: async (token: string, data: Partial<RegistrationData>) => {
    const response = await api.post('/api/employee/invitation/accept', {
      token,
      ...data
    });
    return response.data;
  },

  // Search employers
  searchEmployers: async (query: string) => {
    const response = await api.get('/api/employee/employers/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Request to join employer
  requestToJoin: async (employerId: string, message?: string) => {
    const response = await api.post('/api/employee/employers/join', {
      employer_id: employerId,
      message
    });
    return response.data;
  },

  // ============================================================================
  // ONBOARDING APIs
  // ============================================================================

  // Get onboarding status
  getOnboardingStatus: async (): Promise<{ success: boolean; status: OnboardingStatus }> => {
    const response = await api.get('/api/employee/onboarding/status');
    return response.data;
  },

  // Get onboarding sections list
  getOnboardingSections: async () => {
    const response = await api.get('/api/employee/onboarding/sections');
    return response.data;
  },

  // Get specific section data
  getOnboardingSection: async (section: number) => {
    const response = await api.get(`/api/employee/onboarding/section/${section}`);
    return response.data;
  },

  // Submit section data
  submitOnboardingSection: async (section: number, data: Record<string, any>) => {
    const response = await api.post(`/api/employee/onboarding/section/${section}`, data);
    return response.data;
  },

  // Submit completed onboarding
  submitOnboarding: async (signature: string) => {
    const response = await api.post('/api/employee/onboarding/submit', { signature });
    return response.data;
  },

  // W-4 helpers
  getW4FilingStatuses: async () => {
    const response = await api.get('/api/employee/onboarding/w4/filing-statuses');
    return response.data;
  },

  calculateW4Withholding: async (data: {
    filing_status: string;
    annual_salary: number;
    dependents_amount?: number;
    other_income?: number;
    deductions?: number;
  }) => {
    const response = await api.post('/api/employee/onboarding/w4/calculate', data);
    return response.data;
  },

  // I-9 helpers
  getCitizenshipStatuses: async () => {
    const response = await api.get('/api/employee/onboarding/i9/citizenship-statuses');
    return response.data;
  },

  getI9Documents: async () => {
    const response = await api.get('/api/employee/onboarding/i9/documents');
    return response.data;
  },

  // ============================================================================
  // PORTAL APIs
  // ============================================================================

  // Dashboard
  getDashboard: async (): Promise<{ success: boolean; dashboard: DashboardData }> => {
    const response = await api.get('/api/employee/portal/dashboard');
    return response.data;
  },

  // Profile
  getProfile: async () => {
    const response = await api.get('/api/employee/portal/profile');
    return response.data;
  },

  updateProfile: async (data: Record<string, any>) => {
    const response = await api.put('/api/employee/portal/profile', data);
    return response.data;
  },

  // Paystubs
  getPaystubs: async (year?: number, limit?: number): Promise<{
    success: boolean;
    paystubs: Paystub[];
    total_count: number;
    ytd_summary: {
      gross: number;
      net: number;
      federal_tax: number;
      state_tax: number;
      deductions: number;
    };
  }> => {
    const response = await api.get('/api/employee/portal/paystubs', {
      params: { year, limit }
    });
    return response.data;
  },

  getPaystubDetail: async (paystubId: string) => {
    const response = await api.get(`/api/employee/portal/paystubs/${paystubId}`);
    return response.data;
  },

  // Tax documents
  getTaxDocuments: async () => {
    const response = await api.get('/api/employee/portal/tax');
    return response.data;
  },

  updateW4: async (data: Record<string, any>) => {
    const response = await api.put('/api/employee/portal/tax/w4', data);
    return response.data;
  },

  // Benefits
  getBenefits: async () => {
    const response = await api.get('/api/employee/portal/benefits');
    return response.data;
  },

  reportLifeEvent: async (eventType: string, eventDate: string) => {
    const response = await api.post('/api/employee/portal/benefits/life-event', {
      event_type: eventType,
      event_date: eventDate
    });
    return response.data;
  },

  // PTO
  getPTOBalance: async (): Promise<{
    success: boolean;
    balances: PTOBalance;
    accrual_rate: { vacation: number; sick: number };
    pending_requests: any[];
    approved_requests: any[];
  }> => {
    const response = await api.get('/api/employee/portal/pto/balance');
    return response.data;
  },

  requestPTO: async (data: {
    start_date: string;
    end_date: string;
    pto_type: string;
    notes?: string;
  }) => {
    const response = await api.post('/api/employee/portal/pto/request', data);
    return response.data;
  },

  getPTORequests: async () => {
    const response = await api.get('/api/employee/portal/pto/requests');
    return response.data;
  },

  // Direct deposit
  getDirectDeposit: async (): Promise<{
    success: boolean;
    accounts: DirectDepositAccount[];
  }> => {
    const response = await api.get('/api/employee/portal/direct-deposit');
    return response.data;
  },

  updateDirectDeposit: async (accounts: DirectDepositAccount[]) => {
    const response = await api.put('/api/employee/portal/direct-deposit', { accounts });
    return response.data;
  },

  // Documents
  getDocuments: async (category?: string) => {
    const response = await api.get('/api/employee/portal/documents', {
      params: { category }
    });
    return response.data;
  },

  uploadDocument: async (file: File, category: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const response = await api.post('/api/employee/portal/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/api/employee/portal/notifications');
    return response.data;
  },

  markNotificationRead: async (notificationId: string) => {
    const response = await api.put(`/api/employee/portal/notifications/${notificationId}/read`);
    return response.data;
  },

  getNotificationPreferences: async () => {
    const response = await api.get('/api/employee/portal/notifications/preferences');
    return response.data;
  },

  updateNotificationPreferences: async (preferences: Record<string, boolean>) => {
    const response = await api.put('/api/employee/portal/notifications/preferences', preferences);
    return response.data;
  },

  // ============================================================================
  // VALIDATION APIs
  // ============================================================================

  validatePassword: async (password: string) => {
    const response = await api.post('/api/employee/validate/password', { password });
    return response.data;
  },

  validateEmail: async (email: string) => {
    const response = await api.post('/api/employee/validate/email', { email });
    return response.data;
  },

  validatePhone: async (phone: string) => {
    const response = await api.post('/api/employee/validate/phone', { phone });
    return response.data;
  },

  // ============================================================================
  // LOOKUP APIs
  // ============================================================================

  getEmploymentTypes: async () => {
    const response = await api.get('/api/employee/options/employment-types');
    return response.data;
  },

  getDemographicOptions: async () => {
    const response = await api.get('/api/employee/options/demographics');
    return response.data;
  },

  getStates: async () => {
    const response = await api.get('/api/employee/options/states');
    return response.data;
  }
};

export default employeeSelfServiceAPI;
