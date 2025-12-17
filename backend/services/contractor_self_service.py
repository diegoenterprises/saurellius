"""
CONTRACTOR SELF-SERVICE MODULE
Complete self-service contractor registration, onboarding, and portal
Zero-touch contractor administration with full IRS compliance
"""

import os
import re
import uuid
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from decimal import Decimal

from models import (
    ContractorAccount,
    ContractorInvitation,
    ContractorPaymentMethod,
    ContractorInvoice,
    ContractorInvoicePayment,
    ContractorW9Form,
    ContractorExpense,
    ContractorMileageLog,
    ContractorForm1099,
    db,
)

# Encryption key from environment
ENCRYPTION_KEY = os.environ.get('SAURELLIUS_ENCRYPTION_KEY', 'default-dev-key-change-in-production')


class ContractorSelfServiceManager:
    """
    Complete contractor self-service system for:
    - Dual registration paths (client-invited + self-service)
    - W-9 collection and validation
    - Payment method setup (ACH, check, wire, wallet)
    - Invoice creation and management
    - Expense and mileage tracking
    - 1099-NEC generation
    - Tax compliance and estimated payments
    - Document vault
    """

    # Password requirements
    PASSWORD_REQUIREMENTS = {
        'min_length': 8,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_number': True,
        'require_special': True
    }

    # Business classifications for W-9
    BUSINESS_CLASSIFICATIONS = {
        'individual': 'Individual/Sole Proprietor',
        'single_member_llc': 'Single-Member LLC',
        'multi_member_llc': 'Multi-Member LLC',
        'partnership': 'Partnership',
        's_corporation': 'S Corporation',
        'c_corporation': 'C Corporation',
        'non_profit': 'Non-Profit Organization',
        'trust_estate': 'Trust/Estate'
    }

    # W-9 Tax Classifications
    W9_TAX_CLASSIFICATIONS = {
        'individual': 'Individual/sole proprietor or single-member LLC',
        'c_corp': 'C Corporation',
        's_corp': 'S Corporation',
        'partnership': 'Partnership',
        'trust_estate': 'Trust/estate',
        'llc_c': 'LLC taxed as C Corporation',
        'llc_s': 'LLC taxed as S Corporation',
        'llc_p': 'LLC taxed as Partnership',
        'other': 'Other'
    }

    # Industry categories (NAICS-based)
    INDUSTRY_CATEGORIES = [
        'construction', 'consulting', 'creative_services', 'healthcare',
        'it_technology', 'legal_services', 'marketing_advertising',
        'professional_services', 'real_estate', 'transportation_delivery', 'other'
    ]

    # Onboarding sections
    ONBOARDING_SECTIONS = {
        1: {'name': 'Business & Personal Information', 'required': True},
        2: {'name': 'Tax Information (W-9)', 'required': True},
        3: {'name': 'Payment Information', 'required': True},
        4: {'name': 'Contract & Engagement Details', 'required': False},
        5: {'name': 'Business Documentation', 'required': False},
        6: {'name': 'Invoicing & Billing Setup', 'required': True},
        7: {'name': 'Tax Compliance Setup', 'required': False},
        8: {'name': 'Additional Business Info', 'required': False},
        9: {'name': 'Document Vault Setup', 'required': False}
    }

    # IRS standard mileage rate (2024)
    IRS_MILEAGE_RATE = Decimal('0.67')

    # Self-employment tax rate
    SELF_EMPLOYMENT_TAX_RATE = Decimal('0.153')  # 15.3%

    # Backup withholding rate
    BACKUP_WITHHOLDING_RATE = Decimal('0.24')  # 24%

    # 1099-NEC threshold
    THRESHOLD_1099 = Decimal('600.00')

    def __init__(self):
        """Initialize contractor self-service manager."""
        # In-memory storage (replace with database in production)
        self.contractors = None
        self.invitations = None
        self.invoices = None
        self.expenses = None
        self.mileage_logs = None
        self.payments = None
        self.documents = None
        self.w9_forms = None
        self.form_1099s = None

    # =========================================================================
    # ENCRYPTION UTILITIES
    # =========================================================================

    def _encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data (SSN, EIN, bank accounts)."""
        if not data:
            return ''
        # In production: Use proper AES-256 encryption
        key = hashlib.sha256(ENCRYPTION_KEY.encode()).digest()
        encrypted = hashlib.sha256(f"{key}{data}".encode()).hexdigest()
        return f"ENC:{encrypted[:32]}"

    def _mask_ssn(self, ssn: str) -> str:
        """Mask SSN for display (show last 4)."""
        if not ssn or len(ssn) < 4:
            return '***-**-****'
        clean = re.sub(r'\D', '', ssn)
        return f"***-**-{clean[-4:]}"

    def _mask_ein(self, ein: str) -> str:
        """Mask EIN for display (show last 4)."""
        if not ein or len(ein) < 4:
            return '**-****XXX'
        clean = re.sub(r'\D', '', ein)
        return f"**-***{clean[-4:]}"

    def _mask_account(self, account: str) -> str:
        """Mask bank account for display (show last 4)."""
        if not account or len(account) < 4:
            return '****'
        return f"****{account[-4:]}"

    # =========================================================================
    # VALIDATION UTILITIES
    # =========================================================================

    def validate_password(self, password: str) -> Tuple[bool, List[str]]:
        """Validate password against requirements."""
        errors = []
        if len(password) < self.PASSWORD_REQUIREMENTS['min_length']:
            errors.append(f"Password must be at least {self.PASSWORD_REQUIREMENTS['min_length']} characters")
        if self.PASSWORD_REQUIREMENTS['require_uppercase'] and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        if self.PASSWORD_REQUIREMENTS['require_lowercase'] and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        if self.PASSWORD_REQUIREMENTS['require_number'] and not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        if self.PASSWORD_REQUIREMENTS['require_special'] and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        return len(errors) == 0, errors

    def validate_email(self, email: str) -> Tuple[bool, str]:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if re.match(pattern, email):
            return True, "Valid email"
        return False, "Invalid email format"

    def validate_phone(self, phone: str) -> Tuple[bool, str]:
        """Validate phone number format."""
        clean = re.sub(r'\D', '', phone)
        if len(clean) == 10:
            return True, "Valid phone"
        if len(clean) == 11 and clean[0] == '1':
            return True, "Valid phone"
        return False, "Phone must be 10 digits"

    def validate_ein(self, ein: str) -> Tuple[bool, str]:
        """Validate EIN format (XX-XXXXXXX)."""
        clean = re.sub(r'\D', '', ein)
        if len(clean) == 9:
            return True, "Valid EIN format"
        return False, "EIN must be 9 digits (XX-XXXXXXX)"

    def validate_ssn(self, ssn: str) -> Tuple[bool, str]:
        """Validate SSN format (XXX-XX-XXXX)."""
        clean = re.sub(r'\D', '', ssn)
        if len(clean) == 9:
            # Basic validation - not starting with 000, 666, or 9xx
            if clean[:3] in ['000', '666'] or clean[0] == '9':
                return False, "Invalid SSN"
            return True, "Valid SSN format"
        return False, "SSN must be 9 digits (XXX-XX-XXXX)"

    def validate_routing_number(self, routing: str) -> Tuple[bool, str]:
        """Validate ABA routing number with checksum."""
        clean = re.sub(r'\D', '', routing)
        if len(clean) != 9:
            return False, "Routing number must be 9 digits"
        # ABA checksum validation
        weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
        total = sum(int(d) * w for d, w in zip(clean, weights))
        if total % 10 == 0:
            return True, "Valid routing number"
        return False, "Invalid routing number checksum"

    def generate_verification_code(self) -> str:
        """Generate 6-digit verification code."""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

    # =========================================================================
    # REGISTRATION - SELF-SERVICE
    # =========================================================================

    def self_service_register(self, data: Dict) -> Dict:
        """Register contractor via self-service sign-up."""
        # Validate required fields
        required = ['email', 'password', 'password_confirm', 'phone', 'business_classification']
        for field in required:
            if not data.get(field):
                return {'success': False, 'error': f'{field} is required'}

        # Validate email
        valid, msg = self.validate_email(data['email'])
        if not valid:
            return {'success': False, 'error': msg}

        existing = ContractorAccount.query.filter(ContractorAccount.email == data['email']).first()
        if existing:
            return {'success': False, 'error': 'Email already registered'}

        # Validate password
        valid, errors = self.validate_password(data['password'])
        if not valid:
            return {'success': False, 'error': errors[0]}

        if data['password'] != data['password_confirm']:
            return {'success': False, 'error': 'Passwords do not match'}

        # Validate phone
        valid, msg = self.validate_phone(data['phone'])
        if not valid:
            return {'success': False, 'error': msg}

        # Validate business classification
        if data['business_classification'] not in self.BUSINESS_CLASSIFICATIONS:
            return {'success': False, 'error': 'Invalid business classification'}

        # Check terms acceptance
        if not data.get('accept_terms') or not data.get('accept_privacy'):
            return {'success': False, 'error': 'You must accept Terms and Privacy Policy'}

        if not data.get('accept_contractor_acknowledgment'):
            return {'success': False, 'error': 'You must acknowledge independent contractor status'}

        contractor_id = str(uuid.uuid4())
        email_code = self.generate_verification_code()
        phone_code = self.generate_verification_code()

        onboarding = {
            'started_at': datetime.utcnow().isoformat(),
            'completed_at': None,
            'current_section': 1,
            'sections_completed': 0
        }

        contractor = ContractorAccount(
            id=contractor_id,
            email=data['email'],
            password_hash=hashlib.sha256(data['password'].encode()).hexdigest(),
            phone=re.sub(r'\D', '', data['phone']),
            business_classification=data['business_classification'],
            legal_name=data.get('legal_name') or None,
            business_name=data.get('business_name') or None,
            dba_name=data.get('dba_name') or None,
            date_of_birth=data.get('date_of_birth'),
            working_status=data.get('working_status', 'exploring'),
            status='pending_verification',
            email_verified=False,
            phone_verified=False,
            email_verification_code=email_code,
            email_verification_expires=(datetime.utcnow() + timedelta(hours=24)),
            phone_verification_code=phone_code,
            phone_verification_expires=(datetime.utcnow() + timedelta(minutes=10)),
            accept_terms=bool(data.get('accept_terms', False)),
            accept_privacy=bool(data.get('accept_privacy', False)),
            accept_electronic_communications=bool(data.get('accept_electronic_communications', False)),
            accept_contractor_acknowledgment=bool(data.get('accept_contractor_acknowledgment', False)),
            onboarding_json=json.dumps(onboarding),
        )

        db.session.add(contractor)
        db.session.commit()

        # In production: Send verification emails/SMS
        return {
            'success': True,
            'contractor_id': contractor_id,
            'message': 'Account created. Please verify your email and phone.',
            'next_step': 'verify_email',
            'email_code_expires': contractor.email_verification_expires.isoformat() if contractor.email_verification_expires else None
        }

    def verify_email(self, contractor_id: str, code: str) -> Dict:
        """Verify contractor email with code."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if contractor.email_verified:
            return {'success': True, 'message': 'Email already verified'}

        if contractor.email_verification_code != code:
            return {'success': False, 'error': 'Invalid verification code'}

        expires = contractor.email_verification_expires
        if expires and datetime.utcnow() > expires:
            return {'success': False, 'error': 'Verification code expired'}

        contractor.email_verified = True
        contractor.email_verification_code = None
        db.session.commit()

        self._check_verification_complete(contractor_id)

        return {'success': True, 'message': 'Email verified successfully'}

    def verify_phone(self, contractor_id: str, code: str) -> Dict:
        """Verify contractor phone with SMS code."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if contractor.phone_verified:
            return {'success': True, 'message': 'Phone already verified'}

        if contractor.phone_verification_code != code:
            return {'success': False, 'error': 'Invalid verification code'}

        expires = contractor.phone_verification_expires
        if expires and datetime.utcnow() > expires:
            return {'success': False, 'error': 'Verification code expired'}

        contractor.phone_verified = True
        contractor.phone_verification_code = None
        db.session.commit()

        self._check_verification_complete(contractor_id)

        return {'success': True, 'message': 'Phone verified successfully'}

    def _check_verification_complete(self, contractor_id: str):
        """Check if all verifications complete and update status."""
        contractor = ContractorAccount.query.get(contractor_id)
        if contractor and contractor.email_verified and contractor.phone_verified:
            contractor.status = 'pending_client'
            db.session.commit()

    def _load_onboarding(self, contractor: ContractorAccount) -> Dict[str, Any]:
        if not contractor or not contractor.onboarding_json:
            return {}
        try:
            return json.loads(contractor.onboarding_json) or {}
        except Exception:
            return {}

    def _save_onboarding(self, contractor: ContractorAccount, onboarding: Dict[str, Any]) -> None:
        if not contractor:
            return
        contractor.onboarding_json = json.dumps(onboarding)
        db.session.commit()

    def submit_w9(self, contractor_id: str, data: Dict) -> Dict:
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if not data.get('name'):
            return {'success': False, 'error': 'Name is required'}

        if not data.get('tax_classification'):
            return {'success': False, 'error': 'Tax classification is required'}

        tin_type = data.get('tin_type')
        tin = data.get('tin') or data.get('taxpayer_id') or ''
        if not tin_type or not tin:
            return {'success': False, 'error': 'TIN type and TIN are required'}

        tin_clean = re.sub(r'\D', '', tin)
        if tin_type == 'ssn':
            valid, msg = self.validate_ssn(tin_clean)
            if not valid:
                return {'success': False, 'error': msg}
        elif tin_type == 'ein':
            valid, msg = self.validate_ein(tin_clean)
            if not valid:
                return {'success': False, 'error': msg}
        else:
            return {'success': False, 'error': 'Invalid TIN type'}

        encrypted_tin = self._encrypt_sensitive_data(tin_clean)
        masked = self._mask_ssn(tin_clean) if tin_type == 'ssn' else self._mask_ein(tin_clean)

        w9 = ContractorW9Form(
            id=str(uuid.uuid4()),
            contractor_id=contractor_id,
            name=data['name'],
            business_name=data.get('business_name'),
            tax_classification=data.get('tax_classification'),
            address=data.get('address'),
            tin_type=tin_type,
            tin_masked=masked,
            tin_encrypted=encrypted_tin,
            status='submitted',
            signature_date=data.get('signature_date', datetime.utcnow().date().isoformat()),
            ip_address=data.get('ip_address'),
        )

        db.session.add(w9)
        contractor.w9_complete = True
        db.session.commit()

        self._update_onboarding_section(contractor_id, 2, w9.to_safe_dict())

        return {
            'success': True,
            'message': 'W-9 submitted successfully',
            'w9_id': w9.id
        }

    def get_w9(self, contractor_id: str) -> Dict:
        w9 = (
            ContractorW9Form.query.filter(ContractorW9Form.contractor_id == contractor_id)
            .order_by(ContractorW9Form.created_at.desc())
            .first()
        )
        if not w9:
            return {'error': 'W-9 not found'}
        return w9.to_safe_dict()

    def _payments_for_year(self, contractor_id: str, year: int) -> List[ContractorInvoicePayment]:
        return (
            ContractorInvoicePayment.query.filter(ContractorInvoicePayment.contractor_id == contractor_id)
            .filter(ContractorInvoicePayment.payment_date.like(f"{year}%"))
            .all()
        )

    def setup_payment_method(self, contractor_id: str, data: Dict) -> Dict:
        """Set up contractor payment method."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        payment_method = data.get('payment_method', 'direct_deposit')

        if payment_method == 'direct_deposit':
            return self._setup_direct_deposit(contractor_id, data)
        if payment_method == 'check':
            return self._setup_check_payment(contractor_id, data)
        if payment_method == 'wire':
            return self._setup_wire_transfer(contractor_id, data)
        if payment_method == 'wallet':
            return self._setup_digital_wallet(contractor_id, data)
        return {'success': False, 'error': 'Invalid payment method'}

    def _setup_direct_deposit(self, contractor_id: str, data: Dict) -> Dict:
        """Set up direct deposit (ACH)."""
        if not data.get('bank_name'):
            return {'success': False, 'error': 'Bank name required'}

        routing = data.get('routing_number', '')
        valid, msg = self.validate_routing_number(routing)
        if not valid:
            return {'success': False, 'error': msg}

        account = data.get('account_number', '')
        if not account or len(account) < 4:
            return {'success': False, 'error': 'Valid account number required'}

        if account != data.get('account_number_confirm'):
            return {'success': False, 'error': 'Account numbers do not match'}

        encrypted_account = self._encrypt_sensitive_data(account)

        payment_info = {
            'method': 'direct_deposit',
            'bank_name': data['bank_name'],
            'account_type': data.get('account_type', 'checking'),
            'routing_number': routing,
            'account_encrypted': encrypted_account,
            'account_last_four': account[-4:],
            'account_holder_name': data.get('account_holder_name', ''),
            'prenote_status': 'pending',
            'created_at': datetime.utcnow().isoformat()
        }

        ContractorPaymentMethod.query.filter(ContractorPaymentMethod.contractor_id == contractor_id).filter(ContractorPaymentMethod.status == 'active').update({'status': 'superseded'})
        pm = ContractorPaymentMethod(
            contractor_id=contractor_id,
            status='active',
            method='direct_deposit',
            payload_json=json.dumps(payment_info),
        )
        db.session.add(pm)
        contractor = ContractorAccount.query.get(contractor_id)
        if contractor:
            contractor.payment_setup_complete = True
        db.session.commit()

        return {
            'success': True,
            'message': 'Direct deposit set up successfully',
            'account_last_four': account[-4:]
        }

    def _setup_check_payment(self, contractor_id: str, data: Dict) -> Dict:
        """Set up paper check payment."""
        payment_info = {
            'method': 'check',
            'mailing_address': {
                'street': data.get('street_address', ''),
                'city': data.get('city', ''),
                'state': data.get('state', ''),
                'zip_code': data.get('zip_code', '')
            },
            'delivery_preference': data.get('delivery_preference', 'regular'),
            'created_at': datetime.utcnow().isoformat()
        }

        ContractorPaymentMethod.query.filter(ContractorPaymentMethod.contractor_id == contractor_id).filter(ContractorPaymentMethod.status == 'active').update({'status': 'superseded'})
        pm = ContractorPaymentMethod(
            contractor_id=contractor_id,
            status='active',
            method='check',
            payload_json=json.dumps(payment_info),
        )
        db.session.add(pm)

        contractor = ContractorAccount.query.get(contractor_id)
        if contractor:
            contractor.payment_setup_complete = True
        db.session.commit()

        return {'success': True, 'message': 'Check payment set up successfully'}

    def _setup_wire_transfer(self, contractor_id: str, data: Dict) -> Dict:
        """Set up wire transfer payment."""
        payment_info = {
            'method': 'wire',
            'bank_name': data.get('bank_name', ''),
            'bank_address': data.get('bank_address', ''),
            'swift_code': data.get('swift_code', ''),
            'account_number': self._encrypt_sensitive_data(data.get('account_number', '')),
            'account_last_four': data.get('account_number', '')[-4:] if data.get('account_number') else '',
            'routing_number': data.get('routing_number', ''),
            'intermediary_bank': data.get('intermediary_bank', ''),
            'created_at': datetime.utcnow().isoformat()
        }

        ContractorPaymentMethod.query.filter(ContractorPaymentMethod.contractor_id == contractor_id).filter(ContractorPaymentMethod.status == 'active').update({'status': 'superseded'})
        pm = ContractorPaymentMethod(
            contractor_id=contractor_id,
            status='active',
            method='wire',
            payload_json=json.dumps(payment_info),
        )
        db.session.add(pm)

        contractor = ContractorAccount.query.get(contractor_id)
        if contractor:
            contractor.payment_setup_complete = True
        db.session.commit()

        return {'success': True, 'message': 'Wire transfer set up successfully'}

    def _setup_digital_wallet(self, contractor_id: str, data: Dict) -> Dict:
        """Set up Saurellius digital wallet."""

        # Create wallet
        wallet_id = str(uuid.uuid4())
        wallet_pin_hash = hashlib.sha256(data.get('wallet_pin', '').encode()).hexdigest()

        payment_info = {
            'method': 'wallet',
            'wallet_id': wallet_id,
            'wallet_pin_hash': wallet_pin_hash,
            'wallet_balance': Decimal('0.00'),
            'created_at': datetime.utcnow().isoformat()
        }

        ContractorPaymentMethod.query.filter(ContractorPaymentMethod.contractor_id == contractor_id).filter(ContractorPaymentMethod.status == 'active').update({'status': 'superseded'})
        pm = ContractorPaymentMethod(
            contractor_id=contractor_id,
            status='active',
            method='wallet',
            payload_json=json.dumps({k: (float(v) if isinstance(v, Decimal) else v) for k, v in payment_info.items()}),
        )
        db.session.add(pm)
        contractor = ContractorAccount.query.get(contractor_id)
        if contractor:
            contractor.payment_setup_complete = True
        db.session.commit()

        return {
            'success': True,
            'message': 'Digital wallet created successfully',
            'wallet_id': wallet_id
        }

    # =========================================================================
    # ONBOARDING - PROGRESS TRACKING
    # =========================================================================

    def _update_onboarding_section(self, contractor_id: str, section: int, data: Dict):
        """Update onboarding section completion."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return

        onboarding = self._load_onboarding(contractor)
        onboarding[f'section_{section}'] = {
            'status': 'complete',
            'data': data,
            'completed_at': datetime.utcnow().isoformat()
        }

        completed = sum(
            1
            for i in range(1, 10)
            if onboarding.get(f'section_{i}', {}).get('status') == 'complete'
        )
        onboarding['sections_completed'] = completed
        onboarding['current_section'] = min(section + 1, 9)

        self._save_onboarding(contractor, onboarding)

    def get_onboarding_status(self, contractor_id: str) -> Dict:
        """Get contractor onboarding status."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'error': 'Contractor not found'}

        onboarding = self._load_onboarding(contractor)
        sections_completed = onboarding.get('sections_completed', 0)
        total_required = sum(1 for s in self.ONBOARDING_SECTIONS.values() if s['required'])

        sections_status = {}
        for num, info in self.ONBOARDING_SECTIONS.items():
            section_data = onboarding.get(f'section_{num}', {})
            sections_status[num] = {
                'name': info['name'],
                'required': info['required'],
                'status': section_data.get('status', 'not_started'),
                'completed_at': section_data.get('completed_at')
            }

        return {
            'contractor_id': contractor_id,
            'overall_status': contractor.status or 'pending',
            'progress_percent': int((sections_completed / 9) * 100),
            'sections_completed': sections_completed,
            'total_sections': 9,
            'required_complete': all(
                onboarding.get(f'section_{n}', {}).get('status') == 'complete'
                for n, s in self.ONBOARDING_SECTIONS.items() if s['required']
            ),
            'sections': sections_status,
            'can_submit': sections_completed >= total_required
        }

    # =========================================================================
    # INVOICING
    # =========================================================================

    def create_invoice(self, contractor_id: str, data: Dict) -> Dict:
        """Create a new invoice."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if not data.get('client_id'):
            return {'success': False, 'error': 'Client is required'}

        if not data.get('line_items') or len(data['line_items']) == 0:
            return {'success': False, 'error': 'At least one line item required'}

        # Generate invoice number
        invoice_count = ContractorInvoice.query.filter(ContractorInvoice.contractor_id == contractor_id).count()
        invoice_number = f"INV-{invoice_count + 1:04d}"

        # Calculate totals
        subtotal = Decimal('0.00')
        for item in data['line_items']:
            qty = Decimal(str(item.get('quantity', 1)))
            rate = Decimal(str(item.get('rate', 0)))
            item['amount'] = qty * rate
            subtotal += item['amount']

        tax_rate = Decimal(str(data.get('tax_rate', 0))) / 100
        tax_amount = subtotal * tax_rate
        total = subtotal + tax_amount

        invoice_id = str(uuid.uuid4())
        invoice = ContractorInvoice(
            id=invoice_id,
            invoice_number=data.get('invoice_number', invoice_number),
            contractor_id=contractor_id,
            client_id=str(data['client_id']),
            project_id=str(data.get('project_id')) if data.get('project_id') else None,
            line_items_json=json.dumps([{**i, 'amount': float(i.get('amount'))} for i in data['line_items']]),
            subtotal=float(subtotal),
            tax_rate=float(tax_rate * 100),
            tax_amount=float(tax_amount),
            total=float(total),
            currency=data.get('currency', 'USD'),
            invoice_date=data.get('invoice_date', datetime.utcnow().date().isoformat()),
            due_date=data.get('due_date'),
            payment_terms=data.get('payment_terms', 'net_30'),
            notes=data.get('notes', ''),
            terms=data.get('terms', ''),
            status='draft',
            amount_paid=0.0,
        )
        db.session.add(invoice)
        db.session.commit()

        return {
            'success': True,
            'invoice_id': invoice_id,
            'invoice_number': invoice.invoice_number,
            'total': float(total)
        }

    def send_invoice(self, contractor_id: str, invoice_id: str) -> Dict:
        """Send invoice to client."""
        invoice = ContractorInvoice.query.get(invoice_id)
        if not invoice or invoice.contractor_id != contractor_id:
            return {'success': False, 'error': 'Invoice not found'}

        invoice.status = 'sent'
        invoice.sent_at = datetime.utcnow()
        db.session.commit()

        # In production: Send email to client
        return {
            'success': True,
            'message': 'Invoice sent successfully',
            'sent_at': invoice.sent_at.isoformat() if invoice.sent_at else None
        }

    def get_invoices(self, contractor_id: str, status: str = None) -> List[Dict]:
        """Get contractor's invoices."""
        query = ContractorInvoice.query.filter(ContractorInvoice.contractor_id == contractor_id)
        if status:
            query = query.filter(ContractorInvoice.status == status)
        invoices = query.order_by(ContractorInvoice.created_at.desc()).all()
        return [i.to_dict() for i in invoices]

    def record_payment(self, contractor_id: str, invoice_id: str, data: Dict) -> Dict:
        """Record payment received for invoice."""
        invoice = ContractorInvoice.query.get(invoice_id)
        if not invoice or invoice.contractor_id != contractor_id:
            return {'success': False, 'error': 'Invoice not found'}

        amount = Decimal(str(data.get('amount', 0)))
        if amount <= 0:
            return {'success': False, 'error': 'Invalid payment amount'}

        payment_id = str(uuid.uuid4())
        payment = ContractorInvoicePayment(
            id=payment_id,
            invoice_id=invoice_id,
            contractor_id=contractor_id,
            client_id=invoice.client_id,
            amount=float(amount),
            payment_method=data.get('payment_method', 'ach'),
            payment_date=data.get('payment_date', datetime.utcnow().date().isoformat()),
            reference_number=data.get('reference_number', ''),
            notes=data.get('notes', ''),
        )
        db.session.add(payment)

        invoice.amount_paid = float(Decimal(str(invoice.amount_paid)) + amount)
        if invoice.amount_paid >= invoice.total:
            invoice.status = 'paid'
            invoice.paid_at = datetime.utcnow()
        else:
            invoice.status = 'partial'
        db.session.commit()

        return {
            'success': True,
            'payment_id': payment_id,
            'invoice_status': invoice.status,
            'amount_remaining': invoice.total - invoice.amount_paid
        }

    # =========================================================================
    # EXPENSE TRACKING
    # =========================================================================

    def add_expense(self, contractor_id: str, data: Dict) -> Dict:
        """Add a business expense."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if not data.get('amount') or Decimal(str(data['amount'])) <= 0:
            return {'success': False, 'error': 'Valid amount required'}

        if not data.get('category'):
            return {'success': False, 'error': 'Category required'}

        expense_id = str(uuid.uuid4())
        expense = ContractorExpense(
            id=expense_id,
            contractor_id=contractor_id,
            date=data.get('date', datetime.utcnow().date().isoformat()),
            category=data['category'],
            description=data.get('description', ''),
            vendor=data.get('vendor', ''),
            amount=float(Decimal(str(data['amount']))),
            currency=data.get('currency', 'USD'),
            is_billable=bool(data.get('is_billable', False)),
            client_id=data.get('client_id'),
            project_id=data.get('project_id'),
            receipt_url=data.get('receipt_url'),
            tax_deductible=bool(data.get('tax_deductible', True)),
            status='logged',
        )

        db.session.add(expense)
        db.session.commit()

        return {
            'success': True,
            'expense_id': expense_id,
            'message': 'Expense logged successfully'
        }

    def get_expenses(self, contractor_id: str, year: int = None, category: str = None) -> Dict:
        """Get contractor's expenses with summary."""
        query = ContractorExpense.query.filter(ContractorExpense.contractor_id == contractor_id)
        if year:
            query = query.filter(ContractorExpense.date.like(f"{year}%"))
        if category:
            query = query.filter(ContractorExpense.category == category)

        expenses = query.order_by(ContractorExpense.date.desc()).all()

        total = sum(Decimal(str(e.amount)) for e in expenses)
        by_category: Dict[str, Decimal] = {}
        for e in expenses:
            by_category[e.category] = by_category.get(e.category, Decimal('0.00')) + Decimal(str(e.amount))

        return {
            'expenses': [e.to_dict() for e in expenses],
            'total': float(total),
            'count': len(expenses),
            'by_category': {k: float(v) for k, v in by_category.items()}
        }

    # =========================================================================
    # MILEAGE TRACKING
    # =========================================================================

    def log_mileage(self, contractor_id: str, data: Dict) -> Dict:
        """Log business mileage."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        miles = Decimal(str(data.get('miles', 0)))
        if miles <= 0:
            return {'success': False, 'error': 'Valid mileage required'}

        mileage_id = str(uuid.uuid4())
        deduction = miles * self.IRS_MILEAGE_RATE

        entry = ContractorMileageLog(
            id=mileage_id,
            contractor_id=contractor_id,
            date=data.get('date', datetime.utcnow().date().isoformat()),
            miles=float(miles),
            purpose=data.get('purpose', ''),
            from_location=data.get('from_location', ''),
            to_location=data.get('to_location', ''),
            client_id=data.get('client_id'),
            project_id=data.get('project_id'),
            is_round_trip=bool(data.get('is_round_trip', False)),
            irs_rate=float(self.IRS_MILEAGE_RATE),
            deduction_amount=float(deduction),
        )
        db.session.add(entry)
        db.session.commit()

        return {
            'success': True,
            'mileage_id': mileage_id,
            'deduction_amount': float(deduction)
        }

    def get_mileage_summary(self, contractor_id: str, year: int = None) -> Dict:
        """Get mileage summary for tax purposes."""
        query = ContractorMileageLog.query.filter(ContractorMileageLog.contractor_id == contractor_id)
        if year:
            query = query.filter(ContractorMileageLog.date.like(f"{year}%"))
        logs = query.order_by(ContractorMileageLog.date.desc()).all()

        total_miles = sum(Decimal(str(m.miles)) for m in logs)
        total_deduction = total_miles * self.IRS_MILEAGE_RATE

        return {
            'logs': [m.to_dict() for m in logs],
            'total_miles': float(total_miles),
            'total_deduction': float(total_deduction),
            'irs_rate': float(self.IRS_MILEAGE_RATE),
            'trip_count': len(logs)
        }

    # =========================================================================
    # 1099-NEC GENERATION
    # =========================================================================

    def check_1099_eligibility(self, contractor_id: str, year: int) -> Dict:
        """Check if contractor is eligible for 1099-NEC."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        year_payments = self._payments_for_year(contractor_id, year)
        total_paid = sum(Decimal(str(p.amount)) for p in year_payments)
        eligible = total_paid >= self.THRESHOLD_1099

        return {
            'contractor_id': contractor_id,
            'year': year,
            'total_paid': float(total_paid),
            'threshold': float(self.THRESHOLD_1099),
            'eligible_for_1099': eligible,
            'payment_count': len(year_payments)
        }

    def generate_1099_nec(self, contractor_id: str, year: int, client_id: str) -> Dict:
        """Generate 1099-NEC form data."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        w9 = (
            ContractorW9Form.query.filter(ContractorW9Form.contractor_id == contractor_id)
            .order_by(ContractorW9Form.created_at.desc())
            .first()
        )
        if not w9:
            return {'success': False, 'error': 'W-9 not on file - cannot generate 1099'}

        # Calculate total payments from this client
        client_payments = (
            ContractorInvoicePayment.query.filter(ContractorInvoicePayment.contractor_id == contractor_id)
            .filter(ContractorInvoicePayment.client_id == client_id)
            .filter(ContractorInvoicePayment.payment_date.like(f"{year}%"))
            .all()
        )
        total_paid = sum(Decimal(str(p.amount)) for p in client_payments)

        if total_paid < self.THRESHOLD_1099:
            return {
                'success': False,
                'error': f'Total payments (${total_paid}) below $600 threshold'
            }

        form_id = str(uuid.uuid4())
        form = ContractorForm1099(
            id=form_id,
            tax_year=year,
            contractor_id=contractor_id,
            client_id=client_id,
            recipient_name=w9.name,
            recipient_tin_masked=w9.tin_masked,
            recipient_tin_type=w9.tin_type,
            recipient_address=w9.address,
            box_1_nonemployee_compensation=float(total_paid),
            box_4_federal_tax_withheld=0.0,
            status='generated',
            generated_at=datetime.utcnow(),
        )
        db.session.add(form)
        db.session.commit()

        return {
            'success': True,
            'form_id': form.id,
            'tax_year': year,
            'total_compensation': float(total_paid)
        }

    def file_1099_to_irs(self, client_id: str, year: int) -> Dict:
        """
        File all 1099-NEC forms for a client to IRS FIRE system.
        Automatically collects all contractor 1099s for the year.
        """

        from services.regulatory_filing_service import regulatory_filing_service

        forms = (
            ContractorForm1099.query.filter(ContractorForm1099.client_id == client_id)
            .filter(ContractorForm1099.tax_year == year)
            .filter(ContractorForm1099.status == 'generated')
            .all()
        )

        forms_to_file = [
            {
                'form_id': f.id,
                'recipient_tin': f.recipient_tin_masked or '',
                'recipient_name': f.recipient_name,
                'recipient_address': f.recipient_address,
                'amount': f.box_1_nonemployee_compensation,
                'payer_tin': client_id,
            }
            for f in forms
        ]

        if not forms_to_file:
            return {'success': False, 'error': 'No 1099 forms ready for filing'}

        result = regulatory_filing_service.submit_1099_fire(
            company_id=client_id,
            forms=forms_to_file,
            tax_year=year,
            is_correction=False
        )

        if result.get('success'):
            for f in forms:
                f.status = 'filed'
                f.filed_at = datetime.utcnow()
            db.session.commit()

        return {
            'success': result.get('success', False),
            'forms_filed': len(forms_to_file),
            'confirmation_number': result.get('confirmation_number'),
            'filing_id': result.get('filing_id'),
            'message': result.get('message')
        }

    def get_1099_forms(self, contractor_id: str, year: int = None) -> List[Dict]:
        """Get contractor's 1099 forms."""
        query = ContractorForm1099.query.filter(ContractorForm1099.contractor_id == contractor_id)
        if year:
            query = query.filter(ContractorForm1099.tax_year == year)
        forms = query.order_by(ContractorForm1099.generated_at.desc()).all()
        return [f.to_dict() for f in forms]

    # =========================================================================
    # TAX CALCULATIONS
    # =========================================================================

    def calculate_estimated_taxes(self, contractor_id: str, year: int) -> Dict:
        """Calculate estimated quarterly taxes."""
        year_payments = self._payments_for_year(contractor_id, year)
        year_expenses = (
            ContractorExpense.query.filter(ContractorExpense.contractor_id == contractor_id)
            .filter(ContractorExpense.date.like(f"{year}%"))
            .all()
        )
        year_mileage = (
            ContractorMileageLog.query.filter(ContractorMileageLog.contractor_id == contractor_id)
            .filter(ContractorMileageLog.date.like(f"{year}%"))
            .all()
        )

        gross_income = sum(Decimal(str(p.amount)) for p in year_payments)
        total_expenses = sum(Decimal(str(e.amount)) for e in year_expenses if e.tax_deductible)
        mileage_deduction = sum(Decimal(str(m.deduction_amount or 0)) for m in year_mileage)

        net_income = gross_income - total_expenses - mileage_deduction
        net_income = max(net_income, Decimal('0'))

        # Self-employment tax (15.3%)
        se_tax = net_income * self.SELF_EMPLOYMENT_TAX_RATE

        # Estimated federal income tax (simplified - 22% bracket)
        federal_tax = net_income * Decimal('0.22')

        # Total estimated tax
        total_tax = se_tax + federal_tax
        quarterly_payment = total_tax / 4

        return {
            'year': year,
            'gross_income': float(gross_income),
            'total_expenses': float(total_expenses),
            'mileage_deduction': float(mileage_deduction),
            'net_income': float(net_income),
            'self_employment_tax': float(se_tax),
            'self_employment_rate': float(self.SELF_EMPLOYMENT_TAX_RATE * 100),
            'estimated_federal_tax': float(federal_tax),
            'total_estimated_tax': float(total_tax),
            'quarterly_payment': float(quarterly_payment),
            'quarterly_deadlines': [
                f'{year}-04-15', f'{year}-06-15', f'{year}-09-15', f'{year + 1}-01-15'
            ]
        }

    # =========================================================================
    # PORTAL DASHBOARD
    # =========================================================================

    def get_dashboard(self, contractor_id: str) -> Dict:
        """Get contractor portal dashboard data."""
        contractor = ContractorAccount.query.get(contractor_id)
        if not contractor:
            return {'error': 'Contractor not found'}

        current_year = datetime.utcnow().year
        payments = (
            ContractorInvoicePayment.query.filter(ContractorInvoicePayment.contractor_id == contractor_id)
            .order_by(ContractorInvoicePayment.created_at.desc())
            .all()
        )
        invoices = ContractorInvoice.query.filter(ContractorInvoice.contractor_id == contractor_id).all()

        # Calculate YTD earnings
        ytd_payments = [p for p in payments if (p.payment_date or '').startswith(str(current_year))]
        ytd_invoiced = sum(
            Decimal(str(i.total))
            for i in invoices
            if (i.invoice_date or '').startswith(str(current_year))
        )
        ytd_earnings = sum(Decimal(str(p.amount)) for p in ytd_payments)

        # Outstanding invoices
        outstanding = [i for i in invoices if i.status in ['sent', 'partial', 'overdue']]
        outstanding_amount = sum(Decimal(str(i.total)) - Decimal(str(i.amount_paid)) for i in outstanding)

        # Recent activity
        recent_payments = sorted(payments, key=lambda x: x.created_at or datetime.min, reverse=True)[:5]
        recent_invoices = sorted(invoices, key=lambda x: x.created_at or datetime.min, reverse=True)[:5]

        return {
            'contractor_id': contractor_id,
            'business_name': contractor.business_name or contractor.legal_name or '',
            'status': contractor.status or 'active',
            'quick_stats': {
                'ytd_earnings': float(ytd_earnings),
                'ytd_invoiced': float(ytd_invoiced),
                'outstanding_invoices': len(outstanding),
                'outstanding_amount': float(outstanding_amount),
                'invoice_count': len(invoices),
                'payment_count': len(payments)
            },
            'recent_activity': {
                'payments': [p.to_dict() for p in recent_payments],
                'invoices': [i.to_dict() for i in recent_invoices]
            },
            'alerts': [],
            'tax_summary': {
                'ytd_income': float(ytd_earnings),
                'estimated_tax_due': float(ytd_earnings * self.SELF_EMPLOYMENT_TAX_RATE)
            }
        }

# Initialize singleton instance
contractor_self_service = ContractorSelfServiceManager()

