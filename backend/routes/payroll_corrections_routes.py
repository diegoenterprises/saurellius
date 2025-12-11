"""
Payroll Corrections Routes
Handles overpayments, underpayments, and retroactive adjustments
"""

from flask import Blueprint, request, jsonify
from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid

corrections_bp = Blueprint('corrections', __name__, url_prefix='/api/payroll-corrections')

# In-memory storage
corrections = {}


class CorrectionType:
    OVERPAYMENT = "overpayment"
    UNDERPAYMENT = "underpayment"
    RETROACTIVE_RAISE = "retroactive_raise"
    TAX_CORRECTION = "tax_correction"
    DEDUCTION_CORRECTION = "deduction_correction"
    BONUS_ADJUSTMENT = "bonus_adjustment"


class CorrectionStatus:
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@corrections_bp.route('/', methods=['GET'])
def get_corrections():
    """Get all corrections with optional filters"""
    status = request.args.get('status')
    correction_type = request.args.get('type')
    employee_id = request.args.get('employee_id')
    
    result = list(corrections.values())
    
    if status:
        result = [c for c in result if c['status'] == status]
    if correction_type:
        result = [c for c in result if c['correction_type'] == correction_type]
    if employee_id:
        result = [c for c in result if c['employee_id'] == employee_id]
    
    return jsonify({"corrections": result}), 200


@corrections_bp.route('/<correction_id>', methods=['GET'])
def get_correction(correction_id):
    """Get a specific correction"""
    if correction_id not in corrections:
        return jsonify({"error": "Correction not found"}), 404
    
    return jsonify(corrections[correction_id]), 200


@corrections_bp.route('/overpayment', methods=['POST'])
def create_overpayment():
    """Create an overpayment correction"""
    data = request.get_json()
    
    required = ['employee_id', 'original_payroll_id', 'overpayment_amount', 'reason']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    try:
        correction_id = str(uuid.uuid4())
        amount = Decimal(str(data['overpayment_amount']))
        
        # Calculate recovery options
        recovery_options = []
        
        # Full immediate recovery
        recovery_options.append({
            "type": "full_immediate",
            "description": "Recover full amount from next paycheck",
            "amount_per_pay": float(amount),
            "num_payments": 1
        })
        
        # 2-pay recovery
        recovery_options.append({
            "type": "two_pay",
            "description": "Split recovery over 2 paychecks",
            "amount_per_pay": float(amount / 2),
            "num_payments": 2
        })
        
        # 4-pay recovery
        recovery_options.append({
            "type": "four_pay",
            "description": "Split recovery over 4 paychecks",
            "amount_per_pay": float(amount / 4),
            "num_payments": 4
        })
        
        # Calculate tax adjustments
        federal_tax_over = (amount * Decimal('0.22')).quantize(Decimal('0.01'))
        state_tax_over = (amount * Decimal('0.05')).quantize(Decimal('0.01'))
        fica_over = (amount * Decimal('0.0765')).quantize(Decimal('0.01'))
        net_overpayment = amount - federal_tax_over - state_tax_over - fica_over
        
        correction = {
            "id": correction_id,
            "correction_type": CorrectionType.OVERPAYMENT,
            "employee_id": data['employee_id'],
            "original_payroll_id": data['original_payroll_id'],
            "original_pay_date": data.get('original_pay_date'),
            "reason": data['reason'],
            "reason_details": data.get('reason_details', ''),
            "gross_overpayment": float(amount),
            "tax_adjustments": {
                "federal_over_withheld": float(federal_tax_over),
                "state_over_withheld": float(state_tax_over),
                "fica_over_withheld": float(fica_over)
            },
            "net_overpayment": float(net_overpayment),
            "recovery_options": recovery_options,
            "selected_recovery": data.get('recovery_method', 'full_immediate'),
            "employee_consent": data.get('employee_consent', False),
            "consent_date": data.get('consent_date'),
            "status": CorrectionStatus.DRAFT,
            "created_at": datetime.now().isoformat(),
            "created_by": data.get('created_by', 'system')
        }
        
        corrections[correction_id] = correction
        return jsonify({"correction": correction}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@corrections_bp.route('/underpayment', methods=['POST'])
def create_underpayment():
    """Create an underpayment correction"""
    data = request.get_json()
    
    required = ['employee_id', 'original_payroll_id', 'underpayment_amount', 'reason']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    try:
        correction_id = str(uuid.uuid4())
        amount = Decimal(str(data['underpayment_amount']))
        
        # Calculate additional taxes needed
        federal_tax = (amount * Decimal('0.22')).quantize(Decimal('0.01'))
        state_tax = (amount * Decimal('0.05')).quantize(Decimal('0.01'))
        fica = (amount * Decimal('0.0765')).quantize(Decimal('0.01'))
        net_payment = amount - federal_tax - state_tax - fica
        
        correction = {
            "id": correction_id,
            "correction_type": CorrectionType.UNDERPAYMENT,
            "employee_id": data['employee_id'],
            "original_payroll_id": data['original_payroll_id'],
            "original_pay_date": data.get('original_pay_date'),
            "reason": data['reason'],
            "reason_details": data.get('reason_details', ''),
            "gross_underpayment": float(amount),
            "tax_calculations": {
                "federal_tax": float(federal_tax),
                "state_tax": float(state_tax),
                "fica": float(fica)
            },
            "net_payment_due": float(net_payment),
            "payment_method": data.get('payment_method', 'next_payroll'),
            "separate_check": data.get('separate_check', False),
            "status": CorrectionStatus.DRAFT,
            "created_at": datetime.now().isoformat(),
            "created_by": data.get('created_by', 'system')
        }
        
        corrections[correction_id] = correction
        return jsonify({"correction": correction}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@corrections_bp.route('/retroactive-raise', methods=['POST'])
def create_retroactive_raise():
    """Create a retroactive raise correction"""
    data = request.get_json()
    
    required = ['employee_id', 'effective_date', 'old_rate', 'new_rate']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    try:
        correction_id = str(uuid.uuid4())
        
        effective_date = datetime.strptime(data['effective_date'], '%Y-%m-%d').date()
        old_rate = Decimal(str(data['old_rate']))
        new_rate = Decimal(str(data['new_rate']))
        rate_diff = new_rate - old_rate
        
        # Get affected pay periods (simplified calculation)
        today = date.today()
        weeks_retro = (today - effective_date).days // 7
        
        # Assume biweekly, 80 hours per period
        hours_affected = Decimal(str(data.get('hours_affected', weeks_retro * 40)))
        
        retro_amount = hours_affected * rate_diff
        
        # Tax calculations
        federal_tax = (retro_amount * Decimal('0.22')).quantize(Decimal('0.01'))
        state_tax = (retro_amount * Decimal('0.05')).quantize(Decimal('0.01'))
        fica = (retro_amount * Decimal('0.0765')).quantize(Decimal('0.01'))
        net_retro = retro_amount - federal_tax - state_tax - fica
        
        correction = {
            "id": correction_id,
            "correction_type": CorrectionType.RETROACTIVE_RAISE,
            "employee_id": data['employee_id'],
            "effective_date": effective_date.isoformat(),
            "old_rate": float(old_rate),
            "new_rate": float(new_rate),
            "rate_difference": float(rate_diff),
            "hours_affected": float(hours_affected),
            "gross_retro_pay": float(retro_amount),
            "tax_calculations": {
                "federal_tax": float(federal_tax),
                "state_tax": float(state_tax),
                "fica": float(fica)
            },
            "net_retro_pay": float(net_retro),
            "affected_pay_periods": [],  # Would list specific periods
            "status": CorrectionStatus.DRAFT,
            "created_at": datetime.now().isoformat(),
            "created_by": data.get('created_by', 'system')
        }
        
        corrections[correction_id] = correction
        return jsonify({"correction": correction}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@corrections_bp.route('/tax-correction', methods=['POST'])
def create_tax_correction():
    """Create a tax withholding correction (W-2c scenario)"""
    data = request.get_json()
    
    required = ['employee_id', 'tax_year', 'correction_reason']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    try:
        correction_id = str(uuid.uuid4())
        
        correction = {
            "id": correction_id,
            "correction_type": CorrectionType.TAX_CORRECTION,
            "employee_id": data['employee_id'],
            "tax_year": data['tax_year'],
            "correction_reason": data['correction_reason'],
            "original_values": {
                "box_1": data.get('original_box_1', 0),
                "box_2": data.get('original_box_2', 0),
                "box_3": data.get('original_box_3', 0),
                "box_4": data.get('original_box_4', 0),
                "box_5": data.get('original_box_5', 0),
                "box_6": data.get('original_box_6', 0)
            },
            "corrected_values": {
                "box_1": data.get('corrected_box_1', 0),
                "box_2": data.get('corrected_box_2', 0),
                "box_3": data.get('corrected_box_3', 0),
                "box_4": data.get('corrected_box_4', 0),
                "box_5": data.get('corrected_box_5', 0),
                "box_6": data.get('corrected_box_6', 0)
            },
            "w2c_required": True,
            "status": CorrectionStatus.DRAFT,
            "created_at": datetime.now().isoformat(),
            "created_by": data.get('created_by', 'system')
        }
        
        corrections[correction_id] = correction
        return jsonify({"correction": correction}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@corrections_bp.route('/<correction_id>/submit', methods=['POST'])
def submit_correction(correction_id):
    """Submit correction for approval"""
    if correction_id not in corrections:
        return jsonify({"error": "Correction not found"}), 404
    
    corrections[correction_id]['status'] = CorrectionStatus.PENDING_APPROVAL
    corrections[correction_id]['submitted_at'] = datetime.now().isoformat()
    
    return jsonify(corrections[correction_id]), 200


@corrections_bp.route('/<correction_id>/approve', methods=['POST'])
def approve_correction(correction_id):
    """Approve a correction"""
    if correction_id not in corrections:
        return jsonify({"error": "Correction not found"}), 404
    
    data = request.get_json() or {}
    
    corrections[correction_id]['status'] = CorrectionStatus.APPROVED
    corrections[correction_id]['approved_at'] = datetime.now().isoformat()
    corrections[correction_id]['approved_by'] = data.get('approved_by', 'admin')
    
    return jsonify(corrections[correction_id]), 200


@corrections_bp.route('/<correction_id>/process', methods=['POST'])
def process_correction(correction_id):
    """Process an approved correction"""
    if correction_id not in corrections:
        return jsonify({"error": "Correction not found"}), 404
    
    if corrections[correction_id]['status'] != CorrectionStatus.APPROVED:
        return jsonify({"error": "Correction must be approved first"}), 400
    
    corrections[correction_id]['status'] = CorrectionStatus.COMPLETED
    corrections[correction_id]['processed_at'] = datetime.now().isoformat()
    
    return jsonify(corrections[correction_id]), 200


@corrections_bp.route('/<correction_id>/cancel', methods=['POST'])
def cancel_correction(correction_id):
    """Cancel a correction"""
    if correction_id not in corrections:
        return jsonify({"error": "Correction not found"}), 404
    
    data = request.get_json() or {}
    
    corrections[correction_id]['status'] = CorrectionStatus.CANCELLED
    corrections[correction_id]['cancelled_at'] = datetime.now().isoformat()
    corrections[correction_id]['cancellation_reason'] = data.get('reason', '')
    
    return jsonify(corrections[correction_id]), 200
