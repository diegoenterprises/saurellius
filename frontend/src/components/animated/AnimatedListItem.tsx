/**
 * ANIMATED LIST ITEM COMPONENT
 * List item with staggered entrance animation and swipe actions
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeInRight,
  FadeInLeft,
  Layout,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../../utils/haptics';
import { SPRING_CONFIG, TIMING, STAGGER_DELAY } from '../../utils/animations';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  onPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    backgroundColor: string;
  };
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    backgroundColor: string;
  };
  style?: ViewStyle;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  onPress,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  style,
}) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * STAGGER_DELAY;
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG.gentle));
  }, []);

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.98, SPRING_CONFIG.snappy);
    })
    .onFinalize(() => {
      scale.value = withSpring(1, SPRING_CONFIG.bouncy);
    })
    .onEnd(() => {
      if (onPress) {
        haptics.light();
        onPress();
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      const maxSwipe = 80;
      if (event.translationX > 0 && onSwipeRight) {
        translateX.value = Math.min(event.translationX, maxSwipe);
      } else if (event.translationX < 0 && onSwipeLeft) {
        translateX.value = Math.max(event.translationX, -maxSwipe);
      }
    })
    .onEnd((event) => {
      const threshold = 60;
      if (translateX.value > threshold && onSwipeRight) {
        haptics.medium();
        onSwipeRight();
      } else if (translateX.value < -threshold && onSwipeLeft) {
        haptics.medium();
        onSwipeLeft();
      }
      translateX.value = withSpring(0, SPRING_CONFIG.bouncy);
    });

  const gesture = Gesture.Race(tap, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? translateX.value / 80 : 0,
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.abs(translateX.value) / 80 : 0,
  }));

  return (
    <View style={styles.container}>
      {leftAction && (
        <Animated.View style={[styles.actionLeft, { backgroundColor: leftAction.backgroundColor }, leftActionStyle]}>
          <Ionicons name={leftAction.icon} size={24} color={leftAction.color} />
        </Animated.View>
      )}
      {rightAction && (
        <Animated.View style={[styles.actionRight, { backgroundColor: rightAction.backgroundColor }, rightActionStyle]}>
          <Ionicons name={rightAction.icon} size={24} color={rightAction.color} />
        </Animated.View>
      )}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.item, animatedStyle, style]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 8,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  actionRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default AnimatedListItem;
