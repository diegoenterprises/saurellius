"""
 PAYSTUB ROUTES
Paystub generation, listing, and management endpoints
"""

import uuid
import hashlib
from datetime import datetime, date
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Employee, Company, Paystub, db
from billing import BillingManager

paystubs_bp = Blueprint('paystubs', __name__)


@paystubs_bp.route('/api/paystubs', methods=['GET'])
@jwt_required()
def list_paystubs():
    """Get all paystubs for the current user."""
    user_id = get_jwt_identity()
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Filters
    employee_id = request.args.get('employee_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Paystub.query.filter_by(user_id=user_id)
    
    if employee_id:
        query = query.filter_by(employee_id=employee_id)
    
    if start_date:
        query = query.filter(Paystub.pay_date >= start_date)
    
    if end_date:
        query = query.filter(Paystub.pay_date <= end_date)
    
    paystubs = query.order_by(Paystub.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'paystubs': [p.to_dict() for p in paystubs.items],
        'pagination': {
            'page': paystubs.page,
            'pages': paystubs.pages,
            'total': paystubs.total,
            'per_page': per_page
        }
    }), 200


@paystubs_bp.route('/api/paystubs/<int:paystub_id>', methods=['GET'])
@jwt_required()
def get_paystub(paystub_id):
    """Get a specific paystub."""
    user_id = get_jwt_identity()
    
    paystub = Paystub.query.filter_by(id=paystub_id, user_id=user_id).first()
    
    if not paystub:
        return jsonify({'success': False, 'message': 'Paystub not found'}), 404
    
    # Get related data
    employee = Employee.query.get(paystub.employee_id) if paystub.employee_id else None
    company = Company.query.get(paystub.company_id) if paystub.company_id else None
    
    return jsonify({
        'success': True,
        'paystub': paystub.to_dict(),
        'employee': employee.to_dict() if employee else None,
        'company': company.to_dict() if company else None
    }), 200


@paystubs_bp.route('/api/paystubs', methods=['POST'])
@jwt_required()
def create_paystub():
    """Generate a new paystub."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    # Check billing/usage limits
    billing = BillingManager(user)
    can_generate, message, overage = billing.check_can_generate_paystub()
    
    if not can_generate:
        return jsonify({
            'success': False,
            'message': message,
            'upgrade_required': True
        }), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['pay_period_start', 'pay_period_end', 'pay_date']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    # Parse dates
    try:
        pay_period_start = datetime.strptime(data['pay_period_start'], '%Y-%m-%d').date()
        pay_period_end = datetime.strptime(data['pay_period_end'], '%Y-%m-%d').date()
        pay_date = datetime.strptime(data['pay_date'], '%Y-%m-%d').date()
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': f'Invalid date format: {e}'
        }), 400
    
    # Calculate pay
    regular_hours = data.get('regular_hours', 0)
    overtime_hours = data.get('overtime_hours', 0)
    hourly_rate = data.get('hourly_rate', 0)
    overtime_rate = hourly_rate * 1.5
    
    regular_pay = regular_hours * hourly_rate
    overtime_pay = overtime_hours * overtime_rate
    gross_pay = regular_pay + overtime_pay
    
    # Process deductions
    deductions = data.get('deductions', {})
    total_deductions = sum(deductions.values()) if deductions else 0
    
    net_pay = gross_pay - total_deductions
    
    # Generate verification ID and hash
    verification_id = f"SAU-{uuid.uuid4().hex[:8].upper()}-{datetime.now().strftime('%Y%m%d')}"
    document_hash = hashlib.sha256(
        f"{user_id}{verification_id}{net_pay}{datetime.now().isoformat()}".encode()
    ).hexdigest()[:32]
    
    # Create paystub
    paystub = Paystub(
        user_id=user_id,
        employee_id=data.get('employee_id'),
        company_id=data.get('company_id'),
        pay_period_start=pay_period_start,
        pay_period_end=pay_period_end,
        pay_date=pay_date,
        regular_hours=regular_hours,
        overtime_hours=overtime_hours,
        regular_pay=regular_pay,
        overtime_pay=overtime_pay,
        gross_pay=gross_pay,
        deductions=deductions,
        total_deductions=total_deductions,
        net_pay=net_pay,
        ytd_gross=data.get('ytd_gross', gross_pay),
        ytd_net=data.get('ytd_net', net_pay),
        ytd_deductions=data.get('ytd_deductions', total_deductions),
        verification_id=verification_id,
        document_hash=document_hash,
        theme=data.get('theme', 'diego_original'),
        status='generated'
    )
    
    db.session.add(paystub)
    
    # Update usage
    billing.increment_usage()
    
    # Award reward points (10 points per paystub)
    user.reward_points = (user.reward_points or 0) + 10
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Paystub generated successfully',
        'paystub': paystub.to_dict(),
        'overage_charged': overage,
        'reward_points_earned': 10
    }), 201


@paystubs_bp.route('/api/paystubs/<int:paystub_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_paystub(paystub_id):
    """Duplicate an existing paystub with new dates."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Check billing limits
    billing = BillingManager(user)
    can_generate, message, overage = billing.check_can_generate_paystub()
    
    if not can_generate:
        return jsonify({
            'success': False,
            'message': message,
            'upgrade_required': True
        }), 403
    
    # Get original paystub
    original = Paystub.query.filter_by(id=paystub_id, user_id=user_id).first()
    
    if not original:
        return jsonify({'success': False, 'message': 'Paystub not found'}), 404
    
    data = request.get_json()
    
    # Generate new verification
    verification_id = f"SAU-{uuid.uuid4().hex[:8].upper()}-{datetime.now().strftime('%Y%m%d')}"
    document_hash = hashlib.sha256(
        f"{user_id}{verification_id}{original.net_pay}{datetime.now().isoformat()}".encode()
    ).hexdigest()[:32]
    
    # Create duplicate
    duplicate = Paystub(
        user_id=user_id,
        employee_id=original.employee_id,
        company_id=original.company_id,
        pay_period_start=datetime.strptime(data.get('pay_period_start', original.pay_period_start.isoformat()), '%Y-%m-%d').date() if data.get('pay_period_start') else original.pay_period_start,
        pay_period_end=datetime.strptime(data.get('pay_period_end', original.pay_period_end.isoformat()), '%Y-%m-%d').date() if data.get('pay_period_end') else original.pay_period_end,
        pay_date=datetime.strptime(data.get('pay_date', original.pay_date.isoformat()), '%Y-%m-%d').date() if data.get('pay_date') else original.pay_date,
        regular_hours=original.regular_hours,
        overtime_hours=original.overtime_hours,
        regular_pay=original.regular_pay,
        overtime_pay=original.overtime_pay,
        gross_pay=original.gross_pay,
        deductions=original.deductions,
        total_deductions=original.total_deductions,
        net_pay=original.net_pay,
        verification_id=verification_id,
        document_hash=document_hash,
        theme=data.get('theme', original.theme),
        status='generated'
    )
    
    db.session.add(duplicate)
    billing.increment_usage()
    user.reward_points = (user.reward_points or 0) + 10
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Paystub duplicated successfully',
        'paystub': duplicate.to_dict()
    }), 201


@paystubs_bp.route('/api/paystubs/<int:paystub_id>', methods=['DELETE'])
@jwt_required()
def delete_paystub(paystub_id):
    """Delete a paystub."""
    user_id = get_jwt_identity()
    
    paystub = Paystub.query.filter_by(id=paystub_id, user_id=user_id).first()
    
    if not paystub:
        return jsonify({'success': False, 'message': 'Paystub not found'}), 404
    
    db.session.delete(paystub)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Paystub deleted'
    }), 200


@paystubs_bp.route('/api/paystubs/verify/<verification_id>', methods=['GET'])
def verify_paystub(verification_id):
    """Public endpoint to verify paystub authenticity."""
    paystub = Paystub.query.filter_by(verification_id=verification_id).first()
    
    if not paystub:
        return jsonify({
            'success': False,
            'verified': False,
            'message': 'Paystub not found or invalid verification ID'
        }), 404
    
    return jsonify({
        'success': True,
        'verified': True,
        'paystub': {
            'verification_id': paystub.verification_id,
            'pay_date': paystub.pay_date.isoformat() if paystub.pay_date else None,
            'net_pay': paystub.net_pay,
            'created_at': paystub.created_at.isoformat() if paystub.created_at else None
        }
    }), 200
