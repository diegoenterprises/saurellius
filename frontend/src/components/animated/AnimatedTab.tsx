/**
 * ANIMATED TAB COMPONENT
 * Tab bar with animated indicator and press effects
 */

import React, { useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedRef,
  scrollTo,
  runOnUI,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../../utils/haptics';
import { SPRING_CONFIG, TIMING } from '../../utils/animations';

interface Tab {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

interface AnimatedTabProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  scrollable?: boolean;
}

export const AnimatedTab: React.FC<AnimatedTabProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  scrollable = false,
}) => {
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const handleTabPress = useCallback((key: string, index: number) => {
    haptics.tabChange();
    onTabChange(key);
  }, [onTabChange]);

  const TabItem = ({ tab, index }: { tab: Tab; index: number }) => {
    const isActive = activeTab === tab.key;
    const scale = useSharedValue(1);

    const handlePressIn = () => {
      scale.value = withSpring(0.95, SPRING_CONFIG.snappy);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, SPRING_CONFIG.bouncy);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <TouchableOpacity
        onPress={() => handleTabPress(tab.key, index)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.tabItem,
          variant === 'pills' && styles.pillItem,
          variant === 'pills' && isActive && styles.pillItemActive,
        ]}
      >
        <Animated.View style={[styles.tabContent, animatedStyle]}>
          {tab.icon && (
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? '#3B82F6' : '#6B7280'}
              style={styles.tabIcon}
            />
          )}
          <Text
            style={[
              styles.tabLabel,
              isActive && styles.tabLabelActive,
              variant === 'pills' && isActive && styles.pillLabelActive,
            ]}
          >
            {tab.label}
          </Text>
          {tab.badge !== undefined && tab.badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </Text>
            </View>
          )}
        </Animated.View>
        {variant === 'underline' && isActive && (
          <Animated.View style={styles.underline} />
        )}
      </TouchableOpacity>
    );
  };

  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? { horizontal: true, showsHorizontalScrollIndicator: false }
    : {};

  return (
    <Container
      style={[
        styles.container,
        variant === 'pills' && styles.pillsContainer,
      ]}
      {...containerProps}
    >
      {tabs.map((tab, index) => (
        <TabItem key={tab.key} tab={tab} index={index} />
      ))}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pillsContainer: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pillItem: {
    flex: 0,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  pillItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  pillLabelActive: {
    color: '#1F2937',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 1.5,
  },
  badge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AnimatedTab;
