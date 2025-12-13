/**
 * SAURELLIUS ANIMATION UTILITIES
 * Reusable animation configurations and helpers
 */

import { Easing } from 'react-native-reanimated';

// Animation timing configurations
export const TIMING = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};

// Spring configurations for natural feel
export const SPRING_CONFIG = {
  gentle: {
    damping: 15,
    stiffness: 100,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 0.8,
  },
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  stiff: {
    damping: 25,
    stiffness: 400,
    mass: 0.3,
  },
};

// Easing curves
export const EASING = {
  easeInOut: Easing.bezier(0.4, 0, 0.2, 1),
  easeOut: Easing.bezier(0, 0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  sharp: Easing.bezier(0.4, 0, 0.6, 1),
  bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),
};

// Button press scale values
export const BUTTON_SCALE = {
  pressed: 0.95,
  normal: 1,
  hover: 1.02,
};

// Card interaction values
export const CARD_SCALE = {
  pressed: 0.98,
  normal: 1,
  hover: 1.01,
};

// Fade animation values
export const FADE = {
  hidden: 0,
  visible: 1,
};

// Slide animation distances
export const SLIDE = {
  short: 20,
  medium: 50,
  long: 100,
  full: 300,
};

// Rotation values (degrees)
export const ROTATE = {
  quarter: 90,
  half: 180,
  full: 360,
};

// Stagger delay for list animations
export const STAGGER_DELAY = 50;

// Animation presets for common use cases
export const PRESETS = {
  fadeInUp: {
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
  },
  fadeInDown: {
    from: { opacity: 0, translateY: -20 },
    to: { opacity: 1, translateY: 0 },
  },
  fadeInLeft: {
    from: { opacity: 0, translateX: -20 },
    to: { opacity: 1, translateX: 0 },
  },
  fadeInRight: {
    from: { opacity: 0, translateX: 20 },
    to: { opacity: 1, translateX: 0 },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
  },
  scaleOut: {
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.8 },
  },
  slideInBottom: {
    from: { translateY: 100 },
    to: { translateY: 0 },
  },
  pulse: {
    from: { scale: 1 },
    to: { scale: 1.05 },
  },
};

// Success/Error animation configurations
export const FEEDBACK_ANIMATIONS = {
  success: {
    scale: [1, 1.2, 1],
    backgroundColor: ['#22c55e', '#16a34a', '#22c55e'],
    duration: 400,
  },
  error: {
    translateX: [-5, 5, -5, 5, 0],
    duration: 300,
  },
  warning: {
    scale: [1, 1.1, 1],
    duration: 300,
  },
};

// Loading animation configurations
export const LOADING_ANIMATIONS = {
  pulse: {
    opacity: [0.3, 1, 0.3],
    duration: 1500,
  },
  skeleton: {
    translateX: [-100, 100],
    duration: 1000,
  },
  spinner: {
    rotate: [0, 360],
    duration: 1000,
  },
};

export default {
  TIMING,
  SPRING_CONFIG,
  EASING,
  BUTTON_SCALE,
  CARD_SCALE,
  FADE,
  SLIDE,
  ROTATE,
  STAGGER_DELAY,
  PRESETS,
  FEEDBACK_ANIMATIONS,
  LOADING_ANIMATIONS,
};
