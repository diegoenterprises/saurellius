"""
 PAYSTUB ROUTES
Paystub generation, listing, and management endpoints
Now integrated with advanced PaystubGenerator for PDF creation
"""

import uuid
import hashlib
import tempfile
import os
import base64
from datetime import datetime, date
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Employee, Company, Paystub, db
from billing import BillingManager
from services.paystub_generator import paystub_generator, COLOR_THEMES, number_to_words

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


@paystubs_bp.route('/api/paystubs/generate', methods=['POST'])
@jwt_required()
def generate_paystub_with_pdf():
    """
    Generate a paystub with PDF using the advanced PaystubGenerator.
    Creates the paystub record AND generates a bank-grade PDF with security features.
    """
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
    
    # Extract data from frontend format
    company_data = data.get('company', {})
    employee_data = data.get('employee', {})
    pay_period = data.get('pay_period', {})
    earnings_input = data.get('earnings', {})
    taxes_input = data.get('taxes', {})
    theme = data.get('theme', 'diego_original')
    check_number = data.get('check_number', str(uuid.uuid4().hex[:6].upper()))
    
    # Parse dates
    try:
        pay_period_start = datetime.strptime(pay_period.get('start', ''), '%Y-%m-%d').date()
        pay_period_end = datetime.strptime(pay_period.get('end', ''), '%Y-%m-%d').date()
        pay_date = datetime.strptime(pay_period.get('pay_date', ''), '%Y-%m-%d').date()
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': f'Invalid date format. Use YYYY-MM-DD. Error: {e}'
        }), 400
    
    # Calculate pay
    regular_hours = float(earnings_input.get('regular_hours', 0))
    regular_rate = float(earnings_input.get('regular_rate', 0))
    overtime_hours = float(earnings_input.get('overtime_hours', 0))
    overtime_rate = regular_rate * 1.5
    bonuses = float(earnings_input.get('bonuses', 0))
    commissions = float(earnings_input.get('commissions', 0))
    
    regular_pay = regular_hours * regular_rate
    overtime_pay = overtime_hours * overtime_rate
    gross_pay = regular_pay + overtime_pay + bonuses + commissions
    
    # Calculate taxes
    federal_tax = float(taxes_input.get('federal', gross_pay * 0.22))
    state_tax = float(taxes_input.get('state', gross_pay * 0.05))
    social_security = float(taxes_input.get('social_security', gross_pay * 0.062))
    medicare = float(taxes_input.get('medicare', gross_pay * 0.0145))
    total_taxes = federal_tax + state_tax + social_security + medicare
    
    net_pay = gross_pay - total_taxes
    
    # Estimate YTD (multiply by pay periods so far this year)
    current_month = datetime.now().month
    ytd_multiplier = current_month  # Rough estimate
    gross_pay_ytd = gross_pay * ytd_multiplier
    net_pay_ytd = net_pay * ytd_multiplier
    
    # Generate verification ID
    verification_id = f"SAU-{uuid.uuid4().hex[:8].upper()}-{datetime.now().strftime('%Y%m%d')}"
    document_hash = hashlib.sha256(
        f"{user_id}{verification_id}{net_pay}{datetime.now().isoformat()}".encode()
    ).hexdigest()[:32]
    
    # Build data for advanced paystub generator
    generator_data = {
        'company': {
            'name': company_data.get('name', 'Company Name'),
            'address': company_data.get('address', 'Company Address'),
        },
        'employee': {
            'name': employee_data.get('name', 'Employee Name'),
            'state': employee_data.get('state', 'CA'),
            'ssn_masked': employee_data.get('ssn_masked', 'XXX-XX-0000'),
        },
        'pay_info': {
            'period_start': pay_period_start.strftime('%m/%d/%Y'),
            'period_end': pay_period_end.strftime('%m/%d/%Y'),
            'pay_date': pay_date.strftime('%m/%d/%Y'),
        },
        'check_info': {
            'number': check_number,
        },
        'earnings': [
            {
                'description': 'Regular Earnings',
                'rate': f'{regular_rate:.2f}',
                'hours': f'{regular_hours:.0f}',
                'current': regular_pay,
                'ytd': regular_pay * ytd_multiplier,
            }
        ],
        'deductions': [
            {'description': 'Federal Income Tax', 'type': 'Statutory', 'current': federal_tax, 'ytd': federal_tax * ytd_multiplier},
            {'description': f'{employee_data.get("state", "State")} State Tax', 'type': 'Statutory', 'current': state_tax, 'ytd': state_tax * ytd_multiplier},
            {'description': 'Social Security', 'type': 'FICA', 'current': social_security, 'ytd': social_security * ytd_multiplier},
            {'description': 'Medicare', 'type': 'FICA', 'current': medicare, 'ytd': medicare * ytd_multiplier},
        ],
        'totals': {
            'gross_pay': gross_pay,
            'gross_pay_ytd': gross_pay_ytd,
            'net_pay': net_pay,
            'net_pay_ytd': net_pay_ytd,
            'amount_words': number_to_words(net_pay),
        },
    }
    
    # Add overtime if present
    if overtime_hours > 0:
        generator_data['earnings'].append({
            'description': 'Overtime (1.5x)',
            'rate': f'{overtime_rate:.2f}',
            'hours': f'{overtime_hours:.0f}',
            'current': overtime_pay,
            'ytd': overtime_pay * ytd_multiplier,
        })
    
    # Add bonus if present
    if bonuses > 0:
        generator_data['earnings'].append({
            'description': 'Bonus',
            'rate': '-',
            'hours': '-',
            'current': bonuses,
            'ytd': bonuses,
        })
    
    # Add commission if present
    if commissions > 0:
        generator_data['earnings'].append({
            'description': 'Commission',
            'rate': '-',
            'hours': '-',
            'current': commissions,
            'ytd': commissions * (ytd_multiplier / 2),
        })
    
    # Validate theme
    if theme not in COLOR_THEMES:
        theme = 'diego_original'
    
    # Generate PDF using advanced generator
    paystub_uuid = str(uuid.uuid4())[:8]
    filename = f"paystub_{paystub_uuid}.pdf"
    output_dir = tempfile.mkdtemp()
    output_path = os.path.join(output_dir, filename)
    
    pdf_result = paystub_generator.generate_paystub_pdf(generator_data, output_path, theme)
    
    pdf_base64 = None
    if pdf_result.get('success') and os.path.exists(output_path):
        with open(output_path, 'rb') as f:
            pdf_base64 = base64.b64encode(f.read()).decode('utf-8')
    
    # Create paystub record in database
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
        deductions={'federal': federal_tax, 'state': state_tax, 'social_security': social_security, 'medicare': medicare},
        total_deductions=total_taxes,
        net_pay=net_pay,
        ytd_gross=gross_pay_ytd,
        ytd_net=net_pay_ytd,
        ytd_deductions=total_taxes * ytd_multiplier,
        verification_id=verification_id,
        document_hash=document_hash,
        theme=theme,
        status='generated'
    )
    
    db.session.add(paystub)
    billing.increment_usage()
    user.reward_points = (user.reward_points or 0) + 10
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Paystub generated successfully with PDF',
        'data': {
            'paystub_id': paystub.id,
            'verification_id': verification_id,
            'pdf_generated': pdf_result.get('success', False),
            'pdf_base64': pdf_base64,
            'theme': theme,
        },
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
