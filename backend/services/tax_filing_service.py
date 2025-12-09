"""
SAURELLIUS TAX FILING SERVICE
W-2/W-3 generation, quarterly tax filings (940, 941), state filings
Complete employer tax compliance system
"""

from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from enum import Enum
import uuid


class TaxFormType(Enum):
    W2 = "W-2"
    W3 = "W-3"
    FORM_940 = "940"      # Annual FUTA
    FORM_941 = "941"      # Quarterly Federal
    FORM_944 = "944"      # Annual Federal (small employers)
    FORM_943 = "943"      # Agricultural
    STATE_QUARTERLY = "state_quarterly"
    STATE_ANNUAL = "state_annual"


class FilingFrequency(Enum):
    MONTHLY = "monthly"
    SEMI_WEEKLY = "semi_weekly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class TaxDepositSchedule(Enum):
    MONTHLY = "monthly"      # Deposit by 15th of following month
    SEMI_WEEKLY = "semi_weekly"  # Deposit within 3 business days


class SaurelliusTaxFiling:
    """Complete tax filing and compliance system"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.w2_forms: List[dict] = []
        self.tax_filings: List[dict] = []
        self.tax_deposits: List[dict] = []
        self.tax_liabilities: Dict[str, Decimal] = {}
        
        # Company tax settings (would come from config)
        self.company_info = {
            "legal_name": "Saurellius Inc",
            "dba": "",
            "ein": "12-3456789",
            "address": {
                "street": "123 Business Ave",
                "city": "San Francisco",
                "state": "CA",
                "zip": "94102"
            },
            "contact_name": "HR Department",
            "contact_phone": "(555) 123-4567",
            "deposit_schedule": TaxDepositSchedule.MONTHLY.value
        }
        
        # 2024 Tax Rates
        self.TAX_RATES = {
            "social_security_rate": Decimal("0.062"),
            "social_security_wage_base": Decimal("168600"),
            "medicare_rate": Decimal("0.0145"),
            "additional_medicare_rate": Decimal("0.009"),
            "additional_medicare_threshold": Decimal("200000"),
            "futa_rate": Decimal("0.006"),
            "futa_wage_base": Decimal("7000"),
            "futa_credit_reduction_states": ["CA", "CT", "NY"]  # Example
        }
    
    def generate_w2(self, employee_id: str, tax_year: int, payroll_data: dict) -> dict:
        """Generate W-2 form for an employee"""
        w2_id = str(uuid.uuid4())
        
        # Calculate Box values
        wages = Decimal(str(payroll_data.get("gross_wages", 0)))
        federal_withheld = Decimal(str(payroll_data.get("federal_tax_withheld", 0)))
        ss_wages = min(wages, self.TAX_RATES["social_security_wage_base"])
        ss_tax = Decimal(str(payroll_data.get("social_security_withheld", 0)))
        medicare_wages = wages
        medicare_tax = Decimal(str(payroll_data.get("medicare_withheld", 0)))
        
        # State wages and tax
        state_wages = wages
        state_tax = Decimal(str(payroll_data.get("state_tax_withheld", 0)))
        local_wages = wages
        local_tax = Decimal(str(payroll_data.get("local_tax_withheld", 0)))
        
        # Pre-tax deductions
        retirement_401k = Decimal(str(payroll_data.get("retirement_401k", 0)))
        health_insurance = Decimal(str(payroll_data.get("health_insurance_pretax", 0)))
        hsa_contributions = Decimal(str(payroll_data.get("hsa_contributions", 0)))
        dependent_care = Decimal(str(payroll_data.get("dependent_care", 0)))
        
        w2 = {
            "id": w2_id,
            "form_type": TaxFormType.W2.value,
            "tax_year": tax_year,
            "employee_id": employee_id,
            "company_id": self.company_id,
            
            # Employee Info (Box a-f)
            "employee": {
                "ssn_last4": payroll_data.get("ssn_last4", ""),
                "first_name": payroll_data.get("first_name", ""),
                "middle_initial": payroll_data.get("middle_initial", ""),
                "last_name": payroll_data.get("last_name", ""),
                "suffix": payroll_data.get("suffix", ""),
                "address": payroll_data.get("address", {}),
                "control_number": f"{tax_year}-{employee_id[:8]}"
            },
            
            # Employer Info (Box b-c)
            "employer": {
                "ein": self.company_info["ein"],
                "name": self.company_info["legal_name"],
                "address": self.company_info["address"]
            },
            
            # Box Values
            "boxes": {
                "1": float(wages - retirement_401k),  # Wages, tips, other compensation
                "2": float(federal_withheld),         # Federal income tax withheld
                "3": float(ss_wages),                 # Social Security wages
                "4": float(ss_tax),                   # Social Security tax withheld
                "5": float(medicare_wages),           # Medicare wages and tips
                "6": float(medicare_tax),             # Medicare tax withheld
                "7": float(payroll_data.get("tips", 0)),  # Social Security tips
                "8": float(payroll_data.get("allocated_tips", 0)),  # Allocated tips
                "10": float(dependent_care),          # Dependent care benefits
                "11": float(payroll_data.get("nonqualified_plans", 0)),  # Nonqualified plans
                "12": [],                             # See codes below
                "13": {                               # Checkboxes
                    "statutory_employee": payroll_data.get("statutory_employee", False),
                    "retirement_plan": retirement_401k > 0,
                    "third_party_sick_pay": payroll_data.get("third_party_sick_pay", False)
                },
                "14": [],                             # Other
                "15": payroll_data.get("state_code", ""),  # State
                "16": float(state_wages),             # State wages
                "17": float(state_tax),               # State income tax
                "18": float(local_wages),             # Local wages
                "19": float(local_tax),               # Local income tax
                "20": payroll_data.get("locality_name", "")  # Locality name
            },
            
            # Status
            "status": "draft",
            "created_at": datetime.now().isoformat(),
            "filed_at": None,
            "sent_to_employee_at": None
        }
        
        # Add Box 12 codes
        if retirement_401k > 0:
            w2["boxes"]["12"].append({"code": "D", "amount": float(retirement_401k)})
        if health_insurance > 0:
            w2["boxes"]["12"].append({"code": "DD", "amount": float(health_insurance)})
        if hsa_contributions > 0:
            w2["boxes"]["12"].append({"code": "W", "amount": float(hsa_contributions)})
        
        self.w2_forms.append(w2)
        return w2
    
    def generate_w3(self, tax_year: int) -> dict:
        """Generate W-3 transmittal form (summary of all W-2s)"""
        w2s = [w for w in self.w2_forms if w["tax_year"] == tax_year]
        
        if not w2s:
            raise ValueError(f"No W-2 forms found for {tax_year}")
        
        w3_id = str(uuid.uuid4())
        
        # Sum all W-2 boxes
        totals = {str(i): Decimal("0.00") for i in range(1, 20)}
        
        for w2 in w2s:
            for box_num in ["1", "2", "3", "4", "5", "6", "7", "8", "10", "11", "16", "17", "18", "19"]:
                if box_num in w2["boxes"]:
                    totals[box_num] += Decimal(str(w2["boxes"][box_num]))
        
        w3 = {
            "id": w3_id,
            "form_type": TaxFormType.W3.value,
            "tax_year": tax_year,
            "company_id": self.company_id,
            
            # Control number and kind of payer
            "control_number": f"W3-{tax_year}-{self.company_id[:8]}",
            "kind_of_payer": "regular",  # regular, agricultural, household, military, medicare_govt
            "kind_of_employer": "none_apply",  # none_apply, state_local_501c, state_local_non_501c, federal_govt
            
            # Employer Info
            "employer": {
                "ein": self.company_info["ein"],
                "name": self.company_info["legal_name"],
                "address": self.company_info["address"],
                "contact_name": self.company_info["contact_name"],
                "contact_phone": self.company_info["contact_phone"],
                "contact_email": "hr@saurellius.com"
            },
            
            # Totals (same box numbers as W-2)
            "totals": {k: float(v) for k, v in totals.items()},
            
            # Number of W-2s
            "w2_count": len(w2s),
            
            # Establishment number (for multi-location employers)
            "establishment_number": "",
            
            # Third-party designee
            "third_party_designee": None,
            
            # Status
            "status": "draft",
            "created_at": datetime.now().isoformat(),
            "filed_at": None
        }
        
        return w3
    
    def generate_form_941(self, tax_year: int, quarter: int, payroll_data: dict) -> dict:
        """Generate Form 941 (Quarterly Federal Tax Return)"""
        filing_id = str(uuid.uuid4())
        
        # Calculate quarter dates
        quarter_start_month = (quarter - 1) * 3 + 1
        quarter_end_month = quarter * 3
        
        # Gather data
        total_wages = Decimal(str(payroll_data.get("total_wages", 0)))
        federal_withheld = Decimal(str(payroll_data.get("federal_withheld", 0)))
        ss_wages = Decimal(str(payroll_data.get("ss_wages", 0)))
        medicare_wages = Decimal(str(payroll_data.get("medicare_wages", 0)))
        tips = Decimal(str(payroll_data.get("tips", 0)))
        
        # Calculate taxes
        ss_tax = ss_wages * self.TAX_RATES["social_security_rate"] * 2  # Employee + Employer
        medicare_tax = medicare_wages * self.TAX_RATES["medicare_rate"] * 2
        additional_medicare = Decimal(str(payroll_data.get("additional_medicare", 0)))
        
        total_taxes = federal_withheld + ss_tax + medicare_tax + additional_medicare
        
        form_941 = {
            "id": filing_id,
            "form_type": TaxFormType.FORM_941.value,
            "tax_year": tax_year,
            "quarter": quarter,
            "company_id": self.company_id,
            
            # Part 1 - Answer these questions
            "part1": {
                "line1": payroll_data.get("employee_count", 0),  # Number of employees
                "line2": float(total_wages),                     # Wages, tips, other compensation
                "line3": float(federal_withheld),                # Federal income tax withheld
                "line4": payroll_data.get("not_subject_ss_medicare", False),
                "line5a": {
                    "column1": float(ss_wages),                  # Taxable SS wages
                    "column2": float(ss_tax),                    # SS tax
                },
                "line5b": {
                    "column1": float(tips),                      # Taxable SS tips
                    "column2": float(tips * self.TAX_RATES["social_security_rate"] * 2),
                },
                "line5c": {
                    "column1": float(medicare_wages),            # Taxable Medicare wages
                    "column2": float(medicare_tax),              # Medicare tax
                },
                "line5d": {
                    "column1": float(payroll_data.get("additional_medicare_wages", 0)),
                    "column2": float(additional_medicare),
                },
                "line5e": float(ss_tax + medicare_tax + additional_medicare),  # Total SS and Medicare
                "line5f": 0,  # Section 3121(q) Notice
                "line6": float(total_taxes),                     # Total taxes before adjustments
                "line7": 0,                                      # Current quarter's adjustment
                "line8": 0,                                      # Prior quarter corrections
                "line9": 0,                                      # Special additions
                "line10": float(total_taxes),                    # Total taxes after adjustments
                "line11": float(payroll_data.get("total_deposits", 0)),  # Total deposits
                "line12": 0,                                     # Balance due or overpayment
                "line13": 0,                                     # Overpayment
            },
            
            # Part 2 - Deposit Schedule
            "part2": {
                "deposit_schedule": self.company_info["deposit_schedule"],
                "monthly_liability": payroll_data.get("monthly_liability", {}),
                "total_liability": float(total_taxes)
            },
            
            # Part 3 - Business info
            "part3": {
                "business_closed": False,
                "seasonal_employer": False
            },
            
            # Part 4 - Third-party designee
            "part4": {
                "designee_name": None,
                "designee_phone": None,
                "designee_pin": None
            },
            
            # Part 5 - Sign here
            "part5": {
                "signed_by": None,
                "title": None,
                "date": None,
                "best_daytime_phone": None
            },
            
            # Due date
            "due_date": self._get_941_due_date(tax_year, quarter),
            
            # Status
            "status": "draft",
            "created_at": datetime.now().isoformat(),
            "filed_at": None
        }
        
        self.tax_filings.append(form_941)
        return form_941
    
    def _get_941_due_date(self, year: int, quarter: int) -> str:
        """Get Form 941 due date"""
        due_dates = {
            1: f"{year}-04-30",
            2: f"{year}-07-31",
            3: f"{year}-10-31",
            4: f"{year + 1}-01-31"
        }
        return due_dates[quarter]
    
    def generate_form_940(self, tax_year: int, payroll_data: dict) -> dict:
        """Generate Form 940 (Annual FUTA Tax Return)"""
        filing_id = str(uuid.uuid4())
        
        total_payments = Decimal(str(payroll_data.get("total_payments", 0)))
        exempt_payments = Decimal(str(payroll_data.get("exempt_payments", 0)))
        payments_over_7000 = Decimal(str(payroll_data.get("payments_over_7000", 0)))
        
        futa_wages = total_payments - exempt_payments - payments_over_7000
        futa_tax = futa_wages * self.TAX_RATES["futa_rate"]
        
        # Credit reduction states
        credit_reduction = Decimal("0.00")
        for state in payroll_data.get("credit_reduction_states", []):
            if state in self.TAX_RATES["futa_credit_reduction_states"]:
                state_wages = Decimal(str(payroll_data.get(f"{state}_wages", 0)))
                credit_reduction += state_wages * Decimal("0.003")  # Example rate
        
        form_940 = {
            "id": filing_id,
            "form_type": TaxFormType.FORM_940.value,
            "tax_year": tax_year,
            "company_id": self.company_id,
            
            # Part 1 - Tell us about your return
            "part1": {
                "line1a": payroll_data.get("state_code", ""),
                "line1b": payroll_data.get("multi_state", False),
                "line2": payroll_data.get("paid_suta", False)
            },
            
            # Part 2 - Determine your FUTA tax
            "part2": {
                "line3": float(total_payments),
                "line4": float(exempt_payments),
                "line5": float(payments_over_7000),
                "line6": float(exempt_payments + payments_over_7000),
                "line7": float(futa_wages),
                "line8": float(futa_tax),
                "line9": 0,  # If all FUTA wages excluded
                "line10": 0,  # Multiply line 9
                "line11": float(credit_reduction),
                "line12": float(futa_tax + credit_reduction)
            },
            
            # Part 3 - Determine your adjustments
            "part3": {
                "line13": 0,  # If all taxable FUTA wages excluded
                "line14": 0,  # If some taxable FUTA wages excluded
                "line15": 0   # Late payments
            },
            
            # Part 4 - Determine your FUTA tax and balance due
            "part4": {
                "line16": float(futa_tax + credit_reduction),
                "line17": float(payroll_data.get("total_deposits", 0)),
                "line18": 0,  # Balance due
                "line19": 0   # Overpayment
            },
            
            # Part 5 - Report FUTA tax liability by quarter
            "part5": {
                "q1": float(payroll_data.get("q1_liability", 0)),
                "q2": float(payroll_data.get("q2_liability", 0)),
                "q3": float(payroll_data.get("q3_liability", 0)),
                "q4": float(payroll_data.get("q4_liability", 0)),
                "total": float(futa_tax + credit_reduction)
            },
            
            # Due date
            "due_date": f"{tax_year + 1}-01-31",
            
            # Status
            "status": "draft",
            "created_at": datetime.now().isoformat(),
            "filed_at": None
        }
        
        self.tax_filings.append(form_940)
        return form_940
    
    def record_tax_deposit(self, deposit_type: str, amount: Decimal, 
                          deposit_date: date, period: dict) -> dict:
        """Record a federal tax deposit"""
        deposit_id = str(uuid.uuid4())
        
        deposit = {
            "id": deposit_id,
            "company_id": self.company_id,
            "deposit_type": deposit_type,  # federal_941, futa, state
            "amount": float(amount),
            "deposit_date": deposit_date.isoformat(),
            "period": period,  # {"year": 2024, "quarter": 1} or {"year": 2024, "month": 3}
            "confirmation_number": f"DEP-{deposit_id[:8].upper()}",
            "payment_method": "eftps",  # eftps, check, credit_card
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        
        self.tax_deposits.append(deposit)
        return deposit
    
    def get_deposit_schedule(self, lookback_liability: Decimal) -> str:
        """Determine deposit schedule based on lookback period liability"""
        # IRS lookback period: July 1 of second preceding year to June 30 of prior year
        # Under $50,000 = Monthly depositor
        # $50,000 or more = Semi-weekly depositor
        
        threshold = Decimal("50000")
        if lookback_liability < threshold:
            return TaxDepositSchedule.MONTHLY.value
        else:
            return TaxDepositSchedule.SEMI_WEEKLY.value
    
    def get_next_deposit_due_date(self, pay_date: date) -> date:
        """Calculate next tax deposit due date based on schedule"""
        schedule = self.company_info["deposit_schedule"]
        
        if schedule == TaxDepositSchedule.MONTHLY.value:
            # Due by 15th of following month
            if pay_date.month == 12:
                return date(pay_date.year + 1, 1, 15)
            else:
                return date(pay_date.year, pay_date.month + 1, 15)
        
        else:  # Semi-weekly
            weekday = pay_date.weekday()
            if weekday in [2, 3, 4]:  # Wed, Thu, Fri
                # Due following Wednesday
                days_until_wed = (2 - weekday) % 7
                if days_until_wed <= 0:
                    days_until_wed += 7
                return pay_date + timedelta(days=days_until_wed)
            else:  # Sat, Sun, Mon, Tue
                # Due following Friday
                days_until_fri = (4 - weekday) % 7
                if days_until_fri <= 0:
                    days_until_fri += 7
                return pay_date + timedelta(days=days_until_fri)
    
    def get_state_filing_requirements(self, state: str) -> dict:
        """Get state-specific filing requirements"""
        # This would connect to state_payroll_rules in production
        state_requirements = {
            "CA": {
                "withholding_form": "DE 9",
                "quarterly_form": "DE 9C",
                "annual_form": "W-2/DE 9ADJ",
                "filing_frequency": "quarterly",
                "sdi_rate": Decimal("0.009"),
                "ett_rate": Decimal("0.001")
            },
            "NY": {
                "withholding_form": "NYS-45",
                "quarterly_form": "NYS-45",
                "annual_form": "NYS-45-ATT",
                "filing_frequency": "quarterly",
                "sdi_rate": Decimal("0.005")
            },
            "TX": {
                "withholding_form": None,  # No state income tax
                "quarterly_form": "C-3",
                "annual_form": "C-3",
                "filing_frequency": "quarterly",
                "sdi_rate": Decimal("0")
            }
        }
        
        return state_requirements.get(state, {
            "withholding_form": "State W-2",
            "filing_frequency": "quarterly"
        })
    
    def calculate_quarterly_liability(self, payroll_summaries: List[dict]) -> dict:
        """Calculate quarterly tax liability from payroll data"""
        total_federal = Decimal("0.00")
        total_ss = Decimal("0.00")
        total_medicare = Decimal("0.00")
        total_futa = Decimal("0.00")
        total_state = Decimal("0.00")
        
        for summary in payroll_summaries:
            total_federal += Decimal(str(summary.get("federal_withheld", 0)))
            total_ss += Decimal(str(summary.get("ss_withheld", 0))) * 2  # EE + ER
            total_medicare += Decimal(str(summary.get("medicare_withheld", 0))) * 2
            
            # FUTA on first $7,000 per employee
            futa_wages = min(
                Decimal(str(summary.get("gross_wages", 0))),
                self.TAX_RATES["futa_wage_base"]
            )
            total_futa += futa_wages * self.TAX_RATES["futa_rate"]
            
            total_state += Decimal(str(summary.get("state_withheld", 0)))
        
        return {
            "federal_income_tax": float(total_federal),
            "social_security": float(total_ss),
            "medicare": float(total_medicare),
            "total_941": float(total_federal + total_ss + total_medicare),
            "futa": float(total_futa),
            "state_withholding": float(total_state),
            "total_liability": float(total_federal + total_ss + total_medicare + total_futa + total_state)
        }
    
    def get_filing_calendar(self, year: int) -> List[dict]:
        """Get all filing deadlines for a year"""
        calendar = [
            # W-2/W-3
            {"form": "W-2/W-3", "due_date": f"{year}-01-31", "description": f"W-2s to employees and W-3 to SSA for {year-1}"},
            
            # Form 941 Quarterly
            {"form": "941", "due_date": f"{year}-04-30", "description": f"Q1 {year} Federal Tax Return"},
            {"form": "941", "due_date": f"{year}-07-31", "description": f"Q2 {year} Federal Tax Return"},
            {"form": "941", "due_date": f"{year}-10-31", "description": f"Q3 {year} Federal Tax Return"},
            {"form": "941", "due_date": f"{year+1}-01-31", "description": f"Q4 {year} Federal Tax Return"},
            
            # Form 940
            {"form": "940", "due_date": f"{year+1}-01-31", "description": f"Annual FUTA Tax Return for {year}"},
            
            # 1099s
            {"form": "1099-NEC", "due_date": f"{year}-01-31", "description": f"1099-NEC to contractors for {year-1}"},
        ]
        
        return sorted(calendar, key=lambda x: x["due_date"])
    
    def get_w2_forms(self, tax_year: Optional[int] = None, 
                    employee_id: Optional[str] = None,
                    status: Optional[str] = None) -> List[dict]:
        """Get W-2 forms with optional filters"""
        forms = self.w2_forms.copy()
        
        if tax_year:
            forms = [f for f in forms if f["tax_year"] == tax_year]
        if employee_id:
            forms = [f for f in forms if f["employee_id"] == employee_id]
        if status:
            forms = [f for f in forms if f["status"] == status]
        
        return forms
    
    def get_tax_filings(self, tax_year: Optional[int] = None,
                       form_type: Optional[str] = None,
                       status: Optional[str] = None) -> List[dict]:
        """Get tax filings with optional filters"""
        filings = self.tax_filings.copy()
        
        if tax_year:
            filings = [f for f in filings if f["tax_year"] == tax_year]
        if form_type:
            filings = [f for f in filings if f["form_type"] == form_type]
        if status:
            filings = [f for f in filings if f["status"] == status]
        
        return sorted(filings, key=lambda x: x.get("due_date", ""), reverse=True)
    
    def file_form(self, filing_id: str) -> dict:
        """Mark a form as filed"""
        filing = next((f for f in self.tax_filings if f["id"] == filing_id), None)
        if not filing:
            # Check W-2 forms
            filing = next((f for f in self.w2_forms if f["id"] == filing_id), None)
        
        if not filing:
            raise ValueError(f"Filing {filing_id} not found")
        
        filing["status"] = "filed"
        filing["filed_at"] = datetime.now().isoformat()
        return filing
    
    def export_efile_data(self, form_type: str, tax_year: int) -> dict:
        """Export data in e-file format"""
        if form_type == "W-2":
            forms = [f for f in self.w2_forms if f["tax_year"] == tax_year]
            return {
                "form_type": "W-2",
                "tax_year": tax_year,
                "employer_ein": self.company_info["ein"],
                "w2_count": len(forms),
                "forms": forms,
                "w3": self.generate_w3(tax_year),
                "export_format": "SSA_EFW2"
            }
        
        else:
            filings = [f for f in self.tax_filings 
                      if f["form_type"] == form_type and f["tax_year"] == tax_year]
            return {
                "form_type": form_type,
                "tax_year": tax_year,
                "filings": filings,
                "export_format": "IRS_XML"
            }


# Import timedelta for deposit scheduling
from datetime import timedelta

# Create singleton instance
tax_filing_service = SaurelliusTaxFiling("default")
