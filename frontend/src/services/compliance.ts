/**
 * DOCUGINUITY COMPLIANCE SERVICE
 * Frontend service for document compliance management
 */

import api from './api';

// Types
export interface RequiredDocument {
  form_id: string;
  jurisdiction: string;
  name: string;
  agency: string;
  required: boolean;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  status?: string;
  due_date?: string;
  completed_date?: string;
}

export interface OnboardingChecklist {
  checklist_id: string;
  employee_id: string;
  company_id: string;
  state_code: string;
  employee_type: string;
  hire_date: string;
  created_at: string;
  status: string;
  documents: RequiredDocument[];
  completion_percentage: number;
}

export interface ComplianceStatus {
  company_id: string;
  status: 'compliant' | 'mostly_compliant' | 'non_compliant';
  total_documents: number;
  completed_documents: number;
  completion_rate: number;
  missing_documents: any[];
  expiring_documents: any[];
  upcoming_deadlines: any[];
  checked_at: string;
}

export interface FilingDeadline {
  date: string;
  forms: string[];
  days_until: number;
}

export interface FormDetails {
  form_id: string;
  jurisdiction: string;
  name: string;
  agency: string;
  description?: string;
  required_for?: string;
  frequency?: string;
  deadline?: string;
}

// Employee Documents
export const getEmployeeRequiredDocuments = async (
  state: string,
  employeeType: string = 'w2',
  isNewHire: boolean = true
) => {
  const response = await api.get('/api/compliance/employee/required-documents', {
    params: { state, employee_type: employeeType, is_new_hire: isNewHire },
  });
  return response.data.data;
};

// Onboarding Checklist
export const createOnboardingChecklist = async (data: {
  employee_id: string;
  company_id: string;
  state_code: string;
  employee_type?: string;
  hire_date?: string;
}): Promise<OnboardingChecklist> => {
  const response = await api.post('/api/compliance/onboarding/checklist', data);
  return response.data.data;
};

export const updateDocumentStatus = async (
  checklistId: string,
  formId: string,
  status: string,
  completedDate?: string
) => {
  const response = await api.put(`/api/compliance/onboarding/checklist/${checklistId}/document`, {
    form_id: formId,
    status,
    completed_date: completedDate,
  });
  return response.data.data;
};

// Company Compliance
export const getCompanyRequiredDocuments = async (
  states: string[],
  employeeCount: number,
  hasContractors: boolean = false
) => {
  const response = await api.get('/api/compliance/company/required-documents', {
    params: {
      states: states.join(','),
      employee_count: employeeCount,
      has_contractors: hasContractors,
    },
  });
  return response.data.data;
};

export const checkCompanyCompliance = async (companyId: string): Promise<ComplianceStatus> => {
  const response = await api.get(`/api/compliance/company/${companyId}/status`);
  return response.data.data;
};

// Form Library
export const getAllForms = async (): Promise<FormDetails[]> => {
  const response = await api.get('/api/compliance/forms');
  return response.data.data.forms;
};

export const getFormDetails = async (formId: string, jurisdiction: string = 'FED'): Promise<FormDetails> => {
  const response = await api.get(`/api/compliance/forms/${formId}`, {
    params: { jurisdiction },
  });
  return response.data.data;
};

export const getStateWithholdingForm = async (stateCode: string) => {
  const response = await api.get(`/api/compliance/forms/state/${stateCode}/withholding`);
  return response.data.data;
};

// Deadlines
export const getUpcomingDeadlines = async (days: number = 30): Promise<FilingDeadline[]> => {
  const response = await api.get('/api/compliance/deadlines', {
    params: { days },
  });
  return response.data.data.deadlines;
};

export const getFilingCalendar = async (year: string = '2025') => {
  const response = await api.get(`/api/compliance/calendar/${year}`);
  return response.data.data;
};

// Dashboard
export const getComplianceDashboard = async () => {
  const response = await api.get('/api/compliance/dashboard');
  return response.data.data;
};

export default {
  getEmployeeRequiredDocuments,
  createOnboardingChecklist,
  updateDocumentStatus,
  getCompanyRequiredDocuments,
  checkCompanyCompliance,
  getAllForms,
  getFormDetails,
  getStateWithholdingForm,
  getUpcomingDeadlines,
  getFilingCalendar,
  getComplianceDashboard,
};
