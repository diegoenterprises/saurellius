/**
 * Termination Service
 * API calls for employee termination processing
 */

import api from './api';

export interface TerminationData {
  id: string;
  employee_id: string;
  termination_date: string;
  termination_type: 'voluntary' | 'involuntary' | 'retirement';
  reason: string;
  reason_details?: string;
  last_work_date: string;
  final_pay_date?: string;
  pto_payout_hours: number;
  severance_amount?: number;
  severance_weeks?: number;
  cobra_offered: boolean;
  status: 'pending' | 'completed';
  checklist: TerminationChecklist;
  created_at: string;
}

export interface TerminationChecklist {
  final_pay_calculated: boolean;
  benefits_terminated: boolean;
  cobra_notice_sent: boolean;
  equipment_collected: boolean;
  access_revoked: boolean;
  exit_interview_completed: boolean;
  documentation_filed: boolean;
}

export interface FinalPayCalculation {
  employee_id: string;
  termination_date: string;
  termination_type: string;
  work_state: string;
  final_pay_due_date: string;
  state_rule: string;
  pto_payout_required: boolean;
  breakdown: {
    regular_pay: number;
    pto_payout: number;
    pto_hours: number;
    expense_reimbursements: number;
    gross_pay: number;
    federal_tax: number;
    state_tax: number;
    fica: number;
    total_taxes: number;
    deductions: number;
    garnishments: number;
    net_pay: number;
  };
  cobra_required: boolean;
  notes: string[];
}

export interface StateRules {
  state: string;
  rules: {
    involuntary: string;
    voluntary: string;
    pto_payout: boolean;
  };
}

// State Rules
export const getStateRules = async (state: string): Promise<StateRules> => {
  const response = await api.get(`/api/terminations/state-rules/${state}`);
  return response.data;
};

// Calculate Final Pay
export const calculateFinalPay = async (data: {
  employee_id: string;
  termination_date: string;
  termination_type: 'voluntary' | 'involuntary' | 'retirement';
  work_state: string;
  regular_pay?: number;
  pto_hours_remaining?: number;
  hourly_rate?: number;
  expense_reimbursements?: number;
  outstanding_garnishments?: number;
  final_deductions?: number;
}): Promise<FinalPayCalculation> => {
  const response = await api.post('/api/terminations/calculate', data);
  return response.data;
};

// Process Termination
export const processTermination = async (data: {
  employee_id: string;
  termination_date: string;
  termination_type: 'voluntary' | 'involuntary' | 'retirement';
  reason: string;
  reason_details?: string;
  last_work_date?: string;
  final_pay_date?: string;
  pto_payout_hours?: number;
  severance_amount?: number;
  severance_weeks?: number;
  cobra_offered?: boolean;
  exit_interview_scheduled?: boolean;
  equipment_returned?: boolean;
  access_revoked?: boolean;
  created_by?: string;
}): Promise<{ termination: TerminationData; message: string }> => {
  const response = await api.post('/api/terminations/', data);
  return response.data;
};

// Get Terminations
export const getTerminations = async (status?: string, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const response = await api.get(`/api/terminations/?${params.toString()}`);
  return response.data;
};

// Get Single Termination
export const getTermination = async (termId: string): Promise<TerminationData> => {
  const response = await api.get(`/api/terminations/${termId}`);
  return response.data;
};

// Update Checklist
export const updateChecklist = async (termId: string, checklistUpdates: Partial<TerminationChecklist>) => {
  const response = await api.put(`/api/terminations/${termId}/checklist`, checklistUpdates);
  return response.data;
};

// Complete Termination
export const completeTermination = async (termId: string) => {
  const response = await api.post(`/api/terminations/${termId}/complete`);
  return response.data;
};

export default {
  getStateRules,
  calculateFinalPay,
  processTermination,
  getTerminations,
  getTermination,
  updateChecklist,
  completeTermination,
};
