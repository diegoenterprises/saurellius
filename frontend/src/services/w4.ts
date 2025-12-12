/**
 * W-4 Tax Withholding Service
 * API calls for W-4 and state withholding forms
 */

import api from './api';

export type FilingStatus = 'single' | 'married_jointly' | 'married_separately' | 'head_of_household' | 'qualifying_surviving_spouse';

export interface W4Form {
  id: string;
  employee_id: string;
  tax_year: number;
  status: 'active' | 'superseded';
  filing_status: FilingStatus;
  step2_checkbox: boolean;
  step2_additional: number;
  qualifying_children: number;
  other_dependents: number;
  step3_total: number;
  other_income: number;
  deductions: number;
  extra_withholding: number;
  claim_exempt: boolean;
  exempt_expiration?: string;
  submitted_at: string;
  effective_date: string;
  signature: string;
  signature_date: string;
}

export interface StateWithholdingForm {
  id: string;
  employee_id: string;
  state: string;
  form_name: string;
  status: 'active' | 'superseded';
  filing_status: string;
  allowances: number;
  additional_withholding: number;
  claim_exempt: boolean;
  nyc_resident?: boolean;
  yonkers_resident?: boolean;
  local_tax_jurisdiction?: string;
  submitted_at: string;
  effective_date: string;
}

export interface WithholdingCalculation {
  gross_pay: number;
  pre_tax_deductions: number;
  taxable_pay: number;
  annual_wages: number;
  federal_withholding: number;
  extra_withholding: number;
  total_withholding: number;
  exempt: boolean;
}

// Get current W-4 for employee
export const getEmployeeW4 = async (employeeId: string): Promise<{ w4: W4Form | null }> => {
  const response = await api.get(`/api/w4/employee/${employeeId}`);
  return response.data;
};

// Get W-4 history for employee
export const getW4History = async (employeeId: string): Promise<{ history: W4Form[] }> => {
  const response = await api.get(`/api/w4/employee/${employeeId}/history`);
  return response.data;
};

// Submit new W-4
export const submitW4 = async (data: {
  employee_id: string;
  filing_status: FilingStatus;
  step2_checkbox?: boolean;
  step2_additional?: number;
  qualifying_children?: number;
  other_dependents?: number;
  other_income?: number;
  deductions?: number;
  extra_withholding?: number;
  claim_exempt?: boolean;
  signature: string;
  effective_date?: string;
}): Promise<{ w4: W4Form }> => {
  const response = await api.post('/api/w4', data);
  return response.data;
};

// Calculate withholding
export const calculateWithholding = async (data: {
  gross_pay: number;
  pay_frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  filing_status: FilingStatus;
  pre_tax_deductions?: number;
  qualifying_children?: number;
  other_dependents?: number;
  other_income?: number;
  deductions?: number;
  extra_withholding?: number;
  claim_exempt?: boolean;
}): Promise<{ calculation: WithholdingCalculation }> => {
  const response = await api.post('/api/w4/calculate-withholding', data);
  return response.data;
};

// Validate exempt status
export const validateExempt = async (employeeId: string): Promise<{
  exempt: boolean;
  expired?: boolean;
  expiration?: string;
}> => {
  const response = await api.post('/api/w4/validate-exempt', { employee_id: employeeId });
  return response.data;
};

// Get state form template
export const getStateFormTemplate = async (state: string): Promise<{
  state: string;
  template: {
    form_name: string;
    has_allowances?: boolean;
    has_additional?: boolean;
    has_nyc_tax?: boolean;
    has_yonkers_tax?: boolean;
    flat_rate?: number;
    has_local_taxes?: boolean;
    no_state_tax?: boolean;
  };
}> => {
  const response = await api.get(`/api/w4/state/${state}`);
  return response.data;
};

// Submit state withholding form
export const submitStateWithholding = async (data: {
  employee_id: string;
  state: string;
  filing_status?: string;
  allowances?: number;
  additional_withholding?: number;
  claim_exempt?: boolean;
  nyc_resident?: boolean;
  yonkers_resident?: boolean;
  local_tax_jurisdiction?: string;
  effective_date?: string;
}): Promise<{ state_form: StateWithholdingForm }> => {
  const response = await api.post('/api/w4/state', data);
  return response.data;
};

// Get employee state forms
export const getEmployeeStateForms = async (employeeId: string): Promise<{ state_forms: StateWithholdingForm[] }> => {
  const response = await api.get(`/api/w4/state/employee/${employeeId}`);
  return response.data;
};

// Check state reciprocity
export const checkReciprocity = async (homeState: string, workState: string): Promise<{
  reciprocity: boolean;
  home_state: string;
  work_state: string;
  withhold_state?: string;
  message: string;
}> => {
  const response = await api.post('/api/w4/reciprocity', {
    home_state: homeState,
    work_state: workState,
  });
  return response.data;
};

// Calculate state withholding
export const calculateStateWithholding = async (data: {
  state: string;
  gross_pay: number;
  pay_frequency: string;
  filing_status?: string;
  allowances?: number;
  additional_withholding?: number;
  pre_tax_deductions?: number;
}): Promise<{
  state: string;
  taxable_wages: number;
  withholding: number;
  method: string;
}> => {
  const response = await api.post('/api/w4/calculate-state', data);
  return response.data;
};

export default {
  getEmployeeW4,
  getW4History,
  submitW4,
  calculateWithholding,
  validateExempt,
  getStateFormTemplate,
  submitStateWithholding,
  getEmployeeStateForms,
  checkReciprocity,
  calculateStateWithholding,
};
