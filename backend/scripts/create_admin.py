"""
CREATE REAL ADMIN USER
Script to create the platform admin user for Diego Usoro
Run this script to set up the admin account
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from models import db, User
from werkzeug.security import generate_password_hash
from datetime import datetime
from config import Config

def create_admin():
    """Create the real admin user."""
    # Create minimal Flask app for database access
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    
    with app.app_context():
        # Check if admin already exists
        existing_admin = User.query.filter_by(email='diego@diegoenterprises.com').first()
        
        if existing_admin:
            print("Admin user already exists. Updating...")
            existing_admin.password_hash = generate_password_hash('EsangVision2026!')
            existing_admin.is_admin = True
            existing_admin.first_name = 'Diego'
            existing_admin.last_name = 'Usoro'
            existing_admin.role = 'admin'
            existing_admin.subscription_tier = 'business'
            existing_admin.is_active = True
            if hasattr(existing_admin, 'last_login'):
                existing_admin.last_login = datetime.utcnow()
            db.session.commit()
            print("✅ Admin user updated successfully!")
        else:
            print("Creating new admin user...")
            admin = User(
                email='diego@diegoenterprises.com',
                password_hash=generate_password_hash('EsangVision2026!'),
                first_name='Diego',
                last_name='Usoro',
                is_admin=True,
                role='admin',
                subscription_tier='business',
                is_active=True,
            )
            if hasattr(admin, 'created_at'):
                admin.created_at = datetime.utcnow()
            if hasattr(admin, 'last_login'):
                admin.last_login = datetime.utcnow()
            
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin user created successfully!")
        
        # Delete all other test/demo users to start fresh
        print("\nCleaning up test users...")
        test_users = User.query.filter(
            User.email != 'diego@diegoenterprises.com'
        ).all()
        
        for user in test_users:
            db.session.delete(user)
        
        db.session.commit()
        print(f"✅ Removed {len(test_users)} test users. Starting fresh!")
        
        # Verify
        admin = User.query.filter_by(email='diego@diegoenterprises.com').first()
        total_users = User.query.count()
        
        print("\n" + "="*50)
        print("ADMIN ACCOUNT READY")
        print("="*50)
        print(f"Email: {admin.email}")
        print(f"Name: {admin.first_name} {admin.last_name}")
        print(f"Is Admin: {admin.is_admin}")
        print(f"Total Users in DB: {total_users}")
        print("="*50)
        print("\n🚀 Your platform is ready to grow from 0!")

if __name__ == '__main__':
    create_admin()
