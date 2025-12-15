/**
 * SETTINGS SLICE
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

interface SettingsState {
  selectedTheme: string;
  darkMode: boolean;
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
  darkMode: true,
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
    const darkModeStr = await AsyncStorage.getItem('dark_mode');
    const notificationsStr = await AsyncStorage.getItem('notifications');
    return {
      theme: theme || 'diego_original',
      darkMode: darkModeStr !== null ? JSON.parse(darkModeStr) : true,
      notifications: notificationsStr ? JSON.parse(notificationsStr) : initialState.notifications,
    };
  }
);

export const toggleDarkMode = createAsyncThunk(
  'settings/toggleDarkMode',
  async (darkMode: boolean) => {
    // Save to AsyncStorage for local persistence
    await AsyncStorage.setItem('dark_mode', JSON.stringify(darkMode));
    
    // Sync to backend for cross-device persistence
    try {
      await api.put('/api/settings/preferences', { dark_mode: darkMode });
    } catch (error) {
      console.log('Failed to sync dark mode to backend:', error);
    }
    
    return darkMode;
  }
);

export const setTheme = createAsyncThunk(
  'settings/setTheme',
  async (themeKey: string, { rejectWithValue }) => {
    try {
      await api.put('/api/settings/preferences', { theme: themeKey });
      await AsyncStorage.setItem('selected_theme', themeKey);
      return themeKey;
    } catch (error: any) {
      // Still save locally even if backend fails
      await AsyncStorage.setItem('selected_theme', themeKey);
      return themeKey;
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
      state.darkMode = action.payload.darkMode;
      state.notifications = action.payload.notifications;
    });
    builder.addCase(toggleDarkMode.fulfilled, (state, action) => {
      state.darkMode = action.payload;
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
