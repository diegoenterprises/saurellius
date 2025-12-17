"""
 SAURELLIUS DATABASE MODELS
SQLAlchemy ORM models for the application
"""

import json
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
    
    # Role & Admin access
    role = db.Column(db.String(50), default='employer')  # employer, manager, employee
    is_admin = db.Column(db.Boolean, default=False)  # Platform admin (you)
    
    # Profile
    profile_picture = db.Column(db.Text)  # Base64 encoded image or URL
    is_active = db.Column(db.Boolean, default=True)
    
    # User Preferences
    dark_mode = db.Column(db.Boolean, default=True)
    language = db.Column(db.String(10), default='en')
    timezone = db.Column(db.String(50), default='America/Chicago')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    companies = db.relationship('Company', backref='owner', lazy='dynamic')
    employees = db.relationship('Employee', backref='owner', lazy='dynamic')
    paystubs = db.relationship('Paystub', backref='owner', lazy='dynamic')
    
    def set_password(self, password):
        # Use pbkdf2:sha256 for compatibility with macOS LibreSSL
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
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
            'role': self.role or 'employer',
            'subscription_tier': self.subscription_tier,
            'subscription_status': self.subscription_status,
            'paystubs_this_month': self.paystubs_this_month,
            'reward_points': self.reward_points,
            'is_admin': self.is_admin or False,
            'profile_picture': self.profile_picture,
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
    additional_withholding = db.Column(db.Float, default=0.0)
    work_state = db.Column(db.String(2))  # State where work is performed
    
    # YTD Totals (updated after each payroll)
    ytd_gross = db.Column(db.Float, default=0.0)
    ytd_federal_tax = db.Column(db.Float, default=0.0)
    ytd_state_tax = db.Column(db.Float, default=0.0)
    ytd_local_tax = db.Column(db.Float, default=0.0)
    ytd_social_security = db.Column(db.Float, default=0.0)
    ytd_social_security_wages = db.Column(db.Float, default=0.0)
    ytd_medicare = db.Column(db.Float, default=0.0)
    ytd_401k = db.Column(db.Float, default=0.0)
    ytd_net_pay = db.Column(db.Float, default=0.0)
    
    # Wage base tracking (for tax limits)
    ytd_futa_wages = db.Column(db.Float, default=0.0)
    ytd_suta_wages = db.Column(db.Float, default=0.0)
    ytd_sdi_wages = db.Column(db.Float, default=0.0)
    
    # Benefits tracking
    workers_comp_class_code = db.Column(db.String(10))  # e.g., "8810" for clerical
    
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


class PayrollRun(db.Model):
    """Payroll Run model - tracks each payroll execution."""
    __tablename__ = 'payroll_runs'
    
    id = db.Column(db.String(36), primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Pay Period
    pay_period_start = db.Column(db.Date, nullable=False)
    pay_period_end = db.Column(db.Date, nullable=False)
    pay_date = db.Column(db.Date, nullable=False)
    check_date = db.Column(db.Date)
    
    # Configuration
    pay_frequency = db.Column(db.String(20), default='biweekly')
    pay_type = db.Column(db.String(20), default='regular')  # regular, bonus, off_cycle, final
    description = db.Column(db.String(255))
    
    # Totals
    employee_count = db.Column(db.Integer, default=0)
    gross_pay = db.Column(db.Float, default=0.0)
    total_taxes = db.Column(db.Float, default=0.0)
    total_deductions = db.Column(db.Float, default=0.0)
    net_pay = db.Column(db.Float, default=0.0)
    employer_taxes = db.Column(db.Float, default=0.0)
    total_cost = db.Column(db.Float, default=0.0)
    
    # Tax Totals (for liability tracking)
    federal_withheld = db.Column(db.Float, default=0.0)
    state_withheld = db.Column(db.Float, default=0.0)
    local_withheld = db.Column(db.Float, default=0.0)
    employee_ss = db.Column(db.Float, default=0.0)
    employee_medicare = db.Column(db.Float, default=0.0)
    employer_ss = db.Column(db.Float, default=0.0)
    employer_medicare = db.Column(db.Float, default=0.0)
    futa = db.Column(db.Float, default=0.0)
    suta = db.Column(db.Float, default=0.0)
    
    # Status
    status = db.Column(db.String(20), default='draft')  # draft, pending_approval, approved, processing, completed, cancelled
    created_by = db.Column(db.Integer)
    approved_by = db.Column(db.Integer)
    approved_at = db.Column(db.DateTime)
    processed_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)
    cancellation_reason = db.Column(db.String(255))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    paychecks = db.relationship('Paycheck', backref='payroll_run', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'pay_period_start': self.pay_period_start.isoformat() if self.pay_period_start else None,
            'pay_period_end': self.pay_period_end.isoformat() if self.pay_period_end else None,
            'pay_date': self.pay_date.isoformat() if self.pay_date else None,
            'pay_frequency': self.pay_frequency,
            'pay_type': self.pay_type,
            'description': self.description,
            'employee_count': self.employee_count,
            'gross_pay': self.gross_pay,
            'total_taxes': self.total_taxes,
            'total_deductions': self.total_deductions,
            'net_pay': self.net_pay,
            'employer_taxes': self.employer_taxes,
            'total_cost': self.total_cost,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Paycheck(db.Model):
    """Individual employee paycheck within a payroll run."""
    __tablename__ = 'paychecks'
    
    id = db.Column(db.String(36), primary_key=True)
    payroll_run_id = db.Column(db.String(36), db.ForeignKey('payroll_runs.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    
    # Employee snapshot (in case employee data changes)
    employee_name = db.Column(db.String(200))
    department = db.Column(db.String(100))
    pay_rate = db.Column(db.Float)
    pay_type = db.Column(db.String(20))
    
    # Pay Period
    pay_period_start = db.Column(db.Date)
    pay_period_end = db.Column(db.Date)
    pay_date = db.Column(db.Date)
    
    # Earnings (JSON for flexibility)
    earnings = db.Column(db.JSON, default={})
    gross_pay = db.Column(db.Float, default=0.0)
    
    # Taxes (JSON)
    taxes = db.Column(db.JSON, default={})
    total_taxes = db.Column(db.Float, default=0.0)
    
    # Deductions (JSON)
    deductions = db.Column(db.JSON, default={})
    total_deductions = db.Column(db.Float, default=0.0)
    
    # Employer Taxes (JSON)
    employer_taxes = db.Column(db.JSON, default={})
    total_employer_taxes = db.Column(db.Float, default=0.0)
    
    # Net Pay
    net_pay = db.Column(db.Float, default=0.0)
    
    # YTD at time of paycheck
    ytd_gross = db.Column(db.Float, default=0.0)
    ytd_net = db.Column(db.Float, default=0.0)
    
    # Payment
    payment_method = db.Column(db.String(20), default='direct_deposit')
    payment_status = db.Column(db.String(20), default='pending')  # pending, processed, failed
    ach_batch_id = db.Column(db.String(36))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'payroll_run_id': self.payroll_run_id,
            'employee_id': self.employee_id,
            'employee_name': self.employee_name,
            'gross_pay': self.gross_pay,
            'total_taxes': self.total_taxes,
            'total_deductions': self.total_deductions,
            'net_pay': self.net_pay,
            'payment_status': self.payment_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AuditLog(db.Model):
    """Audit trail for all payroll actions."""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    
    # Action details
    action = db.Column(db.String(100), nullable=False)  # payroll.created, employee.updated, etc.
    entity_type = db.Column(db.String(50))  # payroll_run, employee, paystub
    entity_id = db.Column(db.String(36))
    
    # Change tracking
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    
    # Request context
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BankAccount(db.Model):
    """Employee/Contractor bank accounts for direct deposit."""
    __tablename__ = 'bank_accounts'
    
    id = db.Column(db.String(36), primary_key=True)
    owner_id = db.Column(db.Integer, nullable=False)  # employee_id or contractor_id
    owner_type = db.Column(db.String(20), nullable=False)  # employee, contractor
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    
    # Bank Details (encrypted in production)
    bank_name = db.Column(db.String(100))
    routing_number_last4 = db.Column(db.String(4))
    routing_number_encrypted = db.Column(db.String(255))
    account_number_last4 = db.Column(db.String(4))
    account_number_encrypted = db.Column(db.String(255))
    account_type = db.Column(db.String(20), default='checking')  # checking, savings
    account_holder_name = db.Column(db.String(200))
    
    # Split deposit settings
    is_primary = db.Column(db.Boolean, default=True)
    split_type = db.Column(db.String(20), default='full')  # full, percentage, fixed
    split_amount = db.Column(db.Float, default=100)  # Percentage or fixed amount
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, verified, failed, closed
    verified_at = db.Column(db.DateTime)
    prenote_sent_at = db.Column(db.DateTime)
    prenote_status = db.Column(db.String(20))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TaxLiability(db.Model):
    """Track tax liabilities for deposit scheduling."""
    __tablename__ = 'tax_liabilities'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    payroll_run_id = db.Column(db.String(36), db.ForeignKey('payroll_runs.id'))
    
    # Tax type
    tax_type = db.Column(db.String(50), nullable=False)  # federal_income, fica, futa, state_income, suta
    jurisdiction = db.Column(db.String(10))  # FED, CA, NY, etc.
    
    # Amounts
    employee_amount = db.Column(db.Float, default=0.0)
    employer_amount = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, default=0.0)
    
    # Period
    liability_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, deposited, filed
    deposited_at = db.Column(db.DateTime)
    deposit_confirmation = db.Column(db.String(100))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Garnishment(db.Model):
    """Employee garnishment orders."""
    __tablename__ = 'garnishments'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    
    # Garnishment details
    garnishment_type = db.Column(db.String(50), nullable=False)  # child_support, tax_levy, creditor, student_loan
    case_number = db.Column(db.String(100))
    court_order_date = db.Column(db.Date)
    
    # Amount
    amount_type = db.Column(db.String(20), default='fixed')  # fixed, percentage
    amount = db.Column(db.Float, nullable=False)
    max_percent_disposable = db.Column(db.Float)  # Max % of disposable income
    
    # Priority (federal rules)
    priority = db.Column(db.Integer, default=5)  # 1 = highest priority
    
    # Payee
    payee_name = db.Column(db.String(200))
    payee_address = db.Column(db.String(500))
    payee_account = db.Column(db.String(100))
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, completed, suspended
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    total_withheld = db.Column(db.Float, default=0.0)
    total_required = db.Column(db.Float)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Kudos(db.Model):
    """Kudos/recognition messages between users."""
    __tablename__ = 'kudos'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, nullable=False)
    sender_type = db.Column(db.String(20), nullable=False)
    recipient_id = db.Column(db.Integer, nullable=False)
    recipient_type = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    badge_type = db.Column(db.String(50), default='star')
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'sender_type': self.sender_type,
            'recipient_id': self.recipient_id,
            'recipient_type': self.recipient_type,
            'message': self.message,
            'badge_type': self.badge_type,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Message(db.Model):
    """Internal messaging between users."""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, nullable=False)
    sender_type = db.Column(db.String(20), nullable=False)
    recipient_id = db.Column(db.Integer, nullable=False)
    recipient_type = db.Column(db.String(20), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='normal')
    status = db.Column(db.String(20), default='sent')
    read_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'sender_type': self.sender_type,
            'recipient_id': self.recipient_id,
            'recipient_type': self.recipient_type,
            'subject': self.subject,
            'body': self.body,
            'priority': self.priority,
            'status': self.status,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class APIClient(db.Model):
    """Tax Engine API clients."""
    __tablename__ = 'api_clients'
    
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    contact_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255), nullable=False, unique=True)
    api_type = db.Column(db.String(50), default='tax_engine')
    api_key = db.Column(db.String(64), nullable=False, unique=True, index=True)
    api_secret_hash = db.Column(db.String(255), nullable=False)
    api_tier = db.Column(db.String(20), default='basic')
    rate_limit = db.Column(db.Integer, default=1000)
    requests_this_month = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer)
    suspended_at = db.Column(db.DateTime)
    suspended_by = db.Column(db.Integer)
    key_regenerated_at = db.Column(db.DateTime)
    last_request_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_name': self.company_name,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'api_type': self.api_type,
            'api_key': self.api_key[:8] + '...' if self.api_key else None,
            'api_tier': self.api_tier,
            'rate_limit': self.rate_limit,
            'requests_this_month': self.requests_this_month,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_request_at': self.last_request_at.isoformat() if self.last_request_at else None
        }


class APILog(db.Model):
    """API request logs for usage tracking."""
    __tablename__ = 'api_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('api_clients.id'), index=True)
    endpoint = db.Column(db.String(255), nullable=False)
    method = db.Column(db.String(10), nullable=False)
    status_code = db.Column(db.Integer, nullable=False)
    response_time_ms = db.Column(db.Integer)
    request_ip = db.Column(db.String(50))
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


class SecuritySettings(db.Model):
    """User security settings."""
    __tablename__ = 'security_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    user_type = db.Column(db.String(20), nullable=False)
    enable_2fa = db.Column(db.Boolean, default=False)
    two_fa_method = db.Column(db.String(20))
    two_fa_secret = db.Column(db.String(255))
    login_notifications = db.Column(db.Boolean, default=True)
    suspicious_activity_alerts = db.Column(db.Boolean, default=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_type': self.user_type,
            'enable_2fa': self.enable_2fa,
            'two_fa_method': self.two_fa_method,
            'login_notifications': self.login_notifications,
            'suspicious_activity_alerts': self.suspicious_activity_alerts
        }


class ActiveSession(db.Model):
    """Active user sessions for session management."""
    __tablename__ = 'active_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    user_type = db.Column(db.String(20), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False)
    device_info = db.Column(db.String(255))
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'device_info': self.device_info,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None
        }


class Notification(db.Model):
    """User notifications."""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    user_type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')
    category = db.Column(db.String(50))
    action_url = db.Column(db.String(500))
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'category': self.category,
            'action_url': self.action_url,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Ruleset(db.Model):
    """Versioned, effective-dated rulesets (tax, compliance, payroll) stored as JSON payloads."""
    __tablename__ = 'rulesets'

    id = db.Column(db.Integer, primary_key=True)

    # Identification
    key = db.Column(db.String(120), nullable=False, index=True)  # e.g. irs_federal_withholding
    jurisdiction = db.Column(db.String(20), nullable=False, default='US')
    rule_type = db.Column(db.String(120), nullable=False)  # e.g. federal_income_tax_withholding
    version = db.Column(db.String(50), nullable=False, default='1')

    # Effective dating
    effective_start = db.Column(db.Date, nullable=False, index=True)
    effective_end = db.Column(db.Date, nullable=True, index=True)

    # Provenance
    source_name = db.Column(db.String(255))
    source_ref = db.Column(db.String(500))
    created_by = db.Column(db.Integer)

    # Payload
    payload_json = db.Column(db.Text, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('key', 'version', 'effective_start', name='uq_rulesets_key_version_start'),
    )

    def payload(self):
        try:
            return json.loads(self.payload_json) if self.payload_json else None
        except Exception:
            return None

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'jurisdiction': self.jurisdiction,
            'rule_type': self.rule_type,
            'version': self.version,
            'effective_start': self.effective_start.isoformat() if self.effective_start else None,
            'effective_end': self.effective_end.isoformat() if self.effective_end else None,
            'source_name': self.source_name,
            'source_ref': self.source_ref,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class FederalW4Form(db.Model):
    __tablename__ = 'federal_w4_forms'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False, index=True)
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    tax_year = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='active', index=True)

    filing_status = db.Column(db.String(30), nullable=False)
    step2_checkbox = db.Column(db.Boolean, default=False)
    step2_additional = db.Column(db.Float, default=0.0)
    qualifying_children = db.Column(db.Integer, default=0)
    other_dependents = db.Column(db.Integer, default=0)
    other_income = db.Column(db.Float, default=0.0)
    deductions = db.Column(db.Float, default=0.0)
    extra_withholding = db.Column(db.Float, default=0.0)

    claim_exempt = db.Column(db.Boolean, default=False)
    exempt_expiration = db.Column(db.Date)

    effective_date = db.Column(db.Date, nullable=False)
    signature = db.Column(db.String(255))
    signature_date = db.Column(db.Date)

    submitted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    superseded_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': f"W4-{self.id}",
            'employee_id': self.employee_id,
            'tax_year': self.tax_year,
            'status': self.status,
            'filing_status': self.filing_status,
            'step2_checkbox': self.step2_checkbox,
            'step2_additional': self.step2_additional,
            'qualifying_children': self.qualifying_children,
            'other_dependents': self.other_dependents,
            'other_income': self.other_income,
            'deductions': self.deductions,
            'extra_withholding': self.extra_withholding,
            'claim_exempt': self.claim_exempt,
            'exempt_expiration': self.exempt_expiration.isoformat() if self.exempt_expiration else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'submitted_by': self.submitted_by,
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'signature': self.signature,
            'signature_date': self.signature_date.isoformat() if self.signature_date else None,
            'superseded_at': self.superseded_at.isoformat() if self.superseded_at else None,
        }


class StateWithholdingForm(db.Model):
    __tablename__ = 'state_withholding_forms'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False, index=True)
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    state = db.Column(db.String(2), nullable=False, index=True)
    form_name = db.Column(db.String(100))
    status = db.Column(db.String(20), nullable=False, default='active', index=True)

    filing_status = db.Column(db.String(30), default='single')
    allowances = db.Column(db.Integer, default=0)
    additional_withholding = db.Column(db.Float, default=0.0)
    claim_exempt = db.Column(db.Boolean, default=False)

    nyc_resident = db.Column(db.Boolean, default=False)
    yonkers_resident = db.Column(db.Boolean, default=False)
    local_tax_jurisdiction = db.Column(db.String(100))

    effective_date = db.Column(db.Date, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    superseded_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': f"STATE-{self.state}-{self.id}",
            'employee_id': self.employee_id,
            'state': self.state,
            'form_name': self.form_name,
            'status': self.status,
            'filing_status': self.filing_status,
            'allowances': self.allowances,
            'additional_withholding': self.additional_withholding,
            'claim_exempt': self.claim_exempt,
            'nyc_resident': self.nyc_resident,
            'yonkers_resident': self.yonkers_resident,
            'local_tax_jurisdiction': self.local_tax_jurisdiction,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'submitted_by': self.submitted_by,
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'superseded_at': self.superseded_at.isoformat() if self.superseded_at else None,
        }


class ContractorAccount(db.Model):
    __tablename__ = 'contractor_accounts'

    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    business_classification = db.Column(db.String(50), nullable=False)

    legal_name = db.Column(db.String(255))
    business_name = db.Column(db.String(255))
    dba_name = db.Column(db.String(255))
    date_of_birth = db.Column(db.String(20))
    working_status = db.Column(db.String(50))

    status = db.Column(db.String(50), default='pending_verification', index=True)
    email_verified = db.Column(db.Boolean, default=False)
    phone_verified = db.Column(db.Boolean, default=False)
    email_verification_code = db.Column(db.String(20))
    email_verification_expires = db.Column(db.DateTime)
    phone_verification_code = db.Column(db.String(20))
    phone_verification_expires = db.Column(db.DateTime)

    accept_terms = db.Column(db.Boolean, default=False)
    accept_privacy = db.Column(db.Boolean, default=False)
    accept_electronic_communications = db.Column(db.Boolean, default=False)
    accept_contractor_acknowledgment = db.Column(db.Boolean, default=False)

    onboarding_json = db.Column(db.Text)
    w9_complete = db.Column(db.Boolean, default=False)
    payment_setup_complete = db.Column(db.Boolean, default=False)

    profile_json = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_public_profile(self):
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'business_classification': self.business_classification,
            'legal_name': self.legal_name,
            'business_name': self.business_name,
            'dba_name': self.dba_name,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'w9_complete': self.w9_complete,
            'payment_setup_complete': self.payment_setup_complete,
        }


class ContractorInvitation(db.Model):
    __tablename__ = 'contractor_invitations'

    id = db.Column(db.String(36), primary_key=True)
    token = db.Column(db.String(128), unique=True, index=True, nullable=False)
    client_id = db.Column(db.String(36), nullable=False, index=True)

    contractor_email = db.Column(db.String(255), nullable=False)
    contractor_name = db.Column(db.String(255))
    start_date = db.Column(db.String(20))
    project_description = db.Column(db.Text)
    personal_message = db.Column(db.Text)
    expires_at = db.Column(db.DateTime)

    status = db.Column(db.String(30), default='pending', index=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'token': self.token,
            'client_id': self.client_id,
            'contractor_email': self.contractor_email,
            'contractor_name': self.contractor_name or '',
            'start_date': self.start_date,
            'project_description': self.project_description,
            'personal_message': self.personal_message,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'status': self.status,
        }


class ContractorPaymentMethod(db.Model):
    __tablename__ = 'contractor_payment_methods'

    id = db.Column(db.Integer, primary_key=True)
    contractor_id = db.Column(db.String(36), db.ForeignKey('contractor_accounts.id'), nullable=False, index=True)
    status = db.Column(db.String(20), default='active', index=True)

    method = db.Column(db.String(30), nullable=False)
    payload_json = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def payload(self):
        try:
            return json.loads(self.payload_json) if self.payload_json else None
        except Exception:
            return None


class ContractorInvoice(db.Model):
    __tablename__ = 'contractor_invoices'

    id = db.Column(db.String(36), primary_key=True)
    contractor_id = db.Column(db.String(36), db.ForeignKey('contractor_accounts.id'), nullable=False, index=True)
    client_id = db.Column(db.String(36), nullable=False, index=True)
    project_id = db.Column(db.String(36), nullable=True, index=True)

    invoice_number = db.Column(db.String(50), nullable=False, index=True)
    line_items_json = db.Column(db.Text, nullable=False)

    subtotal = db.Column(db.Float, default=0.0)
    tax_rate = db.Column(db.Float, default=0.0)
    tax_amount = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='USD')

    invoice_date = db.Column(db.String(20))
    due_date = db.Column(db.String(20))
    payment_terms = db.Column(db.String(30), default='net_30')
    notes = db.Column(db.Text)
    terms = db.Column(db.Text)

    status = db.Column(db.String(20), default='draft', index=True)
    sent_at = db.Column(db.DateTime)
    viewed_at = db.Column(db.DateTime)
    paid_at = db.Column(db.DateTime)
    amount_paid = db.Column(db.Float, default=0.0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def line_items(self):
        try:
            return json.loads(self.line_items_json) if self.line_items_json else []
        except Exception:
            return []

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'contractor_id': self.contractor_id,
            'client_id': self.client_id,
            'project_id': self.project_id,
            'line_items': self.line_items(),
            'subtotal': self.subtotal,
            'tax_rate': self.tax_rate,
            'tax_amount': self.tax_amount,
            'total': self.total,
            'currency': self.currency,
            'invoice_date': self.invoice_date,
            'due_date': self.due_date,
            'payment_terms': self.payment_terms,
            'notes': self.notes,
            'terms': self.terms,
            'status': self.status,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'viewed_at': self.viewed_at.isoformat() if self.viewed_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'amount_paid': self.amount_paid,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ContractorInvoicePayment(db.Model):
    __tablename__ = 'contractor_invoice_payments'

    id = db.Column(db.String(36), primary_key=True)
    invoice_id = db.Column(db.String(36), db.ForeignKey('contractor_invoices.id'), nullable=False, index=True)
    contractor_id = db.Column(db.String(36), db.ForeignKey('contractor_accounts.id'), nullable=False, index=True)
    client_id = db.Column(db.String(36), nullable=False, index=True)

    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(30), default='ach')
    payment_date = db.Column(db.String(20))
    reference_number = db.Column(db.String(100))
    notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'contractor_id': self.contractor_id,
            'client_id': self.client_id,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'payment_date': self.payment_date,
            'reference_number': self.reference_number,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ContractorW9Form(db.Model):
    __tablename__ = 'contractor_w9_forms'

    id = db.Column(db.String(36), primary_key=True)
    contractor_id = db.Column(db.String(36), db.ForeignKey('contractor_accounts.id'), nullable=False, index=True)

    name = db.Column(db.String(255), nullable=False)
    business_name = db.Column(db.String(255))
    tax_classification = db.Column(db.String(50))
    address = db.Column(db.Text)

    tin_type = db.Column(db.String(10))
    tin_masked = db.Column(db.String(20))
    tin_encrypted = db.Column(db.String(255))

    status = db.Column(db.String(30), default='submitted', index=True)
    signature_date = db.Column(db.String(20))
    ip_address = db.Column(db.String(50))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_safe_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'business_name': self.business_name,
            'tax_classification': self.tax_classification,
            'address': self.address,
            'tin_type': self.tin_type,
            'tin_masked': self.tin_masked,
            'status': self.status,
            'signature_date': self.signature_date,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ContractorExpense(db.Model):
    __tablename__ = 'contractor_expenses'

    id = db.Column(db.String(36), primary_key=True)
    contractor_id = db.Column(db.String(36), db.ForeignKey('contractor_accounts.id'), nullable=False, index=True)

    date = db.Column(db.String(20), nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    description = db.Column(db.Text)
    vendor = db.Column(db.String(255))
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='USD')

    is_billable = db.Column(db.Boolean, default=False)
    client_id = db.Column(db.String(36), index=True)
    project_id = db.Column(db.String(36), index=True)
    receipt_url = db.Column(db.String(500))
    tax_deductible = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(30), default='logged', index=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'contractor_id': self.contractor_id,
            'date': self.date,
            'category': self.category,
            'description': self.description,
            'vendor': self.vendor,
            'amount': self.amount,
            'currency': self.currency,
            'is_billable': self.is_billable,
            'client_id': self.client_id,
            'project_id': self.project_id,
            'receipt_url': self.receipt_url,
            'tax_deductible': self.tax_deductible,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ContractorMileageLog(db.Model):
    __tablename__ = 'contractor_mileage_logs'

    id = db.Column(db.String(36), primary_key=True)
    contractor_id = db.Column(db.String(36), db.ForeignKey('contractor_accounts.id'), nullable=False, index=True)

    date = db.Column(db.String(20), nullable=False, index=True)
    miles = db.Column(db.Float, nullable=False)
    purpose = db.Column(db.Text)
    from_location = db.Column(db.String(255))
    to_location = db.Column(db.String(255))
    client_id = db.Column(db.String(36), index=True)
    project_id = db.Column(db.String(36), index=True)
    is_round_trip = db.Column(db.Boolean, default=False)
    irs_rate = db.Column(db.Float)
    deduction_amount = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'contractor_id': self.contractor_id,
            'date': self.date,
            'miles': self.miles,
            'purpose': self.purpose,
            'from_location': self.from_location,
            'to_location': self.to_location,
            'client_id': self.client_id,
            'project_id': self.project_id,
            'is_round_trip': self.is_round_trip,
            'irs_rate': self.irs_rate,
            'deduction_amount': self.deduction_amount,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ContractorForm1099(db.Model):
    __tablename__ = 'contractor_1099_forms'

    id = db.Column(db.String(36), primary_key=True)
    contractor_id = db.Column(db.String(36), db.ForeignKey('contractor_accounts.id'), nullable=False, index=True)
    client_id = db.Column(db.String(36), nullable=False, index=True)
    tax_year = db.Column(db.Integer, nullable=False, index=True)

    recipient_name = db.Column(db.String(255))
    recipient_tin_masked = db.Column(db.String(20))
    recipient_tin_type = db.Column(db.String(10))
    recipient_address = db.Column(db.Text)

    box_1_nonemployee_compensation = db.Column(db.Float, default=0.0)
    box_4_federal_tax_withheld = db.Column(db.Float, default=0.0)

    status = db.Column(db.String(30), default='generated', index=True)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    filed_at = db.Column(db.DateTime)
    sent_to_contractor_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'tax_year': self.tax_year,
            'contractor_id': self.contractor_id,
            'client_id': self.client_id,
            'recipient_name': self.recipient_name,
            'recipient_tin_masked': self.recipient_tin_masked,
            'recipient_tin_type': self.recipient_tin_type,
            'recipient_address': self.recipient_address,
            'box_1_nonemployee_compensation': self.box_1_nonemployee_compensation,
            'box_4_federal_tax_withheld': self.box_4_federal_tax_withheld,
            'status': self.status,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'filed_at': self.filed_at.isoformat() if self.filed_at else None,
            'sent_to_contractor_at': self.sent_to_contractor_at.isoformat() if self.sent_to_contractor_at else None,
        }
