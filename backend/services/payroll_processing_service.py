"""
PAYROLL PROCESSING SERVICE
Complete gross-to-net payroll calculation with all deductions
Production-ready payroll run workflow
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP
import uuid

from services.production_tax_engine import production_tax_engine


class PayrollProcessingService:
    """
    Production payroll processing service.
    Handles complete gross-to-net calculation with all deductions.
    """
    
    def __init__(self):
        self.tax_engine = production_tax_engine
        self.payroll_runs = {}
    
    # ==========================================================================
    # PAYROLL RUN WORKFLOW
    # ==========================================================================
    
    def create_payroll_run(
        self,
        company_id: str,
        pay_period_start: date,
        pay_period_end: date,
        pay_date: date,
        pay_frequency: str = 'biweekly',
        run_type: str = 'regular'
    ) -> Dict:
        """Create a new payroll run."""
        run_id = str(uuid.uuid4())
        
        payroll_run = {
            'id': run_id,
            'company_id': company_id,
            'pay_period_start': pay_period_start.isoformat(),
            'pay_period_end': pay_period_end.isoformat(),
            'pay_date': pay_date.isoformat(),
            'pay_frequency': pay_frequency,
            'run_type': run_type,
            'status': 'draft',
            'employees': [],
            'totals': {
                'total_employees': 0,
                'total_gross': 0,
                'total_net': 0,
                'total_employee_taxes': 0,
                'total_employer_taxes': 0,
                'total_deductions': 0
            },
            'tax_summary': {
                'federal_income_tax': 0,
                'social_security_employee': 0,
                'social_security_employer': 0,
                'medicare_employee': 0,
                'medicare_employer': 0,
                'state_taxes': {},
                'local_taxes': {},
                'futa': 0,
                'suta': {}
            },
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        self.payroll_runs[run_id] = payroll_run
        return payroll_run
    
    def calculate_employee_pay(
        self,
        run_id: str,
        employee_data: Dict,
        hours_data: Dict,
        deductions_config: Dict,
        ytd_data: Dict
    ) -> Dict:
        """Calculate complete pay for a single employee."""
        
        payroll_run = self.payroll_runs.get(run_id)
        if not payroll_run:
            return {'error': 'Payroll run not found'}
        
        # =====================================================================
        # STEP 1: CALCULATE GROSS WAGES
        # =====================================================================
        
        earnings = self._calculate_gross_wages(employee_data, hours_data)
        gross_pay = earnings['total_gross']
        
        # =====================================================================
        # STEP 2: CALCULATE PRE-TAX DEDUCTIONS
        # =====================================================================
        
        pretax_deductions = self._calculate_pretax_deductions(
            gross_pay, deductions_config, employee_data
        )
        taxable_wages = gross_pay - pretax_deductions['total']
        
        # =====================================================================
        # STEP 3: CALCULATE ALL TAXES
        # =====================================================================
        
        taxes = self.tax_engine.calculate_all_taxes(
            gross_wages=taxable_wages,
            pay_frequency=payroll_run['pay_frequency'],
            work_state=employee_data.get('work_state', 'CA'),
            residence_state=employee_data.get('residence_state', employee_data.get('work_state', 'CA')),
            filing_status=employee_data.get('filing_status', 'single'),
            w4_data=employee_data.get('w4_data', {}),
            ytd_data=ytd_data,
            local_jurisdictions=employee_data.get('local_jurisdictions', []),
            employer_sui_rate=employee_data.get('sui_rate')
        )
        
        # =====================================================================
        # STEP 4: CALCULATE POST-TAX DEDUCTIONS
        # =====================================================================
        
        posttax_deductions = self._calculate_posttax_deductions(
            gross_pay, deductions_config, employee_data
        )
        
        # =====================================================================
        # STEP 5: CALCULATE GARNISHMENTS
        # =====================================================================
        
        garnishments = self._calculate_garnishments(
            gross_pay - pretax_deductions['total'] - taxes['totals']['employee_taxes'],
            employee_data.get('garnishments', [])
        )
        
        # =====================================================================
        # STEP 6: CALCULATE NET PAY
        # =====================================================================
        
        total_deductions = (
            pretax_deductions['total'] +
            taxes['totals']['employee_taxes'] +
            posttax_deductions['total'] +
            garnishments['total']
        )
        
        net_pay = gross_pay - total_deductions
        
        # =====================================================================
        # STEP 7: BUILD EMPLOYEE PAYROLL RECORD
        # =====================================================================
        
        employee_record = {
            'employee_id': employee_data.get('id'),
            'employee_name': f"{employee_data.get('first_name', '')} {employee_data.get('last_name', '')}",
            
            # Earnings
            'earnings': earnings,
            'gross_pay': round(gross_pay, 2),
            
            # Pre-tax deductions
            'pretax_deductions': pretax_deductions,
            
            # Taxes
            'taxes': {
                'federal_income_tax': taxes['federal']['income_tax']['per_period_tax'],
                'social_security': taxes['federal']['social_security']['employee_tax'],
                'medicare': taxes['federal']['medicare']['employee_tax'],
                'state_taxes': {state: data['tax'] for state, data in taxes['state'].items()},
                'local_taxes': {loc: data['tax'] for loc, data in taxes['local'].items()},
                'total_employee_taxes': taxes['totals']['employee_taxes']
            },
            
            # Post-tax deductions
            'posttax_deductions': posttax_deductions,
            
            # Garnishments
            'garnishments': garnishments,
            
            # Totals
            'total_deductions': round(total_deductions, 2),
            'net_pay': round(net_pay, 2),
            
            # Employer costs
            'employer_taxes': {
                'social_security': taxes['federal']['social_security']['employer_tax'],
                'medicare': taxes['federal']['medicare']['employer_tax'],
                'futa': taxes['employer_taxes']['futa']['tax'],
                'suta': taxes['employer_taxes']['suta']['tax'],
                'total': taxes['totals']['employer_taxes']
            },
            
            # YTD after this payroll
            'ytd_after': {
                'gross': ytd_data.get('ytd_gross', 0) + gross_pay,
                'federal_tax': ytd_data.get('ytd_federal_tax', 0) + taxes['federal']['income_tax']['per_period_tax'],
                'ss_wages': ytd_data.get('ytd_ss_wages', 0) + taxes['federal']['social_security']['taxable_wages'],
                'medicare_wages': ytd_data.get('ytd_medicare_wages', 0) + taxable_wages,
                'net': ytd_data.get('ytd_net', 0) + net_pay
            },
            
            # Payment info
            'payment_method': employee_data.get('payment_method', 'direct_deposit'),
            'direct_deposit_accounts': employee_data.get('direct_deposit_accounts', []),
            
            'calculated_at': datetime.utcnow().isoformat()
        }
        
        # Add to payroll run
        payroll_run['employees'].append(employee_record)
        self._update_payroll_totals(payroll_run)
        
        return employee_record
    
    def _calculate_gross_wages(self, employee: Dict, hours: Dict) -> Dict:
        """Calculate gross wages from hours and pay rate."""
        pay_type = employee.get('pay_type', 'hourly')
        pay_rate = float(employee.get('pay_rate', 0))
        
        earnings = {
            'regular_hours': 0,
            'regular_pay': 0,
            'overtime_hours': 0,
            'overtime_pay': 0,
            'double_time_hours': 0,
            'double_time_pay': 0,
            'holiday_hours': 0,
            'holiday_pay': 0,
            'pto_hours': 0,
            'pto_pay': 0,
            'sick_hours': 0,
            'sick_pay': 0,
            'bonus': 0,
            'commission': 0,
            'tips': 0,
            'reimbursements': 0,
            'other': 0,
            'total_gross': 0
        }
        
        if pay_type == 'hourly':
            # Regular hours (up to 40)
            regular_hours = min(float(hours.get('regular', 0)), 40)
            earnings['regular_hours'] = regular_hours
            earnings['regular_pay'] = round(regular_hours * pay_rate, 2)
            
            # Overtime hours (1.5x)
            overtime_hours = float(hours.get('overtime', 0))
            earnings['overtime_hours'] = overtime_hours
            earnings['overtime_pay'] = round(overtime_hours * pay_rate * 1.5, 2)
            
            # Double time (2x) - California and some states
            double_time_hours = float(hours.get('double_time', 0))
            earnings['double_time_hours'] = double_time_hours
            earnings['double_time_pay'] = round(double_time_hours * pay_rate * 2, 2)
            
            # Holiday hours (typically 1.5x)
            holiday_hours = float(hours.get('holiday', 0))
            earnings['holiday_hours'] = holiday_hours
            earnings['holiday_pay'] = round(holiday_hours * pay_rate * 1.5, 2)
            
        elif pay_type == 'salary':
            # Salary per pay period
            pay_periods = self.tax_engine._get_pay_periods(employee.get('pay_frequency', 'biweekly'))
            earnings['regular_pay'] = round(pay_rate / pay_periods, 2)
        
        # PTO (paid at regular rate)
        pto_hours = float(hours.get('pto', 0))
        earnings['pto_hours'] = pto_hours
        earnings['pto_pay'] = round(pto_hours * pay_rate, 2)
        
        # Sick time
        sick_hours = float(hours.get('sick', 0))
        earnings['sick_hours'] = sick_hours
        earnings['sick_pay'] = round(sick_hours * pay_rate, 2)
        
        # Supplemental earnings
        earnings['bonus'] = round(float(hours.get('bonus', 0)), 2)
        earnings['commission'] = round(float(hours.get('commission', 0)), 2)
        earnings['tips'] = round(float(hours.get('tips', 0)), 2)
        earnings['reimbursements'] = round(float(hours.get('reimbursements', 0)), 2)
        earnings['other'] = round(float(hours.get('other_earnings', 0)), 2)
        
        # Total gross
        earnings['total_gross'] = round(
            earnings['regular_pay'] +
            earnings['overtime_pay'] +
            earnings['double_time_pay'] +
            earnings['holiday_pay'] +
            earnings['pto_pay'] +
            earnings['sick_pay'] +
            earnings['bonus'] +
            earnings['commission'] +
            earnings['tips'] +
            earnings['other'],
            2
        )
        
        return earnings
    
    def _calculate_pretax_deductions(
        self,
        gross_pay: float,
        config: Dict,
        employee: Dict
    ) -> Dict:
        """Calculate pre-tax deductions."""
        deductions = {
            'health_insurance': 0,
            'dental_insurance': 0,
            'vision_insurance': 0,
            'hsa': 0,
            'fsa': 0,
            'dependent_care_fsa': 0,
            'traditional_401k': 0,
            'commuter_benefits': 0,
            'life_insurance_pretax': 0,
            'other_pretax': 0,
            'total': 0
        }
        
        # Health insurance
        if config.get('health_insurance'):
            deductions['health_insurance'] = round(float(config['health_insurance']), 2)
        
        # Dental
        if config.get('dental_insurance'):
            deductions['dental_insurance'] = round(float(config['dental_insurance']), 2)
        
        # Vision
        if config.get('vision_insurance'):
            deductions['vision_insurance'] = round(float(config['vision_insurance']), 2)
        
        # HSA
        if config.get('hsa'):
            deductions['hsa'] = round(float(config['hsa']), 2)
        
        # FSA
        if config.get('fsa'):
            deductions['fsa'] = round(float(config['fsa']), 2)
        
        # Dependent Care FSA
        if config.get('dependent_care_fsa'):
            deductions['dependent_care_fsa'] = round(float(config['dependent_care_fsa']), 2)
        
        # Traditional 401(k)
        if config.get('retirement_401k_percent'):
            deductions['traditional_401k'] = round(gross_pay * float(config['retirement_401k_percent']) / 100, 2)
        elif config.get('retirement_401k_amount'):
            deductions['traditional_401k'] = round(float(config['retirement_401k_amount']), 2)
        
        # Commuter benefits
        if config.get('commuter_benefits'):
            deductions['commuter_benefits'] = round(float(config['commuter_benefits']), 2)
        
        # Calculate total
        deductions['total'] = round(sum([
            deductions['health_insurance'],
            deductions['dental_insurance'],
            deductions['vision_insurance'],
            deductions['hsa'],
            deductions['fsa'],
            deductions['dependent_care_fsa'],
            deductions['traditional_401k'],
            deductions['commuter_benefits'],
            deductions['life_insurance_pretax'],
            deductions['other_pretax']
        ]), 2)
        
        return deductions
    
    def _calculate_posttax_deductions(
        self,
        gross_pay: float,
        config: Dict,
        employee: Dict
    ) -> Dict:
        """Calculate post-tax deductions."""
        deductions = {
            'roth_401k': 0,
            'life_insurance_posttax': 0,
            'disability_insurance': 0,
            'union_dues': 0,
            'charitable_contributions': 0,
            'loan_repayment': 0,
            'other_posttax': 0,
            'total': 0
        }
        
        # Roth 401(k)
        if config.get('roth_401k_percent'):
            deductions['roth_401k'] = round(gross_pay * float(config['roth_401k_percent']) / 100, 2)
        elif config.get('roth_401k_amount'):
            deductions['roth_401k'] = round(float(config['roth_401k_amount']), 2)
        
        # Life insurance over $50K (taxable portion)
        if config.get('life_insurance_posttax'):
            deductions['life_insurance_posttax'] = round(float(config['life_insurance_posttax']), 2)
        
        # Union dues
        if config.get('union_dues'):
            deductions['union_dues'] = round(float(config['union_dues']), 2)
        
        # Charitable contributions
        if config.get('charitable_contributions'):
            deductions['charitable_contributions'] = round(float(config['charitable_contributions']), 2)
        
        # Loan repayment (401k loan, etc.)
        if config.get('loan_repayment'):
            deductions['loan_repayment'] = round(float(config['loan_repayment']), 2)
        
        # Calculate total
        deductions['total'] = round(sum([
            deductions['roth_401k'],
            deductions['life_insurance_posttax'],
            deductions['disability_insurance'],
            deductions['union_dues'],
            deductions['charitable_contributions'],
            deductions['loan_repayment'],
            deductions['other_posttax']
        ]), 2)
        
        return deductions
    
    def _calculate_garnishments(
        self,
        disposable_income: float,
        garnishments: List[Dict]
    ) -> Dict:
        """Calculate garnishments with proper priority ordering."""
        # Garnishment priority order (federal):
        # 1. Child support
        # 2. Federal tax levies
        # 3. State tax levies
        # 4. Federal student loans
        # 5. Creditor garnishments
        
        result = {
            'child_support': 0,
            'tax_levy': 0,
            'student_loan': 0,
            'creditor': 0,
            'bankruptcy': 0,
            'details': [],
            'total': 0
        }
        
        remaining_disposable = disposable_income
        
        # Sort by priority
        sorted_garnishments = sorted(garnishments, key=lambda x: x.get('priority', 99))
        
        for garn in sorted_garnishments:
            garn_type = garn.get('type', 'creditor')
            
            # Calculate maximum allowed
            if garn_type == 'child_support':
                # Up to 50% (60% if not supporting another family, +5% if >12 weeks in arrears)
                max_percent = float(garn.get('max_percent', 50)) / 100
                max_amount = remaining_disposable * max_percent
            elif garn_type == 'tax_levy':
                # IRS Publication 1494 exempt amount, rest can be taken
                exempt_amount = float(garn.get('exempt_amount', 0))
                max_amount = max(0, remaining_disposable - exempt_amount)
            elif garn_type == 'student_loan':
                # Up to 15% of disposable income
                max_amount = disposable_income * 0.15
            else:
                # Consumer debt: lesser of 25% or amount over 30x minimum wage
                twenty_five_percent = disposable_income * 0.25
                thirty_x_min_wage = 30 * 7.25 * 40 / 52  # Weekly minimum wage calculation
                over_thirty = max(0, disposable_income - thirty_x_min_wage)
                max_amount = min(twenty_five_percent, over_thirty)
            
            # Apply garnishment
            garn_amount = min(float(garn.get('amount', 0)), max_amount, remaining_disposable)
            garn_amount = round(garn_amount, 2)
            
            if garn_amount > 0:
                result[garn_type] = result.get(garn_type, 0) + garn_amount
                result['details'].append({
                    'type': garn_type,
                    'case_number': garn.get('case_number'),
                    'amount': garn_amount
                })
                remaining_disposable -= garn_amount
        
        result['total'] = round(sum([
            result['child_support'],
            result['tax_levy'],
            result['student_loan'],
            result['creditor'],
            result['bankruptcy']
        ]), 2)
        
        return result
    
    def _update_payroll_totals(self, payroll_run: Dict):
        """Update payroll run totals after adding employee."""
        employees = payroll_run['employees']
        
        payroll_run['totals'] = {
            'total_employees': len(employees),
            'total_gross': round(sum(e['gross_pay'] for e in employees), 2),
            'total_net': round(sum(e['net_pay'] for e in employees), 2),
            'total_employee_taxes': round(sum(e['taxes']['total_employee_taxes'] for e in employees), 2),
            'total_employer_taxes': round(sum(e['employer_taxes']['total'] for e in employees), 2),
            'total_deductions': round(sum(e['total_deductions'] for e in employees), 2)
        }
        
        # Tax summary
        payroll_run['tax_summary'] = {
            'federal_income_tax': round(sum(e['taxes']['federal_income_tax'] for e in employees), 2),
            'social_security_employee': round(sum(e['taxes']['social_security'] for e in employees), 2),
            'social_security_employer': round(sum(e['employer_taxes']['social_security'] for e in employees), 2),
            'medicare_employee': round(sum(e['taxes']['medicare'] for e in employees), 2),
            'medicare_employer': round(sum(e['employer_taxes']['medicare'] for e in employees), 2),
            'futa': round(sum(e['employer_taxes']['futa'] for e in employees), 2),
            'suta': round(sum(e['employer_taxes']['suta'] for e in employees), 2)
        }
        
        payroll_run['updated_at'] = datetime.utcnow().isoformat()
    
    # ==========================================================================
    # PAYROLL RUN STATUS MANAGEMENT
    # ==========================================================================
    
    def preview_payroll(self, run_id: str) -> Dict:
        """Generate payroll preview."""
        payroll_run = self.payroll_runs.get(run_id)
        if not payroll_run:
            return {'error': 'Payroll run not found'}
        
        payroll_run['status'] = 'preview'
        payroll_run['previewed_at'] = datetime.utcnow().isoformat()
        
        return {
            'success': True,
            'payroll_run': payroll_run,
            'warnings': self._validate_payroll(payroll_run)
        }
    
    def approve_payroll(self, run_id: str, approver_id: str) -> Dict:
        """Approve payroll for processing."""
        payroll_run = self.payroll_runs.get(run_id)
        if not payroll_run:
            return {'error': 'Payroll run not found'}
        
        warnings = self._validate_payroll(payroll_run)
        errors = [w for w in warnings if w.get('severity') == 'error']
        
        if errors:
            return {'success': False, 'errors': errors}
        
        payroll_run['status'] = 'approved'
        payroll_run['approved_by'] = approver_id
        payroll_run['approved_at'] = datetime.utcnow().isoformat()
        
        return {'success': True, 'payroll_run': payroll_run}
    
    def process_payroll(self, run_id: str) -> Dict:
        """Process approved payroll."""
        payroll_run = self.payroll_runs.get(run_id)
        if not payroll_run:
            return {'error': 'Payroll run not found'}
        
        if payroll_run['status'] != 'approved':
            return {'error': 'Payroll must be approved before processing'}
        
        payroll_run['status'] = 'processing'
        payroll_run['processed_at'] = datetime.utcnow().isoformat()
        
        # In production: Generate ACH file, update YTD, create paystubs
        
        payroll_run['status'] = 'complete'
        payroll_run['completed_at'] = datetime.utcnow().isoformat()
        
        # =====================================================================
        # REGULATORY FILING INTEGRATION - Auto-queue tax deposits
        # =====================================================================
        regulatory_data = self._prepare_regulatory_data(payroll_run)
        payroll_run['regulatory'] = regulatory_data
        
        return {
            'success': True,
            'payroll_run': payroll_run,
            'message': 'Payroll processed successfully',
            'regulatory': regulatory_data
        }
    
    def _prepare_regulatory_data(self, payroll_run: Dict) -> Dict:
        """Prepare regulatory filing data after payroll processing."""
        from services.regulatory_filing_service import regulatory_filing_service
        
        company_id = payroll_run['company_id']
        pay_date = payroll_run['pay_date']
        tax_summary = payroll_run['tax_summary']
        
        # Calculate total federal liability (941 taxes)
        federal_liability = (
            tax_summary.get('federal_income_tax', 0) +
            tax_summary.get('social_security_employee', 0) +
            tax_summary.get('social_security_employer', 0) +
            tax_summary.get('medicare_employee', 0) +
            tax_summary.get('medicare_employer', 0)
        )
        
        # Determine quarter for tax period
        pay_date_obj = datetime.fromisoformat(pay_date) if isinstance(pay_date, str) else pay_date
        quarter = (pay_date_obj.month - 1) // 3 + 1
        tax_period = f"{pay_date_obj.year}-Q{quarter}"
        
        return {
            'federal_liability': round(federal_liability, 2),
            'futa_liability': round(tax_summary.get('futa', 0), 2),
            'state_liabilities': tax_summary.get('state_taxes', {}),
            'suta_liabilities': tax_summary.get('suta', {}),
            'tax_period': tax_period,
            'pay_date': pay_date,
            'deposit_due': self._calculate_deposit_due_date(pay_date),
            'filing_actions': [
                {
                    'type': 'eftps_deposit',
                    'amount': round(federal_liability, 2),
                    'tax_type': '941',
                    'status': 'pending'
                }
            ]
        }
    
    def _calculate_deposit_due_date(self, pay_date: str) -> str:
        """Calculate EFTPS deposit due date based on deposit schedule."""
        pay_date_obj = datetime.fromisoformat(pay_date) if isinstance(pay_date, str) else pay_date
        
        # Default to semi-weekly (3 business days)
        # Wednesday, Thursday, Friday paydays: Due following Wednesday
        # Saturday, Sunday, Monday, Tuesday paydays: Due following Friday
        
        weekday = pay_date_obj.weekday()
        if weekday in [2, 3, 4]:  # Wed, Thu, Fri
            days_until_wed = (2 - weekday + 7) % 7
            if days_until_wed == 0:
                days_until_wed = 7
            due_date = pay_date_obj + timedelta(days=days_until_wed)
        else:  # Sat, Sun, Mon, Tue
            days_until_fri = (4 - weekday + 7) % 7
            if days_until_fri == 0:
                days_until_fri = 7
            due_date = pay_date_obj + timedelta(days=days_until_fri)
        
        return due_date.strftime('%Y-%m-%d')
    
    def _validate_payroll(self, payroll_run: Dict) -> List[Dict]:
        """Validate payroll before processing."""
        warnings = []
        
        if not payroll_run['employees']:
            warnings.append({
                'severity': 'error',
                'message': 'No employees in payroll run'
            })
        
        for emp in payroll_run['employees']:
            if emp['net_pay'] < 0:
                warnings.append({
                    'severity': 'error',
                    'employee': emp['employee_name'],
                    'message': f"Negative net pay: ${emp['net_pay']}"
                })
            
            if emp['gross_pay'] == 0:
                warnings.append({
                    'severity': 'warning',
                    'employee': emp['employee_name'],
                    'message': 'Zero gross pay'
                })
        
        return warnings


# Singleton instance
payroll_processing_service = PayrollProcessingService()
