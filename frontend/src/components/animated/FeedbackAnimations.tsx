/**
 * FEEDBACK ANIMATIONS
 * Success, error, and notification animations
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../../utils/haptics';
import { SPRING_CONFIG, TIMING } from '../../utils/animations';

interface SuccessAnimationProps {
  visible: boolean;
  message?: string;
  onComplete?: () => void;
  style?: ViewStyle;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  visible,
  message = 'Success!',
  onComplete,
  style,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      haptics.success();
      opacity.value = withTiming(1, { duration: TIMING.fast });
      scale.value = withSpring(1, SPRING_CONFIG.bouncy);
      checkScale.value = withDelay(200, withSpring(1, SPRING_CONFIG.bouncy));
      
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } else {
      scale.value = withTiming(0, { duration: TIMING.fast });
      opacity.value = withTiming(0, { duration: TIMING.fast });
      checkScale.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.feedbackContainer, containerStyle, style]}>
      <Animated.View style={[styles.successCircle, checkStyle]}>
        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
      </Animated.View>
      <Text style={styles.successText}>{message}</Text>
    </Animated.View>
  );
};

interface ErrorAnimationProps {
  visible: boolean;
  message?: string;
  onComplete?: () => void;
  style?: ViewStyle;
}

export const ErrorAnimation: React.FC<ErrorAnimationProps> = ({
  visible,
  message = 'Error occurred',
  onComplete,
  style,
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      haptics.error();
      opacity.value = withTiming(1, { duration: TIMING.fast });
      scale.value = withSpring(1, SPRING_CONFIG.bouncy);
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } else {
      scale.value = withTiming(0, { duration: TIMING.fast });
      opacity.value = withTiming(0, { duration: TIMING.fast });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.feedbackContainer, containerStyle, style]}>
      <View style={styles.errorCircle}>
        <Ionicons name="close" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
};

interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  color?: string;
  style?: ViewStyle;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  active = true,
  color = '#3B82F6',
  style,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      );
      opacity.value = withSequence(
        withTiming(0.2, { duration: 600 }),
        withTiming(0.6, { duration: 600 })
      );
      
      const interval = setInterval(() => {
        scale.value = withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        );
        opacity.value = withSequence(
          withTiming(0.2, { duration: 600 }),
          withTiming(0.6, { duration: 600 })
        );
      }, 1200);
      
      return () => clearInterval(interval);
    }
  }, [active]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.pulseContainer, style]}>
      <Animated.View
        style={[
          styles.pulseRing,
          { borderColor: color },
          pulseStyle,
        ]}
      />
      {children}
    </View>
  );
};

interface BouncingDotsProps {
  color?: string;
  size?: number;
}

export const BouncingDots: React.FC<BouncingDotsProps> = ({
  color = '#3B82F6',
  size = 8,
}) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      dot1.value = withSequence(
        withTiming(-8, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
      dot2.value = withDelay(150, withSequence(
        withTiming(-8, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ));
      dot3.value = withDelay(300, withSequence(
        withTiming(-8, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ));
    };
    
    animate();
    const interval = setInterval(animate, 900);
    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size }, dot1Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size }, dot2Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, width: size, height: size }, dot3Style]} />
    </View>
  );
};

const styles = StyleSheet.create({
  feedbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pulseContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 100,
    borderWidth: 3,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 100,
  },
});

export default {
  SuccessAnimation,
  ErrorAnimation,
  Pulse,
  BouncingDots,
};
