"""
 DASHBOARD ROUTES
Dashboard data, billing info, and analytics endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Company, Employee, Paystub, db
from billing import BillingManager
from datetime import datetime, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get comprehensive dashboard data."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    # Get billing info
    billing = BillingManager(user)
    usage = billing.get_usage_summary()
    
    # Get counts
    employee_count = Employee.query.filter_by(user_id=user_id, is_active=True).count()
    company_count = Company.query.filter_by(user_id=user_id).count()
    
    # Recent paystubs
    recent_paystubs = Paystub.query.filter_by(user_id=user_id)\
        .order_by(Paystub.created_at.desc())\
        .limit(5)\
        .all()
    
    # This month's earnings (sum of all paystubs)
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_total = db.session.query(func.sum(Paystub.gross_pay))\
        .filter(Paystub.user_id == user_id)\
        .filter(Paystub.created_at >= month_start)\
        .scalar() or 0
    
    return jsonify({
        'success': True,
        'dashboard': {
            'user': user.to_dict(),
            'stats': {
                'employees': employee_count,
                'companies': company_count,
                'paystubs_this_month': usage.get('paystubs_generated', 0),
                'total_paystubs': usage.get('paystubs_generated', 0),
                'monthly_payroll': round(monthly_total, 2)
            },
            'subscription': {
                'tier': user.subscription_tier,
                'status': user.subscription_status,
                'usage': usage
            },
            'rewards': {
                'points': user.reward_points or 0,
                'level': get_reward_level(user.reward_points or 0)
            },
            'recent_paystubs': [p.to_dict() for p in recent_paystubs]
        }
    }), 200


@dashboard_bp.route('/api/dashboard/billing', methods=['GET'])
@jwt_required()
def get_billing_info():
    """Get detailed billing information."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    billing = BillingManager(user)
    usage = billing.get_usage_summary()
    overages = billing.calculate_overage_charges()
    recommendation = billing.recommend_plan()
    
    return jsonify({
        'success': True,
        'billing': {
            'current_plan': user.subscription_tier,
            'status': user.subscription_status,
            'usage': usage,
            'overages': overages,
            'recommendation': recommendation
        }
    }), 200


@dashboard_bp.route('/api/dashboard/usage', methods=['GET'])
@jwt_required()
def get_usage():
    """Get usage statistics."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    billing = BillingManager(user)
    can_generate, message, overage = billing.check_can_generate_paystub()
    
    return jsonify({
        'success': True,
        'usage': billing.get_usage_summary(),
        'can_generate': can_generate,
        'message': message,
        'overage_amount': overage
    }), 200


@dashboard_bp.route('/api/dashboard/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get analytics data for charts."""
    user_id = get_jwt_identity()
    
    # Get paystubs by month for the last 6 months
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    
    monthly_data = db.session.query(
        func.date_trunc('month', Paystub.created_at).label('month'),
        func.count(Paystub.id).label('count'),
        func.sum(Paystub.gross_pay).label('total')
    ).filter(
        Paystub.user_id == user_id,
        Paystub.created_at >= six_months_ago
    ).group_by(
        func.date_trunc('month', Paystub.created_at)
    ).order_by('month').all()
    
    return jsonify({
        'success': True,
        'analytics': {
            'monthly_paystubs': [
                {
                    'month': row.month.strftime('%Y-%m') if row.month else None,
                    'count': row.count,
                    'total': round(row.total or 0, 2)
                }
                for row in monthly_data
            ]
        }
    }), 200


@dashboard_bp.route('/api/dashboard/activity', methods=['GET'])
@jwt_required()
def get_activity():
    """Get recent activity feed."""
    user_id = get_jwt_identity()
    
    # Get recent paystubs as activity
    recent_paystubs = Paystub.query.filter_by(user_id=user_id)\
        .order_by(Paystub.created_at.desc())\
        .limit(10)\
        .all()
    
    activities = []
    for paystub in recent_paystubs:
        employee = Employee.query.get(paystub.employee_id) if paystub.employee_id else None
        activities.append({
            'type': 'paystub_generated',
            'description': f"Paystub generated for {employee.full_name if employee else 'Employee'}",
            'amount': paystub.net_pay,
            'timestamp': paystub.created_at.isoformat() if paystub.created_at else None
        })
    
    return jsonify({
        'success': True,
        'activities': activities
    }), 200


def get_reward_level(points: int) -> dict:
    """Calculate reward level from points."""
    levels = [
        {'name': 'Bronze', 'min': 0, 'max': 99},
        {'name': 'Silver', 'min': 100, 'max': 499},
        {'name': 'Gold', 'min': 500, 'max': 999},
        {'name': 'Platinum', 'min': 1000, 'max': 4999},
        {'name': 'Diamond', 'min': 5000, 'max': float('inf')}
    ]
    
    for level in levels:
        if level['min'] <= points <= level['max']:
            progress = (points - level['min']) / (level['max'] - level['min']) * 100 if level['max'] != float('inf') else 100
            return {
                'name': level['name'],
                'progress': min(100, round(progress, 1)),
                'next_level': levels[levels.index(level) + 1]['name'] if levels.index(level) < len(levels) - 1 else None
            }
    
    return {'name': 'Bronze', 'progress': 0, 'next_level': 'Silver'}


@dashboard_bp.route('/api/employees', methods=['GET'])
@jwt_required()
def get_employees():
    """Get all employees for the current user."""
    user_id = get_jwt_identity()
    
    employees = Employee.query.filter_by(user_id=user_id, is_active=True).all()
    
    return jsonify({
        'success': True,
        'employees': [
            {
                'id': emp.id,
                'first_name': emp.first_name,
                'last_name': emp.last_name,
                'email': emp.email,
                'department': emp.department,
                'position': emp.position,
                'hire_date': emp.hire_date.isoformat() if emp.hire_date else None,
                'pay_rate': float(emp.pay_rate) if emp.pay_rate else 0,
                'pay_type': emp.pay_type,
                'is_active': emp.is_active
            }
            for emp in employees
        ],
        'total': len(employees)
    }), 200


@dashboard_bp.route('/api/employees', methods=['POST'])
@jwt_required()
def create_employee():
    """Create a new employee."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    employee = Employee(
        user_id=user_id,
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        email=data.get('email'),
        department=data.get('department'),
        position=data.get('position'),
        pay_rate=data.get('pay_rate'),
        pay_type=data.get('pay_type', 'salary'),
        is_active=True
    )
    
    db.session.add(employee)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Employee created successfully',
        'employee': {
            'id': employee.id,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
            'email': employee.email
        }
    }), 201


@dashboard_bp.route('/api/companies', methods=['GET'])
@jwt_required()
def get_companies():
    """Get all companies for the current user."""
    user_id = get_jwt_identity()
    
    companies = Company.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'success': True,
        'companies': [
            {
                'id': comp.id,
                'name': comp.name,
                'address': comp.address,
                'city': comp.city,
                'state': comp.state,
                'zip_code': comp.zip_code,
                'phone': comp.phone,
                'ein': comp.ein,
                'created_at': comp.created_at.isoformat() if comp.created_at else None
            }
            for comp in companies
        ],
        'total': len(companies)
    }), 200


@dashboard_bp.route('/api/companies', methods=['POST'])
@jwt_required()
def create_company():
    """Create a new company."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    company = Company(
        user_id=user_id,
        name=data.get('name'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        zip_code=data.get('zip_code'),
        phone=data.get('phone'),
        ein=data.get('ein')
    )
    
    db.session.add(company)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Company created successfully',
        'company': {
            'id': company.id,
            'name': company.name
        }
    }), 201
