"""
SAURELLIUS PRODUCTION MODELS
Enterprise-grade models for full production payroll operations
Captures ALL regulatory information required for legal payroll processing
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from cryptography.fernet import Fernet
import os

db = SQLAlchemy()

# ============================================================================
# EMPLOYER/COMPANY REGISTRATION - FULL REGULATORY COMPLIANCE
# ============================================================================

class CompanyRegistration(db.Model):
    """Complete employer registration with all regulatory information."""
    __tablename__ = 'company_registrations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # ========== COMPANY INFORMATION ==========
    legal_name = db.Column(db.String(255), nullable=False)
    dba_name = db.Column(db.String(255))  # Doing Business As
    entity_type = db.Column(db.String(50), nullable=False)  # corporation, llc, partnership, sole_proprietor, s_corp, non_profit
    naics_code = db.Column(db.String(10))  # Industry classification
    formation_date = db.Column(db.Date)
    state_of_incorporation = db.Column(db.String(2))
    
    # Physical Address
    physical_address = db.Column(db.String(500), nullable=False)
    physical_city = db.Column(db.String(100), nullable=False)
    physical_state = db.Column(db.String(2), nullable=False)
    physical_zip = db.Column(db.String(10), nullable=False)
    physical_county = db.Column(db.String(100))
    
    # Mailing Address (if different)
    mailing_address = db.Column(db.String(500))
    mailing_city = db.Column(db.String(100))
    mailing_state = db.Column(db.String(2))
    mailing_zip = db.Column(db.String(10))
    
    # Contact Info
    primary_phone = db.Column(db.String(20), nullable=False)
    primary_email = db.Column(db.String(255), nullable=False)
    website = db.Column(db.String(255))
    
    # ========== FEDERAL TAX REGISTRATION ==========
    ein = db.Column(db.String(20), nullable=False)  # XX-XXXXXXX format (encrypted)
    ein_encrypted = db.Column(db.LargeBinary)  # AES-256 encrypted EIN
    fica_depositor_frequency = db.Column(db.String(20), default='semi_weekly')  # monthly, semi_weekly
    form_941_schedule = db.Column(db.String(20), default='quarterly')  # quarterly, annual (944)
    federal_tax_account_number = db.Column(db.String(50))
    
    # ========== STATE TAX REGISTRATIONS ==========
    # Stored as JSON for multi-state support
    state_tax_registrations = db.Column(db.JSON, default={})
    # Example: {
    #   "CA": {"state_ein": "XXX-XXXX-X", "sui_account": "XXX-XXX-X", "sui_rate": 3.4},
    #   "NY": {"state_ein": "XXX-XXXXXX", "sui_account": "XXX-XXX-X", "sui_rate": 2.1}
    # }
    
    # Primary operational state
    primary_state = db.Column(db.String(2), nullable=False)
    
    # State Unemployment Insurance
    sui_account_number = db.Column(db.String(50))
    sui_rate = db.Column(db.Float, default=2.7)  # Experience rate
    sui_rate_effective_date = db.Column(db.Date)
    
    # ========== LOCAL TAX JURISDICTIONS ==========
    local_tax_jurisdictions = db.Column(db.JSON, default=[])
    # Example: [
    #   {"jurisdiction": "Philadelphia", "type": "city", "account": "XXX", "rate": 3.8712},
    #   {"jurisdiction": "NYC", "type": "city", "account": "XXX", "resident_rate": 3.876}
    # ]
    
    # ========== WORKERS COMPENSATION ==========
    workers_comp_carrier = db.Column(db.String(255))
    workers_comp_policy_number = db.Column(db.String(100))
    workers_comp_policy_effective = db.Column(db.Date)
    workers_comp_policy_expiration = db.Column(db.Date)
    workers_comp_class_codes = db.Column(db.JSON, default=[])  # List of class codes and rates
    
    # ========== BANKING & ACH ==========
    bank_name = db.Column(db.String(255))
    bank_routing_number = db.Column(db.String(9))  # ABA routing number
    bank_account_number_encrypted = db.Column(db.LargeBinary)  # AES-256 encrypted
    bank_account_type = db.Column(db.String(20))  # checking, savings
    bank_verified = db.Column(db.Boolean, default=False)
    bank_verification_method = db.Column(db.String(50))  # micro_deposit, instant, plaid
    bank_verification_date = db.Column(db.DateTime)
    
    # Tax payment account (if different)
    tax_bank_routing = db.Column(db.String(9))
    tax_bank_account_encrypted = db.Column(db.LargeBinary)
    
    # ========== REGULATORY COMPLIANCE ==========
    # E-Verify
    everify_enrolled = db.Column(db.Boolean, default=False)
    everify_company_id = db.Column(db.String(50))
    everify_credentials_encrypted = db.Column(db.LargeBinary)
    
    # OSHA
    osha_workplace_classification = db.Column(db.String(50))
    osha_establishment_size = db.Column(db.String(20))  # small, large
    
    # EEO-1 Reporting
    eeo1_required = db.Column(db.Boolean, default=False)
    eeo1_company_number = db.Column(db.String(50))
    
    # ACA Compliance
    aca_ale_status = db.Column(db.Boolean, default=False)  # Applicable Large Employer
    aca_full_time_equivalent_count = db.Column(db.Integer, default=0)
    
    # Garnishment Processing
    garnishment_processing_authorized = db.Column(db.Boolean, default=False)
    child_support_agencies = db.Column(db.JSON, default={})  # State agencies for child support
    
    # ========== PAYROLL SETTINGS ==========
    pay_frequency = db.Column(db.String(20), default='biweekly')  # weekly, biweekly, semi_monthly, monthly
    default_pay_day = db.Column(db.String(20))  # friday, 15_and_last, etc.
    default_payment_method = db.Column(db.String(20), default='direct_deposit')  # direct_deposit, check, wallet
    
    # Check Stock (if using physical checks)
    check_stock_type = db.Column(db.String(50))
    check_starting_number = db.Column(db.Integer)
    check_bank_info = db.Column(db.JSON)
    
    # ========== SUBSCRIPTION & BILLING ==========
    subscription_plan = db.Column(db.String(50), default='starter')
    subscription_status = db.Column(db.String(50), default='pending')
    stripe_customer_id = db.Column(db.String(255))
    stripe_subscription_id = db.Column(db.String(255))
    billing_contact_name = db.Column(db.String(255))
    billing_contact_email = db.Column(db.String(255))
    billing_contact_phone = db.Column(db.String(20))
    
    # ========== ONBOARDING STATUS ==========
    registration_step = db.Column(db.Integer, default=1)  # Track progress
    registration_complete = db.Column(db.Boolean, default=False)
    registration_completed_at = db.Column(db.DateTime)
    
    # Compliance checklist
    compliance_status = db.Column(db.JSON, default={
        'ein_verified': False,
        'state_registrations_complete': False,
        'bank_verified': False,
        'workers_comp_verified': False,
        'tos_accepted': False,
        'privacy_policy_accepted': False
    })
    
    # Terms acceptance
    tos_accepted = db.Column(db.Boolean, default=False)
    tos_accepted_at = db.Column(db.DateTime)
    tos_accepted_ip = db.Column(db.String(50))
    privacy_policy_accepted = db.Column(db.Boolean, default=False)
    privacy_policy_accepted_at = db.Column(db.DateTime)
    
    # ========== TIMESTAMPS ==========
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_sensitive=False):
        result = {
            'id': self.id,
            'legal_name': self.legal_name,
            'dba_name': self.dba_name,
            'entity_type': self.entity_type,
            'naics_code': self.naics_code,
            'physical_address': self.physical_address,
            'physical_city': self.physical_city,
            'physical_state': self.physical_state,
            'physical_zip': self.physical_zip,
            'primary_phone': self.primary_phone,
            'primary_email': self.primary_email,
            'primary_state': self.primary_state,
            'ein_last_four': self.ein[-4:] if self.ein else None,
            'pay_frequency': self.pay_frequency,
            'subscription_plan': self.subscription_plan,
            'subscription_status': self.subscription_status,
            'registration_step': self.registration_step,
            'registration_complete': self.registration_complete,
            'compliance_status': self.compliance_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        return result


# ============================================================================
# EMPLOYEE REGISTRATION - FULL ONBOARDING COMPLIANCE
# ============================================================================

class EmployeeOnboarding(db.Model):
    """Complete employee onboarding with all regulatory forms."""
    __tablename__ = 'employee_onboardings'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company_registrations.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    
    # ========== PERSONAL INFORMATION ==========
    legal_first_name = db.Column(db.String(100), nullable=False)
    legal_middle_name = db.Column(db.String(100))
    legal_last_name = db.Column(db.String(100), nullable=False)
    suffix = db.Column(db.String(20))  # Jr., Sr., III, etc.
    preferred_name = db.Column(db.String(100))
    
    # SSN (encrypted)
    ssn_encrypted = db.Column(db.LargeBinary)  # AES-256 encrypted full SSN
    ssn_last_four = db.Column(db.String(4))  # For display purposes
    
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(20))  # For state reporting
    
    # Contact
    personal_email = db.Column(db.String(255), nullable=False)
    personal_phone = db.Column(db.String(20))
    work_email = db.Column(db.String(255))
    work_phone = db.Column(db.String(20))
    
    # Address (residence state determines tax withholding)
    residence_address = db.Column(db.String(500), nullable=False)
    residence_city = db.Column(db.String(100), nullable=False)
    residence_state = db.Column(db.String(2), nullable=False)
    residence_zip = db.Column(db.String(10), nullable=False)
    residence_county = db.Column(db.String(100))
    
    # Emergency Contact
    emergency_contact_name = db.Column(db.String(255))
    emergency_contact_relationship = db.Column(db.String(50))
    emergency_contact_phone = db.Column(db.String(20))
    emergency_contact_email = db.Column(db.String(255))
    
    # ========== EEO VOLUNTARY INFORMATION ==========
    ethnicity = db.Column(db.String(50))  # Voluntary for EEO-1
    race = db.Column(db.String(100))  # Voluntary for EEO-1
    veteran_status = db.Column(db.String(50))  # Voluntary
    disability_status = db.Column(db.String(50))  # Voluntary for ADA
    
    # ========== EMPLOYMENT DETAILS ==========
    hire_date = db.Column(db.Date, nullable=False)
    job_title = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100))
    cost_center = db.Column(db.String(50))
    work_location = db.Column(db.String(255))
    work_state = db.Column(db.String(2))  # Where work is performed
    
    employment_type = db.Column(db.String(50), nullable=False)  # full_time, part_time, temporary, seasonal
    flsa_classification = db.Column(db.String(20), nullable=False)  # exempt, non_exempt
    
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    
    # Compensation
    pay_type = db.Column(db.String(20), nullable=False)  # hourly, salary
    pay_rate = db.Column(db.Float, nullable=False)
    pay_frequency = db.Column(db.String(20))  # Override company default if needed
    overtime_eligible = db.Column(db.Boolean, default=True)
    overtime_rate = db.Column(db.Float, default=1.5)  # Multiplier
    
    # Commission (if applicable)
    commission_eligible = db.Column(db.Boolean, default=False)
    commission_structure = db.Column(db.JSON)
    
    # ========== FORM W-4 (2020+) ==========
    w4_version = db.Column(db.String(10), default='2020')  # 2020 or later
    w4_filing_status = db.Column(db.String(50))  # single, married_filing_jointly, head_of_household
    w4_multiple_jobs = db.Column(db.Boolean, default=False)  # Step 2(c)
    w4_dependents_amount = db.Column(db.Float, default=0)  # Step 3 total
    w4_other_income = db.Column(db.Float, default=0)  # Step 4(a)
    w4_deductions = db.Column(db.Float, default=0)  # Step 4(b)
    w4_extra_withholding = db.Column(db.Float, default=0)  # Step 4(c)
    w4_exempt = db.Column(db.Boolean, default=False)
    w4_signed_date = db.Column(db.Date)
    w4_signature = db.Column(db.Text)  # Digital signature data
    w4_document_id = db.Column(db.String(100))  # Reference to stored document
    
    # ========== STATE TAX FORMS ==========
    state_tax_forms = db.Column(db.JSON, default={})
    # Example: {
    #   "CA": {"form": "DE-4", "allowances": 1, "additional": 0, "signed": "2024-01-15"},
    #   "NY": {"form": "IT-2104", "allowances": 0, "additional": 50, "signed": "2024-01-15"}
    # }
    
    # State Disability Insurance
    sdi_enrolled = db.Column(db.Boolean, default=True)  # CA, NJ, NY, etc.
    pfml_enrolled = db.Column(db.Boolean, default=True)  # Paid Family Medical Leave
    
    # ========== FORM I-9 ==========
    i9_status = db.Column(db.String(50), default='pending')  # pending, section1_complete, verified, expired
    
    # Section 1 (Employee)
    i9_citizenship_status = db.Column(db.String(50))  # citizen, noncitizen_national, permanent_resident, alien_authorized
    i9_alien_number = db.Column(db.String(50))  # If applicable
    i9_admission_number = db.Column(db.String(50))  # I-94
    i9_foreign_passport_number = db.Column(db.String(50))
    i9_foreign_passport_country = db.Column(db.String(100))
    i9_work_authorization_expiration = db.Column(db.Date)
    i9_section1_signature = db.Column(db.Text)
    i9_section1_date = db.Column(db.Date)
    
    # Section 2 (Employer verification)
    i9_document_list = db.Column(db.String(10))  # A, B_C
    i9_documents = db.Column(db.JSON)  # Document details
    # Example: {
    #   "list_a": {"title": "US Passport", "number": "XXX", "expiration": "2030-01-01", "issuing_authority": "US Dept of State"},
    #   "list_b": {"title": "Driver's License", ...},
    #   "list_c": {"title": "Social Security Card", ...}
    # }
    i9_document_inspection_method = db.Column(db.String(50))  # physical, video
    i9_section2_employer_signature = db.Column(db.Text)
    i9_section2_date = db.Column(db.Date)
    i9_section2_employer_name = db.Column(db.String(255))
    i9_section2_employer_title = db.Column(db.String(100))
    
    # E-Verify
    everify_case_number = db.Column(db.String(50))
    everify_status = db.Column(db.String(50))
    everify_verification_date = db.Column(db.Date)
    
    # I-9 Retention (3 years from hire or 1 year from termination)
    i9_retention_date = db.Column(db.Date)
    
    # ========== DIRECT DEPOSIT ==========
    direct_deposit_accounts = db.Column(db.JSON, default=[])
    # Example: [
    #   {"bank_name": "Chase", "routing": "XXX", "account_encrypted": "XXX", "type": "checking", "amount_type": "percent", "amount": 100, "prenote_status": "verified"},
    #   {"bank_name": "Savings", "routing": "XXX", "account_encrypted": "XXX", "type": "savings", "amount_type": "fixed", "amount": 500, "prenote_status": "pending"}
    # ]
    direct_deposit_verified = db.Column(db.Boolean, default=False)
    prenote_sent_date = db.Column(db.Date)
    prenote_status = db.Column(db.String(50))  # pending, sent, verified, failed
    
    voided_check_document_id = db.Column(db.String(100))  # Reference to uploaded doc
    
    # ========== BENEFITS ENROLLMENT ==========
    benefits_eligible = db.Column(db.Boolean, default=True)
    benefits_waiting_period_end = db.Column(db.Date)
    benefits_enrollment_status = db.Column(db.String(50), default='pending')
    
    # Medical/Dental/Vision
    medical_plan_id = db.Column(db.String(50))
    medical_coverage_level = db.Column(db.String(50))  # employee, employee_spouse, family
    dental_plan_id = db.Column(db.String(50))
    dental_coverage_level = db.Column(db.String(50))
    vision_plan_id = db.Column(db.String(50))
    vision_coverage_level = db.Column(db.String(50))
    
    # Life & Disability
    life_insurance_coverage = db.Column(db.Float, default=0)
    supplemental_life = db.Column(db.Float, default=0)
    std_enrolled = db.Column(db.Boolean, default=False)
    ltd_enrolled = db.Column(db.Boolean, default=False)
    
    # 401(k)
    retirement_plan_enrolled = db.Column(db.Boolean, default=False)
    retirement_deferral_percent = db.Column(db.Float, default=0)
    retirement_deferral_amount = db.Column(db.Float, default=0)
    retirement_roth_percent = db.Column(db.Float, default=0)
    
    # FSA/HSA
    fsa_election = db.Column(db.Float, default=0)
    dependent_care_fsa = db.Column(db.Float, default=0)
    hsa_election = db.Column(db.Float, default=0)
    
    # Dependents
    dependents = db.Column(db.JSON, default=[])
    # Example: [{"name": "John Jr", "relationship": "child", "dob": "2015-01-01", "ssn_last_four": "1234"}]
    
    # Beneficiaries
    beneficiaries = db.Column(db.JSON, default=[])
    
    # ========== POLICY ACKNOWLEDGMENTS ==========
    policy_acknowledgments = db.Column(db.JSON, default={})
    # Example: {
    #   "employee_handbook": {"acknowledged": true, "date": "2024-01-15", "signature": "...", "ip": "..."},
    #   "arbitration_agreement": {"acknowledged": true, "date": "2024-01-15"},
    #   "code_of_conduct": {"acknowledged": true, "date": "2024-01-15"}
    # }
    
    # ========== WORK AUTHORIZATION (Non-Citizens) ==========
    visa_type = db.Column(db.String(50))  # H1B, L1, F1_OPT, etc.
    visa_expiration = db.Column(db.Date)
    work_permit_expiration = db.Column(db.Date)
    ead_expiration = db.Column(db.Date)  # Employment Authorization Document
    
    # ========== ONBOARDING WORKFLOW ==========
    onboarding_status = db.Column(db.String(50), default='not_started')  # not_started, in_progress, pending_review, complete
    onboarding_step = db.Column(db.Integer, default=1)
    onboarding_started_at = db.Column(db.DateTime)
    onboarding_completed_at = db.Column(db.DateTime)
    
    # Checklist tracking
    onboarding_checklist = db.Column(db.JSON, default={
        'personal_info': False,
        'w4_completed': False,
        'state_forms_completed': False,
        'i9_section1': False,
        'i9_section2': False,
        'direct_deposit': False,
        'benefits_enrollment': False,
        'policy_acknowledgments': False,
        'manager_approved': False
    })
    
    # ========== AUDIT TRAIL ==========
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_sensitive=False):
        return {
            'id': self.id,
            'legal_first_name': self.legal_first_name,
            'legal_last_name': self.legal_last_name,
            'preferred_name': self.preferred_name,
            'ssn_last_four': self.ssn_last_four,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'personal_email': self.personal_email,
            'hire_date': self.hire_date.isoformat() if self.hire_date else None,
            'job_title': self.job_title,
            'department': self.department,
            'employment_type': self.employment_type,
            'flsa_classification': self.flsa_classification,
            'pay_type': self.pay_type,
            'pay_rate': self.pay_rate,
            'onboarding_status': self.onboarding_status,
            'onboarding_checklist': self.onboarding_checklist,
            'i9_status': self.i9_status,
            'direct_deposit_verified': self.direct_deposit_verified,
            'benefits_enrollment_status': self.benefits_enrollment_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ============================================================================
# CONTRACTOR REGISTRATION - 1099 COMPLIANCE
# ============================================================================

class ContractorOnboarding(db.Model):
    """Contractor registration with W-9 and 1099 compliance."""
    __tablename__ = 'contractor_onboardings'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company_registrations.id'), nullable=False)
    
    # ========== CONTRACTOR INFORMATION ==========
    contractor_type = db.Column(db.String(50), nullable=False)  # individual, business
    
    # For individuals
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    
    # For businesses
    business_name = db.Column(db.String(255))
    
    # Tax classification (from W-9)
    tax_classification = db.Column(db.String(50), nullable=False)
    # individual, sole_proprietor, c_corporation, s_corporation, partnership, trust_estate, llc_c, llc_s, llc_p, llc_disregarded, other
    
    # ========== FORM W-9 ==========
    w9_name = db.Column(db.String(255), nullable=False)  # Name as shown on tax return
    w9_business_name = db.Column(db.String(255))  # Business name if different
    w9_tax_classification = db.Column(db.String(50))
    w9_exempt_payee_code = db.Column(db.String(10))
    w9_fatca_exemption_code = db.Column(db.String(10))
    
    # TIN (SSN or EIN)
    tin_type = db.Column(db.String(10))  # ssn, ein
    tin_encrypted = db.Column(db.LargeBinary)  # AES-256 encrypted
    tin_last_four = db.Column(db.String(4))
    
    # W-9 Address
    w9_address = db.Column(db.String(500), nullable=False)
    w9_city = db.Column(db.String(100), nullable=False)
    w9_state = db.Column(db.String(2), nullable=False)
    w9_zip = db.Column(db.String(10), nullable=False)
    
    # Account numbers (optional)
    account_numbers = db.Column(db.String(255))
    
    # W-9 Certification
    w9_signature = db.Column(db.Text)  # Digital signature
    w9_signed_date = db.Column(db.Date)
    w9_signed_ip = db.Column(db.String(50))
    w9_document_id = db.Column(db.String(100))  # Reference to stored document
    
    # Backup withholding
    backup_withholding_required = db.Column(db.Boolean, default=False)
    backup_withholding_rate = db.Column(db.Float, default=24.0)  # Current rate is 24%
    
    # ========== CONTACT INFORMATION ==========
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    
    # ========== PAYMENT DETAILS ==========
    payment_method = db.Column(db.String(50), default='ach')  # ach, check, wire, wallet
    currency = db.Column(db.String(3), default='USD')  # USD, CAD
    
    # Bank details for ACH
    bank_name = db.Column(db.String(255))
    bank_routing = db.Column(db.String(9))
    bank_account_encrypted = db.Column(db.LargeBinary)
    bank_account_type = db.Column(db.String(20))  # checking, savings
    
    # Payment terms
    payment_frequency = db.Column(db.String(50))  # upon_invoice, weekly, biweekly, monthly
    payment_terms = db.Column(db.String(50))  # net_15, net_30, net_45, net_60
    rate = db.Column(db.Float)
    rate_type = db.Column(db.String(20))  # hourly, daily, project, flat
    
    # ========== 1099 TRACKING ==========
    ytd_payments = db.Column(db.Float, default=0)
    requires_1099 = db.Column(db.Boolean, default=False)  # Automatically set when >= $600
    threshold_notified = db.Column(db.Boolean, default=False)  # Alert sent when approaching $600
    
    # Historical 1099s
    form_1099_history = db.Column(db.JSON, default=[])
    # Example: [{"year": 2024, "amount": 15000, "filed": true, "filed_date": "2025-01-31"}]
    
    # ========== STATE REPORTING ==========
    state_reporting_required = db.Column(db.JSON, default={})
    # Example: {"CA": true, "NY": true}
    
    # ========== STATUS ==========
    status = db.Column(db.String(50), default='pending')  # pending, active, inactive, terminated
    onboarding_complete = db.Column(db.Boolean, default=False)
    
    onboarding_checklist = db.Column(db.JSON, default={
        'w9_completed': False,
        'payment_method_setup': False,
        'contract_signed': False
    })
    
    # ========== CONTRACT DETAILS ==========
    contract_start_date = db.Column(db.Date)
    contract_end_date = db.Column(db.Date)
    contract_document_id = db.Column(db.String(100))
    
    # ========== TIMESTAMPS ==========
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'contractor_type': self.contractor_type,
            'name': self.w9_name,
            'business_name': self.w9_business_name,
            'tax_classification': self.tax_classification,
            'tin_last_four': self.tin_last_four,
            'email': self.email,
            'payment_method': self.payment_method,
            'ytd_payments': self.ytd_payments,
            'requires_1099': self.requires_1099,
            'status': self.status,
            'onboarding_complete': self.onboarding_complete
        }


# ============================================================================
# DOCUMENT STORAGE - RETENTION COMPLIANCE
# ============================================================================

class ComplianceDocument(db.Model):
    """Secure document storage with retention policies."""
    __tablename__ = 'compliance_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company_registrations.id'), nullable=False)
    employee_id = db.Column(db.Integer)  # Optional, for employee-specific docs
    contractor_id = db.Column(db.Integer)  # Optional, for contractor docs
    
    # Document identification
    document_type = db.Column(db.String(50), nullable=False)
    # Types: w4, i9, w9, direct_deposit_auth, state_tax_form, policy_acknowledgment, 
    # voided_check, benefits_election, w2, 1099, payroll_record, tax_return
    
    document_name = db.Column(db.String(255), nullable=False)
    document_year = db.Column(db.Integer)  # Tax year if applicable
    
    # Storage
    storage_path = db.Column(db.String(500))  # S3 path or local path
    storage_bucket = db.Column(db.String(100))
    file_hash = db.Column(db.String(64))  # SHA-256 hash for integrity
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    encrypted = db.Column(db.Boolean, default=True)
    encryption_key_id = db.Column(db.String(100))  # Reference to encryption key
    
    # Retention
    retention_category = db.Column(db.String(50))
    # Categories: i9 (3yr/1yr), w4 (4yr), payroll (3yr), benefits (6yr), tax_return (4yr)
    
    retention_start_date = db.Column(db.Date)  # Usually hire date or document date
    retention_end_date = db.Column(db.Date)  # Calculated based on category
    termination_date = db.Column(db.Date)  # If employee terminated
    
    # For I-9: 3 years from hire OR 1 year from termination, whichever is later
    # For W-4: Current year + 4 prior years
    # For Payroll: 3 years (FLSA)
    # For Benefits: 6 years (ERISA)
    # For Tax Returns: 4 years (IRS)
    
    # Status
    status = db.Column(db.String(50), default='active')  # active, archived, deleted, pending_deletion
    scheduled_deletion_date = db.Column(db.Date)
    deleted_at = db.Column(db.DateTime)
    deletion_method = db.Column(db.String(50))  # manual, automatic, retention_expired
    
    # Version control
    version = db.Column(db.Integer, default=1)
    previous_version_id = db.Column(db.Integer, db.ForeignKey('compliance_documents.id'))
    is_current = db.Column(db.Boolean, default=True)
    
    # Access control
    access_level = db.Column(db.String(50), default='employer')  # employer, hr, payroll, employee, admin
    
    # Audit trail
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_accessed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    last_accessed_at = db.Column(db.DateTime)
    access_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def calculate_retention_end(self, termination_date=None):
        """Calculate retention end date based on document type and regulations."""
        from datetime import timedelta
        
        if self.retention_category == 'i9':
            # I-9: 3 years from hire OR 1 year from termination
            three_years = self.retention_start_date + timedelta(days=3*365)
            if termination_date:
                one_year_from_term = termination_date + timedelta(days=365)
                return max(three_years, one_year_from_term)
            return three_years
        
        elif self.retention_category == 'w4':
            # W-4: 4 years from last effective date
            return self.retention_start_date + timedelta(days=4*365)
        
        elif self.retention_category == 'payroll':
            # FLSA: 3 years
            return self.retention_start_date + timedelta(days=3*365)
        
        elif self.retention_category == 'benefits':
            # ERISA: 6 years
            return self.retention_start_date + timedelta(days=6*365)
        
        elif self.retention_category == 'tax_return':
            # IRS: 4 years
            return self.retention_start_date + timedelta(days=4*365)
        
        else:
            # Default: 7 years
            return self.retention_start_date + timedelta(days=7*365)


# ============================================================================
# GOVERNMENT FORMS - AUTOMATED GENERATION
# ============================================================================

class GovernmentForm(db.Model):
    """Track government form generation and filing."""
    __tablename__ = 'government_forms'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company_registrations.id'), nullable=False)
    employee_id = db.Column(db.Integer)  # For employee-specific forms (W-2)
    contractor_id = db.Column(db.Integer)  # For contractor forms (1099)
    
    # Form identification
    form_type = db.Column(db.String(50), nullable=False)
    # Types: w2, w3, 941, 944, 940, 1099_nec, 1095_c, 1094_c, state_wage_report, 
    # new_hire_report, sui_return, local_tax_return
    
    tax_year = db.Column(db.Integer, nullable=False)
    tax_quarter = db.Column(db.Integer)  # 1-4 for quarterly forms
    
    # Jurisdiction
    jurisdiction_type = db.Column(db.String(20))  # federal, state, local
    jurisdiction_code = db.Column(db.String(10))  # State code or local ID
    
    # Form data (JSON storage of all form fields)
    form_data = db.Column(db.JSON)
    
    # Generated document
    document_id = db.Column(db.String(100))  # Reference to ComplianceDocument
    pdf_url = db.Column(db.String(500))
    
    # Filing status
    status = db.Column(db.String(50), default='draft')
    # draft, ready, filed, accepted, rejected, corrected
    
    # Filing details
    filing_method = db.Column(db.String(50))  # electronic, paper, manual
    filed_date = db.Column(db.DateTime)
    filed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Electronic filing
    submission_id = db.Column(db.String(100))  # SSA BSO, IRS FIRE, state system
    confirmation_number = db.Column(db.String(100))
    
    # For corrections
    is_correction = db.Column(db.Boolean, default=False)
    original_form_id = db.Column(db.Integer, db.ForeignKey('government_forms.id'))
    correction_type = db.Column(db.String(50))  # W-2c, amended 941, etc.
    
    # Deadlines
    due_date = db.Column(db.Date)
    
    # Recipient delivery (for W-2, 1099)
    recipient_delivered = db.Column(db.Boolean, default=False)
    recipient_delivery_date = db.Column(db.DateTime)
    recipient_delivery_method = db.Column(db.String(50))  # email, portal, mail
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# PAYROLL RUN - PRODUCTION PROCESSING
# ============================================================================

class PayrollRun(db.Model):
    """Complete payroll run with all processing details."""
    __tablename__ = 'payroll_runs'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company_registrations.id'), nullable=False)
    
    # Pay period
    pay_period_start = db.Column(db.Date, nullable=False)
    pay_period_end = db.Column(db.Date, nullable=False)
    pay_date = db.Column(db.Date, nullable=False)
    pay_frequency = db.Column(db.String(20))  # weekly, biweekly, semi_monthly, monthly
    
    # Run type
    run_type = db.Column(db.String(50), default='regular')
    # regular, off_cycle, bonus, commission, termination, correction, reversal
    
    # Status workflow
    status = db.Column(db.String(50), default='draft')
    # draft, calculating, preview, approved, processing, ach_pending, ach_sent, complete, cancelled, error
    
    # Totals
    total_employees = db.Column(db.Integer, default=0)
    total_gross_pay = db.Column(db.Float, default=0)
    total_net_pay = db.Column(db.Float, default=0)
    
    # Tax totals
    total_federal_income_tax = db.Column(db.Float, default=0)
    total_social_security_employee = db.Column(db.Float, default=0)
    total_social_security_employer = db.Column(db.Float, default=0)
    total_medicare_employee = db.Column(db.Float, default=0)
    total_medicare_employer = db.Column(db.Float, default=0)
    total_state_income_tax = db.Column(db.Float, default=0)
    total_local_tax = db.Column(db.Float, default=0)
    total_sui = db.Column(db.Float, default=0)
    total_futa = db.Column(db.Float, default=0)
    
    # Deduction totals
    total_pretax_deductions = db.Column(db.Float, default=0)
    total_posttax_deductions = db.Column(db.Float, default=0)
    
    # Employer costs
    total_employer_taxes = db.Column(db.Float, default=0)
    total_employer_benefits = db.Column(db.Float, default=0)
    total_payroll_cost = db.Column(db.Float, default=0)  # Net pay + taxes + benefits
    
    # State/jurisdiction breakdown
    tax_breakdown_by_state = db.Column(db.JSON, default={})
    tax_breakdown_by_local = db.Column(db.JSON, default={})
    
    # ACH/Payment details
    ach_file_id = db.Column(db.String(100))
    ach_file_generated_at = db.Column(db.DateTime)
    ach_file_sent_at = db.Column(db.DateTime)
    ach_batch_number = db.Column(db.String(50))
    ach_effective_date = db.Column(db.Date)
    
    # Tax deposits
    federal_tax_deposit_due = db.Column(db.Date)
    federal_tax_deposit_amount = db.Column(db.Float, default=0)
    state_tax_deposits = db.Column(db.JSON, default={})  # By state
    
    # Check processing
    checks_printed = db.Column(db.Integer, default=0)
    check_starting_number = db.Column(db.Integer)
    check_ending_number = db.Column(db.Integer)
    
    # Approval workflow
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    submitted_at = db.Column(db.DateTime)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    
    # Processing details
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    processed_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Error handling
    errors = db.Column(db.JSON, default=[])
    warnings = db.Column(db.JSON, default=[])
    
    # Audit
    calculation_log = db.Column(db.JSON)  # Detailed calculation breakdown
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PayrollRunEmployee(db.Model):
    """Individual employee calculation within a payroll run."""
    __tablename__ = 'payroll_run_employees'
    
    id = db.Column(db.Integer, primary_key=True)
    payroll_run_id = db.Column(db.Integer, db.ForeignKey('payroll_runs.id'), nullable=False)
    employee_id = db.Column(db.Integer, nullable=False)
    
    # Hours
    regular_hours = db.Column(db.Float, default=0)
    overtime_hours = db.Column(db.Float, default=0)
    double_time_hours = db.Column(db.Float, default=0)
    holiday_hours = db.Column(db.Float, default=0)
    pto_hours = db.Column(db.Float, default=0)
    sick_hours = db.Column(db.Float, default=0)
    
    # Earnings
    regular_pay = db.Column(db.Float, default=0)
    overtime_pay = db.Column(db.Float, default=0)
    double_time_pay = db.Column(db.Float, default=0)
    holiday_pay = db.Column(db.Float, default=0)
    pto_pay = db.Column(db.Float, default=0)
    sick_pay = db.Column(db.Float, default=0)
    bonus = db.Column(db.Float, default=0)
    commission = db.Column(db.Float, default=0)
    tips = db.Column(db.Float, default=0)
    reimbursements = db.Column(db.Float, default=0)  # Non-taxable
    other_earnings = db.Column(db.JSON, default={})
    
    gross_pay = db.Column(db.Float, default=0)
    
    # Pre-tax deductions
    health_insurance = db.Column(db.Float, default=0)
    dental_insurance = db.Column(db.Float, default=0)
    vision_insurance = db.Column(db.Float, default=0)
    hsa = db.Column(db.Float, default=0)
    fsa = db.Column(db.Float, default=0)
    dependent_care_fsa = db.Column(db.Float, default=0)
    retirement_401k = db.Column(db.Float, default=0)
    other_pretax = db.Column(db.JSON, default={})
    
    total_pretax_deductions = db.Column(db.Float, default=0)
    
    # Taxable wages
    federal_taxable_wages = db.Column(db.Float, default=0)
    social_security_wages = db.Column(db.Float, default=0)
    medicare_wages = db.Column(db.Float, default=0)
    state_taxable_wages = db.Column(db.JSON, default={})  # By state
    
    # Tax withholdings
    federal_income_tax = db.Column(db.Float, default=0)
    social_security_tax = db.Column(db.Float, default=0)
    medicare_tax = db.Column(db.Float, default=0)
    additional_medicare_tax = db.Column(db.Float, default=0)
    
    state_income_tax = db.Column(db.JSON, default={})  # By state
    local_tax = db.Column(db.JSON, default={})  # By locality
    state_disability = db.Column(db.Float, default=0)
    paid_family_leave = db.Column(db.Float, default=0)
    
    total_taxes = db.Column(db.Float, default=0)
    
    # Post-tax deductions
    roth_401k = db.Column(db.Float, default=0)
    garnishments = db.Column(db.JSON, default=[])  # Array with priority order
    child_support = db.Column(db.Float, default=0)
    tax_levy = db.Column(db.Float, default=0)
    other_posttax = db.Column(db.JSON, default={})
    
    total_posttax_deductions = db.Column(db.Float, default=0)
    
    # Net pay
    net_pay = db.Column(db.Float, default=0)
    
    # Payment method
    payment_method = db.Column(db.String(50))  # direct_deposit, check, wallet
    direct_deposit_splits = db.Column(db.JSON, default=[])
    check_number = db.Column(db.Integer)
    
    # YTD after this payroll
    ytd_gross = db.Column(db.Float, default=0)
    ytd_federal_tax = db.Column(db.Float, default=0)
    ytd_social_security = db.Column(db.Float, default=0)
    ytd_medicare = db.Column(db.Float, default=0)
    ytd_state_tax = db.Column(db.JSON, default={})
    ytd_local_tax = db.Column(db.JSON, default={})
    ytd_net = db.Column(db.Float, default=0)
    
    # Employer costs for this employee
    employer_social_security = db.Column(db.Float, default=0)
    employer_medicare = db.Column(db.Float, default=0)
    employer_futa = db.Column(db.Float, default=0)
    employer_suta = db.Column(db.Float, default=0)
    employer_benefits = db.Column(db.Float, default=0)
    
    total_employer_cost = db.Column(db.Float, default=0)
    
    # Paystub
    paystub_id = db.Column(db.Integer, db.ForeignKey('paystubs.id'))
    paystub_generated = db.Column(db.Boolean, default=False)
    paystub_delivered = db.Column(db.Boolean, default=False)
    
    # Calculation details
    calculation_log = db.Column(db.JSON)  # Detailed breakdown
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# ACH FILE GENERATION - NACHA FORMAT
# ============================================================================

class ACHFile(db.Model):
    """ACH file for direct deposit processing."""
    __tablename__ = 'ach_files'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company_registrations.id'), nullable=False)
    payroll_run_id = db.Column(db.Integer, db.ForeignKey('payroll_runs.id'))
    
    # File identification
    file_id = db.Column(db.String(100), unique=True, nullable=False)
    file_creation_date = db.Column(db.Date, nullable=False)
    file_creation_time = db.Column(db.String(4))  # HHMM
    
    # NACHA header info
    immediate_destination = db.Column(db.String(10))  # Bank routing
    immediate_origin = db.Column(db.String(10))  # Company EIN or routing
    immediate_destination_name = db.Column(db.String(23))
    immediate_origin_name = db.Column(db.String(23))
    
    # Batch info
    batch_count = db.Column(db.Integer, default=1)
    batch_number = db.Column(db.Integer)
    
    # File totals
    total_debits = db.Column(db.Float, default=0)  # From employer account
    total_credits = db.Column(db.Float, default=0)  # To employee accounts
    entry_count = db.Column(db.Integer, default=0)
    entry_hash = db.Column(db.String(10))  # NACHA entry hash
    
    # Effective date
    effective_entry_date = db.Column(db.Date, nullable=False)
    
    # File storage
    file_content = db.Column(db.Text)  # The actual NACHA file content
    file_path = db.Column(db.String(500))
    
    # Status
    status = db.Column(db.String(50), default='generated')
    # generated, uploaded, sent, processing, settled, returned, error
    
    # Transmission
    transmitted_at = db.Column(db.DateTime)
    transmitted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    transmission_method = db.Column(db.String(50))  # sftp, api, manual
    
    # Settlement
    settled_at = db.Column(db.DateTime)
    settlement_amount = db.Column(db.Float)
    
    # Returns/Errors
    return_count = db.Column(db.Integer, default=0)
    return_details = db.Column(db.JSON, default=[])
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# AUDIT LOG - COMPLIANCE TRACKING
# ============================================================================

class AuditLog(db.Model):
    """Comprehensive audit trail for compliance."""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Who
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user_email = db.Column(db.String(255))
    user_role = db.Column(db.String(50))
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    
    # What
    action = db.Column(db.String(100), nullable=False)
    # Actions: login, logout, view, create, update, delete, approve, submit, file, 
    # download, export, payroll_run, ach_generate, ach_transmit, etc.
    
    resource_type = db.Column(db.String(100))
    # Types: user, company, employee, contractor, payroll_run, paystub, document, 
    # government_form, ach_file, etc.
    
    resource_id = db.Column(db.String(100))
    company_id = db.Column(db.Integer)
    
    # Details
    description = db.Column(db.Text)
    changes = db.Column(db.JSON)  # Before/after values for updates
    metadata = db.Column(db.JSON)  # Additional context
    
    # Result
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Tamper protection
    log_hash = db.Column(db.String(64))  # SHA-256 hash of log entry
    previous_hash = db.Column(db.String(64))  # Chain to previous entry
