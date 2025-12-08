"""
SAURELLIUS AI ROUTES
API endpoints for Saurellius AI-powered features
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.gemini_service import saurellius_ai

ai_bp = Blueprint('ai', __name__)


# =============================================================================
#  CHATBOT / ASSISTANT
# =============================================================================

@ai_bp.route('/api/ai/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    """AI-powered payroll assistant chatbot."""
    data = request.get_json()
    message = data.get('message', '')
    context = data.get('context', {})
    
    if not message:
        return jsonify({'success': False, 'message': 'Message is required'}), 400
    
    response = saurellius_ai.chat_assistant(message, context)
    
    return jsonify({
        'success': True,
        'response': response,
        'timestamp': data.get('timestamp')
    }), 200


@ai_bp.route('/api/ai/quick-help', methods=['POST'])
@jwt_required()
def ai_quick_help():
    """Get quick AI help for a specific topic."""
    data = request.get_json()
    topic = data.get('topic', '')
    
    quick_prompts = {
        'w4': "Explain how to fill out a W-4 form correctly",
        'overtime': "Explain overtime pay rules and calculations",
        'deductions': "Explain common payroll deductions",
        'taxes': "Explain payroll taxes (FICA, federal, state)",
        'i9': "Explain I-9 form requirements and deadlines",
        'direct_deposit': "Explain how to set up direct deposit",
    }
    
    prompt = quick_prompts.get(topic, f"Explain {topic} in payroll context")
    response = saurellius_ai.chat_assistant(prompt)
    
    return jsonify({
        'success': True,
        'topic': topic,
        'response': response
    }), 200


# =============================================================================
#  PAYSTUB INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/paystub/validate', methods=['POST'])
@jwt_required()
def validate_paystub():
    """AI-powered paystub validation."""
    data = request.get_json()
    paystub_data = data.get('paystub', {})
    
    result = saurellius_ai.validate_paystub_data(paystub_data)
    
    return jsonify({
        'success': True,
        'validation': result
    }), 200


@ai_bp.route('/api/ai/paystub/explain', methods=['POST'])
@jwt_required()
def explain_paystub():
    """Get AI explanation of a paystub."""
    data = request.get_json()
    paystub_data = data.get('paystub', {})
    
    explanation = saurellius_ai.explain_paystub(paystub_data)
    
    return jsonify({
        'success': True,
        'explanation': explanation
    }), 200


@ai_bp.route('/api/ai/paystub/suggest-corrections', methods=['POST'])
@jwt_required()
def suggest_corrections():
    """Get AI suggestions to fix paystub errors."""
    data = request.get_json()
    paystub_data = data.get('paystub', {})
    errors = data.get('errors', [])
    
    suggestions = saurellius_ai.suggest_paystub_corrections(paystub_data, errors)
    
    return jsonify({
        'success': True,
        'corrections': suggestions
    }), 200


# =============================================================================
#  DASHBOARD INSIGHTS
# =============================================================================

@ai_bp.route('/api/ai/dashboard/insights', methods=['POST'])
@jwt_required()
def dashboard_insights():
    """Get AI-powered dashboard insights."""
    data = request.get_json()
    metrics = data.get('metrics', {})
    
    insights = saurellius_ai.generate_dashboard_insights(metrics)
    
    return jsonify({
        'success': True,
        'insights': insights
    }), 200


# =============================================================================
#  COMPLIANCE
# =============================================================================

@ai_bp.route('/api/ai/compliance/check', methods=['POST'])
@jwt_required()
def check_compliance():
    """AI-powered compliance check."""
    data = request.get_json()
    state = data.get('state', '')
    business_info = data.get('business_info', {})
    
    if not state:
        return jsonify({'success': False, 'message': 'State is required'}), 400
    
    result = saurellius_ai.check_state_compliance(state, business_info)
    
    return jsonify({
        'success': True,
        'compliance': result
    }), 200


@ai_bp.route('/api/ai/compliance/explain/<state>/<rule_type>', methods=['GET'])
@jwt_required()
def explain_rule(state: str, rule_type: str):
    """Get AI explanation of a state rule."""
    explanation = saurellius_ai.explain_state_rule(state, rule_type)
    
    return jsonify({
        'success': True,
        'state': state,
        'rule_type': rule_type,
        'explanation': explanation
    }), 200


# =============================================================================
#  EMPLOYEE MANAGEMENT
# =============================================================================

@ai_bp.route('/api/ai/employee/analyze', methods=['POST'])
@jwt_required()
def analyze_employee():
    """AI analysis of employee data."""
    data = request.get_json()
    employee_data = data.get('employee', {})
    
    analysis = saurellius_ai.analyze_employee_data(employee_data)
    
    return jsonify({
        'success': True,
        'analysis': analysis
    }), 200


@ai_bp.route('/api/ai/employee/onboarding-checklist', methods=['POST'])
@jwt_required()
def onboarding_checklist():
    """Generate AI-powered onboarding checklist."""
    data = request.get_json()
    state = data.get('state', 'CA')
    employee_type = data.get('employee_type', 'full-time')
    
    checklist = saurellius_ai.generate_onboarding_checklist(state, employee_type)
    
    return jsonify({
        'success': True,
        'state': state,
        'employee_type': employee_type,
        'checklist': checklist
    }), 200


# =============================================================================
# 🧮 TAX INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/tax/explain', methods=['POST'])
@jwt_required()
def explain_taxes():
    """Get AI explanation of tax calculations."""
    data = request.get_json()
    tax_breakdown = data.get('tax_breakdown', {})
    
    explanation = saurellius_ai.explain_tax_calculation(tax_breakdown)
    
    return jsonify({
        'success': True,
        'explanation': explanation
    }), 200


@ai_bp.route('/api/ai/tax/optimize', methods=['POST'])
@jwt_required()
def optimize_withholding():
    """Get AI suggestions for optimizing withholding."""
    data = request.get_json()
    employee_info = data.get('employee_info', {})
    
    optimization = saurellius_ai.optimize_withholding(employee_info)
    
    return jsonify({
        'success': True,
        'optimization': optimization
    }), 200


# =============================================================================
#  FRAUD DETECTION
# =============================================================================

@ai_bp.route('/api/ai/fraud/detect', methods=['POST'])
@jwt_required()
def detect_fraud():
    """AI-powered anomaly detection in paystubs."""
    data = request.get_json()
    paystub_history = data.get('paystub_history', [])
    
    result = saurellius_ai.detect_anomalies(paystub_history)
    
    return jsonify({
        'success': True,
        'analysis': result
    }), 200


# =============================================================================
#  NATURAL LANGUAGE QUERIES
# =============================================================================

@ai_bp.route('/api/ai/query', methods=['POST'])
@jwt_required()
def natural_query():
    """Process natural language queries about payroll."""
    data = request.get_json()
    query = data.get('query', '')
    available_data = data.get('available_data', {})
    
    if not query:
        return jsonify({'success': False, 'message': 'Query is required'}), 400
    
    result = saurellius_ai.process_natural_query(query, available_data)
    
    return jsonify({
        'success': True,
        'parsed_query': result
    }), 200


# =============================================================================
#  DOCUMENT ANALYSIS
# =============================================================================

@ai_bp.route('/api/ai/document/analyze', methods=['POST'])
@jwt_required()
def analyze_document():
    """AI-powered document analysis."""
    data = request.get_json()
    document_text = data.get('document_text', '')
    doc_type = data.get('doc_type', 'unknown')
    
    if not document_text:
        return jsonify({'success': False, 'message': 'Document text is required'}), 400
    
    result = saurellius_ai.analyze_uploaded_document(document_text, doc_type)
    
    return jsonify({
        'success': True,
        'analysis': result
    }), 200


# =============================================================================
#  RECOMMENDATIONS
# =============================================================================

@ai_bp.route('/api/ai/recommend/plan', methods=['POST'])
@jwt_required()
def recommend_plan():
    """Get AI-powered plan recommendation."""
    data = request.get_json()
    usage_data = data.get('usage_data', {})
    
    recommendation = saurellius_ai.get_plan_recommendation(usage_data)
    
    return jsonify({
        'success': True,
        'recommendation': recommendation
    }), 200


# =============================================================================
#  AI STATUS
# =============================================================================

@ai_bp.route('/api/ai/status', methods=['GET'])
@jwt_required()
def ai_status():
    """Check AI service status."""
    return jsonify({
        'success': True,
        'ai_enabled': saurellius_ai.initialized,
        'model': 'gemini-1.5-flash' if saurellius_ai.initialized else None,
        'features': [
            'chat_assistant',
            'paystub_validation',
            'paystub_explanation',
            'dashboard_insights',
            'compliance_check',
            'employee_analysis',
            'tax_explanation',
            'fraud_detection',
            'natural_queries',
            'document_analysis',
            'plan_recommendations'
        ] if saurellius_ai.initialized else []
    }), 200
