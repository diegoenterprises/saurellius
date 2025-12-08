"""
PAYSTUB GENERATOR ROUTES
API endpoints for generating secure, Snappt-compliant paystubs
"""

import os
import tempfile
import uuid
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.paystub_generator import paystub_generator, COLOR_THEMES, number_to_words

paystub_gen_bp = Blueprint('paystub_generator', __name__)


# =============================================================================
# THEME ENDPOINTS
# =============================================================================

@paystub_gen_bp.route('/api/paystub-generator/themes', methods=['GET'])
@jwt_required()
def get_themes():
    """Get all available color themes"""
    themes = paystub_generator.get_available_themes()
    return jsonify({
        'success': True,
        'themes': themes,
        'total': len(themes),
        'default': 'diego_original'
    }), 200


@paystub_gen_bp.route('/api/paystub-generator/themes/<theme_key>', methods=['GET'])
@jwt_required()
def get_theme_details(theme_key: str):
    """Get details for a specific theme"""
    if theme_key not in COLOR_THEMES:
        return jsonify({
            'success': False,
            'message': f'Theme not found: {theme_key}'
        }), 404
    
    theme = COLOR_THEMES[theme_key]
    return jsonify({
        'success': True,
        'theme_key': theme_key,
        'theme': theme
    }), 200


# =============================================================================
# PAYSTUB GENERATION ENDPOINTS
# =============================================================================

@paystub_gen_bp.route('/api/paystub-generator/generate', methods=['POST'])
@jwt_required()
def generate_paystub():
    """
    Generate a paystub PDF with security features.
    
    Request body:
    {
        "company": {
            "name": "COMPANY NAME",
            "address": "123 Main St, City, State ZIP"
        },
        "employee": {
            "name": "EMPLOYEE NAME",
            "state": "CA",
            "ssn_masked": "XXX-XX-1234"
        },
        "pay_info": {
            "period_start": "01/01/2025",
            "period_end": "01/15/2025",
            "pay_date": "01/20/2025"
        },
        "check_info": {
            "number": "1001"
        },
        "earnings": [
            {
                "description": "Regular Earnings",
                "rate": "25.00",
                "hours": "80",
                "current": 2000.00,
                "ytd": 24000.00
            }
        ],
        "deductions": [
            {
                "description": "Federal Tax",
                "type": "Statutory",
                "current": 300.00,
                "ytd": 3600.00
            }
        ],
        "totals": {
            "gross_pay": 2000.00,
            "gross_pay_ytd": 24000.00,
            "net_pay": 1700.00,
            "net_pay_ytd": 20400.00
        },
        "theme": "diego_original"  // optional
    }
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['company', 'employee', 'pay_info', 'check_info', 'earnings', 'deductions', 'totals']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    # Get theme (default to diego_original)
    theme = data.get('theme', 'diego_original')
    if theme not in COLOR_THEMES:
        theme = 'diego_original'
    
    # Add amount_words if not present
    if 'amount_words' not in data['totals']:
        data['totals']['amount_words'] = number_to_words(data['totals']['net_pay'])
    
    # Generate unique filename
    paystub_id = str(uuid.uuid4())[:8]
    filename = f"paystub_{paystub_id}.pdf"
    
    # Create temp directory for output
    output_dir = tempfile.mkdtemp()
    output_path = os.path.join(output_dir, filename)
    
    # Generate the paystub
    result = paystub_generator.generate_paystub_pdf(data, output_path, theme)
    
    if not result['success']:
        return jsonify({
            'success': False,
            'message': result.get('error', 'Failed to generate paystub')
        }), 500
    
    # Return the PDF file
    return send_file(
        output_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )


@paystub_gen_bp.route('/api/paystub-generator/generate-with-metadata', methods=['POST'])
@jwt_required()
def generate_paystub_with_metadata():
    """
    Generate a paystub and return metadata (without downloading).
    Returns verification info and file can be downloaded separately.
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['company', 'employee', 'pay_info', 'check_info', 'earnings', 'deductions', 'totals']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    theme = data.get('theme', 'diego_original')
    if theme not in COLOR_THEMES:
        theme = 'diego_original'
    
    if 'amount_words' not in data['totals']:
        data['totals']['amount_words'] = number_to_words(data['totals']['net_pay'])
    
    paystub_id = str(uuid.uuid4())[:8]
    filename = f"paystub_{paystub_id}.pdf"
    
    output_dir = tempfile.mkdtemp()
    output_path = os.path.join(output_dir, filename)
    
    result = paystub_generator.generate_paystub_pdf(data, output_path, theme)
    
    if not result['success']:
        return jsonify({
            'success': False,
            'message': result.get('error', 'Failed to generate paystub')
        }), 500
    
    # Store file path for later download (in production, use S3 or similar)
    # For now, return metadata
    return jsonify({
        'success': True,
        'paystub_id': paystub_id,
        'verification_id': result['verification_id'],
        'document_hash': result['document_hash'],
        'tamper_seal': result['tamper_seal'],
        'theme': result['theme'],
        'theme_key': result['theme_key'],
        'file_size': result['file_size'],
        'generator': result['generator'],
        'snappt_compliant': result['snappt_compliant'],
        'generated_at': result['generated_at'],
        'download_url': f'/api/paystub-generator/download/{paystub_id}'
    }), 200


@paystub_gen_bp.route('/api/paystub-generator/preview', methods=['POST'])
@jwt_required()
def preview_paystub():
    """
    Generate HTML preview of a paystub (for display in browser/app).
    Does not generate PDF, just returns HTML.
    """
    data = request.get_json()
    
    required_fields = ['company', 'employee', 'pay_info', 'check_info', 'earnings', 'deductions', 'totals']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400
    
    theme = data.get('theme', 'diego_original')
    if theme not in COLOR_THEMES:
        theme = 'diego_original'
    
    if 'amount_words' not in data['totals']:
        data['totals']['amount_words'] = number_to_words(data['totals']['net_pay'])
    
    # Generate preview elements
    verification_id = paystub_generator.anti_tamper.generate_verification_id()
    document_hash = paystub_generator.anti_tamper.generate_document_fingerprint(data)[:12].upper()
    qr_base64 = paystub_generator.generate_verification_qr(data, verification_id)
    
    # Generate HTML
    html_content = paystub_generator.generate_html(data, theme, qr_base64, verification_id, document_hash)
    
    return jsonify({
        'success': True,
        'html': html_content,
        'theme': COLOR_THEMES[theme]['name'],
        'verification_id': verification_id,
        'document_hash': document_hash
    }), 200


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@paystub_gen_bp.route('/api/paystub-generator/amount-to-words', methods=['POST'])
@jwt_required()
def convert_amount_to_words():
    """Convert a dollar amount to words for check stubs"""
    data = request.get_json()
    amount = data.get('amount', 0)
    
    try:
        words = number_to_words(float(amount))
        return jsonify({
            'success': True,
            'amount': amount,
            'words': words
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400


@paystub_gen_bp.route('/api/paystub-generator/verify', methods=['POST'])
@jwt_required()
def verify_paystub():
    """
    Verify a paystub hasn't been tampered with.
    Requires the document data and tamper seal.
    """
    data = request.get_json()
    document_data = data.get('document_data', {})
    seal = data.get('tamper_seal', '')
    
    if not document_data or not seal:
        return jsonify({
            'success': False,
            'message': 'Missing document_data or tamper_seal'
        }), 400
    
    is_valid = paystub_generator.anti_tamper.verify_document(document_data, seal)
    
    return jsonify({
        'success': True,
        'verified': is_valid,
        'message': 'Document integrity verified' if is_valid else 'Document may have been tampered with'
    }), 200


@paystub_gen_bp.route('/api/paystub-generator/status', methods=['GET'])
@jwt_required()
def generator_status():
    """Check paystub generator status and capabilities"""
    from services.paystub_generator import HAS_PLAYWRIGHT, HAS_QR
    
    return jsonify({
        'success': True,
        'status': 'operational' if HAS_PLAYWRIGHT else 'limited',
        'capabilities': {
            'pdf_generation': HAS_PLAYWRIGHT,
            'qr_codes': HAS_QR,
            'themes_available': len(COLOR_THEMES),
            'security_features': [
                'qr_verification',
                'tamper_proof_seal',
                'document_fingerprint',
                'hologram_seal',
                'security_watermarks',
                'microtext_security',
                'void_pattern',
                'anti_copy_pattern'
            ]
        },
        'version': paystub_generator.version
    }), 200
