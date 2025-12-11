"""
I-9 EMPLOYMENT VERIFICATION ROUTES
Employment Eligibility Verification Form I-9 management
Supports Section 1, Section 2, E-Verify integration
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
import uuid

i9_bp = Blueprint('i9', __name__, url_prefix='/api/i9')

# In-memory storage (replace with database in production)
I9_FORMS = {}
I9_DOCUMENTS = {}

# Document Lists per USCIS I-9 Instructions
LIST_A_DOCUMENTS = [
    {'id': 'passport_us', 'name': 'U.S. Passport', 'category': 'A'},
    {'id': 'passport_card', 'name': 'U.S. Passport Card', 'category': 'A'},
    {'id': 'permanent_resident', 'name': 'Permanent Resident Card (Form I-551)', 'category': 'A'},
    {'id': 'alien_registration', 'name': 'Alien Registration Receipt Card (Form I-551)', 'category': 'A'},
    {'id': 'foreign_passport_i94', 'name': 'Foreign Passport with I-94/I-94A', 'category': 'A'},
    {'id': 'foreign_passport_i551', 'name': 'Foreign Passport with I-551 Stamp', 'category': 'A'},
    {'id': 'ead', 'name': 'Employment Authorization Document (EAD)', 'category': 'A'},
    {'id': 'refugee_travel', 'name': 'Refugee Travel Document (I-571)', 'category': 'A'},
]

LIST_B_DOCUMENTS = [
    {'id': 'drivers_license', 'name': "Driver's License", 'category': 'B'},
    {'id': 'state_id', 'name': 'State ID Card', 'category': 'B'},
    {'id': 'school_id', 'name': 'School ID with Photograph', 'category': 'B'},
    {'id': 'voter_registration', 'name': 'Voter Registration Card', 'category': 'B'},
    {'id': 'military_id', 'name': 'U.S. Military Card', 'category': 'B'},
    {'id': 'military_dependent', 'name': 'Military Dependent ID Card', 'category': 'B'},
    {'id': 'coast_guard', 'name': 'U.S. Coast Guard Merchant Mariner Card', 'category': 'B'},
    {'id': 'native_american_tribal', 'name': 'Native American Tribal Document', 'category': 'B'},
    {'id': 'canadian_dl', 'name': "Driver's License (Canadian)", 'category': 'B'},
]

LIST_C_DOCUMENTS = [
    {'id': 'ss_card', 'name': 'Social Security Card (unrestricted)', 'category': 'C'},
    {'id': 'birth_cert_us', 'name': 'Birth Certificate (U.S.)', 'category': 'C'},
    {'id': 'birth_cert_territory', 'name': 'Birth Certificate (U.S. Territory)', 'category': 'C'},
    {'id': 'fs545', 'name': 'Certification of Birth Abroad (FS-545)', 'category': 'C'},
    {'id': 'ds1350', 'name': 'Certification of Report of Birth (DS-1350)', 'category': 'C'},
    {'id': 'native_american_id', 'name': 'Native American Tribal Document', 'category': 'C'},
    {'id': 'citizen_id', 'name': 'U.S. Citizen ID Card (I-197)', 'category': 'C'},
    {'id': 'resident_citizen_id', 'name': 'ID Card for Use of Resident Citizen (I-179)', 'category': 'C'},
    {'id': 'ead_receipt', 'name': 'Employment Authorization Document (receipt)', 'category': 'C'},
]

CITIZENSHIP_STATUS = {
    'citizen': 'A citizen of the United States',
    'noncitizen_national': 'A noncitizen national of the United States',
    'permanent_resident': 'A lawful permanent resident',
    'authorized_alien': 'An alien authorized to work'
}


@i9_bp.route('/documents', methods=['GET'])
def get_acceptable_documents():
    """Get list of acceptable I-9 documents"""
    return jsonify({
        'success': True,
        'list_a': LIST_A_DOCUMENTS,
        'list_b': LIST_B_DOCUMENTS,
        'list_c': LIST_C_DOCUMENTS,
        'instructions': {
            'list_a': 'Documents that establish both identity AND employment authorization',
            'list_b_c': 'One document from List B (identity) AND one from List C (employment authorization)'
        }
    })


@i9_bp.route('/employee/<employee_id>', methods=['GET'])
@jwt_required()
def get_employee_i9(employee_id):
    """Get I-9 for an employee"""
    i9 = None
    for form in I9_FORMS.values():
        if form['employee_id'] == employee_id:
            i9 = form
            break
    
    if not i9:
        return jsonify({
            'success': True,
            'i9': None,
            'message': 'No I-9 on file'
        })
    
    # Get associated documents
    documents = [d for d in I9_DOCUMENTS.values() if d['i9_id'] == i9['id']]
    i9['documents'] = documents
    
    return jsonify({'success': True, 'i9': i9})


@i9_bp.route('/section1', methods=['POST'])
@jwt_required()
def submit_section1():
    """Submit I-9 Section 1 (Employee Information)
    Must be completed on or before first day of employment
    """
    data = request.get_json()
    user_id = get_jwt_identity()
    
    required = ['employee_id', 'last_name', 'first_name', 'date_of_birth', 
                'citizenship_status', 'signature']
    for field in required:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    # Validate citizenship status
    if data['citizenship_status'] not in CITIZENSHIP_STATUS:
        return jsonify({
            'success': False,
            'message': f'Invalid citizenship status. Must be one of: {list(CITIZENSHIP_STATUS.keys())}'
        }), 400
    
    # Check if I-9 already exists
    existing = None
    for form in I9_FORMS.values():
        if form['employee_id'] == data['employee_id']:
            existing = form
            break
    
    if existing and existing.get('section1_complete'):
        return jsonify({
            'success': False,
            'message': 'Section 1 already completed for this employee'
        }), 400
    
    i9_id = existing['id'] if existing else f"I9-{uuid.uuid4().hex[:8].upper()}"
    
    # Calculate Section 2 deadline (3 business days from hire)
    hire_date = date.fromisoformat(data.get('hire_date', date.today().isoformat()))
    section2_deadline = hire_date + timedelta(days=3)
    
    i9 = {
        'id': i9_id,
        'employee_id': data['employee_id'],
        'status': 'section1_complete',
        
        # Section 1 - Employee Information
        'section1': {
            'last_name': data['last_name'],
            'first_name': data['first_name'],
            'middle_initial': data.get('middle_initial'),
            'other_last_names': data.get('other_last_names'),
            'address': data.get('address'),
            'apt_number': data.get('apt_number'),
            'city': data.get('city'),
            'state': data.get('state'),
            'zip_code': data.get('zip_code'),
            'date_of_birth': data['date_of_birth'],
            'ssn': data.get('ssn'),  # Should be masked/encrypted in production
            'email': data.get('email'),
            'phone': data.get('phone'),
            
            # Citizenship attestation
            'citizenship_status': data['citizenship_status'],
            'citizenship_description': CITIZENSHIP_STATUS[data['citizenship_status']],
            
            # For permanent residents
            'uscis_number': data.get('uscis_number'),
            'alien_number': data.get('alien_number'),
            
            # For authorized aliens
            'work_authorization_expiration': data.get('work_authorization_expiration'),
            'i94_number': data.get('i94_number'),
            'foreign_passport_number': data.get('foreign_passport_number'),
            'foreign_passport_country': data.get('foreign_passport_country'),
            
            # Signature
            'signature': data['signature'],
            'signature_date': data.get('signature_date', date.today().isoformat()),
            
            # Preparer/Translator (if used)
            'used_preparer': data.get('used_preparer', False),
            'preparer_signature': data.get('preparer_signature'),
            'preparer_name': data.get('preparer_name'),
            'preparer_address': data.get('preparer_address'),
        },
        
        'section1_complete': True,
        'section1_date': datetime.utcnow().isoformat(),
        'section2_complete': False,
        'section2_deadline': section2_deadline.isoformat(),
        
        'hire_date': hire_date.isoformat(),
        'created_at': datetime.utcnow().isoformat(),
        'created_by': user_id,
    }
    
    I9_FORMS[i9_id] = i9
    
    return jsonify({
        'success': True,
        'i9': i9,
        'message': f'Section 1 complete. Section 2 must be completed by {section2_deadline.isoformat()}'
    }), 201


@i9_bp.route('/<i9_id>/section2', methods=['POST'])
@jwt_required()
def submit_section2(i9_id):
    """Submit I-9 Section 2 (Employer Review)
    Must be completed within 3 business days of hire
    """
    data = request.get_json()
    user_id = get_jwt_identity()
    
    if i9_id not in I9_FORMS:
        return jsonify({
            'success': False,
            'message': 'I-9 not found'
        }), 404
    
    i9 = I9_FORMS[i9_id]
    
    if not i9.get('section1_complete'):
        return jsonify({
            'success': False,
            'message': 'Section 1 must be completed before Section 2'
        }), 400
    
    if i9.get('section2_complete'):
        return jsonify({
            'success': False,
            'message': 'Section 2 already completed'
        }), 400
    
    # Validate document combination
    documents = data.get('documents', [])
    if not validate_document_combination(documents):
        return jsonify({
            'success': False,
            'message': 'Invalid document combination. Provide List A document OR List B + List C documents.'
        }), 400
    
    # Store documents
    for doc in documents:
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        doc_record = {
            'id': doc_id,
            'i9_id': i9_id,
            'document_type': doc['document_type'],
            'document_title': doc['document_title'],
            'issuing_authority': doc.get('issuing_authority'),
            'document_number': doc.get('document_number'),
            'expiration_date': doc.get('expiration_date'),
            'list_category': doc.get('list_category'),  # A, B, or C
            'verified_at': datetime.utcnow().isoformat(),
            'verified_by': user_id,
        }
        I9_DOCUMENTS[doc_id] = doc_record
    
    # Update I-9 with Section 2 data
    i9['section2'] = {
        'employer_name': data.get('employer_name'),
        'employer_address': data.get('employer_address'),
        'employer_city': data.get('employer_city'),
        'employer_state': data.get('employer_state'),
        'employer_zip': data.get('employer_zip'),
        
        'first_day_of_employment': data.get('first_day_of_employment', i9['hire_date']),
        
        'authorized_signature': data['authorized_signature'],
        'authorized_name': data['authorized_name'],
        'authorized_title': data['authorized_title'],
        'signature_date': data.get('signature_date', date.today().isoformat()),
    }
    
    i9['section2_complete'] = True
    i9['section2_date'] = datetime.utcnow().isoformat()
    i9['status'] = 'complete'
    
    # Check if verification was late
    deadline = date.fromisoformat(i9['section2_deadline'])
    if date.today() > deadline:
        i9['late_verification'] = True
        i9['late_verification_note'] = 'Section 2 completed after 3-day deadline'
    
    I9_FORMS[i9_id] = i9
    
    return jsonify({
        'success': True,
        'i9': i9,
        'message': 'I-9 Section 2 complete. Employee is authorized to work.'
    })


def validate_document_combination(documents):
    """Validate that documents meet I-9 requirements"""
    if not documents:
        return False
    
    categories = [d.get('list_category', '').upper() for d in documents]
    
    # List A alone is sufficient
    if 'A' in categories:
        return True
    
    # Otherwise need both B and C
    has_b = 'B' in categories
    has_c = 'C' in categories
    
    return has_b and has_c


@i9_bp.route('/<i9_id>/reverify', methods=['POST'])
@jwt_required()
def reverify_i9(i9_id):
    """Section 3 - Reverification for expiring work authorization"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    if i9_id not in I9_FORMS:
        return jsonify({
            'success': False,
            'message': 'I-9 not found'
        }), 404
    
    i9 = I9_FORMS[i9_id]
    
    reverification = {
        'date': datetime.utcnow().isoformat(),
        'new_last_name': data.get('new_last_name'),
        'rehire_date': data.get('rehire_date'),
        'document_title': data.get('document_title'),
        'document_number': data.get('document_number'),
        'expiration_date': data.get('expiration_date'),
        'signature': data['signature'],
        'signature_date': date.today().isoformat(),
        'verified_by': user_id,
    }
    
    if 'reverifications' not in i9:
        i9['reverifications'] = []
    
    i9['reverifications'].append(reverification)
    i9['last_reverification'] = datetime.utcnow().isoformat()
    
    I9_FORMS[i9_id] = i9
    
    return jsonify({
        'success': True,
        'i9': i9,
        'message': 'I-9 reverification complete'
    })


@i9_bp.route('/expiring', methods=['GET'])
@jwt_required()
def get_expiring_authorizations():
    """Get list of employees with expiring work authorization"""
    days_ahead = int(request.args.get('days', 90))
    
    expiring = []
    cutoff_date = date.today() + timedelta(days=days_ahead)
    
    for i9 in I9_FORMS.values():
        if not i9.get('section1'):
            continue
        
        exp_date_str = i9['section1'].get('work_authorization_expiration')
        if exp_date_str:
            exp_date = date.fromisoformat(exp_date_str)
            if exp_date <= cutoff_date:
                expiring.append({
                    'i9_id': i9['id'],
                    'employee_id': i9['employee_id'],
                    'employee_name': f"{i9['section1']['first_name']} {i9['section1']['last_name']}",
                    'expiration_date': exp_date_str,
                    'days_until_expiration': (exp_date - date.today()).days,
                    'status': 'expired' if exp_date < date.today() else 'expiring_soon'
                })
    
    expiring.sort(key=lambda x: x['expiration_date'])
    
    return jsonify({
        'success': True,
        'expiring_authorizations': expiring,
        'count': len(expiring)
    })


@i9_bp.route('/pending-section2', methods=['GET'])
@jwt_required()
def get_pending_section2():
    """Get I-9s pending Section 2 completion"""
    pending = []
    
    for i9 in I9_FORMS.values():
        if i9.get('section1_complete') and not i9.get('section2_complete'):
            deadline = date.fromisoformat(i9['section2_deadline'])
            pending.append({
                'i9_id': i9['id'],
                'employee_id': i9['employee_id'],
                'employee_name': f"{i9['section1']['first_name']} {i9['section1']['last_name']}",
                'hire_date': i9['hire_date'],
                'deadline': i9['section2_deadline'],
                'days_remaining': (deadline - date.today()).days,
                'overdue': date.today() > deadline
            })
    
    pending.sort(key=lambda x: x['deadline'])
    
    return jsonify({
        'success': True,
        'pending_section2': pending,
        'count': len(pending)
    })


# =====================================================
# E-VERIFY INTEGRATION (Simulated)
# =====================================================

@i9_bp.route('/<i9_id>/everify', methods=['POST'])
@jwt_required()
def submit_everify(i9_id):
    """Submit I-9 to E-Verify (simulated)"""
    if i9_id not in I9_FORMS:
        return jsonify({
            'success': False,
            'message': 'I-9 not found'
        }), 404
    
    i9 = I9_FORMS[i9_id]
    
    if not i9.get('section2_complete'):
        return jsonify({
            'success': False,
            'message': 'I-9 must be complete before E-Verify submission'
        }), 400
    
    # Simulate E-Verify submission
    case_number = f"EV-{uuid.uuid4().hex[:12].upper()}"
    
    i9['everify'] = {
        'case_number': case_number,
        'submitted_at': datetime.utcnow().isoformat(),
        'status': 'pending',  # pending, authorized, tentative_nonconfirmation, final_nonconfirmation
        'result': None,
        'result_date': None,
    }
    
    I9_FORMS[i9_id] = i9
    
    return jsonify({
        'success': True,
        'everify_case': i9['everify'],
        'message': f'E-Verify case {case_number} submitted. Check status for results.'
    })


@i9_bp.route('/<i9_id>/everify/status', methods=['GET'])
@jwt_required()
def get_everify_status(i9_id):
    """Get E-Verify case status"""
    if i9_id not in I9_FORMS:
        return jsonify({
            'success': False,
            'message': 'I-9 not found'
        }), 404
    
    i9 = I9_FORMS[i9_id]
    
    if not i9.get('everify'):
        return jsonify({
            'success': False,
            'message': 'No E-Verify case found'
        }), 404
    
    # Simulate status update (in production, call E-Verify API)
    everify = i9['everify']
    if everify['status'] == 'pending':
        # Simulate auto-approval after submission
        everify['status'] = 'authorized'
        everify['result'] = 'Employment Authorized'
        everify['result_date'] = datetime.utcnow().isoformat()
        I9_FORMS[i9_id] = i9
    
    return jsonify({
        'success': True,
        'everify_case': everify
    })


@i9_bp.route('/audit-report', methods=['GET'])
@jwt_required()
def generate_audit_report():
    """Generate I-9 audit report for compliance"""
    
    total = len(I9_FORMS)
    complete = sum(1 for i9 in I9_FORMS.values() if i9.get('section2_complete'))
    incomplete = total - complete
    
    late_verifications = sum(1 for i9 in I9_FORMS.values() if i9.get('late_verification'))
    
    everify_submitted = sum(1 for i9 in I9_FORMS.values() if i9.get('everify'))
    everify_authorized = sum(1 for i9 in I9_FORMS.values() 
                            if i9.get('everify', {}).get('status') == 'authorized')
    
    # Expiring in 30 days
    cutoff = date.today() + timedelta(days=30)
    expiring_30 = sum(1 for i9 in I9_FORMS.values() 
                      if i9.get('section1', {}).get('work_authorization_expiration')
                      and date.fromisoformat(i9['section1']['work_authorization_expiration']) <= cutoff)
    
    return jsonify({
        'success': True,
        'report': {
            'generated_at': datetime.utcnow().isoformat(),
            'total_i9s': total,
            'complete': complete,
            'incomplete': incomplete,
            'late_verifications': late_verifications,
            'everify_submitted': everify_submitted,
            'everify_authorized': everify_authorized,
            'expiring_in_30_days': expiring_30,
            'compliance_rate': round(complete / total * 100, 2) if total > 0 else 100
        }
    })
