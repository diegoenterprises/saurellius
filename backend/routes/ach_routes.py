"""
ACH/Direct Deposit Management Routes
Handles bank accounts, ACH batches, and NACHA file generation
"""

from flask import Blueprint, request, jsonify
from datetime import date, datetime
from decimal import Decimal

ach_bp = Blueprint('ach', __name__, url_prefix='/api/ach')

# Import service
try:
    from services.ach_service import ach_service
except ImportError:
    ach_service = None


@ach_bp.route('/bank-accounts', methods=['GET'])
def get_bank_accounts():
    """Get all bank accounts for an owner"""
    owner_id = request.args.get('owner_id')
    owner_type = request.args.get('owner_type', 'employee')
    
    if not owner_id:
        return jsonify({"error": "owner_id required"}), 400
    
    try:
        accounts = ach_service.get_bank_accounts(owner_id, owner_type)
        return jsonify({"accounts": accounts}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/bank-accounts', methods=['POST'])
def add_bank_account():
    """Add a new bank account"""
    data = request.get_json()
    
    required = ['owner_id', 'routing_number', 'account_number', 'account_type']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required fields: {required}"}), 400
    
    try:
        account = ach_service.add_bank_account(
            data['owner_id'],
            data.get('owner_type', 'employee'),
            {
                'routing_number': data['routing_number'],
                'account_number': data['account_number'],
                'account_type': data['account_type'],
                'account_holder_name': data.get('account_holder_name', ''),
                'bank_name': data.get('bank_name', ''),
                'is_primary': data.get('is_primary', True),
                'split_type': data.get('split_type'),
                'split_amount': data.get('split_amount')
            }
        )
        return jsonify({"account": account, "message": "Bank account added"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/bank-accounts/<account_id>', methods=['PUT'])
def update_bank_account(account_id):
    """Update bank account details"""
    data = request.get_json()
    
    try:
        account = ach_service.update_bank_account(account_id, data)
        return jsonify({"account": account}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/bank-accounts/<account_id>', methods=['DELETE'])
def delete_bank_account(account_id):
    """Delete/deactivate a bank account"""
    try:
        ach_service.deactivate_bank_account(account_id)
        return jsonify({"message": "Bank account deactivated"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/bank-accounts/<account_id>/verify', methods=['POST'])
def verify_bank_account(account_id):
    """Initiate bank account verification (micro-deposits or prenote)"""
    data = request.get_json() or {}
    method = data.get('method', 'micro_deposits')
    
    try:
        result = ach_service.verify_bank_account(account_id, method)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/bank-accounts/<account_id>/confirm', methods=['POST'])
def confirm_micro_deposits(account_id):
    """Confirm micro-deposit amounts"""
    data = request.get_json()
    
    if 'amount1' not in data or 'amount2' not in data:
        return jsonify({"error": "amount1 and amount2 required"}), 400
    
    try:
        result = ach_service.confirm_micro_deposits(
            account_id, 
            float(data['amount1']), 
            float(data['amount2'])
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/split-deposits/<owner_id>', methods=['GET'])
def get_split_deposits(owner_id):
    """Get split deposit configuration for an employee"""
    try:
        splits = ach_service.get_split_deposit_config(owner_id)
        return jsonify({"splits": splits}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/split-deposits/<owner_id>', methods=['POST'])
def configure_split_deposits(owner_id):
    """Configure split deposits across multiple accounts"""
    data = request.get_json()
    
    if 'accounts' not in data:
        return jsonify({"error": "accounts array required"}), 400
    
    try:
        result = ach_service.configure_split_deposits(owner_id, data['accounts'])
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/batches', methods=['GET'])
def get_ach_batches():
    """Get ACH batches with optional filters"""
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        batches = ach_service.get_ach_batches(status, start_date, end_date)
        return jsonify({"batches": batches}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/batches/<batch_id>', methods=['GET'])
def get_ach_batch(batch_id):
    """Get details of a specific ACH batch"""
    try:
        batch = ach_service.get_ach_batch(batch_id)
        if not batch:
            return jsonify({"error": "Batch not found"}), 404
        return jsonify(batch), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/batches', methods=['POST'])
def create_ach_batch():
    """Create a new ACH batch for payroll"""
    data = request.get_json()
    
    required = ['batch_type', 'effective_date', 'transactions']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    try:
        effective_date = datetime.strptime(data['effective_date'], '%Y-%m-%d').date()
        result = ach_service.create_ach_batch(
            data['batch_type'],
            effective_date,
            data['transactions'],
            data.get('description', 'PAYROLL')
        )
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/batches/<batch_id>/submit', methods=['POST'])
def submit_ach_batch(batch_id):
    """Submit ACH batch for processing"""
    try:
        result = ach_service.submit_batch(batch_id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/nacha/generate', methods=['POST'])
def generate_nacha_file():
    """Generate NACHA file for ACH batches"""
    data = request.get_json()
    
    if 'batch_ids' not in data:
        return jsonify({"error": "batch_ids array required"}), 400
    
    try:
        nacha_content = ach_service.generate_nacha_file(data['batch_ids'])
        return jsonify({
            "content": nacha_content,
            "filename": f"NACHA_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/nacha/download/<batch_id>', methods=['GET'])
def download_nacha_file(batch_id):
    """Download NACHA file for a batch"""
    try:
        nacha_content = ach_service.generate_nacha_file([batch_id])
        
        from flask import Response
        return Response(
            nacha_content,
            mimetype='text/plain',
            headers={'Content-Disposition': f'attachment;filename=NACHA_{batch_id}.txt'}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/returns', methods=['POST'])
def process_ach_return():
    """Process an ACH return/rejection"""
    data = request.get_json()
    
    required = ['transaction_id', 'return_code', 'return_reason']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    try:
        result = ach_service.process_ach_return(
            data['transaction_id'],
            data['return_code'],
            data['return_reason']
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/prenotes/pending', methods=['GET'])
def get_pending_prenotes():
    """Get all pending prenote verifications"""
    try:
        prenotes = ach_service.get_pending_prenotes()
        return jsonify({"prenotes": prenotes}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ach_bp.route('/validate-routing', methods=['POST'])
def validate_routing_number():
    """Validate a routing number"""
    data = request.get_json()
    
    if 'routing_number' not in data:
        return jsonify({"error": "routing_number required"}), 400
    
    try:
        is_valid = ach_service._validate_routing_number(data['routing_number'])
        bank_info = ach_service.get_bank_info(data['routing_number']) if is_valid else None
        return jsonify({
            "valid": is_valid,
            "bank_info": bank_info
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
