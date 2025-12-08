/**
 * 📊 STATS CARD
 * Dashboard statistics display card
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../styles/theme';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradientColors?: [string, string];
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  gradientColors = ['#1473FF', '#BE01FF'],
}: StatsCardProps) {
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
      <Text style={styles.title}>{title}</Text>
      
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend.isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend.isPositive ? '#10b981' : '#ef4444'}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend.isPositive ? '#10b981' : '#ef4444' },
            ]}
          >
            {trend.value}%
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
