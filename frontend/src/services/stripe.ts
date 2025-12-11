/**
 * STRIPE SERVICE
 * Subscription and billing integration
 */

import api from './api';

// ============================================================================
// STRIPE PRICING CONFIGURATION
// ============================================================================

export const STRIPE_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_xxxxx',
};

// Plan configurations based on competitor analysis
export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  pricePerEmployee: number;
  targetEmployees: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  annualPrice?: number;
  annualSavings?: number;
}

export const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 39.00,
    pricePerEmployee: 5.00,
    targetEmployees: '1-25 employees',
    features: [
      'Full-service payroll processing',
      'Unlimited payroll runs',
      'Federal, state, local tax filing',
      'W-2 and 1099 preparation',
      'Direct deposit (2-day)',
      'Employee self-service portal',
      'Basic reporting',
      'Email support',
    ],
    badge: 'SMALL BUSINESS',
    annualPrice: 399,
    annualSavings: 69,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 79.00,
    pricePerEmployee: 8.00,
    targetEmployees: '10-100 employees',
    features: [
      'Everything in Starter, plus:',
      'Same-day direct deposit',
      'Time tracking & scheduling',
      'PTO management',
      'Benefits administration',
      'Digital Wallet & EWA',
      'HR document storage',
      'Onboarding workflows',
      'Priority email & chat support',
      'Custom reporting',
    ],
    badge: 'MOST POPULAR',
    popular: true,
    annualPrice: 799,
    annualSavings: 149,
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 149.00,
    pricePerEmployee: 10.00,
    targetEmployees: '50-500 employees',
    features: [
      'Everything in Professional, plus:',
      'Talent Management (ATS, Performance Reviews)',
      'Learning Management System (LMS)',
      'Goal Setting & OKRs',
      '360-Degree Feedback',
      'Advanced Analytics & Predictive Insights',
      'Job Costing & Labor Allocation',
      'FMLA Tracking',
      '401(k) Administration',
      'Dedicated account manager',
      'Phone support',
    ],
    badge: 'MID-MARKET',
    annualPrice: 1499,
    annualSavings: 289,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom pricing
    pricePerEmployee: 12.00,
    targetEmployees: '250+ employees',
    features: [
      'Everything in Business, plus:',
      'Canadian payroll support',
      'Multi-currency (USD/CAD)',
      'Custom integrations',
      'Full API access',
      'Advanced compliance tools',
      'Succession planning',
      'Compensation benchmarking',
      'Dedicated implementation team',
      '24/7 phone support',
      'SLA guarantees',
    ],
    badge: 'ENTERPRISE',
  },
};

// Volume discount structure
export const VOLUME_DISCOUNTS = [
  { minEmployees: 1, maxEmployees: 25, discount: 0, label: 'Standard pricing' },
  { minEmployees: 26, maxEmployees: 50, discount: 5, label: '5% discount' },
  { minEmployees: 51, maxEmployees: 100, discount: 10, label: '10% discount' },
  { minEmployees: 101, maxEmployees: 250, discount: 15, label: '15% discount' },
  { minEmployees: 251, maxEmployees: 500, discount: 20, label: '20% discount' },
  { minEmployees: 501, maxEmployees: Infinity, discount: 25, label: 'Custom negotiated' },
];

// Add-on pricing
export const ADDON_PRICING = {
  sameDayACH: { price: 2.00, unit: 'per payment', includedIn: ['professional', 'business', 'enterprise'] },
  instantPay: { price: 1.99, unit: 'per transaction', note: 'Employee-paid option available' },
  backgroundChecks: { min: 25, max: 75, unit: 'per check', note: 'Tiered by depth' },
  workersComp: { price: 5.00, unit: 'per employee/month', note: 'Pay-as-you-go option' },
  garnishment: { price: 3.00, unit: 'per garnishment/month' },
  filing1099: { price: 5.00, unit: 'per contractor', note: 'Annual' },
  additionalState: { price: 10.00, unit: 'per state/month', note: 'Beyond primary state' },
  apiAccess: { price: 99.00, unit: 'per month', includedIn: ['enterprise'] },
  customIntegration: { setup: 499, monthly: 49, unit: 'per integration' },
  certifiedPayroll: { price: 25.00, unit: 'per month', note: 'For government contractors' },
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
   * Calculate total monthly cost for a given number of employees
   */
  calculateMonthlyCost: (plan: string, employeeCount: number): number => {
    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig) return 0;

    if (planConfig.price === 0) {
      // Enterprise - custom pricing
      return employeeCount * planConfig.pricePerEmployee;
    }

    const discount = pricingUtils.getVolumeDiscount(employeeCount);
    const employeeCost = employeeCount * planConfig.pricePerEmployee * (1 - discount / 100);
    return planConfig.price + employeeCost;
  },

  /**
   * Get volume discount percentage based on employee count
   */
  getVolumeDiscount: (employeeCount: number): number => {
    const tier = VOLUME_DISCOUNTS.find(
      t => employeeCount >= t.minEmployees && employeeCount <= t.maxEmployees
    );
    return tier?.discount || 0;
  },

  /**
   * Calculate annual savings with prepayment
   */
  calculateAnnualSavings: (plan: string, employeeCount: number): number => {
    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig || !planConfig.annualSavings) return 0;
    return planConfig.annualSavings;
  },

  /**
   * Recommend best plan based on employee count
   */
  recommendPlan: (employeeCount: number): string => {
    if (employeeCount <= 25) return 'starter';
    if (employeeCount <= 100) return 'professional';
    if (employeeCount <= 500) return 'business';
    return 'enterprise';
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
   * Get pricing display text for a plan
   */
  getPricingText: (plan: string): string => {
    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig) return '';
    if (planConfig.price === 0) return 'Custom pricing';
    return `$${planConfig.price}/mo + $${planConfig.pricePerEmployee}/employee`;
  },

  /**
   * Get target employee range for a plan
   */
  getTargetText: (plan: string): string => {
    const planConfig = SUBSCRIPTION_PLANS[plan];
    return planConfig?.targetEmployees || '';
  },
};

export default stripeService;
