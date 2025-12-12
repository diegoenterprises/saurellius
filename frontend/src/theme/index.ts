/**
 * SAURELLIUS THEME
 * Centralized theme configuration for the app
 */

export const colors = {
  primary: {
    purple: '#7C3AED',
    blue: '#3B82F6',
    indigo: '#6366F1',
  },
  secondary: {
    pink: '#EC4899',
    cyan: '#06B6D4',
    teal: '#14B8A6',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },
  background: {
    primary: '#F5F7FA',
    secondary: '#FFFFFF',
    dark: '#1F2937',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },
};

export const gradients = {
  primary: ['#7C3AED', '#6366F1'] as [string, string],
  secondary: ['#EC4899', '#F472B6'] as [string, string],
  success: ['#10B981', '#34D399'] as [string, string],
  warning: ['#F59E0B', '#FBBF24'] as [string, string],
  error: ['#EF4444', '#F87171'] as [string, string],
  purple: ['#7C3AED', '#A78BFA'] as [string, string],
  blue: ['#3B82F6', '#60A5FA'] as [string, string],
  dark: ['#1F2937', '#374151'] as [string, string],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const typography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 28,
    hero: 32,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default {
  colors,
  gradients,
  spacing,
  borderRadius,
  typography,
  shadows,
};
