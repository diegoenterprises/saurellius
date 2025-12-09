/**
 * 🎨 THEME CONFIGURATION
 * Colors, fonts, spacing, and design tokens
 */

// Primary Colors
export const colors = {
  // Brand colors
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
  
  // Text
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Border
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

// Shadows
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
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  glow: {
    shadowColor: '#1473FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Typography (for structured access)
export const typography = {
  fontSize: {
    xs: 10,
    sm: 12,
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
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

// Paystub Theme Colors (25 themes)
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
  modern_tech: {
    name: 'Modern Tech',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    gradient_start: '#3B82F6',
    gradient_end: '#8B5CF6',
    preview_colors: ['#3B82F6', '#8B5CF6', '#06B6D4'],
  },
  forest_green: {
    name: 'Forest Green',
    primary: '#059669',
    secondary: '#10B981',
    accent: '#34D399',
    gradient_start: '#059669',
    gradient_end: '#10B981',
    preview_colors: ['#059669', '#10B981', '#34D399'],
  },
  sunset_orange: {
    name: 'Sunset Orange',
    primary: '#EA580C',
    secondary: '#F97316',
    accent: '#FB923C',
    gradient_start: '#EA580C',
    gradient_end: '#F97316',
    preview_colors: ['#EA580C', '#F97316', '#FB923C'],
  },
  ocean_blue: {
    name: 'Ocean Blue',
    primary: '#0284C7',
    secondary: '#0EA5E9',
    accent: '#38BDF8',
    gradient_start: '#0284C7',
    gradient_end: '#0EA5E9',
    preview_colors: ['#0284C7', '#0EA5E9', '#38BDF8'],
  },
  royal_purple: {
    name: 'Royal Purple',
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    accent: '#A78BFA',
    gradient_start: '#7C3AED',
    gradient_end: '#8B5CF6',
    preview_colors: ['#7C3AED', '#8B5CF6', '#A78BFA'],
  },
  crimson_red: {
    name: 'Crimson Red',
    primary: '#DC2626',
    secondary: '#EF4444',
    accent: '#F87171',
    gradient_start: '#DC2626',
    gradient_end: '#EF4444',
    preview_colors: ['#DC2626', '#EF4444', '#F87171'],
  },
  golden_hour: {
    name: 'Golden Hour',
    primary: '#D97706',
    secondary: '#F59E0B',
    accent: '#FBBF24',
    gradient_start: '#D97706',
    gradient_end: '#F59E0B',
    preview_colors: ['#D97706', '#F59E0B', '#FBBF24'],
  },
  midnight: {
    name: 'Midnight',
    primary: '#1E3A5F',
    secondary: '#2563EB',
    accent: '#3B82F6',
    gradient_start: '#1E3A5F',
    gradient_end: '#2563EB',
    preview_colors: ['#1E3A5F', '#2563EB', '#3B82F6'],
  },
  rose_gold: {
    name: 'Rose Gold',
    primary: '#BE185D',
    secondary: '#EC4899',
    accent: '#F472B6',
    gradient_start: '#BE185D',
    gradient_end: '#EC4899',
    preview_colors: ['#BE185D', '#EC4899', '#F472B6'],
  },
  corporate_blue: {
    name: 'Corporate Blue',
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#60A5FA',
    gradient_start: '#1E40AF',
    gradient_end: '#3B82F6',
    preview_colors: ['#1E40AF', '#3B82F6', '#60A5FA'],
  },
  nature_green: {
    name: 'Nature Green',
    primary: '#166534',
    secondary: '#22C55E',
    accent: '#4ADE80',
    gradient_start: '#166534',
    gradient_end: '#22C55E',
    preview_colors: ['#166534', '#22C55E', '#4ADE80'],
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
