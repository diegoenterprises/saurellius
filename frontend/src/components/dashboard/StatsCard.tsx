/**
 * STATS CARD
 * Dashboard statistics display card
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../styles/theme';

interface StatsCardProps {
  title?: string;
  label?: string; // Alias for title
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: string | {
    value: number;
    isPositive: boolean;
  };
  trendUp?: boolean; // Simplified trend direction
  gradientColors?: [string, string];
}

export default function StatsCard({
  title,
  label,
  value,
  icon,
  trend,
  trendUp = true,
  gradientColors = ['#1473FF', '#BE01FF'],
}: StatsCardProps) {
  // Support both title and label props
  const displayTitle = title || label || '';
  
  // Support both string and object trend formats
  const getTrendInfo = () => {
    if (!trend) return null;
    if (typeof trend === 'string') {
      return { text: trend, isPositive: trendUp };
    }
    return { text: `${trend.value}%`, isPositive: trend.isPositive };
  };
  
  const trendInfo = getTrendInfo();
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="rgba(255,255,255,0.9)" />
      </View>
      
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{displayTitle}</Text>
      
      {trendInfo && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trendInfo.isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trendInfo.isPositive ? '#10b981' : '#ef4444'}
          />
          <Text
            style={[
              styles.trendText,
              { color: trendInfo.isPositive ? '#10b981' : '#ef4444' },
            ]}
          >
            {trendInfo.text}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    minHeight: 120,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
});
