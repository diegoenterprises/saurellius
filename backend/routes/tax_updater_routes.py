# Tax Auto-Updater Routes
# API endpoints for tax rate auto-update management

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.tax_auto_updater_service import tax_auto_updater

tax_updater_bp = Blueprint('tax_updater', __name__)


@tax_updater_bp.route('/api/tax-updater/status', methods=['GET'])
@jwt_required()
def get_updater_status():
    """Get current status of the tax auto-updater."""
    status = tax_auto_updater.get_update_status()
    return jsonify({'success': True, 'status': status}), 200


@tax_updater_bp.route('/api/tax-updater/rates', methods=['GET'])
@jwt_required()
def get_current_rates():
    """Get current tax rates for a jurisdiction."""
    country = request.args.get('country', 'usa')
    jurisdiction = request.args.get('jurisdiction')
    
    rates = tax_auto_updater.get_current_rates(country, jurisdiction)
    return jsonify({'success': True, 'rates': rates}), 200


@tax_updater_bp.route('/api/tax-updater/jurisdictions', methods=['GET'])
@jwt_required()
def get_supported_jurisdictions():
    """Get list of supported jurisdictions."""
    jurisdictions = tax_auto_updater.get_supported_jurisdictions()
    return jsonify({'success': True, 'jurisdictions': jurisdictions}), 200


@tax_updater_bp.route('/api/tax-updater/force-update', methods=['POST'])
@jwt_required()
def force_update():
    """Force an immediate tax rate update check."""
    result = tax_auto_updater.force_update()
    return jsonify({'success': True, 'result': result}), 200


@tax_updater_bp.route('/api/tax-updater/start', methods=['POST'])
@jwt_required()
def start_auto_updater():
    """Start the background auto-updater."""
    data = request.get_json() or {}
    interval = data.get('interval_hours', 24)
    
    started = tax_auto_updater.start_auto_updater(interval)
    return jsonify({
        'success': True,
        'started': started,
        'interval_hours': interval
    }), 200


@tax_updater_bp.route('/api/tax-updater/stop', methods=['POST'])
@jwt_required()
def stop_auto_updater():
    """Stop the background auto-updater."""
    tax_auto_updater.stop_auto_updater()
    return jsonify({'success': True, 'message': 'Auto-updater stopped'}), 200
