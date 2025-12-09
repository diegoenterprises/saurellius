"""
SAURELLIUS REPORTING & ANALYTICS SERVICE
Comprehensive payroll reports, analytics dashboards, and data exports
"""

from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from enum import Enum
import uuid


class ReportType(Enum):
    PAYROLL_SUMMARY = "payroll_summary"
    PAYROLL_REGISTER = "payroll_register"
    PAYROLL_JOURNAL = "payroll_journal"
    TAX_LIABILITY = "tax_liability"
    TAX_DEPOSIT = "tax_deposit"
    EMPLOYEE_EARNINGS = "employee_earnings"
    DEDUCTION_SUMMARY = "deduction_summary"
    BENEFIT_COST = "benefit_cost"
    LABOR_COST = "labor_cost"
    DEPARTMENT_SUMMARY = "department_summary"
    CONTRACTOR_PAYMENTS = "contractor_payments"
    PTO_BALANCE = "pto_balance"
    WORKERS_COMP = "workers_comp"
    GARNISHMENT_SUMMARY = "garnishment_summary"
    YTD_SUMMARY = "ytd_summary"
    QUARTERLY_941 = "quarterly_941"
    ANNUAL_W2 = "annual_w2"


class ExportFormat(Enum):
    PDF = "pdf"
    CSV = "csv"
    EXCEL = "excel"
    JSON = "json"


class SaurelliusReporting:
    """Comprehensive reporting and analytics engine"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.generated_reports: List[dict] = []
        self.scheduled_reports: List[dict] = []
        self.saved_report_configs: Dict[str, dict] = {}
    
    def generate_payroll_summary(self, start_date: date, end_date: date,
                                 payroll_data: List[dict]) -> dict:
        """Generate payroll summary report"""
        report_id = str(uuid.uuid4())
        
        # Aggregate data
        total_gross = Decimal("0.00")
        total_taxes = Decimal("0.00")
        total_deductions = Decimal("0.00")
        total_net = Decimal("0.00")
        total_employer_taxes = Decimal("0.00")
        employee_count = 0
        payroll_count = 0
        
        by_pay_type = {}
        by_department = {}
        
        for payroll in payroll_data:
            payroll_count += 1
            employee_count += payroll.get("employee_count", 0)
            
            total_gross += Decimal(str(payroll.get("gross_pay", 0)))
            total_taxes += Decimal(str(payroll.get("total_taxes", 0)))
            total_deductions += Decimal(str(payroll.get("total_deductions", 0)))
            total_net += Decimal(str(payroll.get("net_pay", 0)))
            total_employer_taxes += Decimal(str(payroll.get("employer_taxes", 0)))
            
            # By pay type
            pay_type = payroll.get("pay_type", "regular")
            if pay_type not in by_pay_type:
                by_pay_type[pay_type] = Decimal("0.00")
            by_pay_type[pay_type] += Decimal(str(payroll.get("gross_pay", 0)))
        
        report = {
            "id": report_id,
            "report_type": ReportType.PAYROLL_SUMMARY.value,
            "company_id": self.company_id,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "payroll_runs": payroll_count,
                "employees_paid": employee_count,
                "gross_pay": float(total_gross),
                "employee_taxes": float(total_taxes),
                "employee_deductions": float(total_deductions),
                "net_pay": float(total_net),
                "employer_taxes": float(total_employer_taxes),
                "total_payroll_cost": float(total_gross + total_employer_taxes)
            },
            "by_pay_type": {k: float(v) for k, v in by_pay_type.items()},
            "generated_at": datetime.now().isoformat()
        }
        
        self.generated_reports.append(report)
        return report
    
    def generate_payroll_register(self, payroll_run_id: str,
                                  paychecks: List[dict]) -> dict:
        """Generate detailed payroll register"""
        report_id = str(uuid.uuid4())
        
        register_entries = []
        totals = {
            "gross_pay": Decimal("0.00"),
            "federal_tax": Decimal("0.00"),
            "state_tax": Decimal("0.00"),
            "social_security": Decimal("0.00"),
            "medicare": Decimal("0.00"),
            "total_taxes": Decimal("0.00"),
            "total_deductions": Decimal("0.00"),
            "net_pay": Decimal("0.00")
        }
        
        for check in paychecks:
            entry = {
                "employee_id": check["employee_id"],
                "employee_name": check["employee_name"],
                "department": check.get("department", ""),
                "regular_hours": check["earnings"]["regular_hours"],
                "overtime_hours": check["earnings"]["overtime_hours"],
                "gross_pay": check["earnings"]["gross_pay"],
                "federal_tax": check["taxes"]["federal"],
                "state_tax": check["taxes"]["state"],
                "social_security": check["taxes"]["social_security"],
                "medicare": check["taxes"]["medicare"],
                "total_taxes": check["taxes"]["total"],
                "health_insurance": check["deductions"]["health_insurance"],
                "retirement_401k": check["deductions"]["retirement_401k"],
                "other_deductions": check["deductions"]["total"] - check["deductions"]["health_insurance"] - check["deductions"]["retirement_401k"],
                "total_deductions": check["deductions"]["total"],
                "net_pay": check["net_pay"],
                "payment_method": check.get("payment_method", "direct_deposit")
            }
            register_entries.append(entry)
            
            # Update totals
            for key in totals:
                if key in entry:
                    totals[key] += Decimal(str(entry[key]))
        
        report = {
            "id": report_id,
            "report_type": ReportType.PAYROLL_REGISTER.value,
            "payroll_run_id": payroll_run_id,
            "company_id": self.company_id,
            "entries": register_entries,
            "totals": {k: float(v) for k, v in totals.items()},
            "employee_count": len(register_entries),
            "generated_at": datetime.now().isoformat()
        }
        
        self.generated_reports.append(report)
        return report
    
    def generate_tax_liability_report(self, quarter: int, year: int,
                                     tax_data: dict) -> dict:
        """Generate quarterly tax liability report"""
        report_id = str(uuid.uuid4())
        
        report = {
            "id": report_id,
            "report_type": ReportType.TAX_LIABILITY.value,
            "company_id": self.company_id,
            "period": {
                "quarter": quarter,
                "year": year
            },
            "federal_liability": {
                "federal_income_tax": tax_data.get("federal_withheld", 0),
                "employee_social_security": tax_data.get("employee_ss", 0),
                "employer_social_security": tax_data.get("employer_ss", 0),
                "employee_medicare": tax_data.get("employee_medicare", 0),
                "employer_medicare": tax_data.get("employer_medicare", 0),
                "total_941": tax_data.get("total_941", 0)
            },
            "futa_liability": {
                "futa_wages": tax_data.get("futa_wages", 0),
                "futa_tax": tax_data.get("futa_tax", 0)
            },
            "state_liability": {
                "state_income_tax": tax_data.get("state_withheld", 0),
                "suta_tax": tax_data.get("suta_tax", 0),
                "sdi_tax": tax_data.get("sdi_tax", 0)
            },
            "deposits_made": tax_data.get("deposits", []),
            "balance_due": tax_data.get("balance_due", 0),
            "due_dates": {
                "941": self._get_941_due_date(year, quarter),
                "state": self._get_state_due_date(year, quarter)
            },
            "generated_at": datetime.now().isoformat()
        }
        
        self.generated_reports.append(report)
        return report
    
    def _get_941_due_date(self, year: int, quarter: int) -> str:
        """Get Form 941 due date"""
        due_dates = {
            1: f"{year}-04-30",
            2: f"{year}-07-31",
            3: f"{year}-10-31",
            4: f"{year + 1}-01-31"
        }
        return due_dates[quarter]
    
    def _get_state_due_date(self, year: int, quarter: int) -> str:
        """Get state filing due date"""
        return self._get_941_due_date(year, quarter)  # Most states follow 941 schedule
    
    def generate_employee_earnings_report(self, employee_id: str,
                                          year: int, earnings_data: List[dict]) -> dict:
        """Generate employee earnings history report"""
        report_id = str(uuid.uuid4())
        
        totals = {
            "regular_pay": Decimal("0.00"),
            "overtime_pay": Decimal("0.00"),
            "bonus": Decimal("0.00"),
            "commission": Decimal("0.00"),
            "gross_pay": Decimal("0.00"),
            "federal_tax": Decimal("0.00"),
            "state_tax": Decimal("0.00"),
            "social_security": Decimal("0.00"),
            "medicare": Decimal("0.00"),
            "net_pay": Decimal("0.00")
        }
        
        monthly_breakdown = {}
        
        for earning in earnings_data:
            pay_date = earning.get("pay_date", "")
            if pay_date:
                month = pay_date[:7]
                if month not in monthly_breakdown:
                    monthly_breakdown[month] = {k: Decimal("0.00") for k in totals}
                
                for key in totals:
                    value = Decimal(str(earning.get(key, 0)))
                    totals[key] += value
                    monthly_breakdown[month][key] += value
        
        report = {
            "id": report_id,
            "report_type": ReportType.EMPLOYEE_EARNINGS.value,
            "company_id": self.company_id,
            "employee_id": employee_id,
            "year": year,
            "totals": {k: float(v) for k, v in totals.items()},
            "monthly_breakdown": {
                month: {k: float(v) for k, v in data.items()}
                for month, data in sorted(monthly_breakdown.items())
            },
            "pay_count": len(earnings_data),
            "generated_at": datetime.now().isoformat()
        }
        
        self.generated_reports.append(report)
        return report
    
    def generate_department_summary(self, start_date: date, end_date: date,
                                   department_data: Dict[str, List[dict]]) -> dict:
        """Generate department-level payroll summary"""
        report_id = str(uuid.uuid4())
        
        departments = []
        grand_total = Decimal("0.00")
        
        for dept_name, employees in department_data.items():
            dept_total = sum(Decimal(str(e.get("gross_pay", 0))) for e in employees)
            dept_headcount = len(employees)
            
            departments.append({
                "department": dept_name,
                "headcount": dept_headcount,
                "total_payroll": float(dept_total),
                "average_pay": float(dept_total / dept_headcount) if dept_headcount > 0 else 0,
                "percentage": 0  # Will calculate after
            })
            grand_total += dept_total
        
        # Calculate percentages
        for dept in departments:
            if grand_total > 0:
                dept["percentage"] = round(Decimal(str(dept["total_payroll"])) / grand_total * 100, 2)
        
        report = {
            "id": report_id,
            "report_type": ReportType.DEPARTMENT_SUMMARY.value,
            "company_id": self.company_id,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "departments": sorted(departments, key=lambda x: x["total_payroll"], reverse=True),
            "grand_total": float(grand_total),
            "total_headcount": sum(d["headcount"] for d in departments),
            "generated_at": datetime.now().isoformat()
        }
        
        self.generated_reports.append(report)
        return report
    
    def generate_labor_cost_report(self, start_date: date, end_date: date,
                                  labor_data: dict) -> dict:
        """Generate labor cost analysis report"""
        report_id = str(uuid.uuid4())
        
        report = {
            "id": report_id,
            "report_type": ReportType.LABOR_COST.value,
            "company_id": self.company_id,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "direct_labor": {
                "wages": labor_data.get("wages", 0),
                "salaries": labor_data.get("salaries", 0),
                "overtime": labor_data.get("overtime", 0),
                "bonuses": labor_data.get("bonuses", 0),
                "commissions": labor_data.get("commissions", 0),
                "total": labor_data.get("total_direct", 0)
            },
            "employer_costs": {
                "fica_match": labor_data.get("fica_match", 0),
                "futa": labor_data.get("futa", 0),
                "suta": labor_data.get("suta", 0),
                "health_insurance": labor_data.get("health_insurance", 0),
                "retirement_match": labor_data.get("retirement_match", 0),
                "workers_comp": labor_data.get("workers_comp", 0),
                "other_benefits": labor_data.get("other_benefits", 0),
                "total": labor_data.get("total_employer", 0)
            },
            "total_labor_cost": labor_data.get("total_labor_cost", 0),
            "per_employee_average": labor_data.get("per_employee_avg", 0),
            "cost_per_hour": labor_data.get("cost_per_hour", 0),
            "comparison": {
                "vs_prior_period": labor_data.get("vs_prior_period", 0),
                "vs_budget": labor_data.get("vs_budget", 0)
            },
            "generated_at": datetime.now().isoformat()
        }
        
        self.generated_reports.append(report)
        return report
    
    def generate_pto_balance_report(self, as_of_date: date,
                                   pto_data: List[dict]) -> dict:
        """Generate PTO balance report"""
        report_id = str(uuid.uuid4())
        
        total_liability = Decimal("0.00")
        employees = []
        
        for emp in pto_data:
            emp_total = Decimal(str(emp.get("vacation_balance", 0))) + \
                       Decimal(str(emp.get("sick_balance", 0))) + \
                       Decimal(str(emp.get("personal_balance", 0)))
            
            # Calculate liability (hours * hourly rate)
            hourly_rate = Decimal(str(emp.get("hourly_rate", 0)))
            emp_liability = emp_total * hourly_rate
            total_liability += emp_liability
            
            employees.append({
                "employee_id": emp["employee_id"],
                "employee_name": emp["employee_name"],
                "vacation_balance": emp.get("vacation_balance", 0),
                "sick_balance": emp.get("sick_balance", 0),
                "personal_balance": emp.get("personal_balance", 0),
                "total_hours": float(emp_total),
                "liability": float(emp_liability)
            })
        
        report = {
            "id": report_id,
            "report_type": ReportType.PTO_BALANCE.value,
            "company_id": self.company_id,
            "as_of_date": as_of_date.isoformat(),
            "employees": sorted(employees, key=lambda x: x["total_hours"], reverse=True),
            "summary": {
                "total_employees": len(employees),
                "total_vacation_hours": sum(e["vacation_balance"] for e in employees),
                "total_sick_hours": sum(e["sick_balance"] for e in employees),
                "total_personal_hours": sum(e["personal_balance"] for e in employees),
                "total_liability": float(total_liability)
            },
            "generated_at": datetime.now().isoformat()
        }
        
        self.generated_reports.append(report)
        return report
    
    def generate_analytics_dashboard(self, year: int) -> dict:
        """Generate analytics dashboard data"""
        # This would aggregate data from various sources
        return {
            "company_id": self.company_id,
            "year": year,
            "kpis": {
                "total_payroll_ytd": 0,
                "employee_count": 0,
                "average_salary": 0,
                "turnover_rate": 0,
                "overtime_percentage": 0,
                "benefits_cost_ratio": 0
            },
            "trends": {
                "monthly_payroll": [],
                "headcount_trend": [],
                "overtime_trend": []
            },
            "comparisons": {
                "vs_prior_year": 0,
                "vs_budget": 0
            },
            "generated_at": datetime.now().isoformat()
        }
    
    def schedule_report(self, report_type: str, frequency: str,
                       recipients: List[str], config: dict) -> dict:
        """Schedule a recurring report"""
        schedule_id = str(uuid.uuid4())
        
        schedule = {
            "id": schedule_id,
            "company_id": self.company_id,
            "report_type": report_type,
            "frequency": frequency,  # daily, weekly, monthly, quarterly
            "recipients": recipients,
            "config": config,
            "format": config.get("format", ExportFormat.PDF.value),
            "is_active": True,
            "next_run": self._calculate_next_run(frequency),
            "last_run": None,
            "created_at": datetime.now().isoformat()
        }
        
        self.scheduled_reports.append(schedule)
        return schedule
    
    def _calculate_next_run(self, frequency: str) -> str:
        """Calculate next run date for scheduled report"""
        today = date.today()
        
        if frequency == "daily":
            next_run = today + timedelta(days=1)
        elif frequency == "weekly":
            next_run = today + timedelta(days=(7 - today.weekday()))  # Next Monday
        elif frequency == "monthly":
            if today.month == 12:
                next_run = date(today.year + 1, 1, 1)
            else:
                next_run = date(today.year, today.month + 1, 1)
        elif frequency == "quarterly":
            quarter = (today.month - 1) // 3 + 1
            if quarter == 4:
                next_run = date(today.year + 1, 1, 1)
            else:
                next_run = date(today.year, quarter * 3 + 1, 1)
        else:
            next_run = today + timedelta(days=1)
        
        return next_run.isoformat()
    
    def export_report(self, report_id: str, format: str) -> dict:
        """Export report in specified format"""
        report = next((r for r in self.generated_reports if r["id"] == report_id), None)
        if not report:
            raise ValueError(f"Report {report_id} not found")
        
        # In production, this would generate actual file
        return {
            "report_id": report_id,
            "format": format,
            "download_url": f"/api/reports/{report_id}/download/{format}",
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }
    
    def get_report(self, report_id: str) -> Optional[dict]:
        """Get report by ID"""
        return next((r for r in self.generated_reports if r["id"] == report_id), None)
    
    def get_reports(self, report_type: Optional[str] = None,
                   start_date: Optional[date] = None) -> List[dict]:
        """Get reports with filters"""
        reports = self.generated_reports.copy()
        
        if report_type:
            reports = [r for r in reports if r["report_type"] == report_type]
        if start_date:
            reports = [r for r in reports 
                      if datetime.fromisoformat(r["generated_at"]).date() >= start_date]
        
        return sorted(reports, key=lambda x: x["generated_at"], reverse=True)


# Create singleton instance
reporting_service = SaurelliusReporting("default")
