/**
 * THEME CONTEXT
 * Provides dark/light mode theming across the app
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Dark theme colors
const darkColors = {
  background: '#0f0f23',
  backgroundSecondary: '#1a1a2e',
  card: '#1a1a2e',
  cardHover: '#252545',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  border: '#2a2a4e',
  borderLight: '#3a3a5e',
  primary: '#1473FF',
  secondary: '#BE01FF',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// Light theme colors
const lightColors = {
  background: '#f5f7fa',
  backgroundSecondary: '#ffffff',
  card: '#ffffff',
  cardHover: '#f0f0f0',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#d1d5db',
  primary: '#1473FF',
  secondary: '#BE01FF',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export type ThemeColors = typeof darkColors;

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode } = useSelector((state: RootState) => state.settings);

  const value = useMemo(() => ({
    colors: darkMode ? darkColors : lightColors,
    isDark: darkMode,
  }), [darkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export { darkColors, lightColors };
