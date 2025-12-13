/**
 * ANIMATED HEADER COMPONENT
 * Header with scroll-based animations and parallax effects
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 100;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: SharedValue<number>;
  gradientColors?: string[];
  onBackPress?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  children?: React.ReactNode;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  subtitle,
  scrollY,
  gradientColors = ['#0F172A', '#1E293B'] as const,
  onBackPress,
  rightAction,
  children,
}) => {
  const insets = useSafeAreaInsets();

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [HEADER_MAX_HEIGHT + insets.top, HEADER_MIN_HEIGHT + insets.top],
      Extrapolation.CLAMP
    );

    return { height };
  });

  const titleStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      scrollY.value,
      [0, 100],
      [28, 20],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -10],
      Extrapolation.CLAMP
    );

    return {
      fontSize,
      transform: [{ translateY }],
    };
  });

  const subtitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 50],
      [0, -20],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const childrenStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0.9],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const handleBackPress = () => {
    haptics.light();
    onBackPress?.();
  };

  const handleRightPress = () => {
    haptics.light();
    rightAction?.onPress();
  };

  return (
    <AnimatedLinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, headerStyle, { paddingTop: insets.top }]}
    >
      <View style={styles.topRow}>
        {onBackPress && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Animated.Text style={[styles.title, titleStyle]}>
            {title}
          </Animated.Text>
          {subtitle && (
            <Animated.Text style={[styles.subtitle, subtitleStyle]}>
              {subtitle}
            </Animated.Text>
          )}
        </View>
        {rightAction && (
          <TouchableOpacity
            onPress={handleRightPress}
            style={styles.rightButton}
            activeOpacity={0.7}
          >
            <Ionicons name={rightAction.icon} size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      {children && (
        <Animated.View style={[styles.children, childrenStyle]}>
          {children}
        </Animated.View>
      )}
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-end',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rightButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  children: {
    marginTop: 16,
  },
});

export default AnimatedHeader;
