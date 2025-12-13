/**
 * SKELETON LOADER COMPONENT
 * Animated placeholder for loading states
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circle' | 'rect' | 'card';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  variant = 'rect',
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-200, 200]);
    return {
      transform: [{ translateX }],
    };
  });

  const getVariantStyle = () => {
    switch (variant) {
      case 'circle':
        return { width: height, height, borderRadius: height / 2 };
      case 'text':
        return { width, height: 16, borderRadius: 4 };
      case 'card':
        return { width: '100%', height: 120, borderRadius: 12 };
      default:
        return { width, height, borderRadius };
    }
  };

  return (
    <View style={[styles.container, getVariantStyle(), style]}>
      <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton presets for common layouts
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <SkeletonLoader variant="circle" height={48} />
    <View style={styles.cardContent}>
      <SkeletonLoader width="60%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="80%" height={12} />
    </View>
  </View>
);

export const SkeletonList: React.FC<{ count?: number; style?: ViewStyle }> = ({ 
  count = 5, 
  style 
}) => (
  <View style={style}>
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={styles.listItem}>
        <SkeletonLoader variant="circle" height={40} />
        <View style={styles.listContent}>
          <SkeletonLoader width="70%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonLoader width="50%" height={12} />
        </View>
      </View>
    ))}
  </View>
);

export const SkeletonStats: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.stats, style]}>
    {[1, 2, 3, 4].map((_, index) => (
      <View key={index} style={styles.statItem}>
        <SkeletonLoader width={60} height={28} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={80} height={12} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shimmerContainer: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    width: 200,
    height: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
  },
});

export default SkeletonLoader;
