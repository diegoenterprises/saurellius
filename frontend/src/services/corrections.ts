/**
 * Payroll Corrections Service
 * API calls for overpayments, underpayments, and retroactive adjustments
 */

import api from './api';

export type CorrectionType = 'overpayment' | 'underpayment' | 'retroactive_raise' | 'tax_correction' | 'deduction_correction' | 'bonus_adjustment';
export type CorrectionStatus = 'draft' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'cancelled';

export interface Correction {
  id: string;
  correction_type: CorrectionType;
  employee_id: string;
  status: CorrectionStatus;
  created_at: string;
  created_by: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  processed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface OverpaymentCorrection extends Correction {
  correction_type: 'overpayment';
  original_payroll_id: string;
  original_pay_date?: string;
  reason: string;
  reason_details?: string;
  gross_overpayment: number;
  tax_adjustments: {
    federal_over_withheld: number;
    state_over_withheld: number;
    fica_over_withheld: number;
  };
  net_overpayment: number;
  recovery_options: RecoveryOption[];
  selected_recovery: string;
  employee_consent: boolean;
  consent_date?: string;
}

export interface UnderpaymentCorrection extends Correction {
  correction_type: 'underpayment';
  original_payroll_id: string;
  original_pay_date?: string;
  reason: string;
  reason_details?: string;
  gross_underpayment: number;
  tax_calculations: {
    federal_tax: number;
    state_tax: number;
    fica: number;
  };
  net_payment_due: number;
  payment_method: 'next_payroll' | 'separate_check';
  separate_check: boolean;
}

export interface RetroactiveRaiseCorrection extends Correction {
  correction_type: 'retroactive_raise';
  effective_date: string;
  old_rate: number;
  new_rate: number;
  rate_difference: number;
  hours_affected: number;
  gross_retro_pay: number;
  tax_calculations: {
    federal_tax: number;
    state_tax: number;
    fica: number;
  };
  net_retro_pay: number;
  affected_pay_periods: string[];
}

export interface TaxCorrection extends Correction {
  correction_type: 'tax_correction';
  tax_year: number;
  correction_reason: string;
  original_values: {
    box_1: number;
    box_2: number;
    box_3: number;
    box_4: number;
    box_5: number;
    box_6: number;
  };
  corrected_values: {
    box_1: number;
    box_2: number;
    box_3: number;
    box_4: number;
    box_5: number;
    box_6: number;
  };
  w2c_required: boolean;
}

export interface RecoveryOption {
  type: string;
  description: string;
  amount_per_pay: number;
  num_payments: number;
}

// Get Corrections
export const getCorrections = async (status?: CorrectionStatus, type?: CorrectionType, employeeId?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  if (employeeId) params.append('employee_id', employeeId);
  
  const response = await api.get(`/api/payroll-corrections/?${params.toString()}`);
  return response.data;
};

// Get Single Correction
export const getCorrection = async (correctionId: string) => {
  const response = await api.get(`/api/payroll-corrections/${correctionId}`);
  return response.data;
};

// Create Overpayment
export const createOverpayment = async (data: {
  employee_id: string;
  original_payroll_id: string;
  original_pay_date?: string;
  overpayment_amount: number;
  reason: string;
  reason_details?: string;
  recovery_method?: string;
  employee_consent?: boolean;
  consent_date?: string;
  created_by?: string;
}): Promise<{ correction: OverpaymentCorrection }> => {
  const response = await api.post('/api/payroll-corrections/overpayment', data);
  return response.data;
};

// Create Underpayment
export const createUnderpayment = async (data: {
  employee_id: string;
  original_payroll_id: string;
  original_pay_date?: string;
  underpayment_amount: number;
  reason: string;
  reason_details?: string;
  payment_method?: 'next_payroll' | 'separate_check';
  separate_check?: boolean;
  created_by?: string;
}): Promise<{ correction: UnderpaymentCorrection }> => {
  const response = await api.post('/api/payroll-corrections/underpayment', data);
  return response.data;
};

// Create Retroactive Raise
export const createRetroactiveRaise = async (data: {
  employee_id: string;
  effective_date: string;
  old_rate: number;
  new_rate: number;
  hours_affected?: number;
  created_by?: string;
}): Promise<{ correction: RetroactiveRaiseCorrection }> => {
  const response = await api.post('/api/payroll-corrections/retroactive-raise', data);
  return response.data;
};

// Create Tax Correction
export const createTaxCorrection = async (data: {
  employee_id: string;
  tax_year: number;
  correction_reason: string;
  original_box_1?: number;
  original_box_2?: number;
  original_box_3?: number;
  original_box_4?: number;
  original_box_5?: number;
  original_box_6?: number;
  corrected_box_1?: number;
  corrected_box_2?: number;
  corrected_box_3?: number;
  corrected_box_4?: number;
  corrected_box_5?: number;
  corrected_box_6?: number;
  created_by?: string;
}): Promise<{ correction: TaxCorrection }> => {
  const response = await api.post('/api/payroll-corrections/tax-correction', data);
  return response.data;
};

// Submit for Approval
export const submitCorrection = async (correctionId: string) => {
  const response = await api.post(`/api/payroll-corrections/${correctionId}/submit`);
  return response.data;
};

// Approve Correction
export const approveCorrection = async (correctionId: string, approvedBy?: string) => {
  const response = await api.post(`/api/payroll-corrections/${correctionId}/approve`, { approved_by: approvedBy });
  return response.data;
};

// Process Correction
export const processCorrection = async (correctionId: string) => {
  const response = await api.post(`/api/payroll-corrections/${correctionId}/process`);
  return response.data;
};

// Cancel Correction
export const cancelCorrection = async (correctionId: string, reason?: string) => {
  const response = await api.post(`/api/payroll-corrections/${correctionId}/cancel`, { reason });
  return response.data;
};

export default {
  getCorrections,
  getCorrection,
  createOverpayment,
  createUnderpayment,
  createRetroactiveRaise,
  createTaxCorrection,
  submitCorrection,
  approveCorrection,
  processCorrection,
  cancelCorrection,
};
