/**
 * ANIMATED BUTTON COMPONENT
 * Button with press animation, haptic feedback, and loading state
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../../utils/haptics';
import { SPRING_CONFIG, BUTTON_SCALE, TIMING } from '../../utils/animations';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  gradient?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  gradient,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(BUTTON_SCALE.pressed, SPRING_CONFIG.snappy);
    opacity.value = withTiming(0.9, { duration: TIMING.fast });
    haptics.buttonPress();
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(BUTTON_SCALE.normal, SPRING_CONFIG.bouncy);
    opacity.value = withTiming(1, { duration: TIMING.fast });
  }, []);

  const handlePress = useCallback(() => {
    if (!loading && !disabled) {
      onPress();
    }
  }, [onPress, loading, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    medium: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 },
    large: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 },
  };

  const variantStyles: Record<string, { background: string[]; textColor: string; borderColor?: string }> = {
    primary: {
      background: gradient || ['#3B82F6', '#1D4ED8'],
      textColor: '#FFFFFF',
    },
    secondary: {
      background: ['#6B7280', '#4B5563'],
      textColor: '#FFFFFF',
    },
    outline: {
      background: ['transparent', 'transparent'],
      textColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    ghost: {
      background: ['transparent', 'transparent'],
      textColor: '#3B82F6',
    },
    danger: {
      background: ['#EF4444', '#DC2626'],
      textColor: '#FFFFFF',
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  const iconSize = size === 'small' ? 16 : size === 'large' ? 22 : 18;

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={currentVariant.textColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={currentVariant.textColor}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: currentVariant.textColor, fontSize: currentSize.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={currentVariant.textColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </>
  );

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        animatedStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
    >
      <AnimatedLinearGradient
        colors={currentVariant.background as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.button,
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
          variant === 'outline' && {
            borderWidth: 2,
            borderColor: currentVariant.borderColor,
          },
          style,
        ]}
      >
        {renderContent()}
      </AnimatedLinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default AnimatedButton;
