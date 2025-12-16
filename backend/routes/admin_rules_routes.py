""" 
ADMIN RULES ROUTES
Admin-only endpoints to manage versioned, effective-dated payroll/tax/compliance rulesets.

Operation Fill The Gaps (2026):
- Seed authoritative IRS 2026 federal withholding rules into DB
- Fetch active ruleset by key/date
"""

import json
from datetime import date, datetime
from pathlib import Path

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from functools import wraps

from models import User, Ruleset, db


admin_rules_bp = Blueprint('admin_rules', __name__)


def admin_required(f):
    """Decorator to require admin access."""

    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not getattr(user, 'is_admin', False):
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)

    return decorated_function


def _parse_date(value: str) -> date:
    return datetime.fromisoformat(value).date()


def _load_repo_ruleset_json(filename: str) -> dict:
    rules_path = Path(__file__).resolve().parent.parent / 'data' / filename
    with open(rules_path, 'r', encoding='utf-8') as f:
        return json.load(f)


@admin_rules_bp.route('/api/admin/rules/seed/irs-2026-federal-withholding', methods=['POST'])
@admin_required
def seed_irs_2026_federal_withholding():
    """Seed the authoritative IRS 2026 federal withholding ruleset into the DB."""

    payload = _load_repo_ruleset_json('irs_federal_withholding_2026.json')

    key = 'irs_federal_withholding'
    jurisdiction = payload.get('jurisdiction', 'US')
    rule_type = payload.get('rule_type', 'federal_income_tax_withholding')
    version = str(payload.get('tax_year', 2026))

    effective_start = _parse_date(payload['effective_start'])
    effective_end = _parse_date(payload['effective_end']) if payload.get('effective_end') else None

    source = payload.get('source') or {}
    source_name = source.get('name')
    source_ref = source.get('local_source_file')

    admin_user_id = get_jwt_identity()

    existing = Ruleset.query.filter_by(
        key=key,
        version=version,
        effective_start=effective_start,
    ).first()

    if existing:
        existing.payload_json = json.dumps(payload)
        existing.effective_end = effective_end
        existing.source_name = source_name
        existing.source_ref = source_ref
        existing.created_by = admin_user_id
        db.session.commit()
        return jsonify({'success': True, 'seeded': False, 'ruleset': existing.to_dict()}), 200

    ruleset = Ruleset(
        key=key,
        jurisdiction=jurisdiction,
        rule_type=rule_type,
        version=version,
        effective_start=effective_start,
        effective_end=effective_end,
        source_name=source_name,
        source_ref=source_ref,
        created_by=admin_user_id,
        payload_json=json.dumps(payload),
    )

    db.session.add(ruleset)
    db.session.commit()

    return jsonify({'success': True, 'seeded': True, 'ruleset': ruleset.to_dict()}), 201


@admin_rules_bp.route('/api/admin/rulesets/active', methods=['GET'])
@admin_required
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
