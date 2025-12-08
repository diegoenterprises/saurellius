"""
SAURELLIUS SERVICES
Service modules for weather, email, and other integrations
"""

from .weather_service import WeatherService, weather_service
from .email_service import EmailService, email_service
from .gemini_service import SaurelliusAI, saurellius_ai, gemini_ai
from .state_payroll_rules import StatePayrollRules, state_payroll_rules
from .paystub_generator import PaystubGenerator, paystub_generator, COLOR_THEMES, number_to_words

__all__ = [
    'WeatherService',
    'weather_service',
    'EmailService',
    'email_service',
    'SaurelliusAI',
    'saurellius_ai',
    'gemini_ai',
    'StatePayrollRules',
    'state_payroll_rules',
    'PaystubGenerator',
    'paystub_generator',
    'COLOR_THEMES',
    'number_to_words'
]
