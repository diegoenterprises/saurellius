/**
 * PAYSTUBS SLICE
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paystubAPI } from '../../services/api';

interface Paystub {
  id: string;
  employee_name: string;
  employee_id: string;
  gross_pay: number;
  net_pay: number;
  pay_date: string;
  period_start: string;
  period_end: string;
  theme: string;
  verification_id: string;
  status: string;
  created_at: string;
}

interface PaystubsState {
  paystubs: Paystub[];
  selectedPaystub: Paystub | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number };
}

const initialState: PaystubsState = {
  paystubs: [],
  selectedPaystub: null,
  isLoading: false,
  isGenerating: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0 },
};

export const fetchPaystubs = createAsyncThunk(
  'paystubs/fetchPaystubs',
  async (params: { page?: number; limit?: number; year?: number; employee_id?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await paystubAPI.getHistory(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load paystubs');
    }
  }
);

export const generatePaystub = createAsyncThunk(
  'paystubs/generatePaystub',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await paystubAPI.generate(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate paystub');
    }
  }
);

export const duplicatePaystub = createAsyncThunk(
  'paystubs/duplicatePaystub',
  async ({ id, modifications }: { id: string; modifications?: any }, { rejectWithValue }) => {
    try {
      const response = await paystubAPI.duplicate(id, modifications);
      return response.paystub;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to duplicate paystub');
    }
  }
);

const paystubsSlice = createSlice({
  name: 'paystubs',
  initialState,
  reducers: {
    setSelectedPaystub: (state, action) => {
      state.selectedPaystub = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPaystubs.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchPaystubs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.paystubs = action.payload.paystubs;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchPaystubs.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    builder.addCase(generatePaystub.pending, (state) => {
      state.isGenerating = true;
    });
    builder.addCase(generatePaystub.fulfilled, (state, action) => {
      state.isGenerating = false;
      state.paystubs.unshift(action.payload.paystub);
    });
    builder.addCase(generatePaystub.rejected, (state, action) => {
      state.isGenerating = false;
      state.error = action.payload as string;
    });
    builder.addCase(duplicatePaystub.fulfilled, (state, action) => {
      state.paystubs.unshift(action.payload);
    });
  },
});

export const { setSelectedPaystub, clearError } = paystubsSlice.actions;
export default paystubsSlice.reducer;
