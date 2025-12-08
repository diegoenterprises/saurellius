/**
 * 🏪 REDUX STORE
 * Central state management for the app
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import employeesReducer from './slices/employeesSlice';
import paystubsReducer from './slices/paystubsSlice';
import settingsReducer from './slices/settingsSlice';
import timesheetReducer from './slices/timesheetSlice';
import billingReducer from './slices/billingSlice';
import rewardsReducer from './slices/rewardsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    employees: employeesReducer,
    paystubs: paystubsReducer,
    settings: settingsReducer,
    timesheet: timesheetReducer,
    billing: billingReducer,
    rewards: rewardsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
