"""
🚀 SAURELLIUS CLOUD PAYROLL - Flask Application Factory
Main entry point for the backend API
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
jwt = JWTManager()

def create_app(config_name='default'):
    """Application factory for creating Flask app."""
    from config import config
    from models import db
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "http://localhost:19006",
                "https://saurellius.drpaystub.com",
                "https://api.saurellius.drpaystub.com"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints - Core
    from routes.auth_routes import auth_bp
    from routes.stripe_routes import stripe_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.paystub_routes import paystubs_bp
    from routes.weather_routes import weather_bp
    from routes.email_routes import email_bp
    from routes.state_rules_routes import state_rules_bp
    from routes.ai_routes import ai_bp
    from routes.paystub_generator_routes import paystub_gen_bp
    from routes.messaging_routes import messaging_bp
    from routes.swipe_routes import swipe_bp
    from routes.workforce_routes import workforce_bp
    from routes.benefits_routes import benefits_bp
    
    # Register blueprints - Enterprise Features
    from routes.accounting_routes import accounting_bp
    from routes.contractor_routes import contractor_bp
    from routes.payroll_run_routes import payroll_run_bp
    from routes.pto_routes import pto_bp
    from routes.tax_filing_routes import tax_filing_bp
    from routes.garnishment_routes import garnishment_bp
    from routes.onboarding_routes import onboarding_bp
    from routes.reporting_routes import reporting_bp
    from routes.admin_routes import admin_bp
    from routes.tax_engine_routes import tax_engine_bp
    from routes.compliance_routes import compliance_bp
    from routes.scheduler_routes import scheduler_bp
    
    # Core blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(stripe_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(paystubs_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(state_rules_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(paystub_gen_bp)
    app.register_blueprint(messaging_bp)
    app.register_blueprint(swipe_bp)
    app.register_blueprint(workforce_bp)
    app.register_blueprint(benefits_bp)
    
    # Enterprise feature blueprints
    app.register_blueprint(accounting_bp)
    app.register_blueprint(contractor_bp)
    app.register_blueprint(payroll_run_bp)
    app.register_blueprint(pto_bp)
    app.register_blueprint(tax_filing_bp)
    app.register_blueprint(garnishment_bp)
    app.register_blueprint(onboarding_bp)
    app.register_blueprint(reporting_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(tax_engine_bp)
    app.register_blueprint(compliance_bp)
    app.register_blueprint(scheduler_bp)
    
    # Initialize Tax Update Scheduler
    from services.scheduler_service import init_scheduler
    init_scheduler(app)
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'saurellius-api'}
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'success': False, 'message': 'Internal server error'}, 500
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app


# Create app instance for gunicorn
app = create_app(os.getenv('FLASK_ENV', 'default'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
