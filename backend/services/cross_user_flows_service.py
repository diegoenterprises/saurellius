"""
CROSS-USER DATA FLOWS SERVICE
Handles data flow impacts across all user types in the platform ecosystem
Employee ↔ Employer ↔ Contractor ↔ Admin
"""

from datetime import datetime
import json
import logging
from models import db, Notification, User, Employer, Employee, Contractor

logger = logging.getLogger(__name__)


class CrossUserFlowsService:
    """
    Service for managing cross-user data flows and notifications.
    Ensures every action has appropriate ripple effects across the system.
    """
    
    # Activity types for logging
    ACTIVITY_TYPES = {
        'employee_created': 'New employee added',
        'employee_updated': 'Employee updated',
        'employee_terminated': 'Employee terminated',
        'payroll_processed': 'Payroll processed',
        'paystub_generated': 'Paystub generated',
        'time_off_requested': 'Time off requested',
        'time_off_approved': 'Time off approved',
        'time_off_denied': 'Time off denied',
        'benefits_enrolled': 'Benefits enrolled',
        'direct_deposit_updated': 'Direct deposit updated',
        'kudos_sent': 'Kudos sent',
        'message_sent': 'Message sent',
    }
    
    def create_notification(self, user_id: str, user_type: str, notification_type: str,
                           title: str, message: str, action_url: str = None, 
                           data: dict = None, priority: str = 'normal'):
        """
        Create a notification for any user type.
        Handles Employee, Employer, Contractor, and Admin notifications.
        """
        try:
            notification = Notification(
                user_id=user_id,
                user_type=user_type,
                type=notification_type,
                title=title,
                message=message,
                action_url=action_url,
                data=json.dumps(data) if data else None,
                priority=priority,
                is_read=False,
                created_at=datetime.now()
            )
            db.session.add(notification)
            return notification
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            return None
    
    def notify_employee_created(self, employee, employer, created_by_id: str):
        """
        Handle all notifications when a new employee is created.
        Affects: Employee (welcome), Employer (confirmation), Admin (metrics)
        """
        notifications = []
        
        # 1. Welcome notification for the new employee
        emp_notification = self.create_notification(
            user_id=employee.id,
            user_type='employee',
            notification_type='welcome',
            title='Welcome to the team! 🎉',
            message=f'You\'ve been added to {employer.legal_business_name}. Complete your profile to get started.',
            action_url='/onboarding',
            data={'employer_id': employer.id, 'employer_name': employer.legal_business_name},
            priority='high'
        )
        if emp_notification:
            notifications.append(emp_notification)
        
        # 2. Confirmation for the employer
        employer_notification = self.create_notification(
            user_id=employer.id,
            user_type='employer',
            notification_type='employee_added',
            title='Employee Added Successfully',
            message=f'{employee.first_name} {employee.last_name} has been added to your team.',
            action_url=f'/employees/{employee.id}',
            data={'employee_id': employee.id, 'employee_name': f'{employee.first_name} {employee.last_name}'},
            priority='normal'
        )
        if employer_notification:
            notifications.append(employer_notification)
        
        return notifications
    
    def notify_payroll_processed(self, payroll_run, employer, employees: list):
        """
        Handle all notifications when payroll is processed.
        Affects: All employees (paystub ready), Employer (confirmation)
        """
        notifications = []
        
        # 1. Notify each employee their paystub is ready
        for employee in employees:
            emp_notification = self.create_notification(
                user_id=employee['id'],
                user_type='employee',
                notification_type='paystub_ready',
                title='Your Paystub is Ready! 💵',
                message=f'Your paystub for {payroll_run.pay_period_start.strftime("%b %d")} - {payroll_run.pay_period_end.strftime("%b %d")} is now available.',
                action_url='/paystubs',
                data={
                    'payroll_run_id': str(payroll_run.id),
                    'pay_date': payroll_run.pay_date.isoformat() if payroll_run.pay_date else None,
                    'net_pay': employee.get('net_pay', 0)
                },
                priority='high'
            )
            if emp_notification:
                notifications.append(emp_notification)
        
        # 2. Confirmation for the employer
        employer_notification = self.create_notification(
            user_id=employer.id,
            user_type='employer',
            notification_type='payroll_completed',
            title='Payroll Processed Successfully ✅',
            message=f'Payroll for {len(employees)} employees has been processed. Total: ${payroll_run.total_gross:,.2f}',
            action_url=f'/payroll/runs/{payroll_run.id}',
            data={
                'payroll_run_id': str(payroll_run.id),
                'employee_count': len(employees),
                'total_gross': float(payroll_run.total_gross),
                'total_net': float(payroll_run.total_net)
            },
            priority='normal'
        )
        if employer_notification:
            notifications.append(employer_notification)
        
        return notifications
    
    def notify_time_off_request(self, request_data, employee, employer):
        """
        Handle notifications for time off request.
        Affects: Employer (approval needed), Employee (confirmation)
        """
        notifications = []
        
        # 1. Notify employer of pending request
        employer_notification = self.create_notification(
            user_id=employer.id,
            user_type='employer',
            notification_type='time_off_request',
            title='Time Off Request Pending',
            message=f'{employee.first_name} {employee.last_name} has requested time off from {request_data["start_date"]} to {request_data["end_date"]}',
            action_url=f'/pto/requests/{request_data["id"]}',
            data={
                'request_id': request_data['id'],
                'employee_id': employee.id,
                'start_date': request_data['start_date'],
                'end_date': request_data['end_date']
            },
            priority='high'
        )
        if employer_notification:
            notifications.append(employer_notification)
        
        # 2. Confirmation for employee
        emp_notification = self.create_notification(
            user_id=employee.id,
            user_type='employee',
            notification_type='time_off_submitted',
            title='Time Off Request Submitted',
            message=f'Your request for {request_data["start_date"]} to {request_data["end_date"]} has been submitted and is pending approval.',
            action_url='/pto',
            data={'request_id': request_data['id']},
            priority='normal'
        )
        if emp_notification:
            notifications.append(emp_notification)
        
        return notifications
    
    def notify_time_off_decision(self, request_data, employee, approved: bool, reason: str = None):
        """
        Handle notifications for time off approval/denial.
        Affects: Employee (decision notification)
        """
        status = 'approved' if approved else 'denied'
        emoji = '✅' if approved else '❌'
        
        message = f'Your time off request for {request_data["start_date"]} to {request_data["end_date"]} has been {status}.'
        if reason and not approved:
            message += f' Reason: {reason}'
        
        notification = self.create_notification(
            user_id=employee.id,
            user_type='employee',
            notification_type=f'time_off_{status}',
            title=f'Time Off {status.title()} {emoji}',
            message=message,
            action_url='/pto',
            data={
                'request_id': request_data['id'],
                'approved': approved,
                'reason': reason
            },
            priority='high'
        )
        
        return [notification] if notification else []
    
    def notify_kudos_received(self, kudos, sender, recipient):
        """
        Handle notifications for kudos.
        Affects: Recipient (kudos notification)
        """
        notification = self.create_notification(
            user_id=recipient['id'],
            user_type=recipient['type'],
            notification_type='kudos_received',
            title='You received kudos! 🌟',
            message=f'{sender["name"]} sent you kudos: "{kudos.message[:50]}..."' if len(kudos.message) > 50 else f'{sender["name"]} sent you kudos: "{kudos.message}"',
            action_url='/kudos',
            data={
                'kudos_id': str(kudos.id),
                'sender_id': sender['id'],
                'sender_name': sender['name'],
                'badge_type': kudos.badge_type
            },
            priority='normal'
        )
        
        return [notification] if notification else []
    
    def update_employer_metrics(self, employer_id: str, metric: str, delta: int = 1):
        """
        Update employer dashboard metrics when employee-related events occur.
        """
        try:
            employer = Employer.query.get(employer_id)
            if not employer:
                return False
            
            if metric == 'employee_count':
                employer.employee_count = (employer.employee_count or 0) + delta
            elif metric == 'contractor_count':
                employer.contractor_count = (employer.contractor_count or 0) + delta
            
            employer.updated_at = datetime.now()
            return True
        except Exception as e:
            logger.error(f"Error updating employer metrics: {str(e)}")
            return False
    
    def get_unread_notification_count(self, user_id: str, user_type: str) -> int:
        """Get count of unread notifications for a user."""
        try:
            count = Notification.query.filter_by(
                user_id=user_id,
                user_type=user_type,
                is_read=False
            ).count()
            return count
        except Exception as e:
            logger.error(f"Error getting notification count: {str(e)}")
            return 0


# Singleton instance
cross_user_flows_service = CrossUserFlowsService()
