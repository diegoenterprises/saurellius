"""
REGULATORY FORMS ROUTES
Serve downloadable IRS and government forms for users
I-9, W-4, W-9, W-2, 1099-NEC, 941, 940, SS-4, etc.
"""

from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from datetime import datetime

regulatory_forms_bp = Blueprint('regulatory_forms', __name__, url_prefix='/api/forms')

# Base directory for regulatory forms
FORMS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'regulatory_forms')

# Form metadata with descriptions and categories
AVAILABLE_FORMS = {
    # Employment Eligibility
    'i-9': {
        'filename': 'i-9.pdf',
        'name': 'Form I-9',
        'full_name': 'Employment Eligibility Verification',
        'description': 'Verifies the identity and employment authorization of individuals hired for employment in the United States.',
        'category': 'employment',
        'source': 'USCIS',
        'required_for': ['employee'],
        'frequency': 'one-time',
    },
    'i-9-instructions': {
        'filename': 'i-9-instructions.pdf',
        'name': 'I-9 Instructions',
        'full_name': 'Instructions for Form I-9',
        'description': 'Instructions for completing Form I-9 Employment Eligibility Verification.',
        'category': 'employment',
        'source': 'USCIS',
        'required_for': ['employer', 'employee'],
        'frequency': 'reference',
    },
    
    # Tax Withholding
    'w-4': {
        'filename': 'fw4.pdf',
        'name': 'Form W-4',
        'full_name': "Employee's Withholding Certificate",
        'description': 'Used by employees to indicate their tax situation to their employer so the correct amount of federal income tax is withheld from their pay.',
        'category': 'tax_withholding',
        'source': 'IRS',
        'required_for': ['employee'],
        'frequency': 'as-needed',
    },
    'w-4p': {
        'filename': 'fw4p.pdf',
        'name': 'Form W-4P',
        'full_name': 'Withholding Certificate for Periodic Pension or Annuity Payments',
        'description': 'Used to tell payers the correct amount of federal income tax to withhold from periodic pension, annuity, profit-sharing, and IRA payments.',
        'category': 'tax_withholding',
        'source': 'IRS',
        'required_for': ['employee'],
        'frequency': 'as-needed',
    },
    
    # Contractor Forms
    'w-9': {
        'filename': 'fw9.pdf',
        'name': 'Form W-9',
        'full_name': 'Request for Taxpayer Identification Number and Certification',
        'description': 'Used to request the taxpayer identification number (TIN) of a person required to file an information return.',
        'category': 'contractor',
        'source': 'IRS',
        'required_for': ['contractor'],
        'frequency': 'one-time',
    },
    '1099-nec': {
        'filename': 'f1099nec.pdf',
        'name': 'Form 1099-NEC',
        'full_name': 'Nonemployee Compensation',
        'description': 'Used to report payments of $600 or more to nonemployees (contractors) for services performed.',
        'category': 'contractor',
        'source': 'IRS',
        'required_for': ['employer'],
        'frequency': 'annual',
        'deadline': 'January 31',
    },
    '1099-misc': {
        'filename': 'f1099misc.pdf',
        'name': 'Form 1099-MISC',
        'full_name': 'Miscellaneous Information',
        'description': 'Used to report miscellaneous income such as rents, royalties, prizes, awards, and other payments.',
        'category': 'contractor',
        'source': 'IRS',
        'required_for': ['employer'],
        'frequency': 'annual',
        'deadline': 'January 31 (recipient) / February 28 (IRS)',
    },
    
    # Wage Reporting
    'w-2': {
        'filename': 'fw2.pdf',
        'name': 'Form W-2',
        'full_name': 'Wage and Tax Statement',
        'description': 'Reports wages paid to employees and the taxes withheld from them. Employers must furnish to employees by January 31.',
        'category': 'wage_reporting',
        'source': 'IRS',
        'required_for': ['employer'],
        'frequency': 'annual',
        'deadline': 'January 31',
    },
    
    # Employer Tax Returns
    '941': {
        'filename': 'f941.pdf',
        'name': 'Form 941',
        'full_name': "Employer's Quarterly Federal Tax Return",
        'description': 'Used by employers to report income taxes, Social Security tax, or Medicare tax withheld from employee paychecks and pay the employer portion of Social Security or Medicare tax.',
        'category': 'employer_tax',
        'source': 'IRS',
        'required_for': ['employer'],
        'frequency': 'quarterly',
        'deadlines': ['April 30', 'July 31', 'October 31', 'January 31'],
    },
    '940': {
        'filename': 'f940.pdf',
        'name': 'Form 940',
        'full_name': "Employer's Annual Federal Unemployment (FUTA) Tax Return",
        'description': 'Used to report annual Federal Unemployment Tax Act (FUTA) tax. FUTA tax is paid by employers only.',
        'category': 'employer_tax',
        'source': 'IRS',
        'required_for': ['employer'],
        'frequency': 'annual',
        'deadline': 'January 31',
    },
    
    # Business Registration
    'ss-4': {
        'filename': 'ss4.pdf',
        'name': 'Form SS-4',
        'full_name': 'Application for Employer Identification Number',
        'description': 'Used to apply for an Employer Identification Number (EIN). An EIN is a 9-digit number used to identify a business entity.',
        'category': 'business_registration',
        'source': 'IRS',
        'required_for': ['employer'],
        'frequency': 'one-time',
    },
    
    # Tax Credits
    '8850': {
        'filename': 'f8850.pdf',
        'name': 'Form 8850',
        'full_name': 'Pre-Screening Notice and Certification Request for the Work Opportunity Credit',
        'description': 'Used by employers to pre-screen and certify job applicants who are members of targeted groups eligible for the Work Opportunity Tax Credit.',
        'category': 'tax_credit',
        'source': 'IRS',
        'required_for': ['employer'],
        'frequency': 'as-needed',
    },
    
    # International
    '8233': {
        'filename': 'f8233.pdf',
        'name': 'Form 8233',
        'full_name': 'Exemption From Withholding on Compensation for Independent Personal Services of a Nonresident Alien Individual',
        'description': 'Used by nonresident aliens to claim exemption from withholding on compensation for personal services.',
        'category': 'international',
        'source': 'IRS',
        'required_for': ['contractor'],
        'frequency': 'as-needed',
    },
}


@regulatory_forms_bp.route('/list', methods=['GET'])
@jwt_required()
def list_forms():
    """List all available regulatory forms."""
    try:
        category = request.args.get('category')
        user_type = request.args.get('user_type')  # employee, employer, contractor
        
        forms_list = []
        for form_id, form_data in AVAILABLE_FORMS.items():
            # Filter by category if specified
            if category and form_data.get('category') != category:
                continue
            
            # Filter by user type if specified
            if user_type and user_type not in form_data.get('required_for', []):
                continue
            
            # Check if file exists
            file_path = os.path.join(FORMS_DIR, form_data['filename'])
            file_exists = os.path.exists(file_path)
            
            forms_list.append({
                'id': form_id,
                'name': form_data['name'],
                'full_name': form_data['full_name'],
                'description': form_data['description'],
                'category': form_data['category'],
                'source': form_data['source'],
                'required_for': form_data.get('required_for', []),
                'frequency': form_data.get('frequency'),
                'deadline': form_data.get('deadline'),
                'deadlines': form_data.get('deadlines'),
                'available': file_exists,
            })
        
        # Get unique categories
        categories = list(set(form['category'] for form in AVAILABLE_FORMS.values()))
        
        return jsonify({
            'success': True,
            'forms': forms_list,
            'categories': categories,
            'total': len(forms_list)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error listing forms: {str(e)}'
        }), 500


@regulatory_forms_bp.route('/download/<form_id>', methods=['GET'])
@jwt_required()
def download_form(form_id):
    """Download a specific regulatory form."""
    try:
        if form_id not in AVAILABLE_FORMS:
            return jsonify({
                'success': False,
                'message': f'Form {form_id} not found'
            }), 404
        
        form_data = AVAILABLE_FORMS[form_id]
        file_path = os.path.join(FORMS_DIR, form_data['filename'])
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'message': f'Form file not available'
            }), 404
        
        # Return the PDF file
        return send_file(
            file_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{form_data['name'].replace(' ', '_')}.pdf"
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error downloading form: {str(e)}'
        }), 500


@regulatory_forms_bp.route('/info/<form_id>', methods=['GET'])
@jwt_required()
def get_form_info(form_id):
    """Get detailed information about a specific form."""
    try:
        if form_id not in AVAILABLE_FORMS:
            return jsonify({
                'success': False,
                'message': f'Form {form_id} not found'
            }), 404
        
        form_data = AVAILABLE_FORMS[form_id]
        file_path = os.path.join(FORMS_DIR, form_data['filename'])
        
        # Get file size if exists
        file_size = None
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
        
        return jsonify({
            'success': True,
            'form': {
                'id': form_id,
                'name': form_data['name'],
                'full_name': form_data['full_name'],
                'description': form_data['description'],
                'category': form_data['category'],
                'source': form_data['source'],
                'required_for': form_data.get('required_for', []),
                'frequency': form_data.get('frequency'),
                'deadline': form_data.get('deadline'),
                'deadlines': form_data.get('deadlines'),
                'available': os.path.exists(file_path),
                'file_size': file_size,
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting form info: {str(e)}'
        }), 500


@regulatory_forms_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get list of form categories."""
    categories = {
        'employment': {
            'name': 'Employment Eligibility',
            'description': 'Forms related to employment eligibility verification',
            'forms_count': sum(1 for f in AVAILABLE_FORMS.values() if f['category'] == 'employment')
        },
        'tax_withholding': {
            'name': 'Tax Withholding',
            'description': 'Forms for employee tax withholding',
            'forms_count': sum(1 for f in AVAILABLE_FORMS.values() if f['category'] == 'tax_withholding')
        },
        'contractor': {
            'name': 'Contractor Forms',
            'description': 'Forms for independent contractors',
            'forms_count': sum(1 for f in AVAILABLE_FORMS.values() if f['category'] == 'contractor')
        },
        'wage_reporting': {
            'name': 'Wage Reporting',
            'description': 'Annual wage and tax reporting forms',
            'forms_count': sum(1 for f in AVAILABLE_FORMS.values() if f['category'] == 'wage_reporting')
        },
        'employer_tax': {
            'name': 'Employer Tax Returns',
            'description': 'Employer tax filing forms',
            'forms_count': sum(1 for f in AVAILABLE_FORMS.values() if f['category'] == 'employer_tax')
        },
        'business_registration': {
            'name': 'Business Registration',
            'description': 'Forms for business registration and EIN',
            'forms_count': sum(1 for f in AVAILABLE_FORMS.values() if f['category'] == 'business_registration')
        },
        'tax_credit': {
            'name': 'Tax Credits',
            'description': 'Forms for tax credit programs',
            'forms_count': sum(1 for f in AVAILABLE_FORMS.values() if f['category'] == 'tax_credit')
        },
        'international': {
            'name': 'International',
            'description': 'Forms for international workers',
            'forms_count': sum(1 for f in AVAILABLE_FORMS.values() if f['category'] == 'international')
        },
    }
    
    return jsonify({
        'success': True,
        'categories': categories
    }), 200


@regulatory_forms_bp.route('/deadlines', methods=['GET'])
@jwt_required()
def get_upcoming_deadlines():
    """Get upcoming filing deadlines."""
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    deadlines = []
    
    # Annual deadlines
    annual_forms = ['w-2', '1099-nec', '940']
    for form_id in annual_forms:
        if form_id in AVAILABLE_FORMS:
            form = AVAILABLE_FORMS[form_id]
            deadlines.append({
                'form_id': form_id,
                'form_name': form['name'],
                'deadline': f"January 31, {current_year + 1}",
                'description': form['description']
            })
    
    # Quarterly 941 deadlines
    quarterly_deadlines = [
        (1, 4, 30),  # Q1 due April 30
        (4, 7, 31),  # Q2 due July 31
        (7, 10, 31), # Q3 due October 31
        (10, 1, 31), # Q4 due January 31 (next year)
    ]
    
    for q_start, due_month, due_day in quarterly_deadlines:
        if q_start <= current_month < q_start + 3 or (q_start == 10 and current_month >= 10):
            year = current_year if due_month > current_month else current_year + 1
            deadlines.append({
                'form_id': '941',
                'form_name': 'Form 941',
                'deadline': f"{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][due_month-1]} {due_day}, {year}",
                'description': f"Q{(q_start // 3) + 1} {current_year} Employer's Quarterly Federal Tax Return"
            })
            break
    
    return jsonify({
        'success': True,
        'deadlines': deadlines
    }), 200
