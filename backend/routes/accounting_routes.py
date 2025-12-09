"""
ACCOUNTING ROUTES
General Ledger, Chart of Accounts, Journal Entries API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date

accounting_bp = Blueprint('accounting', __name__, url_prefix='/api/accounting')


@accounting_bp.route('/accounts', methods=['GET'])
@jwt_required()
def get_chart_of_accounts():
    """Get chart of accounts"""
    from services.accounting_service import accounting_service
    
    account_type = request.args.get('type')
    accounts = accounting_service.get_chart_of_accounts()
    
    if account_type:
        accounts = [a for a in accounts if a['type'] == account_type]
    
    return jsonify({'success': True, 'accounts': accounts})


@accounting_bp.route('/accounts', methods=['POST'])
@jwt_required()
def create_account():
    """Create a new account"""
    from services.accounting_service import accounting_service, AccountType, AccountCategory
    
    data = request.get_json()
    
    try:
        account = accounting_service.create_account(
            code=data['code'],
            name=data['name'],
            account_type=AccountType(data['type']),
            category=AccountCategory(data['category']),
            parent_code=data.get('parent_code')
        )
        return jsonify({'success': True, 'account': account}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@accounting_bp.route('/accounts/<code>', methods=['GET'])
@jwt_required()
def get_account(code):
    """Get account by code"""
    from services.accounting_service import accounting_service
    
    account = accounting_service.get_account(code)
    if not account:
        return jsonify({'success': False, 'message': 'Account not found'}), 404
    
    return jsonify({'success': True, 'account': account})


@accounting_bp.route('/accounts/<code>/ledger', methods=['GET'])
@jwt_required()
def get_account_ledger(code):
    """Get ledger for an account"""
    from services.accounting_service import accounting_service
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        ledger = accounting_service.get_account_ledger(
            code,
            start_date=date.fromisoformat(start_date) if start_date else None,
            end_date=date.fromisoformat(end_date) if end_date else None
        )
        return jsonify({'success': True, 'ledger': ledger})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 404


@accounting_bp.route('/journal-entries', methods=['GET'])
@jwt_required()
def get_journal_entries():
    """Get journal entries"""
    from services.accounting_service import accounting_service
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    source = request.args.get('source')
    
    entries = accounting_service.get_journal_entries(
        start_date=date.fromisoformat(start_date) if start_date else None,
        end_date=date.fromisoformat(end_date) if end_date else None,
        source=source
    )
    
    return jsonify({'success': True, 'entries': entries})


@accounting_bp.route('/journal-entries', methods=['POST'])
@jwt_required()
def create_journal_entry():
    """Create a journal entry"""
    from services.accounting_service import accounting_service
    
    data = request.get_json()
    
    try:
        entry = accounting_service.create_journal_entry(
            entry_date=date.fromisoformat(data['date']),
            description=data['description'],
            lines=data['lines'],
            reference=data.get('reference'),
            source=data.get('source', 'manual')
        )
        return jsonify({'success': True, 'entry': entry}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@accounting_bp.route('/journal-entries/<entry_id>/reverse', methods=['POST'])
@jwt_required()
def reverse_journal_entry(entry_id):
    """Reverse a journal entry"""
    from services.accounting_service import accounting_service
    
    data = request.get_json() or {}
    reversal_date = data.get('reversal_date')
    
    try:
        entry = accounting_service.reverse_journal_entry(
            entry_id,
            reversal_date=date.fromisoformat(reversal_date) if reversal_date else None
        )
        return jsonify({'success': True, 'entry': entry})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@accounting_bp.route('/reports/trial-balance', methods=['GET'])
@jwt_required()
def get_trial_balance():
    """Get trial balance report"""
    from services.accounting_service import accounting_service
    
    as_of = request.args.get('as_of_date')
    
    report = accounting_service.get_trial_balance(
        as_of_date=date.fromisoformat(as_of) if as_of else None
    )
    
    return jsonify({'success': True, 'report': report})


@accounting_bp.route('/reports/income-statement', methods=['GET'])
@jwt_required()
def get_income_statement():
    """Get income statement (P&L)"""
    from services.accounting_service import accounting_service
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({'success': False, 'message': 'start_date and end_date required'}), 400
    
    report = accounting_service.get_income_statement(
        start_date=date.fromisoformat(start_date),
        end_date=date.fromisoformat(end_date)
    )
    
    return jsonify({'success': True, 'report': report})


@accounting_bp.route('/reports/balance-sheet', methods=['GET'])
@jwt_required()
def get_balance_sheet():
    """Get balance sheet"""
    from services.accounting_service import accounting_service
    
    as_of = request.args.get('as_of_date')
    
    report = accounting_service.get_balance_sheet(
        as_of_date=date.fromisoformat(as_of) if as_of else None
    )
    
    return jsonify({'success': True, 'report': report})


@accounting_bp.route('/payroll-entry', methods=['POST'])
@jwt_required()
def create_payroll_entry():
    """Create journal entry from payroll data"""
    from services.accounting_service import accounting_service
    
    data = request.get_json()
    
    try:
        entry = accounting_service.create_payroll_journal_entry(data)
        return jsonify({'success': True, 'entry': entry}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
