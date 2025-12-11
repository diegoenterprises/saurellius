/**
 * SAURELLIUS SWIPE SERVICE
 * Frontend API client for schedule swap management
 */

import api from './api';

// Types
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
  position_color: {
    bg: string;
    text: string;
    border?: string;
  };
  department: string;
  location: string;
  is_available_for_swap: boolean;
  swap_note?: string;
}

export interface SwapRequest {
  id: string;
  requester_id: number;
  requester_name: string;
  requester_shift: Shift;
  target_id: number;
  target_name: string;
  target_shift: Shift;
  reason: string;
  department: string;
  position: string;
  status: SwapStatus;
  created_at: string;
  responded_at: string | null;
  manager_reviewed_at: string | null;
  manager_id: number | null;
  manager_name: string | null;
  manager_notes: string;
  overtime_warning: boolean;
  overtime_details: {
    has_overtime: boolean;
    details?: {
      requester_shift_hours: number;
      target_shift_hours: number;
      warning: string;
    };
  };
}

export type SwapStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'manager_pending'
  | 'manager_approved'
  | 'manager_denied'
  | 'cancelled'
  | 'expired';

export interface PositionColor {
  bg: string;
  text: string;
  name: string;
}

// ==================== SHIFTS ====================

export const getMyShifts = async (
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; shifts: Shift[]; total: number }> => {
  const response = await api.get('/swipe/shifts', {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};

export const getShift = async (
  shiftId: string
): Promise<{ success: boolean; shift: Shift }> => {
  const response = await api.get(`/swipe/shifts/${shiftId}`);
  return response.data;
};

export const markShiftAvailable = async (
  shiftId: string,
  note?: string
): Promise<{ success: boolean; shift: Shift }> => {
  const response = await api.post(`/swipe/shifts/${shiftId}/available`, {
    note,
  });
  return response.data;
};

export const getAvailableShifts = async (): Promise<{
  success: boolean;
  available_shifts: Shift[];
  total: number;
}> => {
  const response = await api.get('/swipe/available');
  return response.data;
};

// ==================== SWAP REQUESTS ====================

export const createSwapRequest = async (
  myShiftId: string,
  targetId: number,
  targetShiftId: string,
  reason?: string,
  requesterName?: string,
  targetName?: string
): Promise<{
  success: boolean;
  swap_request: SwapRequest;
  overtime_warning: {
    has_overtime: boolean;
    details?: any;
  };
}> => {
  const response = await api.post('/swipe/request', {
    my_shift_id: myShiftId,
    target_id: targetId,
    target_shift_id: targetShiftId,
    reason,
    requester_name: requesterName,
    target_name: targetName,
  });
  return response.data;
};

export const respondToRequest = async (
  requestId: string,
  accept: boolean,
  message?: string
): Promise<{ success: boolean; swap_request: SwapRequest }> => {
  const response = await api.post(`/swipe/request/${requestId}/respond`, {
    accept,
    message,
  });
  return response.data;
};

export const getMyRequests = async (): Promise<{
  success: boolean;
  incoming: SwapRequest[];
  outgoing: SwapRequest[];
}> => {
  const response = await api.get('/swipe/requests/my');
  return response.data;
};

export const getSwapHistory = async (
  limit?: number
): Promise<{ success: boolean; history: SwapRequest[]; total: number }> => {
  const response = await api.get('/swipe/history', {
    params: { limit },
  });
  return response.data;
};

// ==================== MANAGER APPROVAL ====================

export const getPendingApprovals = async (
  department?: string
): Promise<{
  success: boolean;
  pending_requests: SwapRequest[];
  total: number;
}> => {
  const response = await api.get('/swipe/approval/pending', {
    params: { department },
  });
  return response.data;
};

export const managerReview = async (
  requestId: string,
  approve: boolean,
  notes?: string,
  managerName?: string
): Promise<{ success: boolean; swap_request: SwapRequest }> => {
  const response = await api.post(`/swipe/approval/${requestId}/review`, {
    approve,
    notes,
    manager_name: managerName,
  });
  return response.data;
};

// ==================== UTILITIES ====================

export const getPositions = async (): Promise<{
  success: boolean;
  positions: Record<string, PositionColor>;
}> => {
  const response = await api.get('/swipe/positions');
  return response.data;
};

// Helper functions
export const getStatusColor = (status: SwapStatus): { bg: string; text: string } => {
  switch (status) {
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'accepted':
    case 'manager_pending':
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'manager_approved':
      return { bg: '#D1FAE5', text: '#065F46' };
    case 'declined':
    case 'manager_denied':
      return { bg: '#FEE2E2', text: '#991B1B' };
    case 'cancelled':
    case 'expired':
      return { bg: '#F3F4F6', text: '#374151' };
    default:
      return { bg: '#F3F4F6', text: '#374151' };
  }
};

export const getStatusLabel = (status: SwapStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending Response';
    case 'accepted':
      return 'Accepted';
    case 'manager_pending':
      return 'Awaiting Manager';
    case 'manager_approved':
      return 'Approved';
    case 'declined':
      return 'Declined';
    case 'manager_denied':
      return 'Denied by Manager';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
};

export default {
  // Shifts
  getMyShifts,
  getShift,
  markShiftAvailable,
  getAvailableShifts,
  // Swap Requests
  createSwapRequest,
  respondToRequest,
  getMyRequests,
  getSwapHistory,
  // Manager
  getPendingApprovals,
  managerReview,
  // Utilities
  getPositions,
  getStatusColor,
  getStatusLabel,
};
