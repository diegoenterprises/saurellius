"""
🏛️ SAURELLIUS TAX ENGINE API ROUTES
Open API endpoints for enterprise partners
Enterprise-grade payroll tax calculations

API Tiers:
- Standard: $2,000/year - 5,000 requests/day
- Professional: $5,000/year - 20,000 requests/day
- Enterprise: $10,000/year - 100,000 requests/day
- Ultimate: $15,000/year - Unlimited
"""

from datetime import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, g
import secrets

from services.tax_engine_service import tax_engine

tax_engine_bp = Blueprint('tax_engine', __name__)

# =============================================================================
# API KEY AUTHENTICATION (In production, use database)
# =============================================================================

API_CLIENTS = {
    # Demo keys for testing
    'ste_demo_standard_key': {
        'client_id': 'demo_standard',
        'name': 'Demo Standard Client',
        'tier': 'standard',
        'daily_limit': 5000,
        'features': ['calculate', 'rates'],
    },
    'ste_demo_professional_key': {
        'client_id': 'demo_professional',
        'name': 'Demo Professional Client',
        'tier': 'professional',
        'daily_limit': 20000,
        'features': ['calculate', 'rates', 'batch', 'multistate'],
    },
    'ste_demo_enterprise_key': {
        'client_id': 'demo_enterprise',
        'name': 'Demo Enterprise Client',
        'tier': 'enterprise',
        'daily_limit': 100000,
        'features': ['calculate', 'rates', 'batch', 'multistate', 'local', 'webhooks'],
    },
    'ste_demo_ultimate_key': {
        'client_id': 'demo_ultimate',
        'name': 'Demo Ultimate Client',
        'tier': 'ultimate',
        'daily_limit': -1,  # Unlimited
        'features': ['all'],
    },
}

# Usage tracking (in production, use Redis)
USAGE_TRACKING = {}


def require_api_key(f):
    """Require valid API key for access."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('ApiKey ', '')
        
        if not api_key:
            return jsonify({
                'error': {
                    'code': 'missing_api_key',
                    'message': 'API key is required. Include X-API-Key header.'
                }
            }), 401
        
        client = API_CLIENTS.get(api_key)
        if not client:
            return jsonify({
                'error': {
                    'code': 'invalid_api_key',
                    'message': 'Invalid or inactive API key.'
                }
            }), 401
        
        # Check rate limit
        today = datetime.utcnow().strftime('%Y-%m-%d')
        usage_key = f"{client['client_id']}:{today}"
        current_usage = USAGE_TRACKING.get(usage_key, 0)
        
        if client['daily_limit'] != -1 and current_usage >= client['daily_limit']:
            return jsonify({
                'error': {
                    'code': 'rate_limit_exceeded',
                    'message': f"Daily limit of {client['daily_limit']} requests exceeded.",
                    'limit': client['daily_limit'],
                    'usage': current_usage,
                }
            }), 429
        
        # Track usage
        USAGE_TRACKING[usage_key] = current_usage + 1
        
        # Add client to request context
        g.client = client
        g.api_key = api_key
        
        return f(*args, **kwargs)
    return decorated_function


def require_feature(feature):
    """Require specific feature access."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client = g.get('client')
            if not client:
                return jsonify({
                    'error': {
                        'code': 'unauthorized',
                        'message': 'Authentication required.'
                    }
                }), 401
            
            if 'all' not in client['features'] and feature not in client['features']:
                return jsonify({
                    'error': {
                        'code': 'feature_not_available',
                        'message': f"The '{feature}' feature is not available on your {client['tier']} tier.",
                        'upgrade_info': 'Contact sales@saurellius.com to upgrade.'
                    }
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# =============================================================================
# API ENDPOINTS
# =============================================================================

@tax_engine_bp.route('/api/v1/tax-engine', methods=['GET'])
def api_info():
    """Get API information and status."""
    return jsonify({
        'name': 'Saurellius Tax Engine API',
        'version': '1.0.0',
        'status': 'operational',
        'documentation': 'https://docs.saurellius.com/tax-engine',
        'endpoints': {
            'calculate': '/api/v1/tax-engine/calculate',
            'batch': '/api/v1/tax-engine/batch',
            'rates': '/api/v1/tax-engine/rates',
            'jurisdictions': '/api/v1/tax-engine/jurisdictions',
        },
        'supported_jurisdictions': 7400,
        'average_response_time_ms': 3,
    })


@tax_engine_bp.route('/api/v1/tax-engine/calculate', methods=['POST'])
@require_api_key
@require_feature('calculate')
def calculate_taxes():
    """
    Calculate taxes for a single employee.
    
    Request body:
    {
        "gross_pay": 5000,
        "filing_status": "single",
        "pay_frequency": "biweekly",
        "work_state": "CA",
        "home_state": "CA",
        "ytd_gross": 50000,
        "ytd_social_security": 3100,
        "pre_tax_deductions": {
            "401k": 500,
            "health_insurance": 200
        },
        "w4_data": {
            "additional_withholding": 0
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': {
                    'code': 'invalid_request',
                    'message': 'Request body is required.'
                }
            }), 400
        
        if 'gross_pay' not in data:
            return jsonify({
                'error': {
                    'code': 'missing_field',
                    'message': 'gross_pay is required.'
                }
            }), 400
        
        result = tax_engine.calculate_taxes(data)
        
        return jsonify({
            'success': True,
            'data': result,
            'meta': {
                'api_version': '1.0.0',
                'client_tier': g.client['tier'],
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': {
                'code': 'calculation_error',
                'message': str(e)
            }
        }), 500


@tax_engine_bp.route('/api/v1/tax-engine/batch', methods=['POST'])
@require_api_key
@require_feature('batch')
def calculate_batch():
    """
    Calculate taxes for multiple employees in a batch.
    
    Request body:
    {
        "employees": [
            {"gross_pay": 5000, "filing_status": "single", ...},
            {"gross_pay": 6000, "filing_status": "married_filing_jointly", ...}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'employees' not in data:
            return jsonify({
                'error': {
                    'code': 'invalid_request',
                    'message': 'employees array is required.'
                }
            }), 400
        
        employees = data['employees']
        
        # Check batch size limits by tier
        batch_limits = {
            'standard': 0,  # No batch
            'professional': 100,
            'enterprise': 1000,
            'ultimate': 10000,
        }
        
        max_batch = batch_limits.get(g.client['tier'], 0)
        
        if max_batch == 0:
            return jsonify({
                'error': {
                    'code': 'feature_not_available',
                    'message': 'Batch processing is not available on your tier.'
                }
            }), 403
        
        if len(employees) > max_batch:
            return jsonify({
                'error': {
                    'code': 'batch_size_exceeded',
                    'message': f"Your tier allows a maximum of {max_batch} employees per batch."
                }
            }), 400
        
        result = tax_engine.calculate_batch(employees)
        
        return jsonify({
            'success': True,
            'data': result,
            'meta': {
                'api_version': '1.0.0',
                'client_tier': g.client['tier'],
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': {
                'code': 'batch_error',
                'message': str(e)
            }
        }), 500


@tax_engine_bp.route('/api/v1/tax-engine/rates', methods=['GET'])
@require_api_key
@require_feature('rates')
def get_tax_rates():
    """
    Get tax rates for a jurisdiction.
    
    Query params:
    - state: State code (e.g., CA, NY, TX)
    - effective_date: Date in YYYY-MM-DD format (optional)
    """
    state_code = request.args.get('state', 'CA')
    effective_date = request.args.get('effective_date')
    
    # Check state access by tier
    if g.client['tier'] == 'standard':
        allowed_states = ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA']
        if state_code not in allowed_states:
            return jsonify({
                'error': {
                    'code': 'state_not_available',
                    'message': f"State {state_code} is not available on Standard tier. Upgrade to Professional for all states."
                }
            }), 403
    
    rates = tax_engine.get_tax_rates(state_code, effective_date)
    
    return jsonify({
        'success': True,
        'data': rates,
        'meta': {
            'api_version': '1.0.0',
            'tax_year': 2025,
        }
    })


@tax_engine_bp.route('/api/v1/tax-engine/rates/federal', methods=['GET'])
@require_api_key
@require_feature('rates')
def get_federal_rates():
    """Get all federal tax rates and brackets for 2025."""
    return jsonify({
        'success': True,
        'data': {
            'tax_year': 2025,
            'income_tax_brackets': tax_engine.FEDERAL_TAX_BRACKETS_2025,
            'fica': tax_engine.FICA_2025,
            'standard_deductions': tax_engine.STANDARD_DEDUCTIONS_2025,
            'futa': {
                'rate': tax_engine.FUTA_RATE,
                'wage_base': tax_engine.FUTA_WAGE_BASE,
            },
        },
    })


@tax_engine_bp.route('/api/v1/tax-engine/rates/state/<state_code>', methods=['GET'])
@require_api_key
@require_feature('rates')
def get_state_rates(state_code):
    """Get tax rates for a specific state."""
    state_code = state_code.upper()
    
    income_tax = tax_engine.STATE_TAX_RATES_2025.get(state_code)
    suta = tax_engine.SUTA_RATES_2025.get(state_code)
    
    if not income_tax:
        return jsonify({
            'error': {
                'code': 'state_not_found',
                'message': f"State {state_code} not found."
            }
        }), 404
    
    return jsonify({
        'success': True,
        'data': {
            'state_code': state_code,
            'tax_year': 2025,
            'income_tax': income_tax,
            'unemployment': suta,
        },
    })


@tax_engine_bp.route('/api/v1/tax-engine/jurisdictions', methods=['GET'])
@require_api_key
@require_feature('rates')
def list_jurisdictions():
    """List all available tax jurisdictions."""
    jurisdictions = [
        {'code': 'FED', 'name': 'Federal', 'type': 'federal'},
    ]
    
    for state_code in tax_engine.STATE_TAX_RATES_2025.keys():
        jurisdictions.append({
            'code': state_code,
            'name': state_code,  # Would map to full state name
            'type': 'state',
            'has_income_tax': tax_engine.STATE_TAX_RATES_2025[state_code]['type'] != 'none',
        })
    
    return jsonify({
        'success': True,
        'data': {
            'total_jurisdictions': 7400,  # Including all local
            'federal': 1,
            'states': len(tax_engine.STATE_TAX_RATES_2025),
            'local': 7350,  # Cities, counties, school districts
            'jurisdictions': jurisdictions,
        },
    })


@tax_engine_bp.route('/api/v1/tax-engine/w4/calculate', methods=['POST'])
@require_api_key
@require_feature('calculate')
def calculate_w4():
    """
    Calculate W-4 withholding recommendations.
    
    Request body:
    {
        "annual_income": 75000,
        "filing_status": "single",
        "dependents": 0,
        "other_income": 0,
        "deductions": 0,
        "tax_credits": 0
    }
    """
    try:
        data = request.get_json()
        
        annual_income = float(data.get('annual_income', 0))
        filing_status = data.get('filing_status', 'single')
        dependents = int(data.get('dependents', 0))
        other_income = float(data.get('other_income', 0))
        deductions = float(data.get('deductions', 0))
        tax_credits = float(data.get('tax_credits', 0))
        
        # Get standard deduction
        std_deduction = tax_engine.STANDARD_DEDUCTIONS_2025.get(filing_status, 15000)
        
        # Total deduction
        total_deduction = std_deduction + deductions
        
        # Taxable income
        taxable_income = max(0, annual_income + other_income - total_deduction)
        
        # Calculate annual tax
        brackets = tax_engine.FEDERAL_TAX_BRACKETS_2025.get(filing_status, 
                   tax_engine.FEDERAL_TAX_BRACKETS_2025['single'])
        
        annual_tax = 0
        for bracket in brackets:
            if taxable_income > bracket['min']:
                bracket_income = min(taxable_income, bracket['max']) - bracket['min']
                annual_tax = bracket['base_tax'] + (bracket_income * bracket['rate'])
                if taxable_income <= bracket['max']:
                    break
        
        # Subtract credits
        annual_tax = max(0, annual_tax - tax_credits)
        
        # Child tax credit
        child_credit = dependents * 2000  # $2,000 per child for 2025
        annual_tax = max(0, annual_tax - child_credit)
        
        # Per-paycheck withholding (biweekly)
        biweekly_withholding = annual_tax / 26
        
        return jsonify({
            'success': True,
            'data': {
                'annual_income': annual_income,
                'filing_status': filing_status,
                'standard_deduction': std_deduction,
                'taxable_income': round(taxable_income, 2),
                'estimated_annual_tax': round(annual_tax, 2),
                'recommended_withholding': {
                    'weekly': round(annual_tax / 52, 2),
                    'biweekly': round(biweekly_withholding, 2),
                    'semimonthly': round(annual_tax / 24, 2),
                    'monthly': round(annual_tax / 12, 2),
                },
                'effective_tax_rate': round((annual_tax / annual_income * 100) if annual_income > 0 else 0, 2),
            },
        })
        
    except Exception as e:
        return jsonify({
            'error': {
                'code': 'calculation_error',
                'message': str(e)
            }
        }), 500


@tax_engine_bp.route('/api/v1/tax-engine/usage', methods=['GET'])
@require_api_key
def get_usage():
    """Get current API usage for the authenticated client."""
    today = datetime.utcnow().strftime('%Y-%m-%d')
    usage_key = f"{g.client['client_id']}:{today}"
    current_usage = USAGE_TRACKING.get(usage_key, 0)
    
    return jsonify({
        'success': True,
        'data': {
            'client_id': g.client['client_id'],
            'tier': g.client['tier'],
            'date': today,
            'requests_today': current_usage,
            'daily_limit': g.client['daily_limit'] if g.client['daily_limit'] != -1 else 'unlimited',
            'remaining': g.client['daily_limit'] - current_usage if g.client['daily_limit'] != -1 else 'unlimited',
        },
    })


# =============================================================================
# WEBHOOK ENDPOINTS (Enterprise+ only)
# =============================================================================

@tax_engine_bp.route('/api/v1/tax-engine/webhooks', methods=['GET'])
@require_api_key
@require_feature('webhooks')
def list_webhooks():
    """List registered webhooks."""
    # Would fetch from database
    return jsonify({
        'success': True,
        'data': {
            'webhooks': [],
            'available_events': [
                'tax.rate.updated',
                'tax.jurisdiction.added',
                'tax.law.changed',
            ],
        },
    })


@tax_engine_bp.route('/api/v1/tax-engine/webhooks', methods=['POST'])
@require_api_key
@require_feature('webhooks')
def create_webhook():
    """Register a new webhook."""
    data = request.get_json()
    
    url = data.get('url')
    events = data.get('events', [])
    secret = data.get('secret')
    
    if not url or not events or not secret:
        return jsonify({
            'error': {
                'code': 'invalid_request',
                'message': 'url, events, and secret are required.'
            }
        }), 400
    
    webhook_id = secrets.token_hex(8)
    
    return jsonify({
        'success': True,
        'data': {
            'webhook_id': webhook_id,
            'url': url,
            'events': events,
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
        },
    }), 201
