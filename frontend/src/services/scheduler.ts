/**
 * TAX UPDATE SCHEDULER SERVICE
 * Frontend service for accessing real-time tax rates and compliance deadlines
 */

import api from './api';

// Types
export interface SchedulerStatus {
  scheduler_running: boolean;
  last_update_check: string | null;
  current_tax_year: number;
  current_federal_rates: {
    social_security_wage_base: number;
    medicare_rate: number;
  };
  pending_updates: number;
  upcoming_deadlines: number;
  jobs: Array<{
    id: string;
    name: string;
    next_run: string;
  }>;
}

export interface FederalRates {
  social_security: {
    rate: number;
    wage_base: number;
  };
  medicare: {
    rate: number;
    additional_rate: number;
    additional_threshold: number;
  };
  futa: {
    rate: number;
    wage_base: number;
  };
  standard_deductions: {
    single: number;
    married_filing_jointly: number;
    married_filing_separately: number;
    head_of_household: number;
  };
  tax_brackets: {
    [filing_status: string]: Array<{
      threshold: number;
      rate: number;
    }>;
  };
}

export interface StateRates {
  state: string;
  as_of_date: string;
  rates: {
    [key: string]: number;
  };
  minimum_wage: number;
}

export interface PendingUpdate {
  type: 'federal' | 'state' | 'minimum_wage';
  effective_date: string;
  state?: string;
  year?: number;
  changes?: Record<string, number>;
  rate?: number;
}

export interface Deadline {
  form: string;
  quarter: string;
  deadline: string;
  description: string;
}

export interface TaxYearInfo {
  tax_year: number;
  key_dates: Record<string, string>;
  social_security_wage_base: number;
  standard_deductions: Record<string, number>;
  bracket_count: number;
}

// Get scheduler status
export const getSchedulerStatus = async (): Promise<SchedulerStatus> => {
  const response = await api.get('/api/scheduler/status');
  return response.data.data;
};

// Get current federal rates
export const getCurrentFederalRates = async (asOf?: string): Promise<FederalRates> => {
  const response = await api.get('/api/scheduler/current-rates', {
    params: asOf ? { as_of: asOf } : undefined,
  });
  return response.data.federal_rates;
};

// Get current state rates
export const getCurrentStateRates = async (stateCode: string, asOf?: string): Promise<StateRates> => {
  const response = await api.get(`/api/scheduler/current-rates/state/${stateCode}`, {
    params: asOf ? { as_of: asOf } : undefined,
  });
  return response.data;
};

// Get pending rate updates
export const getPendingUpdates = async (): Promise<PendingUpdate[]> => {
  const response = await api.get('/api/scheduler/pending-updates');
  return response.data.pending_updates;
};

// Get upcoming compliance deadlines
export const getUpcomingDeadlines = async (days: number = 30): Promise<Deadline[]> => {
  const response = await api.get('/api/scheduler/deadlines', {
    params: { days },
  });
  return response.data.deadlines;
};

// Get minimum wage for a state
export const getMinimumWage = async (stateCode: string, asOf?: string): Promise<{
  state: string;
  minimum_wage: number;
  federal_minimum: number;
}> => {
  const response = await api.get(`/api/scheduler/minimum-wage/${stateCode}`, {
    params: asOf ? { as_of: asOf } : undefined,
  });
  return response.data;
};

// Get tax year info
export const getTaxYearInfo = async (year: number): Promise<TaxYearInfo> => {
  const response = await api.get(`/api/scheduler/tax-year/${year}`);
  return response.data;
};

// Get full tax calendar
export const getTaxCalendar = async (year: number): Promise<{
  tax_year: number;
  deadline_count: number;
  calendar: Deadline[];
}> => {
  const response = await api.get(`/api/scheduler/calendar/${year}`);
  return response.data;
};

// Manually trigger update check (admin)
export const triggerUpdateCheck = async () => {
  const response = await api.post('/api/scheduler/check-updates');
  return response.data;
};

export default {
  getSchedulerStatus,
  getCurrentFederalRates,
  getCurrentStateRates,
  getPendingUpdates,
  getUpcomingDeadlines,
  getMinimumWage,
  getTaxYearInfo,
  getTaxCalendar,
  triggerUpdateCheck,
};
