/**
 * ANIMATED NUMBER COMPONENT
 * Number with counting animation for metrics/KPIs
 */

import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { TIMING, EASING } from '../../utils/animations';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle;
  formatter?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  formatter,
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const displayValue = useDerivedValue(() => {
    const num = animatedValue.value;
    if (formatter) {
      return `${prefix}${formatter(num)}${suffix}`;
    }
    return `${prefix}${num.toFixed(decimals)}${suffix}`;
  });

  // For React Native, we need to use a different approach
  // since AnimatedProps with text doesn't work the same way
  const [display, setDisplay] = React.useState(`${prefix}0${suffix}`);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const startValue = 0;
    const endValue = value;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      
      if (formatter) {
        setDisplay(`${prefix}${formatter(currentValue)}${suffix}`);
      } else {
        setDisplay(`${prefix}${currentValue.toFixed(decimals)}${suffix}`);
      }
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, prefix, suffix, decimals, formatter]);

  return <Text style={style}>{display}</Text>;
};

// Currency formatter
export const AnimatedCurrency: React.FC<Omit<AnimatedNumberProps, 'formatter' | 'prefix'>> = (props) => (
  <AnimatedNumber
    {...props}
    prefix="$"
    formatter={(val) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  />
);

// Percentage formatter
export const AnimatedPercentage: React.FC<Omit<AnimatedNumberProps, 'formatter' | 'suffix'>> = (props) => (
  <AnimatedNumber
    {...props}
    suffix="%"
    decimals={1}
  />
);

// Compact number formatter (1K, 1M, etc.)
export const AnimatedCompactNumber: React.FC<Omit<AnimatedNumberProps, 'formatter'>> = (props) => (
  <AnimatedNumber
    {...props}
    formatter={(val) => {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toFixed(0);
    }}
  />
);

export default AnimatedNumber;
