"""
💳 SAURELLIUS BILLING MANAGER
Handles subscription plans, usage limits, and overage calculations
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from config import Config


class BillingManager:
    """Manages subscription billing logic and usage tracking."""
    
    # Plan configurations from pricing guide
    PLANS = {
        'free': {
            'name': 'Free',
            'monthly_price': 0,
            'paystub_limit': 1,
            'overage_rate': 0,  # No overages on free
            'features': ['1 paystub/month', 'Basic support']
        },
        'starter': {
            'name': 'Starter',
            'monthly_price': 50,
            'paystub_limit': 5,
            'overage_rate': 10,
            'features': ['5 paystubs/month', 'All 50 states', 'Email support', '$10/extra paystub']
        },
        'professional': {
            'name': 'Professional',
            'monthly_price': 100,
            'paystub_limit': 25,
            'overage_rate': 8,
            'features': ['25 paystubs/month', 'PTO tracking', 'Priority support', '3 users', '$8/extra paystub']
        },
        'business': {
            'name': 'Business',
            'monthly_price': 150,
            'paystub_limit': float('inf'),  # Unlimited
            'overage_rate': 0,
            'features': ['Unlimited paystubs', 'Unlimited users', 'Dedicated support', 'SSO', 'API access']
        }
    }
    
    def __init__(self, user=None):
        """Initialize billing manager with optional user context."""
        self.user = user
    
    def get_plan_info(self, plan_name: str) -> Dict:
        """Get plan details by name."""
        return self.PLANS.get(plan_name, self.PLANS['free'])
    
    def get_all_plans(self) -> Dict:
        """Get all available plans."""
        return self.PLANS
    
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
        
        # Free tier - strict limit
        if self.user.subscription_tier == 'free':
            if current_usage >= limit:
                return False, "Free tier limit reached. Please upgrade to continue.", None
            return True, "OK", None
        
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
