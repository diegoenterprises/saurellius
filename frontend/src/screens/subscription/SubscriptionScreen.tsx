/**
 * SUBSCRIPTION SCREEN
 * Plan selection and billing management
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { AppDispatch, RootState } from '../../store';
import { 
  fetchSubscription, 
  createCheckoutSession, 
  openBillingPortal,
} from '../../store/slices/billingSlice';
import { SUBSCRIPTION_PLANS } from '../../services/stripe';
import PricingCard from '../../components/subscription/PricingCard';
import UsageTracker from '../../components/subscription/UsageTracker';
import { extendedColors as colors, gradients, spacing, borderRadius, typography, shadows } from '../../styles/theme';

export default function SubscriptionScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { subscription, usage, isLoading } = useSelector(
    (state: RootState) => state.billing
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSubscription());
  }, [dispatch]);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    
    if (subscription?.tier === planId) {
      Toast.show({
        type: 'info',
        text1: 'Current Plan',
        text2: 'You are already on this plan',
      });
      return;
    }

    try {
      await dispatch(createCheckoutSession(planId)).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Redirecting to checkout...',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error || 'Failed to create checkout session',
      });
    }
    setSelectedPlan(null);
  };

  const handleManageBilling = async () => {
    try {
      const result = await dispatch(openBillingPortal()).unwrap();
      if (result.url) {
        Linking.openURL(result.url);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error || 'Failed to open billing portal',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Subscription Plans</Text>
          <Text style={styles.headerSubtitle}>
            Choose the perfect plan for your business
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Usage */}
        {usage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Usage</Text>
            <UsageTracker usage={usage} />
            
            {subscription?.status === 'active' && (
              <TouchableOpacity 
                style={styles.manageBillingButton}
                onPress={handleManageBilling}
              >
                <Ionicons name="card-outline" size={18} color={colors.primary.purple} />
                <Text style={styles.manageBillingText}>Manage Billing</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Plans Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          <Text style={styles.sectionSubtitle}>
            All plans include complete tax calculations for all 50 states
          </Text>

          {isLoading && !subscription ? (
            <ActivityIndicator size="large" color={colors.primary.purple} />
          ) : (
            <View style={styles.plansContainer}>
              {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={subscription?.tier === plan.id}
                  onSelect={handleSelectPlan}
                  disabled={selectedPlan === plan.id}
                />
              ))}
            </View>
          )}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens if I exceed my paystub limit?</Text>
            <Text style={styles.faqAnswer}>
              Additional paystubs are billed at $5.00 each and added to your next invoice. 
              Business plan users have unlimited paystubs with no extra charges.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I upgrade or downgrade anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can change your plan at any time. Upgrades take effect immediately, 
              while downgrades take effect at the start of your next billing cycle.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              New users get a 14-day free trial of the Professional plan with access 
              to all features. No credit card required to start.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit cards (Visa, Mastercard, American Express, Discover) 
              through our secure Stripe payment processing.
            </Text>
          </View>
        </View>

        {/* Contact Support */}
        <View style={[styles.section, styles.supportSection]}>
          <View style={styles.supportIcon}>
            <Ionicons name="headset" size={32} color={colors.primary.purple} />
          </View>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            Our team is here to help you choose the right plan for your business.
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerContent: {},
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: 'white',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  plansContainer: {
    gap: spacing.lg,
  },
  manageBillingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary.purple,
  },
  manageBillingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary.purple,
  },
  faqItem: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  faqQuestion: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  supportSection: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  supportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(190, 1, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  supportTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  supportText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  supportButton: {
    backgroundColor: colors.primary.purple,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
  },
  supportButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: 'white',
  },
});
