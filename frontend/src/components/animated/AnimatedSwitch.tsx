/**
 * ANIMATED SWITCH COMPONENT
 * Toggle switch with smooth animation and haptic feedback
 */

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { haptics } from '../../utils/haptics';
import { SPRING_CONFIG } from '../../utils/animations';

interface AnimatedSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  activeColor?: string;
  inactiveColor?: string;
}

export const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  label,
  size = 'medium',
  activeColor = '#3B82F6',
  inactiveColor = '#D1D5DB',
}) => {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, SPRING_CONFIG.snappy);
  }, [value]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    haptics.toggle();
    onValueChange(!value);
  }, [disabled, value, onValueChange]);

  const sizeConfig = {
    small: { width: 40, height: 24, thumbSize: 18 },
    medium: { width: 52, height: 30, thumbSize: 24 },
    large: { width: 64, height: 36, thumbSize: 30 },
  };

  const config = sizeConfig[size];

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor]
    );

    return {
      backgroundColor,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [2, config.width - config.thumbSize - 2]
    );

    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, 1.1, 1]
    );

    return {
      transform: [
        { translateX },
        { scale },
      ],
    };
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.container, disabled && styles.disabled]}
    >
      {label && (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          styles.track,
          {
            width: config.width,
            height: config.height,
            borderRadius: config.height / 2,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: config.thumbSize,
              height: config.thumbSize,
              borderRadius: config.thumbSize / 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    color: '#1F2937',
    marginRight: 12,
    flex: 1,
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
  track: {
    justifyContent: 'center',
  },
  thumb: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AnimatedSwitch;
