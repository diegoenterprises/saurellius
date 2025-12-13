/**
 * ANIMATED CARD COMPONENT
 * Card with press animation and subtle lift effect
 */

import React, { useCallback } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { haptics } from '../../utils/haptics';
import { SPRING_CONFIG, CARD_SCALE, TIMING } from '../../utils/animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  pressable?: boolean;
  elevated?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  pressable = true,
  elevated = true,
}) => {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const tap = Gesture.Tap()
    .onBegin(() => {
      if (pressable) {
        scale.value = withSpring(CARD_SCALE.pressed, SPRING_CONFIG.snappy);
        pressed.value = withTiming(1, { duration: TIMING.fast });
      }
    })
    .onFinalize(() => {
      scale.value = withSpring(CARD_SCALE.normal, SPRING_CONFIG.bouncy);
      pressed.value = withTiming(0, { duration: TIMING.fast });
    })
    .onEnd(() => {
      if (onPress && pressable) {
        haptics.light();
        onPress();
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(pressed.value, [0, 1], [0.1, 0.2]);
    const translateY = interpolate(pressed.value, [0, 1], [0, 2]);
    const elevation = interpolate(pressed.value, [0, 1], [elevated ? 4 : 0, 2]);

    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY },
      ],
      shadowOpacity: shadowOpacity,
      elevation: elevation,
    };
  });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.card,
          elevated && styles.elevated,
          animatedStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});

export default AnimatedCard;
