"""
SAURELLIUS EMPLOYEE ONBOARDING SERVICE
Self-service onboarding workflows, document collection, task management
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional
from enum import Enum
import uuid


class OnboardingStatus(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    BLOCKED = "blocked"


class DocumentType(Enum):
    W4 = "w4"
    I9 = "i9"
    STATE_W4 = "state_w4"
    DIRECT_DEPOSIT = "direct_deposit"
    EMERGENCY_CONTACT = "emergency_contact"
    TAX_ID = "tax_id"
    DRIVERS_LICENSE = "drivers_license"
    PASSPORT = "passport"
    WORK_AUTHORIZATION = "work_authorization"
    BENEFITS_ENROLLMENT = "benefits_enrollment"
    HANDBOOK_ACKNOWLEDGMENT = "handbook_acknowledgment"
    POLICY_AGREEMENT = "policy_agreement"
    NDA = "nda"
    OFFER_LETTER = "offer_letter"
    CUSTOM = "custom"


class SaurelliusOnboarding:
    """Complete employee onboarding system"""
    
    def __init__(self, company_id: str):
        self.company_id = company_id
        self.onboarding_workflows: Dict[str, dict] = {}
        self.task_templates: List[dict] = []
        self.documents: List[dict] = []
        self.e_signatures: List[dict] = []
        
        self._initialize_default_tasks()
    
    def _initialize_default_tasks(self):
        """Initialize default onboarding task templates"""
        self.task_templates = [
            # Personal Information
            {
                "id": "personal_info",
                "category": "personal",
                "name": "Personal Information",
                "description": "Complete your personal details",
                "order": 1,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 10,
                "fields": ["first_name", "last_name", "email", "phone", "address", "ssn", "dob"]
            },
            {
                "id": "emergency_contact",
                "category": "personal",
                "name": "Emergency Contact",
                "description": "Add emergency contact information",
                "order": 2,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 5
            },
            
            # Tax Documents
            {
                "id": "w4_federal",
                "category": "tax",
                "name": "Federal W-4",
                "description": "Complete federal tax withholding form",
                "order": 3,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 10,
                "document_type": DocumentType.W4.value,
                "requires_signature": True
            },
            {
                "id": "w4_state",
                "category": "tax",
                "name": "State Tax Form",
                "description": "Complete state tax withholding form",
                "order": 4,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 5,
                "document_type": DocumentType.STATE_W4.value,
                "requires_signature": True
            },
            
            # Employment Eligibility
            {
                "id": "i9_section1",
                "category": "employment",
                "name": "I-9 Section 1",
                "description": "Complete employment eligibility verification (employee portion)",
                "order": 5,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 10,
                "document_type": DocumentType.I9.value,
                "requires_signature": True
            },
            {
                "id": "i9_section2",
                "category": "employment",
                "name": "I-9 Section 2",
                "description": "Verify employment eligibility documents",
                "order": 6,
                "required": True,
                "assignee": "employer",
                "estimated_minutes": 15,
                "document_type": DocumentType.I9.value,
                "depends_on": "i9_section1"
            },
            {
                "id": "identity_documents",
                "category": "employment",
                "name": "Identity Documents",
                "description": "Upload identity verification documents",
                "order": 7,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 10,
                "accepted_documents": [
                    DocumentType.PASSPORT.value,
                    DocumentType.DRIVERS_LICENSE.value,
                    DocumentType.WORK_AUTHORIZATION.value
                ]
            },
            
            # Payment Setup
            {
                "id": "direct_deposit",
                "category": "payment",
                "name": "Direct Deposit Setup",
                "description": "Set up your bank account for direct deposit",
                "order": 8,
                "required": False,
                "assignee": "employee",
                "estimated_minutes": 5,
                "document_type": DocumentType.DIRECT_DEPOSIT.value
            },
            
            # Benefits
            {
                "id": "benefits_enrollment",
                "category": "benefits",
                "name": "Benefits Enrollment",
                "description": "Select your health insurance and other benefits",
                "order": 9,
                "required": False,
                "assignee": "employee",
                "estimated_minutes": 30,
                "deadline_days": 30  # Must complete within 30 days
            },
            {
                "id": "retirement_enrollment",
                "category": "benefits",
                "name": "401(k) Enrollment",
                "description": "Set up your retirement savings plan",
                "order": 10,
                "required": False,
                "assignee": "employee",
                "estimated_minutes": 15
            },
            
            # Policies
            {
                "id": "handbook_review",
                "category": "policies",
                "name": "Employee Handbook",
                "description": "Review and acknowledge the employee handbook",
                "order": 11,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 45,
                "document_type": DocumentType.HANDBOOK_ACKNOWLEDGMENT.value,
                "requires_signature": True
            },
            {
                "id": "policy_acknowledgment",
                "category": "policies",
                "name": "Company Policies",
                "description": "Review and sign company policies",
                "order": 12,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 20,
                "document_type": DocumentType.POLICY_AGREEMENT.value,
                "requires_signature": True
            },
            {
                "id": "nda_agreement",
                "category": "policies",
                "name": "Confidentiality Agreement",
                "description": "Sign non-disclosure agreement",
                "order": 13,
                "required": False,
                "assignee": "employee",
                "estimated_minutes": 10,
                "document_type": DocumentType.NDA.value,
                "requires_signature": True
            },
            
            # IT Setup
            {
                "id": "account_setup",
                "category": "it",
                "name": "Account Setup",
                "description": "Create user accounts and credentials",
                "order": 14,
                "required": True,
                "assignee": "employer",
                "estimated_minutes": 15
            },
            {
                "id": "equipment_assignment",
                "category": "it",
                "name": "Equipment Assignment",
                "description": "Assign laptop, phone, and other equipment",
                "order": 15,
                "required": False,
                "assignee": "employer",
                "estimated_minutes": 30
            },
            
            # Training
            {
                "id": "orientation",
                "category": "training",
                "name": "Company Orientation",
                "description": "Complete new hire orientation",
                "order": 16,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 60
            },
            {
                "id": "compliance_training",
                "category": "training",
                "name": "Compliance Training",
                "description": "Complete required compliance training modules",
                "order": 17,
                "required": True,
                "assignee": "employee",
                "estimated_minutes": 90
            }
        ]
    
    def create_onboarding(self, employee_id: str, data: dict) -> dict:
        """Create onboarding workflow for new employee"""
        onboarding_id = str(uuid.uuid4())
        start_date = date.fromisoformat(data.get("start_date", date.today().isoformat()))
        
        # Create task instances from templates
        tasks = []
        for template in self.task_templates:
            # Skip optional tasks if not enabled
            if not template["required"] and not data.get("include_optional", True):
                continue
            
            task = {
                "id": str(uuid.uuid4()),
                "template_id": template["id"],
                "name": template["name"],
                "description": template["description"],
                "category": template["category"],
                "order": template["order"],
                "required": template["required"],
                "assignee": template["assignee"],
                "estimated_minutes": template["estimated_minutes"],
                "status": TaskStatus.PENDING.value,
                "completed_at": None,
                "completed_by": None,
                "data": {}
            }
            
            # Set deadline if specified
            if template.get("deadline_days"):
                task["deadline"] = (start_date + timedelta(days=template["deadline_days"])).isoformat()
            
            # Set dependency
            if template.get("depends_on"):
                task["depends_on"] = template["depends_on"]
                task["status"] = TaskStatus.BLOCKED.value
            
            tasks.append(task)
        
        onboarding = {
            "id": onboarding_id,
            "employee_id": employee_id,
            "company_id": self.company_id,
            
            # Employee Info
            "employee_name": data.get("employee_name", ""),
            "employee_email": data.get("employee_email", ""),
            "department": data.get("department", ""),
            "position": data.get("position", ""),
            "manager_id": data.get("manager_id"),
            "hr_contact_id": data.get("hr_contact_id"),
            
            # Dates
            "start_date": start_date.isoformat(),
            "target_completion_date": (start_date + timedelta(days=data.get("target_days", 7))).isoformat(),
            
            # Tasks
            "tasks": tasks,
            "total_tasks": len(tasks),
            "completed_tasks": 0,
            "progress_percentage": 0,
            
            # Status
            "status": OnboardingStatus.NOT_STARTED.value,
            "started_at": None,
            "completed_at": None,
            
            # Access
            "access_token": str(uuid.uuid4()),  # For self-service portal
            "portal_url": f"/onboarding/{onboarding_id}",
            
            # Notifications
            "send_welcome_email": data.get("send_welcome_email", True),
            "reminder_frequency": data.get("reminder_frequency", "daily"),
            
            # Metadata
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "created_by": data.get("created_by")
        }
        
        self.onboarding_workflows[onboarding_id] = onboarding
        return onboarding
    
    def get_onboarding(self, onboarding_id: str) -> Optional[dict]:
        """Get onboarding workflow by ID"""
        return self.onboarding_workflows.get(onboarding_id)
    
    def get_onboarding_by_employee(self, employee_id: str) -> Optional[dict]:
        """Get onboarding for an employee"""
        for onboarding in self.onboarding_workflows.values():
            if onboarding["employee_id"] == employee_id:
                return onboarding
        return None
    
    def start_onboarding(self, onboarding_id: str) -> dict:
        """Mark onboarding as started"""
        if onboarding_id not in self.onboarding_workflows:
            raise ValueError(f"Onboarding {onboarding_id} not found")
        
        onboarding = self.onboarding_workflows[onboarding_id]
        onboarding["status"] = OnboardingStatus.IN_PROGRESS.value
        onboarding["started_at"] = datetime.now().isoformat()
        onboarding["updated_at"] = datetime.now().isoformat()
        
        return onboarding
    
    def complete_task(self, onboarding_id: str, task_id: str,
                     completed_by: str, data: Optional[dict] = None) -> dict:
        """Mark a task as completed"""
        if onboarding_id not in self.onboarding_workflows:
            raise ValueError(f"Onboarding {onboarding_id} not found")
        
        onboarding = self.onboarding_workflows[onboarding_id]
        task = next((t for t in onboarding["tasks"] if t["id"] == task_id), None)
        
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        if task["status"] == TaskStatus.BLOCKED.value:
            raise ValueError("Task is blocked by a dependency")
        
        task["status"] = TaskStatus.COMPLETED.value
        task["completed_at"] = datetime.now().isoformat()
        task["completed_by"] = completed_by
        
        if data:
            task["data"] = data
        
        # Update progress
        completed = sum(1 for t in onboarding["tasks"] if t["status"] == TaskStatus.COMPLETED.value)
        onboarding["completed_tasks"] = completed
        onboarding["progress_percentage"] = round(completed / onboarding["total_tasks"] * 100)
        
        # Unblock dependent tasks
        template_id = task.get("template_id")
        for t in onboarding["tasks"]:
            if t.get("depends_on") == template_id and t["status"] == TaskStatus.BLOCKED.value:
                t["status"] = TaskStatus.PENDING.value
        
        # Check if all required tasks completed
        required_tasks = [t for t in onboarding["tasks"] if t["required"]]
        if all(t["status"] == TaskStatus.COMPLETED.value for t in required_tasks):
            onboarding["status"] = OnboardingStatus.PENDING_REVIEW.value
        
        onboarding["updated_at"] = datetime.now().isoformat()
        
        return task
    
    def submit_task_data(self, onboarding_id: str, task_id: str, data: dict) -> dict:
        """Submit data for a task (e.g., form fields)"""
        if onboarding_id not in self.onboarding_workflows:
            raise ValueError(f"Onboarding {onboarding_id} not found")
        
        onboarding = self.onboarding_workflows[onboarding_id]
        task = next((t for t in onboarding["tasks"] if t["id"] == task_id), None)
        
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        task["data"] = data
        task["status"] = TaskStatus.IN_PROGRESS.value
        onboarding["updated_at"] = datetime.now().isoformat()
        
        # Auto-start onboarding if not started
        if onboarding["status"] == OnboardingStatus.NOT_STARTED.value:
            onboarding["status"] = OnboardingStatus.IN_PROGRESS.value
            onboarding["started_at"] = datetime.now().isoformat()
        
        return task
    
    def upload_document(self, onboarding_id: str, task_id: str,
                       document_data: dict) -> dict:
        """Upload a document for onboarding"""
        document_id = str(uuid.uuid4())
        
        document = {
            "id": document_id,
            "onboarding_id": onboarding_id,
            "task_id": task_id,
            "company_id": self.company_id,
            
            "document_type": document_data.get("document_type", DocumentType.CUSTOM.value),
            "file_name": document_data.get("file_name"),
            "file_size": document_data.get("file_size"),
            "mime_type": document_data.get("mime_type"),
            "storage_path": document_data.get("storage_path"),
            
            "status": "uploaded",
            "verified": False,
            "verified_by": None,
            "verified_at": None,
            
            "uploaded_at": datetime.now().isoformat(),
            "uploaded_by": document_data.get("uploaded_by")
        }
        
        self.documents.append(document)
        return document
    
    def request_signature(self, onboarding_id: str, document_id: str,
                         signer_id: str, signer_email: str) -> dict:
        """Request e-signature for a document"""
        signature_id = str(uuid.uuid4())
        
        signature_request = {
            "id": signature_id,
            "onboarding_id": onboarding_id,
            "document_id": document_id,
            "company_id": self.company_id,
            
            "signer_id": signer_id,
            "signer_email": signer_email,
            
            "status": "pending",
            "sent_at": datetime.now().isoformat(),
            "signed_at": None,
            "signature_data": None,
            
            "reminder_count": 0,
            "last_reminder": None,
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        self.e_signatures.append(signature_request)
        return signature_request
    
    def record_signature(self, signature_id: str, signature_data: dict) -> dict:
        """Record an e-signature"""
        signature = next((s for s in self.e_signatures if s["id"] == signature_id), None)
        if not signature:
            raise ValueError(f"Signature request {signature_id} not found")
        
        signature["status"] = "signed"
        signature["signed_at"] = datetime.now().isoformat()
        signature["signature_data"] = {
            "ip_address": signature_data.get("ip_address"),
            "user_agent": signature_data.get("user_agent"),
            "timestamp": datetime.now().isoformat(),
            "signature_image": signature_data.get("signature_image")
        }
        
        return signature
    
    def complete_onboarding(self, onboarding_id: str, completed_by: str) -> dict:
        """Mark onboarding as fully completed"""
        if onboarding_id not in self.onboarding_workflows:
            raise ValueError(f"Onboarding {onboarding_id} not found")
        
        onboarding = self.onboarding_workflows[onboarding_id]
        
        # Verify all required tasks completed
        required_tasks = [t for t in onboarding["tasks"] if t["required"]]
        incomplete = [t for t in required_tasks if t["status"] != TaskStatus.COMPLETED.value]
        
        if incomplete:
            raise ValueError(f"{len(incomplete)} required tasks not completed")
        
        onboarding["status"] = OnboardingStatus.COMPLETED.value
        onboarding["completed_at"] = datetime.now().isoformat()
        onboarding["updated_at"] = datetime.now().isoformat()
        
        return onboarding
    
    def get_all_onboardings(self, status: Optional[str] = None,
                           department: Optional[str] = None) -> List[dict]:
        """Get all onboarding workflows"""
        onboardings = list(self.onboarding_workflows.values())
        
        if status:
            onboardings = [o for o in onboardings if o["status"] == status]
        if department:
            onboardings = [o for o in onboardings if o.get("department") == department]
        
        return sorted(onboardings, key=lambda x: x["created_at"], reverse=True)
    
    def get_pending_tasks(self, assignee_id: str) -> List[dict]:
        """Get all pending tasks for an assignee"""
        pending = []
        
        for onboarding in self.onboarding_workflows.values():
            if onboarding["status"] != OnboardingStatus.IN_PROGRESS.value:
                continue
            
            for task in onboarding["tasks"]:
                if task["status"] == TaskStatus.PENDING.value:
                    # Check if this is employer task and assignee is HR/manager
                    if task["assignee"] == "employer":
                        pending.append({
                            **task,
                            "onboarding_id": onboarding["id"],
                            "employee_name": onboarding["employee_name"],
                            "employee_id": onboarding["employee_id"]
                        })
        
        return sorted(pending, key=lambda x: x["order"])
    
    def get_onboarding_metrics(self) -> dict:
        """Get onboarding metrics and analytics"""
        onboardings = list(self.onboarding_workflows.values())
        
        total = len(onboardings)
        by_status = {}
        avg_completion_days = []
        
        for onboarding in onboardings:
            status = onboarding["status"]
            by_status[status] = by_status.get(status, 0) + 1
            
            if onboarding.get("completed_at") and onboarding.get("started_at"):
                started = datetime.fromisoformat(onboarding["started_at"])
                completed = datetime.fromisoformat(onboarding["completed_at"])
                days = (completed - started).days
                avg_completion_days.append(days)
        
        return {
            "total_onboardings": total,
            "by_status": by_status,
            "average_completion_days": sum(avg_completion_days) / len(avg_completion_days) if avg_completion_days else 0,
            "completion_rate": by_status.get(OnboardingStatus.COMPLETED.value, 0) / total * 100 if total > 0 else 0,
            "generated_at": datetime.now().isoformat()
        }
    
    def send_reminder(self, onboarding_id: str) -> dict:
        """Send reminder for incomplete onboarding"""
        if onboarding_id not in self.onboarding_workflows:
            raise ValueError(f"Onboarding {onboarding_id} not found")
        
        onboarding = self.onboarding_workflows[onboarding_id]
        
        pending_tasks = [t for t in onboarding["tasks"] 
                        if t["status"] in [TaskStatus.PENDING.value, TaskStatus.IN_PROGRESS.value]]
        
        return {
            "onboarding_id": onboarding_id,
            "employee_email": onboarding["employee_email"],
            "pending_task_count": len(pending_tasks),
            "reminder_sent_at": datetime.now().isoformat()
        }


# Create singleton instance
onboarding_service = SaurelliusOnboarding("default")
