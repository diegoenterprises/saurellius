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
    
    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.stripe_routes import stripe_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.paystub_routes import paystubs_bp
    from routes.weather_routes import weather_bp
    from routes.email_routes import email_bp
    from routes.state_rules_routes import state_rules_bp
    from routes.ai_routes import ai_bp
    from routes.paystub_generator_routes import paystub_gen_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(stripe_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(paystubs_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(state_rules_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(paystub_gen_bp)
    
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
    app.run(debug=True, host='0.0.0.0', port=5000)
