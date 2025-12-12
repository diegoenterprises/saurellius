"""
SAURELLIUS BILLING MANAGER
Handles subscription plans, usage limits, and overage calculations
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from config import Config


class BillingManager:
    """Manages subscription billing logic and usage tracking."""
    
    # Feature access by subscription tier
    FEATURE_ACCESS = {
        'starter': [
            # Core Features
            'payroll_processing', 'unlimited_payroll_runs', 'tax_filing', 
            'w2_preparation', '1099_preparation', 'direct_deposit',
            'employee_self_service', 'basic_reporting', 'email_support',
            'employee_management', 'paystub_generation', 'tax_calculations',
            # Self-Service
            'employee_portal', 'contractor_portal', 'w9_collection',
            # Regulatory Filing - Basic
            'federal_filing', 'state_filing', 'form_941', 'form_940',
            'eftps_deposits', 'new_hire_reporting', 'filing_calendar'
        ],
        'professional': [
            # Everything in Starter
            'payroll_processing', 'unlimited_payroll_runs', 'tax_filing',
            'w2_preparation', '1099_preparation', 'direct_deposit',
            'employee_self_service', 'basic_reporting', 'email_support',
            'employee_management', 'paystub_generation', 'tax_calculations',
            'employee_portal', 'contractor_portal', 'w9_collection',
            # Professional additions
            'same_day_deposit', 'time_tracking', 'scheduling', 'pto_management',
            'benefits_administration', 'digital_wallet', 'earned_wage_access',
            'hr_document_storage', 'onboarding_workflows', 'priority_support',
            'custom_reporting', 'messaging', 'swipe_shift_swap', 'timeclock',
            'expense_tracking', 'mileage_tracking', 'invoicing',
            # Regulatory Filing - Professional
            'federal_filing', 'state_filing', 'form_941', 'form_940',
            'eftps_deposits', 'new_hire_reporting', 'filing_calendar',
            'multi_state_filing', 'local_filing', 'compliance_alerts'
        ],
        'business': [
            # Everything in Professional
            'payroll_processing', 'unlimited_payroll_runs', 'tax_filing',
            'w2_preparation', '1099_preparation', 'direct_deposit',
            'employee_self_service', 'basic_reporting', 'email_support',
            'employee_management', 'paystub_generation', 'tax_calculations',
            'employee_portal', 'contractor_portal', 'w9_collection',
            'same_day_deposit', 'time_tracking', 'scheduling', 'pto_management',
            'benefits_administration', 'digital_wallet', 'earned_wage_access',
            'hr_document_storage', 'onboarding_workflows', 'priority_support',
            'custom_reporting', 'messaging', 'swipe_shift_swap', 'timeclock',
            'expense_tracking', 'mileage_tracking', 'invoicing',
            # Business additions
            'talent_management', 'applicant_tracking', 'performance_reviews',
            'learning_management', 'goal_setting', 'okrs', '360_feedback',
            'advanced_analytics', 'predictive_insights', 'job_costing',
            'labor_allocation', 'fmla_tracking', '401k_administration',
            'dedicated_account_manager', 'phone_support', 'garnishment_management',
            'cobra_administration', 'audit_trail', 'compliance_tools',
            # Regulatory Filing - Business
            'federal_filing', 'state_filing', 'form_941', 'form_940',
            'eftps_deposits', 'new_hire_reporting', 'filing_calendar',
            'multi_state_filing', 'local_filing', 'compliance_alerts',
            'compliance_verification', 'audit_trail_export', 'filing_history'
        ],
        'enterprise': [
            # Everything - Full platform access
            'payroll_processing', 'unlimited_payroll_runs', 'tax_filing',
            'w2_preparation', '1099_preparation', 'direct_deposit',
            'employee_self_service', 'basic_reporting', 'email_support',
            'employee_management', 'paystub_generation', 'tax_calculations',
            'employee_portal', 'contractor_portal', 'w9_collection',
            'same_day_deposit', 'time_tracking', 'scheduling', 'pto_management',
            'benefits_administration', 'digital_wallet', 'earned_wage_access',
            'hr_document_storage', 'onboarding_workflows', 'priority_support',
            'custom_reporting', 'messaging', 'swipe_shift_swap', 'timeclock',
            'expense_tracking', 'mileage_tracking', 'invoicing',
            'talent_management', 'applicant_tracking', 'performance_reviews',
            'learning_management', 'goal_setting', 'okrs', '360_feedback',
            'advanced_analytics', 'predictive_insights', 'job_costing',
            'labor_allocation', 'fmla_tracking', '401k_administration',
            'dedicated_account_manager', 'phone_support', 'garnishment_management',
            'cobra_administration', 'audit_trail', 'compliance_tools',
            # Enterprise additions
            'canadian_payroll', 'multi_currency', 'custom_integrations',
            'full_api_access', 'advanced_compliance', 'succession_planning',
            'compensation_benchmarking', 'dedicated_implementation',
            '24_7_support', 'sla_guarantees', 'white_label', 'sso_integration',
            'ai_insights', 'gemini_ai', 'workforce_forecasting',
            # Regulatory Filing - Enterprise
            'federal_filing', 'state_filing', 'form_941', 'form_940',
            'eftps_deposits', 'new_hire_reporting', 'filing_calendar',
            'multi_state_filing', 'local_filing', 'compliance_alerts',
            'compliance_verification', 'audit_trail_export', 'filing_history',
            'automated_filing', 'irs_fire_direct', 'ssa_bso_direct',
            'bulk_filing', 'filing_api_access'
        ]
    }
    
    # Plan configurations based on competitor analysis
    PLANS = {
        'starter': {
            'name': 'Starter',
            'monthly_price': 39,
            'price_per_employee': 5,
            'target_employees': '1-25',
            'annual_price': 399,
            'annual_savings': 69,
            'features': [
                'Full-service payroll processing',
                'Unlimited payroll runs',
                'Federal, state, local tax filing',
                'W-2 and 1099 preparation',
                'Direct deposit (2-day)',
                'Employee self-service portal',
                'Basic reporting',
                'Email support'
            ]
        },
        'professional': {
            'name': 'Professional',
            'monthly_price': 79,
            'price_per_employee': 8,
            'target_employees': '10-100',
            'annual_price': 799,
            'annual_savings': 149,
            'popular': True,
            'features': [
                'Everything in Starter, plus:',
                'Same-day direct deposit',
                'Time tracking & scheduling',
                'PTO management',
                'Benefits administration',
                'Digital Wallet & EWA',
                'HR document storage',
                'Onboarding workflows',
                'Priority email & chat support',
                'Custom reporting'
            ]
        },
        'business': {
            'name': 'Business',
            'monthly_price': 149,
            'price_per_employee': 10,
            'target_employees': '50-500',
            'annual_price': 1499,
            'annual_savings': 289,
            'features': [
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
                'Phone support'
            ]
        },
        'enterprise': {
            'name': 'Enterprise',
            'monthly_price': 0,  # Custom pricing
            'price_per_employee': 12,
            'target_employees': '250+',
            'features': [
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
                'SLA guarantees'
            ]
        }
    }
    
    # Volume discounts
    VOLUME_DISCOUNTS = [
        {'min': 1, 'max': 25, 'discount': 0},
        {'min': 26, 'max': 50, 'discount': 5},
        {'min': 51, 'max': 100, 'discount': 10},
        {'min': 101, 'max': 250, 'discount': 15},
        {'min': 251, 'max': 500, 'discount': 20},
        {'min': 501, 'max': float('inf'), 'discount': 25},
    ]
    
    # Stripe price IDs (replace with actual Stripe price IDs)
    STRIPE_PRICE_IDS = {
        'starter': 'price_starter_monthly',
        'professional': 'price_professional_monthly',
        'business': 'price_business_monthly',
        'enterprise': 'price_enterprise_monthly',
    }
    
    def __init__(self, user=None):
        """Initialize billing manager with optional user context."""
        self.user = user
    
    def get_plan_info(self, plan_name: str) -> Dict:
        """Get plan details by name."""
        return self.PLANS.get(plan_name, self.PLANS['starter'])
    
    def get_all_plans(self) -> Dict:
        """Get all available plans."""
        return self.PLANS
    
    @classmethod
    def get_stripe_price_id(cls, plan_name: str) -> Optional[str]:
        """Get Stripe price ID for a plan."""
        return cls.STRIPE_PRICE_IDS.get(plan_name)
    
    @classmethod
    def get_volume_discount(cls, employee_count: int) -> int:
        """Get volume discount percentage based on employee count."""
        for tier in cls.VOLUME_DISCOUNTS:
            if tier['min'] <= employee_count <= tier['max']:
                return tier['discount']
        return 0
    
    @classmethod
    def calculate_monthly_cost(cls, plan_name: str, employee_count: int) -> float:
        """Calculate total monthly cost for a plan and employee count."""
        plan = cls.PLANS.get(plan_name)
        if not plan:
            return 0
        
        base_price = plan['monthly_price']
        per_employee = plan['price_per_employee']
        
        # Enterprise has custom pricing (base = 0)
        if base_price == 0:
            return employee_count * per_employee
        
        # Apply volume discount
        discount = cls.get_volume_discount(employee_count)
        employee_cost = employee_count * per_employee * (1 - discount / 100)
        
        return base_price + employee_cost
    
    @classmethod
    def recommend_plan(cls, employee_count: int) -> str:
        """Recommend the best plan based on employee count."""
        if employee_count <= 25:
            return 'starter'
        elif employee_count <= 100:
            return 'professional'
        elif employee_count <= 500:
            return 'business'
        else:
            return 'enterprise'
    
    def check_can_generate_paystub(self) -> Tuple[bool, str, Optional[float]]:
        """
        Check if user can generate a paystub.
        With employee-based pricing, paystubs are unlimited for all tiers.
        
        Returns:
            Tuple of (can_generate, message, overage_amount)
        """
        if not self.user:
            return False, "User not found", None
        
        # All tiers now have unlimited paystubs - billing is employee-based
        return True, "Unlimited paystubs included with your plan", None
    
    def get_billing_summary(self) -> Dict:
        """Get billing summary based on employee count."""
        if not self.user:
            return {'monthly_cost': 0, 'employee_count': 0}
        
        plan = self.get_plan_info(self.user.subscription_tier)
        employee_count = self.user.employee_count or 0
        monthly_cost = self.calculate_monthly_cost(self.user.subscription_tier, employee_count)
        discount = self.get_volume_discount(employee_count)
        
        return {
            'plan': self.user.subscription_tier,
            'plan_name': plan['name'],
            'base_price': plan['monthly_price'],
            'price_per_employee': plan['price_per_employee'],
            'employee_count': employee_count,
            'volume_discount': discount,
            'monthly_cost': monthly_cost,
            'annual_cost': monthly_cost * 12,
            'annual_savings': plan.get('annual_savings', 0)
        }
    
    def get_usage_summary(self) -> Dict:
        """Get comprehensive usage summary for the user."""
        if not self.user:
            return {}
        
        plan = self.get_plan_info(self.user.subscription_tier)
        employee_count = self.user.employee_count or 0
        monthly_cost = self.calculate_monthly_cost(self.user.subscription_tier, employee_count)
        discount = self.get_volume_discount(employee_count)
        
        return {
            'plan': self.user.subscription_tier,
            'plan_name': plan['name'],
            'target_employees': plan['target_employees'],
            'employee_count': employee_count,
            'base_price': plan['monthly_price'],
            'price_per_employee': plan['price_per_employee'],
            'volume_discount': discount,
            'monthly_cost': monthly_cost,
            'paystubs_generated': self.user.total_paystubs_generated or 0,
            'paystubs_limit': 'Unlimited',
            'billing_cycle_start': self.user.billing_cycle_start.isoformat() if self.user.billing_cycle_start else None
        }
    
    def reset_monthly_usage(self):
        """Reset monthly paystub counter (called at billing cycle start)."""
        if self.user:
            self.user.paystubs_this_month = 0
            self.user.billing_cycle_start = datetime.utcnow()
    
    def increment_usage(self):
        """Increment paystub usage counter."""
        if self.user:
            self.user.paystubs_this_month = (self.user.paystubs_this_month or 0) + 1
            self.user.total_paystubs_generated = (self.user.total_paystubs_generated or 0) + 1
    
    def recommend_plan_for_user(self) -> Dict:
        """Recommend a plan based on employee count."""
        if not self.user:
            return {'recommended': 'starter', 'reason': 'Start with our Starter plan'}
        
        employee_count = self.user.employee_count or 0
        recommended = self.recommend_plan(employee_count)
        
        reasons = {
            'starter': f'Perfect for small businesses with {employee_count} employees (1-25 range)',
            'professional': f'Best value for growing businesses with {employee_count} employees (10-100 range)',
            'business': f'Full-featured for mid-sized companies with {employee_count} employees (50-500 range)',
            'enterprise': f'Enterprise solution for {employee_count}+ employees with custom pricing'
        }
        
        return {
            'recommended': recommended,
            'reason': reasons.get(recommended, 'Contact us for a custom quote'),
            'current_plan': self.user.subscription_tier,
            'employee_count': employee_count,
            'estimated_cost': self.calculate_monthly_cost(recommended, employee_count)
        }

    # =========================================================================
    # FEATURE ACCESS CONTROL - Dynamic feature gating by subscription
    # =========================================================================

    @classmethod
    def can_access_feature(cls, subscription_tier: str, feature: str) -> bool:
        """Check if a subscription tier can access a specific feature."""
        tier = subscription_tier.lower() if subscription_tier else 'starter'
        features = cls.FEATURE_ACCESS.get(tier, cls.FEATURE_ACCESS['starter'])
        return feature.lower() in features

    @classmethod
    def get_accessible_features(cls, subscription_tier: str) -> list:
        """Get list of all features accessible for a subscription tier."""
        tier = subscription_tier.lower() if subscription_tier else 'starter'
        return cls.FEATURE_ACCESS.get(tier, cls.FEATURE_ACCESS['starter'])

    @classmethod
    def get_upgrade_features(cls, current_tier: str) -> Dict:
        """Get features available in higher tiers for upgrade prompts."""
        tier_order = ['starter', 'professional', 'business', 'enterprise']
        current = current_tier.lower() if current_tier else 'starter'
        current_idx = tier_order.index(current) if current in tier_order else 0
        
        upgrades = {}
        current_features = set(cls.FEATURE_ACCESS.get(current, []))
        
        for i in range(current_idx + 1, len(tier_order)):
            next_tier = tier_order[i]
            next_features = set(cls.FEATURE_ACCESS.get(next_tier, []))
            new_features = next_features - current_features
            if new_features:
                upgrades[next_tier] = {
                    'tier': next_tier,
                    'plan_name': cls.PLANS.get(next_tier, {}).get('name', next_tier.title()),
                    'new_features': list(new_features),
                    'monthly_price': cls.PLANS.get(next_tier, {}).get('monthly_price', 0)
                }
            current_features = next_features
        
        return upgrades

    def check_feature_access(self, feature: str) -> Tuple[bool, str]:
        """
        Check if user can access a feature based on subscription.
        Returns (can_access, message)
        """
        if not self.user:
            return False, "User not authenticated"
        
        tier = getattr(self.user, 'subscription_tier', 'starter') or 'starter'
        
        if self.can_access_feature(tier, feature):
            return True, f"Access granted to {feature}"
        
        # Find which tier unlocks this feature
        for upgrade_tier in ['professional', 'business', 'enterprise']:
            if self.can_access_feature(upgrade_tier, feature):
                plan_name = self.PLANS.get(upgrade_tier, {}).get('name', upgrade_tier.title())
                return False, f"Upgrade to {plan_name} to access {feature}"
        
        return False, f"Feature {feature} not available"

    def get_user_features(self) -> Dict:
        """Get all feature access info for current user."""
        if not self.user:
            return {'tier': 'starter', 'features': self.FEATURE_ACCESS['starter']}
        
        tier = getattr(self.user, 'subscription_tier', 'starter') or 'starter'
        return {
            'tier': tier,
            'plan_name': self.PLANS.get(tier, {}).get('name', tier.title()),
            'features': self.get_accessible_features(tier),
            'feature_count': len(self.get_accessible_features(tier)),
            'upgrades_available': self.get_upgrade_features(tier)
        }


# Singleton instance
billing_manager = BillingManager()
