"""
 SAURELLIUS API ROUTES
Route blueprints registration
"""

from .auth_routes import auth_bp
from .stripe_routes import stripe_bp
from .dashboard_routes import dashboard_bp
from .paystub_routes import paystubs_bp
from .weather_routes import weather_bp
from .email_routes import email_bp
from .state_rules_routes import state_rules_bp
from .ai_routes import ai_bp
from .paystub_generator_routes import paystub_gen_bp
from .messaging_routes import messaging_bp
from .swipe_routes import swipe_bp
from .workforce_routes import workforce_bp
from .benefits_routes import benefits_bp
from .wallet_routes import wallet_bp
from .tax_updater_routes import tax_updater_bp
from .talent_routes import talent_bp
from .analytics_routes import analytics_bp
from .fmla_routes import fmla_bp
from .job_costing_routes import job_costing_bp
from .employee_experience_routes import employee_exp_bp
from .retirement_routes import retirement_bp
from .contractor_1099_routes import contractor_1099_bp

__all__ = [
    'auth_bp',
    'stripe_bp',
    'dashboard_bp',
    'paystubs_bp',
    'weather_bp',
    'email_bp',
    'state_rules_bp',
    'ai_bp',
    'paystub_gen_bp',
    'messaging_bp',
    'swipe_bp',
    'workforce_bp',
    'benefits_bp',
    'wallet_bp',
    'tax_updater_bp',
    'talent_bp',
    'analytics_bp',
    'fmla_bp',
    'job_costing_bp',
    'employee_exp_bp',
    'retirement_bp',
    'contractor_1099_bp',
]
