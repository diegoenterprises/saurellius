/**
 * Time Clock Service
 * API calls for clock in/out, attendance, and overtime
 */

import api from './api';

export interface TimeEntry {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  breaks: Break[];
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  double_time_hours: number;
  status: 'active' | 'complete' | 'approved';
  audit_trail?: AuditEntry[];
}

export interface Break {
  type: 'meal' | 'rest';
  start: string;
  end?: string;
  duration_minutes: number;
}

export interface AuditEntry {
  timestamp: string;
  changed_by: string;
  reason: string;
  changes: Array<{ field: string; old: string; new: string }>;
}

export interface PunchRecord {
  id: string;
  employee_id: string;
  punch_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  timestamp: string;
  date: string;
  time: string;
  location?: string;
  ip_address?: string;
  device?: string;
  notes?: string;
  coordinates?: { latitude: number; longitude: number };
  time_entry_id?: string;
}

export interface OvertimeCalculation {
  employee_id: string;
  period: string;
  work_state: string;
  hourly_rate: number;
  hours: {
    regular: number;
    overtime: number;
    double_time: number;
    total: number;
  };
  pay: {
    regular: number;
    overtime: number;
    double_time: number;
    total: number;
  };
  weekly_breakdown: Record<string, any>;
}

export interface WeeklySummary {
  employee_id: string;
  week_start: string;
  week_end: string;
  daily_hours: Record<string, { date: string; hours: number; entries: number }>;
  total_hours: number;
  overtime_hours: number;
  days_worked: number;
}

export interface MealBreakViolation {
  entry_id: string;
  employee_id: string;
  date: string;
  violation_type: 'missing_meal_break' | 'missing_second_meal_break' | 'missing_rest_break';
  hours_worked: number;
  penalty: string;
  description: string;
}

// Record punch
export const punch = async (data: {
  employee_id?: string;
  punch_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  location?: string;
  device?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ punch: PunchRecord }> => {
  const response = await api.post('/api/timeclock/punch', data);
  return response.data;
};

// Get clock status
export const getClockStatus = async (employeeId: string): Promise<{
  clocked_in: boolean;
  clock_in_time?: string;
  hours_worked?: number;
  on_break?: boolean;
  entry_id?: string;
}> => {
  const response = await api.get(`/api/timeclock/status/${employeeId}`);
  return response.data;
};

// Get time entries
export const getTimeEntries = async (params?: {
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'complete' | 'approved';
}): Promise<{ entries: TimeEntry[] }> => {
  const queryParams = new URLSearchParams();
  if (params?.employee_id) queryParams.append('employee_id', params.employee_id);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.status) queryParams.append('status', params.status);
  
  const response = await api.get(`/api/timeclock/entries?${queryParams.toString()}`);
  return response.data;
};

// Update time entry
export const updateTimeEntry = async (entryId: string, data: {
  clock_in?: string;
  clock_out?: string;
  reason?: string;
}): Promise<{ entry: TimeEntry }> => {
  const response = await api.put(`/api/timeclock/entries/${entryId}`, data);
  return response.data;
};

// Calculate overtime
export const calculateOvertime = async (data: {
  employee_id: string;
  work_state: string;
  start_date: string;
  end_date: string;
  hourly_rate: number;
}): Promise<{ calculation: OvertimeCalculation }> => {
  const response = await api.post('/api/timeclock/calculate-overtime', data);
  return response.data;
};

// Check meal break violations
export const checkMealBreakViolations = async (params?: {
  employee_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<{
  violations: MealBreakViolation[];
  count: number;
  total_penalty_hours: number;
}> => {
  const queryParams = new URLSearchParams();
  if (params?.employee_id) queryParams.append('employee_id', params.employee_id);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  
  const response = await api.get(`/api/timeclock/meal-break-violations?${queryParams.toString()}`);
  return response.data;
};

// Get weekly summary
export const getWeeklySummary = async (employeeId: string, weekStart?: string): Promise<{ 
  success: boolean;
} & WeeklySummary> => {
  const params = weekStart ? `?week_start=${weekStart}` : '';
  const response = await api.get(`/api/timeclock/weekly-summary/${employeeId}${params}`);
  return response.data;
};

// Approve timesheet
export const approveTimesheet = async (data: {
  employee_id: string;
  start_date: string;
  end_date: string;
}): Promise<{ approved_count: number; message: string }> => {
  const response = await api.post('/api/timeclock/approve', data);
  return response.data;
};

export default {
  punch,
  getClockStatus,
  getTimeEntries,
  updateTimeEntry,
  calculateOvertime,
  checkMealBreakViolations,
  getWeeklySummary,
  approveTimesheet,
};
