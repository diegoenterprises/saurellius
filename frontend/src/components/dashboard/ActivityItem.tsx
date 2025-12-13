/**
 * ACTIVITY ITEM COMPONENT
 * With staggered entrance animation
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { extendedColors as colors, spacing, borderRadius, typography } from '../../styles/theme';

interface ActivityItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  time: string;
  index?: number;
}

export default function ActivityItem({ icon, title, time, index = 0 }: ActivityItemProps) {
  return (
    <Animated.View 
      entering={FadeInLeft.delay(index * 60).springify()}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={18} color={colors.primary.purple} />
      </View>
      <View style={styles.details}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(190, 1, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
