"""
 SAURELLIUS DATABASE MODELS
SQLAlchemy ORM models for the application
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    """User account model."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    
    # Subscription & Billing
    subscription_tier = db.Column(db.String(50), default='free')  # free, starter, professional, business
    subscription_status = db.Column(db.String(50), default='inactive')  # active, inactive, past_due, cancelled
    stripe_customer_id = db.Column(db.String(255), index=True)
    stripe_subscription_id = db.Column(db.String(255))
    
    # Usage tracking
    paystubs_this_month = db.Column(db.Integer, default=0)
    total_paystubs_generated = db.Column(db.Integer, default=0)
    billing_cycle_start = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Rewards
    reward_points = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    companies = db.relationship('Company', backref='owner', lazy='dynamic')
    employees = db.relationship('Employee', backref='owner', lazy='dynamic')
    paystubs = db.relationship('Paystub', backref='owner', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'subscription_tier': self.subscription_tier,
            'subscription_status': self.subscription_status,
            'paystubs_this_month': self.paystubs_this_month,
            'reward_points': self.reward_points,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Company(db.Model):
    """Company/Business model."""
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(500))
    city = db.Column(db.String(100))
    state = db.Column(db.String(50))
    zip_code = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    ein = db.Column(db.String(20))  # Employer Identification Number
    
    # Settings
    pay_frequency = db.Column(db.String(50), default='biweekly')  # weekly, biweekly, semimonthly, monthly
    default_theme = db.Column(db.String(50), default='diego_original')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employees = db.relationship('Employee', backref='company', lazy='dynamic')
    paystubs = db.relationship('Paystub', backref='company', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'phone': self.phone,
            'ein': self.ein,
            'pay_frequency': self.pay_frequency,
            'default_theme': self.default_theme
        }


class Employee(db.Model):
    """Employee model."""
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    
    # Personal info
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    ssn_last_four = db.Column(db.String(4))  # Only store last 4 digits
    
    # Address
    address = db.Column(db.String(500))
    city = db.Column(db.String(100))
    state = db.Column(db.String(50))
    zip_code = db.Column(db.String(20))
    
    # Employment details
    employee_id = db.Column(db.String(50))  # Company-assigned ID
    department = db.Column(db.String(100))
    position = db.Column(db.String(100))
    hire_date = db.Column(db.Date)
    pay_rate = db.Column(db.Float, default=0.0)
    pay_type = db.Column(db.String(20), default='hourly')  # hourly, salary
    
    # Tax info
    filing_status = db.Column(db.String(20), default='single')  # single, married, head_of_household
    allowances = db.Column(db.Integer, default=0)
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    paystubs = db.relationship('Paystub', backref='employee', lazy='dynamic')
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'position': self.position,
            'department': self.department,
            'pay_rate': self.pay_rate,
            'pay_type': self.pay_type,
            'is_active': self.is_active
        }


class Paystub(db.Model):
    """Paystub model."""
    __tablename__ = 'paystubs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    
    # Pay period
    pay_period_start = db.Column(db.Date, nullable=False)
    pay_period_end = db.Column(db.Date, nullable=False)
    pay_date = db.Column(db.Date, nullable=False)
    
    # Earnings
    regular_hours = db.Column(db.Float, default=0.0)
    overtime_hours = db.Column(db.Float, default=0.0)
    regular_pay = db.Column(db.Float, default=0.0)
    overtime_pay = db.Column(db.Float, default=0.0)
    gross_pay = db.Column(db.Float, default=0.0)
    
    # Deductions (JSON field for flexibility)
    deductions = db.Column(db.JSON, default={})
    total_deductions = db.Column(db.Float, default=0.0)
    
    # Net pay
    net_pay = db.Column(db.Float, default=0.0)
    
    # YTD totals
    ytd_gross = db.Column(db.Float, default=0.0)
    ytd_net = db.Column(db.Float, default=0.0)
    ytd_deductions = db.Column(db.Float, default=0.0)
    
    # Document info
    verification_id = db.Column(db.String(100), unique=True)
    document_hash = db.Column(db.String(255))
    pdf_url = db.Column(db.String(500))
    theme = db.Column(db.String(50), default='diego_original')
    
    # Status
    status = db.Column(db.String(20), default='generated')  # generated, sent, viewed
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'pay_period_start': self.pay_period_start.isoformat() if self.pay_period_start else None,
            'pay_period_end': self.pay_period_end.isoformat() if self.pay_period_end else None,
            'pay_date': self.pay_date.isoformat() if self.pay_date else None,
            'gross_pay': self.gross_pay,
            'net_pay': self.net_pay,
            'total_deductions': self.total_deductions,
            'verification_id': self.verification_id,
            'pdf_url': self.pdf_url,
            'theme': self.theme,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Subscription(db.Model):
    """Subscription history model."""
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    stripe_subscription_id = db.Column(db.String(255), index=True)
    stripe_customer_id = db.Column(db.String(255))
    stripe_price_id = db.Column(db.String(255))
    
    plan = db.Column(db.String(50))  # starter, professional, business
    status = db.Column(db.String(50))  # active, cancelled, past_due
    
    current_period_start = db.Column(db.DateTime)
    current_period_end = db.Column(db.DateTime)
    cancel_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Invoice(db.Model):
    """Invoice/Payment history model."""
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    stripe_invoice_id = db.Column(db.String(255), index=True)
    stripe_payment_intent_id = db.Column(db.String(255))
    
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='usd')
    status = db.Column(db.String(50))  # paid, open, void, uncollectible
    
    description = db.Column(db.String(500))
    invoice_pdf_url = db.Column(db.String(500))
    
    paid_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
