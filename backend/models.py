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
    
    # Role & Admin access
    role = db.Column(db.String(50), default='employer')  # employer, manager, employee
    is_admin = db.Column(db.Boolean, default=False)  # Platform admin (you)
    
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
