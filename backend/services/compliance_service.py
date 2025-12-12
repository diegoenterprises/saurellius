"""
SAURELLIUS DOCUGINUITY COMPLIANCE SERVICE
Document compliance and management system

Features:
- Automated document tracking for federal, state, and local forms
- Compliance status monitoring
- Employee/company onboarding document checklists
- Tax form tracking (W-2, W-4, 1099, I-9, etc.)
- Filing deadline reminders
- Multi-jurisdiction support
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import uuid


class DocuGinuityCompliance:
    """
    Comprehensive document compliance management system.
    Tracks all required forms for employees and companies.
    """
    
    # ==========================================================================
    # FEDERAL FORM DEFINITIONS
    # ==========================================================================
    
    FEDERAL_FORMS = {
        # Employment Forms
        'I-9': {
            'name': 'Employment Eligibility Verification',
            'agency': 'USCIS',
            'required_for': 'all_employees',
            'retention_years': 3,
            'description': 'Verify identity and work authorization',
            'sections': ['Section 1 - Employee', 'Section 2 - Employer', 'Section 3 - Reverification'],
        },
        'W-4': {
            'name': "Employee's Withholding Certificate",
            'agency': 'IRS',
            'required_for': 'all_employees',
            'retention_years': 4,
            'description': 'Determine federal tax withholding',
            'update_triggers': ['marriage', 'divorce', 'new_child', 'income_change'],
        },
        
        # Tax Reporting Forms
        'W-2': {
            'name': 'Wage and Tax Statement',
            'agency': 'IRS',
            'required_for': 'all_employees',
            'frequency': 'annual',
            'deadline': 'January 31',
            'description': 'Annual statement of wages and taxes withheld',
        },
        'W-3': {
            'name': 'Transmittal of Wage and Tax Statements',
            'agency': 'SSA',
            'required_for': 'employer',
            'frequency': 'annual',
            'deadline': 'January 31',
            'description': 'Summary form accompanying W-2 forms to SSA',
        },
        '940': {
            'name': "Employer's Annual Federal Unemployment Tax Return",
            'agency': 'IRS',
            'required_for': 'employer',
            'frequency': 'annual',
            'deadline': 'January 31',
            'description': 'Annual FUTA tax reporting',
        },
        '941': {
            'name': "Employer's Quarterly Federal Tax Return",
            'agency': 'IRS',
            'required_for': 'employer',
            'frequency': 'quarterly',
            'deadlines': ['April 30', 'July 31', 'October 31', 'January 31'],
            'description': 'Quarterly federal income, Social Security, and Medicare taxes',
        },
        '944': {
            'name': "Employer's Annual Federal Tax Return",
            'agency': 'IRS',
            'required_for': 'small_employer',
            'frequency': 'annual',
            'deadline': 'January 31',
            'description': 'Annual version of 941 for small employers',
        },
        
        # Contractor Forms
        'W-9': {
            'name': 'Request for Taxpayer Identification Number',
            'agency': 'IRS',
            'required_for': 'contractors',
            'retention_years': 4,
            'description': 'Collect TIN from contractors before payment',
        },
        '1099-NEC': {
            'name': 'Nonemployee Compensation',
            'agency': 'IRS',
            'required_for': 'contractors',
            'frequency': 'annual',
            'deadline': 'January 31',
            'threshold': 600,
            'description': 'Report payments to contractors of $600+',
        },
        '1096': {
            'name': 'Annual Summary and Transmittal',
            'agency': 'IRS',
            'required_for': 'employer',
            'frequency': 'annual',
            'deadline': 'January 31',
            'description': 'Summary form for paper 1099 submissions',
        },
        
        # ACA Forms
        '1095-C': {
            'name': 'Employer-Provided Health Insurance Offer',
            'agency': 'IRS',
            'required_for': 'ale_employees',  # Applicable Large Employers (50+ FTEs)
            'frequency': 'annual',
            'deadline': 'March 2',
            'description': 'Health coverage offered to employees',
        },
        '1094-C': {
            'name': 'Transmittal of Health Insurance Forms',
            'agency': 'IRS',
            'required_for': 'ale_employer',
            'frequency': 'annual',
            'deadline': 'February 28',
            'description': 'Summary form for 1095-C submissions',
        },
    }
    
    # ==========================================================================
    # STATE W-4 EQUIVALENTS
    # ==========================================================================
    
    STATE_WITHHOLDING_FORMS = {
        'AL': {'form': 'A-4', 'name': 'Alabama Employee Withholding Exemption Certificate'},
        'AZ': {'form': 'A-4', 'name': 'Arizona Withholding Percentage Election'},
        'AR': {'form': 'AR4EC', 'name': 'Arkansas Employee Withholding Certificate'},
        'CA': {'form': 'DE 4', 'name': 'California Employee Withholding Allowance Certificate'},
        'CO': {'form': 'DR 0004', 'name': 'Colorado Employee Withholding Certificate'},
        'CT': {'form': 'CT-W4', 'name': 'Connecticut Employee Withholding Certificate'},
        'DC': {'form': 'D-4', 'name': 'DC Withholding Allowance Certificate'},
        'DE': {'form': 'W-4', 'name': 'Delaware uses Federal W-4'},
        'GA': {'form': 'G-4', 'name': 'Georgia Employee Withholding Allowance Certificate'},
        'HI': {'form': 'HW-4', 'name': 'Hawaii Employee Withholding Allowance Certificate'},
        'ID': {'form': 'W-4', 'name': 'Idaho uses Federal W-4'},
        'IL': {'form': 'IL-W-4', 'name': 'Illinois Employee Withholding Allowance Certificate'},
        'IN': {'form': 'WH-4', 'name': 'Indiana Employee Withholding Exemption Certificate'},
        'IA': {'form': 'IA W-4', 'name': 'Iowa Employee Withholding Allowance Certificate'},
        'KS': {'form': 'K-4', 'name': 'Kansas Employee Withholding Allowance Certificate'},
        'KY': {'form': 'K-4', 'name': 'Kentucky Withholding Certificate'},
        'LA': {'form': 'L-4', 'name': 'Louisiana Employee Withholding Exemption Certificate'},
        'ME': {'form': 'W-4ME', 'name': 'Maine Employee Withholding Allowance Certificate'},
        'MD': {'form': 'MW507', 'name': 'Maryland Employee Withholding Exemption Certificate'},
        'MA': {'form': 'M-4', 'name': 'Massachusetts Employee Withholding Exemption Certificate'},
        'MI': {'form': 'MI-W4', 'name': 'Michigan Employee Withholding Exemption Certificate'},
        'MN': {'form': 'W-4MN', 'name': 'Minnesota Employee Withholding Allowance Certificate'},
        'MS': {'form': '89-350', 'name': 'Mississippi Employee Withholding Exemption Certificate'},
        'MO': {'form': 'MO W-4', 'name': 'Missouri Employee Withholding Allowance Certificate'},
        'MT': {'form': 'MW-4', 'name': 'Montana Employee Withholding Allowance Certificate'},
        'NE': {'form': 'W-4N', 'name': 'Nebraska Employee Withholding Allowance Certificate'},
        'NJ': {'form': 'NJ-W4', 'name': 'New Jersey Employee Withholding Allowance Certificate'},
        'NM': {'form': 'W-4', 'name': 'New Mexico uses Federal W-4'},
        'NY': {'form': 'IT-2104', 'name': 'New York Employee Withholding Allowance Certificate'},
        'NC': {'form': 'NC-4', 'name': 'North Carolina Employee Withholding Allowance Certificate'},
        'ND': {'form': 'W-4', 'name': 'North Dakota uses Federal W-4'},
        'OH': {'form': 'IT 4', 'name': 'Ohio Employee Withholding Exemption Certificate'},
        'OK': {'form': 'OK-W-4', 'name': 'Oklahoma Employee Withholding Allowance Certificate'},
        'OR': {'form': 'OR-W-4', 'name': 'Oregon Employee Withholding Statement'},
        'PA': {'form': 'W-4', 'name': 'Pennsylvania uses Federal W-4'},
        'RI': {'form': 'W-4', 'name': 'Rhode Island uses Federal W-4'},
        'SC': {'form': 'SC W-4', 'name': 'South Carolina Employee Withholding Allowance Certificate'},
        'UT': {'form': 'W-4', 'name': 'Utah uses Federal W-4'},
        'VT': {'form': 'W-4VT', 'name': 'Vermont Employee Withholding Allowance Certificate'},
        'VA': {'form': 'VA-4', 'name': 'Virginia Employee Withholding Exemption Certificate'},
        'WV': {'form': 'WV/IT-104', 'name': 'West Virginia Employee Withholding Exemption Certificate'},
        'WI': {'form': 'WT-4', 'name': 'Wisconsin Employee Withholding Exemption Certificate'},
    }
    
    # ==========================================================================
    # COMPLIANCE DEADLINES 2025
    # ==========================================================================
    
    FILING_CALENDAR_2025 = {
        'Q1': {
            'January 15': ['Q4 estimated tax payment (individuals)'],
            'January 31': ['W-2 to employees', 'W-3 to SSA', '1099-NEC to contractors', '940 filing', '941 Q4'],
            'February 28': ['1094-C/1095-C paper filing'],
            'March 2': ['1095-C to employees'],
            'March 31': ['1094-C/1095-C electronic filing'],
        },
        'Q2': {
            'April 15': ['Q1 estimated tax payment'],
            'April 30': ['941 Q1 filing'],
        },
        'Q3': {
            'June 15': ['Q2 estimated tax payment'],
            'July 31': ['941 Q2 filing'],
        },
        'Q4': {
            'September 15': ['Q3 estimated tax payment'],
            'October 31': ['941 Q3 filing'],
        },
    }
    
    # ==========================================================================
    # DOCUMENT STATUSES
    # ==========================================================================
    
    STATUS_PENDING = 'pending'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'
    STATUS_EXPIRED = 'expired'
    STATUS_NEEDS_UPDATE = 'needs_update'
    
    def __init__(self):
        """Initialize the compliance service."""
        self.document_cache = {}
    
    def get_employee_required_documents(
        self, 
        state_code: str, 
        employee_type: str = 'w2',
        is_new_hire: bool = True
    ) -> List[Dict]:
        """Get list of required documents for an employee."""
        documents = []
        
        # Federal forms for all employees
        if employee_type == 'w2':
            documents.append({
                'form_id': 'I-9',
                'jurisdiction': 'FED',
                **self.FEDERAL_FORMS['I-9'],
                'required': True,
                'priority': 'high' if is_new_hire else 'low',
            })
            documents.append({
                'form_id': 'W-4',
                'jurisdiction': 'FED',
                **self.FEDERAL_FORMS['W-4'],
                'required': True,
                'priority': 'high' if is_new_hire else 'medium',
            })
            
            # State W-4 if applicable
            state_form = self.STATE_WITHHOLDING_FORMS.get(state_code)
            if state_form and 'uses Federal' not in state_form['name']:
                documents.append({
                    'form_id': state_form['form'],
                    'jurisdiction': state_code,
                    'name': state_form['name'],
                    'agency': f'{state_code} Revenue',
                    'required': True,
                    'priority': 'high' if is_new_hire else 'medium',
                })
        
        elif employee_type == '1099':
            documents.append({
                'form_id': 'W-9',
                'jurisdiction': 'FED',
                **self.FEDERAL_FORMS['W-9'],
                'required': True,
                'priority': 'high',
            })
        
        return documents
    
    def get_company_required_documents(
        self, 
        state_codes: List[str], 
        employee_count: int,
        has_contractors: bool = False
    ) -> List[Dict]:
        """Get list of required documents for a company."""
        documents = []
        
        # Quarterly filings
        documents.append({
            'form_id': '941',
            'jurisdiction': 'FED',
            **self.FEDERAL_FORMS['941'],
            'required': True,
        })
        
        # Annual filings
        documents.append({
            'form_id': '940',
            'jurisdiction': 'FED',
            **self.FEDERAL_FORMS['940'],
            'required': True,
        })
        documents.append({
            'form_id': 'W-2',
            'jurisdiction': 'FED',
            **self.FEDERAL_FORMS['W-2'],
            'required': True,
        })
        documents.append({
            'form_id': 'W-3',
            'jurisdiction': 'FED',
            **self.FEDERAL_FORMS['W-3'],
            'required': True,
        })
        
        # Contractor forms
        if has_contractors:
            documents.append({
                'form_id': '1099-NEC',
                'jurisdiction': 'FED',
                **self.FEDERAL_FORMS['1099-NEC'],
                'required': True,
            })
            documents.append({
                'form_id': '1096',
                'jurisdiction': 'FED',
                **self.FEDERAL_FORMS['1096'],
                'required': True,
            })
        
        # ACA forms for large employers
        if employee_count >= 50:
            documents.append({
                'form_id': '1095-C',
                'jurisdiction': 'FED',
                **self.FEDERAL_FORMS['1095-C'],
                'required': True,
            })
            documents.append({
                'form_id': '1094-C',
                'jurisdiction': 'FED',
                **self.FEDERAL_FORMS['1094-C'],
                'required': True,
            })
        
        return documents
    
    def create_onboarding_checklist(
        self, 
        employee_id: str,
        company_id: str,
        state_code: str,
        employee_type: str = 'w2',
        hire_date: str = None
    ) -> Dict:
        """Create a document checklist for employee onboarding."""
        checklist_id = str(uuid.uuid4())
        hire_date = hire_date or datetime.utcnow().strftime('%Y-%m-%d')
        
        documents = self.get_employee_required_documents(state_code, employee_type, is_new_hire=True)
        
        # Add due dates
        for doc in documents:
            if doc['form_id'] == 'I-9':
                # I-9 must be completed within 3 days of hire
                due_date = (datetime.strptime(hire_date, '%Y-%m-%d') + timedelta(days=3)).strftime('%Y-%m-%d')
            else:
                # Other forms due within 30 days
                due_date = (datetime.strptime(hire_date, '%Y-%m-%d') + timedelta(days=30)).strftime('%Y-%m-%d')
            
            doc['status'] = self.STATUS_PENDING
            doc['due_date'] = due_date
            doc['completed_date'] = None
        
        return {
            'checklist_id': checklist_id,
            'employee_id': employee_id,
            'company_id': company_id,
            'state_code': state_code,
            'employee_type': employee_type,
            'hire_date': hire_date,
            'created_at': datetime.utcnow().isoformat(),
            'status': 'in_progress',
            'documents': documents,
            'completion_percentage': 0,
        }
    
    def update_document_status(
        self, 
        checklist_id: str, 
        form_id: str, 
        status: str,
        completed_date: str = None
    ) -> Dict:
        """Update the status of a document in a checklist."""
        # In production, this would update the database
        return {
            'checklist_id': checklist_id,
            'form_id': form_id,
            'status': status,
            'completed_date': completed_date or datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
        }
    
    def get_upcoming_deadlines(self, days_ahead: int = 30) -> List[Dict]:
        """Get upcoming filing deadlines."""
        today = datetime.utcnow()
        end_date = today + timedelta(days=days_ahead)
        
        deadlines = []
        current_quarter = f'Q{(today.month - 1) // 3 + 1}'
        
        calendar = self.FILING_CALENDAR_2025.get(current_quarter, {})
        
        for date_str, forms in calendar.items():
            # Parse date with current year
            deadline_date = datetime.strptime(f'{date_str} 2025', '%B %d %Y')
            
            if today <= deadline_date <= end_date:
                deadlines.append({
                    'date': deadline_date.strftime('%Y-%m-%d'),
                    'forms': forms,
                    'days_until': (deadline_date - today).days,
                })
        
        return sorted(deadlines, key=lambda x: x['date'])
    
    def check_company_compliance(self, company_id: str, employees: List[Dict]) -> Dict:
        """Check overall compliance status for a company."""
        total_docs = 0
        completed_docs = 0
        missing_docs = []
        expiring_docs = []
        
        # Check each employee's documents (mock implementation)
        for emp in employees:
            required = self.get_employee_required_documents(
                emp.get('state', 'CA'), 
                emp.get('type', 'w2')
            )
            total_docs += len(required)
            
            # Mock: assume 80% completion
            completed_docs += int(len(required) * 0.8)
        
        completion_rate = (completed_docs / total_docs * 100) if total_docs > 0 else 100
        
        if completion_rate >= 95:
            status = 'compliant'
        elif completion_rate >= 80:
            status = 'mostly_compliant'
        else:
            status = 'non_compliant'
        
        return {
            'company_id': company_id,
            'status': status,
            'total_documents': total_docs,
            'completed_documents': completed_docs,
            'completion_rate': round(completion_rate, 1),
            'missing_documents': missing_docs,
            'expiring_documents': expiring_docs,
            'upcoming_deadlines': self.get_upcoming_deadlines(30),
            'checked_at': datetime.utcnow().isoformat(),
        }
    
    def get_form_details(self, form_id: str, jurisdiction: str = 'FED') -> Optional[Dict]:
        """Get details about a specific form."""
        if jurisdiction == 'FED':
            form = self.FEDERAL_FORMS.get(form_id)
            if form:
                return {
                    'form_id': form_id,
                    'jurisdiction': 'FED',
                    **form
                }
        else:
            state_form = self.STATE_WITHHOLDING_FORMS.get(jurisdiction)
            if state_form and state_form['form'] == form_id:
                return {
                    'form_id': form_id,
                    'jurisdiction': jurisdiction,
                    'name': state_form['name'],
                    'agency': f'{jurisdiction} Revenue',
                }
        
        return None
    
    def get_all_federal_forms(self) -> List[Dict]:
        """Get all federal form definitions."""
        return [
            {'form_id': form_id, 'jurisdiction': 'FED', **form_data}
            for form_id, form_data in self.FEDERAL_FORMS.items()
        ]
    
    def get_state_withholding_form(self, state_code: str) -> Optional[Dict]:
        """Get the state-specific withholding form for a state."""
        return self.STATE_WITHHOLDING_FORMS.get(state_code)


# Singleton instance
compliance_service = DocuGinuityCompliance()
