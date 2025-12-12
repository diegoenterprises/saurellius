"""
GOVERNMENT FORMS SERVICE
Automated generation of W-2, 1099-NEC, 941, 940, and state forms
Electronic filing support (SSA BSO, IRS FIRE)
"""

from datetime import datetime, date
from typing import Dict, List, Optional
import uuid


class GovernmentFormsService:
    """
    Automated government form generation and filing.
    Supports federal and state payroll tax forms.
    """
    
    # Form types
    FORM_W2 = 'W-2'
    FORM_W3 = 'W-3'
    FORM_1099_NEC = '1099-NEC'
    FORM_1096 = '1096'
    FORM_941 = '941'
    FORM_944 = '944'
    FORM_940 = '940'
    
    # Filing deadlines (month-day)
    DEADLINES = {
        'W-2_employee': (1, 31),      # Jan 31 - to employees
        'W-2_ssa': (1, 31),           # Jan 31 - to SSA
        'W-3': (1, 31),               # Jan 31 - with W-2s
        '1099-NEC_recipient': (1, 31), # Jan 31 - to recipients
        '1099-NEC_irs': (1, 31),      # Jan 31 - to IRS
        '941_q1': (4, 30),            # Q1 - April 30
        '941_q2': (7, 31),            # Q2 - July 31
        '941_q3': (10, 31),           # Q3 - October 31
        '941_q4': (1, 31),            # Q4 - January 31 (next year)
        '940': (1, 31),               # Jan 31
    }
    
    def __init__(self):
        self.forms = {}
    
    # ==========================================================================
    # FORM W-2 GENERATION
    # ==========================================================================
    
    def generate_w2(
        self,
        company: Dict,
        employee: Dict,
        ytd_data: Dict,
        tax_year: int
    ) -> Dict:
        """Generate Form W-2 for an employee."""
        form_id = str(uuid.uuid4())
        
        # W-2 Box calculations
        w2_data = {
            'form_type': self.FORM_W2,
            'tax_year': tax_year,
            
            # Control number (a)
            'control_number': form_id[:8].upper(),
            
            # Employer information (b, c)
            'employer_ein': company['ein'],
            'employer_name': company['legal_name'],
            'employer_address': company['physical_address'],
            'employer_city_state_zip': f"{company['physical_city']}, {company['physical_state']} {company['physical_zip']}",
            
            # Employee information (d, e, f)
            'employee_ssn': employee.get('ssn_last_four', 'XXXX'),  # Full SSN needed for actual filing
            'employee_name': f"{employee['first_name']} {employee.get('middle_name', '')} {employee['last_name']}".strip(),
            'employee_address': employee.get('residence_address', ''),
            'employee_city_state_zip': f"{employee.get('residence_city', '')}, {employee.get('residence_state', '')} {employee.get('residence_zip', '')}",
            
            # Box 1: Wages, tips, other compensation
            'box_1_wages': round(ytd_data.get('federal_taxable_wages', ytd_data.get('ytd_gross', 0)), 2),
            
            # Box 2: Federal income tax withheld
            'box_2_federal_tax': round(ytd_data.get('ytd_federal_tax', 0), 2),
            
            # Box 3: Social security wages
            'box_3_ss_wages': round(ytd_data.get('ytd_ss_wages', 0), 2),
            
            # Box 4: Social security tax withheld
            'box_4_ss_tax': round(ytd_data.get('ytd_social_security', 0), 2),
            
            # Box 5: Medicare wages and tips
            'box_5_medicare_wages': round(ytd_data.get('ytd_medicare_wages', ytd_data.get('ytd_gross', 0)), 2),
            
            # Box 6: Medicare tax withheld
            'box_6_medicare_tax': round(ytd_data.get('ytd_medicare', 0), 2),
            
            # Box 7: Social security tips
            'box_7_ss_tips': round(ytd_data.get('ytd_tips', 0), 2),
            
            # Box 8: Allocated tips
            'box_8_allocated_tips': 0,
            
            # Box 10: Dependent care benefits
            'box_10_dependent_care': round(ytd_data.get('ytd_dependent_care_fsa', 0), 2),
            
            # Box 11: Nonqualified plans
            'box_11_nonqualified': 0,
            
            # Box 12: Various codes (a-d)
            'box_12': self._calculate_box_12(ytd_data),
            
            # Box 13: Checkboxes
            'box_13_statutory': employee.get('is_statutory_employee', False),
            'box_13_retirement': ytd_data.get('retirement_plan_participant', False),
            'box_13_third_party_sick': False,
            
            # Box 14: Other
            'box_14_other': self._calculate_box_14(ytd_data),
            
            # State/Local (Boxes 15-20)
            'state_data': self._calculate_state_local_boxes(ytd_data, employee)
        }
        
        form_record = {
            'id': form_id,
            'form_type': self.FORM_W2,
            'tax_year': tax_year,
            'company_id': company.get('id'),
            'employee_id': employee.get('id'),
            'data': w2_data,
            'status': 'generated',
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.forms[form_id] = form_record
        return form_record
    
    def _calculate_box_12(self, ytd_data: Dict) -> List[Dict]:
        """Calculate Box 12 coded amounts."""
        box_12 = []
        
        # Code D: 401(k) elective deferrals
        if ytd_data.get('ytd_401k', 0) > 0:
            box_12.append({'code': 'D', 'amount': round(ytd_data['ytd_401k'], 2)})
        
        # Code DD: Health coverage cost (employer-sponsored)
        if ytd_data.get('ytd_health_coverage_cost', 0) > 0:
            box_12.append({'code': 'DD', 'amount': round(ytd_data['ytd_health_coverage_cost'], 2)})
        
        # Code W: HSA employer contributions
        if ytd_data.get('ytd_hsa_employer', 0) > 0:
            box_12.append({'code': 'W', 'amount': round(ytd_data['ytd_hsa_employer'], 2)})
        
        # Code AA: Roth 401(k) contributions
        if ytd_data.get('ytd_roth_401k', 0) > 0:
            box_12.append({'code': 'AA', 'amount': round(ytd_data['ytd_roth_401k'], 2)})
        
        # Code C: Group-term life insurance over $50,000
        if ytd_data.get('ytd_gtl_excess', 0) > 0:
            box_12.append({'code': 'C', 'amount': round(ytd_data['ytd_gtl_excess'], 2)})
        
        return box_12
    
    def _calculate_box_14(self, ytd_data: Dict) -> List[Dict]:
        """Calculate Box 14 other items."""
        box_14 = []
        
        # Union dues
        if ytd_data.get('ytd_union_dues', 0) > 0:
            box_14.append({'description': 'Union Dues', 'amount': round(ytd_data['ytd_union_dues'], 2)})
        
        # State disability insurance (employee)
        if ytd_data.get('ytd_sdi', 0) > 0:
            box_14.append({'description': 'SDI', 'amount': round(ytd_data['ytd_sdi'], 2)})
        
        # State paid family leave
        if ytd_data.get('ytd_pfml', 0) > 0:
            box_14.append({'description': 'PFML', 'amount': round(ytd_data['ytd_pfml'], 2)})
        
        return box_14
    
    def _calculate_state_local_boxes(self, ytd_data: Dict, employee: Dict) -> List[Dict]:
        """Calculate state and local tax information (Boxes 15-20)."""
        state_data = []
        
        # Primary state
        work_state = employee.get('work_state', '')
        if work_state and ytd_data.get('ytd_state_tax', {}).get(work_state, 0) > 0:
            state_data.append({
                'state': work_state,
                'state_ein': employee.get('company_state_ein', ''),
                'state_wages': round(ytd_data.get('state_taxable_wages', {}).get(work_state, ytd_data.get('ytd_gross', 0)), 2),
                'state_tax': round(ytd_data.get('ytd_state_tax', {}).get(work_state, 0), 2),
                'local_wages': round(ytd_data.get('local_taxable_wages', {}).get(work_state, 0), 2),
                'local_tax': round(ytd_data.get('ytd_local_tax', {}).get(work_state, 0), 2),
                'locality_name': ytd_data.get('locality_name', '')
            })
        
        return state_data
    
    # ==========================================================================
    # FORM W-3 GENERATION (Transmittal)
    # ==========================================================================
    
    def generate_w3(self, company: Dict, w2_forms: List[Dict], tax_year: int) -> Dict:
        """Generate Form W-3 (Transmittal of Wage and Tax Statements)."""
        form_id = str(uuid.uuid4())
        
        # Sum all W-2 amounts
        totals = {
            'box_1': sum(f['data']['box_1_wages'] for f in w2_forms),
            'box_2': sum(f['data']['box_2_federal_tax'] for f in w2_forms),
            'box_3': sum(f['data']['box_3_ss_wages'] for f in w2_forms),
            'box_4': sum(f['data']['box_4_ss_tax'] for f in w2_forms),
            'box_5': sum(f['data']['box_5_medicare_wages'] for f in w2_forms),
            'box_6': sum(f['data']['box_6_medicare_tax'] for f in w2_forms),
            'box_7': sum(f['data']['box_7_ss_tips'] for f in w2_forms),
            'box_10': sum(f['data']['box_10_dependent_care'] for f in w2_forms),
        }
        
        w3_data = {
            'form_type': self.FORM_W3,
            'tax_year': tax_year,
            'control_number': form_id[:8].upper(),
            'kind_of_payer': '941',  # Regular 941 filer
            'kind_of_employer': 'None apply',
            'number_of_w2s': len(w2_forms),
            'employer_ein': company['ein'],
            'employer_name': company['legal_name'],
            'employer_address': company['physical_address'],
            'employer_city_state_zip': f"{company['physical_city']}, {company['physical_state']} {company['physical_zip']}",
            'totals': {k: round(v, 2) for k, v in totals.items()}
        }
        
        form_record = {
            'id': form_id,
            'form_type': self.FORM_W3,
            'tax_year': tax_year,
            'company_id': company.get('id'),
            'data': w3_data,
            'w2_form_ids': [f['id'] for f in w2_forms],
            'status': 'generated',
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.forms[form_id] = form_record
        return form_record
    
    # ==========================================================================
    # FORM 1099-NEC GENERATION
    # ==========================================================================
    
    def generate_1099_nec(
        self,
        company: Dict,
        contractor: Dict,
        total_payments: float,
        tax_year: int
    ) -> Dict:
        """Generate Form 1099-NEC for contractor."""
        form_id = str(uuid.uuid4())
        
        # Only generate if payments >= $600
        if total_payments < 600:
            return {
                'error': 'Payments below $600 threshold',
                'total_payments': total_payments
            }
        
        nec_data = {
            'form_type': self.FORM_1099_NEC,
            'tax_year': tax_year,
            
            # Payer information
            'payer_name': company['legal_name'],
            'payer_address': company['physical_address'],
            'payer_city_state_zip': f"{company['physical_city']}, {company['physical_state']} {company['physical_zip']}",
            'payer_tin': company['ein'],
            'payer_phone': company.get('primary_phone', ''),
            
            # Recipient information
            'recipient_tin': contractor.get('tin_last_four', 'XXXX'),
            'recipient_name': contractor.get('w9_name', ''),
            'recipient_address': contractor.get('w9_address', ''),
            'recipient_city_state_zip': f"{contractor.get('w9_city', '')}, {contractor.get('w9_state', '')} {contractor.get('w9_zip', '')}",
            
            # Account number (optional)
            'account_number': contractor.get('id', ''),
            
            # Box 1: Nonemployee compensation
            'box_1_compensation': round(total_payments, 2),
            
            # Box 4: Federal income tax withheld (backup withholding)
            'box_4_federal_withheld': round(contractor.get('backup_withholding_amount', 0), 2),
            
            # State information
            'state_data': []
        }
        
        form_record = {
            'id': form_id,
            'form_type': self.FORM_1099_NEC,
            'tax_year': tax_year,
            'company_id': company.get('id'),
            'contractor_id': contractor.get('id'),
            'data': nec_data,
            'status': 'generated',
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.forms[form_id] = form_record
        return form_record
    
    # ==========================================================================
    # FORM 941 GENERATION (Quarterly)
    # ==========================================================================
    
    def generate_941(
        self,
        company: Dict,
        quarter: int,
        tax_year: int,
        payroll_data: Dict
    ) -> Dict:
        """Generate Form 941 (Quarterly Federal Tax Return)."""
        form_id = str(uuid.uuid4())
        
        # Quarter dates
        quarter_dates = {
            1: ('January 1', 'March 31'),
            2: ('April 1', 'June 30'),
            3: ('July 1', 'September 30'),
            4: ('October 1', 'December 31')
        }
        
        # Calculate totals from payroll data
        total_wages = payroll_data.get('total_wages', 0)
        federal_tax_withheld = payroll_data.get('federal_tax_withheld', 0)
        ss_wages = payroll_data.get('ss_wages', 0)
        medicare_wages = payroll_data.get('medicare_wages', 0)
        ss_tips = payroll_data.get('ss_tips', 0)
        
        # Calculate taxes
        ss_tax = round(ss_wages * 0.124, 2)  # 6.2% x 2
        medicare_tax = round(medicare_wages * 0.029, 2)  # 1.45% x 2
        additional_medicare = payroll_data.get('additional_medicare', 0)
        
        total_tax = federal_tax_withheld + ss_tax + medicare_tax + additional_medicare
        
        form_941_data = {
            'form_type': self.FORM_941,
            'tax_year': tax_year,
            'quarter': quarter,
            'quarter_start': quarter_dates[quarter][0],
            'quarter_end': quarter_dates[quarter][1],
            
            # Employer information
            'employer_ein': company['ein'],
            'employer_name': company['legal_name'],
            'employer_address': company['physical_address'],
            
            # Part 1 - Lines 1-15
            'line_1_employees': payroll_data.get('employee_count', 0),
            'line_2_wages': round(total_wages, 2),
            'line_3_federal_tax': round(federal_tax_withheld, 2),
            'line_5a_ss_wages': round(ss_wages, 2),
            'line_5a_ss_tax': round(ss_tax, 2),
            'line_5b_ss_tips': round(ss_tips, 2),
            'line_5c_medicare_wages': round(medicare_wages, 2),
            'line_5c_medicare_tax': round(medicare_tax, 2),
            'line_5d_additional_medicare': round(additional_medicare, 2),
            'line_6_total_ss_medicare': round(ss_tax + medicare_tax + additional_medicare, 2),
            'line_10_total_taxes': round(total_tax, 2),
            'line_11_qualified_sick_leave': payroll_data.get('qualified_sick_leave_credit', 0),
            'line_12_total_taxes_after_credits': round(total_tax - payroll_data.get('credits', 0), 2),
            'line_13_deposits': payroll_data.get('total_deposits', 0),
            'line_14_balance_due': 0,  # Calculate based on deposits
            
            # Part 2 - Deposit Schedule
            'deposit_schedule': payroll_data.get('deposit_schedule', 'semiweekly'),
            'monthly_deposits': payroll_data.get('monthly_deposits', {}),
            
            # Part 3 - Business information
            'business_closed': False,
            'seasonal_employer': False
        }
        
        form_record = {
            'id': form_id,
            'form_type': self.FORM_941,
            'tax_year': tax_year,
            'quarter': quarter,
            'company_id': company.get('id'),
            'data': form_941_data,
            'status': 'generated',
            'due_date': self._get_941_due_date(tax_year, quarter),
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.forms[form_id] = form_record
        return form_record
    
    def _get_941_due_date(self, year: int, quarter: int) -> str:
        """Get Form 941 due date."""
        due_dates = {
            1: f"{year}-04-30",
            2: f"{year}-07-31",
            3: f"{year}-10-31",
            4: f"{year + 1}-01-31"
        }
        return due_dates[quarter]
    
    # ==========================================================================
    # FORM 940 GENERATION (Annual FUTA)
    # ==========================================================================
    
    def generate_940(
        self,
        company: Dict,
        tax_year: int,
        annual_data: Dict
    ) -> Dict:
        """Generate Form 940 (Annual Federal Unemployment Tax Return)."""
        form_id = str(uuid.uuid4())
        
        total_payments = annual_data.get('total_payments', 0)
        exempt_payments = annual_data.get('exempt_payments', 0)
        payments_over_7000 = annual_data.get('payments_over_7000', 0)
        
        futa_wages = total_payments - exempt_payments - payments_over_7000
        futa_tax = round(futa_wages * 0.006, 2)  # 0.6% after credit
        
        form_940_data = {
            'form_type': self.FORM_940,
            'tax_year': tax_year,
            
            'employer_ein': company['ein'],
            'employer_name': company['legal_name'],
            'employer_address': company['physical_address'],
            
            # Part 1 - Multi-state
            'multi_state': annual_data.get('multi_state', False),
            'states_with_wages': annual_data.get('states', []),
            
            # Part 2 - FUTA tax calculation
            'line_3_total_payments': round(total_payments, 2),
            'line_4_exempt_payments': round(exempt_payments, 2),
            'line_5_payments_over_7000': round(payments_over_7000, 2),
            'line_7_futa_wages': round(futa_wages, 2),
            'line_8_futa_tax': round(futa_tax, 2),
            
            # Part 3 - Adjustments
            'line_9_adjustments': annual_data.get('adjustments', 0),
            'line_12_total_futa_tax': round(futa_tax + annual_data.get('adjustments', 0), 2),
            
            # Part 4 - Deposits
            'quarterly_deposits': annual_data.get('quarterly_deposits', {}),
            'line_13_total_deposits': annual_data.get('total_deposits', 0),
            
            # Part 5 - Third party designee
            'third_party_designee': None
        }
        
        form_record = {
            'id': form_id,
            'form_type': self.FORM_940,
            'tax_year': tax_year,
            'company_id': company.get('id'),
            'data': form_940_data,
            'status': 'generated',
            'due_date': f"{tax_year + 1}-01-31",
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.forms[form_id] = form_record
        return form_record
    
    # ==========================================================================
    # STATE QUARTERLY WAGE REPORTS
    # ==========================================================================
    
    def generate_state_quarterly_report(
        self,
        company: Dict,
        state: str,
        quarter: int,
        tax_year: int,
        employees: List[Dict]
    ) -> Dict:
        """Generate state quarterly wage report."""
        form_id = str(uuid.uuid4())
        
        # State form names
        state_forms = {
            'CA': 'DE 9',
            'NY': 'NYS-45',
            'TX': 'C-3',
            'FL': 'RT-6',
            'IL': 'UI-3/40',
            # Add more states...
        }
        
        form_name = state_forms.get(state, f'{state} Quarterly Report')
        
        # Calculate totals
        total_wages = sum(emp.get('quarterly_wages', 0) for emp in employees)
        taxable_wages = sum(min(emp.get('quarterly_wages', 0), emp.get('remaining_wage_base', 7000)) for emp in employees)
        
        report_data = {
            'form_name': form_name,
            'state': state,
            'quarter': quarter,
            'tax_year': tax_year,
            
            'employer_state_id': company.get('state_tax_registrations', {}).get(state, {}).get('state_ein', ''),
            'employer_sui_account': company.get('state_tax_registrations', {}).get(state, {}).get('sui_account', ''),
            
            'total_wages': round(total_wages, 2),
            'taxable_wages': round(taxable_wages, 2),
            'sui_rate': company.get('state_tax_registrations', {}).get(state, {}).get('sui_rate', 2.7),
            'sui_tax_due': round(taxable_wages * company.get('sui_rate', 0.027), 2),
            
            'employee_count': len(employees),
            'employees': [
                {
                    'ssn': emp.get('ssn_last_four', 'XXXX'),
                    'name': f"{emp.get('first_name', '')} {emp.get('last_name', '')}",
                    'wages': round(emp.get('quarterly_wages', 0), 2)
                }
                for emp in employees
            ]
        }
        
        form_record = {
            'id': form_id,
            'form_type': 'state_quarterly',
            'state': state,
            'quarter': quarter,
            'tax_year': tax_year,
            'company_id': company.get('id'),
            'data': report_data,
            'status': 'generated',
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.forms[form_id] = form_record
        return form_record
    
    # ==========================================================================
    # NEW HIRE REPORTING
    # ==========================================================================
    
    def generate_new_hire_report(
        self,
        company: Dict,
        employee: Dict,
        state: str
    ) -> Dict:
        """Generate new hire report for state."""
        form_id = str(uuid.uuid4())
        
        # Most states require within 20 days of hire
        hire_date = employee.get('hire_date')
        
        report_data = {
            'state': state,
            'employer_ein': company['ein'],
            'employer_name': company['legal_name'],
            'employer_address': company['physical_address'],
            'employer_city_state_zip': f"{company['physical_city']}, {company['physical_state']} {company['physical_zip']}",
            
            'employee_ssn': employee.get('ssn_last_four', 'XXXX'),
            'employee_first_name': employee.get('first_name', ''),
            'employee_last_name': employee.get('last_name', ''),
            'employee_address': employee.get('residence_address', ''),
            'employee_city_state_zip': f"{employee.get('residence_city', '')}, {employee.get('residence_state', '')} {employee.get('residence_zip', '')}",
            
            'hire_date': hire_date,
            'state_of_hire': state
        }
        
        form_record = {
            'id': form_id,
            'form_type': 'new_hire_report',
            'state': state,
            'company_id': company.get('id'),
            'employee_id': employee.get('id'),
            'data': report_data,
            'status': 'pending',
            'due_date': self._calculate_new_hire_due_date(hire_date, state),
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.forms[form_id] = form_record
        return form_record
    
    def _calculate_new_hire_due_date(self, hire_date: str, state: str) -> str:
        """Calculate new hire reporting due date."""
        # Most states: 20 days from hire
        # Some states have different deadlines
        state_deadlines = {
            'PA': 20,
            'OH': 20,
            'ID': 20,
            'CO': 20,
            # Add more as needed
        }
        
        days = state_deadlines.get(state, 20)
        
        if isinstance(hire_date, str):
            hire_dt = datetime.strptime(hire_date, '%Y-%m-%d').date()
        else:
            hire_dt = hire_date
        
        from datetime import timedelta
        due_date = hire_dt + timedelta(days=days)
        return due_date.isoformat()
    
    # ==========================================================================
    # FORM RETRIEVAL & MANAGEMENT
    # ==========================================================================
    
    def get_form(self, form_id: str) -> Optional[Dict]:
        """Get form by ID."""
        return self.forms.get(form_id)
    
    def get_company_forms(
        self,
        company_id: str,
        form_type: str = None,
        tax_year: int = None,
        status: str = None
    ) -> List[Dict]:
        """Get all forms for a company with optional filters."""
        results = []
        for form in self.forms.values():
            if form.get('company_id') != company_id:
                continue
            if form_type and form.get('form_type') != form_type:
                continue
            if tax_year and form.get('tax_year') != tax_year:
                continue
            if status and form.get('status') != status:
                continue
            results.append(form)
        return results
    
    def mark_as_filed(
        self,
        form_id: str,
        filing_method: str,
        confirmation_number: str = None
    ) -> Dict:
        """Mark form as filed."""
        form = self.forms.get(form_id)
        if not form:
            return {'error': 'Form not found'}
        
        form['status'] = 'filed'
        form['filed_at'] = datetime.utcnow().isoformat()
        form['filing_method'] = filing_method
        if confirmation_number:
            form['confirmation_number'] = confirmation_number
        
        return {'success': True, 'form': form}
    
    def get_upcoming_deadlines(self, company_id: str, days: int = 30) -> List[Dict]:
        """Get forms with upcoming deadlines."""
        upcoming = []
        today = date.today()
        
        for form in self.forms.values():
            if form.get('company_id') != company_id:
                continue
            if form.get('status') in ['filed', 'accepted']:
                continue
            
            due_date_str = form.get('due_date')
            if due_date_str:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
                days_until = (due_date - today).days
                if 0 <= days_until <= days:
                    upcoming.append({
                        'form_id': form['id'],
                        'form_type': form['form_type'],
                        'due_date': due_date_str,
                        'days_until_due': days_until,
                        'status': form['status']
                    })
        
        return sorted(upcoming, key=lambda x: x['days_until_due'])


# Singleton instance
government_forms_service = GovernmentFormsService()
