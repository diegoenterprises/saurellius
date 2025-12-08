/**
 * 💳 SUBSCRIPTION CARD COMPONENT
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, gradients } from '../../styles/theme';

interface SubscriptionCardProps {
  plan: string;
  onUpgrade?: () => void;
}

const planDetails: Record<string, { name: string; description: string; colors: string[] }> = {
  starter: {
    name: 'Starter Plan',
    description: '10 paystubs/month',
    colors: ['#6B7280', '#4B5563'],
  },
  professional: {
    name: 'Professional Plan',
    description: '30 paystubs/month • Premium templates',
    colors: ['#FBBF24', '#F59E0B'],
  },
  business: {
    name: 'Business Plan',
    description: 'Unlimited paystubs • All features',
    colors: gradients.primary,
  },
};

export default function SubscriptionCard({ plan, onUpgrade }: SubscriptionCardProps) {
  const details = planDetails[plan.toLowerCase()] || planDetails.professional;

  return (
    <LinearGradient
      colors={details.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.content}>
        <Text style={styles.planName}>{details.name}</Text>
        <Text style={styles.planDescription}>{details.description}</Text>
        
        {plan !== 'business' && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Ionicons name="sparkles" size={16} color="#F59E0B" />
            <Text style={styles.upgradeText}>Upgrade to Business</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
  planName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: spacing.md,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'white',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
  },
  upgradeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
