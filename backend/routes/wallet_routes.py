"""
SAURELLIUS DIGITAL WALLET ROUTES
Employer and Employee wallet system for instant payroll
"""

import stripe
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid

wallet_bp = Blueprint('wallet', __name__)

# Storage (use database in production)
WALLETS = {}
TRANSACTIONS = {}

WALLET_TYPE_EMPLOYER = 'employer'
WALLET_TYPE_EMPLOYEE = 'employee'

FEES = {
    'instant_transfer': 1.50,
    'ewa_fee_percent': 0.01,
    'card_funding_percent': 0.029,
}


def get_wallet(user_id, wallet_type):
    """Get or create wallet."""
    key = f"{user_id}:{wallet_type}"
    if key not in WALLETS:
        WALLETS[key] = {
            'wallet_id': str(uuid.uuid4()),
            'user_id': user_id,
            'type': wallet_type,
            'balance': Decimal('0.00'),
            'available': Decimal('0.00'),
            'pending': Decimal('0.00'),
            'payroll_reserve': Decimal('0.00'),
            'ewa_limit': Decimal('0.00'),
            'ewa_used': Decimal('0.00'),
            'ytd_wages': Decimal('0.00'),
            'bank_accounts': [],
            'created_at': datetime.utcnow().isoformat(),
        }
        TRANSACTIONS[key] = []
    return WALLETS[key]


def record_txn(key, txn_type, amount, desc, meta=None):
    """Record transaction."""
    txn = {
        'id': str(uuid.uuid4()),
        'type': txn_type,
        'amount': float(amount),
        'description': desc,
        'created_at': datetime.utcnow().isoformat(),
        'metadata': meta or {}
    }
    if key not in TRANSACTIONS:
        TRANSACTIONS[key] = []
    TRANSACTIONS[key].insert(0, txn)
    return txn


# === EMPLOYER WALLET ===

@wallet_bp.route('/api/wallet/employer', methods=['GET'])
@jwt_required()
def get_employer_wallet():
    user_id = get_jwt_identity()
    w = get_wallet(user_id, WALLET_TYPE_EMPLOYER)
    return jsonify({'success': True, 'data': {
        'wallet_id': w['wallet_id'],
        'balance': float(w['balance']),
        'available': float(w['available']),
        'payroll_reserve': float(w['payroll_reserve']),
    }})


@wallet_bp.route('/api/wallet/employer/fund', methods=['POST'])
@jwt_required()
def fund_employer_wallet():
    user_id = get_jwt_identity()
    data = request.get_json()
    amount = Decimal(str(data.get('amount', 0)))
    source = data.get('source', 'bank')
    
    fee = amount * Decimal('0.029') if source == 'card' else Decimal('0')
    net = amount - fee
    
    w = get_wallet(user_id, WALLET_TYPE_EMPLOYER)
    w['balance'] += net
    w['available'] += net
    
    key = f"{user_id}:{WALLET_TYPE_EMPLOYER}"
    txn = record_txn(key, 'deposit', net, f'Wallet funding ({source})', {'fee': float(fee)})
    
    return jsonify({'success': True, 'data': {
        'transaction_id': txn['id'],
        'funded': float(amount),
        'fee': float(fee),
        'net': float(net),
        'new_balance': float(w['balance']),
    }})


@wallet_bp.route('/api/wallet/employer/reserve', methods=['POST'])
@jwt_required()
def set_payroll_reserve():
    user_id = get_jwt_identity()
    data = request.get_json()
    amount = Decimal(str(data.get('amount', 0)))
    
    w = get_wallet(user_id, WALLET_TYPE_EMPLOYER)
    if amount > w['available']:
        return jsonify({'success': False, 'message': 'Insufficient funds'}), 400
    
    w['available'] -= amount
    w['payroll_reserve'] += amount
    
    key = f"{user_id}:{WALLET_TYPE_EMPLOYER}"
    record_txn(key, 'reserve', amount, 'Payroll reserve')
    
    return jsonify({'success': True, 'data': {
        'reserved': float(amount),
        'available': float(w['available']),
        'reserve': float(w['payroll_reserve']),
    }})


@wallet_bp.route('/api/wallet/employer/pay', methods=['POST'])
@jwt_required()
def pay_employee():
    user_id = get_jwt_identity()
    data = request.get_json()
    emp_id = data.get('employee_id')
    amount = Decimal(str(data.get('amount', 0)))
    
    emp_w = get_wallet(user_id, WALLET_TYPE_EMPLOYER)
    if amount > emp_w['payroll_reserve']:
        return jsonify({'success': False, 'message': 'Insufficient reserve'}), 400
    
    emp_w['payroll_reserve'] -= amount
    emp_w['balance'] -= amount
    
    ee_w = get_wallet(emp_id, WALLET_TYPE_EMPLOYEE)
    ee_w['balance'] += amount
    ee_w['available'] += amount
    ee_w['ytd_wages'] += amount
    ee_w['ewa_limit'] = ee_w['ytd_wages'] * Decimal('0.5')
    
    record_txn(f"{user_id}:{WALLET_TYPE_EMPLOYER}", 'payout', -amount, f'Paid {emp_id}')
    record_txn(f"{emp_id}:{WALLET_TYPE_EMPLOYEE}", 'wage', amount, 'Wage received')
    
    return jsonify({'success': True, 'data': {
        'employee_id': emp_id,
        'amount': float(amount),
        'employee_balance': float(ee_w['balance']),
    }})


@wallet_bp.route('/api/wallet/employer/batch-pay', methods=['POST'])
@jwt_required()
def batch_pay():
    user_id = get_jwt_identity()
    data = request.get_json()
    payments = data.get('payments', [])
    
    total = sum(Decimal(str(p.get('amount', 0))) for p in payments)
    emp_w = get_wallet(user_id, WALLET_TYPE_EMPLOYER)
    
    if total > emp_w['payroll_reserve']:
        return jsonify({'success': False, 'message': 'Insufficient reserve'}), 400
    
    results = []
    for p in payments:
        amt = Decimal(str(p.get('amount', 0)))
        eid = p.get('employee_id')
        
        emp_w['payroll_reserve'] -= amt
        emp_w['balance'] -= amt
        
        ee_w = get_wallet(eid, WALLET_TYPE_EMPLOYEE)
        ee_w['balance'] += amt
        ee_w['available'] += amt
        ee_w['ytd_wages'] += amt
        ee_w['ewa_limit'] = ee_w['ytd_wages'] * Decimal('0.5')
        
        record_txn(f"{eid}:{WALLET_TYPE_EMPLOYEE}", 'wage', amt, 'Payroll')
        results.append({'employee_id': eid, 'amount': float(amt)})
    
    record_txn(f"{user_id}:{WALLET_TYPE_EMPLOYER}", 'batch_payout', -total, f'Batch: {len(payments)} employees')
    
    return jsonify({'success': True, 'data': {
        'total_paid': float(total),
        'count': len(results),
        'payments': results,
    }})


# === EMPLOYEE WALLET ===

@wallet_bp.route('/api/wallet/employee', methods=['GET'])
@jwt_required()
def get_employee_wallet():
    user_id = get_jwt_identity()
    w = get_wallet(user_id, WALLET_TYPE_EMPLOYEE)
    return jsonify({'success': True, 'data': {
        'wallet_id': w['wallet_id'],
        'balance': float(w['balance']),
        'available': float(w['available']),
        'ewa_available': float(w['ewa_limit'] - w['ewa_used']),
        'ewa_limit': float(w['ewa_limit']),
        'ytd_wages': float(w['ytd_wages']),
    }})


@wallet_bp.route('/api/wallet/employee/ewa', methods=['POST'])
@jwt_required()
def request_ewa():
    """Earned Wage Access - get paid early."""
    user_id = get_jwt_identity()
    data = request.get_json()
    amount = Decimal(str(data.get('amount', 0)))
    
    w = get_wallet(user_id, WALLET_TYPE_EMPLOYEE)
    available = w['ewa_limit'] - w['ewa_used']
    
    if amount > available:
        return jsonify({'success': False, 'message': 'Exceeds EWA limit', 'available': float(available)}), 400
    
    fee = (amount * Decimal('0.01')).quantize(Decimal('0.01'))
    net = amount - fee
    
    w['balance'] += net
    w['available'] += net
    w['ewa_used'] += amount
    
    key = f"{user_id}:{WALLET_TYPE_EMPLOYEE}"
    txn = record_txn(key, 'ewa', net, 'Earned Wage Access', {'fee': float(fee)})
    
    return jsonify({'success': True, 'data': {
        'transaction_id': txn['id'],
        'requested': float(amount),
        'fee': float(fee),
        'received': float(net),
        'new_balance': float(w['balance']),
        'ewa_remaining': float(w['ewa_limit'] - w['ewa_used']),
    }})


@wallet_bp.route('/api/wallet/employee/transfer', methods=['POST'])
@jwt_required()
def transfer_to_bank():
    user_id = get_jwt_identity()
    data = request.get_json()
    amount = Decimal(str(data.get('amount', 0)))
    speed = data.get('speed', 'standard')
    
    w = get_wallet(user_id, WALLET_TYPE_EMPLOYEE)
    if amount > w['available']:
        return jsonify({'success': False, 'message': 'Insufficient funds'}), 400
    
    fee = Decimal('1.50') if speed == 'instant' else Decimal('0')
    net = amount - fee
    
    w['balance'] -= amount
    w['available'] -= amount
    
    key = f"{user_id}:{WALLET_TYPE_EMPLOYEE}"
    txn = record_txn(key, 'transfer', -amount, f'{speed.title()} bank transfer', {'fee': float(fee)})
    
    return jsonify({'success': True, 'data': {
        'transaction_id': txn['id'],
        'amount': float(amount),
        'fee': float(fee),
        'net': float(net),
        'speed': speed,
        'eta': 'Minutes' if speed == 'instant' else '1-3 days',
        'new_balance': float(w['balance']),
    }})


# === SHARED ===

@wallet_bp.route('/api/wallet/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    wtype = request.args.get('type', WALLET_TYPE_EMPLOYEE)
    limit = int(request.args.get('limit', 50))
    
    key = f"{user_id}:{wtype}"
    txns = TRANSACTIONS.get(key, [])[:limit]
    
    return jsonify({'success': True, 'data': {'transactions': txns, 'total': len(TRANSACTIONS.get(key, []))}})


@wallet_bp.route('/api/wallet/link-bank', methods=['POST'])
@jwt_required()
def link_bank():
    user_id = get_jwt_identity()
    data = request.get_json()
    wtype = data.get('wallet_type', WALLET_TYPE_EMPLOYEE)
    
    w = get_wallet(user_id, wtype)
    acct = {
        'id': f"ba_{uuid.uuid4().hex[:12]}",
        'last4': data.get('account_number', '')[-4:],
        'type': data.get('account_type', 'checking'),
        'status': 'verified',
    }
    w['bank_accounts'].append(acct)
    
    return jsonify({'success': True, 'data': acct})


@wallet_bp.route('/api/wallet/summary', methods=['GET'])
@jwt_required()
def wallet_summary():
    user_id = get_jwt_identity()
    emp_w = get_wallet(user_id, WALLET_TYPE_EMPLOYER)
    ee_w = get_wallet(user_id, WALLET_TYPE_EMPLOYEE)
    
    return jsonify({'success': True, 'data': {
        'employer': {'balance': float(emp_w['balance']), 'reserve': float(emp_w['payroll_reserve'])},
        'employee': {'balance': float(ee_w['balance']), 'ewa_available': float(ee_w['ewa_limit'] - ee_w['ewa_used'])},
    }})
