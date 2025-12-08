/**
 * 💳 BILLING SLICE
 * Subscription and billing state management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Plan {
  name: string;
  monthly_price: number;
  paystub_limit: number;
  overage_rate: number;
  features: string[];
}

interface UsageSummary {
  plan: string;
  plan_name: string;
  paystubs_used: number;
  paystubs_limit: number | string;
  paystubs_remaining: number | string;
  usage_percentage: number;
  monthly_price: number;
  overage_count: number;
  overage_amount: number;
  total_generated: number;
  billing_cycle_start: string | null;
}

interface BillingState {
  subscription: {
    tier: string;
    status: string;
    stripe_subscription_id: string | null;
  };
  usage: UsageSummary | null;
  plans: Record<string, Plan>;
  isLoading: boolean;
  error: string | null;
}

const initialState: BillingState = {
  subscription: {
    tier: 'free',
    status: 'inactive',
    stripe_subscription_id: null,
  },
  usage: null,
  plans: {},
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchSubscription = createAsyncThunk(
  'billing/fetchSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/stripe/subscription');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }
);

export const fetchPlans = createAsyncThunk(
  'billing/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/stripe/plans');
      return response.data.plans;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
    }
  }
);

export const createCheckoutSession = createAsyncThunk(
  'billing/createCheckoutSession',
  async (plan: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/stripe/create-checkout-session', { plan });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create checkout');
    }
  }
);

export const openBillingPortal = createAsyncThunk(
  'billing/openBillingPortal',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/stripe/billing-portal');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to open billing portal');
    }
  }
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUsage: (state, action: PayloadAction<Partial<UsageSummary>>) => {
      if (state.usage) {
        state.usage = { ...state.usage, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Subscription
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload.subscription;
        state.usage = action.payload.usage;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Plans
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.plans = action.payload;
      })
      // Checkout Session
      .addCase(createCheckoutSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCheckoutSession.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateUsage } = billingSlice.actions;
export default billingSlice.reducer;
