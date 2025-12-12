/**
 * ⏱️ TIMESHEET SLICE
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { timesheetAPI, interchangeAPI } from '../../services/api';

interface ClockStatus {
  status: 'not_clocked_in' | 'working' | 'on_break';
  clocked_in: boolean;
  clock_in_time?: string;
  on_break: boolean;
  break_start_time?: string;
  today_hours: number;
}

interface ShiftSwapRequest {
  id: string;
  shift_id: string;
  original_employee_name: string;
  requesting_employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason?: string;
}

interface TimesheetState {
  clockStatus: ClockStatus | null;
  dailyTimesheet: any | null;
  weeklyTimesheet: any | null;
  swapRequests: ShiftSwapRequest[];
  availableSwaps: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TimesheetState = {
  clockStatus: null,
  dailyTimesheet: null,
  weeklyTimesheet: null,
  swapRequests: [],
  availableSwaps: [],
  isLoading: false,
  error: null,
};

export const fetchClockStatus = createAsyncThunk(
  'timesheet/fetchClockStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await timesheetAPI.getCurrentStatus();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get status');
    }
  }
);

export const clockIn = createAsyncThunk(
  'timesheet/clockIn',
  async (data: { location?: string; gps_coords?: [number, number] }, { rejectWithValue }) => {
    try {
      const response = await timesheetAPI.clockIn(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clock in');
    }
  }
);

export const clockOut = createAsyncThunk(
  'timesheet/clockOut',
  async (data?: { notes?: string }, { rejectWithValue }) => {
    try {
      const response = await timesheetAPI.clockOut(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clock out');
    }
  }
);

export const startBreak = createAsyncThunk(
  'timesheet/startBreak',
  async (breakType: string, { rejectWithValue }) => {
    try {
      const response = await timesheetAPI.startBreak(breakType);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start break');
    }
  }
);

export const endBreak = createAsyncThunk(
  'timesheet/endBreak',
  async (_, { rejectWithValue }) => {
    try {
      const response = await timesheetAPI.endBreak();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end break');
    }
  }
);

export const requestShiftSwap = createAsyncThunk(
  'timesheet/requestShiftSwap',
  async (data: { shift_id: string; swap_type: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await interchangeAPI.requestSwap(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request swap');
    }
  }
);

export const fetchAvailableSwaps = createAsyncThunk(
  'timesheet/fetchAvailableSwaps',
  async ({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }, { rejectWithValue }) => {
    try {
      const response = await interchangeAPI.getAvailableSwaps(dateFrom, dateTo);
      return response.swaps;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get swaps');
    }
  }
);

const timesheetSlice = createSlice({
  name: 'timesheet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchClockStatus.fulfilled, (state, action) => {
      state.clockStatus = action.payload;
    });
    builder.addCase(clockIn.fulfilled, (state, action) => {
      state.clockStatus = action.payload.status;
    });
    builder.addCase(clockOut.fulfilled, (state, action) => {
      state.clockStatus = action.payload.status;
    });
    builder.addCase(startBreak.fulfilled, (state, action) => {
      state.clockStatus = action.payload.status;
    });
    builder.addCase(endBreak.fulfilled, (state, action) => {
      state.clockStatus = action.payload.status;
    });
    builder.addCase(fetchAvailableSwaps.fulfilled, (state, action) => {
      state.availableSwaps = action.payload;
    });
    builder.addCase(requestShiftSwap.fulfilled, (state, action) => {
      state.swapRequests.push(action.payload.request);
    });
  },
});

export const { clearError } = timesheetSlice.actions;
export default timesheetSlice.reducer;
