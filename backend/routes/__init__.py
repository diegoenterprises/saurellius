"""
SAURELLIUS API ROUTES
Complete route blueprints registration - All platform features
"""

# Core Routes
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
from .employee_experience_routes import employee_experience_bp

# Enterprise Routes
from .accounting_routes import accounting_bp
from .contractor_routes import contractor_bp
from .payroll_run_routes import payroll_run_bp
from .pto_routes import pto_bp
from .tax_filing_routes import tax_filing_bp
from .garnishment_routes import garnishment_bp
from .onboarding_routes import onboarding_bp
from .reporting_routes import reporting_bp
from .admin_routes import admin_bp
from .tax_engine_routes import tax_engine_bp
from .compliance_routes import compliance_bp
from .scheduler_routes import scheduler_bp

# Production Routes
from .ach_routes import ach_bp
from .termination_routes import termination_bp
from .payroll_corrections_routes import corrections_bp
from .w4_routes import w4_bp
from .i9_routes import i9_bp
from .timeclock_routes import timeclock_bp
from .audit_routes import audit_bp
from .cobra_routes import cobra_bp
from .tax_engine_v2_routes import tax_engine_v2_bp

# Self-Service Routes
from .employer_registration_routes import employer_reg_bp
from .employee_onboarding_routes import employee_onboarding_bp
from .contractor_onboarding_routes import contractor_onboarding_bp
from .employee_self_service_routes import employee_ss_bp
from .contractor_self_service_routes import contractor_ss_bp

# Document & Regulatory Routes
from .document_routes import document_bp
from .regulatory_filing_routes import regulatory_bp

__all__ = [
    # Core
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
    'employee_experience_bp',
    # Enterprise
    'accounting_bp',
    'contractor_bp',
    'payroll_run_bp',
    'pto_bp',
    'tax_filing_bp',
    'garnishment_bp',
    'onboarding_bp',
    'reporting_bp',
    'admin_bp',
    'tax_engine_bp',
    'compliance_bp',
    'scheduler_bp',
    # Production
    'ach_bp',
    'termination_bp',
    'corrections_bp',
    'w4_bp',
    'i9_bp',
    'timeclock_bp',
    'audit_bp',
    'cobra_bp',
    'tax_engine_v2_bp',
    # Self-Service
    'employer_reg_bp',
    'employee_onboarding_bp',
    'contractor_onboarding_bp',
    'employee_ss_bp',
    'contractor_ss_bp',
    # Document & Regulatory
    'document_bp',
    'regulatory_bp',
]
