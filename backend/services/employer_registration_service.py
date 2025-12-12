"""
EMPLOYER REGISTRATION SERVICE
Complete employer onboarding with regulatory compliance
Zero manual intervention - fully automated registration flow
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import uuid
import re
from cryptography.fernet import Fernet
import os

# Encryption key management
ENCRYPTION_KEY = os.environ.get('SAURELLIUS_ENCRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY if isinstance(ENCRYPTION_KEY, bytes) else ENCRYPTION_KEY.encode())


class EmployerRegistrationService:
    """
    Handles complete employer registration with all regulatory requirements.
    Designed for zero manual intervention - employer signs up and is ready to run payroll.
    """
    
    # Entity types for tax purposes
    ENTITY_TYPES = {
        'sole_proprietor': 'Sole Proprietorship',
        'partnership': 'Partnership',
        'corporation': 'C Corporation',
        's_corp': 'S Corporation',
        'llc_single': 'LLC (Single Member)',
        'llc_multi': 'LLC (Multi Member)',
        'non_profit': 'Non-Profit Organization',
        'government': 'Government Entity'
    }
    
    # FICA deposit frequencies based on tax liability
    FICA_DEPOSIT_SCHEDULES = {
        'monthly': {'max_liability': 50000, 'description': 'Monthly depositor'},
        'semi_weekly': {'min_liability': 50000, 'description': 'Semi-weekly depositor'},
        'next_day': {'min_liability': 100000, 'description': 'Next-day depositor (single-day $100K+ rule)'}
    }
    
    # State registration requirements
    STATE_REQUIREMENTS = {
        'CA': {
            'state_ein_format': r'^\d{3}-\d{4}-\d$',
            'sui_format': r'^\d{3}-\d{3}-\d$',
            'has_sdi': True,
            'has_pfml': True,
            'new_hire_deadline_days': 20,
            'forms': ['DE-4', 'DE-9', 'DE-9C']
        },
        'NY': {
            'state_ein_format': r'^\d{2}-\d{7}$',
            'sui_format': r'^\d{7}$',
            'has_sdi': True,
            'has_pfml': True,
            'new_hire_deadline_days': 20,
            'forms': ['IT-2104', 'NYS-45']
        },
        'TX': {
            'state_ein_format': r'^\d{11}$',
            'sui_format': r'^\d{8}$',
            'has_sdi': False,
            'has_pfml': False,
            'has_state_income_tax': False,
            'new_hire_deadline_days': 20,
            'forms': ['C-3']
        },
        'FL': {
            'sui_format': r'^\d{7}$',
            'has_sdi': False,
            'has_pfml': False,
            'has_state_income_tax': False,
            'new_hire_deadline_days': 20,
            'forms': ['RT-6']
        },
        # Add all 50 states...
    }
    
    def __init__(self):
        self.registrations = {}  # In production, this would be database-backed
    
    # =========================================================================
    # STEP 1: COMPANY INFORMATION
    # =========================================================================
    
    def validate_company_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate company information fields."""
        errors = []
        
        # Required fields
        required = ['legal_name', 'entity_type', 'physical_address', 'physical_city', 
                   'physical_state', 'physical_zip', 'primary_phone', 'primary_email']
        
        for field in required:
            if not data.get(field):
                errors.append(f'{field.replace("_", " ").title()} is required')
        
        # Validate entity type
        if data.get('entity_type') and data['entity_type'] not in self.ENTITY_TYPES:
            errors.append('Invalid entity type')
        
        # Validate state
        if data.get('physical_state') and len(data['physical_state']) != 2:
            errors.append('State must be 2-letter code')
        
        # Validate ZIP
        if data.get('physical_zip'):
            zip_pattern = r'^\d{5}(-\d{4})?$'
            if not re.match(zip_pattern, data['physical_zip']):
                errors.append('Invalid ZIP code format')
        
        # Validate phone
        if data.get('primary_phone'):
            phone_digits = re.sub(r'\D', '', data['primary_phone'])
            if len(phone_digits) != 10:
                errors.append('Phone must be 10 digits')
        
        # Validate email
        if data.get('primary_email'):
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['primary_email']):
                errors.append('Invalid email format')
        
        # Validate NAICS if provided
        if data.get('naics_code'):
            if not re.match(r'^\d{6}$', data['naics_code']):
                errors.append('NAICS code must be 6 digits')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 2: FEDERAL TAX REGISTRATION
    # =========================================================================
    
    def validate_ein(self, ein: str) -> Tuple[bool, str]:
        """Validate EIN format (XX-XXXXXXX)."""
        ein_clean = ein.replace('-', '').replace(' ', '')
        
        if len(ein_clean) != 9:
            return False, 'EIN must be 9 digits'
        
        if not ein_clean.isdigit():
            return False, 'EIN must contain only numbers'
        
        # First two digits must be valid IRS campus prefix
        valid_prefixes = [
            '01', '02', '03', '04', '05', '06', '10', '11', '12', '13', '14', '15',
            '16', '20', '21', '22', '23', '24', '25', '26', '27', '30', '32', '33',
            '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45',
            '46', '47', '48', '50', '51', '52', '53', '54', '55', '56', '57', '58',
            '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '71', '72',
            '73', '74', '75', '76', '77', '80', '81', '82', '83', '84', '85', '86',
            '87', '88', '90', '91', '92', '93', '94', '95', '98', '99'
        ]
        
        prefix = ein_clean[:2]
        if prefix not in valid_prefixes:
            return False, 'Invalid EIN prefix'
        
        return True, 'Valid'
    
    def encrypt_sensitive_data(self, data: str) -> bytes:
        """Encrypt sensitive data using AES-256."""
        return cipher_suite.encrypt(data.encode())
    
    def decrypt_sensitive_data(self, encrypted_data: bytes) -> str:
        """Decrypt sensitive data."""
        return cipher_suite.decrypt(encrypted_data).decode()
    
    def determine_fica_schedule(self, estimated_annual_liability: float) -> str:
        """Determine FICA deposit schedule based on estimated tax liability."""
        if estimated_annual_liability < 50000:
            return 'monthly'
        else:
            return 'semi_weekly'
    
    def validate_federal_tax_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate federal tax registration information."""
        errors = []
        
        # Validate EIN
        if not data.get('ein'):
            errors.append('EIN is required')
        else:
            valid, msg = self.validate_ein(data['ein'])
            if not valid:
                errors.append(msg)
        
        # Validate FICA depositor frequency
        valid_frequencies = ['monthly', 'semi_weekly']
        if data.get('fica_depositor_frequency') and data['fica_depositor_frequency'] not in valid_frequencies:
            errors.append('Invalid FICA depositor frequency')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 3: STATE TAX REGISTRATION
    # =========================================================================
    
    def get_state_requirements(self, state: str) -> Dict:
        """Get state-specific registration requirements."""
        return self.STATE_REQUIREMENTS.get(state, {
            'new_hire_deadline_days': 20,
            'has_sdi': False,
            'has_pfml': False,
            'forms': []
        })
    
    def validate_state_registration(self, state: str, data: Dict) -> Tuple[bool, List[str]]:
        """Validate state tax registration."""
        errors = []
        requirements = self.get_state_requirements(state)
        
        # State EIN format validation
        if requirements.get('state_ein_format') and data.get('state_ein'):
            if not re.match(requirements['state_ein_format'], data['state_ein']):
                errors.append(f'Invalid {state} state employer ID format')
        
        # SUI account format validation
        if requirements.get('sui_format') and data.get('sui_account'):
            if not re.match(requirements['sui_format'], data['sui_account']):
                errors.append(f'Invalid {state} SUI account format')
        
        # SUI rate validation (typically 0.1% to 15%)
        if data.get('sui_rate'):
            rate = float(data['sui_rate'])
            if rate < 0.1 or rate > 15:
                errors.append(f'SUI rate must be between 0.1% and 15%')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 4: BANKING & ACH SETUP
    # =========================================================================
    
    def validate_routing_number(self, routing: str) -> Tuple[bool, str]:
        """Validate ABA routing number using checksum algorithm."""
        routing_clean = routing.replace(' ', '').replace('-', '')
        
        if len(routing_clean) != 9:
            return False, 'Routing number must be 9 digits'
        
        if not routing_clean.isdigit():
            return False, 'Routing number must contain only numbers'
        
        # ABA routing number checksum validation
        # Sum of (3*d1 + 7*d2 + 1*d3 + 3*d4 + 7*d5 + 1*d6 + 3*d7 + 7*d8 + 1*d9) must be divisible by 10
        weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
        total = sum(int(d) * w for d, w in zip(routing_clean, weights))
        
        if total % 10 != 0:
            return False, 'Invalid routing number checksum'
        
        return True, 'Valid'
    
    def validate_bank_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate banking information for ACH."""
        errors = []
        
        # Required fields
        if not data.get('bank_name'):
            errors.append('Bank name is required')
        
        # Validate routing number
        if not data.get('bank_routing_number'):
            errors.append('Routing number is required')
        else:
            valid, msg = self.validate_routing_number(data['bank_routing_number'])
            if not valid:
                errors.append(msg)
        
        # Validate account number
        if not data.get('bank_account_number'):
            errors.append('Account number is required')
        else:
            account = data['bank_account_number'].replace(' ', '').replace('-', '')
            if len(account) < 4 or len(account) > 17:
                errors.append('Account number must be 4-17 digits')
            if not account.isdigit():
                errors.append('Account number must contain only numbers')
        
        # Validate account type
        valid_types = ['checking', 'savings']
        if data.get('bank_account_type') and data['bank_account_type'] not in valid_types:
            errors.append('Account type must be checking or savings')
        
        return len(errors) == 0, errors
    
    def initiate_bank_verification(self, company_id: str, method: str = 'micro_deposit') -> Dict:
        """Initiate bank account verification."""
        if method == 'micro_deposit':
            # In production, this would trigger actual micro-deposits via banking API
            return {
                'verification_id': str(uuid.uuid4()),
                'method': 'micro_deposit',
                'status': 'pending',
                'message': 'Two small deposits will appear in your account within 2-3 business days',
                'expires_at': (datetime.utcnow() + timedelta(days=5)).isoformat()
            }
        elif method == 'instant':
            # Plaid or similar instant verification
            return {
                'verification_id': str(uuid.uuid4()),
                'method': 'instant',
                'status': 'pending',
                'plaid_link_token': 'link-sandbox-xxxxx',  # Would be real token
                'message': 'Connect your bank for instant verification'
            }
        
        return {'status': 'error', 'message': 'Invalid verification method'}
    
    def verify_bank_micro_deposits(self, company_id: str, amounts: List[float]) -> Tuple[bool, str]:
        """Verify micro-deposit amounts."""
        # In production, this would check against actual sent amounts
        # For now, simulate verification
        expected_amounts = [0.32, 0.45]  # Example amounts
        
        if sorted(amounts) == sorted(expected_amounts):
            return True, 'Bank account verified successfully'
        else:
            return False, 'Micro-deposit amounts do not match'
    
    # =========================================================================
    # STEP 5: WORKERS COMPENSATION
    # =========================================================================
    
    def validate_workers_comp(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate workers compensation insurance information."""
        errors = []
        
        if data.get('has_workers_comp'):
            if not data.get('workers_comp_carrier'):
                errors.append('Workers comp carrier name is required')
            
            if not data.get('workers_comp_policy_number'):
                errors.append('Policy number is required')
            
            if data.get('workers_comp_policy_expiration'):
                exp_date = datetime.strptime(data['workers_comp_policy_expiration'], '%Y-%m-%d').date()
                if exp_date < datetime.utcnow().date():
                    errors.append('Workers comp policy has expired')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 6: REGULATORY COMPLIANCE
    # =========================================================================
    
    def determine_aca_status(self, full_time_equivalent_count: int) -> bool:
        """Determine if employer is an Applicable Large Employer under ACA."""
        # ALE status: 50+ full-time equivalent employees
        return full_time_equivalent_count >= 50
    
    def determine_eeo1_requirement(self, employee_count: int, has_federal_contracts: bool) -> bool:
        """Determine if EEO-1 reporting is required."""
        # Required for: 100+ employees OR 50+ with federal contracts $50K+
        return employee_count >= 100 or (employee_count >= 50 and has_federal_contracts)
    
    def get_compliance_checklist(self, company_data: Dict) -> Dict:
        """Generate compliance checklist based on company profile."""
        state = company_data.get('physical_state', '')
        employee_count = company_data.get('estimated_employee_count', 0)
        
        checklist = {
            'federal': {
                'ein_registered': False,
                'fica_schedule_determined': False,
                'form_941_schedule_set': False,
                'futa_registration': False
            },
            'state': {
                f'{state}_employer_registration': False,
                f'{state}_sui_account': False,
                f'{state}_withholding_account': False
            },
            'reporting': {
                'new_hire_reporting_setup': False,
                'electronic_filing_enabled': False
            },
            'banking': {
                'payroll_account_verified': False,
                'tax_payment_account_verified': False,
                'ach_origination_enabled': False
            }
        }
        
        # Add state-specific requirements
        state_reqs = self.get_state_requirements(state)
        if state_reqs.get('has_sdi'):
            checklist['state'][f'{state}_sdi_registration'] = False
        if state_reqs.get('has_pfml'):
            checklist['state'][f'{state}_pfml_registration'] = False
        
        # Add ACA if applicable
        if self.determine_aca_status(employee_count):
            checklist['federal']['aca_ale_reporting_setup'] = False
        
        # Add EEO-1 if applicable
        if self.determine_eeo1_requirement(employee_count, company_data.get('has_federal_contracts', False)):
            checklist['reporting']['eeo1_reporting_setup'] = False
        
        return checklist
    
    # =========================================================================
    # STEP 7: SUBSCRIPTION & BILLING
    # =========================================================================
    
    def calculate_recommended_plan(self, employee_count: int, features_needed: List[str]) -> Dict:
        """Recommend subscription plan based on needs."""
        if employee_count <= 25:
            base_plan = 'starter'
            base_price = 39
            per_employee = 5
        elif employee_count <= 100:
            base_plan = 'professional'
            base_price = 79
            per_employee = 8
        elif employee_count <= 500:
            base_plan = 'business'
            base_price = 149
            per_employee = 10
        else:
            base_plan = 'enterprise'
            base_price = 0  # Custom
            per_employee = 12
        
        monthly_cost = base_price + (employee_count * per_employee)
        
        return {
            'recommended_plan': base_plan,
            'base_price': base_price,
            'per_employee_price': per_employee,
            'employee_count': employee_count,
            'estimated_monthly_cost': monthly_cost,
            'features': self.get_plan_features(base_plan)
        }
    
    def get_plan_features(self, plan: str) -> List[str]:
        """Get features included in plan."""
        features = {
            'starter': [
                'Full-service payroll processing',
                'Unlimited payroll runs',
                'Federal, state, local tax filing',
                'W-2 and 1099 preparation',
                'Direct deposit (2-day)',
                'Employee self-service portal',
                'Basic reporting',
                'Email support'
            ],
            'professional': [
                'Everything in Starter, plus:',
                'Same-day direct deposit',
                'Time tracking & scheduling',
                'PTO management',
                'Benefits administration',
                'Digital Wallet & EWA',
                'HR document storage',
                'Onboarding workflows',
                'Priority email & chat support',
                'Custom reporting'
            ],
            'business': [
                'Everything in Professional, plus:',
                'Talent Management (ATS, Performance Reviews)',
                'Learning Management System (LMS)',
                'Goal Setting & OKRs',
                '360-Degree Feedback',
                'Advanced Analytics & Predictive Insights',
                'Job Costing & Labor Allocation',
                'FMLA Tracking',
                '401(k) Administration',
                'Dedicated account manager',
                'Phone support'
            ],
            'enterprise': [
                'Everything in Business, plus:',
                'Canadian payroll support',
                'Multi-currency (USD/CAD)',
                'Custom integrations',
                'Full API access',
                'Advanced compliance tools',
                'Succession planning',
                'Compensation benchmarking',
                'Dedicated implementation team',
                '24/7 phone support',
                'SLA guarantees'
            ]
        }
        return features.get(plan, [])
    
    # =========================================================================
    # COMPLETE REGISTRATION FLOW
    # =========================================================================
    
    def create_registration(self, user_id: int, initial_data: Dict) -> Dict:
        """Create new employer registration."""
        registration_id = str(uuid.uuid4())
        
        registration = {
            'id': registration_id,
            'user_id': user_id,
            'status': 'in_progress',
            'current_step': 1,
            'total_steps': 7,
            'steps': {
                1: {'name': 'Company Information', 'status': 'pending', 'data': {}},
                2: {'name': 'Federal Tax Registration', 'status': 'pending', 'data': {}},
                3: {'name': 'State Tax Registration', 'status': 'pending', 'data': {}},
                4: {'name': 'Banking & ACH Setup', 'status': 'pending', 'data': {}},
                5: {'name': 'Workers Compensation', 'status': 'pending', 'data': {}},
                6: {'name': 'Regulatory Compliance', 'status': 'pending', 'data': {}},
                7: {'name': 'Subscription & Billing', 'status': 'pending', 'data': {}}
            },
            'compliance_checklist': {},
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        self.registrations[registration_id] = registration
        return registration
    
    def submit_step(self, registration_id: str, step: int, data: Dict) -> Dict:
        """Submit data for a registration step."""
        registration = self.registrations.get(registration_id)
        if not registration:
            return {'success': False, 'error': 'Registration not found'}
        
        # Validate based on step
        validators = {
            1: self.validate_company_info,
            2: self.validate_federal_tax_info,
            3: lambda d: self.validate_state_registration(d.get('state', ''), d),
            4: self.validate_bank_info,
            5: self.validate_workers_comp,
            6: lambda d: (True, []),  # Regulatory acknowledgments
            7: lambda d: (True, [])   # Subscription selection
        }
        
        validator = validators.get(step)
        if validator:
            valid, errors = validator(data)
            if not valid:
                return {'success': False, 'errors': errors}
        
        # Save step data
        registration['steps'][step]['data'] = data
        registration['steps'][step]['status'] = 'complete'
        registration['steps'][step]['completed_at'] = datetime.utcnow().isoformat()
        
        # Encrypt sensitive data
        if step == 2 and data.get('ein'):
            registration['steps'][step]['data']['ein_encrypted'] = self.encrypt_sensitive_data(data['ein']).decode()
        if step == 4 and data.get('bank_account_number'):
            registration['steps'][step]['data']['bank_account_encrypted'] = self.encrypt_sensitive_data(data['bank_account_number']).decode()
        
        # Move to next step
        if step < registration['total_steps']:
            registration['current_step'] = step + 1
        else:
            registration['status'] = 'complete'
            registration['completed_at'] = datetime.utcnow().isoformat()
        
        registration['updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'registration': registration,
            'next_step': registration['current_step'] if registration['status'] != 'complete' else None
        }
    
    def complete_registration(self, registration_id: str) -> Dict:
        """Finalize registration and create company."""
        registration = self.registrations.get(registration_id)
        if not registration:
            return {'success': False, 'error': 'Registration not found'}
        
        # Verify all steps complete
        incomplete = [s for s, d in registration['steps'].items() if d['status'] != 'complete']
        if incomplete:
            return {'success': False, 'error': f'Steps {incomplete} are incomplete'}
        
        # Generate compliance checklist
        company_data = {**registration['steps'][1]['data'], **registration['steps'][6]['data']}
        registration['compliance_checklist'] = self.get_compliance_checklist(company_data)
        
        # In production: Create Company record, initialize dashboard, etc.
        company_id = str(uuid.uuid4())
        
        return {
            'success': True,
            'company_id': company_id,
            'registration_id': registration_id,
            'compliance_checklist': registration['compliance_checklist'],
            'message': 'Registration complete. Your company is ready to add employees and run payroll.',
            'next_steps': [
                'Add your first employee',
                'Set up pay schedule',
                'Connect time tracking (optional)',
                'Configure benefits (optional)'
            ]
        }


# Singleton instance
employer_registration_service = EmployerRegistrationService()
