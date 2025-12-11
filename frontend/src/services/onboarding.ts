/**
 * ONBOARDING SERVICE
 * Frontend service for Employee Onboarding Workflows
 */

import api from './api';

// Types
export interface OnboardingWorkflow {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  position: string;
  department: string;
  start_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  tasks_completed: number;
  total_tasks: number;
  template_id: string;
  template_name: string;
  created_at: string;
  completed_at?: string;
}

export interface OnboardingTask {
  id: string;
  workflow_id: string;
  name: string;
  description: string;
  category: 'personal' | 'tax' | 'employment' | 'payment' | 'benefits' | 'policies' | 'training';
  is_required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  order: number;
  due_date?: string;
  completed_at?: string;
  assigned_to?: 'employee' | 'hr' | 'manager';
  requires_signature: boolean;
  requires_document: boolean;
  document_url?: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  employee_type: 'full_time' | 'part_time' | 'contractor' | 'intern';
  tasks: Partial<OnboardingTask>[];
  is_default: boolean;
  is_active: boolean;
}

// Workflows
export const getOnboardings = async (params?: { status?: string }) => {
  const response = await api.get('/api/onboarding', { params });
  return response.data;
};

export const getOnboarding = async (onboardingId: string) => {
  const response = await api.get(`/api/onboarding/${onboardingId}`);
  return response.data;
};

export const getOnboardingByEmployee = async (employeeId: string) => {
  const response = await api.get(`/api/onboarding/employee/${employeeId}`);
  return response.data;
};

export const createOnboarding = async (data: {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  position: string;
  department: string;
  start_date: string;
  template_id: string;
}) => {
  const response = await api.post('/api/onboarding', data);
  return response.data;
};

export const startOnboarding = async (onboardingId: string) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/start`);
  return response.data;
};

export const completeOnboarding = async (onboardingId: string) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/complete`);
  return response.data;
};

export const cancelOnboarding = async (onboardingId: string, reason: string) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/cancel`, { reason });
  return response.data;
};

// Tasks
export const getTasks = async (onboardingId: string) => {
  const response = await api.get(`/api/onboarding/${onboardingId}/tasks`);
  return response.data;
};

export const getTask = async (onboardingId: string, taskId: string) => {
  const response = await api.get(`/api/onboarding/${onboardingId}/tasks/${taskId}`);
  return response.data;
};

export const submitTask = async (onboardingId: string, taskId: string, data?: any) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/tasks/${taskId}/submit`, data);
  return response.data;
};

export const completeTask = async (onboardingId: string, taskId: string) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/tasks/${taskId}/complete`);
  return response.data;
};

export const uploadTaskDocument = async (onboardingId: string, taskId: string, file: FormData) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/tasks/${taskId}/upload`, file, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// E-Signatures
export const requestSignature = async (onboardingId: string, taskId: string) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/tasks/${taskId}/request-signature`);
  return response.data;
};

export const recordSignature = async (onboardingId: string, taskId: string, signatureData: {
  signature: string;
  ip_address?: string;
}) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/tasks/${taskId}/sign`, signatureData);
  return response.data;
};

// Templates
export const getTemplates = async () => {
  const response = await api.get('/api/onboarding/templates');
  return response.data;
};

export const getTemplate = async (templateId: string) => {
  const response = await api.get(`/api/onboarding/templates/${templateId}`);
  return response.data;
};

export const createTemplate = async (template: Partial<OnboardingTemplate>) => {
  const response = await api.post('/api/onboarding/templates', template);
  return response.data;
};

export const updateTemplate = async (templateId: string, data: Partial<OnboardingTemplate>) => {
  const response = await api.put(`/api/onboarding/templates/${templateId}`, data);
  return response.data;
};

// Reminders & Metrics
export const sendReminder = async (onboardingId: string, message?: string) => {
  const response = await api.post(`/api/onboarding/${onboardingId}/remind`, { message });
  return response.data;
};

export const getOnboardingMetrics = async () => {
  const response = await api.get('/api/onboarding/metrics');
  return response.data;
};

export const getPendingTasks = async () => {
  const response = await api.get('/api/onboarding/pending-tasks');
  return response.data;
};

export default {
  getOnboardings,
  getOnboarding,
  getOnboardingByEmployee,
  createOnboarding,
  startOnboarding,
  completeOnboarding,
  cancelOnboarding,
  getTasks,
  getTask,
  submitTask,
  completeTask,
  uploadTaskDocument,
  requestSignature,
  recordSignature,
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  sendReminder,
  getOnboardingMetrics,
  getPendingTasks,
};
