""" 
RULESETS ROUTES
Authenticated endpoints for retrieving active rulesets.

Used by all user types to power dynamic tax/compliance logic without static code.
"""

from datetime import date, datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from models import Ruleset


rulesets_bp = Blueprint('rulesets', __name__)


def _parse_date(value: str) -> date:
    return datetime.fromisoformat(value).date()


@rulesets_bp.route('/api/rulesets/active', methods=['GET'])
@jwt_required()
def get_active_ruleset():
    """Get the active ruleset by key for a given date (defaults to today)."""

    key = request.args.get('key')
    if not key:
        return jsonify({'success': False, 'message': 'Missing required query param: key'}), 400

    on_date_str = request.args.get('date')
    on_date = _parse_date(on_date_str) if on_date_str else date.today()

    ruleset = (
        Ruleset.query.filter(Ruleset.key == key)
        .filter(Ruleset.effective_start <= on_date)
        .filter((Ruleset.effective_end.is_(None)) | (Ruleset.effective_end >= on_date))
        .order_by(Ruleset.effective_start.desc())
        .first()
    )

    if not ruleset:
        return jsonify({'success': True, 'ruleset': None}), 200

    return jsonify({'success': True, 'ruleset': ruleset.to_dict(), 'payload': ruleset.payload()}), 200
