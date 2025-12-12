/**
 * Audit Trail Service
 * API calls for audit logs, approvals, and compliance
 */

import api from './api';

export type AuditCategory = 'EMPLOYEE' | 'PAYROLL' | 'TAX' | 'DIRECT_DEPOSIT' | 'GARNISHMENT' | 'BENEFITS' | 'TIME' | 'COMPENSATION' | 'SECURITY' | 'SYSTEM';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AuditLog {
  id: string;
  timestamp: string;
  category: AuditCategory;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  changes: Change[];
  metadata?: Record<string, any>;
  ip_address?: string;
}

export interface Change {
  field: string;
  old_value: string | number | null;
  new_value: string | number;
}

export interface Approval {
  id: string;
  request_type: string;
  entity_type: string;
  entity_id: string;
  description?: string;
  amount?: number;
  requested_by: string;
  requested_at: string;
  approvers: string[];
  required_approvals: number;
  current_approvals: ApprovalAction[];
  status: ApprovalStatus;
  notes: string[];
  metadata?: Record<string, any>;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export interface ApprovalAction {
  user_id: string;
  approved_at: string;
  notes?: string;
}

export interface ComplianceReport {
  period: { start: string; end: string };
  generated_at: string;
  summary: {
    total_changes: number;
    unique_users: number;
    days_with_activity: number;
  };
  changes_by_category: Record<string, number>;
  changes_by_user: Record<string, number>;
  changes_by_day: Record<string, number>;
  approvals: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approval_rate: number;
  };
  security: {
    total_events: number;
    failed_logins: number;
  };
}

// Add audit log
export const addAuditLog = async (data: {
  category: AuditCategory;
  action: string;
  entity_type: string;
  entity_id: string;
  changes?: Change[];
  metadata?: Record<string, any>;
}): Promise<{ audit_log: AuditLog }> => {
  const response = await api.post('/api/audit/log', data);
  return response.data;
};

// Get audit logs
export const getAuditLogs = async (params?: {
  category?: AuditCategory;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.action) queryParams.append('action', params.action);
  if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
  if (params?.entity_id) queryParams.append('entity_id', params.entity_id);
  if (params?.user_id) queryParams.append('user_id', params.user_id);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  
  const response = await api.get(`/api/audit/logs?${queryParams.toString()}`);
  return response.data;
};

// Get entity history
export const getEntityHistory = async (entityType: string, entityId: string): Promise<{
  entity_type: string;
  entity_id: string;
  history: AuditLog[];
  total_changes: number;
}> => {
  const response = await api.get(`/api/audit/entity/${entityType}/${entityId}`);
  return response.data;
};

// Create approval request
export const createApprovalRequest = async (data: {
  request_type: string;
  entity_type: string;
  entity_id: string;
  description?: string;
  amount?: number;
  approvers?: string[];
  required_approvals?: number;
  metadata?: Record<string, any>;
}): Promise<{ approval: Approval }> => {
  const response = await api.post('/api/audit/approval', data);
  return response.data;
};

// Approve request
export const approveRequest = async (approvalId: string, notes?: string): Promise<{
  approval: Approval;
  message: string;
}> => {
  const response = await api.post(`/api/audit/approval/${approvalId}/approve`, { notes });
  return response.data;
};

// Reject request
export const rejectRequest = async (approvalId: string, reason?: string): Promise<{
  approval: Approval;
}> => {
  const response = await api.post(`/api/audit/approval/${approvalId}/reject`, { reason });
  return response.data;
};

// Get pending approvals
export const getPendingApprovals = async (): Promise<{
  pending_approvals: Approval[];
  count: number;
}> => {
  const response = await api.get('/api/audit/approvals/pending');
  return response.data;
};

// Get payroll changes
export const getPayrollChanges = async (params?: {
  start_date?: string;
  end_date?: string;
  employee_id?: string;
}): Promise<{ changes: AuditLog[]; total: number }> => {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.employee_id) queryParams.append('employee_id', params.employee_id);
  
  const response = await api.get(`/api/audit/payroll-changes?${queryParams.toString()}`);
  return response.data;
};

// Get employee changes
export const getEmployeeChanges = async (employeeId: string): Promise<{
  employee_id: string;
  changes: AuditLog[];
  by_category: Record<string, AuditLog[]>;
  total: number;
}> => {
  const response = await api.get(`/api/audit/employee/${employeeId}/changes`);
  return response.data;
};

// Generate compliance report
export const generateComplianceReport = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{ report: ComplianceReport }> => {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  
  const response = await api.get(`/api/audit/compliance-report?${queryParams.toString()}`);
  return response.data;
};

// Get security events
export const getSecurityEvents = async (params?: {
  start_date?: string;
  end_date?: string;
  event_type?: string;
}): Promise<{ security_events: AuditLog[]; total: number }> => {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.event_type) queryParams.append('event_type', params.event_type);
  
  const response = await api.get(`/api/audit/security-events?${queryParams.toString()}`);
  return response.data;
};

// Export audit logs
export const exportAuditLogs = async (data: {
  start_date?: string;
  end_date?: string;
  categories?: AuditCategory[];
  format?: 'json' | 'csv';
}): Promise<{
  export: {
    record_count: number;
    period: { start: string; end: string };
    categories: string[] | string;
    format: string;
    data: AuditLog[];
  };
}> => {
  const response = await api.post('/api/audit/export', data);
  return response.data;
};

export default {
  addAuditLog,
  getAuditLogs,
  getEntityHistory,
  createApprovalRequest,
  approveRequest,
  rejectRequest,
  getPendingApprovals,
  getPayrollChanges,
  getEmployeeChanges,
  generateComplianceReport,
  getSecurityEvents,
  exportAuditLogs,
};
