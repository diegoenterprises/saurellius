/**
 * SAURELLIUS BACK BUTTON
 * Standardized back button component for consistent navigation across all screens
 * Supports multiple visual styles while maintaining consistent behavior
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface BackButtonProps {
  /** Visual style variant */
  variant?: 'light' | 'dark' | 'gradient' | 'transparent';
  /** Icon size - defaults to 24 */
  size?: number;
  /** Custom onPress handler - defaults to navigation.goBack() */
  onPress?: () => void;
  /** Additional style overrides */
  style?: ViewStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
}

const VARIANTS = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    iconColor: '#FFFFFF',
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    iconColor: '#1F2937',
  },
  gradient: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    iconColor: '#FFFFFF',
  },
  transparent: {
    backgroundColor: 'transparent',
    iconColor: '#6B7280',
  },
};

export default function BackButton({
  variant = 'light',
  size = 24,
  onPress,
  style,
  accessibilityLabel = 'Go back',
}: BackButtonProps) {
  const navigation = useNavigation();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  const variantStyle = VARIANTS[variant];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: variantStyle.backgroundColor },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons
        name="arrow-back"
        size={size}
        color={variantStyle.iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
