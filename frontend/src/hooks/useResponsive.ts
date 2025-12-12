/**
 * RESPONSIVE HOOK
 * Detects screen size and provides responsive utilities
 */

import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveValues {
  screenWidth: number;
  screenHeight: number;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: ScreenSize;
  // Responsive spacing
  horizontalPadding: number;
  containerMaxWidth: number | '100%';
  // Grid columns
  gridColumns: number;
  // Font scale
  fontScale: number;
}

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export function useResponsive(): ResponsiveValues {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isWeb = Platform.OS === 'web';

  // Determine screen size
  let screenSize: ScreenSize = 'mobile';
  if (width >= BREAKPOINTS.desktop) {
    screenSize = 'desktop';
  } else if (width >= BREAKPOINTS.tablet) {
    screenSize = 'tablet';
  }

  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';
  const isDesktop = screenSize === 'desktop';

  // Responsive values
  const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32;
  const containerMaxWidth = isDesktop ? 1400 : '100%';
  const gridColumns = isMobile ? 1 : isTablet ? 2 : 3;
  const fontScale = isMobile ? 1 : isTablet ? 1.05 : 1.1;

  return {
    screenWidth: width,
    screenHeight: height,
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    horizontalPadding,
    containerMaxWidth,
    gridColumns,
    fontScale,
  };
}

// Responsive style helpers
export const responsive = {
  // Get value based on screen size
  value: <T,>(mobile: T, tablet: T, desktop: T, screenSize: ScreenSize): T => {
    switch (screenSize) {
      case 'desktop': return desktop;
      case 'tablet': return tablet;
      default: return mobile;
    }
  },

  // Container styles for centered content on web
  container: (maxWidth: number | '100%', padding: number) => ({
    width: '100%' as const,
    maxWidth,
    marginHorizontal: 'auto' as const,
    paddingHorizontal: padding,
  }),

  // Grid styles
  grid: (columns: number, gap: number) => ({
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginHorizontal: -gap / 2,
  }),

  gridItem: (columns: number, gap: number) => ({
    width: `${100 / columns}%` as const,
    paddingHorizontal: gap / 2,
    marginBottom: gap,
  }),
};

export default useResponsive;
