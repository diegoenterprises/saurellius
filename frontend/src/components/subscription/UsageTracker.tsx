/**
 * USAGE TRACKER COMPONENT
 * Displays current billing period usage
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UsageSummary, pricingUtils } from '../../services/stripe';
import { extendedColors as colors, gradients, spacing, borderRadius, typography, shadows } from '../../styles/theme';

interface UsageTrackerProps {
  usage: UsageSummary;
  compact?: boolean;
}

export default function UsageTracker({ usage, compact }: UsageTrackerProps) {
  const isUnlimited = usage.includedPaystubs === -1;
  const progressPercent = isUnlimited 
    ? 0 
    : Math.min(100, (usage.paystubsGenerated / usage.includedPaystubs) * 100);
  const isOverLimit = !isUnlimited && usage.paystubsGenerated > usage.includedPaystubs;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Ionicons name="document-text" size={16} color={colors.primary.purple} />
          <Text style={styles.compactLabel}>Paystubs Used</Text>
        </View>
        <Text style={styles.compactValue}>
          {usage.paystubsGenerated}
          {!isUnlimited && <Text style={styles.compactTotal}> / {usage.includedPaystubs}</Text>}
          {isUnlimited && <Text style={styles.unlimitedBadge}> ∞</Text>}
        </Text>
        {!isUnlimited && (
          <View style={styles.compactProgressBar}>
            <View 
              style={[
                styles.compactProgressFill, 
                { width: `${progressPercent}%` },
                isOverLimit && styles.overLimitFill
              ]} 
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="analytics" size={20} color={colors.primary.purple} />
          <Text style={styles.title}>Usage This Period</Text>
        </View>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{usage.plan}</Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Paystubs Generated</Text>
          <Text style={styles.progressValue}>
            {usage.paystubsGenerated}
            {!isUnlimited && (
              <Text style={styles.progressTotal}> / {usage.includedPaystubs}</Text>
            )}
          </Text>
        </View>

        {!isUnlimited && (
          <View style={styles.progressBar}>
            <LinearGradient
              colors={isOverLimit ? ['#EF4444', '#DC2626'] : gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]}
            />
          </View>
        )}

        {isUnlimited && (
          <View style={styles.unlimitedBanner}>
            <Ionicons name="infinite" size={24} color={colors.status.success} />
            <Text style={styles.unlimitedText}>Unlimited paystubs on your plan!</Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[styles.statValue, isUnlimited && styles.unlimitedValue]}>
            {pricingUtils.getRemainingText(usage.remaining)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Overage</Text>
          <Text style={[styles.statValue, usage.overageCount > 0 && styles.overageValue]}>
            {usage.overageCount} paystub{usage.overageCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Extra Charges</Text>
          <Text style={[styles.statValue, usage.overageCost > 0 && styles.overageValue]}>
            {pricingUtils.formatPrice(usage.overageCost)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total This Period</Text>
          <Text style={styles.statValue}>{pricingUtils.formatPrice(usage.totalCost)}</Text>
        </View>
      </View>

      {/* Billing Period */}
      <View style={styles.billingPeriod}>
        <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
        <Text style={styles.billingPeriodText}>
          Billing period: {new Date(usage.billingPeriodStart).toLocaleDateString()} - {new Date(usage.billingPeriodEnd).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  planBadge: {
    backgroundColor: 'rgba(190, 1, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary.purple,
    textTransform: 'uppercase',
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  progressValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  progressTotal: {
    fontWeight: '400',
    color: colors.text.secondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  unlimitedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.status.successLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  unlimitedText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.status.success,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface.elevated,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
  unlimitedValue: {
    color: colors.status.success,
  },
  overageValue: {
    color: colors.status.warning,
  },
  billingPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  billingPeriodText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  // Compact styles
  compactContainer: {
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  compactLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  compactValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  compactTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  unlimitedBadge: {
    color: colors.status.success,
  },
  compactProgressBar: {
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: colors.primary.purple,
    borderRadius: 2,
  },
  overLimitFill: {
    backgroundColor: colors.status.warning,
  },
});
