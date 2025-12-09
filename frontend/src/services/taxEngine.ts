/**
 * 🏛️ TAX ENGINE API SERVICE
 * Frontend service for Saurellius Tax Engine Open API
 * Enterprise-grade payroll tax calculations
 */

import api from './api';

// Types
export interface TaxCalculationRequest {
  gross_pay: number;
  filing_status: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
  pay_frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  work_state: string;
  home_state?: string;
  ytd_gross?: number;
  ytd_social_security?: number;
  pre_tax_deductions?: {
    '401k'?: number;
    health_insurance?: number;
    hsa?: number;
    fsa?: number;
    [key: string]: number | undefined;
  };
  w4_data?: {
    additional_withholding?: number;
    allowances?: number;
  };
}

export interface TaxCalculationResult {
  calculation_id: string;
  timestamp: string;
  processing_time_ms: number;
  input: {
    gross_pay: number;
    filing_status: string;
    pay_frequency: string;
    work_state: string;
  };
  taxes: {
    federal: {
      withholding: number;
      social_security: number;
      medicare: number;
    };
    state: {
      withholding: number;
      state_code: string;
    };
    employer: {
      social_security: number;
      medicare: number;
      futa: number;
      suta: number;
      total: number;
    };
  };
  summary: {
    gross_pay: number;
    pre_tax_deductions: number;
    taxable_income: number;
    total_taxes: number;
    net_pay: number;
    effective_tax_rate: number;
  };
}

export interface TaxRates {
  federal: {
    brackets: any;
    fica: any;
    standard_deductions: any;
  };
  state: {
    code: string;
    income_tax: any;
    suta: any;
  };
  effective_date: string;
}

export interface W4CalculationRequest {
  annual_income: number;
  filing_status: string;
  dependents?: number;
  other_income?: number;
  deductions?: number;
  tax_credits?: number;
}

// Calculate taxes for a single employee
export const calculateTaxes = async (data: TaxCalculationRequest): Promise<TaxCalculationResult> => {
  const response = await api.post('/api/v1/tax-engine/calculate', data);
  return response.data.data;
};

// Calculate taxes for batch of employees
export const calculateBatch = async (employees: TaxCalculationRequest[]) => {
  const response = await api.post('/api/v1/tax-engine/batch', { employees });
  return response.data.data;
};

// Get tax rates for a state
export const getTaxRates = async (stateCode: string, effectiveDate?: string): Promise<TaxRates> => {
  const params: any = { state: stateCode };
  if (effectiveDate) params.effective_date = effectiveDate;
  
  const response = await api.get('/api/v1/tax-engine/rates', { params });
  return response.data.data;
};

// Get federal tax rates
export const getFederalRates = async () => {
  const response = await api.get('/api/v1/tax-engine/rates/federal');
  return response.data.data;
};

// Get state-specific tax rates
export const getStateRates = async (stateCode: string) => {
  const response = await api.get(`/api/v1/tax-engine/rates/state/${stateCode}`);
  return response.data.data;
};

// List all available tax jurisdictions
export const listJurisdictions = async () => {
  const response = await api.get('/api/v1/tax-engine/jurisdictions');
  return response.data.data;
};

// Calculate W-4 recommendations
export const calculateW4 = async (data: W4CalculationRequest) => {
  const response = await api.post('/api/v1/tax-engine/w4/calculate', data);
  return response.data.data;
};

// Get API usage statistics
export const getUsage = async () => {
  const response = await api.get('/api/v1/tax-engine/usage');
  return response.data.data;
};

// Get API info
export const getApiInfo = async () => {
  const response = await api.get('/api/v1/tax-engine');
  return response.data;
};

export default {
  calculateTaxes,
  calculateBatch,
  getTaxRates,
  getFederalRates,
  getStateRates,
  listJurisdictions,
  calculateW4,
  getUsage,
  getApiInfo,
};
