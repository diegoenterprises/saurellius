/**
 * 👁️ SAURELLIUS WORKFORCE SERVICE
 * Frontend API client for workforce management
 */

import api from './api';

// Types
export interface Employee {
  id: number;
  name: string;
  position: string;
  position_color: PositionColor;
  department: string;
  email: string;
  phone: string;
  hourly_rate: number;
  max_hours: number;
  status: string;
  current_location: string;
  clock_in_time: string | null;
  scheduled_hours: number;
  worked_hours: number;
  overtime_hours: number;
}

export interface PositionColor {
  bg: string;
  text: string;
  border: string;
}

export interface Shift {
  id: string;
  employee_id: number;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  display_time: string;
  duration_hours: number;
  position: string;
  position_color: PositionColor;
  department: string;
  location: string;
  status: string;
  is_time_off: boolean;
  time_off_type?: string;
}

export interface ScheduleRow {
  employee: Employee;
  scheduled_hours: number;
  overtime_hours: number;
  has_overtime: boolean;
  shifts_by_date: Record<string, Shift>;
  days: {
    date: string;
    shift: Shift | null;
    has_shift: boolean;
    is_time_off: boolean;
  }[];
}

export interface DateInfo {
  date: string;
  day_name: string;
  day_number: number;
  is_today: boolean;
}

export interface TimeOffRequest {
  id: string;
  employee_id: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  time_off_type: string;
  reason: string;
  status: string;
  created_at: string;
}

// ==================== SCHEDULE ====================

export const getWeeklySchedule = async (
  weekStart?: string,
  department?: string,
  positions?: string[]
): Promise<{
  success: boolean;
  week_start: string;
  week_end: string;
  dates: DateInfo[];
  schedule: ScheduleRow[];
  total_employees: number;
  positions: string[];
}> => {
  const response = await api.get('/workforce/schedule', {
    params: { week_start: weekStart, department, positions },
  });
  return response.data;
};

export const getDailySchedule = async (
  date?: string
): Promise<{
  success: boolean;
  date: string;
  total_shifts: number;
  morning: Shift[];
  afternoon: Shift[];
  evening: Shift[];
  all_shifts: Shift[];
}> => {
  const response = await api.get('/workforce/schedule/daily', {
    params: { date },
  });
  return response.data;
};

export const publishSchedule = async (
  weekStart: string,
  notify: boolean = true
): Promise<{ success: boolean; published_shifts: number }> => {
  const response = await api.post('/workforce/schedule/publish', {
    week_start: weekStart,
    notify,
  });
  return response.data;
};

// ==================== REAL-TIME STATUS ====================

export const getLiveStatus = async (
  department?: string
): Promise<{
  success: boolean;
  timestamp: string;
  clocked_in: Employee[];
  on_break: Employee[];
  clocked_out: Employee[];
  summary: {
    total_clocked_in: number;
    total_on_break: number;
    total_clocked_out: number;
    total_employees: number;
  };
}> => {
  const response = await api.get('/workforce/live', {
    params: { department },
  });
  return response.data;
};

export const clockIn = async (
  location?: string
): Promise<{ success: boolean; employee: Employee; clock_in_time: string }> => {
  const response = await api.post('/workforce/clock-in', { location });
  return response.data;
};

export const clockOut = async (): Promise<{ success: boolean; employee: Employee }> => {
  const response = await api.post('/workforce/clock-out');
  return response.data;
};

export const startBreak = async (): Promise<{ success: boolean; employee: Employee }> => {
  const response = await api.post('/workforce/break/start');
  return response.data;
};

export const endBreak = async (): Promise<{ success: boolean; employee: Employee }> => {
  const response = await api.post('/workforce/break/end');
  return response.data;
};

// ==================== SHIFTS ====================

export const createShift = async (
  employeeId: number,
  date: string,
  startTime: string,
  endTime: string,
  notes?: string
): Promise<{ success: boolean; shift: Shift }> => {
  const response = await api.post('/workforce/shifts', {
    employee_id: employeeId,
    date,
    start_time: startTime,
    end_time: endTime,
    notes,
  });
  return response.data;
};

export const updateShift = async (
  shiftId: string,
  updates: {
    start_time?: string;
    end_time?: string;
    notes?: string;
  }
): Promise<{ success: boolean; shift: Shift }> => {
  const response = await api.put(`/workforce/shifts/${shiftId}`, updates);
  return response.data;
};

export const deleteShift = async (shiftId: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/workforce/shifts/${shiftId}`);
  return response.data;
};

// ==================== TIME OFF ====================

export const requestTimeOff = async (
  startDate: string,
  endDate: string,
  type: string,
  reason?: string
): Promise<{ success: boolean; request: TimeOffRequest }> => {
  const response = await api.post('/workforce/time-off/request', {
    start_date: startDate,
    end_date: endDate,
    type,
    reason,
  });
  return response.data;
};

export const getTimeOffRequests = async (
  status?: string
): Promise<{ success: boolean; requests: TimeOffRequest[] }> => {
  const response = await api.get('/workforce/time-off/requests', {
    params: { status },
  });
  return response.data;
};

export const reviewTimeOff = async (
  requestId: string,
  approve: boolean
): Promise<{ success: boolean; request: TimeOffRequest }> => {
  const response = await api.post(`/workforce/time-off/${requestId}/review`, {
    approve,
  });
  return response.data;
};

// ==================== EMPLOYEES ====================

export const getEmployees = async (
  department?: string,
  position?: string
): Promise<{ success: boolean; employees: Employee[]; total: number }> => {
  const response = await api.get('/workforce/employees', {
    params: { department, position },
  });
  return response.data;
};

export const getEmployee = async (
  employeeId: number
): Promise<{ success: boolean; employee: Employee }> => {
  const response = await api.get(`/workforce/employees/${employeeId}`);
  return response.data;
};

// ==================== ANALYTICS ====================

export const getWorkforceStats = async (
  weekStart?: string
): Promise<{
  success: boolean;
  week_start: string;
  total_employees: number;
  total_scheduled_hours: number;
  total_overtime_hours: number;
  employees_with_overtime: number;
  average_hours_per_employee: number;
  position_breakdown: Record<string, number>;
  position_colors: Record<string, PositionColor>;
}> => {
  const response = await api.get('/workforce/stats', {
    params: { week_start: weekStart },
  });
  return response.data;
};

// ==================== UTILITIES ====================

export const getPositions = async (): Promise<{
  success: boolean;
  positions: Record<string, PositionColor>;
  days_of_week: string[];
}> => {
  const response = await api.get('/workforce/positions');
  return response.data;
};

export default {
  getWeeklySchedule,
  getDailySchedule,
  publishSchedule,
  getLiveStatus,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  createShift,
  updateShift,
  deleteShift,
  requestTimeOff,
  getTimeOffRequests,
  reviewTimeOff,
  getEmployees,
  getEmployee,
  getWorkforceStats,
  getPositions,
};
