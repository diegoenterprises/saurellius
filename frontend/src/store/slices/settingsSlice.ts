/**
 * SETTINGS SLICE
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themesAPI } from '../../services/api';

interface SettingsState {
  selectedTheme: string;
  notifications: {
    paystub_ready: boolean;
    rewards_milestones: boolean;
    marketing: boolean;
    push_enabled: boolean;
    email_enabled: boolean;
  };
  company: {
    name: string;
    address: string;
    ein: string;
  };
  isLoading: boolean;
}

const initialState: SettingsState = {
  selectedTheme: 'diego_original',
  notifications: {
    paystub_ready: true,
    rewards_milestones: true,
    marketing: false,
    push_enabled: true,
    email_enabled: true,
  },
  company: {
    name: '',
    address: '',
    ein: '',
  },
  isLoading: false,
};

export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async () => {
    const theme = await AsyncStorage.getItem('selected_theme');
    const notificationsStr = await AsyncStorage.getItem('notifications');
    return {
      theme: theme || 'diego_original',
      notifications: notificationsStr ? JSON.parse(notificationsStr) : initialState.notifications,
    };
  }
);

export const setTheme = createAsyncThunk(
  'settings/setTheme',
  async (themeKey: string, { rejectWithValue }) => {
    try {
      await themesAPI.setPreferred(themeKey);
      await AsyncStorage.setItem('selected_theme', themeKey);
      return themeKey;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set theme');
    }
  }
);

export const updateNotifications = createAsyncThunk(
  'settings/updateNotifications',
  async (notifications: any) => {
    await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    return notifications;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setCompany: (state, action) => {
      state.company = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadSettings.fulfilled, (state, action) => {
      state.selectedTheme = action.payload.theme;
      state.notifications = action.payload.notifications;
    });
    builder.addCase(setTheme.fulfilled, (state, action) => {
      state.selectedTheme = action.payload;
    });
    builder.addCase(updateNotifications.fulfilled, (state, action) => {
      state.notifications = action.payload;
    });
  },
});

export const { setCompany } = settingsSlice.actions;
export default settingsSlice.reducer;
