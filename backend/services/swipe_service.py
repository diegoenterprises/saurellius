"""
SAURELLIUS SWIPE - Schedule Matching & Swap System
Employee-to-employee shift swapping with intelligent matching and manager approval workflow

Features:
- Smart shift matching algorithm
- Overtime compliance checking
- Manager approval workflow
- Swap history & analytics
"""

from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import uuid
from decimal import Decimal


class SwipeStatus(Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    MANAGER_PENDING = "manager_pending"
    MANAGER_APPROVED = "manager_approved"
    MANAGER_DENIED = "manager_denied"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


# Position colors for visual display
POSITION_COLORS = {
    "manager": {"bg": "#E8D5F2", "text": "#7C3AED", "name": "Manager"},
    "chef": {"bg": "#FED7AA", "text": "#EA580C", "name": "Chef"},
    "line_cook": {"bg": "#BBF7D0", "text": "#16A34A", "name": "Line Cook"},
    "server": {"bg": "#BFDBFE", "text": "#2563EB", "name": "Server"},
    "host": {"bg": "#FECACA", "text": "#DC2626", "name": "Host"},
    "busser": {"bg": "#FDE68A", "text": "#CA8A04", "name": "Busser"},
    "dishwasher": {"bg": "#E5E7EB", "text": "#4B5563", "name": "Dishwasher"},
    "bartender": {"bg": "#DDD6FE", "text": "#7C3AED", "name": "Bartender"},
    "cashier": {"bg": "#FBCFE8", "text": "#DB2777", "name": "Cashier"},
    "supervisor": {"bg": "#A5F3FC", "text": "#0891B2", "name": "Supervisor"},
    "assistant": {"bg": "#C7D2FE", "text": "#4F46E5", "name": "Assistant"},
    "developer": {"bg": "#99F6E4", "text": "#0D9488", "name": "Developer"},
    "designer": {"bg": "#FECDD3", "text": "#E11D48", "name": "Designer"},
    "analyst": {"bg": "#FEF08A", "text": "#A16207", "name": "Analyst"},
    "default": {"bg": "#E2E8F0", "text": "#475569", "name": "Employee"},
}


class Shift:
    """Individual shift object."""
    
    def __init__(
        self,
        employee_id: int,
        employee_name: str,
        shift_date: str,
        start_time: str,
        end_time: str,
        position: str,
        department: str = "Default",
        location: str = "",
        shift_id: str = None
    ):
        self.id = shift_id or str(uuid.uuid4())
        self.employee_id = employee_id
        self.employee_name = employee_name
        self.date = shift_date
        self.start_time = start_time
        self.end_time = end_time
        self.position = position
        self.department = department
        self.location = location
        self.is_available_for_swap = False
        self.swap_note = ""
        self.created_at = datetime.utcnow()
    
    @property
    def duration_hours(self) -> float:
        start = datetime.strptime(self.start_time, "%H:%M")
        end = datetime.strptime(self.end_time, "%H:%M")
        if end < start:
            end += timedelta(days=1)
        return (end - start).seconds / 3600
    
    @property
    def display_time(self) -> str:
        start = datetime.strptime(self.start_time, "%H:%M")
        end = datetime.strptime(self.end_time, "%H:%M")
        return f"{start.strftime('%I%p').lstrip('0').lower()} - {end.strftime('%I%p').lstrip('0').lower()}"
    
    @property
    def position_color(self) -> Dict:
        return POSITION_COLORS.get(self.position.lower().replace(" ", "_"), POSITION_COLORS["default"])
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee_name,
            "date": self.date,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "display_time": self.display_time,
            "duration_hours": self.duration_hours,
            "position": self.position,
            "position_color": self.position_color,
            "department": self.department,
            "location": self.location,
            "is_available_for_swap": self.is_available_for_swap,
            "swap_note": self.swap_note,
        }


class SwipeRequest:
    """Shift swap request between two employees."""
    
    def __init__(
        self,
        requester_id: int,
        requester_name: str,
        requester_shift: Dict,
        target_id: int,
        target_name: str,
        target_shift: Dict,
        reason: str = "",
        department: str = "Default"
    ):
        self.id = str(uuid.uuid4())
        self.requester_id = requester_id
        self.requester_name = requester_name
        self.requester_shift = requester_shift
        self.target_id = target_id
        self.target_name = target_name
        self.target_shift = target_shift
        self.reason = reason
        self.department = department
        self.position = requester_shift.get("position", "Default")
        self.status = SwipeStatus.PENDING
        self.created_at = datetime.utcnow()
        self.responded_at = None
        self.manager_reviewed_at = None
        self.manager_id = None
        self.manager_name = None
        self.manager_notes = ""
        self.overtime_warning = False
        self.overtime_details = {}
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "requester_id": self.requester_id,
            "requester_name": self.requester_name,
            "requester_shift": self.requester_shift,
            "target_id": self.target_id,
            "target_name": self.target_name,
            "target_shift": self.target_shift,
            "reason": self.reason,
            "department": self.department,
            "position": self.position,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "responded_at": self.responded_at.isoformat() if self.responded_at else None,
            "manager_reviewed_at": self.manager_reviewed_at.isoformat() if self.manager_reviewed_at else None,
            "manager_id": self.manager_id,
            "manager_name": self.manager_name,
            "manager_notes": self.manager_notes,
            "overtime_warning": self.overtime_warning,
            "overtime_details": self.overtime_details,
        }


class SaurelliusSwipe:
    """
    SWIPE - Schedule Swap Management System
    Handles shift swapping between employees with manager approval.
    """
    
    def __init__(self):
        self.shifts: Dict[str, Shift] = {}
        self.swap_requests: Dict[str, SwipeRequest] = {}
        self.employee_schedules: Dict[int, List[str]] = {}  # employee_id -> [shift_ids]
        self.weekly_hours: Dict[int, Dict[str, float]] = {}  # employee_id -> {week_start: hours}
        
        # Default overtime threshold (40 hours)
        self.overtime_threshold = 40.0
        
        # Generate sample data
        self._generate_sample_data()
    
    def _generate_sample_data(self):
        """Generate sample shifts and employees for demo."""
        employees = [
            (1, "Elena Smith", "manager"),
            (2, "Stephan Salvatore", "server"),
            (3, "Mandy Rosh", "host"),
            (4, "Ben Shield", "line_cook"),
            (5, "Carmen Lowe", "chef"),
            (6, "Dan Jackson", "busser"),
            (7, "Autumn Rose", "server"),
            (8, "Eddie Combs", "manager"),
            (9, "Denis Gillespie", "chef"),
            (10, "Harriet Roberts", "line_cook"),
        ]
        
        # Get current week dates
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        shifts_data = [
            # Monday
            (1, week_start, "10:00", "18:00"),
            (2, week_start, "11:00", "19:00"),
            (4, week_start, "08:00", "16:00"),
            # Tuesday
            (3, week_start + timedelta(days=1), "13:00", "21:00"),
            (5, week_start + timedelta(days=1), "08:00", "16:00"),
            (7, week_start + timedelta(days=1), "11:00", "19:00"),
            # Wednesday
            (1, week_start + timedelta(days=2), "09:00", "17:00"),
            (2, week_start + timedelta(days=2), "15:00", "23:00"),
            (6, week_start + timedelta(days=2), "08:00", "16:00"),
            # Thursday
            (3, week_start + timedelta(days=3), "10:00", "18:00"),
            (4, week_start + timedelta(days=3), "08:00", "16:00"),
            (9, week_start + timedelta(days=3), "08:00", "16:00"),
            # Friday
            (5, week_start + timedelta(days=4), "11:00", "19:00"),
            (7, week_start + timedelta(days=4), "13:00", "21:00"),
            (8, week_start + timedelta(days=4), "09:00", "17:00"),
            # Saturday
            (2, week_start + timedelta(days=5), "10:00", "18:00"),
            (6, week_start + timedelta(days=5), "12:00", "20:00"),
            (10, week_start + timedelta(days=5), "08:00", "16:00"),
            # Sunday
            (1, week_start + timedelta(days=6), "11:00", "19:00"),
            (3, week_start + timedelta(days=6), "13:00", "21:00"),
        ]
        
        for emp_id, shift_date, start, end in shifts_data:
            emp = next((e for e in employees if e[0] == emp_id), None)
            if emp:
                shift = Shift(
                    employee_id=emp[0],
                    employee_name=emp[1],
                    shift_date=shift_date.isoformat(),
                    start_time=start,
                    end_time=end,
                    position=emp[2],
                    department="North Loop"
                )
                self.shifts[shift.id] = shift
                
                if emp_id not in self.employee_schedules:
                    self.employee_schedules[emp_id] = []
                self.employee_schedules[emp_id].append(shift.id)
    
    # ==================== SHIFT MANAGEMENT ====================
    
    def create_shift(
        self,
        employee_id: int,
        employee_name: str,
        shift_date: str,
        start_time: str,
        end_time: str,
        position: str,
        department: str = "Default",
        location: str = ""
    ) -> Dict:
        """Create a new shift."""
        shift = Shift(
            employee_id=employee_id,
            employee_name=employee_name,
            shift_date=shift_date,
            start_time=start_time,
            end_time=end_time,
            position=position,
            department=department,
            location=location
        )
        
        self.shifts[shift.id] = shift
        
        if employee_id not in self.employee_schedules:
            self.employee_schedules[employee_id] = []
        self.employee_schedules[employee_id].append(shift.id)
        
        return {"success": True, "shift": shift.to_dict()}
    
    def get_shift(self, shift_id: str) -> Dict:
        """Get a specific shift."""
        if shift_id not in self.shifts:
            return {"success": False, "error": "Shift not found"}
        return {"success": True, "shift": self.shifts[shift_id].to_dict()}
    
    def get_employee_shifts(
        self,
        employee_id: int,
        start_date: str = None,
        end_date: str = None
    ) -> Dict:
        """Get all shifts for an employee."""
        shift_ids = self.employee_schedules.get(employee_id, [])
        shifts = []
        
        for sid in shift_ids:
            if sid in self.shifts:
                shift = self.shifts[sid]
                if start_date and shift.date < start_date:
                    continue
                if end_date and shift.date > end_date:
                    continue
                shifts.append(shift.to_dict())
        
        shifts.sort(key=lambda x: (x["date"], x["start_time"]))
        
        return {
            "success": True,
            "shifts": shifts,
            "total": len(shifts)
        }
    
    def mark_shift_available(
        self,
        shift_id: str,
        employee_id: int,
        note: str = ""
    ) -> Dict:
        """Mark a shift as available for swap."""
        if shift_id not in self.shifts:
            return {"success": False, "error": "Shift not found"}
        
        shift = self.shifts[shift_id]
        if shift.employee_id != employee_id:
            return {"success": False, "error": "Not your shift"}
        
        shift.is_available_for_swap = True
        shift.swap_note = note
        
        return {"success": True, "shift": shift.to_dict()}
    
    def get_available_shifts(self, employee_id: int = None) -> Dict:
        """Get all shifts available for swap."""
        available = []
        
        for shift in self.shifts.values():
            if shift.is_available_for_swap:
                if employee_id and shift.employee_id == employee_id:
                    continue  # Don't show own shifts
                available.append(shift.to_dict())
        
        available.sort(key=lambda x: (x["date"], x["start_time"]))
        
        return {
            "success": True,
            "available_shifts": available,
            "total": len(available)
        }
    
    # ==================== SWIPE REQUESTS ====================
    
    def create_swap_request(
        self,
        requester_id: int,
        requester_name: str,
        requester_shift_id: str,
        target_id: int,
        target_name: str,
        target_shift_id: str,
        reason: str = ""
    ) -> Dict:
        """Create a new swap request."""
        
        # Validate shifts exist
        if requester_shift_id not in self.shifts:
            return {"success": False, "error": "Your shift not found"}
        if target_shift_id not in self.shifts:
            return {"success": False, "error": "Target shift not found"}
        
        requester_shift = self.shifts[requester_shift_id]
        target_shift = self.shifts[target_shift_id]
        
        # Validate ownership
        if requester_shift.employee_id != requester_id:
            return {"success": False, "error": "Not your shift"}
        if target_shift.employee_id != target_id:
            return {"success": False, "error": "Target doesn't own that shift"}
        
        # Check overtime implications
        overtime_check = self._check_overtime_impact(
            requester_id, target_id,
            requester_shift, target_shift
        )
        
        # Create request
        request = SwipeRequest(
            requester_id=requester_id,
            requester_name=requester_name,
            requester_shift=requester_shift.to_dict(),
            target_id=target_id,
            target_name=target_name,
            target_shift=target_shift.to_dict(),
            reason=reason,
            department=requester_shift.department
        )
        
        if overtime_check["has_overtime"]:
            request.overtime_warning = True
            request.overtime_details = overtime_check
        
        self.swap_requests[request.id] = request
        
        return {
            "success": True,
            "swap_request": request.to_dict(),
            "overtime_warning": overtime_check
        }
    
    def respond_to_request(
        self,
        request_id: str,
        employee_id: int,
        accept: bool,
        message: str = ""
    ) -> Dict:
        """Target employee responds to swap request."""
        if request_id not in self.swap_requests:
            return {"success": False, "error": "Request not found"}
        
        request = self.swap_requests[request_id]
        
        if request.target_id != employee_id:
            return {"success": False, "error": "Not authorized"}
        
        if request.status != SwipeStatus.PENDING:
            return {"success": False, "error": "Request already processed"}
        
        request.responded_at = datetime.utcnow()
        
        if accept:
            request.status = SwipeStatus.MANAGER_PENDING
        else:
            request.status = SwipeStatus.DECLINED
        
        return {"success": True, "swap_request": request.to_dict()}
    
    def manager_review(
        self,
        request_id: str,
        manager_id: int,
        manager_name: str,
        approve: bool,
        notes: str = ""
    ) -> Dict:
        """Manager reviews and approves/denies swap request."""
        if request_id not in self.swap_requests:
            return {"success": False, "error": "Request not found"}
        
        request = self.swap_requests[request_id]
        
        if request.status != SwipeStatus.MANAGER_PENDING:
            return {"success": False, "error": "Request not awaiting manager approval"}
        
        request.manager_id = manager_id
        request.manager_name = manager_name
        request.manager_notes = notes
        request.manager_reviewed_at = datetime.utcnow()
        
        if approve:
            request.status = SwipeStatus.MANAGER_APPROVED
            # Execute the swap
            self._execute_swap(request)
        else:
            request.status = SwipeStatus.MANAGER_DENIED
        
        return {"success": True, "swap_request": request.to_dict()}
    
    def _execute_swap(self, request: SwipeRequest):
        """Execute the actual shift swap."""
        requester_shift_id = request.requester_shift["id"]
        target_shift_id = request.target_shift["id"]
        
        if requester_shift_id in self.shifts and target_shift_id in self.shifts:
            # Swap employee assignments
            req_shift = self.shifts[requester_shift_id]
            tgt_shift = self.shifts[target_shift_id]
            
            # Swap IDs and names
            req_shift.employee_id, tgt_shift.employee_id = tgt_shift.employee_id, req_shift.employee_id
            req_shift.employee_name, tgt_shift.employee_name = tgt_shift.employee_name, req_shift.employee_name
            
            # Update schedules
            if request.requester_id in self.employee_schedules:
                if requester_shift_id in self.employee_schedules[request.requester_id]:
                    self.employee_schedules[request.requester_id].remove(requester_shift_id)
                self.employee_schedules[request.requester_id].append(target_shift_id)
            
            if request.target_id in self.employee_schedules:
                if target_shift_id in self.employee_schedules[request.target_id]:
                    self.employee_schedules[request.target_id].remove(target_shift_id)
                self.employee_schedules[request.target_id].append(requester_shift_id)
            
            # Clear swap availability
            req_shift.is_available_for_swap = False
            tgt_shift.is_available_for_swap = False
    
    def _check_overtime_impact(
        self,
        requester_id: int,
        target_id: int,
        requester_shift: Shift,
        target_shift: Shift
    ) -> Dict:
        """Check if swap would cause overtime."""
        # Get week boundaries for both shifts
        req_date = datetime.fromisoformat(requester_shift.date)
        tgt_date = datetime.fromisoformat(target_shift.date)
        
        # Calculate weekly hours after swap
        # For simplicity, return warning if shift > 8 hours
        has_overtime = False
        details = {}
        
        if requester_shift.duration_hours > 8 or target_shift.duration_hours > 8:
            has_overtime = True
            details = {
                "requester_shift_hours": requester_shift.duration_hours,
                "target_shift_hours": target_shift.duration_hours,
                "warning": "Long shift detected - verify weekly hours don't exceed 40"
            }
        
        return {
            "has_overtime": has_overtime,
            "details": details
        }
    
    def get_pending_requests_for_manager(self, department: str = None) -> Dict:
        """Get all requests awaiting manager approval."""
        pending = []
        
        for req in self.swap_requests.values():
            if req.status == SwipeStatus.MANAGER_PENDING:
                if department and req.department != department:
                    continue
                pending.append(req.to_dict())
        
        pending.sort(key=lambda x: x["created_at"])
        
        return {
            "success": True,
            "pending_requests": pending,
            "total": len(pending)
        }
    
    def get_requests_for_employee(self, employee_id: int) -> Dict:
        """Get swap requests for an employee (incoming and outgoing)."""
        incoming = []
        outgoing = []
        
        for req in self.swap_requests.values():
            if req.requester_id == employee_id:
                outgoing.append(req.to_dict())
            elif req.target_id == employee_id:
                incoming.append(req.to_dict())
        
        return {
            "success": True,
            "incoming": incoming,
            "outgoing": outgoing
        }
    
    def get_swap_history(self, employee_id: int = None, limit: int = 50) -> Dict:
        """Get swap request history."""
        history = []
        
        for req in self.swap_requests.values():
            if req.status in [SwipeStatus.MANAGER_APPROVED, SwipeStatus.MANAGER_DENIED, SwipeStatus.DECLINED]:
                if employee_id and req.requester_id != employee_id and req.target_id != employee_id:
                    continue
                history.append(req.to_dict())
        
        history.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "success": True,
            "history": history[:limit],
            "total": len(history)
        }


# Global instance
swipe_service = SaurelliusSwipe()
