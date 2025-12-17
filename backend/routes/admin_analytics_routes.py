"""
Admin Analytics Routes
Comprehensive analytics for admin dashboard - ALL REAL DATA
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Company, Employee, ContractorAccount, Invoice, APILog
from sqlalchemy import func, extract
from datetime import datetime, timedelta
import logging

admin_analytics_bp = Blueprint('admin_analytics', __name__)


def require_admin():
    """Decorator helper to check admin authorization"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return user and getattr(user, 'is_admin', False)


@admin_analytics_bp.route('/api/admin/analytics/users', methods=['GET'])
@jwt_required()
def get_user_analytics():
    """
    Get comprehensive user analytics for admin dashboard
    ALL DATA FROM REAL DATABASE QUERIES - NO MOCK DATA
    """
    try:
        if not require_admin():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Total counts by user type (REAL DATA)
        total_employers = db.session.query(func.count(Company.id)).scalar() or 0
        total_employees = db.session.query(func.count(Employee.id)).scalar() or 0
        total_contractors = db.session.query(func.count(ContractorAccount.id)).scalar() or 0
        total_users = total_employers + total_employees + total_contractors
        
        # Calculate percentages (handle division by zero)
        employer_pct = (total_employers / total_users * 100) if total_users > 0 else 0
        employee_pct = (total_employees / total_users * 100) if total_users > 0 else 0
        contractor_pct = (total_contractors / total_users * 100) if total_users > 0 else 0
        
        # Active users (last 30 days) - REAL DATA
        thirty_days_ago = datetime.now() - timedelta(days=30)

        # Company/Employee/ContractorAccount do not track last_login; User does.
        # We approximate "active" employers/employees by user.last_login and role.
        active_employers = (
            db.session.query(func.count(User.id))
            .filter(User.last_login > thirty_days_ago)
            .filter(User.role.in_(['employer', 'manager']))
            .scalar()
            or 0
        )

        active_employees = (
            db.session.query(func.count(User.id))
            .filter(User.last_login > thirty_days_ago)
            .filter(User.role == 'employee')
            .scalar()
            or 0
        )

        # Contractor accounts are a separate auth system; approximate activity by recent creation.
        active_contractors = (
            db.session.query(func.count(ContractorAccount.id))
            .filter(ContractorAccount.created_at > thirty_days_ago)
            .scalar()
            or 0
        )
        
        active_users_30d = active_employers + active_employees + active_contractors
        
        # User growth by month (last 6 months) - REAL DATA
        user_growth = []
        for i in range(5, -1, -1):
            month_date = datetime.now() - timedelta(days=i*30)
            month_str = month_date.strftime('%Y-%m')
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if i == 0:
                month_end = datetime.now()
            else:
                next_month = (month_start + timedelta(days=32)).replace(day=1)
                month_end = next_month - timedelta(seconds=1)
            
            employers_count = db.session.query(func.count(Company.id)).filter(
                Company.created_at <= month_end
            ).scalar() or 0
            
            employees_count = db.session.query(func.count(Employee.id)).filter(
                Employee.created_at <= month_end
            ).scalar() or 0
            
            contractors_count = db.session.query(func.count(ContractorAccount.id)).filter(
                ContractorAccount.created_at <= month_end
            ).scalar() or 0
            
            user_growth.append({
                'month': month_str,
                'employers': employers_count,
                'employees': employees_count,
                'contractors': contractors_count,
                'total': employers_count + employees_count + contractors_count
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_users': total_users,
                'total_employers': total_employers,
                'total_employees': total_employees,
                'total_contractors': total_contractors,
                'employer_percentage': round(employer_pct, 1),
                'employee_percentage': round(employee_pct, 1),
                'contractor_percentage': round(contractor_pct, 1),
                'active_users_30d': active_users_30d,
                'active_employers_30d': active_employers,
                'active_employees_30d': active_employees,
                'active_contractors_30d': active_contractors,
                'user_growth': user_growth,
                'timestamp': datetime.now().isoformat(),
                'data_source': 'real_database_query'
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching user analytics: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch analytics'}), 500


@admin_analytics_bp.route('/api/admin/analytics/revenue', methods=['GET'])
@jwt_required()
def get_revenue_analytics():
    """
    Get revenue analytics for admin dashboard
    ALL DATA FROM REAL DATABASE QUERIES
    """
    try:
        if not require_admin():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Current month revenue
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_revenue = db.session.query(func.sum(Invoice.amount)).filter(
            Invoice.created_at >= current_month_start,
            Invoice.status == 'paid'
        ).scalar() or 0.0
        
        # Last month revenue for comparison
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = current_month_start - timedelta(seconds=1)
        
        last_month_revenue = db.session.query(func.sum(Invoice.amount)).filter(
            Invoice.created_at >= last_month_start,
            Invoice.created_at <= last_month_end,
            Invoice.status == 'paid'
        ).scalar() or 0.0
        
        # Calculate growth percentage
        revenue_growth_pct = 0
        if last_month_revenue > 0:
            revenue_growth_pct = ((monthly_revenue - last_month_revenue) / last_month_revenue) * 100
        
        # Revenue by month (last 12 months)
        revenue_trend = []
        for i in range(11, -1, -1):
            month_date = datetime.now() - timedelta(days=i*30)
            month_str = month_date.strftime('%Y-%m')
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            if i == 0:
                month_end = datetime.now()
            else:
                next_month = (month_start + timedelta(days=32)).replace(day=1)
                month_end = next_month - timedelta(seconds=1)
            
            month_revenue = db.session.query(func.sum(Invoice.amount)).filter(
                Invoice.created_at >= month_start,
                Invoice.created_at <= month_end,
                Invoice.status == 'paid'
            ).scalar() or 0.0
            
            revenue_trend.append({
                'month': month_str,
                'revenue': float(month_revenue)
            })
        
        # MRR calculation (Monthly Recurring Revenue)
        mrr = float(monthly_revenue)
        arr = mrr * 12
        
        return jsonify({
            'success': True,
            'data': {
                'monthly_revenue': float(monthly_revenue),
                'monthly_revenue_formatted': f"${monthly_revenue:,.2f}",
                'last_month_revenue': float(last_month_revenue),
                'revenue_growth_percentage': round(revenue_growth_pct, 1),
                'revenue_growth_direction': 'up' if revenue_growth_pct > 0 else 'down',
                'mrr': mrr,
                'arr': arr,
                'revenue_trend': revenue_trend,
                'timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching revenue analytics: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch analytics'}), 500


@admin_analytics_bp.route('/api/admin/analytics/api-usage', methods=['GET'])
@jwt_required()
def get_api_usage_analytics():
    """
    Get API usage analytics for admin dashboard
    ALL DATA FROM REAL DATABASE QUERIES
    """
    try:
        if not require_admin():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        days = request.args.get('days', 30, type=int)
        start_date = datetime.now() - timedelta(days=days)
        
        # Total API requests
        total_requests = db.session.query(func.count(APILog.id)).filter(
            APILog.created_at >= start_date
        ).scalar() or 0
        
        # Unique clients
        unique_clients = db.session.query(func.count(func.distinct(APILog.client_id))).filter(
            APILog.created_at >= start_date
        ).scalar() or 0
        
        # Average response time
        avg_response_time = db.session.query(func.avg(APILog.response_time)).filter(
            APILog.created_at >= start_date
        ).scalar() or 0
        
        # Error rate
        error_count = db.session.query(func.count(APILog.id)).filter(
            APILog.created_at >= start_date,
            APILog.response_status_code >= 400
        ).scalar() or 0
        
        error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0
        
        # Top endpoints
        top_endpoints = db.session.query(
            APILog.endpoint,
            func.count(APILog.id).label('count')
        ).filter(
            APILog.created_at >= start_date
        ).group_by(APILog.endpoint).order_by(
            func.count(APILog.id).desc()
        ).limit(10).all()
        
        top_endpoints_data = []
        for endpoint, count in top_endpoints:
            pct = (count / total_requests * 100) if total_requests > 0 else 0
            top_endpoints_data.append({
                'endpoint': endpoint,
                'requests': count,
                'percentage': round(pct, 1)
            })
        
        return jsonify({
            'success': True,
            'data': {
                'total_requests': total_requests,
                'unique_clients': unique_clients,
                'avg_response_time': round(avg_response_time, 2),
                'error_rate': round(error_rate, 2),
                'top_endpoints': top_endpoints_data,
                'period_days': days,
                'timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching API usage analytics: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch analytics'}), 500
