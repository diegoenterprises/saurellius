/**
 * SAURELLIUS CONSTANTS
 * Application-wide constants
 */

export const APP_NAME = 'Saurellius';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export const COLORS = {
  primary: '#1473FF',
  secondary: '#BE01FF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#EEEEEE',
} as const;

export const GRADIENTS = {
  primary: ['#1473FF', '#BE01FF'] as const,
  success: ['#10B981', '#059669'] as const,
  warning: ['#F59E0B', '#D97706'] as const,
  gold: ['#FFD700', '#DAA520'] as const,
};

export const PAY_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', periodsPerYear: 52 },
  { value: 'biweekly', label: 'Bi-Weekly', periodsPerYear: 26 },
  { value: 'semimonthly', label: 'Semi-Monthly', periodsPerYear: 24 },
  { value: 'monthly', label: 'Monthly', periodsPerYear: 12 },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'intern', label: 'Intern' },
] as const;

export const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
  { value: 'married_filing_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
] as const;

export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const;

export const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'Starter',
    price: 50,
    includedPaystubs: 5,
    additionalCost: 5,
    features: [
      'All 50 states',
      'Complete tax calculations',
      'YTD tracking',
      'Premium PDFs',
      'QR verification',
      'Email support (48hr)',
      '1 year storage',
    ],
  },
  professional: {
    name: 'Professional',
    price: 100,
    includedPaystubs: 25,
    additionalCost: 5,
    popular: true,
    features: [
      'Everything in Starter',
      'PTO tracking',
      'Custom branding',
      'Bulk generation (25)',
      'API access (beta)',
      'Priority support (24hr)',
      '3 years storage',
      '3 users',
    ],
  },
  business: {
    name: 'Business',
    price: 150,
    includedPaystubs: -1, // unlimited
    additionalCost: 0,
    features: [
      'Everything in Professional',
      'Unlimited paystubs',
      'White-label options',
      'Full API access + webhooks',
      'Dedicated account manager',
      'Unlimited storage',
      'Unlimited users',
      'SSO available',
      '99.9% SLA',
    ],
  },
} as const;
