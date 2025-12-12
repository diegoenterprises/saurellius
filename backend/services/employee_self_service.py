"""
EMPLOYEE SELF-SERVICE MODULE
Complete self-service registration, onboarding, and portal functionality
Zero-touch HR administration with full regulatory compliance
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
import uuid
import re
import secrets
import hashlib
from cryptography.fernet import Fernet
import os

ENCRYPTION_KEY = os.environ.get('SAURELLIUS_ENCRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY if isinstance(ENCRYPTION_KEY, bytes) else ENCRYPTION_KEY.encode())


class EmployeeSelfServiceModule:
    """
    Complete employee self-service system.
    Supports both self-service and employer-invited registration paths.
    """
    
    # ==========================================================================
    # PASSWORD REQUIREMENTS
    # ==========================================================================
    
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIREMENTS = {
        'min_length': 8,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_number': True,
        'require_special': True
    }
    
    # ==========================================================================
    # EMPLOYMENT TYPES
    # ==========================================================================
    
    EMPLOYMENT_TYPES = [
        'full_time', 'part_time', 'temporary', 'seasonal', 'intern'
    ]
    
    FLSA_CLASSIFICATIONS = ['exempt', 'non_exempt']
    
    # ==========================================================================
    # DEMOGRAPHIC OPTIONS (EEO-1)
    # ==========================================================================
    
    GENDER_OPTIONS = ['male', 'female', 'non_binary', 'prefer_not_to_disclose']
    
    ETHNICITY_OPTIONS = [
        'hispanic_latino',
        'white',
        'black_african_american',
        'native_hawaiian_pacific_islander',
        'asian',
        'american_indian_alaska_native',
        'two_or_more_races',
        'prefer_not_to_disclose'
    ]
    
    VETERAN_STATUS = [
        'protected_veteran',
        'not_protected_veteran',
        'prefer_not_to_disclose'
    ]
    
    DISABILITY_STATUS = [
        'yes_disability',
        'no_disability',
        'prefer_not_to_answer'
    ]
    
    # ==========================================================================
    # ONBOARDING SECTIONS (10 Sections)
    # ==========================================================================
    
    ONBOARDING_SECTIONS = {
        1: {'name': 'Personal Information', 'required': True},
        2: {'name': 'Employment Information', 'required': True},
        3: {'name': 'Federal W-4', 'required': True},
        4: {'name': 'State Tax Forms', 'required': True},
        5: {'name': 'Direct Deposit', 'required': True},
        6: {'name': 'Form I-9 Section 1', 'required': True},
        7: {'name': 'Benefits Enrollment', 'required': False},
        8: {'name': 'Policy Acknowledgments', 'required': True},
        9: {'name': 'Additional Information', 'required': False},
        10: {'name': 'Document Uploads', 'required': False}
    }
    
    def __init__(self):
        self.employees = {}
        self.invitations = {}
        self.verification_codes = {}
        self.sessions = {}
    
    # ==========================================================================
    # PATH 1: SELF-SERVICE REGISTRATION
    # ==========================================================================
    
    def validate_password(self, password: str) -> Tuple[bool, List[str]]:
        """Validate password meets requirements."""
        errors = []
        
        if len(password) < self.PASSWORD_MIN_LENGTH:
            errors.append(f'Password must be at least {self.PASSWORD_MIN_LENGTH} characters')
        
        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', password):
            errors.append('Password must contain at least one number')
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append('Password must contain at least one special character')
        
        return len(errors) == 0, errors
    
    def validate_email(self, email: str) -> Tuple[bool, str]:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if re.match(pattern, email):
            return True, 'Valid'
        return False, 'Invalid email format'
    
    def validate_phone(self, phone: str) -> Tuple[bool, str]:
        """Validate phone number (10 digits)."""
        digits = re.sub(r'\D', '', phone)
        if len(digits) == 10:
            return True, 'Valid'
        return False, 'Phone must be 10 digits'
    
    def generate_verification_code(self) -> str:
        """Generate 6-digit verification code."""
        return str(secrets.randbelow(1000000)).zfill(6)
    
    def self_service_register(self, data: Dict) -> Dict:
        """
        Self-service employee registration.
        Employee signs up independently without employer invitation.
        """
        errors = []
        
        # Validate required fields
        required = ['email', 'password', 'password_confirm', 'first_name', 
                   'last_name', 'phone', 'date_of_birth']
        for field in required:
            if not data.get(field):
                errors.append(f'{field.replace("_", " ").title()} is required')
        
        if errors:
            return {'success': False, 'errors': errors}
        
        # Validate email
        valid, msg = self.validate_email(data['email'])
        if not valid:
            errors.append(msg)
        
        # Check if email already exists
        for emp in self.employees.values():
            if emp.get('email') == data['email']:
                errors.append('Email already registered')
                break
        
        # Validate password
        valid, pwd_errors = self.validate_password(data['password'])
        if not valid:
            errors.extend(pwd_errors)
        
        # Confirm password match
        if data['password'] != data['password_confirm']:
            errors.append('Passwords do not match')
        
        # Validate phone
        valid, msg = self.validate_phone(data['phone'])
        if not valid:
            errors.append(msg)
        
        # Validate terms acceptance
        if not data.get('accept_terms'):
            errors.append('You must accept the Terms of Service')
        if not data.get('accept_privacy'):
            errors.append('You must accept the Privacy Policy')
        if not data.get('accept_electronic_communications'):
            errors.append('You must accept Electronic Communications Consent')
        
        if errors:
            return {'success': False, 'errors': errors}
        
        # Create employee record
        employee_id = str(uuid.uuid4())
        
        # Hash password
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        
        employee = {
            'id': employee_id,
            'email': data['email'],
            'password_hash': password_hash,
            'first_name': data['first_name'],
            'middle_name': data.get('middle_name', ''),
            'last_name': data['last_name'],
            'preferred_name': data.get('preferred_name', ''),
            'phone': data['phone'],
            'date_of_birth': data['date_of_birth'],
            'employment_status': data.get('employment_status', 'looking_for_employer'),
            'status': 'pending_verification',
            'employer_id': None,
            'onboarding_status': 'not_started',
            'onboarding_progress': 0,
            'email_verified': False,
            'phone_verified': False,
            'two_factor_enabled': False,
            'terms_accepted_at': datetime.utcnow().isoformat(),
            'privacy_accepted_at': datetime.utcnow().isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        self.employees[employee_id] = employee
        
        # Generate verification codes
        email_code = self.generate_verification_code()
        phone_code = self.generate_verification_code()
        
        self.verification_codes[f"{employee_id}_email"] = {
            'code': email_code,
            'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            'type': 'email'
        }
        
        self.verification_codes[f"{employee_id}_phone"] = {
            'code': phone_code,
            'expires_at': (datetime.utcnow() + timedelta(minutes=10)).isoformat(),
            'type': 'phone'
        }
        
        return {
            'success': True,
            'employee_id': employee_id,
            'message': 'Account created. Please verify your email and phone.',
            'next_steps': [
                'Check your email for verification code',
                'Check your phone for SMS verification code',
                'Complete your profile',
                'Find your employer or invite them to join'
            ],
            'verification_required': {
                'email': True,
                'phone': True
            }
        }
    
    def verify_email(self, employee_id: str, code: str) -> Dict:
        """Verify email with code."""
        key = f"{employee_id}_email"
        verification = self.verification_codes.get(key)
        
        if not verification:
            return {'success': False, 'error': 'Verification code not found'}
        
        if datetime.fromisoformat(verification['expires_at']) < datetime.utcnow():
            return {'success': False, 'error': 'Verification code expired'}
        
        if verification['code'] != code:
            return {'success': False, 'error': 'Invalid verification code'}
        
        # Mark email as verified
        employee = self.employees.get(employee_id)
        if employee:
            employee['email_verified'] = True
            employee['email_verified_at'] = datetime.utcnow().isoformat()
            
            # Check if both verified
            if employee.get('phone_verified'):
                employee['status'] = 'pending_employer'
            
            del self.verification_codes[key]
            return {'success': True, 'message': 'Email verified successfully'}
        
        return {'success': False, 'error': 'Employee not found'}
    
    def verify_phone(self, employee_id: str, code: str) -> Dict:
        """Verify phone with SMS code."""
        key = f"{employee_id}_phone"
        verification = self.verification_codes.get(key)
        
        if not verification:
            return {'success': False, 'error': 'Verification code not found'}
        
        if datetime.fromisoformat(verification['expires_at']) < datetime.utcnow():
            return {'success': False, 'error': 'Verification code expired'}
        
        if verification['code'] != code:
            return {'success': False, 'error': 'Invalid verification code'}
        
        # Mark phone as verified
        employee = self.employees.get(employee_id)
        if employee:
            employee['phone_verified'] = True
            employee['phone_verified_at'] = datetime.utcnow().isoformat()
            
            # Check if both verified
            if employee.get('email_verified'):
                employee['status'] = 'pending_employer'
            
            del self.verification_codes[key]
            return {'success': True, 'message': 'Phone verified successfully'}
        
        return {'success': False, 'error': 'Employee not found'}
    
    # ==========================================================================
    # PATH 2: EMPLOYER-INVITED REGISTRATION
    # ==========================================================================
    
    def create_invitation(
        self,
        employer_id: str,
        employee_email: str,
        employee_name: str = '',
        hire_date: str = None,
        job_title: str = '',
        personal_message: str = ''
    ) -> Dict:
        """Create invitation for employee to join employer."""
        invitation_id = str(uuid.uuid4())
        invitation_token = secrets.token_urlsafe(32)
        
        invitation = {
            'id': invitation_id,
            'token': invitation_token,
            'employer_id': employer_id,
            'employee_email': employee_email,
            'employee_name': employee_name,
            'hire_date': hire_date,
            'job_title': job_title,
            'personal_message': personal_message,
            'status': 'pending',
            'expires_at': (datetime.utcnow() + timedelta(days=7)).isoformat(),
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.invitations[invitation_id] = invitation
        
        # Generate invitation URL
        invitation_url = f"https://app.saurellius.com/invite/{invitation_token}"
        
        return {
            'success': True,
            'invitation_id': invitation_id,
            'invitation_url': invitation_url,
            'expires_at': invitation['expires_at'],
            'message': f'Invitation sent to {employee_email}'
        }
    
    def accept_invitation(self, invitation_token: str, employee_data: Dict) -> Dict:
        """Accept employer invitation and register/connect account."""
        # Find invitation by token
        invitation = None
        for inv in self.invitations.values():
            if inv.get('token') == invitation_token:
                invitation = inv
                break
        
        if not invitation:
            return {'success': False, 'error': 'Invalid invitation'}
        
        if invitation['status'] != 'pending':
            return {'success': False, 'error': 'Invitation already used'}
        
        if datetime.fromisoformat(invitation['expires_at']) < datetime.utcnow():
            return {'success': False, 'error': 'Invitation expired'}
        
        # Check if employee has existing account
        existing_employee = None
        for emp in self.employees.values():
            if emp.get('email') == invitation['employee_email']:
                existing_employee = emp
                break
        
        if existing_employee:
            # Connect existing account to employer
            existing_employee['employer_id'] = invitation['employer_id']
            existing_employee['status'] = 'active'
            existing_employee['connected_at'] = datetime.utcnow().isoformat()
            
            if invitation.get('hire_date'):
                existing_employee['hire_date'] = invitation['hire_date']
            if invitation.get('job_title'):
                existing_employee['job_title'] = invitation['job_title']
            
            invitation['status'] = 'accepted'
            invitation['accepted_at'] = datetime.utcnow().isoformat()
            
            return {
                'success': True,
                'employee_id': existing_employee['id'],
                'message': 'Account connected to employer',
                'start_onboarding': True
            }
        else:
            # Create new account from invitation
            employee_data['email'] = invitation['employee_email']
            result = self.self_service_register(employee_data)
            
            if result['success']:
                employee = self.employees.get(result['employee_id'])
                employee['employer_id'] = invitation['employer_id']
                employee['status'] = 'pending_verification'
                
                if invitation.get('hire_date'):
                    employee['hire_date'] = invitation['hire_date']
                if invitation.get('job_title'):
                    employee['job_title'] = invitation['job_title']
                if invitation.get('employee_name'):
                    parts = invitation['employee_name'].split(' ', 1)
                    employee['first_name'] = parts[0]
                    if len(parts) > 1:
                        employee['last_name'] = parts[1]
                
                invitation['status'] = 'accepted'
                invitation['accepted_at'] = datetime.utcnow().isoformat()
            
            return result
    
    # ==========================================================================
    # EMPLOYER SEARCH & CONNECTION
    # ==========================================================================
    
    def search_employers(self, query: str) -> List[Dict]:
        """Search for employers by name or EIN."""
        # In production, this would search the company database
        # Returns list of matching employers (basic info only)
        results = [
            {
                'id': 'demo-company-1',
                'name': 'Acme Corporation',
                'city': 'San Francisco',
                'state': 'CA',
                'industry': 'Technology'
            }
        ]
        return results
    
    def request_to_join_employer(self, employee_id: str, employer_id: str, message: str = '') -> Dict:
        """Employee requests to join an employer."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'success': False, 'error': 'Employee not found'}
        
        if employee.get('employer_id'):
            return {'success': False, 'error': 'Already connected to an employer'}
        
        # Create join request
        request_id = str(uuid.uuid4())
        
        join_request = {
            'id': request_id,
            'employee_id': employee_id,
            'employer_id': employer_id,
            'employee_name': f"{employee['first_name']} {employee['last_name']}",
            'employee_email': employee['email'],
            'message': message,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # In production: Store request and notify employer
        
        return {
            'success': True,
            'request_id': request_id,
            'message': 'Request sent to employer. You will be notified when they respond.'
        }
    
    # ==========================================================================
    # COMPLETE ONBOARDING WORKFLOW (10 Sections)
    # ==========================================================================
    
    def get_onboarding_status(self, employee_id: str) -> Dict:
        """Get current onboarding status and progress."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'error': 'Employee not found'}
        
        onboarding = employee.get('onboarding', {})
        
        sections_status = {}
        completed_count = 0
        
        for section_num, section_info in self.ONBOARDING_SECTIONS.items():
            section_data = onboarding.get(f'section_{section_num}', {})
            is_complete = section_data.get('status') == 'complete'
            
            sections_status[section_num] = {
                'name': section_info['name'],
                'required': section_info['required'],
                'status': section_data.get('status', 'not_started'),
                'completed_at': section_data.get('completed_at')
            }
            
            if is_complete:
                completed_count += 1
        
        total_sections = len(self.ONBOARDING_SECTIONS)
        progress = round((completed_count / total_sections) * 100)
        
        return {
            'employee_id': employee_id,
            'overall_status': employee.get('onboarding_status', 'not_started'),
            'progress_percent': progress,
            'sections_completed': completed_count,
            'total_sections': total_sections,
            'sections': sections_status,
            'can_submit': progress == 100
        }
    
    def submit_onboarding_section(
        self,
        employee_id: str,
        section: int,
        data: Dict
    ) -> Dict:
        """Submit data for an onboarding section."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'success': False, 'error': 'Employee not found'}
        
        if section not in self.ONBOARDING_SECTIONS:
            return {'success': False, 'error': 'Invalid section'}
        
        # Validate section data based on section number
        validators = {
            1: self._validate_personal_info,
            2: self._validate_employment_info,
            3: self._validate_w4,
            4: self._validate_state_tax,
            5: self._validate_direct_deposit,
            6: self._validate_i9_section1,
            7: self._validate_benefits,
            8: self._validate_policy_acknowledgments,
            9: self._validate_additional_info,
            10: self._validate_document_uploads
        }
        
        validator = validators.get(section)
        if validator:
            valid, errors = validator(data)
            if not valid:
                return {'success': False, 'errors': errors}
        
        # Initialize onboarding if needed
        if 'onboarding' not in employee:
            employee['onboarding'] = {}
        
        # Encrypt sensitive data
        data = self._encrypt_sensitive_fields(section, data)
        
        # Save section data
        employee['onboarding'][f'section_{section}'] = {
            'data': data,
            'status': 'complete',
            'completed_at': datetime.utcnow().isoformat()
        }
        
        # Update progress
        status = self.get_onboarding_status(employee_id)
        employee['onboarding_progress'] = status['progress_percent']
        
        if status['progress_percent'] == 100:
            employee['onboarding_status'] = 'pending_review'
        else:
            employee['onboarding_status'] = 'in_progress'
        
        employee['updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'section': section,
            'section_name': self.ONBOARDING_SECTIONS[section]['name'],
            'progress': status['progress_percent'],
            'next_section': section + 1 if section < 10 else None
        }
    
    def _encrypt_sensitive_fields(self, section: int, data: Dict) -> Dict:
        """Encrypt sensitive fields based on section."""
        sensitive_fields = {
            1: ['ssn'],
            5: ['account_number'],
            6: ['alien_number', 'admission_number', 'foreign_passport_number']
        }
        
        fields = sensitive_fields.get(section, [])
        for field in fields:
            if field in data and data[field]:
                # Store last 4 for display
                if len(str(data[field])) >= 4:
                    data[f'{field}_last_four'] = str(data[field])[-4:]
                # Encrypt full value
                data[f'{field}_encrypted'] = cipher_suite.encrypt(str(data[field]).encode()).decode()
                del data[field]
        
        return data
    
    # ==========================================================================
    # SECTION VALIDATORS
    # ==========================================================================
    
    def _validate_personal_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 1: Personal Information."""
        errors = []
        
        required = ['first_name', 'last_name', 'ssn', 'date_of_birth',
                   'street_address', 'city', 'state', 'zip_code',
                   'emergency_contact_name', 'emergency_contact_phone']
        
        for field in required:
            if not data.get(field):
                errors.append(f'{field.replace("_", " ").title()} is required')
        
        # Validate SSN format
        if data.get('ssn'):
            ssn = data['ssn'].replace('-', '').replace(' ', '')
            if len(ssn) != 9 or not ssn.isdigit():
                errors.append('Invalid SSN format')
        
        # Validate state
        if data.get('state') and len(data['state']) != 2:
            errors.append('State must be 2-letter code')
        
        return len(errors) == 0, errors
    
    def _validate_employment_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 2: Employment Information."""
        errors = []
        
        required = ['job_title', 'hire_date', 'employment_type', 'work_state']
        
        for field in required:
            if not data.get(field):
                errors.append(f'{field.replace("_", " ").title()} is required')
        
        if data.get('employment_type') and data['employment_type'] not in self.EMPLOYMENT_TYPES:
            errors.append('Invalid employment type')
        
        return len(errors) == 0, errors
    
    def _validate_w4(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 3: Federal W-4."""
        errors = []
        
        if not data.get('filing_status'):
            errors.append('Filing status is required')
        
        valid_statuses = ['single', 'married_filing_jointly', 'head_of_household']
        if data.get('filing_status') and data['filing_status'] not in valid_statuses:
            errors.append('Invalid filing status')
        
        if not data.get('signature'):
            errors.append('Digital signature is required')
        
        # Validate numeric fields
        for field in ['dependents_amount', 'other_income', 'deductions', 'extra_withholding']:
            if data.get(field):
                try:
                    amount = float(data[field])
                    if amount < 0:
                        errors.append(f'{field.replace("_", " ").title()} cannot be negative')
                except ValueError:
                    errors.append(f'Invalid {field.replace("_", " ")}')
        
        return len(errors) == 0, errors
    
    def _validate_state_tax(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 4: State Tax Forms."""
        errors = []
        
        # Work state form required
        if not data.get('work_state_form'):
            errors.append('Work state tax form is required')
        elif not data['work_state_form'].get('signature'):
            errors.append('Work state form signature is required')
        
        return len(errors) == 0, errors
    
    def _validate_direct_deposit(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 5: Direct Deposit."""
        errors = []
        
        payment_method = data.get('payment_method', 'direct_deposit')
        
        if payment_method == 'direct_deposit':
            accounts = data.get('accounts', [])
            if not accounts:
                errors.append('At least one bank account is required')
            
            total_percent = 0
            has_remainder = False
            
            for i, account in enumerate(accounts):
                if not account.get('bank_name'):
                    errors.append(f'Account {i+1}: Bank name required')
                if not account.get('routing_number'):
                    errors.append(f'Account {i+1}: Routing number required')
                if not account.get('account_number'):
                    errors.append(f'Account {i+1}: Account number required')
                if account.get('account_type') not in ['checking', 'savings']:
                    errors.append(f'Account {i+1}: Invalid account type')
                
                if account.get('amount_type') == 'percent':
                    total_percent += float(account.get('amount', 0))
                elif account.get('amount_type') == 'remainder':
                    has_remainder = True
            
            if not has_remainder and accounts and abs(total_percent - 100) > 0.01:
                errors.append('Allocations must total 100% or include remainder account')
        
        if not data.get('authorization_signature'):
            errors.append('Direct deposit authorization signature required')
        
        return len(errors) == 0, errors
    
    def _validate_i9_section1(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 6: Form I-9 Section 1."""
        errors = []
        
        if not data.get('citizenship_status'):
            errors.append('Citizenship status is required')
        
        valid_statuses = ['citizen', 'noncitizen_national', 'permanent_resident', 'alien_authorized']
        if data.get('citizenship_status') and data['citizenship_status'] not in valid_statuses:
            errors.append('Invalid citizenship status')
        
        # Additional validation for non-citizens
        if data.get('citizenship_status') == 'permanent_resident':
            if not data.get('alien_number'):
                errors.append('USCIS/Alien number required for permanent residents')
        
        if data.get('citizenship_status') == 'alien_authorized':
            has_required = (
                data.get('alien_number') or
                data.get('admission_number') or
                (data.get('foreign_passport_number') and data.get('foreign_passport_country'))
            )
            if not has_required:
                errors.append('Work authorization documentation required')
        
        if not data.get('signature'):
            errors.append('Digital signature is required')
        
        return len(errors) == 0, errors
    
    def _validate_benefits(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 7: Benefits Enrollment."""
        # Benefits are optional, minimal validation
        errors = []
        
        # If enrolling in benefits requiring beneficiary, ensure it's provided
        if data.get('life_insurance_enrolled') or data.get('retirement_401k_enrolled'):
            if not data.get('beneficiary'):
                errors.append('Beneficiary information required for life insurance or 401(k)')
        
        return len(errors) == 0, errors
    
    def _validate_policy_acknowledgments(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 8: Policy Acknowledgments."""
        errors = []
        
        required_policies = [
            'employee_handbook',
            'code_of_conduct',
            'anti_harassment_policy'
        ]
        
        for policy in required_policies:
            ack = data.get('acknowledgments', {}).get(policy, {})
            if not ack.get('acknowledged'):
                errors.append(f'{policy.replace("_", " ").title()} acknowledgment required')
            if not ack.get('signature'):
                errors.append(f'{policy.replace("_", " ").title()} signature required')
        
        return len(errors) == 0, errors
    
    def _validate_additional_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 9: Additional Information."""
        # Optional section, no required validation
        return True, []
    
    def _validate_document_uploads(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Section 10: Document Uploads."""
        # Documents are validated by file type/size during upload
        return True, []
    
    # ==========================================================================
    # FINAL SUBMISSION
    # ==========================================================================
    
    def submit_onboarding(self, employee_id: str, final_signature: str) -> Dict:
        """Submit completed onboarding for employer review."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'success': False, 'error': 'Employee not found'}
        
        status = self.get_onboarding_status(employee_id)
        
        # Check required sections
        incomplete_required = []
        for section_num, section_info in self.ONBOARDING_SECTIONS.items():
            if section_info['required']:
                section_status = status['sections'].get(section_num, {})
                if section_status.get('status') != 'complete':
                    incomplete_required.append(section_info['name'])
        
        if incomplete_required:
            return {
                'success': False,
                'error': 'Required sections incomplete',
                'incomplete_sections': incomplete_required
            }
        
        if not final_signature:
            return {'success': False, 'error': 'Final signature required'}
        
        # Record final submission
        employee['onboarding']['final_submission'] = {
            'signature': final_signature,
            'submitted_at': datetime.utcnow().isoformat(),
            'ip_address': 'captured_from_request'  # Would be actual IP
        }
        
        employee['onboarding_status'] = 'submitted'
        employee['status'] = 'pending_approval'
        employee['updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'message': 'Onboarding submitted successfully',
            'next_steps': [
                'Your employer will review your information within 1-2 business days',
                'Schedule I-9 document verification appointment',
                'Your benefits elections will be processed',
                'You will receive notification once approved'
            ]
        }
    
    # ==========================================================================
    # EMPLOYEE PORTAL (12 Sections)
    # ==========================================================================
    
    def get_dashboard(self, employee_id: str) -> Dict:
        """Get employee dashboard data."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'error': 'Employee not found'}
        
        return {
            'welcome_message': f"Welcome back, {employee['first_name']}!",
            'quick_stats': {
                'next_payday': self._calculate_next_payday(),
                'days_until_payday': self._days_until_payday(),
                'ytd_earnings': employee.get('ytd_earnings', 0),
                'available_pto': employee.get('pto_balance', 0),
                'benefits_cost_monthly': employee.get('monthly_benefits_cost', 0)
            },
            'upcoming_events': [
                {'type': 'payday', 'date': self._calculate_next_payday(), 'description': 'Next Payday'},
            ],
            'recent_activity': employee.get('recent_activity', []),
            'notifications': employee.get('unread_notifications', []),
            'profile_completion': self._calculate_profile_completion(employee)
        }
    
    def get_paystubs(self, employee_id: str, year: int = None, limit: int = 10) -> Dict:
        """Get employee paystubs."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'error': 'Employee not found'}
        
        # In production, fetch from paystub database
        paystubs = employee.get('paystubs', [])
        
        if year:
            paystubs = [p for p in paystubs if p.get('year') == year]
        
        return {
            'paystubs': paystubs[:limit],
            'total_count': len(paystubs),
            'ytd_summary': {
                'gross': employee.get('ytd_gross', 0),
                'net': employee.get('ytd_net', 0),
                'federal_tax': employee.get('ytd_federal_tax', 0),
                'state_tax': employee.get('ytd_state_tax', 0),
                'deductions': employee.get('ytd_deductions', 0)
            }
        }
    
    def get_tax_documents(self, employee_id: str) -> Dict:
        """Get employee tax documents (W-2, etc.)."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'error': 'Employee not found'}
        
        return {
            'current_w4': employee.get('onboarding', {}).get('section_3', {}).get('data'),
            'w2_documents': employee.get('w2_documents', []),
            'state_tax_forms': employee.get('onboarding', {}).get('section_4', {}).get('data'),
            'can_update_w4': True
        }
    
    def get_benefits(self, employee_id: str) -> Dict:
        """Get employee benefits information."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'error': 'Employee not found'}
        
        benefits_data = employee.get('onboarding', {}).get('section_7', {}).get('data', {})
        
        return {
            'enrollments': benefits_data,
            'dependents': benefits_data.get('dependents', []),
            'beneficiaries': benefits_data.get('beneficiaries', []),
            'monthly_cost': employee.get('monthly_benefits_cost', 0),
            'next_open_enrollment': self._get_next_open_enrollment(),
            'life_events_allowed': True
        }
    
    def get_time_off_balance(self, employee_id: str) -> Dict:
        """Get employee time off balances."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'error': 'Employee not found'}
        
        return {
            'balances': {
                'vacation': employee.get('vacation_balance', 0),
                'sick': employee.get('sick_balance', 0),
                'personal': employee.get('personal_balance', 0)
            },
            'accrual_rate': {
                'vacation': employee.get('vacation_accrual_rate', 0),
                'sick': employee.get('sick_accrual_rate', 0)
            },
            'pending_requests': employee.get('pending_pto_requests', []),
            'approved_requests': employee.get('approved_pto_requests', [])
        }
    
    def request_time_off(
        self,
        employee_id: str,
        start_date: str,
        end_date: str,
        pto_type: str,
        notes: str = ''
    ) -> Dict:
        """Submit time off request."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'success': False, 'error': 'Employee not found'}
        
        request_id = str(uuid.uuid4())
        
        request = {
            'id': request_id,
            'employee_id': employee_id,
            'start_date': start_date,
            'end_date': end_date,
            'pto_type': pto_type,
            'notes': notes,
            'status': 'pending',
            'submitted_at': datetime.utcnow().isoformat()
        }
        
        # Add to pending requests
        if 'pending_pto_requests' not in employee:
            employee['pending_pto_requests'] = []
        employee['pending_pto_requests'].append(request)
        
        return {
            'success': True,
            'request_id': request_id,
            'message': 'Time off request submitted for approval'
        }
    
    def update_profile(self, employee_id: str, updates: Dict) -> Dict:
        """Update employee profile information."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'success': False, 'error': 'Employee not found'}
        
        # Fields employee can update directly
        allowed_fields = [
            'preferred_name', 'phone', 'personal_email',
            'street_address', 'city', 'state', 'zip_code',
            'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship'
        ]
        
        for field, value in updates.items():
            if field in allowed_fields:
                employee[field] = value
        
        employee['updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'message': 'Profile updated successfully'
        }
    
    def update_direct_deposit(self, employee_id: str, accounts: List[Dict]) -> Dict:
        """Update direct deposit information."""
        employee = self.employees.get(employee_id)
        if not employee:
            return {'success': False, 'error': 'Employee not found'}
        
        # Validate accounts
        valid, errors = self._validate_direct_deposit({'accounts': accounts, 'authorization_signature': 'update'})
        if not valid:
            return {'success': False, 'errors': errors}
        
        # Encrypt account numbers
        for account in accounts:
            if account.get('account_number'):
                account['account_encrypted'] = cipher_suite.encrypt(
                    account['account_number'].encode()
                ).decode()
                account['account_last_four'] = account['account_number'][-4:]
                del account['account_number']
        
        employee['direct_deposit_accounts'] = accounts
        employee['direct_deposit_updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'message': 'Direct deposit updated. Changes effective next pay period.',
            'prenote_required': True
        }
    
    # ==========================================================================
    # HELPER METHODS
    # ==========================================================================
    
    def _calculate_next_payday(self) -> str:
        """Calculate next payday (assumes biweekly Friday)."""
        today = date.today()
        days_until_friday = (4 - today.weekday()) % 7
        if days_until_friday == 0:
            days_until_friday = 7
        next_friday = today + timedelta(days=days_until_friday)
        # Adjust for biweekly
        return next_friday.isoformat()
    
    def _days_until_payday(self) -> int:
        """Calculate days until next payday."""
        next_payday = datetime.strptime(self._calculate_next_payday(), '%Y-%m-%d').date()
        return (next_payday - date.today()).days
    
    def _calculate_profile_completion(self, employee: Dict) -> int:
        """Calculate profile completion percentage."""
        fields = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth',
                 'street_address', 'city', 'state', 'zip_code']
        completed = sum(1 for f in fields if employee.get(f))
        return round((completed / len(fields)) * 100)
    
    def _get_next_open_enrollment(self) -> str:
        """Get next open enrollment period."""
        today = date.today()
        # Assume open enrollment is November 1 - November 30
        if today.month < 11:
            return f"{today.year}-11-01"
        else:
            return f"{today.year + 1}-11-01"


# Singleton instance
employee_self_service = EmployeeSelfServiceModule()
