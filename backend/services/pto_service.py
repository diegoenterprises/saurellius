"""
SAURELLIUS PTO/LEAVE MANAGEMENT SERVICE
Paid Time Off accruals, leave requests, balance tracking, policies
"""

from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from enum import Enum
import uuid


class LeaveType(Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    BEREAVEMENT = "bereavement"
    JURY_DUTY = "jury_duty"
    MILITARY = "military"
    PARENTAL = "parental"
    FMLA = "fmla"
    UNPAID = "unpaid"
    HOLIDAY = "holiday"
    FLOATING_HOLIDAY = "floating_holiday"
    VOLUNTEER = "volunteer"
    SABBATICAL = "sabbatical"


class AccrualFrequency(Enum):
    PER_PAY_PERIOD = "per_pay_period"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    HIRE_DATE_ANNIVERSARY = "hire_date_anniversary"


class AccrualMethod(Enum):
    FIXED = "fixed"  # Same amount each period
    TENURE_BASED = "tenure_based"  # Increases with years of service
    HOURS_WORKED = "hours_worked"  # Accrues based on hours worked


class RequestStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    CANCELLED = "cancelled"
    TAKEN = "taken"


class SaurelliusPTO:
    """Complete PTO and Leave Management System"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.policies: Dict[str, dict] = {}
        self.employee_balances: Dict[str, dict] = {}
        self.leave_requests: List[dict] = []
        self.accrual_history: List[dict] = []
        self.holidays: List[dict] = []
        
        self._initialize_default_policies()
        self._initialize_holidays()
    
    def _initialize_default_policies(self):
        """Initialize default PTO policies"""
        default_policies = [
            {
                "id": "vacation_standard",
                "name": "Standard Vacation",
                "leave_type": LeaveType.VACATION.value,
                "accrual_method": AccrualMethod.TENURE_BASED.value,
                "accrual_frequency": AccrualFrequency.PER_PAY_PERIOD.value,
                "tenure_schedule": [
                    {"min_years": 0, "max_years": 1, "annual_hours": 80},   # 10 days
                    {"min_years": 1, "max_years": 5, "annual_hours": 120},  # 15 days
                    {"min_years": 5, "max_years": 10, "annual_hours": 160}, # 20 days
                    {"min_years": 10, "max_years": None, "annual_hours": 200} # 25 days
                ],
                "max_balance": 240,  # Max carryover (30 days)
                "carryover_limit": 40,  # Max hours to carry over
                "waiting_period_days": 90,
                "min_increment": 1,  # Minimum hours per request
                "requires_approval": True,
                "advance_notice_days": 14,
                "is_paid": True,
                "is_active": True
            },
            {
                "id": "sick_standard",
                "name": "Sick Leave",
                "leave_type": LeaveType.SICK.value,
                "accrual_method": AccrualMethod.FIXED.value,
                "accrual_frequency": AccrualFrequency.PER_PAY_PERIOD.value,
                "accrual_rate": 3.08,  # ~80 hours/year
                "max_balance": 480,  # 60 days (for long-term illness)
                "carryover_limit": None,  # Unlimited carryover
                "waiting_period_days": 0,
                "min_increment": 1,
                "requires_approval": False,  # No approval needed
                "advance_notice_days": 0,
                "is_paid": True,
                "is_active": True
            },
            {
                "id": "personal_standard",
                "name": "Personal Days",
                "leave_type": LeaveType.PERSONAL.value,
                "accrual_method": AccrualMethod.FIXED.value,
                "accrual_frequency": AccrualFrequency.ANNUALLY.value,
                "accrual_rate": 24,  # 3 days per year
                "max_balance": 24,
                "carryover_limit": 0,  # Use it or lose it
                "waiting_period_days": 0,
                "min_increment": 4,  # Half day minimum
                "requires_approval": True,
                "advance_notice_days": 3,
                "is_paid": True,
                "is_active": True
            },
            {
                "id": "bereavement_standard",
                "name": "Bereavement Leave",
                "leave_type": LeaveType.BEREAVEMENT.value,
                "accrual_method": None,  # Not accrued
                "max_per_occurrence": {
                    "immediate_family": 40,  # 5 days
                    "extended_family": 24,   # 3 days
                },
                "requires_approval": True,
                "advance_notice_days": 0,
                "is_paid": True,
                "is_active": True
            },
            {
                "id": "parental_standard",
                "name": "Parental Leave",
                "leave_type": LeaveType.PARENTAL.value,
                "accrual_method": None,
                "entitlement": {
                    "birth_parent": 480,    # 12 weeks
                    "non_birth_parent": 160  # 4 weeks
                },
                "requires_approval": True,
                "advance_notice_days": 30,
                "is_paid": True,
                "is_active": True
            },
            {
                "id": "fmla_standard",
                "name": "FMLA Leave",
                "leave_type": LeaveType.FMLA.value,
                "accrual_method": None,
                "entitlement": 480,  # 12 weeks
                "eligibility": {
                    "min_months_employed": 12,
                    "min_hours_worked": 1250
                },
                "requires_approval": True,
                "is_paid": False,
                "is_active": True
            }
        ]
        
        for policy in default_policies:
            self.policies[policy["id"]] = policy
    
    def _initialize_holidays(self):
        """Initialize company holidays for current year"""
        year = date.today().year
        self.holidays = [
            {"name": "New Year's Day", "date": f"{year}-01-01", "is_paid": True},
            {"name": "MLK Day", "date": self._get_nth_weekday(year, 1, 0, 3), "is_paid": True},
            {"name": "Presidents Day", "date": self._get_nth_weekday(year, 2, 0, 3), "is_paid": True},
            {"name": "Memorial Day", "date": self._get_last_weekday(year, 5, 0), "is_paid": True},
            {"name": "Juneteenth", "date": f"{year}-06-19", "is_paid": True},
            {"name": "Independence Day", "date": f"{year}-07-04", "is_paid": True},
            {"name": "Labor Day", "date": self._get_nth_weekday(year, 9, 0, 1), "is_paid": True},
            {"name": "Thanksgiving", "date": self._get_nth_weekday(year, 11, 3, 4), "is_paid": True},
            {"name": "Day After Thanksgiving", "date": self._get_day_after_thanksgiving(year), "is_paid": True},
            {"name": "Christmas Eve", "date": f"{year}-12-24", "is_paid": True},
            {"name": "Christmas Day", "date": f"{year}-12-25", "is_paid": True},
        ]
    
    def _get_nth_weekday(self, year: int, month: int, weekday: int, n: int) -> str:
        """Get the nth occurrence of a weekday in a month"""
        first_day = date(year, month, 1)
        first_weekday = first_day + timedelta(days=(weekday - first_day.weekday()) % 7)
        return (first_weekday + timedelta(weeks=n-1)).isoformat()
    
    def _get_last_weekday(self, year: int, month: int, weekday: int) -> str:
        """Get the last occurrence of a weekday in a month"""
        if month == 12:
            next_month = date(year + 1, 1, 1)
        else:
            next_month = date(year, month + 1, 1)
        last_day = next_month - timedelta(days=1)
        days_back = (last_day.weekday() - weekday) % 7
        return (last_day - timedelta(days=days_back)).isoformat()
    
    def _get_day_after_thanksgiving(self, year: int) -> str:
        """Get day after Thanksgiving"""
        thanksgiving = date.fromisoformat(self._get_nth_weekday(year, 11, 3, 4))
        return (thanksgiving + timedelta(days=1)).isoformat()
    
    def create_policy(self, data: dict) -> dict:
        """Create a new PTO policy"""
        policy_id = str(uuid.uuid4())
        
        policy = {
            "id": policy_id,
            "company_id": self.company_id,
            "name": data["name"],
            "leave_type": data["leave_type"],
            "accrual_method": data.get("accrual_method"),
            "accrual_frequency": data.get("accrual_frequency"),
            "accrual_rate": data.get("accrual_rate"),
            "tenure_schedule": data.get("tenure_schedule"),
            "max_balance": data.get("max_balance"),
            "carryover_limit": data.get("carryover_limit"),
            "waiting_period_days": data.get("waiting_period_days", 0),
            "min_increment": data.get("min_increment", 1),
            "requires_approval": data.get("requires_approval", True),
            "advance_notice_days": data.get("advance_notice_days", 0),
            "is_paid": data.get("is_paid", True),
            "is_active": True,
            "created_at": datetime.now().isoformat()
        }
        
        self.policies[policy_id] = policy
        return policy
    
    def get_policy(self, policy_id: str) -> Optional[dict]:
        """Get policy by ID"""
        return self.policies.get(policy_id)
    
    def get_all_policies(self, leave_type: Optional[str] = None, 
                        active_only: bool = True) -> List[dict]:
        """Get all policies"""
        policies = list(self.policies.values())
        
        if leave_type:
            policies = [p for p in policies if p["leave_type"] == leave_type]
        if active_only:
            policies = [p for p in policies if p.get("is_active", True)]
        
        return policies
    
    def enroll_employee(self, employee_id: str, hire_date: str, 
                       policy_ids: Optional[List[str]] = None) -> dict:
        """Enroll employee in PTO policies"""
        if not policy_ids:
            # Enroll in all active policies by default
            policy_ids = [p["id"] for p in self.policies.values() if p.get("is_active")]
        
        balances = {
            "employee_id": employee_id,
            "company_id": self.company_id,
            "hire_date": hire_date,
            "enrolled_policies": policy_ids,
            "balances": {},
            "created_at": datetime.now().isoformat()
        }
        
        for policy_id in policy_ids:
            policy = self.policies.get(policy_id)
            if policy:
                balances["balances"][policy_id] = {
                    "policy_name": policy["name"],
                    "leave_type": policy["leave_type"],
                    "available": Decimal("0.00"),
                    "used": Decimal("0.00"),
                    "pending": Decimal("0.00"),
                    "accrued_ytd": Decimal("0.00"),
                    "carryover": Decimal("0.00"),
                    "last_accrual_date": None
                }
        
        self.employee_balances[employee_id] = balances
        return self._sanitize_balances(balances)
    
    def _sanitize_balances(self, balances: dict) -> dict:
        """Convert Decimal to float for JSON serialization"""
        safe = balances.copy()
        safe["balances"] = {}
        
        for policy_id, balance in balances["balances"].items():
            safe["balances"][policy_id] = {
                k: float(v) if isinstance(v, Decimal) else v 
                for k, v in balance.items()
            }
        
        return safe
    
    def calculate_accrual(self, employee_id: str, policy_id: str, 
                         pay_period_end: date, hours_worked: Optional[float] = None) -> Decimal:
        """Calculate accrual amount for an employee"""
        if employee_id not in self.employee_balances:
            raise ValueError(f"Employee {employee_id} not enrolled in PTO")
        
        employee = self.employee_balances[employee_id]
        policy = self.policies.get(policy_id)
        
        if not policy or policy_id not in employee["enrolled_policies"]:
            return Decimal("0.00")
        
        # Check waiting period
        hire_date = date.fromisoformat(employee["hire_date"])
        waiting_end = hire_date + timedelta(days=policy.get("waiting_period_days", 0))
        if pay_period_end < waiting_end:
            return Decimal("0.00")
        
        accrual = Decimal("0.00")
        method = policy.get("accrual_method")
        
        if method == AccrualMethod.FIXED.value:
            accrual = Decimal(str(policy.get("accrual_rate", 0)))
        
        elif method == AccrualMethod.TENURE_BASED.value:
            years_of_service = (pay_period_end - hire_date).days / 365.25
            schedule = policy.get("tenure_schedule", [])
            
            annual_hours = Decimal("0.00")
            for tier in schedule:
                min_years = tier.get("min_years", 0)
                max_years = tier.get("max_years")
                
                if years_of_service >= min_years:
                    if max_years is None or years_of_service < max_years:
                        annual_hours = Decimal(str(tier["annual_hours"]))
                        break
            
            # Convert to per-period accrual
            frequency = policy.get("accrual_frequency")
            if frequency == AccrualFrequency.PER_PAY_PERIOD.value:
                accrual = (annual_hours / 26).quantize(Decimal("0.01"))  # Bi-weekly
            elif frequency == AccrualFrequency.MONTHLY.value:
                accrual = (annual_hours / 12).quantize(Decimal("0.01"))
        
        elif method == AccrualMethod.HOURS_WORKED.value:
            if hours_worked:
                rate = Decimal(str(policy.get("accrual_rate", 0.0385)))  # Default: 1 hour per 26 worked
                accrual = (Decimal(str(hours_worked)) * rate).quantize(Decimal("0.01"))
        
        return accrual
    
    def process_accrual(self, employee_id: str, policy_id: str,
                       pay_period_end: date, hours_worked: Optional[float] = None) -> dict:
        """Process and apply accrual for an employee"""
        accrual = self.calculate_accrual(employee_id, policy_id, pay_period_end, hours_worked)
        
        if accrual <= 0:
            return {"accrued": 0, "message": "No accrual applied"}
        
        employee = self.employee_balances[employee_id]
        balance = employee["balances"][policy_id]
        policy = self.policies[policy_id]
        
        # Check max balance cap
        max_balance = policy.get("max_balance")
        if max_balance:
            max_balance = Decimal(str(max_balance))
            current = balance["available"] + balance["carryover"]
            if current + accrual > max_balance:
                accrual = max(Decimal("0.00"), max_balance - current)
        
        # Apply accrual
        balance["available"] += accrual
        balance["accrued_ytd"] += accrual
        balance["last_accrual_date"] = pay_period_end.isoformat()
        
        # Record in history
        accrual_record = {
            "id": str(uuid.uuid4()),
            "employee_id": employee_id,
            "policy_id": policy_id,
            "amount": float(accrual),
            "pay_period_end": pay_period_end.isoformat(),
            "balance_after": float(balance["available"]),
            "created_at": datetime.now().isoformat()
        }
        self.accrual_history.append(accrual_record)
        
        return {
            "accrued": float(accrual),
            "new_balance": float(balance["available"]),
            "accrual_record": accrual_record
        }
    
    def submit_leave_request(self, employee_id: str, data: dict) -> dict:
        """Submit a leave request"""
        if employee_id not in self.employee_balances:
            raise ValueError(f"Employee {employee_id} not enrolled in PTO")
        
        request_id = str(uuid.uuid4())
        policy_id = data["policy_id"]
        policy = self.policies.get(policy_id)
        
        if not policy:
            raise ValueError(f"Policy {policy_id} not found")
        
        start_date = date.fromisoformat(data["start_date"])
        end_date = date.fromisoformat(data["end_date"])
        
        # Calculate hours requested
        hours = Decimal(str(data.get("hours", 0)))
        if hours == 0:
            # Calculate from dates (assuming 8-hour days)
            work_days = self._count_work_days(start_date, end_date)
            hours = Decimal(str(work_days * 8))
        
        # Check balance
        employee = self.employee_balances[employee_id]
        balance = employee["balances"].get(policy_id, {})
        available = balance.get("available", Decimal("0.00")) + balance.get("carryover", Decimal("0.00"))
        
        if hours > available and policy.get("is_paid", True):
            raise ValueError(f"Insufficient balance. Available: {available}, Requested: {hours}")
        
        # Check advance notice
        advance_days = policy.get("advance_notice_days", 0)
        if (start_date - date.today()).days < advance_days:
            # Warning but don't block
            pass
        
        request = {
            "id": request_id,
            "employee_id": employee_id,
            "company_id": self.company_id,
            "policy_id": policy_id,
            "leave_type": policy["leave_type"],
            
            # Dates
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "hours": float(hours),
            
            # Details
            "reason": data.get("reason", ""),
            "notes": data.get("notes", ""),
            "is_partial_day": data.get("is_partial_day", False),
            "partial_day_hours": data.get("partial_day_hours"),
            
            # Status
            "status": RequestStatus.PENDING.value if policy.get("requires_approval") else RequestStatus.APPROVED.value,
            "submitted_at": datetime.now().isoformat(),
            "reviewed_by": None,
            "reviewed_at": None,
            "denial_reason": None,
            
            # Balance snapshot
            "balance_at_submission": float(available)
        }
        
        # Update pending balance
        balance["pending"] = balance.get("pending", Decimal("0.00")) + hours
        
        self.leave_requests.append(request)
        return request
    
    def _count_work_days(self, start: date, end: date) -> int:
        """Count work days between two dates (excluding weekends and holidays)"""
        holiday_dates = {h["date"] for h in self.holidays}
        work_days = 0
        current = start
        
        while current <= end:
            if current.weekday() < 5 and current.isoformat() not in holiday_dates:
                work_days += 1
            current += timedelta(days=1)
        
        return work_days
    
    def approve_request(self, request_id: str, reviewer_id: str) -> dict:
        """Approve a leave request"""
        request = next((r for r in self.leave_requests if r["id"] == request_id), None)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        if request["status"] != RequestStatus.PENDING.value:
            raise ValueError(f"Request is not pending (status: {request['status']})")
        
        request["status"] = RequestStatus.APPROVED.value
        request["reviewed_by"] = reviewer_id
        request["reviewed_at"] = datetime.now().isoformat()
        
        return request
    
    def deny_request(self, request_id: str, reviewer_id: str, reason: str) -> dict:
        """Deny a leave request"""
        request = next((r for r in self.leave_requests if r["id"] == request_id), None)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        if request["status"] != RequestStatus.PENDING.value:
            raise ValueError(f"Request is not pending (status: {request['status']})")
        
        # Restore pending balance
        employee = self.employee_balances.get(request["employee_id"])
        if employee:
            balance = employee["balances"].get(request["policy_id"], {})
            balance["pending"] = max(Decimal("0.00"), 
                                    balance.get("pending", Decimal("0.00")) - Decimal(str(request["hours"])))
        
        request["status"] = RequestStatus.DENIED.value
        request["reviewed_by"] = reviewer_id
        request["reviewed_at"] = datetime.now().isoformat()
        request["denial_reason"] = reason
        
        return request
    
    def cancel_request(self, request_id: str, employee_id: str) -> dict:
        """Cancel a leave request"""
        request = next((r for r in self.leave_requests if r["id"] == request_id), None)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        if request["employee_id"] != employee_id:
            raise ValueError("Cannot cancel another employee's request")
        
        if request["status"] not in [RequestStatus.PENDING.value, RequestStatus.APPROVED.value]:
            raise ValueError(f"Cannot cancel request with status: {request['status']}")
        
        # Restore pending balance if was pending
        if request["status"] == RequestStatus.PENDING.value:
            employee = self.employee_balances.get(employee_id)
            if employee:
                balance = employee["balances"].get(request["policy_id"], {})
                balance["pending"] = max(Decimal("0.00"),
                                        balance.get("pending", Decimal("0.00")) - Decimal(str(request["hours"])))
        
        request["status"] = RequestStatus.CANCELLED.value
        return request
    
    def mark_leave_taken(self, request_id: str) -> dict:
        """Mark approved leave as taken (deduct from balance)"""
        request = next((r for r in self.leave_requests if r["id"] == request_id), None)
        if not request:
            raise ValueError(f"Request {request_id} not found")
        
        if request["status"] != RequestStatus.APPROVED.value:
            raise ValueError(f"Request must be approved first (status: {request['status']})")
        
        # Deduct from balance
        employee = self.employee_balances.get(request["employee_id"])
        if employee:
            balance = employee["balances"].get(request["policy_id"], {})
            hours = Decimal(str(request["hours"]))
            
            # Deduct from pending first
            balance["pending"] = max(Decimal("0.00"), 
                                    balance.get("pending", Decimal("0.00")) - hours)
            
            # Then from available
            balance["available"] = max(Decimal("0.00"),
                                      balance.get("available", Decimal("0.00")) - hours)
            balance["used"] = balance.get("used", Decimal("0.00")) + hours
        
        request["status"] = RequestStatus.TAKEN.value
        return request
    
    def get_employee_balances(self, employee_id: str) -> dict:
        """Get all PTO balances for an employee"""
        balances = self.employee_balances.get(employee_id)
        if not balances:
            raise ValueError(f"Employee {employee_id} not found")
        
        return self._sanitize_balances(balances)
    
    def get_leave_requests(self, employee_id: Optional[str] = None,
                          status: Optional[str] = None,
                          start_date: Optional[date] = None,
                          end_date: Optional[date] = None) -> List[dict]:
        """Get leave requests with filters"""
        requests = self.leave_requests.copy()
        
        if employee_id:
            requests = [r for r in requests if r["employee_id"] == employee_id]
        if status:
            requests = [r for r in requests if r["status"] == status]
        if start_date:
            requests = [r for r in requests 
                       if date.fromisoformat(r["start_date"]) >= start_date]
        if end_date:
            requests = [r for r in requests 
                       if date.fromisoformat(r["end_date"]) <= end_date]
        
        return sorted(requests, key=lambda x: x["start_date"], reverse=True)
    
    def get_team_calendar(self, employee_ids: List[str], 
                         month: int, year: int) -> List[dict]:
        """Get leave calendar for a team"""
        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date(year, month + 1, 1) - timedelta(days=1)
        
        calendar = []
        
        # Add holidays
        for holiday in self.holidays:
            holiday_date = date.fromisoformat(holiday["date"])
            if start <= holiday_date <= end:
                calendar.append({
                    "type": "holiday",
                    "date": holiday["date"],
                    "name": holiday["name"],
                    "is_paid": holiday["is_paid"]
                })
        
        # Add approved/taken leave
        for request in self.leave_requests:
            if request["employee_id"] not in employee_ids:
                continue
            if request["status"] not in [RequestStatus.APPROVED.value, RequestStatus.TAKEN.value]:
                continue
            
            req_start = date.fromisoformat(request["start_date"])
            req_end = date.fromisoformat(request["end_date"])
            
            if req_start <= end and req_end >= start:
                calendar.append({
                    "type": "leave",
                    "employee_id": request["employee_id"],
                    "start_date": request["start_date"],
                    "end_date": request["end_date"],
                    "leave_type": request["leave_type"],
                    "hours": request["hours"],
                    "status": request["status"]
                })
        
        return calendar
    
    def process_year_end_carryover(self, employee_id: str) -> dict:
        """Process year-end balance carryover"""
        if employee_id not in self.employee_balances:
            raise ValueError(f"Employee {employee_id} not found")
        
        employee = self.employee_balances[employee_id]
        results = []
        
        for policy_id, balance in employee["balances"].items():
            policy = self.policies.get(policy_id)
            if not policy:
                continue
            
            carryover_limit = policy.get("carryover_limit")
            current_balance = balance.get("available", Decimal("0.00"))
            
            if carryover_limit is not None:
                carryover_limit = Decimal(str(carryover_limit))
                carryover = min(current_balance, carryover_limit)
                forfeited = current_balance - carryover
            else:
                carryover = current_balance
                forfeited = Decimal("0.00")
            
            # Reset balances
            balance["carryover"] = carryover
            balance["available"] = Decimal("0.00")
            balance["accrued_ytd"] = Decimal("0.00")
            balance["used"] = Decimal("0.00")
            
            results.append({
                "policy_id": policy_id,
                "policy_name": policy["name"],
                "previous_balance": float(current_balance),
                "carryover": float(carryover),
                "forfeited": float(forfeited)
            })
        
        return {
            "employee_id": employee_id,
            "processed_at": datetime.now().isoformat(),
            "results": results
        }
    
    def get_pto_liability_report(self) -> dict:
        """Calculate PTO liability for all employees"""
        total_liability = Decimal("0.00")
        by_employee = []
        
        for employee_id, employee in self.employee_balances.items():
            employee_liability = Decimal("0.00")
            
            for policy_id, balance in employee["balances"].items():
                policy = self.policies.get(policy_id)
                if policy and policy.get("is_paid"):
                    # Assuming $50/hour average (would use actual rate in production)
                    hours = balance.get("available", Decimal("0.00")) + balance.get("carryover", Decimal("0.00"))
                    employee_liability += hours * Decimal("50")
            
            total_liability += employee_liability
            by_employee.append({
                "employee_id": employee_id,
                "liability": float(employee_liability)
            })
        
        return {
            "total_liability": float(total_liability),
            "employee_count": len(by_employee),
            "by_employee": by_employee,
            "generated_at": datetime.now().isoformat()
        }
    
    def get_holidays(self, year: Optional[int] = None) -> List[dict]:
        """Get company holidays"""
        if year:
            return [h for h in self.holidays if h["date"].startswith(str(year))]
        return self.holidays


# Create singleton instance
pto_service = SaurelliusPTO("default")
