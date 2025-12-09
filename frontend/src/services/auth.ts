/**
 * AUTHENTICATION SERVICE
 * Frontend service for user authentication
 */

import api from './api';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name?: string;
}

export interface AuthResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    company_id: number;
    role: string;
    subscription_tier: string;
  };
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_id: number;
  role: string;
  subscription_tier: string;
}

// Login
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

// Sign up
export const signUp = async (data: SignUpData): Promise<AuthResponse> => {
  const response = await api.post('/api/auth/register', data);
  return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
  await api.post('/api/auth/logout');
};

// Refresh token
export const refreshToken = async (refreshToken: string): Promise<{ access_token: string }> => {
  const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken });
  return response.data;
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/api/auth/me');
  return response.data.user;
};

// Update profile
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await api.put('/api/auth/profile', data);
  return response.data.user;
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await api.post('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
};

// Forgot password
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/api/auth/forgot-password', { email });
};

// Reset password
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await api.post('/api/auth/reset-password', { token, new_password: newPassword });
};

// Verify email
export const verifyEmail = async (token: string): Promise<void> => {
  await api.post('/api/auth/verify-email', { token });
};

export default {
  login,
  signUp,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
