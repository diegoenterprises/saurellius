"""
SAURELLIUS ACCOUNTING SERVICE
General Ledger, Chart of Accounts, Journal Entries
Full double-entry accounting system for payroll integration
"""

from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from enum import Enum
import uuid


class AccountType(Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class AccountCategory(Enum):
    # Assets
    CASH = "cash"
    BANK = "bank"
    ACCOUNTS_RECEIVABLE = "accounts_receivable"
    PREPAID_EXPENSES = "prepaid_expenses"
    # Liabilities
    ACCOUNTS_PAYABLE = "accounts_payable"
    PAYROLL_LIABILITIES = "payroll_liabilities"
    TAX_LIABILITIES = "tax_liabilities"
    ACCRUED_EXPENSES = "accrued_expenses"
    # Equity
    RETAINED_EARNINGS = "retained_earnings"
    OWNER_EQUITY = "owner_equity"
    # Revenue
    SALES_REVENUE = "sales_revenue"
    SERVICE_REVENUE = "service_revenue"
    # Expenses
    PAYROLL_EXPENSE = "payroll_expense"
    TAX_EXPENSE = "tax_expense"
    BENEFITS_EXPENSE = "benefits_expense"
    OPERATING_EXPENSE = "operating_expense"


class SaurelliusAccounting:
    """Complete accounting system with double-entry bookkeeping"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.accounts: Dict[str, dict] = {}
        self.journal_entries: List[dict] = []
        self.fiscal_year_start = date(date.today().year, 1, 1)
        self._initialize_chart_of_accounts()
    
    def _initialize_chart_of_accounts(self):
        """Initialize standard chart of accounts for payroll"""
        default_accounts = [
            # Assets (1000-1999)
            {"code": "1000", "name": "Cash", "type": AccountType.ASSET, "category": AccountCategory.CASH},
            {"code": "1010", "name": "Payroll Checking", "type": AccountType.ASSET, "category": AccountCategory.BANK},
            {"code": "1020", "name": "Operating Checking", "type": AccountType.ASSET, "category": AccountCategory.BANK},
            {"code": "1100", "name": "Accounts Receivable", "type": AccountType.ASSET, "category": AccountCategory.ACCOUNTS_RECEIVABLE},
            {"code": "1200", "name": "Prepaid Insurance", "type": AccountType.ASSET, "category": AccountCategory.PREPAID_EXPENSES},
            {"code": "1210", "name": "Prepaid Benefits", "type": AccountType.ASSET, "category": AccountCategory.PREPAID_EXPENSES},
            
            # Liabilities (2000-2999)
            {"code": "2000", "name": "Accounts Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCOUNTS_PAYABLE},
            {"code": "2100", "name": "Wages Payable", "type": AccountType.LIABILITY, "category": AccountCategory.PAYROLL_LIABILITIES},
            {"code": "2110", "name": "Salaries Payable", "type": AccountType.LIABILITY, "category": AccountCategory.PAYROLL_LIABILITIES},
            {"code": "2120", "name": "Bonus Payable", "type": AccountType.LIABILITY, "category": AccountCategory.PAYROLL_LIABILITIES},
            {"code": "2130", "name": "Commission Payable", "type": AccountType.LIABILITY, "category": AccountCategory.PAYROLL_LIABILITIES},
            {"code": "2200", "name": "Federal Income Tax Payable", "type": AccountType.LIABILITY, "category": AccountCategory.TAX_LIABILITIES},
            {"code": "2210", "name": "State Income Tax Payable", "type": AccountType.LIABILITY, "category": AccountCategory.TAX_LIABILITIES},
            {"code": "2220", "name": "Local Income Tax Payable", "type": AccountType.LIABILITY, "category": AccountCategory.TAX_LIABILITIES},
            {"code": "2230", "name": "Social Security Tax Payable", "type": AccountType.LIABILITY, "category": AccountCategory.TAX_LIABILITIES},
            {"code": "2240", "name": "Medicare Tax Payable", "type": AccountType.LIABILITY, "category": AccountCategory.TAX_LIABILITIES},
            {"code": "2250", "name": "FUTA Payable", "type": AccountType.LIABILITY, "category": AccountCategory.TAX_LIABILITIES},
            {"code": "2260", "name": "SUTA Payable", "type": AccountType.LIABILITY, "category": AccountCategory.TAX_LIABILITIES},
            {"code": "2300", "name": "Health Insurance Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2310", "name": "Dental Insurance Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2320", "name": "Vision Insurance Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2330", "name": "401(k) Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2340", "name": "HSA Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2350", "name": "FSA Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2400", "name": "Garnishments Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2410", "name": "Child Support Payable", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2500", "name": "Accrued PTO Liability", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2510", "name": "Accrued Vacation Liability", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            {"code": "2520", "name": "Accrued Sick Leave Liability", "type": AccountType.LIABILITY, "category": AccountCategory.ACCRUED_EXPENSES},
            
            # Equity (3000-3999)
            {"code": "3000", "name": "Owner's Equity", "type": AccountType.EQUITY, "category": AccountCategory.OWNER_EQUITY},
            {"code": "3100", "name": "Retained Earnings", "type": AccountType.EQUITY, "category": AccountCategory.RETAINED_EARNINGS},
            {"code": "3200", "name": "Current Year Earnings", "type": AccountType.EQUITY, "category": AccountCategory.RETAINED_EARNINGS},
            
            # Revenue (4000-4999)
            {"code": "4000", "name": "Sales Revenue", "type": AccountType.REVENUE, "category": AccountCategory.SALES_REVENUE},
            {"code": "4100", "name": "Service Revenue", "type": AccountType.REVENUE, "category": AccountCategory.SERVICE_REVENUE},
            
            # Expenses (5000-6999)
            {"code": "5000", "name": "Wages Expense", "type": AccountType.EXPENSE, "category": AccountCategory.PAYROLL_EXPENSE},
            {"code": "5010", "name": "Salaries Expense", "type": AccountType.EXPENSE, "category": AccountCategory.PAYROLL_EXPENSE},
            {"code": "5020", "name": "Overtime Expense", "type": AccountType.EXPENSE, "category": AccountCategory.PAYROLL_EXPENSE},
            {"code": "5030", "name": "Bonus Expense", "type": AccountType.EXPENSE, "category": AccountCategory.PAYROLL_EXPENSE},
            {"code": "5040", "name": "Commission Expense", "type": AccountType.EXPENSE, "category": AccountCategory.PAYROLL_EXPENSE},
            {"code": "5050", "name": "Contractor Expense", "type": AccountType.EXPENSE, "category": AccountCategory.PAYROLL_EXPENSE},
            {"code": "5100", "name": "Employer FICA Expense", "type": AccountType.EXPENSE, "category": AccountCategory.TAX_EXPENSE},
            {"code": "5110", "name": "Employer Medicare Expense", "type": AccountType.EXPENSE, "category": AccountCategory.TAX_EXPENSE},
            {"code": "5120", "name": "FUTA Expense", "type": AccountType.EXPENSE, "category": AccountCategory.TAX_EXPENSE},
            {"code": "5130", "name": "SUTA Expense", "type": AccountType.EXPENSE, "category": AccountCategory.TAX_EXPENSE},
            {"code": "5200", "name": "Health Insurance Expense", "type": AccountType.EXPENSE, "category": AccountCategory.BENEFITS_EXPENSE},
            {"code": "5210", "name": "Dental Insurance Expense", "type": AccountType.EXPENSE, "category": AccountCategory.BENEFITS_EXPENSE},
            {"code": "5220", "name": "Vision Insurance Expense", "type": AccountType.EXPENSE, "category": AccountCategory.BENEFITS_EXPENSE},
            {"code": "5230", "name": "Life Insurance Expense", "type": AccountType.EXPENSE, "category": AccountCategory.BENEFITS_EXPENSE},
            {"code": "5240", "name": "Disability Insurance Expense", "type": AccountType.EXPENSE, "category": AccountCategory.BENEFITS_EXPENSE},
            {"code": "5250", "name": "401(k) Employer Match", "type": AccountType.EXPENSE, "category": AccountCategory.BENEFITS_EXPENSE},
            {"code": "5260", "name": "HSA Employer Contribution", "type": AccountType.EXPENSE, "category": AccountCategory.BENEFITS_EXPENSE},
            {"code": "5300", "name": "Workers Compensation Expense", "type": AccountType.EXPENSE, "category": AccountCategory.BENEFITS_EXPENSE},
            {"code": "5400", "name": "PTO Expense", "type": AccountType.EXPENSE, "category": AccountCategory.PAYROLL_EXPENSE},
            {"code": "6000", "name": "Rent Expense", "type": AccountType.EXPENSE, "category": AccountCategory.OPERATING_EXPENSE},
            {"code": "6100", "name": "Utilities Expense", "type": AccountType.EXPENSE, "category": AccountCategory.OPERATING_EXPENSE},
            {"code": "6200", "name": "Office Supplies Expense", "type": AccountType.EXPENSE, "category": AccountCategory.OPERATING_EXPENSE},
        ]
        
        for account in default_accounts:
            self.accounts[account["code"]] = {
                "code": account["code"],
                "name": account["name"],
                "type": account["type"].value,
                "category": account["category"].value,
                "balance": Decimal("0.00"),
                "created_at": datetime.now().isoformat(),
                "is_active": True
            }
    
    def create_account(self, code: str, name: str, account_type: AccountType, 
                       category: AccountCategory, parent_code: Optional[str] = None) -> dict:
        """Create a new account in the chart of accounts"""
        if code in self.accounts:
            raise ValueError(f"Account code {code} already exists")
        
        account = {
            "code": code,
            "name": name,
            "type": account_type.value,
            "category": category.value,
            "parent_code": parent_code,
            "balance": Decimal("0.00"),
            "created_at": datetime.now().isoformat(),
            "is_active": True
        }
        self.accounts[code] = account
        return account
    
    def get_account(self, code: str) -> Optional[dict]:
        """Get account by code"""
        return self.accounts.get(code)
    
    def get_chart_of_accounts(self, account_type: Optional[AccountType] = None) -> List[dict]:
        """Get full chart of accounts, optionally filtered by type"""
        accounts = list(self.accounts.values())
        if account_type:
            accounts = [a for a in accounts if a["type"] == account_type.value]
        return sorted(accounts, key=lambda x: x["code"])
    
    def create_journal_entry(self, entry_date: date, description: str, 
                            lines: List[dict], reference: Optional[str] = None,
                            source: str = "manual") -> dict:
        """
        Create a journal entry with multiple debit/credit lines.
        Lines format: [{"account_code": "5000", "debit": 1000.00, "credit": 0.00, "memo": ""}]
        """
        entry_id = str(uuid.uuid4())
        
        # Validate debits equal credits
        total_debits = sum(Decimal(str(line.get("debit", 0))) for line in lines)
        total_credits = sum(Decimal(str(line.get("credit", 0))) for line in lines)
        
        if total_debits != total_credits:
            raise ValueError(f"Debits ({total_debits}) must equal credits ({total_credits})")
        
        # Validate all accounts exist
        for line in lines:
            if line["account_code"] not in self.accounts:
                raise ValueError(f"Account {line['account_code']} does not exist")
        
        # Create entry
        entry = {
            "id": entry_id,
            "entry_number": len(self.journal_entries) + 1,
            "date": entry_date.isoformat(),
            "description": description,
            "reference": reference,
            "source": source,
            "lines": [],
            "total_amount": float(total_debits),
            "status": "posted",
            "created_at": datetime.now().isoformat(),
            "posted_at": datetime.now().isoformat()
        }
        
        # Process lines and update account balances
        for line in lines:
            account = self.accounts[line["account_code"]]
            debit = Decimal(str(line.get("debit", 0)))
            credit = Decimal(str(line.get("credit", 0)))
            
            # Update balance based on account type
            if account["type"] in ["asset", "expense"]:
                account["balance"] += debit - credit
            else:  # liability, equity, revenue
                account["balance"] += credit - debit
            
            entry["lines"].append({
                "account_code": line["account_code"],
                "account_name": account["name"],
                "debit": float(debit),
                "credit": float(credit),
                "memo": line.get("memo", "")
            })
        
        self.journal_entries.append(entry)
        return entry
    
    def create_payroll_journal_entry(self, payroll_data: dict) -> dict:
        """
        Create journal entries for a payroll run.
        Automatically debits expenses and credits liabilities.
        """
        lines = []
        
        # Gross wages expense
        if payroll_data.get("gross_wages", 0) > 0:
            lines.append({
                "account_code": "5000",
                "debit": payroll_data["gross_wages"],
                "credit": 0,
                "memo": "Gross wages"
            })
        
        # Salary expense
        if payroll_data.get("salaries", 0) > 0:
            lines.append({
                "account_code": "5010",
                "debit": payroll_data["salaries"],
                "credit": 0,
                "memo": "Salaries"
            })
        
        # Overtime expense
        if payroll_data.get("overtime", 0) > 0:
            lines.append({
                "account_code": "5020",
                "debit": payroll_data["overtime"],
                "credit": 0,
                "memo": "Overtime pay"
            })
        
        # Bonus expense
        if payroll_data.get("bonus", 0) > 0:
            lines.append({
                "account_code": "5030",
                "debit": payroll_data["bonus"],
                "credit": 0,
                "memo": "Bonus payments"
            })
        
        # Employer FICA
        if payroll_data.get("employer_social_security", 0) > 0:
            lines.append({
                "account_code": "5100",
                "debit": payroll_data["employer_social_security"],
                "credit": 0,
                "memo": "Employer Social Security"
            })
        
        # Employer Medicare
        if payroll_data.get("employer_medicare", 0) > 0:
            lines.append({
                "account_code": "5110",
                "debit": payroll_data["employer_medicare"],
                "credit": 0,
                "memo": "Employer Medicare"
            })
        
        # FUTA
        if payroll_data.get("futa", 0) > 0:
            lines.append({
                "account_code": "5120",
                "debit": payroll_data["futa"],
                "credit": 0,
                "memo": "FUTA tax"
            })
        
        # SUTA
        if payroll_data.get("suta", 0) > 0:
            lines.append({
                "account_code": "5130",
                "debit": payroll_data["suta"],
                "credit": 0,
                "memo": "SUTA tax"
            })
        
        # Health insurance employer portion
        if payroll_data.get("employer_health_insurance", 0) > 0:
            lines.append({
                "account_code": "5200",
                "debit": payroll_data["employer_health_insurance"],
                "credit": 0,
                "memo": "Employer health insurance"
            })
        
        # 401k match
        if payroll_data.get("employer_401k_match", 0) > 0:
            lines.append({
                "account_code": "5250",
                "debit": payroll_data["employer_401k_match"],
                "credit": 0,
                "memo": "401(k) employer match"
            })
        
        # Credits - Liabilities
        
        # Net pay to payroll bank
        if payroll_data.get("net_pay", 0) > 0:
            lines.append({
                "account_code": "1010",
                "debit": 0,
                "credit": payroll_data["net_pay"],
                "memo": "Net pay disbursement"
            })
        
        # Federal tax withholding
        if payroll_data.get("federal_tax_withheld", 0) > 0:
            lines.append({
                "account_code": "2200",
                "debit": 0,
                "credit": payroll_data["federal_tax_withheld"],
                "memo": "Federal income tax withheld"
            })
        
        # State tax withholding
        if payroll_data.get("state_tax_withheld", 0) > 0:
            lines.append({
                "account_code": "2210",
                "debit": 0,
                "credit": payroll_data["state_tax_withheld"],
                "memo": "State income tax withheld"
            })
        
        # Social Security withholding (employee + employer)
        ss_total = payroll_data.get("employee_social_security", 0) + payroll_data.get("employer_social_security", 0)
        if ss_total > 0:
            lines.append({
                "account_code": "2230",
                "debit": 0,
                "credit": ss_total,
                "memo": "Social Security tax payable"
            })
        
        # Medicare withholding (employee + employer)
        med_total = payroll_data.get("employee_medicare", 0) + payroll_data.get("employer_medicare", 0)
        if med_total > 0:
            lines.append({
                "account_code": "2240",
                "debit": 0,
                "credit": med_total,
                "memo": "Medicare tax payable"
            })
        
        # FUTA payable
        if payroll_data.get("futa", 0) > 0:
            lines.append({
                "account_code": "2250",
                "debit": 0,
                "credit": payroll_data["futa"],
                "memo": "FUTA payable"
            })
        
        # SUTA payable
        if payroll_data.get("suta", 0) > 0:
            lines.append({
                "account_code": "2260",
                "debit": 0,
                "credit": payroll_data["suta"],
                "memo": "SUTA payable"
            })
        
        # Health insurance payable
        health_total = payroll_data.get("employee_health_insurance", 0) + payroll_data.get("employer_health_insurance", 0)
        if health_total > 0:
            lines.append({
                "account_code": "2300",
                "debit": 0,
                "credit": health_total,
                "memo": "Health insurance payable"
            })
        
        # 401k payable
        k401_total = payroll_data.get("employee_401k", 0) + payroll_data.get("employer_401k_match", 0)
        if k401_total > 0:
            lines.append({
                "account_code": "2330",
                "debit": 0,
                "credit": k401_total,
                "memo": "401(k) payable"
            })
        
        # Garnishments
        if payroll_data.get("garnishments", 0) > 0:
            lines.append({
                "account_code": "2400",
                "debit": 0,
                "credit": payroll_data["garnishments"],
                "memo": "Garnishments payable"
            })
        
        return self.create_journal_entry(
            entry_date=date.fromisoformat(payroll_data.get("pay_date", date.today().isoformat())),
            description=f"Payroll - {payroll_data.get('pay_period', 'Current Period')}",
            lines=lines,
            reference=payroll_data.get("payroll_id"),
            source="payroll"
        )
    
    def get_journal_entries(self, start_date: Optional[date] = None, 
                           end_date: Optional[date] = None,
                           source: Optional[str] = None) -> List[dict]:
        """Get journal entries with optional filters"""
        entries = self.journal_entries.copy()
        
        if start_date:
            entries = [e for e in entries if date.fromisoformat(e["date"]) >= start_date]
        if end_date:
            entries = [e for e in entries if date.fromisoformat(e["date"]) <= end_date]
        if source:
            entries = [e for e in entries if e["source"] == source]
        
        return sorted(entries, key=lambda x: x["date"], reverse=True)
    
    def get_account_ledger(self, account_code: str, start_date: Optional[date] = None,
                          end_date: Optional[date] = None) -> dict:
        """Get ledger details for a specific account"""
        account = self.accounts.get(account_code)
        if not account:
            raise ValueError(f"Account {account_code} not found")
        
        transactions = []
        running_balance = Decimal("0.00")
        
        for entry in self.journal_entries:
            entry_date = date.fromisoformat(entry["date"])
            if start_date and entry_date < start_date:
                continue
            if end_date and entry_date > end_date:
                continue
            
            for line in entry["lines"]:
                if line["account_code"] == account_code:
                    debit = Decimal(str(line["debit"]))
                    credit = Decimal(str(line["credit"]))
                    
                    if account["type"] in ["asset", "expense"]:
                        running_balance += debit - credit
                    else:
                        running_balance += credit - debit
                    
                    transactions.append({
                        "date": entry["date"],
                        "description": entry["description"],
                        "reference": entry["reference"],
                        "debit": float(debit),
                        "credit": float(credit),
                        "balance": float(running_balance)
                    })
        
        return {
            "account": account,
            "transactions": transactions,
            "ending_balance": float(running_balance)
        }
    
    def get_trial_balance(self, as_of_date: Optional[date] = None) -> dict:
        """Generate trial balance report"""
        if not as_of_date:
            as_of_date = date.today()
        
        trial_balance = {
            "as_of_date": as_of_date.isoformat(),
            "accounts": [],
            "total_debits": 0,
            "total_credits": 0
        }
        
        for code, account in sorted(self.accounts.items()):
            balance = float(account["balance"])
            if balance == 0:
                continue
            
            debit = balance if account["type"] in ["asset", "expense"] else 0
            credit = abs(balance) if account["type"] in ["liability", "equity", "revenue"] else 0
            
            if balance < 0:
                debit, credit = credit, debit
            
            trial_balance["accounts"].append({
                "code": code,
                "name": account["name"],
                "type": account["type"],
                "debit": debit if debit > 0 else 0,
                "credit": credit if credit > 0 else 0
            })
            
            trial_balance["total_debits"] += debit if debit > 0 else 0
            trial_balance["total_credits"] += credit if credit > 0 else 0
        
        return trial_balance
    
    def get_income_statement(self, start_date: date, end_date: date) -> dict:
        """Generate income statement (P&L) for a period"""
        revenue_accounts = [a for a in self.accounts.values() if a["type"] == "revenue"]
        expense_accounts = [a for a in self.accounts.values() if a["type"] == "expense"]
        
        total_revenue = sum(float(a["balance"]) for a in revenue_accounts)
        total_expenses = sum(float(a["balance"]) for a in expense_accounts)
        net_income = total_revenue - total_expenses
        
        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "revenue": {
                "accounts": [{"code": a["code"], "name": a["name"], "amount": float(a["balance"])} 
                           for a in revenue_accounts if a["balance"] != 0],
                "total": total_revenue
            },
            "expenses": {
                "accounts": [{"code": a["code"], "name": a["name"], "amount": float(a["balance"])} 
                           for a in expense_accounts if a["balance"] != 0],
                "total": total_expenses
            },
            "net_income": net_income,
            "payroll_expense_breakdown": self._get_payroll_expense_breakdown()
        }
    
    def _get_payroll_expense_breakdown(self) -> dict:
        """Get detailed breakdown of payroll expenses"""
        payroll_codes = ["5000", "5010", "5020", "5030", "5040", "5050",
                        "5100", "5110", "5120", "5130",
                        "5200", "5210", "5220", "5230", "5240", "5250", "5260", "5300", "5400"]
        
        breakdown = {}
        for code in payroll_codes:
            if code in self.accounts:
                account = self.accounts[code]
                if account["balance"] != 0:
                    breakdown[account["name"]] = float(account["balance"])
        
        return breakdown
    
    def get_balance_sheet(self, as_of_date: Optional[date] = None) -> dict:
        """Generate balance sheet as of a specific date"""
        if not as_of_date:
            as_of_date = date.today()
        
        assets = [a for a in self.accounts.values() if a["type"] == "asset"]
        liabilities = [a for a in self.accounts.values() if a["type"] == "liability"]
        equity = [a for a in self.accounts.values() if a["type"] == "equity"]
        
        total_assets = sum(float(a["balance"]) for a in assets)
        total_liabilities = sum(float(a["balance"]) for a in liabilities)
        total_equity = sum(float(a["balance"]) for a in equity)
        
        # Add net income to equity
        revenue_accounts = [a for a in self.accounts.values() if a["type"] == "revenue"]
        expense_accounts = [a for a in self.accounts.values() if a["type"] == "expense"]
        net_income = sum(float(a["balance"]) for a in revenue_accounts) - sum(float(a["balance"]) for a in expense_accounts)
        
        return {
            "as_of_date": as_of_date.isoformat(),
            "assets": {
                "accounts": [{"code": a["code"], "name": a["name"], "balance": float(a["balance"])} 
                           for a in assets if a["balance"] != 0],
                "total": total_assets
            },
            "liabilities": {
                "accounts": [{"code": a["code"], "name": a["name"], "balance": float(a["balance"])} 
                           for a in liabilities if a["balance"] != 0],
                "total": total_liabilities,
                "payroll_liabilities": self._get_payroll_liabilities()
            },
            "equity": {
                "accounts": [{"code": a["code"], "name": a["name"], "balance": float(a["balance"])} 
                           for a in equity if a["balance"] != 0],
                "net_income": net_income,
                "total": total_equity + net_income
            },
            "total_liabilities_and_equity": total_liabilities + total_equity + net_income
        }
    
    def _get_payroll_liabilities(self) -> dict:
        """Get breakdown of payroll-related liabilities"""
        liability_codes = ["2100", "2110", "2120", "2130", "2200", "2210", "2220",
                         "2230", "2240", "2250", "2260", "2300", "2310", "2320",
                         "2330", "2340", "2350", "2400", "2410", "2500", "2510", "2520"]
        
        breakdown = {}
        for code in liability_codes:
            if code in self.accounts:
                account = self.accounts[code]
                if account["balance"] != 0:
                    breakdown[account["name"]] = float(account["balance"])
        
        return breakdown
    
    def reverse_journal_entry(self, entry_id: str, reversal_date: Optional[date] = None) -> dict:
        """Create a reversing entry for a journal entry"""
        original = next((e for e in self.journal_entries if e["id"] == entry_id), None)
        if not original:
            raise ValueError(f"Journal entry {entry_id} not found")
        
        if not reversal_date:
            reversal_date = date.today()
        
        # Swap debits and credits
        reversal_lines = []
        for line in original["lines"]:
            reversal_lines.append({
                "account_code": line["account_code"],
                "debit": line["credit"],
                "credit": line["debit"],
                "memo": f"Reversal: {line['memo']}"
            })
        
        return self.create_journal_entry(
            entry_date=reversal_date,
            description=f"REVERSAL: {original['description']}",
            lines=reversal_lines,
            reference=f"REV-{original['reference']}",
            source="reversal"
        )
    
    def export_to_csv(self) -> dict:
        """Export accounting data to CSV format"""
        return {
            "chart_of_accounts": self.get_chart_of_accounts(),
            "journal_entries": self.journal_entries,
            "trial_balance": self.get_trial_balance()
        }


# Create singleton instance
accounting_service = SaurelliusAccounting("default")
