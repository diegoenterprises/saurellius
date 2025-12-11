"""
SAURELLIUS TEST USER SEEDER
Creates test accounts for all subscription tiers
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User

# Test users for each role and subscription tier
TEST_USERS = [
    # =====================================================
    # PLATFORM ADMIN (You - sees everything)
    # =====================================================
    {
        'email': 'admin@saurellius.com',
        'password': 'Admin123!',
        'first_name': 'Diego',
        'last_name': 'Soro',
        'role': 'employer',
        'subscription_tier': 'business',
        'subscription_status': 'active',
        'is_admin': True,  # Platform owner
        'reward_points': 50000,
    },
    
    # =====================================================
    # EMPLOYERS (Company owners - manage employees & payroll)
    # =====================================================
    {
        'email': 'employer@test.com',
        'password': 'Test123!',
        'first_name': 'John',
        'last_name': 'Smith',
        'role': 'employer',
        'subscription_tier': 'business',
        'subscription_status': 'active',
        'is_admin': False,
        'reward_points': 5000,
    },
    {
        'email': 'employer.free@test.com',
        'password': 'Test123!',
        'first_name': 'Sarah',
        'last_name': 'Johnson',
        'role': 'employer',
        'subscription_tier': 'free',
        'subscription_status': 'active',
        'is_admin': False,
        'reward_points': 100,
    },
    {
        'email': 'employer.starter@test.com',
        'password': 'Test123!',
        'first_name': 'Mike',
        'last_name': 'Davis',
        'role': 'employer',
        'subscription_tier': 'starter',
        'subscription_status': 'active',
        'is_admin': False,
        'reward_points': 500,
    },
    {
        'email': 'employer.pro@test.com',
        'password': 'Test123!',
        'first_name': 'Emily',
        'last_name': 'Chen',
        'role': 'employer',
        'subscription_tier': 'professional',
        'subscription_status': 'active',
        'is_admin': False,
        'reward_points': 1500,
    },
    
    # =====================================================
    # MANAGERS (Supervise employees, approve requests)
    # =====================================================
    {
        'email': 'manager@test.com',
        'password': 'Test123!',
        'first_name': 'Lisa',
        'last_name': 'Wilson',
        'role': 'manager',
        'subscription_tier': 'professional',
        'subscription_status': 'active',
        'is_admin': False,
        'reward_points': 2000,
    },
    
    # =====================================================
    # EMPLOYEES (Regular workers - limited access)
    # =====================================================
    {
        'email': 'employee@test.com',
        'password': 'Test123!',
        'first_name': 'Alex',
        'last_name': 'Thompson',
        'role': 'employee',
        'subscription_tier': 'professional',
        'subscription_status': 'active',
        'is_admin': False,
        'reward_points': 750,
    },
    {
        'email': 'employee2@test.com',
        'password': 'Test123!',
        'first_name': 'Jessica',
        'last_name': 'Martinez',
        'role': 'employee',
        'subscription_tier': 'professional',
        'subscription_status': 'active',
        'is_admin': False,
        'reward_points': 450,
    },
    {
        'email': 'employee3@test.com',
        'password': 'Test123!',
        'first_name': 'Ryan',
        'last_name': 'Cooper',
        'role': 'employee',
        'subscription_tier': 'professional',
        'subscription_status': 'active',
        'is_admin': False,
        'reward_points': 300,
    },
]

def seed_users():
    """Create or update test users."""
    app = create_app()
    
    with app.app_context():
        print("\nSeeding test users...\n")
        
        for user_data in TEST_USERS:
            email = user_data['email']
            existing = User.query.filter_by(email=email).first()
            
            if existing:
                print(f"    User {email} already exists - updating...")
                existing.first_name = user_data['first_name']
                existing.last_name = user_data['last_name']
                existing.role = user_data.get('role', 'employer')
                existing.subscription_tier = user_data['subscription_tier']
                existing.subscription_status = user_data['subscription_status']
                existing.is_admin = user_data['is_admin']
                existing.reward_points = user_data['reward_points']
                existing.set_password(user_data['password'])
            else:
                print(f"   Creating user: {email} ({user_data.get('role', 'employer')})")
                user = User(
                    email=email,
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    role=user_data.get('role', 'employer'),
                    subscription_tier=user_data['subscription_tier'],
                    subscription_status=user_data['subscription_status'],
                    is_admin=user_data['is_admin'],
                    reward_points=user_data['reward_points'],
                )
                user.set_password(user_data['password'])
                db.session.add(user)
        
        db.session.commit()
        
        print("\n" + "="*60)
        print(" TEST ACCOUNTS READY!")
        print("="*60)
        print("\n Login Credentials by ROLE:\n")
        print("  ╔═══════════════════════════════════════════════════════╗")
        print("  ║ PLATFORM ADMIN (Full Access - You)                    ║")
        print("  ╠═══════════════════════════════════════════════════════╣")
        print("  ║ Email: admin@saurellius.com                           ║")
        print("  ║ Password: Admin123!                                   ║")
        print("  ║ Features: Everything + Admin Portal                   ║")
        print("  ╚═══════════════════════════════════════════════════════╝")
        print("")
        print("  ╔═══════════════════════════════════════════════════════╗")
        print("  ║ EMPLOYER (Company Owner)                              ║")
        print("  ╠═══════════════════════════════════════════════════════╣")
        print("  ║ Email: employer@test.com                              ║")
        print("  ║ Password: Test123!                                    ║")
        print("  ║ Features: Employees, Payroll, Reports, Tax,           ║")
        print("  ║           Contractors, Compliance, Garnishments       ║")
        print("  ╚═══════════════════════════════════════════════════════╝")
        print("")
        print("  ╔═══════════════════════════════════════════════════════╗")
        print("  ║ MANAGER (Team Lead)                                   ║")
        print("  ╠═══════════════════════════════════════════════════════╣")
        print("  ║ Email: manager@test.com                               ║")
        print("  ║ Password: Test123!                                    ║")
        print("  ║ Features: Team management, Approve PTO/Swaps,         ║")
        print("  ║           Reports, Workforce view                     ║")
        print("  ╚═══════════════════════════════════════════════════════╝")
        print("")
        print("  ╔═══════════════════════════════════════════════════════╗")
        print("  ║ EMPLOYEE (Regular Worker)                             ║")
        print("  ╠═══════════════════════════════════════════════════════╣")
        print("  ║ Email: employee@test.com                              ║")
        print("  ║ Password: Test123!                                    ║")
        print("  ║ Features: Time Off, SWIPE, Messages, Benefits,        ║")
        print("  ║           View Paystubs, Clock In/Out                 ║")
        print("  ╚═══════════════════════════════════════════════════════╝")
        print("")
        print("="*60 + "\n")

if __name__ == '__main__':
    seed_users()
