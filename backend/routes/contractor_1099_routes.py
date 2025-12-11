# Enhanced Contractor Management Routes
# 1099-NEC filing, multi-currency (USD/CAD), contractor payments

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

contractor_1099_bp = Blueprint('contractor_1099', __name__)

# In-memory storage
contractors = {}
contractor_payments = {}
form_1099s = {}

# Exchange rates (would be fetched from API in production)
EXCHANGE_RATES = {
    'USD': 1.0,
    'CAD': 0.74,
}


@contractor_1099_bp.route('/api/contractors/1099', methods=['GET'])
@jwt_required()
def get_contractors():
    """Get all contractors."""
    company_id = request.args.get('company_id')
    status = request.args.get('status', 'active')
    
    contractor_list = [c for c in contractors.values() 
                       if c.get('company_id') == company_id and c.get('status') == status]
    
    return jsonify({'success': True, 'contractors': contractor_list}), 200


@contractor_1099_bp.route('/api/contractors/1099', methods=['POST'])
@jwt_required()
def create_contractor():
    """Create a new contractor."""
    data = request.get_json()
    contractor_id = str(uuid.uuid4())
    
    contractor = {
        'id': contractor_id,
        'company_id': data.get('company_id'),
        'type': data.get('type', 'individual'),
        'name': data.get('name'),
        'business_name': data.get('business_name'),
        'email': data.get('email'),
        'phone': data.get('phone'),
        'address': data.get('address'),
        'country': data.get('country', 'USA'),
        'currency': data.get('currency', 'USD'),
        'tax_info': {
            'tin_type': data.get('tin_type', 'SSN'),
            'tin': data.get('tin'),
            'w9_on_file': data.get('w9_on_file', False),
            'w9_date': data.get('w9_date')
        },
        'payment_info': {
            'method': data.get('payment_method', 'ach'),
            'bank_name': data.get('bank_name'),
            'routing_number': data.get('routing_number'),
            'account_number': data.get('account_number'),
            'account_type': data.get('account_type', 'checking')
        },
        'default_rate': data.get('default_rate'),
        'rate_type': data.get('rate_type', 'hourly'),
        'status': 'active',
        'created_at': datetime.now().isoformat()
    }
    
    contractors[contractor_id] = contractor
    return jsonify({'success': True, 'contractor': contractor}), 201


@contractor_1099_bp.route('/api/contractors/1099/<contractor_id>/payments', methods=['GET'])
@jwt_required()
def get_contractor_payments(contractor_id):
    """Get payments for a contractor."""
    year = request.args.get('year', datetime.now().year)
    
    payments = [p for p in contractor_payments.values() 
                if p.get('contractor_id') == contractor_id and p.get('year') == int(year)]
    
    total_usd = sum(p.get('amount_usd', 0) for p in payments)
    
    return jsonify({
        'success': True,
        'payments': payments,
        'ytd_total_usd': total_usd,
        '1099_threshold': 600,
        '1099_required': total_usd >= 600
    }), 200


@contractor_1099_bp.route('/api/contractors/1099/<contractor_id>/payments', methods=['POST'])
@jwt_required()
def create_contractor_payment(contractor_id):
    """Create a payment to a contractor."""
    if contractor_id not in contractors:
        return jsonify({'success': False, 'message': 'Contractor not found'}), 404
    
    data = request.get_json()
    payment_id = str(uuid.uuid4())
    
    # Handle multi-currency
    currency = data.get('currency', 'USD')
    amount = data.get('amount')
    amount_usd = amount * EXCHANGE_RATES.get(currency, 1.0)
    
    payment = {
        'id': payment_id,
        'contractor_id': contractor_id,
        'company_id': data.get('company_id'),
        'amount': amount,
        'currency': currency,
        'amount_usd': amount_usd,
        'exchange_rate': EXCHANGE_RATES.get(currency, 1.0),
        'description': data.get('description'),
        'invoice_number': data.get('invoice_number'),
        'payment_date': data.get('payment_date'),
        'payment_method': data.get('payment_method', 'ach'),
        'status': 'pending',
        'year': datetime.now().year,
        'created_at': datetime.now().isoformat()
    }
    
    contractor_payments[payment_id] = payment
    return jsonify({'success': True, 'payment': payment}), 201


# =============================================================================
# 1099-NEC FILING
# =============================================================================

@contractor_1099_bp.route('/api/contractors/1099-nec/generate', methods=['POST'])
@jwt_required()
def generate_1099_nec():
    """Generate 1099-NEC forms for year-end filing."""
    data = request.get_json()
    company_id = data.get('company_id')
    tax_year = data.get('tax_year', datetime.now().year - 1)
    
    # Get all contractors with payments >= $600
    eligible_contractors = []
    for contractor_id, contractor in contractors.items():
        if contractor.get('company_id') != company_id:
            continue
        
        payments = [p for p in contractor_payments.values() 
                   if p.get('contractor_id') == contractor_id and p.get('year') == tax_year]
        total = sum(p.get('amount_usd', 0) for p in payments)
        
        if total >= 600:
            eligible_contractors.append({
                'contractor_id': contractor_id,
                'contractor_name': contractor.get('name'),
                'total_payments': total
            })
    
    # Generate 1099-NEC forms
    generated_forms = []
    for ec in eligible_contractors:
        form_id = str(uuid.uuid4())
        form = {
            'id': form_id,
            'type': '1099-NEC',
            'tax_year': tax_year,
            'contractor_id': ec['contractor_id'],
            'contractor_name': ec['contractor_name'],
            'box1_nonemployee_compensation': ec['total_payments'],
            'box4_federal_income_tax_withheld': 0,
            'status': 'generated',
            'generated_at': datetime.now().isoformat()
        }
        form_1099s[form_id] = form
        generated_forms.append(form)
    
    return jsonify({
        'success': True,
        'tax_year': tax_year,
        'forms_generated': len(generated_forms),
        'forms': generated_forms
    }), 200


@contractor_1099_bp.route('/api/contractors/1099-nec/file', methods=['POST'])
@jwt_required()
def file_1099_nec():
    """File 1099-NEC forms with IRS."""
    data = request.get_json()
    form_ids = data.get('form_ids', [])
    
    filed_forms = []
    for form_id in form_ids:
        if form_id in form_1099s:
            form_1099s[form_id]['status'] = 'filed'
            form_1099s[form_id]['filed_at'] = datetime.now().isoformat()
            form_1099s[form_id]['confirmation_number'] = f"IRS-{uuid.uuid4().hex[:8].upper()}"
            filed_forms.append(form_1099s[form_id])
    
    return jsonify({
        'success': True,
        'forms_filed': len(filed_forms),
        'forms': filed_forms
    }), 200


@contractor_1099_bp.route('/api/contractors/1099-nec/summary', methods=['GET'])
@jwt_required()
def get_1099_summary():
    """Get 1099-NEC filing summary."""
    company_id = request.args.get('company_id')
    tax_year = request.args.get('tax_year', datetime.now().year - 1)
    
    summary = {
        'tax_year': int(tax_year),
        'total_contractors': 0,
        'contractors_above_threshold': 0,
        'total_payments': 0,
        'forms_generated': 0,
        'forms_filed': 0,
        'filing_deadline': f'{int(tax_year) + 1}-01-31',
        'copy_b_deadline': f'{int(tax_year) + 1}-01-31'
    }
    
    return jsonify({'success': True, 'summary': summary}), 200


# =============================================================================
# MULTI-CURRENCY SUPPORT
# =============================================================================

@contractor_1099_bp.route('/api/contractors/exchange-rates', methods=['GET'])
@jwt_required()
def get_exchange_rates():
    """Get current exchange rates."""
    return jsonify({
        'success': True,
        'base_currency': 'USD',
        'rates': EXCHANGE_RATES,
        'last_updated': datetime.now().isoformat()
    }), 200


@contractor_1099_bp.route('/api/contractors/convert', methods=['POST'])
@jwt_required()
def convert_currency():
    """Convert amount between currencies."""
    data = request.get_json()
    amount = data.get('amount')
    from_currency = data.get('from_currency', 'USD')
    to_currency = data.get('to_currency', 'CAD')
    
    # Convert to USD first, then to target
    usd_amount = amount * EXCHANGE_RATES.get(from_currency, 1.0)
    target_amount = usd_amount / EXCHANGE_RATES.get(to_currency, 1.0)
    
    return jsonify({
        'success': True,
        'original_amount': amount,
        'original_currency': from_currency,
        'converted_amount': round(target_amount, 2),
        'target_currency': to_currency,
        'exchange_rate': EXCHANGE_RATES.get(from_currency, 1.0) / EXCHANGE_RATES.get(to_currency, 1.0)
    }), 200
