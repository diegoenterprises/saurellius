"""
AUDIT TRAIL ROUTES
Complete change tracking, approval history, compliance audit
Supports all payroll changes for regulatory compliance
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
import uuid

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')

# In-memory storage (replace with database in production)
AUDIT_LOGS = {}
APPROVAL_HISTORY = {}


# =====================================================
# AUDIT LOG TYPES
# =====================================================
AUDIT_TYPES = {
    'EMPLOYEE': ['created', 'updated', 'terminated', 'reinstated', 'status_change'],
    'PAYROLL': ['processed', 'approved', 'voided', 'corrected', 'recalculated'],
    'TAX': ['w4_submitted', 'w4_updated', 'state_form_updated', 'exempt_claimed', 'exempt_expired'],
    'DIRECT_DEPOSIT': ['account_added', 'account_updated', 'account_deleted', 'prenote_sent', 'prenote_verified'],
    'GARNISHMENT': ['created', 'updated', 'terminated', 'payment_processed', 'priority_changed'],
    'BENEFITS': ['enrolled', 'changed', 'terminated', 'contribution_updated'],
    'TIME': ['entry_created', 'entry_modified', 'timesheet_approved', 'overtime_flagged'],
    'COMPENSATION': ['rate_changed', 'bonus_added', 'commission_calculated', 'retroactive_pay'],
    'SECURITY': ['login', 'logout', 'password_changed', 'permission_changed', 'failed_login'],
    'SYSTEM': ['report_generated', 'file_exported', 'backup_created', 'setting_changed'],
}


def create_audit_log(category, action, entity_type, entity_id, changes, user_id, metadata=None):
    """Create an audit log entry"""
    log_id = f"AUDIT-{uuid.uuid4().hex[:12].upper()}"
    
    log_entry = {
        'id': log_id,
        'timestamp': datetime.utcnow().isoformat(),
        'category': category,
        'action': action,
        'entity_type': entity_type,
        'entity_id': entity_id,
        'user_id': user_id,
        'changes': changes,  # List of {field, old_value, new_value}
        'metadata': metadata or {},
        'ip_address': None,  # Set from request context
    }
    
    AUDIT_LOGS[log_id] = log_entry
    return log_entry


@audit_bp.route('/log', methods=['POST'])
@jwt_required()
def add_audit_log():
    """Add an audit log entry"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    required = ['category', 'action', 'entity_type', 'entity_id']
    for field in required:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    log_entry = create_audit_log(
        category=data['category'],
        action=data['action'],
        entity_type=data['entity_type'],
        entity_id=data['entity_id'],
        changes=data.get('changes', []),
        user_id=user_id,
        metadata=data.get('metadata')
    )
    
    log_entry['ip_address'] = request.remote_addr
    
    return jsonify({
        'success': True,
        'audit_log': log_entry
    }), 201


@audit_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Get audit logs with filtering"""
    category = request.args.get('category')
    action = request.args.get('action')
    entity_type = request.args.get('entity_type')
    entity_id = request.args.get('entity_id')
    user_id = request.args.get('user_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))
    
    logs = list(AUDIT_LOGS.values())
    
    # Apply filters
    if category:
        logs = [l for l in logs if l['category'] == category]
    
    if action:
        logs = [l for l in logs if l['action'] == action]
    
    if entity_type:
        logs = [l for l in logs if l['entity_type'] == entity_type]
    
    if entity_id:
        logs = [l for l in logs if l['entity_id'] == entity_id]
    
    if user_id:
        logs = [l for l in logs if l['user_id'] == user_id]
    
    if start_date:
        logs = [l for l in logs if l['timestamp'] >= start_date]
    
    if end_date:
        logs = [l for l in logs if l['timestamp'] <= end_date]
    
    # Sort by timestamp descending
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    total = len(logs)
    logs = logs[offset:offset + limit]
    
    return jsonify({
        'success': True,
        'logs': logs,
        'total': total,
        'limit': limit,
        'offset': offset
    })


@audit_bp.route('/entity/<entity_type>/<entity_id>', methods=['GET'])
@jwt_required()
def get_entity_history(entity_type, entity_id):
    """Get complete audit history for an entity"""
    logs = [l for l in AUDIT_LOGS.values() 
            if l['entity_type'] == entity_type and l['entity_id'] == entity_id]
    
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({
        'success': True,
        'entity_type': entity_type,
        'entity_id': entity_id,
        'history': logs,
        'total_changes': len(logs)
    })


# =====================================================
# APPROVAL WORKFLOW
# =====================================================

@audit_bp.route('/approval', methods=['POST'])
@jwt_required()
def create_approval_request():
    """Create an approval request"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    approval_id = f"APPR-{uuid.uuid4().hex[:8].upper()}"
    
    approval = {
        'id': approval_id,
        'request_type': data['request_type'],  # payroll_run, correction, rate_change, etc.
        'entity_type': data['entity_type'],
        'entity_id': data['entity_id'],
        'description': data.get('description'),
        'amount': data.get('amount'),
        'requested_by': user_id,
        'requested_at': datetime.utcnow().isoformat(),
        'approvers': data.get('approvers', []),  # List of user IDs who can approve
        'required_approvals': data.get('required_approvals', 1),
        'current_approvals': [],
        'status': 'pending',  # pending, approved, rejected, cancelled
        'notes': [],
        'metadata': data.get('metadata', {}),
    }
    
    APPROVAL_HISTORY[approval_id] = approval
    
    # Create audit log
    create_audit_log(
        category='APPROVAL',
        action='request_created',
        entity_type=data['entity_type'],
        entity_id=data['entity_id'],
        changes=[{'field': 'status', 'old_value': None, 'new_value': 'pending'}],
        user_id=user_id,
        metadata={'approval_id': approval_id}
    )
    
    return jsonify({
        'success': True,
        'approval': approval
    }), 201


@audit_bp.route('/approval/<approval_id>/approve', methods=['POST'])
@jwt_required()
def approve_request(approval_id):
    """Approve a request"""
    if approval_id not in APPROVAL_HISTORY:
        return jsonify({'success': False, 'message': 'Approval not found'}), 404
    
    data = request.get_json()
    user_id = get_jwt_identity()
    approval = APPROVAL_HISTORY[approval_id]
    
    if approval['status'] != 'pending':
        return jsonify({
            'success': False,
            'message': f'Cannot approve - status is {approval["status"]}'
        }), 400
    
    # Check if user is authorized approver
    if approval['approvers'] and user_id not in approval['approvers']:
        return jsonify({
            'success': False,
            'message': 'You are not authorized to approve this request'
        }), 403
    
    # Check if user already approved
    if any(a['user_id'] == user_id for a in approval['current_approvals']):
        return jsonify({
            'success': False,
            'message': 'You have already approved this request'
        }), 400
    
    # Add approval
    approval['current_approvals'].append({
        'user_id': user_id,
        'approved_at': datetime.utcnow().isoformat(),
        'notes': data.get('notes')
    })
    
    # Check if fully approved
    if len(approval['current_approvals']) >= approval['required_approvals']:
        approval['status'] = 'approved'
        approval['approved_at'] = datetime.utcnow().isoformat()
    
    APPROVAL_HISTORY[approval_id] = approval
    
    # Create audit log
    create_audit_log(
        category='APPROVAL',
        action='approved',
        entity_type=approval['entity_type'],
        entity_id=approval['entity_id'],
        changes=[{
            'field': 'approval_count',
            'old_value': len(approval['current_approvals']) - 1,
            'new_value': len(approval['current_approvals'])
        }],
        user_id=user_id,
        metadata={'approval_id': approval_id}
    )
    
    return jsonify({
        'success': True,
        'approval': approval,
        'message': 'Approved' if approval['status'] == 'approved' else 'Approval recorded, awaiting additional approvers'
    })


@audit_bp.route('/approval/<approval_id>/reject', methods=['POST'])
@jwt_required()
def reject_request(approval_id):
    """Reject a request"""
    if approval_id not in APPROVAL_HISTORY:
        return jsonify({'success': False, 'message': 'Approval not found'}), 404
    
    data = request.get_json()
    user_id = get_jwt_identity()
    approval = APPROVAL_HISTORY[approval_id]
    
    if approval['status'] != 'pending':
        return jsonify({
            'success': False,
            'message': f'Cannot reject - status is {approval["status"]}'
        }), 400
    
    approval['status'] = 'rejected'
    approval['rejected_by'] = user_id
    approval['rejected_at'] = datetime.utcnow().isoformat()
    approval['rejection_reason'] = data.get('reason', 'No reason provided')
    
    APPROVAL_HISTORY[approval_id] = approval
    
    # Create audit log
    create_audit_log(
        category='APPROVAL',
        action='rejected',
        entity_type=approval['entity_type'],
        entity_id=approval['entity_id'],
        changes=[{'field': 'status', 'old_value': 'pending', 'new_value': 'rejected'}],
        user_id=user_id,
        metadata={'approval_id': approval_id, 'reason': approval['rejection_reason']}
    )
    
    return jsonify({
        'success': True,
        'approval': approval
    })


@audit_bp.route('/approvals/pending', methods=['GET'])
@jwt_required()
def get_pending_approvals():
    """Get pending approvals for current user"""
    user_id = get_jwt_identity()
    
    pending = [a for a in APPROVAL_HISTORY.values()
               if a['status'] == 'pending'
               and (not a['approvers'] or user_id in a['approvers'])
               and not any(appr['user_id'] == user_id for appr in a['current_approvals'])]
    
    pending.sort(key=lambda x: x['requested_at'], reverse=True)
    
    return jsonify({
        'success': True,
        'pending_approvals': pending,
        'count': len(pending)
    })


# =====================================================
# PAYROLL CHANGE LOG
# =====================================================

@audit_bp.route('/payroll-changes', methods=['GET'])
@jwt_required()
def get_payroll_changes():
    """Get all payroll-related changes for audit"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    employee_id = request.args.get('employee_id')
    
    # Filter payroll-related categories
    payroll_categories = ['PAYROLL', 'TAX', 'COMPENSATION', 'GARNISHMENT', 'BENEFITS', 'DIRECT_DEPOSIT']
    
    logs = [l for l in AUDIT_LOGS.values() if l['category'] in payroll_categories]
    
    if start_date:
        logs = [l for l in logs if l['timestamp'] >= start_date]
    
    if end_date:
        logs = [l for l in logs if l['timestamp'] <= end_date]
    
    if employee_id:
        logs = [l for l in logs if l['entity_id'] == employee_id or 
                l.get('metadata', {}).get('employee_id') == employee_id]
    
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({
        'success': True,
        'changes': logs,
        'total': len(logs)
    })


@audit_bp.route('/employee/<employee_id>/changes', methods=['GET'])
@jwt_required()
def get_employee_changes(employee_id):
    """Get all changes for a specific employee"""
    logs = [l for l in AUDIT_LOGS.values()
            if l['entity_id'] == employee_id or 
            l.get('metadata', {}).get('employee_id') == employee_id]
    
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Group by category
    by_category = {}
    for log in logs:
        cat = log['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(log)
    
    return jsonify({
        'success': True,
        'employee_id': employee_id,
        'changes': logs,
        'by_category': by_category,
        'total': len(logs)
    })


# =====================================================
# COMPLIANCE REPORTS
# =====================================================

@audit_bp.route('/compliance-report', methods=['GET'])
@jwt_required()
def generate_compliance_report():
    """Generate compliance audit report"""
    start_date = request.args.get('start_date', (date.today() - timedelta(days=30)).isoformat())
    end_date = request.args.get('end_date', date.today().isoformat())
    
    logs = [l for l in AUDIT_LOGS.values()
            if start_date <= l['timestamp'][:10] <= end_date]
    
    # Analyze logs
    total_changes = len(logs)
    changes_by_category = {}
    changes_by_user = {}
    changes_by_day = {}
    
    for log in logs:
        # By category
        cat = log['category']
        changes_by_category[cat] = changes_by_category.get(cat, 0) + 1
        
        # By user
        user = log['user_id']
        changes_by_user[user] = changes_by_user.get(user, 0) + 1
        
        # By day
        day = log['timestamp'][:10]
        changes_by_day[day] = changes_by_day.get(day, 0) + 1
    
    # Approval metrics
    approvals = [a for a in APPROVAL_HISTORY.values()
                 if start_date <= a['requested_at'][:10] <= end_date]
    
    approved = sum(1 for a in approvals if a['status'] == 'approved')
    rejected = sum(1 for a in approvals if a['status'] == 'rejected')
    pending = sum(1 for a in approvals if a['status'] == 'pending')
    
    # Security events
    security_logs = [l for l in logs if l['category'] == 'SECURITY']
    failed_logins = sum(1 for l in security_logs if l['action'] == 'failed_login')
    
    return jsonify({
        'success': True,
        'report': {
            'period': {'start': start_date, 'end': end_date},
            'generated_at': datetime.utcnow().isoformat(),
            
            'summary': {
                'total_changes': total_changes,
                'unique_users': len(changes_by_user),
                'days_with_activity': len(changes_by_day),
            },
            
            'changes_by_category': changes_by_category,
            'changes_by_user': changes_by_user,
            'changes_by_day': dict(sorted(changes_by_day.items())),
            
            'approvals': {
                'total': len(approvals),
                'approved': approved,
                'rejected': rejected,
                'pending': pending,
                'approval_rate': round(approved / len(approvals) * 100, 2) if approvals else 0
            },
            
            'security': {
                'total_events': len(security_logs),
                'failed_logins': failed_logins,
            }
        }
    })


@audit_bp.route('/security-events', methods=['GET'])
@jwt_required()
def get_security_events():
    """Get security-related audit events"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    event_type = request.args.get('event_type')
    
    logs = [l for l in AUDIT_LOGS.values() if l['category'] == 'SECURITY']
    
    if start_date:
        logs = [l for l in logs if l['timestamp'] >= start_date]
    
    if end_date:
        logs = [l for l in logs if l['timestamp'] <= end_date]
    
    if event_type:
        logs = [l for l in logs if l['action'] == event_type]
    
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({
        'success': True,
        'security_events': logs,
        'total': len(logs)
    })


@audit_bp.route('/export', methods=['POST'])
@jwt_required()
def export_audit_logs():
    """Export audit logs for external audit"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    categories = data.get('categories', [])
    format_type = data.get('format', 'json')  # json, csv
    
    logs = list(AUDIT_LOGS.values())
    
    if start_date:
        logs = [l for l in logs if l['timestamp'] >= start_date]
    
    if end_date:
        logs = [l for l in logs if l['timestamp'] <= end_date]
    
    if categories:
        logs = [l for l in logs if l['category'] in categories]
    
    logs.sort(key=lambda x: x['timestamp'])
    
    # Log the export itself
    create_audit_log(
        category='SYSTEM',
        action='audit_export',
        entity_type='audit_logs',
        entity_id='bulk_export',
        changes=[{'field': 'record_count', 'old_value': None, 'new_value': len(logs)}],
        user_id=user_id,
        metadata={
            'start_date': start_date,
            'end_date': end_date,
            'categories': categories,
            'format': format_type
        }
    )
    
    return jsonify({
        'success': True,
        'export': {
            'record_count': len(logs),
            'period': {'start': start_date, 'end': end_date},
            'categories': categories or 'all',
            'format': format_type,
            'data': logs
        }
    })
