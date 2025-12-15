/**
 * REGULATORY FORMS SERVICE
 * Access and download IRS and government forms
 * I-9, W-4, W-9, W-2, 1099-NEC, 941, 940, SS-4, etc.
 */

import api from './api';

export interface RegulatoryForm {
  id: string;
  name: string;
  full_name: string;
  description: string;
  category: string;
  source: string;
  required_for: string[];
  frequency?: string;
  deadline?: string;
  deadlines?: string[];
  available: boolean;
  file_size?: number;
}

export interface FormCategory {
  name: string;
  description: string;
  forms_count: number;
}

export interface FormDeadline {
  form_id: string;
  form_name: string;
  deadline: string;
  description: string;
}

/**
 * List all available regulatory forms
 * @param category - Filter by category (optional)
 * @param userType - Filter by user type: employee, employer, contractor (optional)
 */
export const listForms = async (
  category?: string,
  userType?: string
): Promise<{ forms: RegulatoryForm[]; categories: string[]; total: number }> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (userType) params.append('user_type', userType);
  
  const response = await api.get(`/api/forms/list?${params.toString()}`);
  return response.data;
};

/**
 * Get detailed information about a specific form
 * @param formId - The form identifier (e.g., 'w-4', 'i-9', '1099-nec')
 */
export const getFormInfo = async (formId: string): Promise<RegulatoryForm> => {
  const response = await api.get(`/api/forms/info/${formId}`);
  return response.data.form;
};

/**
 * Download a regulatory form PDF
 * @param formId - The form identifier
 */
export const downloadForm = async (formId: string): Promise<Blob> => {
  const response = await api.get(`/api/forms/download/${formId}`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Download and save a form to the user's device
 * @param formId - The form identifier
 * @param formName - The display name for the file
 */
export const downloadAndSaveForm = async (formId: string, formName: string): Promise<void> => {
  const blob = await downloadForm(formId);
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${formName.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get all form categories with descriptions
 */
export const getCategories = async (): Promise<Record<string, FormCategory>> => {
  const response = await api.get('/api/forms/categories');
  return response.data.categories;
};

/**
 * Get upcoming filing deadlines
 */
export const getUpcomingDeadlines = async (): Promise<FormDeadline[]> => {
  const response = await api.get('/api/forms/deadlines');
  return response.data.deadlines;
};

/**
 * Get forms required for a specific user type
 * @param userType - 'employee', 'employer', or 'contractor'
 */
export const getFormsForUserType = async (userType: 'employee' | 'employer' | 'contractor'): Promise<RegulatoryForm[]> => {
  const response = await listForms(undefined, userType);
  return response.forms;
};

/**
 * Get forms by category
 * @param category - The category to filter by
 */
export const getFormsByCategory = async (category: string): Promise<RegulatoryForm[]> => {
  const response = await listForms(category);
  return response.forms;
};

// Form category constants
export const FORM_CATEGORIES = {
  EMPLOYMENT: 'employment',
  TAX_WITHHOLDING: 'tax_withholding',
  CONTRACTOR: 'contractor',
  WAGE_REPORTING: 'wage_reporting',
  EMPLOYER_TAX: 'employer_tax',
  BUSINESS_REGISTRATION: 'business_registration',
  TAX_CREDIT: 'tax_credit',
  INTERNATIONAL: 'international',
};

// Common form IDs
export const FORM_IDS = {
  I9: 'i-9',
  I9_INSTRUCTIONS: 'i-9-instructions',
  W4: 'w-4',
  W4P: 'w-4p',
  W9: 'w-9',
  W2: 'w-2',
  F1099_NEC: '1099-nec',
  F1099_MISC: '1099-misc',
  F941: '941',
  F940: '940',
  SS4: 'ss-4',
  F8850: '8850',
  F8233: '8233',
};

export default {
  listForms,
  getFormInfo,
  downloadForm,
  downloadAndSaveForm,
  getCategories,
  getUpcomingDeadlines,
  getFormsForUserType,
  getFormsByCategory,
  FORM_CATEGORIES,
  FORM_IDS,
};
