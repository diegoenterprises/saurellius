"""
CONTRACTOR ONBOARDING SERVICE
1099 contractor registration with W-9 compliance and payment tracking
Automated 1099-NEC generation when payments reach $600 threshold
"""

from datetime import datetime, date
from typing import Dict, List, Optional, Tuple
import uuid
import re
from cryptography.fernet import Fernet
import os

ENCRYPTION_KEY = os.environ.get('SAURELLIUS_ENCRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY if isinstance(ENCRYPTION_KEY, bytes) else ENCRYPTION_KEY.encode())


class ContractorOnboardingService:
    """
    Handles contractor (1099) registration with W-9 compliance.
    Tracks payments and automatically flags for 1099-NEC reporting.
    """
    
    # W-9 Tax Classifications
    TAX_CLASSIFICATIONS = {
        'individual': 'Individual/sole proprietor or single-member LLC',
        'c_corporation': 'C Corporation',
        's_corporation': 'S Corporation',
        'partnership': 'Partnership',
        'trust_estate': 'Trust/estate',
        'llc_c': 'Limited liability company (C corporation)',
        'llc_s': 'Limited liability company (S corporation)',
        'llc_p': 'Limited liability company (Partnership)',
        'other': 'Other'
    }
    
    # Exempt payee codes (for backup withholding exemption)
    EXEMPT_PAYEE_CODES = {
        '1': 'An organization exempt from tax under section 501(a)',
        '2': 'The United States or any of its agencies or instrumentalities',
        '3': 'A state, the District of Columbia, a U.S. commonwealth or possession',
        '4': 'A foreign government or any of its political subdivisions',
        '5': 'A corporation',
        '6': 'A dealer in securities or commodities',
        '7': 'A futures commission merchant',
        '8': 'A real estate investment trust',
        '9': 'An entity registered under the Investment Company Act of 1940',
        '10': 'A common trust fund',
        '11': 'A financial institution',
        '12': 'A middleman known in the investment community',
        '13': 'A trust exempt from tax under section 664 or described in section 4947'
    }
    
    # FATCA exemption codes
    FATCA_EXEMPTION_CODES = {
        'A': 'An organization exempt from tax under section 501(a)',
        'B': 'The United States or any of its agencies or instrumentalities',
        'C': 'A state, the District of Columbia, a U.S. commonwealth or possession',
        'D': 'A corporation the stock of which is regularly traded',
        'E': 'A corporation that is a member of the same expanded affiliated group',
        'F': 'A dealer in securities, commodities, or derivative financial instruments',
        'G': 'A real estate investment trust',
        'H': 'A regulated investment company',
        'I': 'A common trust fund',
        'J': 'A bank as defined in section 581',
        'K': 'A broker',
        'L': 'A trust exempt from tax under section 664',
        'M': 'A tax exempt trust under a section 403(b) plan or section 457(g) plan'
    }
    
    # 1099-NEC reporting threshold
    REPORTING_THRESHOLD = 600.00
    WARNING_THRESHOLD = 500.00  # Send warning when approaching threshold
    
    def __init__(self):
        self.contractors = {}
    
    # =========================================================================
    # W-9 VALIDATION
    # =========================================================================
    
    def validate_tin(self, tin: str, tin_type: str) -> Tuple[bool, str]:
        """Validate TIN (SSN or EIN) format."""
        tin_clean = tin.replace('-', '').replace(' ', '')
        
        if tin_type == 'ssn':
            if len(tin_clean) != 9:
                return False, 'SSN must be 9 digits'
            if not tin_clean.isdigit():
                return False, 'SSN must contain only numbers'
            # Basic SSN validation
            if tin_clean.startswith('000') or tin_clean.startswith('666') or tin_clean.startswith('9'):
                return False, 'Invalid SSN'
            if tin_clean[3:5] == '00' or tin_clean[5:] == '0000':
                return False, 'Invalid SSN'
        
        elif tin_type == 'ein':
            if len(tin_clean) != 9:
                return False, 'EIN must be 9 digits'
            if not tin_clean.isdigit():
                return False, 'EIN must contain only numbers'
            # Valid EIN prefixes
            valid_prefixes = [
                '01', '02', '03', '04', '05', '06', '10', '11', '12', '13', '14', '15',
                '16', '20', '21', '22', '23', '24', '25', '26', '27', '30', '32', '33',
                '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45',
                '46', '47', '48', '50', '51', '52', '53', '54', '55', '56', '57', '58',
                '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '71', '72',
                '73', '74', '75', '76', '77', '80', '81', '82', '83', '84', '85', '86',
                '87', '88', '90', '91', '92', '93', '94', '95', '98', '99'
            ]
            if tin_clean[:2] not in valid_prefixes:
                return False, 'Invalid EIN prefix'
        
        else:
            return False, 'TIN type must be ssn or ein'
        
        return True, 'Valid'
    
    def validate_w9(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate W-9 form data."""
        errors = []
        
        # Required: Name
        if not data.get('name'):
            errors.append('Name (as shown on your income tax return) is required')
        
        # Tax classification
        if not data.get('tax_classification'):
            errors.append('Federal tax classification is required')
        elif data['tax_classification'] not in self.TAX_CLASSIFICATIONS:
            errors.append('Invalid tax classification')
        
        # TIN validation
        if not data.get('tin'):
            errors.append('Taxpayer Identification Number (SSN or EIN) is required')
        else:
            tin_type = data.get('tin_type', 'ssn')
            valid, msg = self.validate_tin(data['tin'], tin_type)
            if not valid:
                errors.append(msg)
        
        # Address
        if not data.get('address'):
            errors.append('Address is required')
        if not data.get('city'):
            errors.append('City is required')
        if not data.get('state'):
            errors.append('State is required')
        elif len(data['state']) != 2:
            errors.append('State must be 2-letter code')
        if not data.get('zip'):
            errors.append('ZIP code is required')
        
        # Certification/Signature
        if not data.get('signature'):
            errors.append('Digital signature is required')
        if not data.get('certification_accepted'):
            errors.append('You must certify the information is correct')
        
        # Exempt payee code validation (if provided)
        if data.get('exempt_payee_code'):
            if data['exempt_payee_code'] not in self.EXEMPT_PAYEE_CODES:
                errors.append('Invalid exempt payee code')
        
        # FATCA exemption code validation (if provided)
        if data.get('fatca_exemption_code'):
            if data['fatca_exemption_code'] not in self.FATCA_EXEMPTION_CODES:
                errors.append('Invalid FATCA exemption code')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # CONTRACTOR INFORMATION
    # =========================================================================
    
    def validate_contractor_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate contractor information."""
        errors = []
        
        # Contractor type
        if not data.get('contractor_type'):
            errors.append('Contractor type is required')
        elif data['contractor_type'] not in ['individual', 'business']:
            errors.append('Contractor type must be individual or business')
        
        # Contact info
        if not data.get('email'):
            errors.append('Email is required')
        else:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['email']):
                errors.append('Invalid email format')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # PAYMENT SETUP
    # =========================================================================
    
    def validate_payment_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate payment information."""
        errors = []
        
        # Payment method
        valid_methods = ['ach', 'check', 'wire', 'wallet']
        if not data.get('payment_method'):
            errors.append('Payment method is required')
        elif data['payment_method'] not in valid_methods:
            errors.append('Invalid payment method')
        
        # Bank info for ACH
        if data.get('payment_method') == 'ach':
            if not data.get('bank_name'):
                errors.append('Bank name is required for ACH')
            if not data.get('routing_number'):
                errors.append('Routing number is required for ACH')
            else:
                routing = data['routing_number'].replace(' ', '').replace('-', '')
                if len(routing) != 9 or not routing.isdigit():
                    errors.append('Invalid routing number')
            if not data.get('account_number'):
                errors.append('Account number is required for ACH')
            if data.get('account_type') not in ['checking', 'savings']:
                errors.append('Account type must be checking or savings')
        
        # Payment terms
        valid_terms = ['upon_invoice', 'net_15', 'net_30', 'net_45', 'net_60']
        if data.get('payment_terms') and data['payment_terms'] not in valid_terms:
            errors.append('Invalid payment terms')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # 1099 TRACKING
    # =========================================================================
    
    def check_1099_threshold(self, contractor_id: str, additional_payment: float = 0) -> Dict:
        """Check if contractor payments trigger 1099 reporting requirement."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'error': 'Contractor not found'}
        
        ytd_payments = contractor.get('ytd_payments', 0) + additional_payment
        
        result = {
            'contractor_id': contractor_id,
            'ytd_payments': ytd_payments,
            'threshold': self.REPORTING_THRESHOLD,
            'requires_1099': ytd_payments >= self.REPORTING_THRESHOLD,
            'approaching_threshold': ytd_payments >= self.WARNING_THRESHOLD and ytd_payments < self.REPORTING_THRESHOLD,
            'remaining_before_threshold': max(0, self.REPORTING_THRESHOLD - ytd_payments)
        }
        
        return result
    
    def record_payment(self, contractor_id: str, amount: float, description: str = '') -> Dict:
        """Record a payment to contractor and update 1099 tracking."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}
        
        # Update YTD payments
        previous_ytd = contractor.get('ytd_payments', 0)
        contractor['ytd_payments'] = previous_ytd + amount
        
        # Add payment record
        payment = {
            'id': str(uuid.uuid4()),
            'amount': amount,
            'description': description,
            'date': datetime.utcnow().isoformat(),
            'ytd_after': contractor['ytd_payments']
        }
        
        if 'payments' not in contractor:
            contractor['payments'] = []
        contractor['payments'].append(payment)
        
        # Check 1099 threshold
        threshold_status = self.check_1099_threshold(contractor_id)
        
        # Update 1099 flag
        contractor['requires_1099'] = threshold_status['requires_1099']
        
        # Alert if just crossed threshold
        just_crossed_threshold = previous_ytd < self.REPORTING_THRESHOLD and contractor['ytd_payments'] >= self.REPORTING_THRESHOLD
        
        return {
            'success': True,
            'payment': payment,
            'threshold_status': threshold_status,
            'alert': 'Contractor now requires 1099-NEC reporting' if just_crossed_threshold else None
        }
    
    def get_1099_summary(self, company_id: str, tax_year: int) -> Dict:
        """Get 1099 summary for all contractors."""
        contractors_requiring_1099 = []
        contractors_approaching = []
        contractors_exempt = []
        
        for cid, contractor in self.contractors.items():
            if contractor.get('company_id') != company_id:
                continue
            
            ytd = contractor.get('ytd_payments', 0)
            
            contractor_summary = {
                'id': cid,
                'name': contractor.get('w9_data', {}).get('name', ''),
                'tin_last_four': contractor.get('tin_last_four', ''),
                'ytd_payments': ytd
            }
            
            if ytd >= self.REPORTING_THRESHOLD:
                contractors_requiring_1099.append(contractor_summary)
            elif ytd >= self.WARNING_THRESHOLD:
                contractors_approaching.append(contractor_summary)
            else:
                contractors_exempt.append(contractor_summary)
        
        return {
            'tax_year': tax_year,
            'company_id': company_id,
            'requiring_1099': {
                'count': len(contractors_requiring_1099),
                'contractors': contractors_requiring_1099,
                'total_payments': sum(c['ytd_payments'] for c in contractors_requiring_1099)
            },
            'approaching_threshold': {
                'count': len(contractors_approaching),
                'contractors': contractors_approaching
            },
            'below_threshold': {
                'count': len(contractors_exempt),
                'contractors': contractors_exempt
            }
        }
    
    # =========================================================================
    # BACKUP WITHHOLDING
    # =========================================================================
    
    def determine_backup_withholding(self, contractor_id: str) -> Dict:
        """Determine if backup withholding is required."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'error': 'Contractor not found'}
        
        w9_data = contractor.get('w9_data', {})
        
        # Backup withholding required if:
        # 1. No TIN provided
        # 2. IRS notified payee is subject to backup withholding
        # 3. Incorrect TIN provided
        
        requires_backup = False
        reason = None
        
        if not w9_data.get('tin'):
            requires_backup = True
            reason = 'No TIN provided'
        elif contractor.get('backup_withholding_notified'):
            requires_backup = True
            reason = 'IRS notification of backup withholding requirement'
        
        # Check exempt status
        is_exempt = bool(w9_data.get('exempt_payee_code'))
        
        return {
            'contractor_id': contractor_id,
            'requires_backup_withholding': requires_backup and not is_exempt,
            'backup_withholding_rate': 24.0,  # Current IRS rate
            'reason': reason,
            'is_exempt': is_exempt,
            'exempt_code': w9_data.get('exempt_payee_code')
        }
    
    # =========================================================================
    # COMPLETE ONBOARDING WORKFLOW
    # =========================================================================
    
    def create_contractor(self, company_id: str, data: Dict) -> Dict:
        """Create new contractor onboarding."""
        contractor_id = str(uuid.uuid4())
        
        contractor = {
            'id': contractor_id,
            'company_id': company_id,
            'status': 'pending',
            'contractor_type': data.get('contractor_type', 'individual'),
            'steps': {
                1: {'name': 'Contractor Information', 'status': 'pending', 'data': {}},
                2: {'name': 'W-9 Form', 'status': 'pending', 'data': {}},
                3: {'name': 'Payment Setup', 'status': 'pending', 'data': {}}
            },
            'checklist': {
                'contractor_info': False,
                'w9_completed': False,
                'payment_setup': False
            },
            'ytd_payments': 0,
            'requires_1099': False,
            'payments': [],
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        self.contractors[contractor_id] = contractor
        return contractor
    
    def submit_step(self, contractor_id: str, step: int, data: Dict) -> Dict:
        """Submit data for a contractor onboarding step."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}
        
        # Validators by step
        validators = {
            1: self.validate_contractor_info,
            2: self.validate_w9,
            3: self.validate_payment_info
        }
        
        validator = validators.get(step)
        if validator:
            valid, errors = validator(data)
            if not valid:
                return {'success': False, 'errors': errors}
        
        # Encrypt sensitive data
        if step == 2 and data.get('tin'):
            data['tin_encrypted'] = cipher_suite.encrypt(data['tin'].encode()).decode()
            data['tin_last_four'] = data['tin'][-4:]
            contractor['tin_last_four'] = data['tin_last_four']
            del data['tin']
            contractor['w9_data'] = data
        
        if step == 3 and data.get('account_number'):
            data['account_encrypted'] = cipher_suite.encrypt(data['account_number'].encode()).decode()
            del data['account_number']
        
        # Save step data
        contractor['steps'][step]['data'] = data
        contractor['steps'][step]['status'] = 'complete'
        contractor['steps'][step]['completed_at'] = datetime.utcnow().isoformat()
        
        # Update checklist
        checklist_mapping = {
            1: 'contractor_info',
            2: 'w9_completed',
            3: 'payment_setup'
        }
        if step in checklist_mapping:
            contractor['checklist'][checklist_mapping[step]] = True
        
        # Check if all steps complete
        all_complete = all(s['status'] == 'complete' for s in contractor['steps'].values())
        if all_complete:
            contractor['status'] = 'active'
            contractor['activated_at'] = datetime.utcnow().isoformat()
        
        contractor['updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'contractor': contractor,
            'complete': all_complete
        }
    
    def get_contractor(self, contractor_id: str) -> Optional[Dict]:
        """Get contractor by ID."""
        return self.contractors.get(contractor_id)
    
    def get_company_contractors(self, company_id: str, status: Optional[str] = None) -> List[Dict]:
        """Get all contractors for a company."""
        contractors = []
        for cid, contractor in self.contractors.items():
            if contractor.get('company_id') == company_id:
                if status is None or contractor.get('status') == status:
                    contractors.append(contractor)
        return contractors
    
    def deactivate_contractor(self, contractor_id: str, reason: str = '') -> Dict:
        """Deactivate a contractor."""
        contractor = self.contractors.get(contractor_id)
        if not contractor:
            return {'success': False, 'error': 'Contractor not found'}
        
        contractor['status'] = 'inactive'
        contractor['deactivated_at'] = datetime.utcnow().isoformat()
        contractor['deactivation_reason'] = reason
        contractor['updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'contractor': contractor,
            'message': 'Contractor deactivated. Remember to issue 1099 if payments >= $600.'
        }


# Singleton instance
contractor_onboarding_service = ContractorOnboardingService()
