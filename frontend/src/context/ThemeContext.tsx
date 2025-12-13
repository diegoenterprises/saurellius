/**
 * THEME CONTEXT
 * Provides dark/light mode theming across the app
 * Unified Platform Command Center gradient styling
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Unified Platform Gradients - Navy Command Center style
const darkGradients = {
  primary: ['#0F172A', '#1E293B'] as [string, string],
  header: ['#0F172A', '#1E293B'] as [string, string],
  button: ['#1E3A5F', '#0F172A'] as [string, string],
  card: ['#1E293B', '#0F172A'] as [string, string],
  accent: ['#3B82F6', '#8B5CF6'] as [string, string],
};

const lightGradients = {
  primary: ['#F8FAFC', '#E2E8F0'] as [string, string],
  header: ['#1E3A5F', '#0F172A'] as [string, string], // Keep header dark for contrast
  button: ['#3B82F6', '#2563EB'] as [string, string],
  card: ['#FFFFFF', '#F8FAFC'] as [string, string],
  accent: ['#3B82F6', '#8B5CF6'] as [string, string],
};

// Dark theme colors
const darkColors = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  card: '#1E293B',
  cardHover: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#475569',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  // Input styling
  inputBackground: '#1E293B',
  inputBorder: '#334155',
  inputText: '#F8FAFC',
  inputPlaceholder: '#64748B',
};

// Light theme colors
const lightColors = {
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  // Input styling
  inputBackground: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',
};

export type ThemeColors = typeof darkColors;
export type ThemeGradients = typeof darkGradients;

interface ThemeContextType {
  colors: ThemeColors;
  gradients: ThemeGradients;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  gradients: darkGradients,
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode } = useSelector((state: RootState) => state.settings);

  const value = useMemo(() => ({
    colors: darkMode ? darkColors : lightColors,
    gradients: darkMode ? darkGradients : lightGradients,
    isDark: darkMode,
  }), [darkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export { darkColors, lightColors, darkGradients, lightGradients };
