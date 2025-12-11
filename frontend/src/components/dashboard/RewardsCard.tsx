/**
 * REWARDS CARD COMPONENT
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, gradients } from '../../styles/theme';

interface RewardsCardProps {
  tier: string;
  points: number;
  progress: number;
  pointsToNext: number;
  nextTier: string;
  onPress?: () => void;
}

// Tier icons removed - using text only

export default function RewardsCard({ tier, points, progress, pointsToNext, nextTier, onPress }: RewardsCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={gradients.rewards}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{tier} Tier</Text>
          </View>
          
          <Text style={styles.pointsDisplay}>{points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>Reward Points</Text>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          
          <Text style={styles.nextTierText}>
            {pointsToNext.toLocaleString()} points until {nextTier} Tier
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  tierBadgeText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  pointsDisplay: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  nextTierText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
