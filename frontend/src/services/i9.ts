/**
 * I-9 Employment Verification Service
 * API calls for I-9 form management
 */

import api from './api';

export type CitizenshipStatus = 'citizen' | 'noncitizen_national' | 'permanent_resident' | 'authorized_alien';

export interface I9Form {
  id: string;
  employee_id: string;
  status: 'section1_complete' | 'complete';
  section1: I9Section1;
  section2?: I9Section2;
  section1_complete: boolean;
  section2_complete: boolean;
  section2_deadline: string;
  hire_date: string;
  late_verification?: boolean;
  everify?: EVerifyCase;
  reverifications?: I9Reverification[];
  documents?: I9Document[];
}

export interface I9Section1 {
  last_name: string;
  first_name: string;
  middle_initial?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  date_of_birth: string;
  ssn?: string;
  email?: string;
  phone?: string;
  citizenship_status: CitizenshipStatus;
  uscis_number?: string;
  alien_number?: string;
  work_authorization_expiration?: string;
  i94_number?: string;
  signature: string;
  signature_date: string;
}

export interface I9Section2 {
  employer_name: string;
  employer_address: string;
  employer_city: string;
  employer_state: string;
  employer_zip: string;
  first_day_of_employment: string;
  authorized_signature: string;
  authorized_name: string;
  authorized_title: string;
  signature_date: string;
}

export interface I9Document {
  id: string;
  i9_id: string;
  document_type: string;
  document_title: string;
  issuing_authority?: string;
  document_number?: string;
  expiration_date?: string;
  list_category: 'A' | 'B' | 'C';
  verified_at: string;
  verified_by: string;
}

export interface I9Reverification {
  date: string;
  new_last_name?: string;
  rehire_date?: string;
  document_title: string;
  document_number: string;
  expiration_date: string;
  signature: string;
  signature_date: string;
  verified_by: string;
}

export interface EVerifyCase {
  case_number: string;
  submitted_at: string;
  status: 'pending' | 'authorized' | 'tentative_nonconfirmation' | 'final_nonconfirmation';
  result?: string;
  result_date?: string;
}

// Get acceptable documents list
export const getAcceptableDocuments = async () => {
  const response = await api.get('/api/i9/documents');
  return response.data;
};

// Get I-9 for employee
export const getEmployeeI9 = async (employeeId: string): Promise<{ i9: I9Form | null }> => {
  const response = await api.get(`/api/i9/employee/${employeeId}`);
  return response.data;
};

// Submit Section 1
export const submitSection1 = async (data: {
  employee_id: string;
  last_name: string;
  first_name: string;
  middle_initial?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth: string;
  ssn?: string;
  email?: string;
  phone?: string;
  citizenship_status: CitizenshipStatus;
  uscis_number?: string;
  alien_number?: string;
  work_authorization_expiration?: string;
  i94_number?: string;
  signature: string;
  hire_date?: string;
}): Promise<{ i9: I9Form }> => {
  const response = await api.post('/api/i9/section1', data);
  return response.data;
};

// Submit Section 2
export const submitSection2 = async (i9Id: string, data: {
  documents: Array<{
    document_type: string;
    document_title: string;
    issuing_authority?: string;
    document_number?: string;
    expiration_date?: string;
    list_category: 'A' | 'B' | 'C';
  }>;
  employer_name?: string;
  employer_address?: string;
  employer_city?: string;
  employer_state?: string;
  employer_zip?: string;
  first_day_of_employment?: string;
  authorized_signature: string;
  authorized_name: string;
  authorized_title: string;
}): Promise<{ i9: I9Form }> => {
  const response = await api.post(`/api/i9/${i9Id}/section2`, data);
  return response.data;
};

// Reverify I-9
export const reverifyI9 = async (i9Id: string, data: {
  new_last_name?: string;
  rehire_date?: string;
  document_title: string;
  document_number: string;
  expiration_date: string;
  signature: string;
}): Promise<{ i9: I9Form }> => {
  const response = await api.post(`/api/i9/${i9Id}/reverify`, data);
  return response.data;
};

// Get expiring authorizations
export const getExpiringAuthorizations = async (days: number = 90): Promise<{
  expiring_authorizations: Array<{
    i9_id: string;
    employee_id: string;
    employee_name: string;
    expiration_date: string;
    days_until_expiration: number;
    status: 'expired' | 'expiring_soon';
  }>;
}> => {
  const response = await api.get(`/api/i9/expiring?days=${days}`);
  return response.data;
};

// Get pending Section 2
export const getPendingSection2 = async (): Promise<{
  pending_section2: Array<{
    i9_id: string;
    employee_id: string;
    employee_name: string;
    hire_date: string;
    deadline: string;
    days_remaining: number;
    overdue: boolean;
  }>;
}> => {
  const response = await api.get('/api/i9/pending-section2');
  return response.data;
};

// Submit to E-Verify
export const submitEVerify = async (i9Id: string): Promise<{ everify_case: EVerifyCase }> => {
  const response = await api.post(`/api/i9/${i9Id}/everify`);
  return response.data;
};

// Get E-Verify status
export const getEVerifyStatus = async (i9Id: string): Promise<{ everify_case: EVerifyCase }> => {
  const response = await api.get(`/api/i9/${i9Id}/everify/status`);
  return response.data;
};

// Generate audit report
export const generateAuditReport = async (): Promise<{
  report: {
    total_i9s: number;
    complete: number;
    incomplete: number;
    late_verifications: number;
    everify_submitted: number;
    everify_authorized: number;
    expiring_in_30_days: number;
    compliance_rate: number;
  };
}> => {
  const response = await api.get('/api/i9/audit-report');
  return response.data;
};

export default {
  getAcceptableDocuments,
  getEmployeeI9,
  submitSection1,
  submitSection2,
  reverifyI9,
  getExpiringAuthorizations,
  getPendingSection2,
  submitEVerify,
  getEVerifyStatus,
  generateAuditReport,
};
