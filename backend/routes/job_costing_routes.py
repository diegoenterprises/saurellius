# Job Costing & Labor Allocation Routes
# Track time and costs by project, client, and job

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

job_costing_bp = Blueprint('job_costing', __name__)

# In-memory storage
projects = {}
job_codes = {}
time_allocations = {}
labor_forecasts = {}


# =============================================================================
# PROJECT MANAGEMENT
# =============================================================================

@job_costing_bp.route('/api/job-costing/projects', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all projects."""
    company_id = request.args.get('company_id')
    status = request.args.get('status', 'active')
    
    project_list = [p for p in projects.values() 
                    if p.get('company_id') == company_id and p.get('status') == status]
    
    return jsonify({'success': True, 'projects': project_list}), 200


@job_costing_bp.route('/api/job-costing/projects', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project for job costing."""
    data = request.get_json()
    project_id = str(uuid.uuid4())
    
    project = {
        'id': project_id,
        'company_id': data.get('company_id'),
        'name': data.get('name'),
        'code': data.get('code'),
        'client': data.get('client'),
        'description': data.get('description'),
        'budget': {
            'labor_hours': data.get('budget_hours', 0),
            'labor_cost': data.get('budget_cost', 0),
            'materials': data.get('budget_materials', 0),
            'total': data.get('budget_total', 0)
        },
        'actual': {
            'labor_hours': 0,
            'labor_cost': 0,
            'materials': 0,
            'total': 0
        },
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date'),
        'status': 'active',
        'billable': data.get('billable', True),
        'billing_rate': data.get('billing_rate'),
        'assigned_employees': data.get('assigned_employees', []),
        'created_at': datetime.now().isoformat()
    }
    
    projects[project_id] = project
    return jsonify({'success': True, 'project': project}), 201


@job_costing_bp.route('/api/job-costing/projects/<project_id>', methods=['GET'])
@jwt_required()
def get_project_detail(project_id):
    """Get project details with cost breakdown."""
    if project_id not in projects:
        return jsonify({'success': False, 'message': 'Project not found'}), 404
    
    project = projects[project_id]
    
    # Calculate allocations for this project
    project_allocations = [a for a in time_allocations.values() 
                          if a.get('project_id') == project_id]
    
    total_hours = sum(a.get('hours', 0) for a in project_allocations)
    total_cost = sum(a.get('cost', 0) for a in project_allocations)
    
    project['actual']['labor_hours'] = total_hours
    project['actual']['labor_cost'] = total_cost
    
    return jsonify({'success': True, 'project': project}), 200


# =============================================================================
# JOB CODES
# =============================================================================

@job_costing_bp.route('/api/job-costing/codes', methods=['GET'])
@jwt_required()
def get_job_codes():
    """Get all job codes."""
    company_id = request.args.get('company_id')
    codes = [c for c in job_codes.values() if c.get('company_id') == company_id]
    return jsonify({'success': True, 'codes': codes}), 200


@job_costing_bp.route('/api/job-costing/codes', methods=['POST'])
@jwt_required()
def create_job_code():
    """Create a new job code."""
    data = request.get_json()
    code_id = str(uuid.uuid4())
    
    code = {
        'id': code_id,
        'company_id': data.get('company_id'),
        'code': data.get('code'),
        'name': data.get('name'),
        'description': data.get('description'),
        'category': data.get('category'),
        'billable': data.get('billable', True),
        'rate_multiplier': data.get('rate_multiplier', 1.0),
        'active': True,
        'created_at': datetime.now().isoformat()
    }
    
    job_codes[code_id] = code
    return jsonify({'success': True, 'code': code}), 201


# =============================================================================
# TIME ALLOCATIONS
# =============================================================================

@job_costing_bp.route('/api/job-costing/allocations', methods=['GET'])
@jwt_required()
def get_time_allocations():
    """Get time allocations."""
    project_id = request.args.get('project_id')
    employee_id = request.args.get('employee_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    allocations = list(time_allocations.values())
    
    if project_id:
        allocations = [a for a in allocations if a.get('project_id') == project_id]
    if employee_id:
        allocations = [a for a in allocations if a.get('employee_id') == employee_id]
    
    return jsonify({'success': True, 'allocations': allocations}), 200


@job_costing_bp.route('/api/job-costing/allocations', methods=['POST'])
@jwt_required()
def create_time_allocation():
    """Create a time allocation entry."""
    data = request.get_json()
    allocation_id = str(uuid.uuid4())
    
    allocation = {
        'id': allocation_id,
        'employee_id': data.get('employee_id'),
        'project_id': data.get('project_id'),
        'job_code_id': data.get('job_code_id'),
        'date': data.get('date'),
        'hours': data.get('hours'),
        'hourly_rate': data.get('hourly_rate', 0),
        'cost': data.get('hours', 0) * data.get('hourly_rate', 0),
        'billable': data.get('billable', True),
        'description': data.get('description'),
        'approved': False,
        'created_at': datetime.now().isoformat()
    }
    
    time_allocations[allocation_id] = allocation
    return jsonify({'success': True, 'allocation': allocation}), 201


# =============================================================================
# LABOR FORECASTING
# =============================================================================

@job_costing_bp.route('/api/job-costing/forecast', methods=['GET'])
@jwt_required()
def get_labor_forecast():
    """Get labor forecast for projects."""
    company_id = request.args.get('company_id')
    
    forecast = {
        'generated_at': datetime.now().isoformat(),
        'period': 'next_30_days',
        'projects': [
            {
                'project_id': 'proj_001',
                'name': 'Website Redesign',
                'remaining_budget_hours': 120,
                'forecasted_hours': 95,
                'status': 'on_track'
            },
            {
                'project_id': 'proj_002',
                'name': 'Mobile App Development',
                'remaining_budget_hours': 200,
                'forecasted_hours': 240,
                'status': 'at_risk'
            }
        ],
        'resource_utilization': {
            'available_hours': 2400,
            'allocated_hours': 1850,
            'utilization_rate': 77.1
        },
        'recommendations': [
            'Project proj_002 may exceed budget by 40 hours',
            'Consider reallocating 2 resources from proj_001 to proj_002'
        ]
    }
    
    return jsonify({'success': True, 'forecast': forecast}), 200


@job_costing_bp.route('/api/job-costing/reports/profitability', methods=['GET'])
@jwt_required()
def get_profitability_report():
    """Get project profitability report."""
    company_id = request.args.get('company_id')
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'summary': {
            'total_revenue': 485000,
            'total_labor_cost': 312000,
            'total_materials': 45000,
            'gross_profit': 128000,
            'profit_margin': 26.4
        },
        'by_project': [
            {
                'project': 'Website Redesign',
                'revenue': 125000,
                'cost': 82000,
                'profit': 43000,
                'margin': 34.4
            },
            {
                'project': 'Mobile App',
                'revenue': 250000,
                'cost': 195000,
                'profit': 55000,
                'margin': 22.0
            }
        ],
        'by_client': [
            {'client': 'Acme Corp', 'revenue': 200000, 'profit': 52000},
            {'client': 'Tech Solutions', 'revenue': 175000, 'profit': 48000}
        ]
    }
    
    return jsonify({'success': True, 'report': report}), 200
