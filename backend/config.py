"""
 SAURELLIUS CONFIGURATION
Application configuration with Stripe pricing
"""

import os
from datetime import timedelta


class Config:
    """Base configuration."""
    
    # Flask Settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://localhost/saurellius')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # AWS Settings
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
    S3_PAYSTUBS_BUCKET = os.environ.get('S3_PAYSTUBS_BUCKET', 'saurellius-paystubs')
    
    # Weather & Location APIs
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
    IPGEOLOCATION_API_KEY = os.getenv('IPGEOLOCATION_API_KEY')
    
    # AI Integration (Google Gemini)
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = 'gemini-1.5-flash'  # Fast and cost-effective
    
    # Email Configuration
    SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@saurellius.com')
    
    # Stripe Configuration
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    # Stripe Price IDs (Update these with your actual IDs from Stripe Dashboard)
    STRIPE_PRICES = {
        'starter': os.environ.get('STRIPE_PRICE_STARTER', 'price_starter_xxxxx'),
        'professional': os.environ.get('STRIPE_PRICE_PROFESSIONAL', 'price_professional_xxxxx'),
        'business': os.environ.get('STRIPE_PRICE_BUSINESS', 'price_business_xxxxx')
    }
    
    # Plan Configurations
    PLAN_LIMITS = {
        'starter': {
            'name': 'Starter',
            'price': 50.00,
            'included_paystubs': 5,
            'additional_cost': 5.00,
            'features': [
                'All 50 states',
                'Complete tax calculations',
                'YTD tracking',
                'Premium PDFs',
                'Email support'
            ]
        },
        'professional': {
            'name': 'Professional',
            'price': 100.00,
            'included_paystubs': 25,
            'additional_cost': 5.00,
            'features': [
                'Everything in Starter',
                'PTO tracking',
                'Custom branding',
                'Bulk generation',
                'Priority support',
                'API access (beta)',
                '3 users'
            ]
        },
        'business': {
            'name': 'Business',
            'price': 150.00,
            'included_paystubs': -1,  # -1 = unlimited
            'additional_cost': 0,
            'features': [
                'Everything in Professional',
                'Unlimited paystubs',
                'White-label options',
                'Full API access',
                'Dedicated support',
                'Unlimited users',
                'SSO available',
                '99.9% SLA'
            ]
        }
    }


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://localhost/saurellius_dev')


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    
    # Override with production Stripe keys
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Config selector
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
