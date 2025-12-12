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
// ============================================================================

export const pricingUtils = {
  /**
   * Calculate total monthly cost for a given number of employees
   */
  calculateMonthlyCost: (planId: PlanId, employeeCount: number): number => {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || plan.price === 0) return employeeCount * (plan?.pricePerEmployee || 12);
    
    const discount = pricingUtils.getVolumeDiscount(employeeCount);
    const employeeCost = employeeCount * plan.pricePerEmployee * (1 - discount / 100);
    return plan.price + employeeCost;
  },

  getVolumeDiscount: (employeeCount: number): number => {
    const tier = VOLUME_DISCOUNTS.find(t => employeeCount >= t.min && employeeCount <= t.max);
    return tier?.discount || 0;
  },

  calculateAnnualSavings: (planId: PlanId): number => {
    const plan = SUBSCRIPTION_PLANS[planId];
    return plan?.annualSavings || 0;
  },

  recommendPlan: (employeeCount: number): PlanId => {
    if (employeeCount <= 25) return 'starter';
    if (employeeCount <= 100) return 'professional';
    if (employeeCount <= 500) return 'business';
    return 'enterprise';
  },

  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  getPricingText: (planId: PlanId): string => {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return '';
    if (plan.price === 0) return 'Custom pricing';
    return `$${plan.price}/mo + $${plan.pricePerEmployee}/employee`;
  },

  getTargetText: (planId: PlanId): string => {
    const plan = SUBSCRIPTION_PLANS[planId];
    return plan?.targetEmployees || '';
  },
};

// ============================================================================
// FEATURE ACCESS SERVICE - Check subscription-based feature access
// ============================================================================

export interface FeatureAccessResponse {
  success: boolean;
  can_access: boolean;
  feature: string;
  message: string;
  current_tier: string;
}

export interface UserFeaturesResponse {
  success: boolean;
  tier: string;
  plan_name: string;
  features: string[];
  feature_count: number;
  upgrades_available: Record<string, {
    tier: string;
    plan_name: string;
    new_features: string[];
    monthly_price: number;
  }>;
}

export const featureAccessService = {
  /**
   * Get all features available to the current user
   */
  getUserFeatures: async (): Promise<UserFeaturesResponse> => {
    const response = await api.get('/api/subscription/features');
    return response.data;
  },

  /**
   * Check if user can access a specific feature
   */
  checkFeatureAccess: async (feature: string): Promise<FeatureAccessResponse> => {
    const response = await api.post('/api/subscription/check-feature', { feature });
    return response.data;
  },

  /**
   * Get upgrade options with new features
   */
  getUpgradeOptions: async () => {
    const response = await api.get('/api/subscription/upgrade-options');
    return response.data;
  },

  /**
   * Get all features by tier (for pricing page)
   */
  getAllFeaturesByTier: async () => {
    const response = await api.get('/api/subscription/all-features');
    return response.data;
  },

  /**
   * Check feature access locally (without API call)
   * Uses cached tier from auth state
   */
  canAccessFeature: (userTier: string, feature: string): boolean => {
    const tierFeatures: Record<string, string[]> = {
      starter: [
        'payroll_processing', 'unlimited_payroll_runs', 'tax_filing',
        'w2_preparation', '1099_preparation', 'direct_deposit',
        'employee_self_service', 'basic_reporting', 'employee_portal',
        'contractor_portal', 'w9_collection'
      ],
      professional: [
        'payroll_processing', 'unlimited_payroll_runs', 'tax_filing',
        'w2_preparation', '1099_preparation', 'direct_deposit',
        'employee_self_service', 'basic_reporting', 'employee_portal',
        'contractor_portal', 'w9_collection', 'same_day_deposit',
        'time_tracking', 'scheduling', 'pto_management', 'benefits_administration',
        'digital_wallet', 'earned_wage_access', 'hr_document_storage',
        'onboarding_workflows', 'custom_reporting', 'messaging',
        'swipe_shift_swap', 'timeclock', 'expense_tracking', 'mileage_tracking',
        'invoicing'
      ],
      business: [
        'payroll_processing', 'unlimited_payroll_runs', 'tax_filing',
        'w2_preparation', '1099_preparation', 'direct_deposit',
        'employee_self_service', 'basic_reporting', 'employee_portal',
        'contractor_portal', 'w9_collection', 'same_day_deposit',
        'time_tracking', 'scheduling', 'pto_management', 'benefits_administration',
        'digital_wallet', 'earned_wage_access', 'hr_document_storage',
        'onboarding_workflows', 'custom_reporting', 'messaging',
        'swipe_shift_swap', 'timeclock', 'expense_tracking', 'mileage_tracking',
        'invoicing', 'talent_management', 'applicant_tracking', 'performance_reviews',
        'learning_management', 'goal_setting', 'okrs', '360_feedback',
        'advanced_analytics', 'predictive_insights', 'job_costing',
        'labor_allocation', 'fmla_tracking', '401k_administration',
        'garnishment_management', 'cobra_administration', 'audit_trail',
        'compliance_tools'
      ],
      enterprise: [
        'payroll_processing', 'unlimited_payroll_runs', 'tax_filing',
        'w2_preparation', '1099_preparation', 'direct_deposit',
        'employee_self_service', 'basic_reporting', 'employee_portal',
        'contractor_portal', 'w9_collection', 'same_day_deposit',
        'time_tracking', 'scheduling', 'pto_management', 'benefits_administration',
        'digital_wallet', 'earned_wage_access', 'hr_document_storage',
        'onboarding_workflows', 'custom_reporting', 'messaging',
        'swipe_shift_swap', 'timeclock', 'expense_tracking', 'mileage_tracking',
        'invoicing', 'talent_management', 'applicant_tracking', 'performance_reviews',
        'learning_management', 'goal_setting', 'okrs', '360_feedback',
        'advanced_analytics', 'predictive_insights', 'job_costing',
        'labor_allocation', 'fmla_tracking', '401k_administration',
        'garnishment_management', 'cobra_administration', 'audit_trail',
        'compliance_tools', 'canadian_payroll', 'multi_currency',
        'custom_integrations', 'full_api_access', 'advanced_compliance',
        'succession_planning', 'compensation_benchmarking', 'ai_insights',
        'gemini_ai', 'workforce_forecasting'
      ]
    };

    const tier = userTier?.toLowerCase() || 'starter';
    const features = tierFeatures[tier] || tierFeatures.starter;
    return features.includes(feature.toLowerCase());
  },

  /**
   * Get required tier for a feature
   */
  getRequiredTier: (feature: string): string => {
    const featureTiers: Record<string, string> = {
      // Professional features
      'time_tracking': 'professional',
      'scheduling': 'professional',
      'pto_management': 'professional',
      'benefits_administration': 'professional',
      'digital_wallet': 'professional',
      'messaging': 'professional',
      'timeclock': 'professional',
      'expense_tracking': 'professional',
      'mileage_tracking': 'professional',
      'invoicing': 'professional',
      // Business features
      'talent_management': 'business',
      'applicant_tracking': 'business',
      'performance_reviews': 'business',
      'learning_management': 'business',
      'goal_setting': 'business',
      'advanced_analytics': 'business',
      'job_costing': 'business',
      '401k_administration': 'business',
      'garnishment_management': 'business',
      'cobra_administration': 'business',
      // Enterprise features
      'canadian_payroll': 'enterprise',
      'multi_currency': 'enterprise',
      'custom_integrations': 'enterprise',
      'full_api_access': 'enterprise',
      'ai_insights': 'enterprise',
      'gemini_ai': 'enterprise',
    };
    return featureTiers[feature.toLowerCase()] || 'starter';
  }
};

export default stripeService;
