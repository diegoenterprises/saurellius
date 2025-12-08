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
    'workforce_bp'
]
