/**
 * PRICING CARD COMPONENT
 * Displays subscription plan details
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PlanConfig, pricingUtils } from '../../services/stripe';
import { extendedColors as colors, gradients, spacing, borderRadius, typography, shadows } from '../../styles/theme';

interface PricingCardProps {
  plan: PlanConfig;
  isCurrentPlan?: boolean;
  onSelect: (planId: string) => void;
  disabled?: boolean;
}

export default function PricingCard({ plan, isCurrentPlan, onSelect, disabled }: PricingCardProps) {
  const isEnterprise = plan.price === 0;

  return (
    <View style={[styles.container, plan.popular && styles.popularContainer]}>
      {/* Popular Badge */}
      {plan.popular && (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.popularBadge}
        >
          <Ionicons name="star" size={12} color="white" />
          <Text style={styles.popularBadgeText}>{plan.badge}</Text>
        </LinearGradient>
      )}

      {/* Non-popular Badge */}
      {plan.badge && !plan.popular && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      )}

      {/* Plan Header */}
      <View style={styles.header}>
        <Text style={styles.planName}>{plan.name}</Text>
        <View style={styles.priceContainer}>
          {isEnterprise ? (
            <Text style={styles.customPrice}>Custom Pricing</Text>
          ) : (
            <>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>/month</Text>
            </>
          )}
        </View>
      </View>

      {/* Employee Pricing */}
      <View style={styles.allowanceContainer}>
        <View style={styles.allowanceBadge}>
          <Ionicons name="people" size={16} color={colors.primary.purple} />
          <Text style={styles.allowanceText}>
            {plan.targetEmployees}
          </Text>
        </View>
        <Text style={styles.additionalText}>
          +${plan.pricePerEmployee.toFixed(2)} per employee/month
        </Text>
        {plan.annualSavings && (
          <Text style={styles.unlimitedText}>Save ${plan.annualSavings} with annual billing</Text>
        )}
      </View>

      {/* Features List */}
      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons 
              name="checkmark-circle" 
              size={18} 
              color={colors.status.success} 
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      {isCurrentPlan ? (
        <View style={styles.currentPlanButton}>
          <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
          <Text style={styles.currentPlanText}>Current Plan</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => onSelect(plan.id)}
          disabled={disabled}
          style={styles.selectButtonContainer}
        >
          <LinearGradient
            colors={plan.popular ? gradients.primary : ['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.selectButton, disabled && styles.buttonDisabled]}
          >
            <Text style={styles.selectButtonText}>
              {plan.popular ? 'Get Started' : 'Select Plan'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.md,
    marginBottom: spacing.lg,
    position: 'relative',
    overflow: 'visible',
  },
  popularContainer: {
    borderColor: colors.primary.purple,
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    ...shadows.glow,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: colors.surface.elevated,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  planName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  currency: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 6,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text.primary,
  },
  customPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.primary.purple,
  },
  period: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  allowanceContainer: {
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  allowanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  allowanceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  additionalText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  unlimitedText: {
    fontSize: typography.fontSize.sm,
    color: colors.status.success,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  featuresContainer: {
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  currentPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.status.successLight,
    borderRadius: borderRadius.sm,
  },
  currentPlanText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.status.success,
  },
  selectButtonContainer: {
    overflow: 'hidden',
    borderRadius: borderRadius.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  selectButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
});
