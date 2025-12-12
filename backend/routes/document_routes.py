"""
DOCUMENT ROUTES
Secure document upload, download, and management endpoints
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from io import BytesIO
from services.document_storage_service import document_storage

document_bp = Blueprint('documents', __name__, url_prefix='/api/documents')


# ============================================================================
# UPLOAD ENDPOINTS
# ============================================================================

@document_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    """
    Upload a document.
    Accepts multipart/form-data with file or JSON with base64 data.
    """
    user_id = get_jwt_identity()
    
    # Check if multipart form data (file upload)
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        user_type = request.form.get('user_type', 'employee')
        category = request.form.get('category', 'personal')
        metadata = {}
        
        if request.form.get('description'):
            metadata['description'] = request.form.get('description')
        if request.form.get('tags'):
            metadata['tags'] = request.form.get('tags').split(',')
        
        file_data = file.read()
        result = document_storage.upload_document(
            user_id=user_id,
            user_type=user_type,
            category=category,
            filename=file.filename,
            file_data=file_data,
            metadata=metadata
        )
    
    # Check if JSON with base64 data
    elif request.is_json:
        data = request.get_json()
        
        if not data.get('file_data'):
            return jsonify({'success': False, 'error': 'No file data provided'}), 400
        
        if not data.get('filename'):
            return jsonify({'success': False, 'error': 'Filename required'}), 400
        
        result = document_storage.upload_base64_document(
            user_id=user_id,
            user_type=data.get('user_type', 'employee'),
            category=data.get('category', 'personal'),
            filename=data['filename'],
            base64_data=data['file_data'],
            metadata=data.get('metadata', {})
        )
    
    else:
        return jsonify({'success': False, 'error': 'Invalid request format'}), 400
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


@document_bp.route('/upload/employee', methods=['POST'])
@jwt_required()
def upload_employee_document():
    """Upload document for employee."""
    user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    category = request.form.get('category', 'personal')
    metadata = {
        'description': request.form.get('description', ''),
        'document_date': request.form.get('document_date', '')
    }
    
    result = document_storage.upload_document(
        user_id=user_id,
        user_type='employee',
        category=category,
        filename=file.filename,
        file_data=file.read(),
        metadata=metadata
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


@document_bp.route('/upload/contractor', methods=['POST'])
@jwt_required()
def upload_contractor_document():
    """Upload document for contractor."""
    user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    category = request.form.get('category', 'receipts')
    metadata = {
        'description': request.form.get('description', ''),
        'expense_id': request.form.get('expense_id', ''),
        'invoice_id': request.form.get('invoice_id', '')
    }
    
    result = document_storage.upload_document(
        user_id=user_id,
        user_type='contractor',
        category=category,
        filename=file.filename,
        file_data=file.read(),
        metadata=metadata
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


# ============================================================================
# RETRIEVE ENDPOINTS
# ============================================================================

@document_bp.route('/', methods=['GET'])
@jwt_required()
def get_documents():
    """Get user's documents with optional filtering."""
    user_id = get_jwt_identity()
    category = request.args.get('category')
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    result = document_storage.get_user_documents(
        user_id=user_id,
        category=category,
        limit=limit,
        offset=offset
    )
    
    return jsonify({
        'success': True,
        **result
    })


@document_bp.route('/<document_id>', methods=['GET'])
@jwt_required()
def get_document(document_id):
    """Get document metadata."""
    user_id = get_jwt_identity()
    
    document = document_storage.get_document(document_id, user_id)
    
    if 'error' in document:
        return jsonify({'success': False, 'error': document['error']}), 404
    
    return jsonify({
        'success': True,
        'document': document
    })


@document_bp.route('/<document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    """Download document file."""
    user_id = get_jwt_identity()
    
    file_data, filename, content_type = document_storage.download_document(document_id, user_id)
    
    if file_data is None:
        return jsonify({'success': False, 'error': content_type}), 404
    
    return send_file(
        BytesIO(file_data),
        mimetype=content_type,
        as_attachment=True,
        download_name=filename
    )


@document_bp.route('/<document_id>/url', methods=['GET'])
@jwt_required()
def get_signed_url(document_id):
    """Get signed URL for document download."""
    user_id = get_jwt_identity()
    expires_in = request.args.get('expires_in', 3600, type=int)
    
    result = document_storage.generate_signed_url(document_id, user_id, expires_in)
    
    if not result.get('success'):
        return jsonify(result), 404
    
    return jsonify(result)


# ============================================================================
# DELETE ENDPOINT
# ============================================================================

@document_bp.route('/<document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """Delete a document."""
    user_id = get_jwt_identity()
    
    result = document_storage.delete_document(document_id, user_id)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result)


# ============================================================================
# CATEGORY ENDPOINTS
# ============================================================================

@document_bp.route('/categories/employee', methods=['GET'])
def get_employee_categories():
    """Get document categories for employees."""
    return jsonify({
        'success': True,
        'categories': document_storage.get_document_categories('employee')
    })


@document_bp.route('/categories/contractor', methods=['GET'])
def get_contractor_categories():
    """Get document categories for contractors."""
    return jsonify({
        'success': True,
        'categories': document_storage.get_document_categories('contractor')
    })


@document_bp.route('/categories/employer', methods=['GET'])
def get_employer_categories():
    """Get document categories for employers."""
    return jsonify({
        'success': True,
        'categories': document_storage.get_document_categories('employer')
    })


# ============================================================================
# BULK OPERATIONS
# ============================================================================

@document_bp.route('/bulk/upload', methods=['POST'])
@jwt_required()
def bulk_upload():
    """Upload multiple documents at once."""
    user_id = get_jwt_identity()
    
    if 'files' not in request.files:
        return jsonify({'success': False, 'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    user_type = request.form.get('user_type', 'employee')
    category = request.form.get('category', 'personal')
    
    results = []
    for file in files:
        if file.filename:
            result = document_storage.upload_document(
                user_id=user_id,
                user_type=user_type,
                category=category,
                filename=file.filename,
                file_data=file.read()
            )
            results.append({
                'filename': file.filename,
                'success': result.get('success', False),
                'document_id': result.get('document', {}).get('id') if result.get('success') else None,
                'error': result.get('error')
            })
    
    successful = len([r for r in results if r['success']])
    
    return jsonify({
        'success': True,
        'message': f'Uploaded {successful} of {len(results)} files',
        'results': results
    })


# ============================================================================
# RECEIPT SPECIFIC ENDPOINTS (for contractors)
# ============================================================================

@document_bp.route('/receipts', methods=['POST'])
@jwt_required()
def upload_receipt():
    """Upload expense receipt."""
    user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    metadata = {
        'expense_id': request.form.get('expense_id'),
        'vendor': request.form.get('vendor'),
        'amount': request.form.get('amount'),
        'date': request.form.get('date'),
        'description': request.form.get('description', '')
    }
    
    result = document_storage.upload_document(
        user_id=user_id,
        user_type='contractor',
        category='receipts',
        filename=file.filename,
        file_data=file.read(),
        metadata=metadata
    )
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 201


@document_bp.route('/receipts', methods=['GET'])
@jwt_required()
def get_receipts():
    """Get all receipts."""
    user_id = get_jwt_identity()
    
    result = document_storage.get_user_documents(
        user_id=user_id,
        category='receipts'
    )
    
    return jsonify({
        'success': True,
        **result
    })
