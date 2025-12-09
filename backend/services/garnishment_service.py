"""
SAURELLIUS GARNISHMENT SERVICE
Wage garnishments, child support, tax levies, creditor deductions
Complete garnishment management with priority calculations
"""

from datetime import datetime, date
from decimal import Decimal, ROUND_HALF_UP, ROUND_DOWN
from typing import Dict, List, Optional, Tuple
from enum import Enum
import uuid


class GarnishmentType(Enum):
    CHILD_SUPPORT = "child_support"
    SPOUSAL_SUPPORT = "spousal_support"
    TAX_LEVY_FEDERAL = "tax_levy_federal"
    TAX_LEVY_STATE = "tax_levy_state"
    STUDENT_LOAN = "student_loan"
    CREDITOR = "creditor"
    BANKRUPTCY = "bankruptcy"
    MEDICAL = "medical"
    OTHER = "other"


class GarnishmentStatus(Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    SATISFIED = "satisfied"
    TERMINATED = "terminated"


class SaurelliusGarnishments:
    """Complete wage garnishment management system"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.garnishments: Dict[str, dict] = {}
        self.deduction_history: List[dict] = []
        self.remittance_history: List[dict] = []
        
        # Federal minimum wage for calculations
        self.FEDERAL_MIN_WAGE = Decimal("7.25")
        
        # Garnishment priority order (lower number = higher priority)
        self.PRIORITY_ORDER = {
            GarnishmentType.CHILD_SUPPORT.value: 1,
            GarnishmentType.SPOUSAL_SUPPORT.value: 1,
            GarnishmentType.TAX_LEVY_FEDERAL.value: 2,
            GarnishmentType.TAX_LEVY_STATE.value: 3,
            GarnishmentType.BANKRUPTCY.value: 4,
            GarnishmentType.STUDENT_LOAN.value: 5,
            GarnishmentType.CREDITOR.value: 6,
            GarnishmentType.MEDICAL.value: 6,
            GarnishmentType.OTHER.value: 7
        }
        
        # Maximum garnishment percentages by type
        self.MAX_PERCENTAGES = {
            GarnishmentType.CHILD_SUPPORT.value: {
                "single_current": Decimal("0.60"),      # 60% if supporting only current order
                "single_arrears": Decimal("0.65"),      # 65% if >12 weeks in arrears
                "multiple_current": Decimal("0.50"),    # 50% if supporting other dependents
                "multiple_arrears": Decimal("0.55")     # 55% if >12 weeks arrears + other dependents
            },
            GarnishmentType.TAX_LEVY_FEDERAL.value: Decimal("1.00"),  # Can take everything above exempt
            GarnishmentType.TAX_LEVY_STATE.value: Decimal("0.25"),
            GarnishmentType.STUDENT_LOAN.value: Decimal("0.15"),     # 15% of disposable
            GarnishmentType.CREDITOR.value: Decimal("0.25"),         # 25% of disposable
            GarnishmentType.BANKRUPTCY.value: Decimal("0.25")
        }
    
    def create_garnishment(self, employee_id: str, data: dict) -> dict:
        """Create a new garnishment order"""
        garnishment_id = str(uuid.uuid4())
        
        garnishment = {
            "id": garnishment_id,
            "employee_id": employee_id,
            "company_id": self.company_id,
            
            # Order Details
            "garnishment_type": data["garnishment_type"],
            "case_number": data.get("case_number"),
            "court_order_number": data.get("court_order_number"),
            "issuing_authority": data.get("issuing_authority"),
            "issue_date": data.get("issue_date"),
            "received_date": data.get("received_date", date.today().isoformat()),
            
            # Amount Configuration
            "amount_type": data.get("amount_type", "percentage"),  # percentage, fixed, formula
            "amount_value": Decimal(str(data.get("amount_value", 0))),
            "max_percentage": Decimal(str(data.get("max_percentage", 0.25))),
            "minimum_net_pay": Decimal(str(data.get("minimum_net_pay", 0))),
            
            # Total and Balance
            "total_amount": Decimal(str(data.get("total_amount", 0))) if data.get("total_amount") else None,
            "amount_withheld": Decimal("0.00"),
            "amount_remitted": Decimal("0.00"),
            "balance_remaining": Decimal(str(data.get("total_amount", 0))) if data.get("total_amount") else None,
            
            # Payee Information
            "payee": {
                "name": data.get("payee_name"),
                "address": data.get("payee_address", {}),
                "account_number": data.get("payee_account"),
                "routing_number": data.get("payee_routing"),
                "fips_code": data.get("fips_code")  # For child support
            },
            
            # Schedule
            "start_date": data.get("start_date", date.today().isoformat()),
            "end_date": data.get("end_date"),
            "frequency": data.get("frequency", "per_paycheck"),
            
            # Priority (auto-assigned based on type)
            "priority": self.PRIORITY_ORDER.get(data["garnishment_type"], 7),
            "manual_priority": data.get("manual_priority"),
            
            # Status
            "status": GarnishmentStatus.ACTIVE.value,
            "notes": data.get("notes"),
            
            # Metadata
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Special handling for child support
        if data["garnishment_type"] == GarnishmentType.CHILD_SUPPORT.value:
            garnishment["child_support_details"] = {
                "has_other_dependents": data.get("has_other_dependents", False),
                "is_in_arrears": data.get("is_in_arrears", False),
                "arrears_over_12_weeks": data.get("arrears_over_12_weeks", False),
                "medical_support_amount": Decimal(str(data.get("medical_support", 0))),
                "arrears_amount": Decimal(str(data.get("arrears_amount", 0))),
                "current_support_amount": Decimal(str(data.get("current_support", 0)))
            }
        
        # Special handling for federal tax levy
        if data["garnishment_type"] == GarnishmentType.TAX_LEVY_FEDERAL.value:
            garnishment["tax_levy_details"] = {
                "filing_status": data.get("filing_status", "single"),
                "pay_frequency": data.get("pay_frequency", "weekly"),
                "exemptions": data.get("exemptions", 1)
            }
        
        self.garnishments[garnishment_id] = garnishment
        return self._sanitize_garnishment(garnishment)
    
    def _sanitize_garnishment(self, garnishment: dict) -> dict:
        """Convert Decimal to float for JSON serialization"""
        safe = garnishment.copy()
        
        decimal_fields = ["amount_value", "max_percentage", "minimum_net_pay",
                         "total_amount", "amount_withheld", "amount_remitted", "balance_remaining"]
        
        for field in decimal_fields:
            if field in safe and safe[field] is not None:
                safe[field] = float(safe[field])
        
        if "child_support_details" in safe:
            for key in ["medical_support_amount", "arrears_amount", "current_support_amount"]:
                if key in safe["child_support_details"]:
                    safe["child_support_details"][key] = float(safe["child_support_details"][key])
        
        return safe
    
    def get_garnishment(self, garnishment_id: str) -> Optional[dict]:
        """Get garnishment by ID"""
        garnishment = self.garnishments.get(garnishment_id)
        if garnishment:
            return self._sanitize_garnishment(garnishment)
        return None
    
    def get_employee_garnishments(self, employee_id: str, 
                                  status: Optional[str] = None) -> List[dict]:
        """Get all garnishments for an employee"""
        garnishments = [g for g in self.garnishments.values() 
                       if g["employee_id"] == employee_id]
        
        if status:
            garnishments = [g for g in garnishments if g["status"] == status]
        
        # Sort by priority
        garnishments.sort(key=lambda x: (x.get("manual_priority") or x["priority"], x["created_at"]))
        
        return [self._sanitize_garnishment(g) for g in garnishments]
    
    def calculate_disposable_earnings(self, gross_pay: Decimal, 
                                     mandatory_deductions: dict) -> Decimal:
        """Calculate disposable earnings for garnishment purposes"""
        # Disposable earnings = Gross - Required deductions
        # Required: Federal/state taxes, Social Security, Medicare, state disability
        
        deductions = Decimal("0.00")
        deduction_types = ["federal_tax", "state_tax", "social_security", 
                         "medicare", "state_disability", "union_dues"]
        
        for dt in deduction_types:
            if dt in mandatory_deductions:
                deductions += Decimal(str(mandatory_deductions[dt]))
        
        return gross_pay - deductions
    
    def calculate_garnishment_amount(self, employee_id: str, 
                                    gross_pay: Decimal,
                                    disposable_earnings: Decimal,
                                    pay_period_hours: int = 40) -> dict:
        """Calculate garnishment amounts for a pay period"""
        garnishments = self.get_employee_garnishments(employee_id, status=GarnishmentStatus.ACTIVE.value)
        
        if not garnishments:
            return {"total": 0, "deductions": [], "remaining_pay": float(disposable_earnings)}
        
        # Calculate 30x federal minimum wage threshold
        min_wage_threshold = self.FEDERAL_MIN_WAGE * 30
        
        # Maximum garnishable under CCPA (25% of disposable or amount over 30x min wage)
        max_garnishable_25 = disposable_earnings * Decimal("0.25")
        max_garnishable_30x = max(Decimal("0.00"), disposable_earnings - min_wage_threshold)
        max_garnishable_ccpa = min(max_garnishable_25, max_garnishable_30x)
        
        deductions = []
        total_garnished = Decimal("0.00")
        remaining_disposable = disposable_earnings
        
        # Process garnishments in priority order
        for garnishment in garnishments:
            if garnishment["status"] != GarnishmentStatus.ACTIVE.value:
                continue
            
            # Check start/end dates
            if garnishment.get("start_date"):
                if date.today() < date.fromisoformat(garnishment["start_date"]):
                    continue
            if garnishment.get("end_date"):
                if date.today() > date.fromisoformat(garnishment["end_date"]):
                    continue
            
            # Check if balance satisfied
            if garnishment.get("balance_remaining") is not None:
                if Decimal(str(garnishment["balance_remaining"])) <= 0:
                    continue
            
            amount = self._calculate_single_garnishment(
                garnishment, gross_pay, disposable_earnings,
                remaining_disposable, max_garnishable_ccpa, total_garnished
            )
            
            if amount > 0:
                deductions.append({
                    "garnishment_id": garnishment["id"],
                    "garnishment_type": garnishment["garnishment_type"],
                    "case_number": garnishment.get("case_number"),
                    "amount": float(amount),
                    "payee": garnishment["payee"]["name"]
                })
                
                total_garnished += amount
                remaining_disposable -= amount
        
        return {
            "gross_pay": float(gross_pay),
            "disposable_earnings": float(disposable_earnings),
            "total_garnished": float(total_garnished),
            "deductions": deductions,
            "remaining_pay": float(remaining_disposable)
        }
    
    def _calculate_single_garnishment(self, garnishment: dict, gross_pay: Decimal,
                                     disposable: Decimal, remaining: Decimal,
                                     max_ccpa: Decimal, already_garnished: Decimal) -> Decimal:
        """Calculate amount for a single garnishment"""
        gtype = garnishment["garnishment_type"]
        amount = Decimal("0.00")
        
        if gtype == GarnishmentType.CHILD_SUPPORT.value:
            amount = self._calculate_child_support(garnishment, disposable, remaining)
        
        elif gtype == GarnishmentType.TAX_LEVY_FEDERAL.value:
            amount = self._calculate_federal_tax_levy(garnishment, gross_pay, remaining)
        
        elif gtype in [GarnishmentType.TAX_LEVY_STATE.value, GarnishmentType.CREDITOR.value,
                      GarnishmentType.STUDENT_LOAN.value, GarnishmentType.BANKRUPTCY.value]:
            # Standard CCPA limits apply
            max_for_type = self.MAX_PERCENTAGES.get(gtype, Decimal("0.25"))
            max_amount = disposable * max_for_type
            
            # Can't exceed CCPA limit considering all garnishments
            available = max(Decimal("0.00"), max_ccpa - already_garnished)
            
            if garnishment["amount_type"] == "percentage":
                amount = min(disposable * garnishment["amount_value"], available)
            elif garnishment["amount_type"] == "fixed":
                amount = min(garnishment["amount_value"], available)
            else:
                amount = min(max_amount, available)
        
        else:
            # Default: 25% of disposable
            available = max(Decimal("0.00"), max_ccpa - already_garnished)
            if garnishment["amount_type"] == "fixed":
                amount = min(garnishment["amount_value"], available)
            else:
                amount = min(disposable * Decimal("0.25"), available)
        
        # Check balance remaining
        if garnishment.get("balance_remaining") is not None:
            balance = Decimal(str(garnishment["balance_remaining"]))
            amount = min(amount, balance)
        
        return amount.quantize(Decimal("0.01"), rounding=ROUND_DOWN)
    
    def _calculate_child_support(self, garnishment: dict, 
                                disposable: Decimal, remaining: Decimal) -> Decimal:
        """Calculate child support garnishment amount"""
        details = garnishment.get("child_support_details", {})
        has_other = details.get("has_other_dependents", False)
        in_arrears = details.get("arrears_over_12_weeks", False)
        
        # Determine max percentage
        if has_other:
            if in_arrears:
                max_pct = self.MAX_PERCENTAGES[GarnishmentType.CHILD_SUPPORT.value]["multiple_arrears"]
            else:
                max_pct = self.MAX_PERCENTAGES[GarnishmentType.CHILD_SUPPORT.value]["multiple_current"]
        else:
            if in_arrears:
                max_pct = self.MAX_PERCENTAGES[GarnishmentType.CHILD_SUPPORT.value]["single_arrears"]
            else:
                max_pct = self.MAX_PERCENTAGES[GarnishmentType.CHILD_SUPPORT.value]["single_current"]
        
        max_amount = disposable * max_pct
        
        # Get ordered amounts
        current = Decimal(str(details.get("current_support_amount", 0)))
        medical = Decimal(str(details.get("medical_support_amount", 0)))
        arrears = Decimal(str(details.get("arrears_amount", 0)))
        
        total_ordered = current + medical + arrears
        
        return min(total_ordered, max_amount, remaining)
    
    def _calculate_federal_tax_levy(self, garnishment: dict,
                                   gross_pay: Decimal, remaining: Decimal) -> Decimal:
        """Calculate federal tax levy amount using IRS Publication 1494"""
        details = garnishment.get("tax_levy_details", {})
        filing_status = details.get("filing_status", "single")
        pay_frequency = details.get("pay_frequency", "weekly")
        exemptions = details.get("exemptions", 1)
        
        # 2024 IRS exempt amounts (simplified - would use actual IRS tables)
        weekly_exempt = {
            "single": Decimal("275.00"),
            "married": Decimal("550.00"),
            "head_of_household": Decimal("412.50")
        }
        
        base_exempt = weekly_exempt.get(filing_status, Decimal("275.00"))
        
        # Adjust for pay frequency
        frequency_multiplier = {
            "weekly": 1,
            "biweekly": 2,
            "semimonthly": 2.17,
            "monthly": 4.33
        }
        
        multiplier = Decimal(str(frequency_multiplier.get(pay_frequency, 1)))
        
        # Additional exemption per dependent
        dependent_exempt = Decimal("100.00") * multiplier * Decimal(str(exemptions - 1))
        
        total_exempt = (base_exempt * multiplier) + dependent_exempt
        
        # Levy amount = Gross - Exempt amount
        levy_amount = max(Decimal("0.00"), gross_pay - total_exempt)
        
        return min(levy_amount, remaining)
    
    def record_deduction(self, garnishment_id: str, amount: Decimal,
                        pay_date: date, payroll_id: str) -> dict:
        """Record a garnishment deduction from payroll"""
        if garnishment_id not in self.garnishments:
            raise ValueError(f"Garnishment {garnishment_id} not found")
        
        garnishment = self.garnishments[garnishment_id]
        deduction_id = str(uuid.uuid4())
        
        # Update garnishment totals
        garnishment["amount_withheld"] += amount
        if garnishment.get("balance_remaining") is not None:
            garnishment["balance_remaining"] = max(
                Decimal("0.00"),
                garnishment["balance_remaining"] - amount
            )
            
            # Check if satisfied
            if garnishment["balance_remaining"] <= 0:
                garnishment["status"] = GarnishmentStatus.SATISFIED.value
        
        garnishment["updated_at"] = datetime.now().isoformat()
        
        deduction = {
            "id": deduction_id,
            "garnishment_id": garnishment_id,
            "employee_id": garnishment["employee_id"],
            "payroll_id": payroll_id,
            "amount": float(amount),
            "pay_date": pay_date.isoformat(),
            "garnishment_type": garnishment["garnishment_type"],
            "case_number": garnishment.get("case_number"),
            "payee": garnishment["payee"]["name"],
            "status": "pending_remittance",
            "created_at": datetime.now().isoformat()
        }
        
        self.deduction_history.append(deduction)
        return deduction
    
    def record_remittance(self, deduction_ids: List[str], 
                         remittance_date: date,
                         payment_method: str,
                         confirmation: Optional[str] = None) -> dict:
        """Record remittance of garnishment funds to payee"""
        remittance_id = str(uuid.uuid4())
        total_amount = Decimal("0.00")
        deductions = []
        
        for deduction_id in deduction_ids:
            deduction = next((d for d in self.deduction_history if d["id"] == deduction_id), None)
            if deduction and deduction["status"] == "pending_remittance":
                total_amount += Decimal(str(deduction["amount"]))
                deduction["status"] = "remitted"
                deduction["remittance_id"] = remittance_id
                deductions.append(deduction)
                
                # Update garnishment remitted total
                garnishment = self.garnishments.get(deduction["garnishment_id"])
                if garnishment:
                    garnishment["amount_remitted"] += Decimal(str(deduction["amount"]))
        
        remittance = {
            "id": remittance_id,
            "company_id": self.company_id,
            "deduction_ids": deduction_ids,
            "total_amount": float(total_amount),
            "remittance_date": remittance_date.isoformat(),
            "payment_method": payment_method,  # ach, check, eft
            "confirmation_number": confirmation,
            "deduction_count": len(deductions),
            "status": "completed",
            "created_at": datetime.now().isoformat()
        }
        
        self.remittance_history.append(remittance)
        return remittance
    
    def update_garnishment(self, garnishment_id: str, data: dict) -> dict:
        """Update garnishment details"""
        if garnishment_id not in self.garnishments:
            raise ValueError(f"Garnishment {garnishment_id} not found")
        
        garnishment = self.garnishments[garnishment_id]
        
        # Allowed updates
        allowed_fields = ["amount_value", "max_percentage", "end_date", 
                         "notes", "status", "manual_priority"]
        
        for field in allowed_fields:
            if field in data:
                if field in ["amount_value", "max_percentage"]:
                    garnishment[field] = Decimal(str(data[field]))
                else:
                    garnishment[field] = data[field]
        
        # Update payee info
        if "payee" in data:
            garnishment["payee"].update(data["payee"])
        
        garnishment["updated_at"] = datetime.now().isoformat()
        return self._sanitize_garnishment(garnishment)
    
    def terminate_garnishment(self, garnishment_id: str, reason: str) -> dict:
        """Terminate a garnishment"""
        if garnishment_id not in self.garnishments:
            raise ValueError(f"Garnishment {garnishment_id} not found")
        
        garnishment = self.garnishments[garnishment_id]
        garnishment["status"] = GarnishmentStatus.TERMINATED.value
        garnishment["termination_reason"] = reason
        garnishment["terminated_at"] = datetime.now().isoformat()
        garnishment["updated_at"] = datetime.now().isoformat()
        
        return self._sanitize_garnishment(garnishment)
    
    def get_deduction_history(self, employee_id: Optional[str] = None,
                             garnishment_id: Optional[str] = None,
                             start_date: Optional[date] = None,
                             end_date: Optional[date] = None) -> List[dict]:
        """Get deduction history with filters"""
        history = self.deduction_history.copy()
        
        if employee_id:
            history = [h for h in history if h["employee_id"] == employee_id]
        if garnishment_id:
            history = [h for h in history if h["garnishment_id"] == garnishment_id]
        if start_date:
            history = [h for h in history 
                      if date.fromisoformat(h["pay_date"]) >= start_date]
        if end_date:
            history = [h for h in history 
                      if date.fromisoformat(h["pay_date"]) <= end_date]
        
        return sorted(history, key=lambda x: x["pay_date"], reverse=True)
    
    def get_pending_remittances(self) -> List[dict]:
        """Get all deductions pending remittance"""
        pending = [d for d in self.deduction_history if d["status"] == "pending_remittance"]
        
        # Group by payee
        by_payee = {}
        for deduction in pending:
            garnishment = self.garnishments.get(deduction["garnishment_id"])
            if not garnishment:
                continue
            
            payee_name = garnishment["payee"]["name"]
            if payee_name not in by_payee:
                by_payee[payee_name] = {
                    "payee": garnishment["payee"],
                    "deductions": [],
                    "total_amount": Decimal("0.00")
                }
            
            by_payee[payee_name]["deductions"].append(deduction)
            by_payee[payee_name]["total_amount"] += Decimal(str(deduction["amount"]))
        
        return [{
            "payee": data["payee"],
            "deduction_count": len(data["deductions"]),
            "total_amount": float(data["total_amount"]),
            "deduction_ids": [d["id"] for d in data["deductions"]]
        } for data in by_payee.values()]
    
    def get_garnishment_summary(self, employee_id: str) -> dict:
        """Get summary of all garnishments for an employee"""
        garnishments = self.get_employee_garnishments(employee_id)
        
        active = [g for g in garnishments if g["status"] == GarnishmentStatus.ACTIVE.value]
        
        total_withheld = sum(Decimal(str(g["amount_withheld"])) for g in garnishments)
        total_remaining = sum(Decimal(str(g["balance_remaining"])) 
                             for g in garnishments if g.get("balance_remaining"))
        
        by_type = {}
        for g in active:
            gtype = g["garnishment_type"]
            if gtype not in by_type:
                by_type[gtype] = {"count": 0, "total_withheld": Decimal("0.00")}
            by_type[gtype]["count"] += 1
            by_type[gtype]["total_withheld"] += Decimal(str(g["amount_withheld"]))
        
        return {
            "employee_id": employee_id,
            "total_garnishments": len(garnishments),
            "active_garnishments": len(active),
            "total_withheld": float(total_withheld),
            "total_remaining": float(total_remaining) if total_remaining else None,
            "by_type": {k: {"count": v["count"], "total_withheld": float(v["total_withheld"])} 
                       for k, v in by_type.items()},
            "generated_at": datetime.now().isoformat()
        }


# Create singleton instance
garnishment_service = SaurelliusGarnishments("default")
