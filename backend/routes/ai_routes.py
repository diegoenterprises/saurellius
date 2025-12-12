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
# TAX INTELLIGENCE
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

# =============================================================================
#  DIGITAL WALLET INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/wallet/analyze-transaction', methods=['POST'])
@jwt_required()
def analyze_wallet_transaction():
    """AI-powered wallet transaction analysis for fraud detection."""
    data = request.get_json()
    transaction = data.get('transaction', {})
    history = data.get('history', [])
    
    result = saurellius_ai.analyze_wallet_transaction(transaction, history)
    
    return jsonify({
        'success': True,
        'analysis': result
    }), 200


@ai_bp.route('/api/ai/wallet/insights', methods=['POST'])
@jwt_required()
def wallet_insights():
    """Get AI-powered wallet insights and recommendations."""
    data = request.get_json()
    wallet_data = data.get('wallet_data', {})
    
    insights = saurellius_ai.get_wallet_insights(wallet_data)
    
    return jsonify({
        'success': True,
        'insights': insights
    }), 200


@ai_bp.route('/api/ai/wallet/analyze-ewa', methods=['POST'])
@jwt_required()
def analyze_ewa_request():
    """AI analysis of Earned Wage Access requests."""
    data = request.get_json()
    request_data = data.get('request', {})
    employee_history = data.get('employee_history', {})
    
    analysis = saurellius_ai.analyze_ewa_request(request_data, employee_history)
    
    return jsonify({
        'success': True,
        'analysis': analysis
    }), 200


# =============================================================================
#  WORKFORCE SCHEDULING INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/schedule/optimize', methods=['POST'])
@jwt_required()
def optimize_schedule():
    """AI-powered schedule optimization."""
    data = request.get_json()
    schedule_data = data.get('schedule', {})
    
    optimization = saurellius_ai.optimize_schedule(schedule_data)
    
    return jsonify({
        'success': True,
        'optimization': optimization
    }), 200


@ai_bp.route('/api/ai/schedule/predict', methods=['POST'])
@jwt_required()
def predict_scheduling_needs():
    """AI prediction of future scheduling needs."""
    data = request.get_json()
    historical_data = data.get('historical_data', {})
    
    prediction = saurellius_ai.predict_scheduling_needs(historical_data)
    
    return jsonify({
        'success': True,
        'prediction': prediction
    }), 200


@ai_bp.route('/api/ai/schedule/analyze-swap', methods=['POST'])
@jwt_required()
def analyze_shift_swap():
    """AI analysis of shift swap requests."""
    data = request.get_json()
    swap_request = data.get('swap_request', {})
    
    analysis = saurellius_ai.analyze_shift_swap(swap_request)
    
    return jsonify({
        'success': True,
        'analysis': analysis
    }), 200


# =============================================================================
#  SMART NOTIFICATIONS & ALERTS
# =============================================================================

@ai_bp.route('/api/ai/alerts/generate', methods=['POST'])
@jwt_required()
def generate_smart_alerts():
    """Generate AI-powered smart alerts."""
    data = request.get_json()
    platform_data = data.get('platform_data', {})
    
    alerts = saurellius_ai.generate_smart_alerts(platform_data)
    
    return jsonify({
        'success': True,
        'alerts': alerts
    }), 200


@ai_bp.route('/api/ai/notifications/preferences', methods=['POST'])
@jwt_required()
def analyze_notification_preferences():
    """AI analysis of notification preferences."""
    data = request.get_json()
    user_behavior = data.get('user_behavior', {})
    
    preferences = saurellius_ai.analyze_notification_preferences(user_behavior)
    
    return jsonify({
        'success': True,
        'preferences': preferences
    }), 200


# =============================================================================
#  ENHANCED PAYROLL INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/payroll/analyze-run', methods=['POST'])
@jwt_required()
def analyze_payroll_run():
    """Comprehensive AI analysis of payroll run before processing."""
    data = request.get_json()
    payroll_data = data.get('payroll_data', {})
    
    analysis = saurellius_ai.analyze_payroll_run(payroll_data)
    
    return jsonify({
        'success': True,
        'analysis': analysis
    }), 200


@ai_bp.route('/api/ai/payroll/optimizations', methods=['POST'])
@jwt_required()
def suggest_payroll_optimizations():
    """AI suggestions for payroll optimizations."""
    data = request.get_json()
    company_data = data.get('company_data', {})
    
    optimizations = saurellius_ai.suggest_payroll_optimizations(company_data)
    
    return jsonify({
        'success': True,
        'optimizations': optimizations
    }), 200


# =============================================================================
#  CONTEXTUAL CHAT (ENHANCED)
# =============================================================================

@ai_bp.route('/api/ai/chat/contextual', methods=['POST'])
@jwt_required()
def contextual_chat():
    """Enhanced AI chat with full platform context."""
    data = request.get_json()
    message = data.get('message', '')
    full_context = data.get('context', {})
    
    if not message:
        return jsonify({'success': False, 'message': 'Message is required'}), 400
    
    response = saurellius_ai.contextual_chat(message, full_context)
    
    return jsonify({
        'success': True,
        'response': response
    }), 200


# =============================================================================
#  AI STATUS
# =============================================================================

# =============================================================================
#  TALENT MANAGEMENT INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/talent/analyze-candidate', methods=['POST'])
@jwt_required()
def analyze_candidate():
    """AI-powered candidate analysis and scoring."""
    data = request.get_json()
    candidate_data = data.get('candidate', {})
    job_data = data.get('job', {})
    
    analysis = saurellius_ai.analyze_candidate(candidate_data, job_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


@ai_bp.route('/api/ai/talent/generate-review', methods=['POST'])
@jwt_required()
def generate_performance_review():
    """AI-assisted performance review generation."""
    data = request.get_json()
    employee_data = data.get('employee', {})
    metrics = data.get('metrics', {})
    
    review = saurellius_ai.generate_performance_review(employee_data, metrics)
    
    return jsonify({'success': True, 'review': review}), 200


@ai_bp.route('/api/ai/talent/learning-path', methods=['POST'])
@jwt_required()
def suggest_learning_path():
    """AI-powered learning path recommendations."""
    data = request.get_json()
    employee_data = data.get('employee', {})
    career_goals = data.get('career_goals', [])
    
    path = saurellius_ai.suggest_learning_path(employee_data, career_goals)
    
    return jsonify({'success': True, 'learning_path': path}), 200


# =============================================================================
#  EMPLOYEE EXPERIENCE INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/experience/financial-wellness', methods=['POST'])
@jwt_required()
def analyze_financial_wellness():
    """AI analysis of employee financial wellness."""
    data = request.get_json()
    employee_data = data.get('employee', {})
    
    analysis = saurellius_ai.analyze_financial_wellness(employee_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


@ai_bp.route('/api/ai/experience/survey-analysis', methods=['POST'])
@jwt_required()
def analyze_survey():
    """AI analysis of engagement survey responses."""
    data = request.get_json()
    survey_data = data.get('survey', {})
    
    analysis = saurellius_ai.analyze_survey_responses(survey_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


# =============================================================================
#  JOB COSTING & LABOR INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/labor/project-profitability', methods=['POST'])
@jwt_required()
def analyze_project():
    """AI analysis of project profitability."""
    data = request.get_json()
    project_data = data.get('project', {})
    
    analysis = saurellius_ai.analyze_project_profitability(project_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


@ai_bp.route('/api/ai/labor/forecast', methods=['POST'])
@jwt_required()
def forecast_labor():
    """AI-powered labor demand forecasting."""
    data = request.get_json()
    historical_data = data.get('historical', {})
    
    forecast = saurellius_ai.forecast_labor_needs(historical_data)
    
    return jsonify({'success': True, 'forecast': forecast}), 200


# =============================================================================
#  BENEFITS & RETIREMENT INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/benefits/optimize-selection', methods=['POST'])
@jwt_required()
def optimize_benefits():
    """AI-powered benefits selection recommendations."""
    data = request.get_json()
    employee_data = data.get('employee', {})
    available_plans = data.get('plans', [])
    
    recommendations = saurellius_ai.optimize_benefits_selection(employee_data, available_plans)
    
    return jsonify({'success': True, 'recommendations': recommendations}), 200


@ai_bp.route('/api/ai/benefits/retirement-readiness', methods=['POST'])
@jwt_required()
def analyze_retirement():
    """AI analysis of retirement readiness."""
    data = request.get_json()
    employee_data = data.get('employee', {})
    
    analysis = saurellius_ai.analyze_retirement_readiness(employee_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


# =============================================================================
#  CONTRACTOR INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/contractor/analyze', methods=['POST'])
@jwt_required()
def analyze_contractor():
    """AI analysis of contractor relationships and compliance."""
    data = request.get_json()
    contractor_data = data.get('contractor', {})
    
    analysis = saurellius_ai.analyze_contractor_relationship(contractor_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


# =============================================================================
#  TAX INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/tax/analyze', methods=['POST'])
@jwt_required()
def analyze_tax_situation():
    """AI analysis of company tax situation."""
    data = request.get_json()
    company_data = data.get('company', {})
    
    analysis = saurellius_ai.analyze_tax_situation(company_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


# =============================================================================
#  UNIVERSAL ASSISTANT
# =============================================================================

@ai_bp.route('/api/ai/assistant', methods=['POST'])
@jwt_required()
def universal_assistant():
    """Universal AI assistant with full platform awareness."""
    data = request.get_json()
    message = data.get('message', '')
    context = data.get('context', {})
    
    if not message:
        return jsonify({'success': False, 'message': 'Message is required'}), 400
    
    response = saurellius_ai.universal_assistant(message, context)
    
    return jsonify({'success': True, 'response': response}), 200


# =============================================================================
#  REGULATORY FILING INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/regulatory/compliance-analysis', methods=['POST'])
@jwt_required()
def analyze_compliance():
    """AI analysis of regulatory compliance status."""
    data = request.get_json()
    company_data = data.get('company', {})
    
    analysis = saurellius_ai.analyze_compliance_status(company_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


@ai_bp.route('/api/ai/regulatory/deadline-guidance', methods=['POST'])
@jwt_required()
def deadline_guidance():
    """AI guidance for filing deadlines."""
    data = request.get_json()
    deadline_data = data.get('deadline', {})
    
    guidance = saurellius_ai.analyze_filing_deadline(deadline_data)
    
    return jsonify({'success': True, 'guidance': guidance}), 200


@ai_bp.route('/api/ai/regulatory/explain-form', methods=['POST'])
@jwt_required()
def explain_form():
    """AI explanation of tax forms."""
    data = request.get_json()
    form_type = data.get('form_type', '')
    form_data = data.get('form_data')
    
    if not form_type:
        return jsonify({'success': False, 'error': 'Form type required'}), 400
    
    explanation = saurellius_ai.explain_tax_form(form_type, form_data)
    
    return jsonify({'success': True, 'explanation': explanation}), 200


@ai_bp.route('/api/ai/regulatory/deposit-analysis', methods=['POST'])
@jwt_required()
def analyze_deposit():
    """AI analysis of EFTPS deposit requirements."""
    data = request.get_json()
    payroll_data = data.get('payroll', {})
    
    analysis = saurellius_ai.analyze_deposit_schedule(payroll_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


@ai_bp.route('/api/ai/regulatory/1099-readiness', methods=['POST'])
@jwt_required()
def analyze_1099_readiness():
    """AI analysis of 1099 filing readiness."""
    data = request.get_json()
    contractor_data = data.get('contractors', {})
    
    analysis = saurellius_ai.analyze_1099_readiness(contractor_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


# =============================================================================
#  DOCUMENT INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/document/analyze', methods=['POST'])
@jwt_required()
def analyze_document():
    """AI analysis and classification of uploaded documents."""
    data = request.get_json()
    document_data = data.get('document', {})
    
    analysis = saurellius_ai.analyze_document(document_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


@ai_bp.route('/api/ai/document/extract-receipt', methods=['POST'])
@jwt_required()
def extract_receipt():
    """AI extraction of data from receipts."""
    data = request.get_json()
    receipt_data = data.get('receipt', {})
    
    extraction = saurellius_ai.extract_receipt_data(receipt_data)
    
    return jsonify({'success': True, 'extraction': extraction}), 200


@ai_bp.route('/api/ai/document/classify', methods=['POST'])
@jwt_required()
def classify_document():
    """AI classification of documents."""
    data = request.get_json()
    document_info = data.get('document', {})
    
    classification = saurellius_ai.classify_document(document_info)
    
    return jsonify({'success': True, 'classification': classification}), 200


# =============================================================================
#  CONTRACTOR EXPENSE INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/contractor/expense-analysis', methods=['POST'])
@jwt_required()
def analyze_contractor_expenses():
    """AI analysis of contractor expenses for tax optimization."""
    data = request.get_json()
    expense_data = data.get('expenses', {})
    
    analysis = saurellius_ai.analyze_contractor_expenses(expense_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


# =============================================================================
#  PAYROLL OPTIMIZATION INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/payroll/optimize', methods=['POST'])
@jwt_required()
def optimize_payroll():
    """AI optimization suggestions for payroll runs."""
    data = request.get_json()
    payroll_data = data.get('payroll', {})
    
    optimization = saurellius_ai.optimize_payroll_run(payroll_data)
    
    return jsonify({'success': True, 'optimization': optimization}), 200


@ai_bp.route('/api/ai/payroll/labor-analysis', methods=['POST'])
@jwt_required()
def analyze_labor():
    """AI analysis of labor costs and workforce efficiency."""
    data = request.get_json()
    labor_data = data.get('labor', {})
    
    analysis = saurellius_ai.analyze_labor_costs(labor_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


# =============================================================================
#  EMPLOYEE SELF-SERVICE INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/employee/portal-engagement', methods=['POST'])
@jwt_required()
def analyze_portal_engagement():
    """AI analysis of employee portal engagement."""
    data = request.get_json()
    usage_data = data.get('usage', {})
    
    analysis = saurellius_ai.analyze_employee_portal_usage(usage_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


@ai_bp.route('/api/ai/employee/personalized-dashboard', methods=['POST'])
@jwt_required()
def personalize_dashboard():
    """AI-powered personalized dashboard for employees."""
    data = request.get_json()
    employee_data = data.get('employee', {})
    
    recommendations = saurellius_ai.personalize_employee_dashboard(employee_data)
    
    return jsonify({'success': True, 'recommendations': recommendations}), 200


# =============================================================================
#  ONBOARDING INTELLIGENCE
# =============================================================================

@ai_bp.route('/api/ai/onboarding/analyze', methods=['POST'])
@jwt_required()
def analyze_onboarding():
    """AI analysis of employee onboarding progress."""
    data = request.get_json()
    onboarding_data = data.get('onboarding', {})
    
    analysis = saurellius_ai.analyze_onboarding_progress(onboarding_data)
    
    return jsonify({'success': True, 'analysis': analysis}), 200


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
            # Core
            'chat_assistant',
            'contextual_chat',
            'universal_assistant',
            'paystub_validation',
            'paystub_explanation',
            'dashboard_insights',
            # Compliance
            'compliance_check',
            'tax_explanation',
            'tax_situation_analysis',
            'fraud_detection',
            # Regulatory Filing (NEW)
            'regulatory_compliance_analysis',
            'filing_deadline_guidance',
            'tax_form_explanation',
            'eftps_deposit_analysis',
            '1099_readiness_analysis',
            # Document Intelligence (NEW)
            'document_analysis',
            'document_classification',
            'receipt_extraction',
            # Employee
            'employee_analysis',
            'employee_portal_engagement',
            'personalized_dashboard',
            'onboarding_analysis',
            # Payroll (NEW)
            'payroll_optimization',
            'labor_cost_analysis',
            # Contractor (NEW)
            'contractor_analysis',
            'contractor_expense_analysis',
            # Scheduling
            'natural_queries',
            'plan_recommendations',
            'schedule_optimization',
            'scheduling_predictions',
            'shift_swap_analysis',
            # Wallet
            'wallet_transaction_analysis',
            'wallet_insights',
            'ewa_analysis',
            # Alerts
            'smart_alerts',
            'notification_preferences',
            # Payroll Run
            'payroll_run_analysis',
            'payroll_optimizations',
            # Talent
            'candidate_analysis',
            'performance_review_generation',
            'learning_path_suggestions',
            # Experience
            'financial_wellness_analysis',
            'survey_analysis',
            # Labor
            'project_profitability',
            'labor_forecasting',
            # Benefits
            'benefits_optimization',
            'retirement_readiness'
        ] if saurellius_ai.initialized else [],
        'total_features': 50 if saurellius_ai.initialized else 0
    }), 200
