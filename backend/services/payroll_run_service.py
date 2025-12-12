"""
SAURELLIUS PAYROLL RUN SERVICE
Complete payroll processing engine - the core of payroll execution
Calculates gross pay, taxes, deductions, net pay, and generates paystubs
"""

from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from enum import Enum
import uuid


class PayrollStatus(Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class PayFrequency(Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    SEMIMONTHLY = "semimonthly"
    MONTHLY = "monthly"


class PayType(Enum):
    REGULAR = "regular"
    OFF_CYCLE = "off_cycle"
    BONUS = "bonus"
    COMMISSION = "commission"
    FINAL = "final"
    CORRECTION = "correction"


class SaurelliusPayrollRun:
    """Complete payroll processing engine"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.payroll_runs: Dict[str, dict] = {}
        self.employee_paychecks: List[dict] = []
        
        # Tax rates (2024)
        self.TAX_RATES = {
            "social_security_rate": Decimal("0.062"),
            "social_security_wage_base": Decimal("168600"),
            "medicare_rate": Decimal("0.0145"),
            "additional_medicare_rate": Decimal("0.009"),
            "additional_medicare_threshold": Decimal("200000"),
            "futa_rate": Decimal("0.006"),
            "futa_wage_base": Decimal("7000")
        }
        
        # Federal tax brackets 2024 (Single)
        self.FEDERAL_BRACKETS_SINGLE = [
            (Decimal("0"), Decimal("11600"), Decimal("0.10")),
            (Decimal("11600"), Decimal("47150"), Decimal("0.12")),
            (Decimal("47150"), Decimal("100525"), Decimal("0.22")),
            (Decimal("100525"), Decimal("191950"), Decimal("0.24")),
            (Decimal("191950"), Decimal("243725"), Decimal("0.32")),
            (Decimal("243725"), Decimal("609350"), Decimal("0.35")),
            (Decimal("609350"), None, Decimal("0.37"))
        ]
        
        # Federal tax brackets 2024 (Married)
        self.FEDERAL_BRACKETS_MARRIED = [
            (Decimal("0"), Decimal("23200"), Decimal("0.10")),
            (Decimal("23200"), Decimal("94300"), Decimal("0.12")),
            (Decimal("94300"), Decimal("201050"), Decimal("0.22")),
            (Decimal("201050"), Decimal("383900"), Decimal("0.24")),
            (Decimal("383900"), Decimal("487450"), Decimal("0.32")),
            (Decimal("487450"), Decimal("731200"), Decimal("0.35")),
            (Decimal("731200"), None, Decimal("0.37"))
        ]
    
    def create_payroll_run(self, data: dict) -> dict:
        """Create a new payroll run"""
        run_id = str(uuid.uuid4())
        
        payroll_run = {
            "id": run_id,
            "company_id": self.company_id,
            "run_number": len(self.payroll_runs) + 1,
            
            # Pay Period
            "pay_period_start": data["pay_period_start"],
            "pay_period_end": data["pay_period_end"],
            "pay_date": data["pay_date"],
            "check_date": data.get("check_date", data["pay_date"]),
            
            # Configuration
            "pay_frequency": data.get("pay_frequency", PayFrequency.BIWEEKLY.value),
            "pay_type": data.get("pay_type", PayType.REGULAR.value),
            "description": data.get("description", "Regular Payroll"),
            
            # Employee Selection
            "include_all_employees": data.get("include_all_employees", True),
            "employee_ids": data.get("employee_ids", []),
            "exclude_employee_ids": data.get("exclude_employee_ids", []),
            
            # Totals (calculated during processing)
            "totals": {
                "employee_count": 0,
                "gross_pay": Decimal("0.00"),
                "total_taxes": Decimal("0.00"),
                "total_deductions": Decimal("0.00"),
                "net_pay": Decimal("0.00"),
                "employer_taxes": Decimal("0.00"),
                "total_cost": Decimal("0.00")
            },
            
            # Tax Totals
            "tax_totals": {
                "federal_withheld": Decimal("0.00"),
                "state_withheld": Decimal("0.00"),
                "local_withheld": Decimal("0.00"),
                "employee_ss": Decimal("0.00"),
                "employee_medicare": Decimal("0.00"),
                "employer_ss": Decimal("0.00"),
                "employer_medicare": Decimal("0.00"),
                "futa": Decimal("0.00"),
                "suta": Decimal("0.00")
            },
            
            # Status
            "status": PayrollStatus.DRAFT.value,
            "created_by": data.get("created_by"),
            "approved_by": None,
            "processed_at": None,
            
            # Metadata
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        self.payroll_runs[run_id] = payroll_run
        return self._sanitize_payroll_run(payroll_run)
    
    def _sanitize_payroll_run(self, run: dict) -> dict:
        """Convert Decimal to float for JSON serialization"""
        safe = run.copy()
        
        safe["totals"] = {k: float(v) if isinstance(v, Decimal) else v 
                        for k, v in run["totals"].items()}
        safe["tax_totals"] = {k: float(v) if isinstance(v, Decimal) else v 
                            for k, v in run["tax_totals"].items()}
        
        return safe
    
    def add_employee_to_payroll(self, run_id: str, employee_data: dict) -> dict:
        """Add an employee to the payroll run and calculate their pay"""
        if run_id not in self.payroll_runs:
            raise ValueError(f"Payroll run {run_id} not found")
        
        payroll_run = self.payroll_runs[run_id]
        if payroll_run["status"] not in [PayrollStatus.DRAFT.value, PayrollStatus.PENDING_APPROVAL.value]:
            raise ValueError(f"Cannot modify payroll in status: {payroll_run['status']}")
        
        paycheck_id = str(uuid.uuid4())
        employee_id = employee_data["employee_id"]
        
        # Calculate earnings
        earnings = self._calculate_earnings(employee_data, payroll_run["pay_frequency"])
        gross_pay = earnings["total"]
        
        # Calculate taxes
        taxes = self._calculate_taxes(employee_data, gross_pay, payroll_run)
        
        # Calculate deductions
        deductions = self._calculate_deductions(employee_data, gross_pay)
        
        # Calculate net pay
        total_taxes = sum(taxes.values())
        total_deductions = sum(deductions.values())
        net_pay = gross_pay - total_taxes - total_deductions
        
        # Calculate employer costs
        employer_taxes = self._calculate_employer_taxes(employee_data, gross_pay)
        
        paycheck = {
            "id": paycheck_id,
            "payroll_run_id": run_id,
            "employee_id": employee_id,
            "company_id": self.company_id,
            
            # Employee Info
            "employee_name": f"{employee_data.get('first_name', '')} {employee_data.get('last_name', '')}",
            "department": employee_data.get("department"),
            "pay_rate": float(employee_data.get("pay_rate", 0)),
            "pay_type": employee_data.get("pay_type", "hourly"),
            
            # Pay Period
            "pay_period_start": payroll_run["pay_period_start"],
            "pay_period_end": payroll_run["pay_period_end"],
            "pay_date": payroll_run["pay_date"],
            
            # Earnings
            "earnings": {
                "regular_hours": employee_data.get("regular_hours", 0),
                "regular_rate": float(employee_data.get("pay_rate", 0)),
                "regular_pay": float(earnings.get("regular", 0)),
                "overtime_hours": employee_data.get("overtime_hours", 0),
                "overtime_rate": float(Decimal(str(employee_data.get("pay_rate", 0))) * Decimal("1.5")),
                "overtime_pay": float(earnings.get("overtime", 0)),
                "double_time_hours": employee_data.get("double_time_hours", 0),
                "double_time_pay": float(earnings.get("double_time", 0)),
                "holiday_hours": employee_data.get("holiday_hours", 0),
                "holiday_pay": float(earnings.get("holiday", 0)),
                "pto_hours": employee_data.get("pto_hours", 0),
                "pto_pay": float(earnings.get("pto", 0)),
                "sick_hours": employee_data.get("sick_hours", 0),
                "sick_pay": float(earnings.get("sick", 0)),
                "bonus": float(earnings.get("bonus", 0)),
                "commission": float(earnings.get("commission", 0)),
                "tips": float(earnings.get("tips", 0)),
                "reimbursement": float(earnings.get("reimbursement", 0)),
                "other": float(earnings.get("other", 0)),
                "gross_pay": float(gross_pay)
            },
            
            # Taxes (Employee)
            "taxes": {
                "federal": float(taxes.get("federal", 0)),
                "state": float(taxes.get("state", 0)),
                "local": float(taxes.get("local", 0)),
                "social_security": float(taxes.get("social_security", 0)),
                "medicare": float(taxes.get("medicare", 0)),
                "additional_medicare": float(taxes.get("additional_medicare", 0)),
                "state_disability": float(taxes.get("state_disability", 0)),
                "state_unemployment": float(taxes.get("state_unemployment", 0)),
                "total": float(total_taxes)
            },
            
            # Deductions
            "deductions": {
                "health_insurance": float(deductions.get("health_insurance", 0)),
                "dental_insurance": float(deductions.get("dental_insurance", 0)),
                "vision_insurance": float(deductions.get("vision_insurance", 0)),
                "life_insurance": float(deductions.get("life_insurance", 0)),
                "disability_insurance": float(deductions.get("disability_insurance", 0)),
                "retirement_401k": float(deductions.get("retirement_401k", 0)),
                "roth_401k": float(deductions.get("roth_401k", 0)),
                "hsa": float(deductions.get("hsa", 0)),
                "fsa": float(deductions.get("fsa", 0)),
                "garnishments": float(deductions.get("garnishments", 0)),
                "child_support": float(deductions.get("child_support", 0)),
                "union_dues": float(deductions.get("union_dues", 0)),
                "loan_repayment": float(deductions.get("loan_repayment", 0)),
                "other_pretax": float(deductions.get("other_pretax", 0)),
                "other_posttax": float(deductions.get("other_posttax", 0)),
                "total": float(total_deductions)
            },
            
            # Employer Taxes
            "employer_taxes": {
                "social_security": float(employer_taxes.get("social_security", 0)),
                "medicare": float(employer_taxes.get("medicare", 0)),
                "futa": float(employer_taxes.get("futa", 0)),
                "suta": float(employer_taxes.get("suta", 0)),
                "total": float(sum(employer_taxes.values()))
            },
            
            # Net Pay
            "net_pay": float(net_pay),
            
            # Payment Method
            "payment_method": employee_data.get("payment_method", "direct_deposit"),
            "bank_accounts": employee_data.get("bank_accounts", []),
            
            # YTD Totals
            "ytd": {
                "gross_pay": float(employee_data.get("ytd_gross", 0) + float(gross_pay)),
                "federal_tax": float(employee_data.get("ytd_federal", 0) + float(taxes.get("federal", 0))),
                "state_tax": float(employee_data.get("ytd_state", 0) + float(taxes.get("state", 0))),
                "social_security": float(employee_data.get("ytd_ss", 0) + float(taxes.get("social_security", 0))),
                "medicare": float(employee_data.get("ytd_medicare", 0) + float(taxes.get("medicare", 0))),
                "net_pay": float(employee_data.get("ytd_net", 0) + float(net_pay))
            },
            
            # Status
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        
        self.employee_paychecks.append(paycheck)
        
        # Update payroll run totals
        self._update_run_totals(run_id, paycheck, employer_taxes)
        
        return paycheck
    
    def _calculate_earnings(self, employee_data: dict, pay_frequency: str) -> dict:
        """Calculate all earnings for an employee"""
        pay_rate = Decimal(str(employee_data.get("pay_rate", 0)))
        pay_type = employee_data.get("pay_type", "hourly")
        
        earnings = {
            "regular": Decimal("0.00"),
            "overtime": Decimal("0.00"),
            "double_time": Decimal("0.00"),
            "holiday": Decimal("0.00"),
            "pto": Decimal("0.00"),
            "sick": Decimal("0.00"),
            "bonus": Decimal("0.00"),
            "commission": Decimal("0.00"),
            "tips": Decimal("0.00"),
            "reimbursement": Decimal("0.00"),
            "other": Decimal("0.00"),
            "total": Decimal("0.00")
        }
        
        if pay_type == "hourly":
            # Regular pay
            regular_hours = Decimal(str(employee_data.get("regular_hours", 0)))
            earnings["regular"] = (regular_hours * pay_rate).quantize(Decimal("0.01"))
            
            # Overtime (1.5x)
            ot_hours = Decimal(str(employee_data.get("overtime_hours", 0)))
            earnings["overtime"] = (ot_hours * pay_rate * Decimal("1.5")).quantize(Decimal("0.01"))
            
            # Double time (2x)
            dt_hours = Decimal(str(employee_data.get("double_time_hours", 0)))
            earnings["double_time"] = (dt_hours * pay_rate * Decimal("2")).quantize(Decimal("0.01"))
            
            # Holiday pay (1.5x typically)
            holiday_hours = Decimal(str(employee_data.get("holiday_hours", 0)))
            earnings["holiday"] = (holiday_hours * pay_rate * Decimal("1.5")).quantize(Decimal("0.01"))
            
            # PTO (regular rate)
            pto_hours = Decimal(str(employee_data.get("pto_hours", 0)))
            earnings["pto"] = (pto_hours * pay_rate).quantize(Decimal("0.01"))
            
            # Sick pay
            sick_hours = Decimal(str(employee_data.get("sick_hours", 0)))
            earnings["sick"] = (sick_hours * pay_rate).quantize(Decimal("0.01"))
        
        elif pay_type == "salary":
            # Convert annual salary to per-period
            annual_salary = pay_rate
            periods_per_year = {
                PayFrequency.WEEKLY.value: 52,
                PayFrequency.BIWEEKLY.value: 26,
                PayFrequency.SEMIMONTHLY.value: 24,
                PayFrequency.MONTHLY.value: 12
            }
            periods = periods_per_year.get(pay_frequency, 26)
            earnings["regular"] = (annual_salary / Decimal(str(periods))).quantize(Decimal("0.01"))
        
        # Additional earnings
        earnings["bonus"] = Decimal(str(employee_data.get("bonus", 0)))
        earnings["commission"] = Decimal(str(employee_data.get("commission", 0)))
        earnings["tips"] = Decimal(str(employee_data.get("tips", 0)))
        earnings["reimbursement"] = Decimal(str(employee_data.get("reimbursement", 0)))
        earnings["other"] = Decimal(str(employee_data.get("other_earnings", 0)))
        
        # Calculate total
        earnings["total"] = sum(v for k, v in earnings.items() if k != "total")
        
        return earnings
    
    def _calculate_taxes(self, employee_data: dict, gross_pay: Decimal, 
                        payroll_run: dict) -> dict:
        """Calculate employee taxes"""
        taxes = {
            "federal": Decimal("0.00"),
            "state": Decimal("0.00"),
            "local": Decimal("0.00"),
            "social_security": Decimal("0.00"),
            "medicare": Decimal("0.00"),
            "additional_medicare": Decimal("0.00"),
            "state_disability": Decimal("0.00"),
            "state_unemployment": Decimal("0.00")
        }
        
        filing_status = employee_data.get("filing_status", "single")
        allowances = employee_data.get("allowances", 0)
        additional_withholding = Decimal(str(employee_data.get("additional_withholding", 0)))
        
        # Pre-tax deductions reduce taxable income
        pretax_deductions = Decimal(str(employee_data.get("pretax_deductions", 0)))
        taxable_income = gross_pay - pretax_deductions
        
        # Federal Income Tax (using percentage method)
        taxes["federal"] = self._calculate_federal_tax(
            taxable_income, filing_status, allowances, payroll_run["pay_frequency"]
        ) + additional_withholding
        
        # State Income Tax
        state = employee_data.get("work_state", "CA")
        taxes["state"] = self._calculate_state_tax(taxable_income, state, filing_status)
        
        # Local Tax
        if employee_data.get("local_tax_rate"):
            taxes["local"] = (taxable_income * Decimal(str(employee_data["local_tax_rate"]))).quantize(Decimal("0.01"))
        
        # Social Security (6.2% up to wage base)
        ytd_ss_wages = Decimal(str(employee_data.get("ytd_ss_wages", 0)))
        remaining_ss_wages = max(Decimal("0.00"), 
                                self.TAX_RATES["social_security_wage_base"] - ytd_ss_wages)
        ss_wages = min(gross_pay, remaining_ss_wages)
        taxes["social_security"] = (ss_wages * self.TAX_RATES["social_security_rate"]).quantize(Decimal("0.01"))
        
        # Medicare (1.45%)
        taxes["medicare"] = (gross_pay * self.TAX_RATES["medicare_rate"]).quantize(Decimal("0.01"))
        
        # Additional Medicare (0.9% over $200k)
        ytd_wages = Decimal(str(employee_data.get("ytd_gross", 0)))
        if ytd_wages + gross_pay > self.TAX_RATES["additional_medicare_threshold"]:
            additional_wages = max(Decimal("0.00"),
                                  (ytd_wages + gross_pay) - self.TAX_RATES["additional_medicare_threshold"])
            additional_wages = min(additional_wages, gross_pay)
            taxes["additional_medicare"] = (additional_wages * self.TAX_RATES["additional_medicare_rate"]).quantize(Decimal("0.01"))
        
        # State Disability Insurance (if applicable)
        if state in ["CA", "NJ", "NY", "RI", "HI"]:
            sdi_rates = {"CA": Decimal("0.009"), "NJ": Decimal("0.0014"), 
                        "NY": Decimal("0.005"), "RI": Decimal("0.011"), "HI": Decimal("0.005")}
            sdi_wage_base = Decimal("153164")  # CA 2024
            ytd_sdi_wages = Decimal(str(employee_data.get("ytd_sdi_wages", 0)))
            remaining_sdi = max(Decimal("0.00"), sdi_wage_base - ytd_sdi_wages)
            sdi_wages = min(gross_pay, remaining_sdi)
            taxes["state_disability"] = (sdi_wages * sdi_rates.get(state, Decimal("0"))).quantize(Decimal("0.01"))
        
        return taxes
    
    def _calculate_federal_tax(self, taxable_income: Decimal, filing_status: str,
                              allowances: int, pay_frequency: str) -> Decimal:
        """Calculate federal income tax withholding"""
        # Annualize the income
        periods_per_year = {
            PayFrequency.WEEKLY.value: 52,
            PayFrequency.BIWEEKLY.value: 26,
            PayFrequency.SEMIMONTHLY.value: 24,
            PayFrequency.MONTHLY.value: 12
        }
        periods = periods_per_year.get(pay_frequency, 26)
        annual_income = taxable_income * Decimal(str(periods))
        
        # Standard deduction 2024
        standard_deduction = Decimal("14600") if filing_status == "single" else Decimal("29200")
        
        # Allowance amount (simplified)
        allowance_amount = Decimal(str(allowances)) * Decimal("4300")
        
        # Taxable amount
        taxable_amount = max(Decimal("0.00"), annual_income - standard_deduction - allowance_amount)
        
        # Get brackets
        brackets = self.FEDERAL_BRACKETS_SINGLE if filing_status == "single" else self.FEDERAL_BRACKETS_MARRIED
        
        # Calculate tax
        annual_tax = Decimal("0.00")
        remaining = taxable_amount
        
        for lower, upper, rate in brackets:
            if remaining <= 0:
                break
            
            if upper is None:
                bracket_amount = remaining
            else:
                bracket_amount = min(remaining, upper - lower)
            
            annual_tax += bracket_amount * rate
            remaining -= bracket_amount
        
        # Convert back to per-period
        return (annual_tax / Decimal(str(periods))).quantize(Decimal("0.01"))
    
    def _calculate_state_tax(self, taxable_income: Decimal, state: str,
                            filing_status: str) -> Decimal:
        """Calculate state income tax (simplified)"""
        # This would use the state_payroll_rules service in production
        # Using flat rates for demonstration
        state_rates = {
            "CA": Decimal("0.0725"),
            "NY": Decimal("0.0685"),
            "TX": Decimal("0"),
            "FL": Decimal("0"),
            "WA": Decimal("0"),
            "IL": Decimal("0.0495"),
            "PA": Decimal("0.0307"),
            "OH": Decimal("0.04"),
            "GA": Decimal("0.055"),
            "NC": Decimal("0.0525")
        }
        
        rate = state_rates.get(state, Decimal("0.05"))
        return (taxable_income * rate).quantize(Decimal("0.01"))
    
    def _calculate_deductions(self, employee_data: dict, gross_pay: Decimal) -> dict:
        """Calculate all deductions"""
        deductions = {
            "health_insurance": Decimal(str(employee_data.get("health_insurance", 0))),
            "dental_insurance": Decimal(str(employee_data.get("dental_insurance", 0))),
            "vision_insurance": Decimal(str(employee_data.get("vision_insurance", 0))),
            "life_insurance": Decimal(str(employee_data.get("life_insurance", 0))),
            "disability_insurance": Decimal(str(employee_data.get("disability_insurance", 0))),
            "retirement_401k": Decimal("0.00"),
            "roth_401k": Decimal("0.00"),
            "hsa": Decimal(str(employee_data.get("hsa", 0))),
            "fsa": Decimal(str(employee_data.get("fsa", 0))),
            "garnishments": Decimal(str(employee_data.get("garnishments", 0))),
            "child_support": Decimal(str(employee_data.get("child_support", 0))),
            "union_dues": Decimal(str(employee_data.get("union_dues", 0))),
            "loan_repayment": Decimal(str(employee_data.get("loan_repayment", 0))),
            "other_pretax": Decimal(str(employee_data.get("other_pretax", 0))),
            "other_posttax": Decimal(str(employee_data.get("other_posttax", 0)))
        }
        
        # 401k (can be percentage or fixed)
        k401_type = employee_data.get("401k_type", "percentage")
        k401_value = Decimal(str(employee_data.get("401k_amount", 0)))
        
        if k401_type == "percentage":
            deductions["retirement_401k"] = (gross_pay * k401_value / 100).quantize(Decimal("0.01"))
        else:
            deductions["retirement_401k"] = k401_value
        
        # Check 401k limit ($23,000 in 2024, $30,500 if 50+)
        max_401k = Decimal("23000")
        if employee_data.get("age", 0) >= 50:
            max_401k = Decimal("30500")
        
        ytd_401k = Decimal(str(employee_data.get("ytd_401k", 0)))
        remaining_401k = max(Decimal("0.00"), max_401k - ytd_401k)
        deductions["retirement_401k"] = min(deductions["retirement_401k"], remaining_401k)
        
        # Roth 401k
        if employee_data.get("roth_401k_amount"):
            roth_type = employee_data.get("roth_401k_type", "percentage")
            roth_value = Decimal(str(employee_data.get("roth_401k_amount", 0)))
            
            if roth_type == "percentage":
                deductions["roth_401k"] = (gross_pay * roth_value / 100).quantize(Decimal("0.01"))
            else:
                deductions["roth_401k"] = roth_value
        
        return deductions
    
    def _calculate_employer_taxes(self, employee_data: dict, gross_pay: Decimal) -> dict:
        """Calculate employer-paid taxes"""
        employer_taxes = {
            "social_security": Decimal("0.00"),
            "medicare": Decimal("0.00"),
            "futa": Decimal("0.00"),
            "suta": Decimal("0.00")
        }
        
        # Employer Social Security (matching)
        ytd_ss_wages = Decimal(str(employee_data.get("ytd_ss_wages", 0)))
        remaining_ss = max(Decimal("0.00"), 
                         self.TAX_RATES["social_security_wage_base"] - ytd_ss_wages)
        ss_wages = min(gross_pay, remaining_ss)
        employer_taxes["social_security"] = (ss_wages * self.TAX_RATES["social_security_rate"]).quantize(Decimal("0.01"))
        
        # Employer Medicare (matching)
        employer_taxes["medicare"] = (gross_pay * self.TAX_RATES["medicare_rate"]).quantize(Decimal("0.01"))
        
        # FUTA (6% on first $7,000, but 5.4% credit typically)
        ytd_futa_wages = Decimal(str(employee_data.get("ytd_futa_wages", 0)))
        remaining_futa = max(Decimal("0.00"),
                           self.TAX_RATES["futa_wage_base"] - ytd_futa_wages)
        futa_wages = min(gross_pay, remaining_futa)
        employer_taxes["futa"] = (futa_wages * self.TAX_RATES["futa_rate"]).quantize(Decimal("0.01"))
        
        # SUTA (varies by state and employer experience rate)
        suta_rate = Decimal(str(employee_data.get("suta_rate", 0.027)))  # Default 2.7%
        suta_wage_base = Decimal(str(employee_data.get("suta_wage_base", 7000)))
        ytd_suta_wages = Decimal(str(employee_data.get("ytd_suta_wages", 0)))
        remaining_suta = max(Decimal("0.00"), suta_wage_base - ytd_suta_wages)
        suta_wages = min(gross_pay, remaining_suta)
        employer_taxes["suta"] = (suta_wages * suta_rate).quantize(Decimal("0.01"))
        
        return employer_taxes
    
    def _update_run_totals(self, run_id: str, paycheck: dict, employer_taxes: dict):
        """Update payroll run totals"""
        run = self.payroll_runs[run_id]
        
        run["totals"]["employee_count"] += 1
        run["totals"]["gross_pay"] += Decimal(str(paycheck["earnings"]["gross_pay"]))
        run["totals"]["total_taxes"] += Decimal(str(paycheck["taxes"]["total"]))
        run["totals"]["total_deductions"] += Decimal(str(paycheck["deductions"]["total"]))
        run["totals"]["net_pay"] += Decimal(str(paycheck["net_pay"]))
        run["totals"]["employer_taxes"] += sum(Decimal(str(v)) for v in employer_taxes.values())
        run["totals"]["total_cost"] = (run["totals"]["gross_pay"] + 
                                       run["totals"]["employer_taxes"])
        
        # Update tax totals
        run["tax_totals"]["federal_withheld"] += Decimal(str(paycheck["taxes"]["federal"]))
        run["tax_totals"]["state_withheld"] += Decimal(str(paycheck["taxes"]["state"]))
        run["tax_totals"]["local_withheld"] += Decimal(str(paycheck["taxes"]["local"]))
        run["tax_totals"]["employee_ss"] += Decimal(str(paycheck["taxes"]["social_security"]))
        run["tax_totals"]["employee_medicare"] += Decimal(str(paycheck["taxes"]["medicare"]))
        run["tax_totals"]["employer_ss"] += Decimal(str(employer_taxes.get("social_security", 0)))
        run["tax_totals"]["employer_medicare"] += Decimal(str(employer_taxes.get("medicare", 0)))
        run["tax_totals"]["futa"] += Decimal(str(employer_taxes.get("futa", 0)))
        run["tax_totals"]["suta"] += Decimal(str(employer_taxes.get("suta", 0)))
    
    def get_payroll_run(self, run_id: str) -> Optional[dict]:
        """Get payroll run by ID"""
        run = self.payroll_runs.get(run_id)
        if run:
            return self._sanitize_payroll_run(run)
        return None
    
    def get_payroll_runs(self, status: Optional[str] = None,
                        start_date: Optional[date] = None,
                        end_date: Optional[date] = None) -> List[dict]:
        """Get payroll runs with filters"""
        runs = list(self.payroll_runs.values())
        
        if status:
            runs = [r for r in runs if r["status"] == status]
        if start_date:
            runs = [r for r in runs 
                   if date.fromisoformat(r["pay_date"]) >= start_date]
        if end_date:
            runs = [r for r in runs 
                   if date.fromisoformat(r["pay_date"]) <= end_date]
        
        return [self._sanitize_payroll_run(r) for r in 
               sorted(runs, key=lambda x: x["pay_date"], reverse=True)]
    
    def get_paychecks_for_run(self, run_id: str) -> List[dict]:
        """Get all paychecks for a payroll run"""
        return [p for p in self.employee_paychecks if p["payroll_run_id"] == run_id]
    
    def submit_for_approval(self, run_id: str) -> dict:
        """Submit payroll for approval"""
        if run_id not in self.payroll_runs:
            raise ValueError(f"Payroll run {run_id} not found")
        
        run = self.payroll_runs[run_id]
        if run["status"] != PayrollStatus.DRAFT.value:
            raise ValueError(f"Can only submit draft payrolls")
        
        run["status"] = PayrollStatus.PENDING_APPROVAL.value
        run["updated_at"] = datetime.now().isoformat()
        
        return self._sanitize_payroll_run(run)
    
    def approve_payroll(self, run_id: str, approver_id: str) -> dict:
        """Approve payroll for processing"""
        if run_id not in self.payroll_runs:
            raise ValueError(f"Payroll run {run_id} not found")
        
        run = self.payroll_runs[run_id]
        if run["status"] != PayrollStatus.PENDING_APPROVAL.value:
            raise ValueError(f"Can only approve pending payrolls")
        
        run["status"] = PayrollStatus.APPROVED.value
        run["approved_by"] = approver_id
        run["updated_at"] = datetime.now().isoformat()
        
        return self._sanitize_payroll_run(run)
    
    def process_payroll(self, run_id: str) -> dict:
        """Process approved payroll (generate ACH, paystubs, etc.)"""
        if run_id not in self.payroll_runs:
            raise ValueError(f"Payroll run {run_id} not found")
        
        run = self.payroll_runs[run_id]
        if run["status"] != PayrollStatus.APPROVED.value:
            raise ValueError(f"Can only process approved payrolls")
        
        run["status"] = PayrollStatus.PROCESSING.value
        run["updated_at"] = datetime.now().isoformat()
        
        # In production, this would:
        # 1. Generate ACH file
        # 2. Create paystubs
        # 3. Update employee YTD totals
        # 4. Record tax liabilities
        # 5. Send notifications
        
        run["status"] = PayrollStatus.COMPLETED.value
        run["processed_at"] = datetime.now().isoformat()
        
        return self._sanitize_payroll_run(run)
    
    def cancel_payroll(self, run_id: str, reason: str) -> dict:
        """Cancel a payroll run"""
        if run_id not in self.payroll_runs:
            raise ValueError(f"Payroll run {run_id} not found")
        
        run = self.payroll_runs[run_id]
        if run["status"] in [PayrollStatus.COMPLETED.value, PayrollStatus.CANCELLED.value]:
            raise ValueError(f"Cannot cancel payroll with status: {run['status']}")
        
        run["status"] = PayrollStatus.CANCELLED.value
        run["cancellation_reason"] = reason
        run["updated_at"] = datetime.now().isoformat()
        
        return self._sanitize_payroll_run(run)


# Create singleton instance
payroll_run_service = SaurelliusPayrollRun("default")
