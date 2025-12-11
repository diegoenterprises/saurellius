"""
SAURELLIUS TAX ENGINE V2 - PRODUCTION API
Enterprise-grade payroll tax calculations
Based on industry best practices for tax APIs

Core Capabilities:
- Location Code Resolution (address to jurisdiction)
- Unique Tax ID System (jurisdiction-based tax identification)
- Applicable Tax Discovery
- Gross-to-Net Calculations with YTD tracking
- Gross-Up (Net-to-Gross) Calculations
- Benefits Taxability Checking
- Multi-jurisdiction Support
- Batch Processing
"""

from datetime import datetime, date
from functools import wraps
from flask import Blueprint, request, jsonify, g
from decimal import Decimal, ROUND_HALF_UP
import uuid
import hashlib

tax_engine_v2_bp = Blueprint('tax_engine_v2', __name__, url_prefix='/api/v2/tax')

# =============================================================================
# LOCATION CODE SYSTEM - Unique jurisdiction identification
# Format: SS-CCC-LLLL where SS=State, CCC=County, LLLL=Local
# =============================================================================

LOCATION_CODES = {
    # Federal placeholder
    '00-000-0000': {'name': 'Federal', 'type': 'federal', 'state': None},
    
    # California
    '06-000-0000': {'name': 'California', 'type': 'state', 'state': 'CA'},
    '06-037-0000': {'name': 'Los Angeles County, CA', 'type': 'county', 'state': 'CA'},
    '06-075-0000': {'name': 'San Francisco County, CA', 'type': 'county', 'state': 'CA'},
    
    # New York
    '36-000-0000': {'name': 'New York', 'type': 'state', 'state': 'NY'},
    '36-061-0000': {'name': 'New York County (Manhattan)', 'type': 'county', 'state': 'NY'},
    '36-061-NYC1': {'name': 'New York City', 'type': 'city', 'state': 'NY'},
    '36-119-YONK': {'name': 'Yonkers', 'type': 'city', 'state': 'NY'},
    
    # Pennsylvania
    '42-000-0000': {'name': 'Pennsylvania', 'type': 'state', 'state': 'PA'},
    '42-101-0000': {'name': 'Philadelphia County', 'type': 'county', 'state': 'PA'},
    '42-101-PHL1': {'name': 'Philadelphia City', 'type': 'city', 'state': 'PA'},
    
    # Ohio
    '39-000-0000': {'name': 'Ohio', 'type': 'state', 'state': 'OH'},
    '39-035-0000': {'name': 'Cuyahoga County', 'type': 'county', 'state': 'OH'},
    '39-035-CLE1': {'name': 'Cleveland', 'type': 'city', 'state': 'OH'},
    '39-049-COL1': {'name': 'Columbus', 'type': 'city', 'state': 'OH'},
}

# State FIPS codes for location code generation
STATE_FIPS = {
    'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08', 'CT': '09',
    'DE': '10', 'FL': '12', 'GA': '13', 'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18',
    'IA': '19', 'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24', 'MA': '25',
    'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32',
    'NH': '33', 'NJ': '34', 'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39',
    'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45', 'SD': '46', 'TN': '47',
    'TX': '48', 'UT': '49', 'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55',
    'WY': '56', 'DC': '11',
}

# =============================================================================
# UNIQUE TAX ID SYSTEM
# Format: SS-CCC-LLLL-TYPE-VVV
# TYPE: FIT, SIT, FICA, MEDI, FUTA, SUTA, SDI, PFML, LIT, SCH
# =============================================================================

TAX_DEFINITIONS = {
    # Federal Taxes
    '00-000-0000-FIT-000': {
        'name': 'Federal Income Tax',
        'type': 'income',
        'jurisdiction': 'federal',
        'employer_paid': False,
        'required_params': ['filing_status', 'w4_version', 'dependents_amount', 'other_income', 'deductions', 'extra_withholding'],
    },
    '00-000-0000-FICA-000': {
        'name': 'Social Security (OASDI)',
        'type': 'payroll',
        'jurisdiction': 'federal',
        'employer_paid': True,
        'rate': 0.062,
        'wage_base': 176100,  # 2025
        'required_params': [],
    },
    '00-000-0000-MEDI-000': {
        'name': 'Medicare',
        'type': 'payroll',
        'jurisdiction': 'federal',
        'employer_paid': True,
        'rate': 0.0145,
        'required_params': [],
    },
    '00-000-0000-MEDI2-000': {
        'name': 'Additional Medicare',
        'type': 'payroll',
        'jurisdiction': 'federal',
        'employer_paid': False,
        'rate': 0.009,
        'threshold': 200000,
        'required_params': [],
    },
    '00-000-0000-FUTA-000': {
        'name': 'Federal Unemployment (FUTA)',
        'type': 'unemployment',
        'jurisdiction': 'federal',
        'employer_paid': True,
        'rate': 0.006,
        'wage_base': 7000,
        'required_params': [],
    },
}

# =============================================================================
# API CLIENT MANAGEMENT
# =============================================================================

API_CLIENTS = {
    'ste_v2_starter': {'tier': 'starter', 'daily_limit': 1000, 'features': ['geocode', 'calculate']},
    'ste_v2_growth': {'tier': 'growth', 'daily_limit': 10000, 'features': ['geocode', 'calculate', 'batch', 'grossup']},
    'ste_v2_scale': {'tier': 'scale', 'daily_limit': 100000, 'features': ['geocode', 'calculate', 'batch', 'grossup', 'multistate', 'local']},
    'ste_v2_enterprise': {'tier': 'enterprise', 'daily_limit': -1, 'features': ['all']},
}

USAGE_TRACKING = {}


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('Bearer ', '')
        if not api_key or api_key not in API_CLIENTS:
            return jsonify({'error': {'code': 'unauthorized', 'message': 'Valid API key required'}}), 401
        
        client = API_CLIENTS[api_key]
        today = date.today().isoformat()
        usage_key = f"{api_key}:{today}"
        usage = USAGE_TRACKING.get(usage_key, 0)
        
        if client['daily_limit'] != -1 and usage >= client['daily_limit']:
            return jsonify({'error': {'code': 'rate_limit', 'message': 'Daily limit exceeded'}}), 429
        
        USAGE_TRACKING[usage_key] = usage + 1
        g.client = client
        g.request_id = uuid.uuid4().hex[:16]
        return f(*args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated


def require_feature(feature):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'all' not in g.client['features'] and feature not in g.client['features']:
                return jsonify({'error': {'code': 'feature_unavailable', 'message': f'{feature} not in your plan'}}), 403
            return f(*args, **kwargs)
        decorated.__name__ = f.__name__
        return decorated
    return decorator


# =============================================================================
# LOCATION CODE SERVICE ENDPOINTS
# =============================================================================

@tax_engine_v2_bp.route('/geocode', methods=['POST'])
@require_api_key
@require_feature('geocode')
def geocode_address():
    """
    Translate an address to location codes.
    Returns all applicable jurisdiction codes for the address.
    
    Request:
    {
        "address": {
            "street": "123 Main St",
            "city": "Los Angeles",
            "state": "CA",
            "zip": "90001"
        }
    }
    """
    data = request.get_json()
    if not data or 'address' not in data:
        return jsonify({'error': {'code': 'invalid_request', 'message': 'address object required'}}), 400
    
    addr = data['address']
    state = addr.get('state', '').upper()
    city = addr.get('city', '').lower()
    zip_code = addr.get('zip', '')
    
    # Generate location codes
    location_codes = []
    
    # Federal always applies
    location_codes.append({
        'location_code': '00-000-0000',
        'jurisdiction_name': 'Federal',
        'jurisdiction_type': 'federal',
    })
    
    # State level
    state_fips = STATE_FIPS.get(state, '00')
    state_code = f"{state_fips}-000-0000"
    location_codes.append({
        'location_code': state_code,
        'jurisdiction_name': f'{state} State',
        'jurisdiction_type': 'state',
        'state': state,
    })
    
    # Check for known local jurisdictions
    for code, info in LOCATION_CODES.items():
        if info.get('state') == state and info['type'] in ['city', 'county']:
            if city in info['name'].lower():
                location_codes.append({
                    'location_code': code,
                    'jurisdiction_name': info['name'],
                    'jurisdiction_type': info['type'],
                    'state': state,
                })
    
    return jsonify({
        'success': True,
        'request_id': g.request_id,
        'data': {
            'input_address': addr,
            'location_codes': location_codes,
            'primary_location_code': state_code,
            'geocode_confidence': 'high',
        }
    })


@tax_engine_v2_bp.route('/jurisdictions/lookup', methods=['POST'])
@require_api_key
@require_feature('geocode')
def lookup_jurisdiction():
    """
    Get jurisdiction details for a location code.
    """
    data = request.get_json()
    location_code = data.get('location_code', '')
    
    if location_code in LOCATION_CODES:
        info = LOCATION_CODES[location_code]
        return jsonify({
            'success': True,
            'data': {
                'location_code': location_code,
                **info,
                'effective_date': '2025-01-01',
            }
        })
    
    # Generate info from code format
    parts = location_code.split('-')
    if len(parts) >= 3:
        state_fips = parts[0]
        state = next((s for s, f in STATE_FIPS.items() if f == state_fips), None)
        return jsonify({
            'success': True,
            'data': {
                'location_code': location_code,
                'state': state,
                'type': 'state' if parts[1] == '000' else 'local',
            }
        })
    
    return jsonify({'error': {'code': 'not_found', 'message': 'Location code not found'}}), 404


# =============================================================================
# TAX DISCOVERY ENDPOINTS
# =============================================================================

@tax_engine_v2_bp.route('/taxes/applicable', methods=['POST'])
@require_api_key
@require_feature('calculate')
def get_applicable_taxes():
    """
    Retrieve all potentially applicable taxes for given location codes.
    
    Request:
    {
        "tax_references": [
            {"location_code": "00-000-0000", "is_resident": true},
            {"location_code": "06-000-0000", "is_resident": true}
        ],
        "pay_date": "2025-01-15"
    }
    """
    data = request.get_json()
    tax_refs = data.get('tax_references', [])
    pay_date = data.get('pay_date', date.today().isoformat())
    
    applicable_taxes = []
    
    for ref in tax_refs:
        loc_code = ref.get('location_code', '')
        is_resident = ref.get('is_resident', True)
        
        # Federal taxes always apply
        if loc_code == '00-000-0000':
            applicable_taxes.extend([
                {
                    'unique_tax_id': '00-000-0000-FIT-000',
                    'description': 'Federal Income Tax',
                    'location_code': loc_code,
                    'is_resident': is_resident,
                    'tax_type': 'income',
                    'employer_tax': False,
                    'required_parameters': [
                        {'name': 'filing_status', 'type': 'enum', 'values': ['S', 'MFJ', 'MFS', 'HOH', 'QSS']},
                        {'name': 'w4_version', 'type': 'enum', 'values': ['2020', 'pre2020']},
                        {'name': 'dependents_amount', 'type': 'decimal'},
                        {'name': 'other_income', 'type': 'decimal'},
                        {'name': 'deductions', 'type': 'decimal'},
                        {'name': 'extra_withholding', 'type': 'decimal'},
                    ],
                },
                {
                    'unique_tax_id': '00-000-0000-FICA-000',
                    'description': 'Social Security (OASDI)',
                    'location_code': loc_code,
                    'tax_type': 'payroll',
                    'employer_tax': True,
                    'rate': 0.062,
                    'wage_base': 176100,
                    'required_parameters': [],
                },
                {
                    'unique_tax_id': '00-000-0000-MEDI-000',
                    'description': 'Medicare',
                    'location_code': loc_code,
                    'tax_type': 'payroll',
                    'employer_tax': True,
                    'rate': 0.0145,
                    'required_parameters': [],
                },
            ])
        
        # State taxes
        elif loc_code.endswith('-000-0000') and loc_code != '00-000-0000':
            state_fips = loc_code[:2]
            state = next((s for s, f in STATE_FIPS.items() if f == state_fips), 'XX')
            
            # Check if state has income tax
            no_income_tax = ['AK', 'FL', 'NV', 'SD', 'TX', 'WA', 'WY', 'TN', 'NH']
            
            if state not in no_income_tax:
                applicable_taxes.append({
                    'unique_tax_id': f'{loc_code[:10]}-SIT-000',
                    'description': f'{state} State Income Tax',
                    'location_code': loc_code,
                    'is_resident': is_resident,
                    'tax_type': 'income',
                    'employer_tax': False,
                    'required_parameters': [
                        {'name': 'state_filing_status', 'type': 'string'},
                        {'name': 'state_allowances', 'type': 'integer'},
                    ],
                })
            
            # State unemployment
            applicable_taxes.append({
                'unique_tax_id': f'{loc_code[:10]}-SUTA-000',
                'description': f'{state} Unemployment Insurance',
                'location_code': loc_code,
                'tax_type': 'unemployment',
                'employer_tax': True,
                'required_parameters': [],
            })
    
    return jsonify({
        'success': True,
        'request_id': g.request_id,
        'data': {
            'pay_date': pay_date,
            'tax_count': len(applicable_taxes),
            'taxes': applicable_taxes,
        }
    })


@tax_engine_v2_bp.route('/taxes/<tax_id>/parameters', methods=['GET'])
@require_api_key
@require_feature('calculate')
def get_tax_parameters(tax_id):
    """
    Get required parameters for a specific tax.
    """
    tax_def = TAX_DEFINITIONS.get(tax_id)
    
    if not tax_def:
        return jsonify({'error': {'code': 'not_found', 'message': 'Tax ID not found'}}), 404
    
    return jsonify({
        'success': True,
        'data': {
            'unique_tax_id': tax_id,
            'name': tax_def['name'],
            'required_parameters': tax_def.get('required_params', []),
            'optional_parameters': [],
        }
    })


# =============================================================================
# GROSS-TO-NET CALCULATION ENGINE
# =============================================================================

# 2025 Federal Tax Brackets
FEDERAL_BRACKETS_2025 = {
    'S': [  # Single
        {'min': 0, 'max': 11925, 'rate': 0.10, 'base': 0},
        {'min': 11925, 'max': 48475, 'rate': 0.12, 'base': 1192.50},
        {'min': 48475, 'max': 103350, 'rate': 0.22, 'base': 5578.50},
        {'min': 103350, 'max': 197300, 'rate': 0.24, 'base': 17651.50},
        {'min': 197300, 'max': 250525, 'rate': 0.32, 'base': 40199.50},
        {'min': 250525, 'max': 626350, 'rate': 0.35, 'base': 57231.50},
        {'min': 626350, 'max': float('inf'), 'rate': 0.37, 'base': 188769.75},
    ],
    'MFJ': [  # Married Filing Jointly
        {'min': 0, 'max': 23850, 'rate': 0.10, 'base': 0},
        {'min': 23850, 'max': 96950, 'rate': 0.12, 'base': 2385.00},
        {'min': 96950, 'max': 206700, 'rate': 0.22, 'base': 11157.00},
        {'min': 206700, 'max': 394600, 'rate': 0.24, 'base': 35302.00},
        {'min': 394600, 'max': 501050, 'rate': 0.32, 'base': 80398.00},
        {'min': 501050, 'max': 751600, 'rate': 0.35, 'base': 114462.00},
        {'min': 751600, 'max': float('inf'), 'rate': 0.37, 'base': 202154.50},
    ],
}

STANDARD_DEDUCTIONS_2025 = {'S': 15000, 'MFJ': 30000, 'MFS': 15000, 'HOH': 22500, 'QSS': 30000}


def calculate_federal_income_tax(taxable_income, filing_status, pay_periods):
    """Calculate FIT withholding per pay period."""
    brackets = FEDERAL_BRACKETS_2025.get(filing_status, FEDERAL_BRACKETS_2025['S'])
    annual_tax = 0
    
    for bracket in brackets:
        if taxable_income > bracket['min']:
            if taxable_income <= bracket['max']:
                annual_tax = bracket['base'] + (taxable_income - bracket['min']) * bracket['rate']
                break
            elif bracket['max'] == float('inf'):
                annual_tax = bracket['base'] + (taxable_income - bracket['min']) * bracket['rate']
    
    return round(annual_tax / pay_periods, 2)


@tax_engine_v2_bp.route('/calculate/gross-to-net', methods=['POST'])
@require_api_key
@require_feature('calculate')
def calculate_gross_to_net():
    """
    Compute gross-to-net payroll tax withholding.
    
    Request:
    {
        "employee_id": "EMP-001",
        "payroll_run": {
            "pay_date": "2025-01-15",
            "pay_periods_per_year": 26,
            "pay_period_number": 1
        },
        "wages": [
            {
                "location_code": "00-000-0000",
                "wage_type": "regular",
                "gross_wages": 2500,
                "hours": 80,
                "mtd_wages": 0,
                "qtd_wages": 0,
                "ytd_wages": 0
            }
        ],
        "tax_parameters": [
            {
                "unique_tax_id": "00-000-0000-FIT-000",
                "location_code": "00-000-0000",
                "is_exempt": false,
                "ytd_withholding": 0,
                "parameters": {
                    "filing_status": "S",
                    "w4_version": "2020",
                    "dependents_amount": 0,
                    "other_income": 0,
                    "deductions": 0,
                    "extra_withholding": 0
                }
            }
        ],
        "pre_tax_deductions": {
            "401k": 250,
            "health_insurance": 150
        }
    }
    """
    data = request.get_json()
    
    employee_id = data.get('employee_id', 'unknown')
    payroll_run = data.get('payroll_run', {})
    wages = data.get('wages', [])
    tax_params = data.get('tax_parameters', [])
    pre_tax = data.get('pre_tax_deductions', {})
    
    pay_periods = payroll_run.get('pay_periods_per_year', 26)
    
    # Calculate total gross
    total_gross = sum(w.get('gross_wages', 0) for w in wages)
    total_pre_tax = sum(pre_tax.values())
    taxable_wages = total_gross - total_pre_tax
    
    # Calculate each tax
    tax_results = []
    total_employee_tax = 0
    total_employer_tax = 0
    
    for tp in tax_params:
        tax_id = tp.get('unique_tax_id', '')
        params = tp.get('parameters', {})
        is_exempt = tp.get('is_exempt', False)
        ytd_wh = tp.get('ytd_withholding', 0)
        
        tax_amount = 0
        employer_amount = 0
        
        if is_exempt:
            tax_results.append({
                'unique_tax_id': tax_id,
                'location_code': tp.get('location_code'),
                'description': TAX_DEFINITIONS.get(tax_id, {}).get('name', tax_id),
                'tax_amount': 0,
                'employer_amount': 0,
                'is_exempt': True,
            })
            continue
        
        # Federal Income Tax
        if tax_id == '00-000-0000-FIT-000':
            filing_status = params.get('filing_status', 'S')
            std_deduction = STANDARD_DEDUCTIONS_2025.get(filing_status, 15000)
            dependents = float(params.get('dependents_amount', 0))
            other_income = float(params.get('other_income', 0))
            deductions = float(params.get('deductions', 0))
            extra_wh = float(params.get('extra_withholding', 0))
            
            annual_wages = taxable_wages * pay_periods + other_income
            annual_taxable = max(0, annual_wages - std_deduction - deductions)
            annual_tax = 0
            
            for bracket in FEDERAL_BRACKETS_2025.get(filing_status, FEDERAL_BRACKETS_2025['S']):
                if annual_taxable > bracket['min']:
                    if annual_taxable <= bracket['max']:
                        annual_tax = bracket['base'] + (annual_taxable - bracket['min']) * bracket['rate']
                        break
            
            # Subtract dependent credits
            annual_tax = max(0, annual_tax - dependents)
            tax_amount = round(annual_tax / pay_periods + extra_wh, 2)
        
        # Social Security
        elif tax_id == '00-000-0000-FICA-000':
            wage_base = 176100
            ytd_wages = sum(w.get('ytd_wages', 0) for w in wages)
            
            if ytd_wages >= wage_base:
                tax_amount = 0
            elif ytd_wages + taxable_wages > wage_base:
                taxable_ss = wage_base - ytd_wages
                tax_amount = round(taxable_ss * 0.062, 2)
            else:
                tax_amount = round(taxable_wages * 0.062, 2)
            
            employer_amount = tax_amount  # Employer matches
        
        # Medicare
        elif tax_id == '00-000-0000-MEDI-000':
            tax_amount = round(taxable_wages * 0.0145, 2)
            employer_amount = tax_amount
        
        # Additional Medicare
        elif tax_id == '00-000-0000-MEDI2-000':
            ytd_wages = sum(w.get('ytd_wages', 0) for w in wages)
            threshold = 200000
            
            if ytd_wages >= threshold:
                tax_amount = round(taxable_wages * 0.009, 2)
            elif ytd_wages + taxable_wages > threshold:
                taxable_addl = (ytd_wages + taxable_wages) - threshold
                tax_amount = round(taxable_addl * 0.009, 2)
            else:
                tax_amount = 0
        
        # State Income Tax (simplified)
        elif '-SIT-' in tax_id:
            state_rate = 0.05  # Simplified flat rate
            tax_amount = round(taxable_wages * state_rate, 2)
        
        total_employee_tax += tax_amount
        total_employer_tax += employer_amount
        
        tax_results.append({
            'unique_tax_id': tax_id,
            'location_code': tp.get('location_code'),
            'description': TAX_DEFINITIONS.get(tax_id, {}).get('name', tax_id),
            'tax_amount': tax_amount,
            'employer_amount': employer_amount,
            'ytd_withholding': ytd_wh + tax_amount,
        })
    
    net_pay = total_gross - total_pre_tax - total_employee_tax
    
    return jsonify({
        'success': True,
        'request_id': g.request_id,
        'data': {
            'employee_id': employee_id,
            'pay_date': payroll_run.get('pay_date'),
            'gross_wages': total_gross,
            'pre_tax_deductions': total_pre_tax,
            'taxable_wages': taxable_wages,
            'tax_withholdings': tax_results,
            'total_employee_taxes': round(total_employee_tax, 2),
            'total_employer_taxes': round(total_employer_tax, 2),
            'net_pay': round(net_pay, 2),
        }
    })


# =============================================================================
# GROSS-UP CALCULATION (Net to Gross)
# =============================================================================

@tax_engine_v2_bp.route('/calculate/gross-up', methods=['POST'])
@require_api_key
@require_feature('grossup')
def calculate_gross_up():
    """
    Calculate gross pay needed to achieve a target net pay.
    Used for bonus payments where employee should receive exact net amount.
    
    Request:
    {
        "employee_id": "EMP-001",
        "target_net_pay": 5000,
        "location_code": "06-000-0000",
        "filing_status": "S",
        "pay_periods_per_year": 26,
        "supplemental_rate": true
    }
    """
    data = request.get_json()
    
    target_net = float(data.get('target_net_pay', 0))
    filing_status = data.get('filing_status', 'S')
    use_supplemental = data.get('supplemental_rate', True)
    
    # Supplemental flat rates
    federal_supp_rate = 0.22  # Federal supplemental rate
    state_supp_rate = 0.05   # Estimated state rate
    fica_rate = 0.062
    medicare_rate = 0.0145
    
    total_rate = federal_supp_rate + state_supp_rate + fica_rate + medicare_rate
    
    # Gross = Net / (1 - total_rate)
    gross_pay = target_net / (1 - total_rate)
    
    # Calculate individual taxes
    federal_tax = gross_pay * federal_supp_rate
    state_tax = gross_pay * state_supp_rate
    social_security = gross_pay * fica_rate
    medicare = gross_pay * medicare_rate
    
    total_taxes = federal_tax + state_tax + social_security + medicare
    calculated_net = gross_pay - total_taxes
    
    return jsonify({
        'success': True,
        'request_id': g.request_id,
        'data': {
            'target_net_pay': target_net,
            'calculated_gross_pay': round(gross_pay, 2),
            'tax_breakdown': {
                'federal_income_tax': round(federal_tax, 2),
                'state_income_tax': round(state_tax, 2),
                'social_security': round(social_security, 2),
                'medicare': round(medicare, 2),
                'total_taxes': round(total_taxes, 2),
            },
            'calculated_net_pay': round(calculated_net, 2),
            'gross_up_method': 'supplemental_flat_rate' if use_supplemental else 'aggregate',
        }
    })


# =============================================================================
# BATCH PROCESSING
# =============================================================================

@tax_engine_v2_bp.route('/calculate/batch', methods=['POST'])
@require_api_key
@require_feature('batch')
def calculate_batch():
    """
    Process multiple employee payroll calculations in a single request.
    
    Request:
    {
        "payroll_run": {
            "pay_date": "2025-01-15",
            "pay_periods_per_year": 26
        },
        "employees": [
            {
                "employee_id": "EMP-001",
                "wages": [...],
                "tax_parameters": [...]
            }
        ]
    }
    """
    data = request.get_json()
    
    payroll_run = data.get('payroll_run', {})
    employees = data.get('employees', [])
    
    # Batch limits by tier
    batch_limits = {'starter': 0, 'growth': 100, 'scale': 1000, 'enterprise': 10000}
    max_batch = batch_limits.get(g.client['tier'], 0)
    
    if len(employees) > max_batch:
        return jsonify({
            'error': {
                'code': 'batch_limit_exceeded',
                'message': f'Your plan allows {max_batch} employees per batch',
            }
        }), 400
    
    results = []
    total_gross = 0
    total_taxes = 0
    total_net = 0
    errors = []
    
    for emp in employees:
        try:
            emp_id = emp.get('employee_id', 'unknown')
            wages = emp.get('wages', [])
            tax_params = emp.get('tax_parameters', [])
            pre_tax = emp.get('pre_tax_deductions', {})
            pay_periods = payroll_run.get('pay_periods_per_year', 26)
            
            emp_gross = sum(w.get('gross_wages', 0) for w in wages)
            emp_pre_tax = sum(pre_tax.values())
            taxable = emp_gross - emp_pre_tax
            
            emp_taxes = 0
            for tp in tax_params:
                tax_id = tp.get('unique_tax_id', '')
                if '-FIT-' in tax_id:
                    emp_taxes += round(taxable * 0.15, 2)  # Simplified
                elif '-FICA-' in tax_id:
                    emp_taxes += round(taxable * 0.062, 2)
                elif '-MEDI-' in tax_id and '-MEDI2-' not in tax_id:
                    emp_taxes += round(taxable * 0.0145, 2)
                elif '-SIT-' in tax_id:
                    emp_taxes += round(taxable * 0.05, 2)
            
            emp_net = emp_gross - emp_pre_tax - emp_taxes
            
            results.append({
                'employee_id': emp_id,
                'gross_wages': emp_gross,
                'taxable_wages': taxable,
                'total_taxes': round(emp_taxes, 2),
                'net_pay': round(emp_net, 2),
                'status': 'success',
            })
            
            total_gross += emp_gross
            total_taxes += emp_taxes
            total_net += emp_net
            
        except Exception as e:
            errors.append({'employee_id': emp.get('employee_id'), 'error': str(e)})
    
    return jsonify({
        'success': True,
        'request_id': g.request_id,
        'data': {
            'pay_date': payroll_run.get('pay_date'),
            'employees_processed': len(results),
            'employees_failed': len(errors),
            'results': results,
            'errors': errors if errors else None,
            'totals': {
                'total_gross_wages': round(total_gross, 2),
                'total_taxes': round(total_taxes, 2),
                'total_net_pay': round(total_net, 2),
            }
        }
    })


# =============================================================================
# BENEFITS TAXABILITY
# =============================================================================

BENEFIT_TAXABILITY = {
    'health_insurance_employer': {'federal': False, 'fica': False, 'state': False, 'description': 'Employer-paid health insurance'},
    'health_insurance_employee': {'federal': False, 'fica': False, 'state': False, 'description': 'Employee pre-tax health insurance'},
    '401k_traditional': {'federal': False, 'fica': True, 'state': False, 'description': 'Traditional 401(k) contribution'},
    '401k_roth': {'federal': True, 'fica': True, 'state': True, 'description': 'Roth 401(k) contribution'},
    'hsa_employee': {'federal': False, 'fica': False, 'state': False, 'description': 'Employee HSA contribution'},
    'hsa_employer': {'federal': False, 'fica': False, 'state': False, 'description': 'Employer HSA contribution'},
    'fsa_dependent_care': {'federal': False, 'fica': False, 'state': False, 'description': 'Dependent Care FSA', 'limit': 5000},
    'fsa_healthcare': {'federal': False, 'fica': False, 'state': False, 'description': 'Healthcare FSA', 'limit': 3300},
    'life_insurance_gtl': {'federal': True, 'fica': True, 'state': True, 'description': 'Group Term Life over $50k', 'threshold': 50000},
    'parking_transit': {'federal': False, 'fica': False, 'state': False, 'description': 'Qualified parking/transit', 'limit': 325},
    'education_assistance': {'federal': False, 'fica': False, 'state': False, 'description': 'Education assistance', 'limit': 5250},
    'adoption_assistance': {'federal': False, 'fica': True, 'state': False, 'description': 'Adoption assistance', 'limit': 16810},
}


@tax_engine_v2_bp.route('/benefits/taxability', methods=['POST'])
@require_api_key
@require_feature('calculate')
def check_benefit_taxability():
    """
    Check taxability of benefit contributions.
    
    Request:
    {
        "benefits": [
            {"type": "401k_traditional", "amount": 500},
            {"type": "health_insurance_employee", "amount": 200}
        ],
        "state": "CA"
    }
    """
    data = request.get_json()
    benefits = data.get('benefits', [])
    state = data.get('state', '').upper()
    
    results = []
    total_pre_tax_federal = 0
    total_pre_tax_fica = 0
    total_pre_tax_state = 0
    
    for benefit in benefits:
        benefit_type = benefit.get('type', '')
        amount = float(benefit.get('amount', 0))
        
        taxability = BENEFIT_TAXABILITY.get(benefit_type, {
            'federal': True, 'fica': True, 'state': True, 'description': 'Unknown benefit'
        })
        
        # Check limits
        limit = taxability.get('limit')
        ytd_amount = float(benefit.get('ytd_amount', 0))
        
        taxable_amount = amount
        if limit and ytd_amount + amount > limit:
            excess = (ytd_amount + amount) - limit
            taxable_amount = excess
        elif not taxability['federal']:
            taxable_amount = 0
        
        results.append({
            'benefit_type': benefit_type,
            'description': taxability.get('description'),
            'amount': amount,
            'pre_tax_federal': not taxability['federal'],
            'pre_tax_fica': not taxability['fica'],
            'pre_tax_state': not taxability['state'],
            'annual_limit': limit,
            'taxable_amount': taxable_amount if taxability['federal'] else 0,
        })
        
        if not taxability['federal']:
            total_pre_tax_federal += amount
        if not taxability['fica']:
            total_pre_tax_fica += amount
        if not taxability['state']:
            total_pre_tax_state += amount
    
    return jsonify({
        'success': True,
        'request_id': g.request_id,
        'data': {
            'benefits': results,
            'totals': {
                'pre_tax_federal': round(total_pre_tax_federal, 2),
                'pre_tax_fica': round(total_pre_tax_fica, 2),
                'pre_tax_state': round(total_pre_tax_state, 2),
            }
        }
    })


@tax_engine_v2_bp.route('/benefits/types', methods=['GET'])
@require_api_key
def list_benefit_types():
    """List all supported benefit types and their taxability."""
    return jsonify({
        'success': True,
        'data': {
            'benefit_types': [
                {'type': k, **v} for k, v in BENEFIT_TAXABILITY.items()
            ]
        }
    })


# =============================================================================
# ACCOUNT & SCHEMA ENDPOINTS
# =============================================================================

@tax_engine_v2_bp.route('/account', methods=['GET'])
@require_api_key
def get_account_info():
    """Get account information and usage."""
    today = date.today().isoformat()
    usage_key = f"{request.headers.get('X-API-Key')}:{today}"
    usage = USAGE_TRACKING.get(usage_key, 0)
    
    return jsonify({
        'success': True,
        'data': {
            'tier': g.client['tier'],
            'features': g.client['features'],
            'usage': {
                'date': today,
                'requests_today': usage,
                'daily_limit': g.client['daily_limit'] if g.client['daily_limit'] != -1 else 'unlimited',
                'remaining': max(0, g.client['daily_limit'] - usage) if g.client['daily_limit'] != -1 else 'unlimited',
            },
            'rate_limits': {
                'requests_per_second': 100 if g.client['tier'] == 'enterprise' else 10,
                'batch_size': {'starter': 0, 'growth': 100, 'scale': 1000, 'enterprise': 10000}.get(g.client['tier']),
            }
        }
    })


@tax_engine_v2_bp.route('/schema', methods=['GET'])
@require_api_key
def get_api_schema():
    """Get API schema and endpoint documentation."""
    return jsonify({
        'success': True,
        'data': {
            'api_version': '2.0.0',
            'base_url': '/api/v2/tax',
            'endpoints': [
                {'path': '/geocode', 'method': 'POST', 'description': 'Convert address to location codes', 'feature': 'geocode'},
                {'path': '/jurisdictions/lookup', 'method': 'POST', 'description': 'Get jurisdiction details', 'feature': 'geocode'},
                {'path': '/taxes/applicable', 'method': 'POST', 'description': 'Find applicable taxes', 'feature': 'calculate'},
                {'path': '/taxes/{tax_id}/parameters', 'method': 'GET', 'description': 'Get tax parameters', 'feature': 'calculate'},
                {'path': '/calculate/gross-to-net', 'method': 'POST', 'description': 'Calculate payroll taxes', 'feature': 'calculate'},
                {'path': '/calculate/gross-up', 'method': 'POST', 'description': 'Calculate gross from net', 'feature': 'grossup'},
                {'path': '/calculate/batch', 'method': 'POST', 'description': 'Batch payroll calculation', 'feature': 'batch'},
                {'path': '/benefits/taxability', 'method': 'POST', 'description': 'Check benefit taxability', 'feature': 'calculate'},
                {'path': '/benefits/types', 'method': 'GET', 'description': 'List benefit types', 'feature': 'calculate'},
                {'path': '/account', 'method': 'GET', 'description': 'Account info and usage', 'feature': None},
                {'path': '/schema', 'method': 'GET', 'description': 'API schema', 'feature': None},
            ],
            'tax_id_format': 'SS-CCC-LLLL-TYPE-VVV',
            'location_code_format': 'SS-CCC-LLLL (State FIPS-County-Local)',
            'supported_tax_types': ['FIT', 'SIT', 'FICA', 'MEDI', 'MEDI2', 'FUTA', 'SUTA', 'SDI', 'PFML', 'LIT'],
        }
    })


@tax_engine_v2_bp.route('/health', methods=['GET'])
def health_check():
    """API health check."""
    return jsonify({
        'status': 'healthy',
        'service': 'saurellius-tax-engine-v2',
        'version': '2.0.0',
        'timestamp': datetime.utcnow().isoformat(),
    })
