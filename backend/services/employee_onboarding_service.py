"""
EMPLOYEE ONBOARDING SERVICE
Complete employee onboarding with W-4, I-9, direct deposit, benefits enrollment
Self-service workflow - employee completes onboarding without HR intervention
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
import uuid
import re
from cryptography.fernet import Fernet
import os

ENCRYPTION_KEY = os.environ.get('SAURELLIUS_ENCRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY if isinstance(ENCRYPTION_KEY, bytes) else ENCRYPTION_KEY.encode())


class EmployeeOnboardingService:
    """
    Handles complete employee onboarding with all regulatory forms.
    Self-service design - employees complete their own onboarding.
    """
    
    # W-4 Filing Statuses (2020+)
    W4_FILING_STATUSES = {
        'single': 'Single or Married filing separately',
        'married_filing_jointly': 'Married filing jointly',
        'head_of_household': 'Head of household'
    }
    
    # I-9 Citizenship Status
    I9_CITIZENSHIP_STATUS = {
        'citizen': 'A citizen of the United States',
        'noncitizen_national': 'A noncitizen national of the United States',
        'permanent_resident': 'A lawful permanent resident',
        'alien_authorized': 'An alien authorized to work'
    }
    
    # I-9 Document Lists
    I9_LIST_A_DOCUMENTS = [
        'US Passport',
        'US Passport Card',
        'Permanent Resident Card (Form I-551)',
        'Alien Registration Receipt Card (Form I-551)',
        'Foreign Passport with I-551 stamp',
        'Foreign Passport with Form I-94',
        'Employment Authorization Document (Form I-766)',
        'Foreign Passport with Form I-94 for F-1 students',
        'Foreign Passport with Form I-20'
    ]
    
    I9_LIST_B_DOCUMENTS = [
        "Driver's License",
        'ID Card issued by state/territory',
        'Government ID Card',
        'School ID Card with photograph',
        'Voter Registration Card',
        'US Military Card',
        'Military Dependent ID Card',
        "Native American Tribal Document",
        "Driver's License issued by Canadian government",
        'School Record (under 18)',
        'Report Card (under 18)',
        'Clinic/Doctor/Hospital Record (under 18)',
        'Day-Care/Nursery School Record (under 18)'
    ]
    
    I9_LIST_C_DOCUMENTS = [
        'Social Security Card (unrestricted)',
        'Certification of Report of Birth (Form DS-1350)',
        'Original/Certified Copy of Birth Certificate',
        'Native American Tribal Document',
        'US Citizen ID Card (Form I-197)',
        'ID Card for Resident Citizen (Form I-179)',
        'Employment Authorization Document (DHS)'
    ]
    
    # State Tax Form Requirements
    STATE_TAX_FORMS = {
        'AL': {'form': 'A-4', 'name': 'Alabama Employee Withholding Exemption Certificate'},
        'AK': {'form': None, 'name': 'No state income tax'},
        'AZ': {'form': 'A-4', 'name': 'Arizona Withholding Percentage Election'},
        'AR': {'form': 'AR4EC', 'name': 'Arkansas Employee Withholding Exemption Certificate'},
        'CA': {'form': 'DE-4', 'name': 'California Employee Withholding Allowance Certificate'},
        'CO': {'form': 'DR 0004', 'name': 'Colorado Employee Withholding Certificate'},
        'CT': {'form': 'CT-W4', 'name': 'Connecticut Employee Withholding Certificate'},
        'DE': {'form': 'W-4', 'name': 'Uses Federal W-4'},
        'FL': {'form': None, 'name': 'No state income tax'},
        'GA': {'form': 'G-4', 'name': 'Georgia Employee Withholding Allowance Certificate'},
        'HI': {'form': 'HW-4', 'name': 'Hawaii Employee Withholding Allowance Certificate'},
        'ID': {'form': 'W-4', 'name': 'Uses Federal W-4'},
        'IL': {'form': 'IL-W-4', 'name': 'Illinois Employee Withholding Allowance Certificate'},
        'IN': {'form': 'WH-4', 'name': 'Indiana Employee Withholding Exemption Certificate'},
        'IA': {'form': 'IA W-4', 'name': 'Iowa Employee Withholding Allowance Certificate'},
        'KS': {'form': 'K-4', 'name': 'Kansas Employee Withholding Allowance Certificate'},
        'KY': {'form': 'K-4', 'name': 'Kentucky Employee Withholding Certificate'},
        'LA': {'form': 'L-4', 'name': 'Louisiana Employee Withholding Exemption Certificate'},
        'ME': {'form': 'W-4ME', 'name': 'Maine Employee Withholding Allowance Certificate'},
        'MD': {'form': 'MW507', 'name': 'Maryland Employee Withholding Exemption Certificate'},
        'MA': {'form': 'M-4', 'name': 'Massachusetts Employee Withholding Exemption Certificate'},
        'MI': {'form': 'MI-W4', 'name': 'Michigan Employee Withholding Exemption Certificate'},
        'MN': {'form': 'W-4MN', 'name': 'Minnesota Employee Withholding Allowance Certificate'},
        'MS': {'form': '89-350', 'name': 'Mississippi Employee Withholding Exemption Certificate'},
        'MO': {'form': 'MO W-4', 'name': 'Missouri Employee Withholding Allowance Certificate'},
        'MT': {'form': 'MW-4', 'name': 'Montana Employee Withholding Allowance Certificate'},
        'NE': {'form': 'W-4N', 'name': 'Nebraska Employee Withholding Allowance Certificate'},
        'NV': {'form': None, 'name': 'No state income tax'},
        'NH': {'form': None, 'name': 'No state income tax on wages'},
        'NJ': {'form': 'NJ-W4', 'name': 'New Jersey Employee Withholding Allowance Certificate'},
        'NM': {'form': 'W-4', 'name': 'Uses Federal W-4'},
        'NY': {'form': 'IT-2104', 'name': 'New York Employee Withholding Allowance Certificate'},
        'NC': {'form': 'NC-4', 'name': 'North Carolina Employee Withholding Allowance Certificate'},
        'ND': {'form': 'W-4', 'name': 'Uses Federal W-4'},
        'OH': {'form': 'IT 4', 'name': 'Ohio Employee Withholding Exemption Certificate'},
        'OK': {'form': 'OK-W-4', 'name': 'Oklahoma Employee Withholding Allowance Certificate'},
        'OR': {'form': 'OR-W-4', 'name': 'Oregon Employee Withholding Certificate'},
        'PA': {'form': 'REV-419', 'name': 'Pennsylvania Employee Nonwithholding Application'},
        'RI': {'form': 'RI W-4', 'name': 'Rhode Island Employee Withholding Allowance Certificate'},
        'SC': {'form': 'SC W-4', 'name': 'South Carolina Employee Withholding Allowance Certificate'},
        'SD': {'form': None, 'name': 'No state income tax'},
        'TN': {'form': None, 'name': 'No state income tax on wages'},
        'TX': {'form': None, 'name': 'No state income tax'},
        'UT': {'form': 'W-4', 'name': 'Uses Federal W-4'},
        'VT': {'form': 'W-4VT', 'name': 'Vermont Employee Withholding Allowance Certificate'},
        'VA': {'form': 'VA-4', 'name': 'Virginia Employee Withholding Exemption Certificate'},
        'WA': {'form': None, 'name': 'No state income tax'},
        'WV': {'form': 'WV/IT-104', 'name': 'West Virginia Employee Withholding Exemption Certificate'},
        'WI': {'form': 'WT-4', 'name': 'Wisconsin Employee Withholding Agreement'},
        'WY': {'form': None, 'name': 'No state income tax'}
    }
    
    def __init__(self):
        self.onboardings = {}
    
    # =========================================================================
    # STEP 1: PERSONAL INFORMATION
    # =========================================================================
    
    def validate_ssn(self, ssn: str) -> Tuple[bool, str]:
        """Validate Social Security Number format."""
        ssn_clean = ssn.replace('-', '').replace(' ', '')
        
        if len(ssn_clean) != 9:
            return False, 'SSN must be 9 digits'
        
        if not ssn_clean.isdigit():
            return False, 'SSN must contain only numbers'
        
        # Invalid SSN patterns
        if ssn_clean.startswith('000') or ssn_clean.startswith('666'):
            return False, 'Invalid SSN'
        if ssn_clean.startswith('9'):  # Reserved for ITINs
            return False, 'Invalid SSN (appears to be ITIN)'
        if ssn_clean[3:5] == '00':
            return False, 'Invalid SSN'
        if ssn_clean[5:] == '0000':
            return False, 'Invalid SSN'
        
        return True, 'Valid'
    
    def validate_personal_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate personal information."""
        errors = []
        
        required = ['legal_first_name', 'legal_last_name', 'ssn', 'date_of_birth', 
                   'personal_email', 'residence_address', 'residence_city', 
                   'residence_state', 'residence_zip']
        
        for field in required:
            if not data.get(field):
                errors.append(f'{field.replace("_", " ").title()} is required')
        
        # Validate SSN
        if data.get('ssn'):
            valid, msg = self.validate_ssn(data['ssn'])
            if not valid:
                errors.append(msg)
        
        # Validate date of birth
        if data.get('date_of_birth'):
            try:
                dob = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
                age = (date.today() - dob).days / 365.25
                if age < 14:
                    errors.append('Employee must be at least 14 years old')
                if age > 100:
                    errors.append('Invalid date of birth')
            except ValueError:
                errors.append('Invalid date of birth format (use YYYY-MM-DD)')
        
        # Validate state
        if data.get('residence_state') and len(data['residence_state']) != 2:
            errors.append('State must be 2-letter code')
        
        # Validate email
        if data.get('personal_email'):
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['personal_email']):
                errors.append('Invalid email format')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 2: EMPLOYMENT DETAILS
    # =========================================================================
    
    def validate_employment_info(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate employment information."""
        errors = []
        
        required = ['hire_date', 'job_title', 'employment_type', 'flsa_classification',
                   'pay_type', 'pay_rate']
        
        for field in required:
            if not data.get(field):
                errors.append(f'{field.replace("_", " ").title()} is required')
        
        # Validate employment type
        valid_types = ['full_time', 'part_time', 'temporary', 'seasonal']
        if data.get('employment_type') and data['employment_type'] not in valid_types:
            errors.append('Invalid employment type')
        
        # Validate FLSA classification
        valid_flsa = ['exempt', 'non_exempt']
        if data.get('flsa_classification') and data['flsa_classification'] not in valid_flsa:
            errors.append('FLSA classification must be exempt or non_exempt')
        
        # Validate pay type
        valid_pay_types = ['hourly', 'salary']
        if data.get('pay_type') and data['pay_type'] not in valid_pay_types:
            errors.append('Pay type must be hourly or salary')
        
        # Validate pay rate
        if data.get('pay_rate'):
            try:
                rate = float(data['pay_rate'])
                if rate <= 0:
                    errors.append('Pay rate must be greater than 0')
                # Minimum wage check (federal minimum)
                if data.get('pay_type') == 'hourly' and rate < 7.25:
                    errors.append('Pay rate below federal minimum wage ($7.25/hour)')
            except ValueError:
                errors.append('Invalid pay rate')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 3: FORM W-4 (2020+)
    # =========================================================================
    
    def validate_w4(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate Form W-4 (2020 or later version)."""
        errors = []
        
        # Required: Filing status
        if not data.get('w4_filing_status'):
            errors.append('Filing status is required')
        elif data['w4_filing_status'] not in self.W4_FILING_STATUSES:
            errors.append('Invalid filing status')
        
        # Step 2(c): Multiple jobs checkbox
        # Optional - no validation needed
        
        # Step 3: Claim dependents (must be positive or zero)
        if data.get('w4_dependents_amount'):
            try:
                amount = float(data['w4_dependents_amount'])
                if amount < 0:
                    errors.append('Dependents amount cannot be negative')
            except ValueError:
                errors.append('Invalid dependents amount')
        
        # Step 4(a): Other income
        if data.get('w4_other_income'):
            try:
                amount = float(data['w4_other_income'])
                if amount < 0:
                    errors.append('Other income cannot be negative')
            except ValueError:
                errors.append('Invalid other income amount')
        
        # Step 4(b): Deductions
        if data.get('w4_deductions'):
            try:
                amount = float(data['w4_deductions'])
                if amount < 0:
                    errors.append('Deductions cannot be negative')
            except ValueError:
                errors.append('Invalid deductions amount')
        
        # Step 4(c): Extra withholding
        if data.get('w4_extra_withholding'):
            try:
                amount = float(data['w4_extra_withholding'])
                if amount < 0:
                    errors.append('Extra withholding cannot be negative')
            except ValueError:
                errors.append('Invalid extra withholding amount')
        
        # Signature required
        if not data.get('w4_signature'):
            errors.append('Digital signature is required')
        
        return len(errors) == 0, errors
    
    def calculate_w4_withholding_parameters(self, w4_data: Dict) -> Dict:
        """Calculate withholding parameters from W-4 data."""
        filing_status = w4_data.get('w4_filing_status', 'single')
        
        # Standard deduction amounts (2024)
        standard_deductions = {
            'single': 14600,
            'married_filing_jointly': 29200,
            'head_of_household': 21900
        }
        
        # Calculate adjusted annual wage
        adjustments = {
            'filing_status': filing_status,
            'standard_deduction': standard_deductions.get(filing_status, 14600),
            'multiple_jobs': w4_data.get('w4_multiple_jobs', False),
            'dependents_credit': float(w4_data.get('w4_dependents_amount', 0)),
            'other_income': float(w4_data.get('w4_other_income', 0)),
            'deductions': float(w4_data.get('w4_deductions', 0)),
            'extra_withholding': float(w4_data.get('w4_extra_withholding', 0)),
            'exempt': w4_data.get('w4_exempt', False)
        }
        
        return adjustments
    
    # =========================================================================
    # STEP 4: STATE TAX FORMS
    # =========================================================================
    
    def get_required_state_forms(self, work_state: str, residence_state: str) -> List[Dict]:
        """Get required state tax forms based on work and residence states."""
        forms = []
        
        # Work state form
        work_form = self.STATE_TAX_FORMS.get(work_state.upper())
        if work_form and work_form['form']:
            forms.append({
                'state': work_state.upper(),
                'form': work_form['form'],
                'name': work_form['name'],
                'type': 'work_state',
                'required': True
            })
        
        # Residence state form (if different)
        if residence_state.upper() != work_state.upper():
            res_form = self.STATE_TAX_FORMS.get(residence_state.upper())
            if res_form and res_form['form']:
                forms.append({
                    'state': residence_state.upper(),
                    'form': res_form['form'],
                    'name': res_form['name'],
                    'type': 'residence_state',
                    'required': True
                })
        
        return forms
    
    def validate_state_tax_form(self, state: str, data: Dict) -> Tuple[bool, List[str]]:
        """Validate state tax form data."""
        errors = []
        state_info = self.STATE_TAX_FORMS.get(state.upper())
        
        if not state_info or not state_info['form']:
            return True, []  # No state tax form required
        
        # Basic validation - signature required
        if not data.get('signature'):
            errors.append(f'{state} state tax form signature is required')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 5: FORM I-9
    # =========================================================================
    
    def validate_i9_section1(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate I-9 Section 1 (Employee)."""
        errors = []
        
        # Citizenship status required
        if not data.get('citizenship_status'):
            errors.append('Citizenship/immigration status is required')
        elif data['citizenship_status'] not in self.I9_CITIZENSHIP_STATUS:
            errors.append('Invalid citizenship status')
        
        # If alien authorized, need additional info
        if data.get('citizenship_status') == 'alien_authorized':
            if not data.get('work_authorization_expiration'):
                errors.append('Work authorization expiration date is required')
            else:
                try:
                    exp_date = datetime.strptime(data['work_authorization_expiration'], '%Y-%m-%d').date()
                    if exp_date < date.today():
                        errors.append('Work authorization has expired')
                except ValueError:
                    errors.append('Invalid expiration date format')
            
            # Need either alien number, I-94, or foreign passport
            has_valid_number = (
                data.get('alien_number') or 
                data.get('admission_number') or 
                (data.get('foreign_passport_number') and data.get('foreign_passport_country'))
            )
            if not has_valid_number:
                errors.append('Alien number, I-94 number, or foreign passport information is required')
        
        # If permanent resident, need alien number
        if data.get('citizenship_status') == 'permanent_resident':
            if not data.get('alien_number'):
                errors.append('Alien/USCIS number is required for permanent residents')
        
        # Signature required
        if not data.get('signature'):
            errors.append('Digital signature is required')
        
        return len(errors) == 0, errors
    
    def validate_i9_section2(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate I-9 Section 2 (Employer verification)."""
        errors = []
        
        # Document list selection
        if not data.get('document_list'):
            errors.append('Document list selection is required (A or B+C)')
        elif data['document_list'] not in ['A', 'B_C']:
            errors.append('Invalid document list selection')
        
        # Validate documents based on list
        if data.get('document_list') == 'A':
            if not data.get('list_a_document'):
                errors.append('List A document information is required')
            else:
                doc = data['list_a_document']
                if not doc.get('title'):
                    errors.append('Document title is required')
                if not doc.get('document_number'):
                    errors.append('Document number is required')
                if not doc.get('issuing_authority'):
                    errors.append('Issuing authority is required')
        
        elif data.get('document_list') == 'B_C':
            if not data.get('list_b_document'):
                errors.append('List B document information is required')
            if not data.get('list_c_document'):
                errors.append('List C document information is required')
        
        # Employer signature required
        if not data.get('employer_signature'):
            errors.append('Employer signature is required')
        if not data.get('employer_name'):
            errors.append('Employer name is required')
        if not data.get('employer_title'):
            errors.append('Employer title is required')
        
        return len(errors) == 0, errors
    
    def calculate_i9_retention_date(self, hire_date: date, termination_date: Optional[date] = None) -> date:
        """Calculate I-9 retention date per federal requirements."""
        # I-9: 3 years from hire OR 1 year from termination, whichever is later
        three_years_from_hire = hire_date + timedelta(days=3*365)
        
        if termination_date:
            one_year_from_term = termination_date + timedelta(days=365)
            return max(three_years_from_hire, one_year_from_term)
        
        return three_years_from_hire
    
    # =========================================================================
    # STEP 6: DIRECT DEPOSIT
    # =========================================================================
    
    def validate_direct_deposit(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate direct deposit information."""
        errors = []
        
        accounts = data.get('accounts', [])
        if not accounts:
            errors.append('At least one bank account is required for direct deposit')
            return False, errors
        
        total_percent = 0
        has_remainder = False
        
        for i, account in enumerate(accounts):
            # Bank name
            if not account.get('bank_name'):
                errors.append(f'Account {i+1}: Bank name is required')
            
            # Routing number
            if not account.get('routing_number'):
                errors.append(f'Account {i+1}: Routing number is required')
            else:
                routing = account['routing_number'].replace(' ', '').replace('-', '')
                if len(routing) != 9 or not routing.isdigit():
                    errors.append(f'Account {i+1}: Invalid routing number')
            
            # Account number
            if not account.get('account_number'):
                errors.append(f'Account {i+1}: Account number is required')
            
            # Account type
            if account.get('account_type') not in ['checking', 'savings']:
                errors.append(f'Account {i+1}: Account type must be checking or savings')
            
            # Amount allocation
            if account.get('amount_type') == 'percent':
                try:
                    pct = float(account.get('amount', 0))
                    if pct <= 0 or pct > 100:
                        errors.append(f'Account {i+1}: Percentage must be between 0 and 100')
                    total_percent += pct
                except ValueError:
                    errors.append(f'Account {i+1}: Invalid percentage')
            elif account.get('amount_type') == 'fixed':
                try:
                    amt = float(account.get('amount', 0))
                    if amt < 0:
                        errors.append(f'Account {i+1}: Fixed amount cannot be negative')
                except ValueError:
                    errors.append(f'Account {i+1}: Invalid fixed amount')
            elif account.get('amount_type') == 'remainder':
                if has_remainder:
                    errors.append('Only one account can receive the remainder')
                has_remainder = True
        
        # Validate total allocation
        if not has_remainder and abs(total_percent - 100) > 0.01:
            errors.append('Direct deposit allocations must total 100% or include a remainder account')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 7: BENEFITS ENROLLMENT
    # =========================================================================
    
    def validate_benefits_enrollment(self, data: Dict, available_plans: Dict) -> Tuple[bool, List[str]]:
        """Validate benefits enrollment selections."""
        errors = []
        
        # Medical
        if data.get('medical_plan_id'):
            if data['medical_plan_id'] not in available_plans.get('medical', []):
                errors.append('Invalid medical plan selection')
            if not data.get('medical_coverage_level'):
                errors.append('Medical coverage level is required')
        
        # Dental
        if data.get('dental_plan_id'):
            if data['dental_plan_id'] not in available_plans.get('dental', []):
                errors.append('Invalid dental plan selection')
        
        # Vision
        if data.get('vision_plan_id'):
            if data['vision_plan_id'] not in available_plans.get('vision', []):
                errors.append('Invalid vision plan selection')
        
        # 401(k)
        if data.get('retirement_enrolled'):
            deferral = data.get('retirement_deferral_percent', 0)
            try:
                deferral = float(deferral)
                if deferral < 0 or deferral > 100:
                    errors.append('401(k) deferral must be between 0% and 100%')
                # IRS limits (2024: $23,000 elective deferral limit)
                if deferral > 75:  # Most plans cap at 75%
                    errors.append('401(k) deferral exceeds plan maximum')
            except ValueError:
                errors.append('Invalid 401(k) deferral percentage')
        
        # HSA (only if enrolled in HDHP)
        if data.get('hsa_election') and data.get('hsa_election') > 0:
            if not data.get('medical_plan_hdhp'):
                errors.append('HSA requires enrollment in a High Deductible Health Plan')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # STEP 8: POLICY ACKNOWLEDGMENTS
    # =========================================================================
    
    def get_required_acknowledgments(self, company_id: str) -> List[Dict]:
        """Get list of required policy acknowledgments."""
        return [
            {'id': 'employee_handbook', 'name': 'Employee Handbook', 'required': True},
            {'id': 'code_of_conduct', 'name': 'Code of Conduct', 'required': True},
            {'id': 'safety_policy', 'name': 'Safety Policy', 'required': True},
            {'id': 'anti_harassment', 'name': 'Anti-Harassment Policy', 'required': True},
            {'id': 'technology_use', 'name': 'Technology Use Policy', 'required': True},
            {'id': 'arbitration', 'name': 'Arbitration Agreement', 'required': False},
            {'id': 'nda', 'name': 'Non-Disclosure Agreement', 'required': False}
        ]
    
    def validate_acknowledgments(self, data: Dict, required_policies: List[Dict]) -> Tuple[bool, List[str]]:
        """Validate policy acknowledgments."""
        errors = []
        
        for policy in required_policies:
            if policy['required']:
                ack = data.get('acknowledgments', {}).get(policy['id'])
                if not ack or not ack.get('acknowledged'):
                    errors.append(f'{policy["name"]} acknowledgment is required')
                elif not ack.get('signature'):
                    errors.append(f'{policy["name"]} signature is required')
        
        return len(errors) == 0, errors
    
    # =========================================================================
    # COMPLETE ONBOARDING WORKFLOW
    # =========================================================================
    
    def create_onboarding(self, company_id: str, employee_data: Dict) -> Dict:
        """Create new employee onboarding."""
        onboarding_id = str(uuid.uuid4())
        
        # Determine required steps based on company and employee
        work_state = employee_data.get('work_state', '')
        residence_state = employee_data.get('residence_state', '')
        
        onboarding = {
            'id': onboarding_id,
            'company_id': company_id,
            'status': 'not_started',
            'current_step': 1,
            'total_steps': 8,
            'steps': {
                1: {'name': 'Personal Information', 'status': 'pending', 'data': {}},
                2: {'name': 'Employment Details', 'status': 'pending', 'data': {}},
                3: {'name': 'Federal W-4', 'status': 'pending', 'data': {}},
                4: {'name': 'State Tax Forms', 'status': 'pending', 'data': {}, 
                    'required_forms': self.get_required_state_forms(work_state, residence_state)},
                5: {'name': 'I-9 Section 1', 'status': 'pending', 'data': {}},
                6: {'name': 'Direct Deposit', 'status': 'pending', 'data': {}},
                7: {'name': 'Benefits Enrollment', 'status': 'pending', 'data': {}},
                8: {'name': 'Policy Acknowledgments', 'status': 'pending', 'data': {}}
            },
            'i9_section2': {'status': 'pending', 'data': {}},  # Completed by employer
            'checklist': {
                'personal_info': False,
                'employment_details': False,
                'w4_completed': False,
                'state_forms_completed': False,
                'i9_section1': False,
                'i9_section2': False,
                'direct_deposit': False,
                'benefits_enrollment': False,
                'policy_acknowledgments': False,
                'manager_approved': False
            },
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        self.onboardings[onboarding_id] = onboarding
        return onboarding
    
    def submit_step(self, onboarding_id: str, step: int, data: Dict) -> Dict:
        """Submit data for an onboarding step."""
        onboarding = self.onboardings.get(onboarding_id)
        if not onboarding:
            return {'success': False, 'error': 'Onboarding not found'}
        
        # Validators by step
        validators = {
            1: self.validate_personal_info,
            2: self.validate_employment_info,
            3: self.validate_w4,
            4: lambda d: self.validate_state_tax_form(d.get('state', ''), d),
            5: self.validate_i9_section1,
            6: self.validate_direct_deposit,
            7: lambda d: self.validate_benefits_enrollment(d, d.get('available_plans', {})),
            8: lambda d: self.validate_acknowledgments(d, self.get_required_acknowledgments(onboarding['company_id']))
        }
        
        validator = validators.get(step)
        if validator:
            valid, errors = validator(data)
            if not valid:
                return {'success': False, 'errors': errors}
        
        # Encrypt sensitive data
        if step == 1 and data.get('ssn'):
            data['ssn_encrypted'] = cipher_suite.encrypt(data['ssn'].encode()).decode()
            data['ssn_last_four'] = data['ssn'][-4:]
            del data['ssn']
        
        if step == 6 and data.get('accounts'):
            for account in data['accounts']:
                if account.get('account_number'):
                    account['account_encrypted'] = cipher_suite.encrypt(account['account_number'].encode()).decode()
                    del account['account_number']
        
        # Save step data
        onboarding['steps'][step]['data'] = data
        onboarding['steps'][step]['status'] = 'complete'
        onboarding['steps'][step]['completed_at'] = datetime.utcnow().isoformat()
        
        # Update checklist
        checklist_mapping = {
            1: 'personal_info',
            2: 'employment_details',
            3: 'w4_completed',
            4: 'state_forms_completed',
            5: 'i9_section1',
            6: 'direct_deposit',
            7: 'benefits_enrollment',
            8: 'policy_acknowledgments'
        }
        if step in checklist_mapping:
            onboarding['checklist'][checklist_mapping[step]] = True
        
        # Move to next step
        if step < onboarding['total_steps']:
            onboarding['current_step'] = step + 1
            onboarding['status'] = 'in_progress'
        else:
            onboarding['status'] = 'pending_review'
        
        onboarding['updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'onboarding': onboarding,
            'next_step': onboarding['current_step'] if onboarding['status'] == 'in_progress' else None
        }
    
    def complete_i9_section2(self, onboarding_id: str, data: Dict, employer_user_id: str) -> Dict:
        """Complete I-9 Section 2 (employer verification)."""
        onboarding = self.onboardings.get(onboarding_id)
        if not onboarding:
            return {'success': False, 'error': 'Onboarding not found'}
        
        # Validate Section 2
        valid, errors = self.validate_i9_section2(data)
        if not valid:
            return {'success': False, 'errors': errors}
        
        # Save Section 2 data
        onboarding['i9_section2'] = {
            'status': 'complete',
            'data': data,
            'completed_by': employer_user_id,
            'completed_at': datetime.utcnow().isoformat()
        }
        onboarding['checklist']['i9_section2'] = True
        onboarding['updated_at'] = datetime.utcnow().isoformat()
        
        return {'success': True, 'onboarding': onboarding}
    
    def approve_onboarding(self, onboarding_id: str, approver_id: str) -> Dict:
        """Approve completed onboarding."""
        onboarding = self.onboardings.get(onboarding_id)
        if not onboarding:
            return {'success': False, 'error': 'Onboarding not found'}
        
        # Check all required items complete
        checklist = onboarding['checklist']
        required = ['personal_info', 'employment_details', 'w4_completed', 'i9_section1', 
                   'i9_section2', 'direct_deposit', 'policy_acknowledgments']
        
        incomplete = [item for item in required if not checklist.get(item)]
        if incomplete:
            return {'success': False, 'error': f'Incomplete items: {", ".join(incomplete)}'}
        
        onboarding['status'] = 'complete'
        onboarding['checklist']['manager_approved'] = True
        onboarding['approved_by'] = approver_id
        onboarding['approved_at'] = datetime.utcnow().isoformat()
        onboarding['updated_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'onboarding': onboarding,
            'message': 'Employee onboarding complete. Employee is ready for payroll.'
        }


# Singleton instance
employee_onboarding_service = EmployeeOnboardingService()
