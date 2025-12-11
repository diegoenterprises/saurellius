/**
 * DASHBOARD SLICE
 * Dashboard state management - 100% dynamic
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardService from '../../services/dashboard';
import api from '../../services/api';

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

interface RecentEmployee {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  state: string;
  status: string;
}

interface DashboardState {
  stats: DashboardStats | null;
  activities: Activity[];
  rewards: RewardsInfo | null;
  recentEmployees: RecentEmployee[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  activities: [],
  rewards: null,
  recentEmployees: [],
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchDashboard = createAsyncThunk(
  'dashboard/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [statsRes, activityRes, rewardsRes, employeesRes] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getActivityFeed(10),
        dashboardService.getRewardsData(),
        api.get('/api/employees?limit=3').catch(() => ({ data: { employees: [] } })),
      ]);
      
      return {
        stats: statsRes,
        activities: activityRes || [],
        rewards: rewardsRes,
        recentEmployees: employeesRes.data?.employees || employeesRes.data?.data?.employees || [],
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
      const activities = await dashboardService.getActivityFeed(limit);
      return activities || [];
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
      state.stats = action.payload.stats as any;
      state.activities = action.payload.activities;
      state.rewards = action.payload.rewards as any;
      state.recentEmployees = action.payload.recentEmployees;
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
