"""
REPORTING ROUTES
Reports, analytics, and data exports API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date

reporting_bp = Blueprint('reporting', __name__, url_prefix='/api/reports')


@reporting_bp.route('', methods=['GET'])
@jwt_required()
def get_reports():
    """Get generated reports"""
    from services.reporting_service import reporting_service
    
    report_type = request.args.get('report_type')
    start_date = request.args.get('start_date')
    
    reports = reporting_service.get_reports(
        report_type=report_type,
        start_date=date.fromisoformat(start_date) if start_date else None
    )
    
    return jsonify({'success': True, 'reports': reports})


@reporting_bp.route('/<report_id>', methods=['GET'])
@jwt_required()
def get_report(report_id):
    """Get report by ID"""
    from services.reporting_service import reporting_service
    
    report = reporting_service.get_report(report_id)
    if not report:
        return jsonify({'success': False, 'message': 'Report not found'}), 404
    
    return jsonify({'success': True, 'report': report})


@reporting_bp.route('/payroll-summary', methods=['POST'])
@jwt_required()
def generate_payroll_summary():
    """Generate payroll summary report"""
    from services.reporting_service import reporting_service
    
    data = request.get_json()
    
    report = reporting_service.generate_payroll_summary(
        start_date=date.fromisoformat(data['start_date']),
        end_date=date.fromisoformat(data['end_date']),
        payroll_data=data.get('payroll_data', [])
    )
    
    return jsonify({'success': True, 'report': report}), 201


@reporting_bp.route('/payroll-register', methods=['POST'])
@jwt_required()
def generate_payroll_register():
    """Generate payroll register"""
    from services.reporting_service import reporting_service
    
    data = request.get_json()
    
    report = reporting_service.generate_payroll_register(
        payroll_run_id=data['payroll_run_id'],
        paychecks=data.get('paychecks', [])
    )
    
    return jsonify({'success': True, 'report': report}), 201


@reporting_bp.route('/tax-liability', methods=['POST'])
@jwt_required()
def generate_tax_liability():
    """Generate tax liability report"""
    from services.reporting_service import reporting_service
    
    data = request.get_json()
    
    report = reporting_service.generate_tax_liability_report(
        quarter=data['quarter'],
        year=data['year'],
        tax_data=data.get('tax_data', {})
    )
    
    return jsonify({'success': True, 'report': report}), 201


@reporting_bp.route('/employee-earnings', methods=['POST'])
@jwt_required()
def generate_employee_earnings():
    """Generate employee earnings report"""
    from services.reporting_service import reporting_service
    
    data = request.get_json()
    
    report = reporting_service.generate_employee_earnings_report(
        employee_id=data['employee_id'],
        year=data['year'],
        earnings_data=data.get('earnings_data', [])
    )
    
    return jsonify({'success': True, 'report': report}), 201


@reporting_bp.route('/department-summary', methods=['POST'])
@jwt_required()
def generate_department_summary():
    """Generate department summary report"""
    from services.reporting_service import reporting_service
    
    data = request.get_json()
    
    report = reporting_service.generate_department_summary(
        start_date=date.fromisoformat(data['start_date']),
        end_date=date.fromisoformat(data['end_date']),
        department_data=data.get('department_data', {})
    )
    
    return jsonify({'success': True, 'report': report}), 201


@reporting_bp.route('/labor-cost', methods=['POST'])
@jwt_required()
def generate_labor_cost():
    """Generate labor cost analysis report"""
    from services.reporting_service import reporting_service
    
    data = request.get_json()
    
    report = reporting_service.generate_labor_cost_report(
        start_date=date.fromisoformat(data['start_date']),
        end_date=date.fromisoformat(data['end_date']),
        labor_data=data.get('labor_data', {})
    )
    
    return jsonify({'success': True, 'report': report}), 201


@reporting_bp.route('/pto-balance', methods=['POST'])
@jwt_required()
def generate_pto_balance():
    """Generate PTO balance report"""
    from services.reporting_service import reporting_service
    
    data = request.get_json()
    
    report = reporting_service.generate_pto_balance_report(
        as_of_date=date.fromisoformat(data.get('as_of_date', date.today().isoformat())),
        pto_data=data.get('pto_data', [])
    )
    
    return jsonify({'success': True, 'report': report}), 201


@reporting_bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
def get_analytics_dashboard():
    """Get analytics dashboard data"""
    from services.reporting_service import reporting_service
    
    year = request.args.get('year', date.today().year, type=int)
    
    dashboard = reporting_service.generate_analytics_dashboard(year)
    
    return jsonify({'success': True, 'dashboard': dashboard})


@reporting_bp.route('/schedule', methods=['GET'])
@jwt_required()
def get_scheduled_reports():
    """Get scheduled reports"""
    from services.reporting_service import reporting_service
    
    return jsonify({'success': True, 'schedules': reporting_service.scheduled_reports})


@reporting_bp.route('/schedule', methods=['POST'])
@jwt_required()
def schedule_report():
    """Schedule a recurring report"""
    from services.reporting_service import reporting_service
    
    data = request.get_json()
    
    schedule = reporting_service.schedule_report(
        report_type=data['report_type'],
        frequency=data['frequency'],
        recipients=data['recipients'],
        config=data.get('config', {})
    )
    
    return jsonify({'success': True, 'schedule': schedule}), 201


@reporting_bp.route('/<report_id>/export/<format>', methods=['GET'])
@jwt_required()
def export_report(report_id, format):
    """Export report in specified format"""
    from services.reporting_service import reporting_service
    
    try:
        export = reporting_service.export_report(report_id, format)
        return jsonify({'success': True, 'export': export})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
