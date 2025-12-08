/**
 * 📊 DASHBOARD SLICE
 * Dashboard state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardAPI, rewardsAPI } from '../../services/api';

// Types
interface DashboardStats {
  total_paystubs: number;
  ytd_gross: number;
  active_employees: number;
  next_pay_date: string;
  paystubs_this_month: number;
  total_processed_this_month: number;
  avg_net_pay: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface RewardsInfo {
  current_points: number;
  current_tier: string;
  next_tier: string;
  points_to_next_tier: number;
  tier_progress: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  activities: Activity[];
  rewards: RewardsInfo | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  activities: [],
  rewards: null,
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchDashboard = createAsyncThunk(
  'dashboard/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [summaryRes, activityRes, rewardsRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getRecentActivity(10),
        rewardsAPI.getPoints(),
      ]);
      
      return {
        stats: summaryRes.stats,
        activities: activityRes.activities,
        rewards: rewardsRes,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'dashboard/fetchRecentActivity',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getRecentActivity(limit);
      return response.activities;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load activity');
    }
  }
);

// Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addActivity: (state, action) => {
      state.activities.unshift(action.payload);
      if (state.activities.length > 20) {
        state.activities.pop();
      }
    },
    updateRewards: (state, action) => {
      state.rewards = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Dashboard
    builder.addCase(fetchDashboard.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboard.fulfilled, (state, action) => {
      state.isLoading = false;
      state.stats = action.payload.stats;
      state.activities = action.payload.activities;
      state.rewards = action.payload.rewards;
    });
    builder.addCase(fetchDashboard.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch Activity
    builder.addCase(fetchRecentActivity.fulfilled, (state, action) => {
      state.activities = action.payload;
    });
  },
});

export const { clearError, addActivity, updateRewards } = dashboardSlice.actions;
export default dashboardSlice.reducer;
