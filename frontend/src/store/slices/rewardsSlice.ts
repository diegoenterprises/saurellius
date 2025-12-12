/**
 * REWARDS SLICE
 * Rewards and points state management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface RewardLevel {
  name: string;
  progress: number;
  next_level: string | null;
}

interface Reward {
  id: number;
  name: string;
  description: string;
  points_required: number;
  is_redeemed: boolean;
  category: string;
  icon: string;
}

interface RewardsState {
  points: number;
  level: RewardLevel;
  availableRewards: Reward[];
  redeemedRewards: Reward[];
  history: Array<{
    id: number;
    points: number;
    description: string;
    created_at: string;
    type: 'earned' | 'redeemed';
  }>;
  isLoading: boolean;
  error: string | null;
}

const initialState: RewardsState = {
  points: 0,
  level: {
    name: 'Bronze',
    progress: 0,
    next_level: 'Silver',
  },
  availableRewards: [],
  redeemedRewards: [],
  history: [],
  isLoading: false,
  error: null,
};

// Calculate level from points
const calculateLevel = (points: number): RewardLevel => {
  const levels = [
    { name: 'Bronze', min: 0, max: 99 },
    { name: 'Silver', min: 100, max: 499 },
    { name: 'Gold', min: 500, max: 999 },
    { name: 'Platinum', min: 1000, max: 4999 },
    { name: 'Diamond', min: 5000, max: Infinity },
  ];

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    if (points >= level.min && points <= level.max) {
      const progress = level.max === Infinity 
        ? 100 
        : ((points - level.min) / (level.max - level.min)) * 100;
      return {
        name: level.name,
        progress: Math.min(100, Math.round(progress)),
        next_level: i < levels.length - 1 ? levels[i + 1].name : null,
      };
    }
  }

  return { name: 'Bronze', progress: 0, next_level: 'Silver' };
};

// Async thunks
export const fetchRewards = createAsyncThunk(
  'rewards/fetchRewards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/rewards');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rewards');
    }
  }
);

export const redeemReward = createAsyncThunk(
  'rewards/redeemReward',
  async (rewardId: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/rewards/${rewardId}/redeem`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to redeem reward');
    }
  }
);

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    setPoints: (state, action: PayloadAction<number>) => {
      state.points = action.payload;
      state.level = calculateLevel(action.payload);
    },
    addPoints: (state, action: PayloadAction<{ points: number; description: string }>) => {
      state.points += action.payload.points;
      state.level = calculateLevel(state.points);
      state.history.unshift({
        id: Date.now(),
        points: action.payload.points,
        description: action.payload.description,
        created_at: new Date().toISOString(),
        type: 'earned',
      });
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRewards.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.points = action.payload.points || 0;
        state.level = calculateLevel(state.points);
        state.availableRewards = action.payload.available || [];
        state.redeemedRewards = action.payload.redeemed || [];
        state.history = action.payload.history || [];
      })
      .addCase(fetchRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(redeemReward.fulfilled, (state, action) => {
        const rewardId = action.payload.reward_id;
        const reward = state.availableRewards.find(r => r.id === rewardId);
        if (reward) {
          state.points -= reward.points_required;
          state.level = calculateLevel(state.points);
          state.redeemedRewards.push({ ...reward, is_redeemed: true });
          state.availableRewards = state.availableRewards.filter(r => r.id !== rewardId);
        }
      });
  },
});

export const { setPoints, addPoints, clearError } = rewardsSlice.actions;
export default rewardsSlice.reducer;
