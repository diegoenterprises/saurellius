/**
 * 💳 STRIPE SERVICE
 * Subscription and billing integration
 */

import api from './api';

// ============================================================================
// STRIPE PRICING CONFIGURATION
// ============================================================================

export const STRIPE_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_xxxxx',
};

// Plan configurations matching the pricing guide
export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  includedPaystubs: number;
  additionalCost: number;
  features: string[];
  badge?: string;
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 50.00,
    includedPaystubs: 5,
    additionalCost: 5.00,
    features: [
      'All 50 states supported',
      'Complete tax calculations (Federal, State, Local, FICA)',
      'YTD tracking',
      'Premium PDF templates',
      'QR verification',
      'Standard document security',
      'Email support (48hr response)',
      '1 year storage',
    ],
    badge: 'SMALL BUSINESS',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 100.00,
    includedPaystubs: 25,
    additionalCost: 5.00,
    features: [
      'Everything in Starter',
      'PTO tracking (Vacation, Sick, Personal)',
      'Custom branding (logo & colors)',
      'Bulk generation (up to 25 at once)',
      'API access (beta)',
      'Priority email support (24hr)',
      '3 year storage',
      '3 users included',
      'CSV & Excel exports',
      'Custom deduction templates',
    ],
    badge: 'MOST POPULAR',
    popular: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 150.00,
    includedPaystubs: -1, // Unlimited
    additionalCost: 0,
    features: [
      'Everything in Professional',
      'UNLIMITED paystubs',
      'White-label (remove Saurellius branding)',
      'Full API access + webhooks',
      'Dedicated account manager + phone support',
      'Unlimited storage',
      'Unlimited users + role management',
      'SSO (Single Sign-On) available',
      'Custom integrations',
      '99.9% uptime SLA',
      'Advanced analytics dashboard',
      'Complete audit logs',
    ],
    badge: 'ENTERPRISE',
  },
};

// ============================================================================
// STRIPE API SERVICE
// ============================================================================

export const stripeService = {
  /**
   * Create a checkout session for subscription
   */
  createCheckoutSession: async (plan: string): Promise<{ checkoutUrl: string; sessionId: string }> => {
    const response = await api.post('/stripe/create-checkout-session', { plan });
    return response.data;
  },

  /**
   * Create billing portal session for managing subscription
   */
  createBillingPortal: async (): Promise<{ url: string }> => {
    const response = await api.post('/stripe/billing-portal');
    return response.data;
  },

  /**
   * Get current billing information
   */
  getBillingInfo: async (): Promise<BillingInfo> => {
    const response = await api.get('/dashboard/billing');
    return response.data.billing;
  },

  /**
   * Get usage summary for current billing period
   */
  getUsageSummary: async (): Promise<UsageSummary> => {
    const response = await api.get('/billing/usage');
    return response.data;
  },

  /**
   * Check if user can generate another paystub
   */
  checkPaystubLimit: async (): Promise<PaystubLimitCheck> => {
    const response = await api.get('/billing/check-limit');
    return response.data;
  },

  /**
   * Get available plans
   */
  getPlans: async (): Promise<PlanConfig[]> => {
    // Returns client-side config, could be fetched from backend
    return Object.values(SUBSCRIPTION_PLANS);
  },

  /**
   * Upgrade subscription plan
   */
  upgradePlan: async (newPlan: string): Promise<{ success: boolean; checkoutUrl?: string }> => {
    const response = await api.post('/stripe/upgrade-plan', { plan: newPlan });
    return response.data;
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (): Promise<{ success: boolean }> => {
    const response = await api.post('/stripe/cancel-subscription');
    return response.data;
  },

  /**
   * Reactivate cancelled subscription
   */
  reactivateSubscription: async (): Promise<{ success: boolean }> => {
    const response = await api.post('/stripe/reactivate-subscription');
    return response.data;
  },
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BillingInfo {
  currentPlan: {
    tier: string;
    name: string;
    monthlyPrice: number;
    includedPaystubs: number;
    additionalCost: number;
    features: string[];
  };
  usage: UsageSummary;
  subscriptionStatus: 'active' | 'past_due' | 'cancelled' | 'trialing' | 'incomplete';
}

export interface UsageSummary {
  plan: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  includedPaystubs: number;
  paystubsGenerated: number;
  remaining: number;
  overageCount: number;
  overageCost: number;
  totalCost: number;
}

export interface PaystubLimitCheck {
  allowed: boolean;
  remaining: number;
  overage: number;
  cost: number;
  message: string;
}

// ============================================================================
// PRICING UTILITIES
// ============================================================================

export const pricingUtils = {
  /**
   * Calculate total cost for a given number of paystubs
   */
  calculateCost: (plan: string, paystubCount: number): number => {
    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig) return 0;

    if (planConfig.includedPaystubs === -1) {
      return planConfig.price; // Unlimited plan
    }

    const overage = Math.max(0, paystubCount - planConfig.includedPaystubs);
    return planConfig.price + (overage * planConfig.additionalCost);
  },

  /**
   * Get savings comparison vs per-paystub pricing
   */
  calculateSavings: (plan: string, paystubCount: number): number => {
    const perPaystubCost = 5.00;
    const withoutPlan = paystubCount * perPaystubCost;
    const withPlan = pricingUtils.calculateCost(plan, paystubCount);
    return Math.max(0, withoutPlan - withPlan);
  },

  /**
   * Recommend best plan based on expected usage
   */
  recommendPlan: (expectedPaystubs: number): string => {
    if (expectedPaystubs <= 5) return 'starter';
    if (expectedPaystubs <= 30) return 'professional';
    return 'business';
  },

  /**
   * Format price for display
   */
  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  /**
   * Get remaining paystubs display text
   */
  getRemainingText: (remaining: number): string => {
    if (remaining === -1) return 'Unlimited';
    if (remaining === 0) return 'No included paystubs remaining';
    return `${remaining} paystub${remaining === 1 ? '' : 's'} remaining`;
  },
};

export default stripeService;
