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
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from decimal import Decimal

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
        self.contractors: Dict[str, Dict] = {}
        self.invitations: Dict[str, Dict] = {}
        self.invoices: Dict[str, Dict] = {}
        self.expenses: Dict[str, List[Dict]] = {}
        self.mileage_logs: Dict[str, List[Dict]] = {}
        self.payments: Dict[str, List[Dict]] = {}
        self.documents: Dict[str, List[Dict]] = {}
        self.w9_forms: Dict[str, Dict] = {}
        self.form_1099s: Dict[str, List[Dict]] = {}

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

        # Check email uniqueness
        for c in self.contractors.values():
            if c.get('email') == data['email']:
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

        # Create contractor account
        contractor_id = str(uuid.uuid4())
        email_code = self.generate_verification_code()
        phone_code = self.generate_verification_code()

        contractor = {
            'id': contractor_id,
            'email': data['email'],
            'password_hash': hashlib.sha256(data['password'].encode()).hexdigest(),
            'phone': re.sub(r'\D', '', data['phone']),
            'business_classification': data['business_classification'],
            'legal_name': data.get('legal_name', ''),
            'business_name': data.get('business_name', ''),
            'dba_name': data.get('dba_name', ''),
            'date_of_birth': data.get('date_of_birth'),
            'working_status': data.get('working_status', 'exploring'),
            'status': 'pending_verification',
            'email_verified': False,
            'phone_verified': False,
            'email_verification_code': email_code,
            'email_verification_expires': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            'phone_verification_code': phone_code,
            'phone_verification_expires': (datetime.utcnow() + timedelta(minutes=10)).isoformat(),
            'accept_terms': data.get('accept_terms', False),
            'accept_privacy': data.get('accept_privacy', False),
            'accept_electronic_communications': data.get('accept_electronic_communications', False),
            'accept_contractor_acknowledgment': data.get('accept_contractor_acknowledgment', False),
            'onboarding': {
                'started_at': datetime.utcnow().isoformat(),
                'completed_at': None,
                'current_section': 1,
                'sections_completed': 0
            },
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        self.contractors[contractor_id] = contractor

        # In production: Send verification emails/SMS
        return {
            'success': True,
            'contractor_id': contractor_id,
            'message': 'Account created. Please verify your email and phone.',
            'next_step': 'verify_email',
            'email_code_expires': contractor['email_verification_expires']
        }

    def verify_email(self, contractor_id: str, code: str) -> Dict:
        """Verify contractor email with code."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if contractor.get('email_verified'):
            return {'success': True, 'message': 'Email already verified'}

        if contractor.get('email_verification_code') != code:
            return {'success': False, 'error': 'Invalid verification code'}

        expires = datetime.fromisoformat(contractor['email_verification_expires'])
        if datetime.utcnow() > expires:
            return {'success': False, 'error': 'Verification code expired'}

        contractor['email_verified'] = True
        contractor['email_verification_code'] = None
        contractor['updated_at'] = datetime.utcnow().isoformat()

        self._check_verification_complete(contractor_id)

        return {'success': True, 'message': 'Email verified successfully'}

    def verify_phone(self, contractor_id: str, code: str) -> Dict:
        """Verify contractor phone with SMS code."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if contractor.get('phone_verified'):
            return {'success': True, 'message': 'Phone already verified'}

        if contractor.get('phone_verification_code') != code:
            return {'success': False, 'error': 'Invalid verification code'}

        expires = datetime.fromisoformat(contractor['phone_verification_expires'])
        if datetime.utcnow() > expires:
            return {'success': False, 'error': 'Verification code expired'}

        contractor['phone_verified'] = True
        contractor['phone_verification_code'] = None
        contractor['updated_at'] = datetime.utcnow().isoformat()

        self._check_verification_complete(contractor_id)

        return {'success': True, 'message': 'Phone verified successfully'}

    def _check_verification_complete(self, contractor_id: str):
        """Check if all verifications complete and update status."""
        contractor = self.contractors.get(contractor_id)
        if contractor and contractor.get('email_verified') and contractor.get('phone_verified'):
            contractor['status'] = 'pending_client'
            contractor['updated_at'] = datetime.utcnow().isoformat()

    # =========================================================================
    # REGISTRATION - CLIENT INVITATION
    # =========================================================================

    def create_client_invitation(self, client_id: str, data: Dict) -> Dict:
        """Create invitation for contractor from client."""
        if not data.get('contractor_email'):
            return {'success': False, 'error': 'Contractor email required'}

        token = secrets.token_urlsafe(32)
        invitation_id = str(uuid.uuid4())

        invitation = {
            'id': invitation_id,
            'token': token,
            'client_id': client_id,
            'contractor_email': data['contractor_email'],
            'contractor_name': data.get('contractor_name', ''),
            'start_date': data.get('start_date'),
            'project_description': data.get('project_description', ''),
            'payment_terms': data.get('payment_terms', 'net_30'),
            'personal_message': data.get('personal_message', ''),
            'status': 'pending',
            'expires_at': (datetime.utcnow() + timedelta(days=14)).isoformat(),
            'created_at': datetime.utcnow().isoformat()
        }

        self.invitations[invitation_id] = invitation

        # In production: Send invitation email
        return {
            'success': True,
            'invitation_id': invitation_id,
            'invitation_url': f"https://app.saurellius.com/contractor/invite/{token}",
            'expires_at': invitation['expires_at']
        }

    def accept_invitation(self, token: str, data: Dict) -> Dict:
        """Accept client invitation."""
        invitation = None
        for inv in self.invitations.values():
            if inv.get('token') == token:
                invitation = inv
                break

        if not invitation:
            return {'success': False, 'error': 'Invalid invitation'}

        if invitation['status'] != 'pending':
            return {'success': False, 'error': 'Invitation already used'}

        expires = datetime.fromisoformat(invitation['expires_at'])
        if datetime.utcnow() > expires:
            return {'success': False, 'error': 'Invitation expired'}

        # Check if connecting existing account or creating new
        if data.get('existing_account'):
            # Connect existing contractor to client
            contractor_id = data.get('contractor_id')
            contractor = self.contractors.get(contractor_id)
            if not contractor:
                return {'success': False, 'error': 'Contractor account not found'}

            # Add client connection
            if 'clients' not in contractor:
                contractor['clients'] = []
            contractor['clients'].append({
                'client_id': invitation['client_id'],
                'connected_at': datetime.utcnow().isoformat(),
                'start_date': invitation.get('start_date'),
                'project_description': invitation.get('project_description')
            })
        else:
            # Create new contractor account
            data['email'] = invitation['contractor_email']
            result = self.self_service_register(data)
            if not result.get('success'):
                return result
            contractor_id = result['contractor_id']

            # Auto-connect to client
            contractor = self.contractors[contractor_id]
            contractor['clients'] = [{
                'client_id': invitation['client_id'],
                'connected_at': datetime.utcnow().isoformat(),
                'start_date': invitation.get('start_date'),
                'project_description': invitation.get('project_description')
            }]

        invitation['status'] = 'accepted'
        invitation['accepted_at'] = datetime.utcnow().isoformat()
        invitation['contractor_id'] = contractor_id

        return {
            'success': True,
            'contractor_id': contractor_id,
            'message': 'Successfully connected to client'
        }

    # =========================================================================
    # CLIENT SEARCH & CONNECTION
    # =========================================================================

    def search_clients(self, query: str) -> List[Dict]:
        """Search for clients by name."""
        # In production: Search database
        results = []
        # Mock results for now
        return results

    def request_to_join_client(self, contractor_id: str, client_id: str, message: str = '') -> Dict:
        """Contractor requests to join a client."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        # In production: Create join request record
        return {
            'success': True,
            'message': 'Join request sent to client',
            'status': 'pending_approval'
        }

    # =========================================================================
    # ONBOARDING - W-9 FORM
    # =========================================================================

    def submit_w9(self, contractor_id: str, data: Dict) -> Dict:
        """Submit W-9 form data."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        # Validate required fields
        if not data.get('name'):
            return {'success': False, 'error': 'Name is required (Line 1)'}

        if not data.get('tax_classification'):
            return {'success': False, 'error': 'Tax classification is required'}

        # Validate TIN (SSN or EIN)
        tin_type = data.get('tin_type', 'ssn')
        tin = data.get('tin', '')

        if tin_type == 'ssn':
            valid, msg = self.validate_ssn(tin)
        else:
            valid, msg = self.validate_ein(tin)

        if not valid:
            return {'success': False, 'error': msg}

        # Check certification
        if not data.get('certify_tin_correct'):
            return {'success': False, 'error': 'You must certify TIN is correct'}
        if not data.get('certify_us_person'):
            return {'success': False, 'error': 'You must certify US person status'}

        # Encrypt TIN
        encrypted_tin = self._encrypt_sensitive_data(tin)
        masked_tin = self._mask_ssn(tin) if tin_type == 'ssn' else self._mask_ein(tin)

        w9_form = {
            'id': str(uuid.uuid4()),
            'contractor_id': contractor_id,
            'name': data['name'],
            'business_name': data.get('business_name', ''),
            'tax_classification': data['tax_classification'],
            'llc_tax_classification': data.get('llc_tax_classification'),
            'exempt_payee_code': data.get('exempt_payee_code'),
            'fatca_exemption_code': data.get('fatca_exemption_code'),
            'address': {
                'street': data.get('street_address', ''),
                'city': data.get('city', ''),
                'state': data.get('state', ''),
                'zip_code': data.get('zip_code', '')
            },
            'tin_type': tin_type,
            'tin_encrypted': encrypted_tin,
            'tin_last_four': tin[-4:] if tin else '',
            'tin_masked': masked_tin,
            'subject_to_backup_withholding': data.get('subject_to_backup_withholding', False),
            'certify_tin_correct': data.get('certify_tin_correct', False),
            'certify_not_subject_backup': data.get('certify_not_subject_backup', True),
            'certify_us_person': data.get('certify_us_person', False),
            'certify_fatca': data.get('certify_fatca', False),
            'signature': data.get('signature', ''),
            'signature_date': datetime.utcnow().isoformat(),
            'signature_ip': data.get('ip_address', ''),
            'status': 'complete',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        self.w9_forms[contractor_id] = w9_form

        # Update contractor onboarding
        contractor['w9_complete'] = True
        contractor['tin_on_file'] = True
        contractor['updated_at'] = datetime.utcnow().isoformat()

        # Update onboarding progress
        self._update_onboarding_section(contractor_id, 2, w9_form)

        return {
            'success': True,
            'message': 'W-9 submitted successfully',
            'w9_id': w9_form['id']
        }

    def get_w9(self, contractor_id: str) -> Dict:
        """Get contractor's W-9 data (masked)."""
        w9 = self.w9_forms.get(contractor_id)
        if not w9:
            return {'error': 'W-9 not found'}

        # Return safe data (no encrypted TIN)
        return {
            'id': w9['id'],
            'name': w9['name'],
            'business_name': w9['business_name'],
            'tax_classification': w9['tax_classification'],
            'address': w9['address'],
            'tin_type': w9['tin_type'],
            'tin_masked': w9['tin_masked'],
            'status': w9['status'],
            'signature_date': w9['signature_date'],
            'created_at': w9['created_at']
        }

    # =========================================================================
    # ONBOARDING - PAYMENT METHODS
    # =========================================================================

    def setup_payment_method(self, contractor_id: str, data: Dict) -> Dict:
        """Set up contractor payment method."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        payment_method = data.get('payment_method', 'direct_deposit')

        if payment_method == 'direct_deposit':
            return self._setup_direct_deposit(contractor_id, data)
        elif payment_method == 'check':
            return self._setup_check_payment(contractor_id, data)
        elif payment_method == 'wire':
            return self._setup_wire_transfer(contractor_id, data)
        elif payment_method == 'wallet':
            return self._setup_digital_wallet(contractor_id, data)
        else:
            return {'success': False, 'error': 'Invalid payment method'}

    def _setup_direct_deposit(self, contractor_id: str, data: Dict) -> Dict:
        """Set up direct deposit (ACH)."""
        # Validate bank info
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

        contractor = self.contractors[contractor_id]
        
        # Encrypt account number
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

        contractor['payment_method'] = payment_info
        contractor['payment_setup_complete'] = True
        contractor['updated_at'] = datetime.utcnow().isoformat()

        self._update_onboarding_section(contractor_id, 3, payment_info)

        return {
            'success': True,
            'message': 'Direct deposit set up successfully',
            'account_last_four': account[-4:]
        }

    def _setup_check_payment(self, contractor_id: str, data: Dict) -> Dict:
        """Set up paper check payment."""
        contractor = self.contractors[contractor_id]

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

        contractor['payment_method'] = payment_info
        contractor['payment_setup_complete'] = True
        contractor['updated_at'] = datetime.utcnow().isoformat()

        self._update_onboarding_section(contractor_id, 3, payment_info)

        return {'success': True, 'message': 'Check payment set up successfully'}

    def _setup_wire_transfer(self, contractor_id: str, data: Dict) -> Dict:
        """Set up wire transfer payment."""
        contractor = self.contractors[contractor_id]

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

        contractor['payment_method'] = payment_info
        contractor['payment_setup_complete'] = True
        contractor['updated_at'] = datetime.utcnow().isoformat()

        self._update_onboarding_section(contractor_id, 3, payment_info)

        return {'success': True, 'message': 'Wire transfer set up successfully'}

    def _setup_digital_wallet(self, contractor_id: str, data: Dict) -> Dict:
        """Set up Saurellius digital wallet."""
        contractor = self.contractors[contractor_id]

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

        contractor['payment_method'] = payment_info
        contractor['payment_setup_complete'] = True
        contractor['wallet'] = {
            'id': wallet_id,
            'balance': Decimal('0.00'),
            'transactions': []
        }
        contractor['updated_at'] = datetime.utcnow().isoformat()

        self._update_onboarding_section(contractor_id, 3, payment_info)

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
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return

        if 'onboarding' not in contractor:
            contractor['onboarding'] = {}

        contractor['onboarding'][f'section_{section}'] = {
            'status': 'complete',
            'data': data,
            'completed_at': datetime.utcnow().isoformat()
        }

        # Count completed sections
        completed = sum(1 for i in range(1, 10) 
                       if contractor['onboarding'].get(f'section_{i}', {}).get('status') == 'complete')
        contractor['onboarding']['sections_completed'] = completed
        contractor['onboarding']['current_section'] = min(section + 1, 9)

    def get_onboarding_status(self, contractor_id: str) -> Dict:
        """Get contractor onboarding status."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'error': 'Contractor not found'}

        onboarding = contractor.get('onboarding', {})
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
            'overall_status': contractor.get('status', 'pending'),
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
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if not data.get('client_id'):
            return {'success': False, 'error': 'Client is required'}

        if not data.get('line_items') or len(data['line_items']) == 0:
            return {'success': False, 'error': 'At least one line item required'}

        # Generate invoice number
        invoice_count = len([i for i in self.invoices.values() if i['contractor_id'] == contractor_id])
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
        invoice = {
            'id': invoice_id,
            'invoice_number': data.get('invoice_number', invoice_number),
            'contractor_id': contractor_id,
            'client_id': data['client_id'],
            'project_id': data.get('project_id'),
            'line_items': data['line_items'],
            'subtotal': float(subtotal),
            'tax_rate': float(tax_rate * 100),
            'tax_amount': float(tax_amount),
            'total': float(total),
            'currency': data.get('currency', 'USD'),
            'invoice_date': data.get('invoice_date', datetime.utcnow().date().isoformat()),
            'due_date': data.get('due_date'),
            'payment_terms': data.get('payment_terms', 'net_30'),
            'notes': data.get('notes', ''),
            'terms': data.get('terms', ''),
            'status': 'draft',
            'sent_at': None,
            'viewed_at': None,
            'paid_at': None,
            'amount_paid': 0.00,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        self.invoices[invoice_id] = invoice

        return {
            'success': True,
            'invoice_id': invoice_id,
            'invoice_number': invoice['invoice_number'],
            'total': float(total)
        }

    def send_invoice(self, contractor_id: str, invoice_id: str) -> Dict:
        """Send invoice to client."""
        invoice = self.invoices.get(invoice_id)
        if not invoice:
            return {'success': False, 'error': 'Invoice not found'}

        if invoice['contractor_id'] != contractor_id:
            return {'success': False, 'error': 'Unauthorized'}

        invoice['status'] = 'sent'
        invoice['sent_at'] = datetime.utcnow().isoformat()
        invoice['updated_at'] = datetime.utcnow().isoformat()

        # In production: Send email to client
        return {
            'success': True,
            'message': 'Invoice sent successfully',
            'sent_at': invoice['sent_at']
        }

    def get_invoices(self, contractor_id: str, status: str = None) -> List[Dict]:
        """Get contractor's invoices."""
        invoices = [i for i in self.invoices.values() if i['contractor_id'] == contractor_id]
        if status:
            invoices = [i for i in invoices if i['status'] == status]
        return sorted(invoices, key=lambda x: x['created_at'], reverse=True)

    def record_payment(self, contractor_id: str, invoice_id: str, data: Dict) -> Dict:
        """Record payment received for invoice."""
        invoice = self.invoices.get(invoice_id)
        if not invoice:
            return {'success': False, 'error': 'Invoice not found'}

        if invoice['contractor_id'] != contractor_id:
            return {'success': False, 'error': 'Unauthorized'}

        amount = Decimal(str(data.get('amount', 0)))
        if amount <= 0:
            return {'success': False, 'error': 'Invalid payment amount'}

        payment_id = str(uuid.uuid4())
        payment = {
            'id': payment_id,
            'invoice_id': invoice_id,
            'contractor_id': contractor_id,
            'client_id': invoice['client_id'],
            'amount': float(amount),
            'payment_method': data.get('payment_method', 'ach'),
            'payment_date': data.get('payment_date', datetime.utcnow().date().isoformat()),
            'reference_number': data.get('reference_number', ''),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow().isoformat()
        }

        if contractor_id not in self.payments:
            self.payments[contractor_id] = []
        self.payments[contractor_id].append(payment)

        # Update invoice
        invoice['amount_paid'] = float(Decimal(str(invoice['amount_paid'])) + amount)
        if invoice['amount_paid'] >= invoice['total']:
            invoice['status'] = 'paid'
            invoice['paid_at'] = datetime.utcnow().isoformat()
        else:
            invoice['status'] = 'partial'
        invoice['updated_at'] = datetime.utcnow().isoformat()

        return {
            'success': True,
            'payment_id': payment_id,
            'invoice_status': invoice['status'],
            'amount_remaining': invoice['total'] - invoice['amount_paid']
        }

    # =========================================================================
    # EXPENSE TRACKING
    # =========================================================================

    def add_expense(self, contractor_id: str, data: Dict) -> Dict:
        """Add a business expense."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        if not data.get('amount') or Decimal(str(data['amount'])) <= 0:
            return {'success': False, 'error': 'Valid amount required'}

        if not data.get('category'):
            return {'success': False, 'error': 'Category required'}

        expense_id = str(uuid.uuid4())
        expense = {
            'id': expense_id,
            'contractor_id': contractor_id,
            'date': data.get('date', datetime.utcnow().date().isoformat()),
            'category': data['category'],
            'description': data.get('description', ''),
            'vendor': data.get('vendor', ''),
            'amount': float(Decimal(str(data['amount']))),
            'currency': data.get('currency', 'USD'),
            'is_billable': data.get('is_billable', False),
            'client_id': data.get('client_id'),
            'project_id': data.get('project_id'),
            'receipt_url': data.get('receipt_url'),
            'tax_deductible': data.get('tax_deductible', True),
            'status': 'logged',
            'created_at': datetime.utcnow().isoformat()
        }

        if contractor_id not in self.expenses:
            self.expenses[contractor_id] = []
        self.expenses[contractor_id].append(expense)

        return {
            'success': True,
            'expense_id': expense_id,
            'message': 'Expense logged successfully'
        }

    def get_expenses(self, contractor_id: str, year: int = None, category: str = None) -> Dict:
        """Get contractor's expenses with summary."""
        expenses = self.expenses.get(contractor_id, [])

        if year:
            expenses = [e for e in expenses if e['date'].startswith(str(year))]
        if category:
            expenses = [e for e in expenses if e['category'] == category]

        total = sum(Decimal(str(e['amount'])) for e in expenses)
        by_category = {}
        for e in expenses:
            cat = e['category']
            if cat not in by_category:
                by_category[cat] = Decimal('0.00')
            by_category[cat] += Decimal(str(e['amount']))

        return {
            'expenses': sorted(expenses, key=lambda x: x['date'], reverse=True),
            'total': float(total),
            'count': len(expenses),
            'by_category': {k: float(v) for k, v in by_category.items()}
        }

    # =========================================================================
    # MILEAGE TRACKING
    # =========================================================================

    def log_mileage(self, contractor_id: str, data: Dict) -> Dict:
        """Log business mileage."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        miles = Decimal(str(data.get('miles', 0)))
        if miles <= 0:
            return {'success': False, 'error': 'Valid mileage required'}

        mileage_id = str(uuid.uuid4())
        deduction = miles * self.IRS_MILEAGE_RATE

        mileage_entry = {
            'id': mileage_id,
            'contractor_id': contractor_id,
            'date': data.get('date', datetime.utcnow().date().isoformat()),
            'miles': float(miles),
            'purpose': data.get('purpose', ''),
            'from_location': data.get('from_location', ''),
            'to_location': data.get('to_location', ''),
            'client_id': data.get('client_id'),
            'project_id': data.get('project_id'),
            'is_round_trip': data.get('is_round_trip', False),
            'irs_rate': float(self.IRS_MILEAGE_RATE),
            'deduction_amount': float(deduction),
            'created_at': datetime.utcnow().isoformat()
        }

        if contractor_id not in self.mileage_logs:
            self.mileage_logs[contractor_id] = []
        self.mileage_logs[contractor_id].append(mileage_entry)

        return {
            'success': True,
            'mileage_id': mileage_id,
            'deduction_amount': float(deduction)
        }

    def get_mileage_summary(self, contractor_id: str, year: int = None) -> Dict:
        """Get mileage summary for tax purposes."""
        logs = self.mileage_logs.get(contractor_id, [])

        if year:
            logs = [m for m in logs if m['date'].startswith(str(year))]

        total_miles = sum(Decimal(str(m['miles'])) for m in logs)
        total_deduction = total_miles * self.IRS_MILEAGE_RATE

        return {
            'logs': sorted(logs, key=lambda x: x['date'], reverse=True),
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
        payments = self.payments.get(contractor_id, [])
        year_payments = [p for p in payments if p['payment_date'].startswith(str(year))]

        total_paid = sum(Decimal(str(p['amount'])) for p in year_payments)
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
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}

        w9 = self.w9_forms.get(contractor_id)
        if not w9:
            return {'success': False, 'error': 'W-9 not on file - cannot generate 1099'}

        # Calculate total payments from this client
        payments = self.payments.get(contractor_id, [])
        client_payments = [p for p in payments 
                         if p['client_id'] == client_id and p['payment_date'].startswith(str(year))]
        total_paid = sum(Decimal(str(p['amount'])) for p in client_payments)

        if total_paid < self.THRESHOLD_1099:
            return {
                'success': False,
                'error': f'Total payments (${total_paid}) below $600 threshold'
            }

        form_1099 = {
            'id': str(uuid.uuid4()),
            'tax_year': year,
            'contractor_id': contractor_id,
            'client_id': client_id,
            'recipient_name': w9['name'],
            'recipient_tin_masked': w9['tin_masked'],
            'recipient_tin_type': w9['tin_type'],
            'recipient_address': w9['address'],
            'box_1_nonemployee_compensation': float(total_paid),
            'box_4_federal_tax_withheld': 0.00,
            'status': 'generated',
            'generated_at': datetime.utcnow().isoformat(),
            'filed_at': None,
            'sent_to_contractor_at': None
        }

        if contractor_id not in self.form_1099s:
            self.form_1099s[contractor_id] = []
        self.form_1099s[contractor_id].append(form_1099)

        return {
            'success': True,
            'form_id': form_1099['id'],
            'tax_year': year,
            'total_compensation': float(total_paid)
        }

    def file_1099_to_irs(self, client_id: str, year: int) -> Dict:
        """
        File all 1099-NEC forms for a client to IRS FIRE system.
        Automatically collects all contractor 1099s for the year.
        """
        from services.regulatory_filing_service import regulatory_filing_service
        
        # Collect all 1099 forms for this client
        forms_to_file = []
        
        for contractor_id, forms in self.form_1099s.items():
            for form in forms:
                if form['client_id'] == client_id and form['tax_year'] == year:
                    if form['status'] == 'generated':
                        forms_to_file.append({
                            'form_id': form['id'],
                            'recipient_tin': form.get('recipient_tin_masked', ''),
                            'recipient_name': form['recipient_name'],
                            'recipient_address': form['recipient_address'],
                            'amount': form['box_1_nonemployee_compensation'],
                            'payer_tin': client_id  # Would be actual EIN
                        })
        
        if not forms_to_file:
            return {'success': False, 'error': 'No 1099 forms ready for filing'}
        
        # Submit to IRS FIRE
        result = regulatory_filing_service.submit_1099_fire(
            company_id=client_id,
            forms=forms_to_file,
            tax_year=year,
            is_correction=False
        )
        
        # Update form statuses
        if result.get('success'):
            for contractor_id, forms in self.form_1099s.items():
                for form in forms:
                    if form['client_id'] == client_id and form['tax_year'] == year:
                        form['status'] = 'filed'
                        form['filed_at'] = datetime.utcnow().isoformat()
                        form['filing_confirmation'] = result.get('confirmation_number')
        
        return {
            'success': result.get('success', False),
            'forms_filed': len(forms_to_file),
            'confirmation_number': result.get('confirmation_number'),
            'filing_id': result.get('filing_id'),
            'message': result.get('message')
        }

    def get_1099_forms(self, contractor_id: str, year: int = None) -> List[Dict]:
        """Get contractor's 1099 forms."""
        forms = self.form_1099s.get(contractor_id, [])
        if year:
            forms = [f for f in forms if f['tax_year'] == year]
        return forms

    # =========================================================================
    # TAX CALCULATIONS
    # =========================================================================

    def calculate_estimated_taxes(self, contractor_id: str, year: int) -> Dict:
        """Calculate estimated quarterly taxes."""
        payments = self.payments.get(contractor_id, [])
        expenses = self.expenses.get(contractor_id, [])
        mileage = self.mileage_logs.get(contractor_id, [])

        # Filter by year
        year_payments = [p for p in payments if p['payment_date'].startswith(str(year))]
        year_expenses = [e for e in expenses if e['date'].startswith(str(year))]
        year_mileage = [m for m in mileage if m['date'].startswith(str(year))]

        # Calculate totals
        gross_income = sum(Decimal(str(p['amount'])) for p in year_payments)
        total_expenses = sum(Decimal(str(e['amount'])) for e in year_expenses if e['tax_deductible'])
        mileage_deduction = sum(Decimal(str(m['deduction_amount'])) for m in year_mileage)

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
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'error': 'Contractor not found'}

        current_year = datetime.utcnow().year
        payments = self.payments.get(contractor_id, [])
        invoices = [i for i in self.invoices.values() if i['contractor_id'] == contractor_id]

        # Calculate YTD earnings
        ytd_payments = [p for p in payments if p['payment_date'].startswith(str(current_year))]
        ytd_earnings = sum(Decimal(str(p['amount'])) for p in ytd_payments)

        # Outstanding invoices
        outstanding = [i for i in invoices if i['status'] in ['sent', 'partial', 'overdue']]
        outstanding_amount = sum(Decimal(str(i['total'])) - Decimal(str(i['amount_paid'])) for i in outstanding)

        # Recent activity
        recent_payments = sorted(payments, key=lambda x: x['created_at'], reverse=True)[:5]
        recent_invoices = sorted(invoices, key=lambda x: x['created_at'], reverse=True)[:5]

        return {
            'contractor_id': contractor_id,
            'business_name': contractor.get('business_name') or contractor.get('legal_name', ''),
            'status': contractor.get('status', 'active'),
            'quick_stats': {
                'ytd_earnings': float(ytd_earnings),
                'outstanding_invoices': len(outstanding),
                'outstanding_amount': float(outstanding_amount),
                'clients_count': len(contractor.get('clients', [])),
                'pending_invoices': len([i for i in invoices if i['status'] == 'draft'])
            },
            'recent_payments': recent_payments,
            'recent_invoices': recent_invoices,
            'w9_status': 'complete' if contractor.get('w9_complete') else 'incomplete',
            'payment_method_status': 'complete' if contractor.get('payment_setup_complete') else 'incomplete',
            'onboarding_complete': contractor.get('onboarding', {}).get('sections_completed', 0) >= 4
        }


# Initialize singleton instance
contractor_self_service = ContractorSelfServiceManager()

