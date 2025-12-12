"""
SAURELLIUS WORKFORCE - Real-Time Workforce Monitoring & Management
Bird's eye view of your entire workforce - who is where, doing what, and when

Features:
- Real-time employee location & status tracking
- Weekly schedule grid view (like a captain's observation tower)
- Position-based color coding with pastel themes
- Overtime monitoring & alerts
- Department/Location filtering
- Publish & notify schedules
- Time-off tracking
- Availability management
"""

from datetime import datetime, timedelta, date, time
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import uuid
from decimal import Decimal


class EmployeeStatus(Enum):
    CLOCKED_IN = "clocked_in"
    CLOCKED_OUT = "clocked_out"
    ON_BREAK = "on_break"
    TIME_OFF = "time_off"
    UNAVAILABLE = "unavailable"
    SCHEDULED = "scheduled"
    NOT_SCHEDULED = "not_scheduled"


class TimeOffType(Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    BEREAVEMENT = "bereavement"
    JURY_DUTY = "jury_duty"
    UNPAID = "unpaid"


# Pastel position colors matching the design
POSITION_COLORS = {
    "manager": {"bg": "#E8D5F2", "text": "#7C3AED", "border": "#C4B5FD"},
    "chef": {"bg": "#FFEDD5", "text": "#EA580C", "border": "#FDBA74"},
    "line_cook": {"bg": "#DCFCE7", "text": "#16A34A", "border": "#86EFAC"},
    "server": {"bg": "#DBEAFE", "text": "#2563EB", "border": "#93C5FD"},
    "host": {"bg": "#FEE2E2", "text": "#DC2626", "border": "#FCA5A5"},
    "busser": {"bg": "#FEF9C3", "text": "#CA8A04", "border": "#FDE047"},
    "dishwasher": {"bg": "#F3F4F6", "text": "#4B5563", "border": "#D1D5DB"},
    "bartender": {"bg": "#EDE9FE", "text": "#7C3AED", "border": "#C4B5FD"},
    "cashier": {"bg": "#FCE7F3", "text": "#DB2777", "border": "#F9A8D4"},
    "supervisor": {"bg": "#CFFAFE", "text": "#0891B2", "border": "#67E8F9"},
    "assistant": {"bg": "#E0E7FF", "text": "#4F46E5", "border": "#A5B4FC"},
    "developer": {"bg": "#CCFBF1", "text": "#0D9488", "border": "#5EEAD4"},
    "designer": {"bg": "#FFE4E6", "text": "#E11D48", "border": "#FDA4AF"},
    "analyst": {"bg": "#FEF3C7", "text": "#D97706", "border": "#FCD34D"},
    "engineer": {"bg": "#DBEAFE", "text": "#1D4ED8", "border": "#60A5FA"},
    "coordinator": {"bg": "#F3E8FF", "text": "#9333EA", "border": "#C084FC"},
    "default": {"bg": "#F1F5F9", "text": "#475569", "border": "#CBD5E1"},
}

# Days of week
DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


class Employee:
    """Employee object for workforce tracking."""
    
    def __init__(
        self,
        employee_id: int,
        name: str,
        position: str,
        department: str = "Default",
        email: str = "",
        phone: str = "",
        hourly_rate: float = 15.00,
        max_hours: int = 40,
        avatar_url: str = None
    ):
        self.id = employee_id
        self.name = name
        self.position = position
        self.department = department
        self.email = email
        self.phone = phone
        self.hourly_rate = hourly_rate
        self.max_hours = max_hours
        self.avatar_url = avatar_url
        self.status = EmployeeStatus.NOT_SCHEDULED
        self.current_location = ""
        self.clock_in_time = None
        self.scheduled_hours = 0.0
        self.worked_hours = 0.0
        self.overtime_hours = 0.0
        self.is_active = True
    
    @property
    def position_color(self) -> Dict:
        key = self.position.lower().replace(" ", "_")
        return POSITION_COLORS.get(key, POSITION_COLORS["default"])
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "position": self.position,
            "position_color": self.position_color,
            "department": self.department,
            "email": self.email,
            "phone": self.phone,
            "hourly_rate": self.hourly_rate,
            "max_hours": self.max_hours,
            "avatar_url": self.avatar_url,
            "status": self.status.value,
            "current_location": self.current_location,
            "clock_in_time": self.clock_in_time.isoformat() if self.clock_in_time else None,
            "scheduled_hours": self.scheduled_hours,
            "worked_hours": self.worked_hours,
            "overtime_hours": self.overtime_hours,
            "is_active": self.is_active,
        }


class WorkforceShift:
    """Shift for workforce scheduling grid."""
    
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
        notes: str = ""
    ):
        self.id = str(uuid.uuid4())
        self.employee_id = employee_id
        self.employee_name = employee_name
        self.date = shift_date
        self.start_time = start_time
        self.end_time = end_time
        self.position = position
        self.department = department
        self.location = location
        self.notes = notes
        self.status = "scheduled"  # scheduled, completed, missed, partial
        self.actual_clock_in = None
        self.actual_clock_out = None
        self.is_published = False
        self.is_time_off = False
        self.time_off_type = None
    
    @property
    def duration_hours(self) -> float:
        start = datetime.strptime(self.start_time, "%H:%M")
        end = datetime.strptime(self.end_time, "%H:%M")
        if end < start:
            end += timedelta(days=1)
        return round((end - start).seconds / 3600, 2)
    
    @property
    def display_time(self) -> str:
        start = datetime.strptime(self.start_time, "%H:%M")
        end = datetime.strptime(self.end_time, "%H:%M")
        return f"{start.strftime('%I%p').lstrip('0').lower()}-{end.strftime('%I%p').lstrip('0').lower()}"
    
    @property
    def position_color(self) -> Dict:
        key = self.position.lower().replace(" ", "_")
        return POSITION_COLORS.get(key, POSITION_COLORS["default"])
    
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
            "notes": self.notes,
            "status": self.status,
            "is_published": self.is_published,
            "is_time_off": self.is_time_off,
            "time_off_type": self.time_off_type,
        }


class TimeOffRequest:
    """Employee time off request."""
    
    def __init__(
        self,
        employee_id: int,
        employee_name: str,
        start_date: str,
        end_date: str,
        time_off_type: str,
        reason: str = "",
        is_all_day: bool = True
    ):
        self.id = str(uuid.uuid4())
        self.employee_id = employee_id
        self.employee_name = employee_name
        self.start_date = start_date
        self.end_date = end_date
        self.time_off_type = time_off_type
        self.reason = reason
        self.is_all_day = is_all_day
        self.status = "pending"  # pending, approved, denied
        self.created_at = datetime.utcnow()
        self.reviewed_by = None
        self.reviewed_at = None
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": self.employee_name,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "time_off_type": self.time_off_type,
            "reason": self.reason,
            "is_all_day": self.is_all_day,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class SaurelliusWorkforce:
    """
    WORKFORCE - Real-Time Workforce Monitoring Dashboard
    Bird's eye view of who is where, doing what, and when.
    """
    
    def __init__(self):
        self.employees: Dict[int, Employee] = {}
        self.shifts: Dict[str, WorkforceShift] = {}
        self.time_off_requests: Dict[str, TimeOffRequest] = {}
        self.locations = ["North Loop", "Downtown", "Midtown", "Remote"]
        self.departments = ["Operations", "Kitchen", "Front of House", "Management", "Engineering"]
        
        # Generate sample data
        self._generate_sample_data()
    
    def _generate_sample_data(self):
        """Generate sample employees and schedules."""
        sample_employees = [
            (1, "Ben Shield", "Designer", "Engineering"),
            (2, "Elena Smith", "Designer", "Engineering"),
            (3, "Stephan Salvatore", "Designer", "Engineering"),
            (4, "Mandy Rosh", "Designer", "Engineering"),
            (5, "Carmen Lowe", "Developer", "Engineering"),
            (6, "Dan Jackson", "Manager", "Management"),
            (7, "Autumn Rose", "Assistant", "Operations"),
            (8, "Eddie Combs", "Manager", "Management"),
            (9, "Denis Gillespie", "Chef", "Kitchen"),
            (10, "Harriet Roberts", "Server", "Front of House"),
        ]
        
        for emp_id, name, position, dept in sample_employees:
            self.employees[emp_id] = Employee(
                employee_id=emp_id,
                name=name,
                position=position,
                department=dept,
                hourly_rate=25.00 if position in ["Manager", "Developer"] else 18.00,
                max_hours=40
            )
        
        # Generate weekly schedule
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        # Create shifts for each employee across the week
        shift_patterns = [
            # (employee_id, day_offset, start, end)
            (1, 0, "10:00", "19:00"), (1, 1, "10:00", "19:00"), (1, 2, "10:00", "19:00"),
            (1, 3, "10:00", "19:00"), (1, 4, "10:00", "19:00"),
            (2, 0, "10:00", "19:00"), (2, 1, "10:00", "19:00"), (2, 2, "10:00", "19:00"),
            (2, 3, "10:00", "19:00"), (2, 5, "10:00", "19:00"),
            (3, 0, "10:00", "19:00"), (3, 2, "10:00", "19:00"), (3, 3, "10:00", "19:00"),
            (3, 4, "10:00", "19:00"), (3, 5, "10:00", "19:00"),
            (4, 1, "10:00", "19:00"), (4, 2, "10:00", "19:00"), (4, 3, "10:00", "19:00"),
            (4, 4, "10:00", "19:00"), (4, 6, "10:00", "19:00"),
            (5, 0, "09:00", "18:00"), (5, 1, "09:00", "18:00"), (5, 2, "09:00", "18:00"),
            (5, 3, "09:00", "18:00"), (5, 4, "09:00", "18:00"),
            (6, 0, "08:00", "17:00"), (6, 1, "08:00", "17:00"), (6, 2, "08:00", "17:00"),
            (6, 3, "08:00", "17:00"), (6, 4, "08:00", "17:00"),
            (7, 1, "10:00", "19:00"), (7, 2, "10:00", "19:00"), (7, 4, "10:00", "19:00"),
            (7, 5, "10:00", "19:00"),
            (8, 0, "09:00", "17:00"), (8, 2, "09:00", "17:00"), (8, 4, "09:00", "17:00"),
            (9, 0, "06:00", "14:00"), (9, 1, "06:00", "14:00"), (9, 2, "06:00", "14:00"),
            (9, 3, "06:00", "14:00"), (9, 4, "06:00", "14:00"),
            (10, 2, "11:00", "20:00"), (10, 3, "11:00", "20:00"), (10, 4, "11:00", "20:00"),
            (10, 5, "11:00", "20:00"), (10, 6, "11:00", "20:00"),
        ]
        
        for emp_id, day_offset, start, end in shift_patterns:
            if emp_id in self.employees:
                emp = self.employees[emp_id]
                shift_date = (week_start + timedelta(days=day_offset)).isoformat()
                
                shift = WorkforceShift(
                    employee_id=emp_id,
                    employee_name=emp.name,
                    shift_date=shift_date,
                    start_time=start,
                    end_time=end,
                    position=emp.position,
                    department=emp.department,
                    location="North Loop"
                )
                shift.is_published = True
                self.shifts[shift.id] = shift
        
        # Add some time off
        time_off_shift = WorkforceShift(
            employee_id=3,
            employee_name="Stephan Salvatore",
            shift_date=(week_start + timedelta(days=1)).isoformat(),
            start_time="00:00",
            end_time="23:59",
            position="Designer",
            department="Engineering"
        )
        time_off_shift.is_time_off = True
        time_off_shift.time_off_type = "vacation"
        time_off_shift.status = "time_off"
        self.shifts[time_off_shift.id] = shift
    
    # ==================== SCHEDULE GRID ====================
    
    def get_weekly_schedule(
        self,
        week_start: str = None,
        department: str = None,
        location: str = None,
        positions: List[str] = None
    ) -> Dict:
        """
        Get the weekly schedule grid - the captain's view.
        Returns employees as rows and days as columns.
        """
        if not week_start:
            today = date.today()
            week_start_date = today - timedelta(days=today.weekday())
        else:
            week_start_date = datetime.fromisoformat(week_start).date()
        
        week_end_date = week_start_date + timedelta(days=6)
        
        # Build date range
        dates = []
        for i in range(7):
            d = week_start_date + timedelta(days=i)
            dates.append({
                "date": d.isoformat(),
                "day_name": DAYS_OF_WEEK[i],
                "day_number": d.day,
                "is_today": d == date.today()
            })
        
        # Filter employees
        filtered_employees = []
        for emp in self.employees.values():
            if department and emp.department != department:
                continue
            if positions and emp.position.lower() not in [p.lower() for p in positions]:
                continue
            filtered_employees.append(emp)
        
        # Build schedule grid
        schedule_grid = []
        
        for emp in filtered_employees:
            # Get shifts for this employee this week
            emp_shifts = {}
            total_hours = 0.0
            overtime_hours = 0.0
            
            for shift in self.shifts.values():
                if shift.employee_id != emp.id:
                    continue
                if shift.date < week_start_date.isoformat():
                    continue
                if shift.date > week_end_date.isoformat():
                    continue
                
                emp_shifts[shift.date] = shift.to_dict()
                total_hours += shift.duration_hours
            
            if total_hours > 40:
                overtime_hours = total_hours - 40
            
            # Build row
            row = {
                "employee": emp.to_dict(),
                "scheduled_hours": total_hours,
                "overtime_hours": overtime_hours,
                "has_overtime": overtime_hours > 0,
                "shifts_by_date": emp_shifts,
                "days": []
            }
            
            # Add each day
            for d in dates:
                day_shift = emp_shifts.get(d["date"])
                row["days"].append({
                    "date": d["date"],
                    "shift": day_shift,
                    "has_shift": day_shift is not None,
                    "is_time_off": day_shift["is_time_off"] if day_shift else False
                })
            
            schedule_grid.append(row)
        
        # Sort by name
        schedule_grid.sort(key=lambda x: x["employee"]["name"])
        
        return {
            "success": True,
            "week_start": week_start_date.isoformat(),
            "week_end": week_end_date.isoformat(),
            "dates": dates,
            "schedule": schedule_grid,
            "total_employees": len(schedule_grid),
            "positions": list(set(e.position for e in filtered_employees)),
            "available_positions": list(POSITION_COLORS.keys())
        }
    
    def get_daily_view(self, target_date: str = None) -> Dict:
        """Get all shifts for a specific day."""
        if not target_date:
            target_date = date.today().isoformat()
        
        day_shifts = []
        for shift in self.shifts.values():
            if shift.date == target_date:
                day_shifts.append(shift.to_dict())
        
        # Group by time slot
        morning = [s for s in day_shifts if s["start_time"] < "12:00"]
        afternoon = [s for s in day_shifts if "12:00" <= s["start_time"] < "17:00"]
        evening = [s for s in day_shifts if s["start_time"] >= "17:00"]
        
        return {
            "success": True,
            "date": target_date,
            "total_shifts": len(day_shifts),
            "morning": morning,
            "afternoon": afternoon,
            "evening": evening,
            "all_shifts": day_shifts
        }
    
    # ==================== REAL-TIME STATUS ====================
    
    def clock_in(self, employee_id: int, location: str = "") -> Dict:
        """Clock in an employee."""
        if employee_id not in self.employees:
            return {"success": False, "error": "Employee not found"}
        
        emp = self.employees[employee_id]
        emp.status = EmployeeStatus.CLOCKED_IN
        emp.clock_in_time = datetime.utcnow()
        emp.current_location = location
        
        return {
            "success": True,
            "employee": emp.to_dict(),
            "clock_in_time": emp.clock_in_time.isoformat()
        }
    
    def clock_out(self, employee_id: int) -> Dict:
        """Clock out an employee."""
        if employee_id not in self.employees:
            return {"success": False, "error": "Employee not found"}
        
        emp = self.employees[employee_id]
        
        if emp.clock_in_time:
            worked = (datetime.utcnow() - emp.clock_in_time).seconds / 3600
            emp.worked_hours += worked
        
        emp.status = EmployeeStatus.CLOCKED_OUT
        emp.clock_in_time = None
        emp.current_location = ""
        
        return {
            "success": True,
            "employee": emp.to_dict()
        }
    
    def start_break(self, employee_id: int) -> Dict:
        """Start break for an employee."""
        if employee_id not in self.employees:
            return {"success": False, "error": "Employee not found"}
        
        emp = self.employees[employee_id]
        emp.status = EmployeeStatus.ON_BREAK
        
        return {"success": True, "employee": emp.to_dict()}
    
    def end_break(self, employee_id: int) -> Dict:
        """End break for an employee."""
        if employee_id not in self.employees:
            return {"success": False, "error": "Employee not found"}
        
        emp = self.employees[employee_id]
        emp.status = EmployeeStatus.CLOCKED_IN
        
        return {"success": True, "employee": emp.to_dict()}
    
    def get_live_status(self, department: str = None) -> Dict:
        """Get real-time status of all employees - the observation tower view."""
        clocked_in = []
        on_break = []
        clocked_out = []
        
        for emp in self.employees.values():
            if department and emp.department != department:
                continue
            
            emp_data = emp.to_dict()
            
            if emp.status == EmployeeStatus.CLOCKED_IN:
                clocked_in.append(emp_data)
            elif emp.status == EmployeeStatus.ON_BREAK:
                on_break.append(emp_data)
            else:
                clocked_out.append(emp_data)
        
        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "clocked_in": clocked_in,
            "on_break": on_break,
            "clocked_out": clocked_out,
            "summary": {
                "total_clocked_in": len(clocked_in),
                "total_on_break": len(on_break),
                "total_clocked_out": len(clocked_out),
                "total_employees": len(clocked_in) + len(on_break) + len(clocked_out)
            }
        }
    
    # ==================== SCHEDULE MANAGEMENT ====================
    
    def create_shift(
        self,
        employee_id: int,
        shift_date: str,
        start_time: str,
        end_time: str,
        notes: str = ""
    ) -> Dict:
        """Create a new shift."""
        if employee_id not in self.employees:
            return {"success": False, "error": "Employee not found"}
        
        emp = self.employees[employee_id]
        
        shift = WorkforceShift(
            employee_id=employee_id,
            employee_name=emp.name,
            shift_date=shift_date,
            start_time=start_time,
            end_time=end_time,
            position=emp.position,
            department=emp.department,
            notes=notes
        )
        
        self.shifts[shift.id] = shift
        
        return {"success": True, "shift": shift.to_dict()}
    
    def update_shift(
        self,
        shift_id: str,
        start_time: str = None,
        end_time: str = None,
        notes: str = None
    ) -> Dict:
        """Update an existing shift."""
        if shift_id not in self.shifts:
            return {"success": False, "error": "Shift not found"}
        
        shift = self.shifts[shift_id]
        
        if start_time:
            shift.start_time = start_time
        if end_time:
            shift.end_time = end_time
        if notes is not None:
            shift.notes = notes
        
        return {"success": True, "shift": shift.to_dict()}
    
    def delete_shift(self, shift_id: str) -> Dict:
        """Delete a shift."""
        if shift_id not in self.shifts:
            return {"success": False, "error": "Shift not found"}
        
        del self.shifts[shift_id]
        return {"success": True}
    
    def publish_schedule(self, week_start: str, notify: bool = True) -> Dict:
        """Publish the schedule for a week."""
        week_start_date = datetime.fromisoformat(week_start).date()
        week_end_date = week_start_date + timedelta(days=6)
        
        published_count = 0
        for shift in self.shifts.values():
            shift_date = datetime.fromisoformat(shift.date).date()
            if week_start_date <= shift_date <= week_end_date:
                shift.is_published = True
                published_count += 1
        
        return {
            "success": True,
            "published_shifts": published_count,
            "week_start": week_start,
            "notified": notify
        }
    
    # ==================== TIME OFF ====================
    
    def request_time_off(
        self,
        employee_id: int,
        start_date: str,
        end_date: str,
        time_off_type: str,
        reason: str = ""
    ) -> Dict:
        """Submit a time off request."""
        if employee_id not in self.employees:
            return {"success": False, "error": "Employee not found"}
        
        emp = self.employees[employee_id]
        
        request = TimeOffRequest(
            employee_id=employee_id,
            employee_name=emp.name,
            start_date=start_date,
            end_date=end_date,
            time_off_type=time_off_type,
            reason=reason
        )
        
        self.time_off_requests[request.id] = request
        
        return {"success": True, "request": request.to_dict()}
    
    def review_time_off(
        self,
        request_id: str,
        approve: bool,
        reviewer_id: int
    ) -> Dict:
        """Approve or deny a time off request."""
        if request_id not in self.time_off_requests:
            return {"success": False, "error": "Request not found"}
        
        request = self.time_off_requests[request_id]
        request.status = "approved" if approve else "denied"
        request.reviewed_by = reviewer_id
        request.reviewed_at = datetime.utcnow()
        
        # If approved, create time-off shifts
        if approve:
            start = datetime.fromisoformat(request.start_date).date()
            end = datetime.fromisoformat(request.end_date).date()
            current = start
            
            while current <= end:
                emp = self.employees.get(request.employee_id)
                if emp:
                    shift = WorkforceShift(
                        employee_id=request.employee_id,
                        employee_name=emp.name,
                        shift_date=current.isoformat(),
                        start_time="00:00",
                        end_time="23:59",
                        position=emp.position,
                        department=emp.department
                    )
                    shift.is_time_off = True
                    shift.time_off_type = request.time_off_type
                    shift.status = "time_off"
                    self.shifts[shift.id] = shift
                
                current += timedelta(days=1)
        
        return {"success": True, "request": request.to_dict()}
    
    def get_time_off_requests(self, status: str = None) -> Dict:
        """Get time off requests."""
        requests = []
        for req in self.time_off_requests.values():
            if status and req.status != status:
                continue
            requests.append(req.to_dict())
        
        requests.sort(key=lambda x: x["start_date"])
        
        return {"success": True, "requests": requests}
    
    # ==================== ANALYTICS ====================
    
    def get_workforce_stats(self, week_start: str = None) -> Dict:
        """Get workforce statistics."""
        if not week_start:
            today = date.today()
            week_start_date = today - timedelta(days=today.weekday())
        else:
            week_start_date = datetime.fromisoformat(week_start).date()
        
        week_end_date = week_start_date + timedelta(days=6)
        
        total_scheduled_hours = 0
        total_overtime_hours = 0
        employees_with_overtime = 0
        
        employee_hours = {}
        
        for shift in self.shifts.values():
            shift_date = datetime.fromisoformat(shift.date).date()
            if week_start_date <= shift_date <= week_end_date:
                if shift.employee_id not in employee_hours:
                    employee_hours[shift.employee_id] = 0
                employee_hours[shift.employee_id] += shift.duration_hours
                total_scheduled_hours += shift.duration_hours
        
        for emp_id, hours in employee_hours.items():
            if hours > 40:
                overtime = hours - 40
                total_overtime_hours += overtime
                employees_with_overtime += 1
        
        # Position breakdown
        position_counts = {}
        for emp in self.employees.values():
            pos = emp.position
            position_counts[pos] = position_counts.get(pos, 0) + 1
        
        return {
            "success": True,
            "week_start": week_start_date.isoformat(),
            "total_employees": len(self.employees),
            "total_scheduled_hours": round(total_scheduled_hours, 2),
            "total_overtime_hours": round(total_overtime_hours, 2),
            "employees_with_overtime": employees_with_overtime,
            "average_hours_per_employee": round(total_scheduled_hours / len(self.employees), 2) if self.employees else 0,
            "position_breakdown": position_counts,
            "position_colors": POSITION_COLORS
        }
    
    # ==================== EMPLOYEES ====================
    
    def get_employees(self, department: str = None, position: str = None) -> Dict:
        """Get all employees."""
        employees = []
        for emp in self.employees.values():
            if department and emp.department != department:
                continue
            if position and emp.position.lower() != position.lower():
                continue
            employees.append(emp.to_dict())
        
        employees.sort(key=lambda x: x["name"])
        
        return {
            "success": True,
            "employees": employees,
            "total": len(employees)
        }
    
    def get_employee(self, employee_id: int) -> Dict:
        """Get a specific employee."""
        if employee_id not in self.employees:
            return {"success": False, "error": "Employee not found"}
        
        return {"success": True, "employee": self.employees[employee_id].to_dict()}


# Global instance
workforce_service = SaurelliusWorkforce()
