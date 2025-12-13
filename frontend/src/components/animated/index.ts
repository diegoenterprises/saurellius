/**
 * ANIMATED COMPONENTS INDEX
 * Export all animation components for easy import
 */

export { AnimatedButton } from './AnimatedButton';
export { AnimatedCard } from './AnimatedCard';
export { AnimatedListItem } from './AnimatedListItem';
export { 
  SkeletonLoader, 
  SkeletonCard, 
  SkeletonList, 
  SkeletonStats 
} from './SkeletonLoader';
export { 
  SuccessAnimation, 
  ErrorAnimation, 
  Pulse, 
  BouncingDots 
} from './FeedbackAnimations';
export { AnimatedHeader } from './AnimatedHeader';
export { 
  AnimatedNumber, 
  AnimatedCurrency, 
  AnimatedPercentage, 
  AnimatedCompactNumber 
} from './AnimatedNumber';
export { AnimatedTab } from './AnimatedTab';
export { AnimatedSwitch } from './AnimatedSwitch';

// Re-export utilities
export { haptics } from '../../utils/haptics';
export * from '../../utils/animations';
