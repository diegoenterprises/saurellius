"""
SAURELLIUS BILLING MANAGER
Handles subscription plans, usage limits, and overage calculations
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from config import Config


class BillingManager:
    """Manages subscription billing logic and usage tracking."""
    
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
        
        Returns:
            Tuple of (can_generate, message, overage_amount)
        """
        if not self.user:
            return False, "User not found", None
        
        plan = self.get_plan_info(self.user.subscription_tier)
        current_usage = self.user.paystubs_this_month or 0
        limit = plan['paystub_limit']
        
        # Business tier - unlimited
        if self.user.subscription_tier == 'business':
            return True, "OK", None
        
        # Starter/Professional - allow overages
        if current_usage >= limit:
            overage_rate = plan['overage_rate']
            return True, f"Overage: ${overage_rate} will be charged", overage_rate
        
        remaining = limit - current_usage
        return True, f"{remaining} paystubs remaining this month", None
    
    def calculate_overage_charges(self) -> Dict:
        """Calculate any overage charges for the current billing period."""
        if not self.user:
            return {'overage_count': 0, 'overage_amount': 0}
        
        plan = self.get_plan_info(self.user.subscription_tier)
        limit = plan['paystub_limit']
        current_usage = self.user.paystubs_this_month or 0
        
        if current_usage <= limit or limit == float('inf'):
            return {'overage_count': 0, 'overage_amount': 0}
        
        overage_count = current_usage - int(limit)
        overage_rate = plan['overage_rate']
        overage_amount = overage_count * overage_rate
        
        return {
            'overage_count': overage_count,
            'overage_rate': overage_rate,
            'overage_amount': overage_amount
        }
    
    def get_usage_summary(self) -> Dict:
        """Get comprehensive usage summary for the user."""
        if not self.user:
            return {}
        
        plan = self.get_plan_info(self.user.subscription_tier)
        current_usage = self.user.paystubs_this_month or 0
        limit = plan['paystub_limit']
        
        # Calculate percentage (cap at 100 for display)
        if limit == float('inf'):
            usage_percentage = 0
        else:
            usage_percentage = min(100, (current_usage / limit) * 100) if limit > 0 else 0
        
        overages = self.calculate_overage_charges()
        
        return {
            'plan': self.user.subscription_tier,
            'plan_name': plan['name'],
            'paystubs_used': current_usage,
            'paystubs_limit': 'Unlimited' if limit == float('inf') else int(limit),
            'paystubs_remaining': 'Unlimited' if limit == float('inf') else max(0, int(limit) - current_usage),
            'usage_percentage': round(usage_percentage, 1),
            'monthly_price': plan['monthly_price'],
            'overage_count': overages['overage_count'],
            'overage_amount': overages['overage_amount'],
            'total_generated': self.user.total_paystubs_generated or 0,
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
    
    def recommend_plan(self) -> Dict:
        """Recommend a plan based on usage patterns."""
        if not self.user:
            return self.PLANS['starter']
        
        avg_monthly = self.user.total_paystubs_generated or 0
        
        if avg_monthly <= 5:
            return {
                'recommended': 'starter',
                'reason': 'Perfect for small businesses with up to 5 paystubs/month'
            }
        elif avg_monthly <= 25:
            return {
                'recommended': 'professional',
                'reason': 'Best value for growing businesses'
            }
        else:
            return {
                'recommended': 'business',
                'reason': 'Unlimited paystubs for high-volume needs'
            }
    
    @staticmethod
    def get_stripe_price_id(plan_name: str) -> Optional[str]:
        """Get Stripe Price ID for a plan."""
        price_ids = {
            'starter': Config.STRIPE_PRICES.get('starter'),
            'professional': Config.STRIPE_PRICES.get('professional'),
            'business': Config.STRIPE_PRICES.get('business')
        }
        return price_ids.get(plan_name)


# Singleton instance
billing_manager = BillingManager()
