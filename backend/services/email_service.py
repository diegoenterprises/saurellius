"""
Email Service - Resend API Integration
Sends transactional emails via Resend for Saurellius Cloud Payroll
"""

import os
import resend
from typing import Optional, Dict, Any


class EmailService:
    """Service for sending emails via Resend API."""
    
    def __init__(self):
        resend.api_key = os.getenv('RESEND_API_KEY', 're_MJmYFw3j_NQ1cEVAJ3t5zqVVw3UJ439D5')
        self.sender_email = os.getenv('SENDER_EMAIL', 'noreply@saurellius.drpaystub.com')
        self.sender_name = "Saurellius Cloud Payroll"

    def send_email(
        self, 
        recipient: str, 
        subject: str, 
        body_html: str, 
        body_text: str = None
    ) -> bool:
        """
        Sends an email using Resend API.
        
        Args:
            recipient: The email address of the recipient.
            subject: The subject line of the email.
            body_html: The HTML body of the email.
            body_text: The plain text body of the email (optional).
            
        Returns:
            True if the email was sent successfully, False otherwise.
        """
        try:
            params = {
                "from": f"{self.sender_name} <{self.sender_email}>",
                "to": [recipient],
                "subject": subject,
                "html": body_html,
            }
            
            if body_text:
                params["text"] = body_text
            
            response = resend.Emails.send(params)
            
            print(f" Email sent! Message ID: {response.get('id')}")
            return True
        except Exception as e:
            print(f"Email sending failed: {e}")
            return False

    def send_paystub_notification(
        self, 
        recipient: str, 
        employee_name: str, 
        pay_date: str,
        paystub_url: Optional[str] = None
    ) -> bool:
        """Send paystub generation notification."""
        subject = f"Your Paystub for {pay_date} is Ready - Saurellius"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #1473FF, #BE01FF); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #1473FF, #BE01FF); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin-top: 20px; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1> Paystub Ready</h1>
                </div>
                <div class="content">
                    <p>Hello {employee_name},</p>
                    <p>Your paystub for <strong>{pay_date}</strong> has been generated and is ready for viewing.</p>
                    {f'<a href="{paystub_url}" class="button">View Paystub</a>' if paystub_url else ''}
                    <p style="margin-top: 30px;">If you have any questions about your paystub, please contact your employer.</p>
                </div>
                <div class="footer">
                    <p>This email was sent by Saurellius Cloud Payroll Management</p>
                    <p>© 2025 Saurellius. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"Hello {employee_name}, Your paystub for {pay_date} is ready. {f'View it here: {paystub_url}' if paystub_url else ''}"
        
        return self.send_email(recipient, subject, body_html, body_text)

    def send_welcome_email(self, recipient: str, user_name: str) -> bool:
        """Send welcome email to new users."""
        subject = "Welcome to Saurellius Cloud Payroll!"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #1473FF, #BE01FF); color: white; padding: 40px; text-align: center; }}
                .content {{ padding: 30px; }}
                .feature {{ display: flex; align-items: center; margin: 15px 0; }}
                .feature-icon {{ font-size: 24px; margin-right: 15px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #1473FF, #BE01FF); color: white; padding: 14px 35px; border-radius: 25px; text-decoration: none; margin-top: 20px; font-weight: bold; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Saurellius!</h1>
                    <p>Cloud Payroll Management Made Simple</p>
                </div>
                <div class="content">
                    <p>Hello {user_name},</p>
                    <p>Thank you for joining Saurellius! We're excited to help you streamline your payroll management.</p>
                    
                    <h3>Here's what you can do:</h3>
                    <div class="feature">
                        <span class="feature-icon"></span>
                        <span>Generate professional paystubs in seconds</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon"></span>
                        <span>Manage your employees with ease</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon"></span>
                        <span>Track payroll with detailed analytics</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon"></span>
                        <span>Earn rewards with every paystub generated</span>
                    </div>
                    
                    <a href="https://saurellius.drpaystub.com/dashboard" class="button">Go to Dashboard</a>
                </div>
                <div class="footer">
                    <p>© 2025 Saurellius. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"Hello {user_name}, Welcome to Saurellius! Visit your dashboard to get started: https://saurellius.drpaystub.com/dashboard"
        
        return self.send_email(recipient, subject, body_html, body_text)

    def send_password_reset(self, recipient: str, reset_link: str) -> bool:
        """Send password reset email."""
        subject = "Reset Your Saurellius Password"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #1473FF, #BE01FF); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #1473FF, #BE01FF); color: white; padding: 14px 35px; border-radius: 25px; text-decoration: none; margin: 20px 0; font-weight: bold; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset</h1>
                </div>
                <div class="content">
                    <p>We received a request to reset your password.</p>
                    <p>Click the button below to create a new password:</p>
                    
                    <a href="{reset_link}" class="button">Reset Password</a>
                    
                    <div class="warning">
                        <strong>Security Notice:</strong> This link expires in 1 hour. If you didn't request this reset, please ignore this email.
                    </div>
                </div>
                <div class="footer">
                    <p>© 2025 Saurellius. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"Reset your Saurellius password: {reset_link}. This link expires in 1 hour."
        
        return self.send_email(recipient, subject, body_html, body_text)

    def send_subscription_confirmation(
        self, 
        recipient: str, 
        user_name: str, 
        plan_name: str,
        monthly_price: float
    ) -> bool:
        """Send subscription confirmation email."""
        subject = f"Subscription Confirmed - {plan_name} Plan"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #1473FF, #BE01FF); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .plan-box {{ background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }}
                .plan-name {{ font-size: 24px; font-weight: bold; color: #1473FF; }}
                .plan-price {{ font-size: 32px; font-weight: bold; color: #333; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1> Subscription Confirmed!</h1>
                </div>
                <div class="content">
                    <p>Hello {user_name},</p>
                    <p>Thank you for subscribing to Saurellius! Your subscription is now active.</p>
                    
                    <div class="plan-box">
                        <div class="plan-name">{plan_name} Plan</div>
                        <div class="plan-price">${monthly_price:.2f}/month</div>
                    </div>
                    
                    <p>You can manage your subscription anytime from your dashboard settings.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Saurellius. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"Hello {user_name}, Your {plan_name} Plan subscription (${monthly_price:.2f}/month) is now active."
        
        return self.send_email(recipient, subject, body_html, body_text)

    def send_payroll_processed(
        self,
        recipient: str,
        employer_name: str,
        employee_count: int,
        total_gross: float,
        total_net: float,
        pay_date: str
    ) -> bool:
        """Send payroll processed notification to employer."""
        subject = f"Payroll Processed - {pay_date}"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #0F172A, #1E293B); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .stats-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }}
                .stat-box {{ background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }}
                .stat-value {{ font-size: 24px; font-weight: bold; color: #1473FF; }}
                .stat-label {{ font-size: 14px; color: #666; margin-top: 5px; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Payroll Processed Successfully</h1>
                </div>
                <div class="content">
                    <p>Hello {employer_name},</p>
                    <p>Your payroll for <strong>{pay_date}</strong> has been processed successfully.</p>
                    
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-value">{employee_count}</div>
                            <div class="stat-label">Employees Paid</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${total_gross:,.2f}</div>
                            <div class="stat-label">Total Gross</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${total_net:,.2f}</div>
                            <div class="stat-label">Total Net</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${total_gross - total_net:,.2f}</div>
                            <div class="stat-label">Total Deductions</div>
                        </div>
                    </div>
                    
                    <p>View full details in your <a href="https://saurellius.drpaystub.com/dashboard">dashboard</a>.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Saurellius. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"Hello {employer_name}, Payroll for {pay_date} processed: {employee_count} employees, ${total_gross:,.2f} gross, ${total_net:,.2f} net."
        
        return self.send_email(recipient, subject, body_html, body_text)

    def send_employee_invite(
        self,
        recipient: str,
        employee_name: str,
        company_name: str,
        invite_link: str
    ) -> bool:
        """Send employee portal invitation."""
        subject = f"You're Invited to {company_name}'s Employee Portal"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #0F172A, #1E293B); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 14px 35px; border-radius: 25px; text-decoration: none; margin: 20px 0; font-weight: bold; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to the Team!</h1>
                </div>
                <div class="content">
                    <p>Hello {employee_name},</p>
                    <p><strong>{company_name}</strong> has invited you to join their employee portal on Saurellius.</p>
                    <p>Through the portal you can:</p>
                    <ul>
                        <li>View and download your paystubs</li>
                        <li>Update your personal information</li>
                        <li>Manage direct deposit settings</li>
                        <li>Request time off</li>
                        <li>Access tax documents</li>
                    </ul>
                    
                    <a href="{invite_link}" class="button">Accept Invitation</a>
                </div>
                <div class="footer">
                    <p>© 2025 Saurellius. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"Hello {employee_name}, {company_name} has invited you to their employee portal. Accept here: {invite_link}"
        
        return self.send_email(recipient, subject, body_html, body_text)

    def send_tax_document_ready(
        self,
        recipient: str,
        employee_name: str,
        document_type: str,
        tax_year: int
    ) -> bool:
        """Send tax document ready notification (W-2, 1099, etc.)."""
        subject = f"Your {document_type} for {tax_year} is Ready"
        
        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #0F172A, #1E293B); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .doc-badge {{ background: #EEF2FF; border: 2px solid #3B82F6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
                .doc-type {{ font-size: 28px; font-weight: bold; color: #1E40AF; }}
                .doc-year {{ font-size: 18px; color: #6B7280; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 14px 35px; border-radius: 25px; text-decoration: none; margin: 20px 0; font-weight: bold; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📄 Tax Document Ready</h1>
                </div>
                <div class="content">
                    <p>Hello {employee_name},</p>
                    <p>Your tax document is now available for download.</p>
                    
                    <div class="doc-badge">
                        <div class="doc-type">{document_type}</div>
                        <div class="doc-year">Tax Year {tax_year}</div>
                    </div>
                    
                    <a href="https://saurellius.drpaystub.com/tax-documents" class="button">View Document</a>
                    
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        You'll need this document for filing your taxes. Please keep it for your records.
                    </p>
                </div>
                <div class="footer">
                    <p>© 2025 Saurellius. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"Hello {employee_name}, Your {document_type} for tax year {tax_year} is ready. View it at https://saurellius.drpaystub.com/tax-documents"
        
        return self.send_email(recipient, subject, body_html, body_text)


# Singleton instance for easy import
email_service = EmailService()
