/**
 * THEME CONFIGURATION
 * Colors, fonts, spacing, and design tokens
 */

import { Platform } from 'react-native';

// Primary Colors - Unified object supporting both flat and nested access
export const colors = {
  // Brand colors - flat access (colors.primary) returns string
  primary: '#1473FF',
  secondary: '#BE01FF',
  accent: '#06b6d4',
  
  // Gradients
  gradientStart: '#1473FF',
  gradientEnd: '#BE01FF',
  
  // Backgrounds
  background: '#0f0f23',
  backgroundSecondary: '#1a1a2e',
  backgroundTertiary: '#16213e',
  card: '#1a1a2e',
  cardHover: '#252545',
  
  // Text - flat access
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  
  // Status colors - flat access
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border - flat access
  border: '#2a2a4e',
  borderLight: '#3a3a5e',
  
  // Others
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Gradient presets (mutable arrays for LinearGradient compatibility)
export const gradients = {
  primary: ['#1473FF', '#BE01FF'] as [string, string],
  success: ['#10b981', '#059669'] as [string, string],
  warning: ['#f59e0b', '#d97706'] as [string, string],
  danger: ['#ef4444', '#dc2626'] as [string, string],
  purple: ['#8b5cf6', '#7c3aed'] as [string, string],
  blue: ['#3b82f6', '#2563eb'] as [string, string],
  dark: ['#1a1a2e', '#0f0f23'] as [string, string],
  rewards: ['#f59e0b', '#f97316'] as [string, string],
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Font family - Using system fonts for consistency across platforms
export const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  }) as string,
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  }) as string,
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  }) as string,
};

// Font sizes
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 48,
};

// Font weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadows (web-compatible)
const createShadow = (color: string, offsetY: number, opacity: number, radius: number, elevation: number) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${radius}px rgba(0, 0, 0, ${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
  };
};

export const shadows = {
  sm: createShadow('#000', 1, 0.05, 2, 1),
  md: createShadow('#000', 2, 0.1, 4, 3),
  lg: createShadow('#000', 4, 0.15, 8, 5),
  glow: Platform.OS === 'web' 
    ? { boxShadow: '0px 4px 12px rgba(20, 115, 255, 0.3)' }
    : {
        shadowColor: '#1473FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      },
};

// Typography (for structured access)
export const typography = {
  fontFamily: {
    regular: fontFamily.regular,
    medium: fontFamily.medium,
    bold: fontFamily.bold,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    display: 48,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Extended colors with nested structure (for component compatibility)
export const extendedColors = {
  primary: {
    blue: '#1473FF',
    purple: '#BE01FF',
    default: '#1473FF',
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0a0',
    tertiary: '#666666',
    muted: '#666666',
  },
  surface: {
    primary: '#1a1a2e',
    secondary: '#0f0f23',
    tertiary: '#16213e',
    elevated: '#252545',
  },
  border: {
    default: '#2a2a4e',
    light: '#3a3a5e',
  },
  status: {
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    info: '#3b82f6',
    infoLight: '#dbeafe',
  },
  // Flat colors for compatibility
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  background: '#0f0f23',
  backgroundSecondary: '#1a1a2e',
  card: '#1a1a2e',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
};

// Paystub Theme Colors - Synced with Backend (12 themes)
export const PAYSTUB_THEMES = {
  diego_original: {
    name: "Diego's Original",
    primary: '#1473FF',
    secondary: '#BE01FF',
    accent: '#1473FF',
    gradient_start: '#1473FF',
    gradient_end: '#BE01FF',
    preview_colors: ['#1473FF', '#BE01FF', '#06b6d4'],
  },
  anxiety: {
    name: 'Anxiety',
    primary: '#2C3E50',
    secondary: '#16A085',
    accent: '#27AE60',
    gradient_start: '#34495E',
    gradient_end: '#16A085',
    preview_colors: ['#2C3E50', '#16A085', '#27AE60'],
  },
  sodas_skateboards: {
    name: 'Sodas & Skateboards',
    primary: '#8B3A8B',
    secondary: '#00CED1',
    accent: '#00E5EE',
    gradient_start: '#9932CC',
    gradient_end: '#00CED1',
    preview_colors: ['#8B3A8B', '#00CED1', '#00E5EE'],
  },
  sweetest_chill: {
    name: 'The Sweetest Chill',
    primary: '#4A4A6A',
    secondary: '#7B68EE',
    accent: '#9370DB',
    gradient_start: '#483D8B',
    gradient_end: '#B0C4DE',
    preview_colors: ['#4A4A6A', '#7B68EE', '#9370DB'],
  },
  high_fashion: {
    name: 'High Fashion',
    primary: '#FFD700',
    secondary: '#FF69B4',
    accent: '#DA70D6',
    gradient_start: '#FFA500',
    gradient_end: '#BA55D3',
    preview_colors: ['#FFD700', '#FF69B4', '#DA70D6'],
  },
  cherry_soda: {
    name: 'Cherry Soda',
    primary: '#2F1F1F',
    secondary: '#DC143C',
    accent: '#F5F5DC',
    gradient_start: '#4B0000',
    gradient_end: '#8B0000',
    preview_colors: ['#2F1F1F', '#DC143C', '#F5F5DC'],
  },
  blooming: {
    name: 'Blooming',
    primary: '#F5F5DC',
    secondary: '#98FB98',
    accent: '#FFB6C1',
    gradient_start: '#FFFACD',
    gradient_end: '#FF69B4',
    preview_colors: ['#F5F5DC', '#98FB98', '#FFB6C1'],
  },
  cyberbullies: {
    name: 'Cyberbullies',
    primary: '#00CED1',
    secondary: '#4169E1',
    accent: '#0000FF',
    gradient_start: '#00BFFF',
    gradient_end: '#1E90FF',
    preview_colors: ['#00CED1', '#4169E1', '#0000FF'],
  },
  subtle_melancholy: {
    name: 'Subtle Melancholy',
    primary: '#9370DB',
    secondary: '#B0C4DE',
    accent: '#AFEEEE',
    gradient_start: '#8A7BA8',
    gradient_end: '#87CEEB',
    preview_colors: ['#9370DB', '#B0C4DE', '#AFEEEE'],
  },
  conversation_hearts: {
    name: 'Conversation Hearts',
    primary: '#FF1493',
    secondary: '#FFB6C1',
    accent: '#7FFFD4',
    gradient_start: '#FF69B4',
    gradient_end: '#40E0D0',
    preview_colors: ['#FF1493', '#FFB6C1', '#7FFFD4'],
  },
  sylveon: {
    name: 'Sylveon',
    primary: '#FFE4E1',
    secondary: '#FFB6C1',
    accent: '#B0C4DE',
    gradient_start: '#FFC0CB',
    gradient_end: '#87CEEB',
    preview_colors: ['#FFE4E1', '#FFB6C1', '#B0C4DE'],
  },
  midnight_express: {
    name: 'Midnight Express',
    primary: '#191970',
    secondary: '#4169E1',
    accent: '#6495ED',
    gradient_start: '#000080',
    gradient_end: '#4682B4',
    preview_colors: ['#191970', '#4169E1', '#6495ED'],
  },
};

// Theme type
export type ThemeKey = keyof typeof PAYSTUB_THEMES;

// Default theme
export const defaultTheme = {
  colors,
  gradients,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

export default defaultTheme;
