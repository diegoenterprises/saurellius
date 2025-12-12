/**
 * GARNISHMENT SERVICE
 * Frontend service for wage garnishment management
 */

import api from './api';

// Types
export interface Garnishment {
  id: number;
  employee_id: number;
  employee_name: string;
  type: GarnishmentType;
  case_number: string;
  issuing_agency: string;
  amount_type: 'fixed' | 'percentage';
  amount: number;
  max_percentage: number;
  priority: number;
  start_date: string;
  end_date?: string;
  total_owed: number;
  total_paid: number;
  remaining_balance: number;
  status: 'active' | 'completed' | 'suspended' | 'terminated';
  notes?: string;
  created_at: string;
}

export type GarnishmentType = 
  | 'child_support'
  | 'alimony'
  | 'tax_levy_federal'
  | 'tax_levy_state'
  | 'student_loan'
  | 'creditor'
  | 'bankruptcy'
  | 'other';

export interface CreateGarnishmentData {
  employee_id: number;
  type: GarnishmentType;
  case_number: string;
  issuing_agency: string;
  amount_type: 'fixed' | 'percentage';
  amount: number;
  max_percentage?: number;
  start_date: string;
  end_date?: string;
  total_owed: number;
  notes?: string;
}

export interface GarnishmentPayment {
  id: number;
  garnishment_id: number;
  pay_date: string;
  amount: number;
  paystub_id: number;
}

export interface GarnishmentCalculation {
  employee_id: number;
  gross_pay: number;
  disposable_income: number;
  garnishments: Array<{
    garnishment_id: number;
    type: GarnishmentType;
    calculated_amount: number;
    max_allowed: number;
    actual_deduction: number;
  }>;
  total_garnishment: number;
  net_after_garnishment: number;
}

// Get all garnishments
export const getGarnishments = async (employeeId?: number): Promise<Garnishment[]> => {
  const response = await api.get('/api/garnishments', {
    params: employeeId ? { employee_id: employeeId } : undefined,
  });
  return response.data.data;
};

// Get garnishment by ID
export const getGarnishmentById = async (id: number): Promise<Garnishment> => {
  const response = await api.get(`/api/garnishments/${id}`);
  return response.data.data;
};

// Create garnishment
export const createGarnishment = async (data: CreateGarnishmentData): Promise<Garnishment> => {
  const response = await api.post('/api/garnishments', data);
  return response.data.data;
};

// Update garnishment
export const updateGarnishment = async (id: number, data: Partial<CreateGarnishmentData>): Promise<Garnishment> => {
  const response = await api.put(`/api/garnishments/${id}`, data);
  return response.data.data;
};

// Delete garnishment
export const deleteGarnishment = async (id: number): Promise<void> => {
  await api.delete(`/api/garnishments/${id}`);
};

// Suspend garnishment
export const suspendGarnishment = async (id: number, reason: string): Promise<Garnishment> => {
  const response = await api.post(`/api/garnishments/${id}/suspend`, { reason });
  return response.data.data;
};

// Resume garnishment
export const resumeGarnishment = async (id: number): Promise<Garnishment> => {
  const response = await api.post(`/api/garnishments/${id}/resume`);
  return response.data.data;
};

// Terminate garnishment
export const terminateGarnishment = async (id: number, reason: string): Promise<Garnishment> => {
  const response = await api.post(`/api/garnishments/${id}/terminate`, { reason });
  return response.data.data;
};

// Get payment history
export const getPaymentHistory = async (garnishmentId: number): Promise<GarnishmentPayment[]> => {
  const response = await api.get(`/api/garnishments/${garnishmentId}/payments`);
  return response.data.data;
};

// Calculate garnishments for payroll
export const calculateGarnishments = async (employeeId: number, grossPay: number): Promise<GarnishmentCalculation> => {
  const response = await api.post('/api/garnishments/calculate', {
    employee_id: employeeId,
    gross_pay: grossPay,
  });
  return response.data.data;
};

// Get garnishment types
export const getGarnishmentTypes = (): Array<{ value: GarnishmentType; label: string }> => {
  return [
    { value: 'child_support', label: 'Child Support' },
    { value: 'alimony', label: 'Alimony/Spousal Support' },
    { value: 'tax_levy_federal', label: 'Federal Tax Levy' },
    { value: 'tax_levy_state', label: 'State Tax Levy' },
    { value: 'student_loan', label: 'Student Loan' },
    { value: 'creditor', label: 'Creditor Garnishment' },
    { value: 'bankruptcy', label: 'Bankruptcy' },
    { value: 'other', label: 'Other' },
  ];
};

// Get priority order info
export const getPriorityOrder = (): string[] => {
  return [
    '1. Child Support',
    '2. Federal Tax Levies',
    '3. State Tax Levies',
    '4. Alimony',
    '5. Student Loans',
    '6. Creditor Garnishments',
    '7. Other',
  ];
};

export default {
  getGarnishments,
  getGarnishmentById,
  createGarnishment,
  updateGarnishment,
  deleteGarnishment,
  suspendGarnishment,
  resumeGarnishment,
  terminateGarnishment,
  getPaymentHistory,
  calculateGarnishments,
  getGarnishmentTypes,
  getPriorityOrder,
};
