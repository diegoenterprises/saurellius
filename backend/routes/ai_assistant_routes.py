"""
SAURELLIUS AI ASSISTANT ROUTES
Comprehensive AI endpoints for platform-wide intelligent assistance
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.saurellius_ai_service import get_saurellius_ai
from services.ai_memory_service import get_ai_service
from models import db
import logging

logger = logging.getLogger(__name__)

ai_assistant_bp = Blueprint('ai_assistant', __name__)


# =============================================================================
# CHAT ENDPOINTS
# =============================================================================

@ai_assistant_bp.route('/api/ai/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    """
    Main AI chat endpoint with full context awareness.
    Learns from each interaction.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'success': False, 'message': 'Message required'}), 400
    
    feature = data.get('feature', 'general')
    session_id = data.get('session_id')
    
    ai = get_saurellius_ai()
    result = ai.chat_sync(user_id, message, feature, session_id)
    
    return jsonify(result)


@ai_assistant_bp.route('/api/ai/quick-help', methods=['POST'])
@jwt_required()
def ai_quick_help():
    """
    Quick Q&A without session tracking.
    For simple questions that don't need conversation context.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    question = data.get('question', '').strip()
    if not question:
        return jsonify({'success': False, 'message': 'Question required'}), 400
    
    context_data = data.get('context')
    
    ai = get_saurellius_ai()
    answer = ai.answer_question(user_id, question, context_data)
    
    return jsonify({
        'success': True,
        'answer': answer
    })


@ai_assistant_bp.route('/api/ai/conversation/<session_id>', methods=['GET'])
@jwt_required()
def get_conversation(session_id):
    """Get conversation history for a session"""
    user_id = get_jwt_identity()
    
    memory = get_ai_service(user_id)
    history = memory.get_conversation_history(session_id)
    
    return jsonify({
        'success': True,
        'conversation': history
    })


@ai_assistant_bp.route('/api/ai/feedback', methods=['POST'])
@jwt_required()
def ai_feedback():
    """Submit feedback on AI response"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conversation_id = data.get('conversation_id')
    helpful = data.get('helpful', True)
    notes = data.get('notes')
    
    if not conversation_id:
        return jsonify({'success': False, 'message': 'conversation_id required'}), 400
    
    memory = get_ai_service(user_id)
    memory.mark_response_helpful(conversation_id, helpful, notes)
    
    return jsonify({
        'success': True,
        'message': 'Feedback recorded. Thank you for helping me improve!'
    })


# =============================================================================
# INSIGHTS ENDPOINTS
# =============================================================================

@ai_assistant_bp.route('/api/ai/insights', methods=['GET'])
@jwt_required()
def get_insights():
    """Get AI-generated insights for the user"""
    user_id = get_jwt_identity()
    
    insight_type = request.args.get('type')
    status = request.args.get('status', 'new')
    limit = int(request.args.get('limit', 20))
    
    memory = get_ai_service(user_id)
    insights = memory.get_insights(insight_type, status, limit)
    
    return jsonify({
        'success': True,
        'insights': insights
    })


@ai_assistant_bp.route('/api/ai/insights/generate', methods=['POST'])
@jwt_required()
def generate_insights():
    """Generate new AI insights based on current data"""
    user_id = get_jwt_identity()
    
    ai = get_saurellius_ai()
    insights = ai.generate_insights(user_id)
    
    return jsonify({
        'success': True,
        'insights': insights,
        'count': len(insights)
    })


@ai_assistant_bp.route('/api/ai/insights/<int:insight_id>/view', methods=['POST'])
@jwt_required()
def view_insight(insight_id):
    """Mark insight as viewed"""
    user_id = get_jwt_identity()
    
    memory = get_ai_service(user_id)
    memory.mark_insight_viewed(insight_id)
    
    return jsonify({'success': True})


@ai_assistant_bp.route('/api/ai/insights/<int:insight_id>/act', methods=['POST'])
@jwt_required()
def act_on_insight(insight_id):
    """Mark insight as acted upon"""
    user_id = get_jwt_identity()
    
    memory = get_ai_service(user_id)
    memory.mark_insight_acted(insight_id)
    
    return jsonify({'success': True})


@ai_assistant_bp.route('/api/ai/insights/<int:insight_id>/dismiss', methods=['POST'])
@jwt_required()
def dismiss_insight(insight_id):
    """Dismiss an insight"""
    user_id = get_jwt_identity()
    
    memory = get_ai_service(user_id)
    memory.dismiss_insight(insight_id)
    
    return jsonify({'success': True})


# =============================================================================
# MEMORY & LEARNING ENDPOINTS
# =============================================================================

@ai_assistant_bp.route('/api/ai/profile', methods=['GET'])
@jwt_required()
def get_ai_profile():
    """Get user's AI profile and learning status"""
    user_id = get_jwt_identity()
    
    memory = get_ai_service(user_id)
    profile = memory.profile
    
    return jsonify({
        'success': True,
        'profile': {
            'preferred_tone': profile.preferred_tone,
            'communication_style': profile.communication_style,
            'response_length': profile.response_length,
            'industry': profile.industry,
            'company_size': profile.company_size,
            'primary_use_case': profile.primary_use_case,
            'learning_level': profile.learning_level,
            'total_interactions': profile.total_interactions,
            'helpful_responses': profile.helpful_responses,
            'top_features': profile.get_feature_usage()
        }
    })


@ai_assistant_bp.route('/api/ai/profile', methods=['PUT'])
@jwt_required()
def update_ai_profile():
    """Update AI communication preferences"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    memory = get_ai_service(user_id)
    
    # Update preferences
    if 'preferred_tone' in data:
        memory.update_preferences(preferred_tone=data['preferred_tone'])
    if 'communication_style' in data:
        memory.update_preferences(communication_style=data['communication_style'])
    if 'response_length' in data:
        memory.update_preferences(response_length=data['response_length'])
    
    # Update business context
    if 'industry' in data:
        memory.set_business_context(industry=data['industry'])
    if 'company_size' in data:
        memory.set_business_context(company_size=data['company_size'])
    if 'primary_use_case' in data:
        memory.set_business_context(primary_use_case=data['primary_use_case'])
    
    return jsonify({
        'success': True,
        'message': 'AI preferences updated'
    })


@ai_assistant_bp.route('/api/ai/memories', methods=['GET'])
@jwt_required()
def get_memories():
    """Get AI memories about the user"""
    user_id = get_jwt_identity()
    
    category = request.args.get('category')
    limit = int(request.args.get('limit', 20))
    
    from models_ai import UserAIMemory
    
    query = UserAIMemory.query.filter_by(user_id=user_id)
    if category:
        query = query.filter_by(category=category)
    
    memories = query.order_by(UserAIMemory.importance.desc()).limit(limit).all()
    
    return jsonify({
        'success': True,
        'memories': [{
            'id': m.id,
            'key': m.key,
            'value': m.value,
            'type': m.memory_type,
            'category': m.category,
            'importance': m.importance,
            'source': m.source
        } for m in memories]
    })


@ai_assistant_bp.route('/api/ai/memories', methods=['POST'])
@jwt_required()
def add_memory():
    """Manually add a memory/fact for AI to remember"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    key = data.get('key')
    value = data.get('value')
    
    if not key or not value:
        return jsonify({'success': False, 'message': 'key and value required'}), 400
    
    memory = get_ai_service(user_id)
    memory.remember(
        key=key,
        value=value,
        memory_type=data.get('type', 'fact'),
        category=data.get('category', 'general'),
        importance=data.get('importance', 5),
        source='user_stated',
        confidence=1.0
    )
    
    return jsonify({
        'success': True,
        'message': f'I will remember: {key}'
    })


@ai_assistant_bp.route('/api/ai/memories/<int:memory_id>', methods=['DELETE'])
@jwt_required()
def delete_memory(memory_id):
    """Delete a specific memory"""
    user_id = get_jwt_identity()
    
    from models_ai import UserAIMemory
    
    memory = UserAIMemory.query.get(memory_id)
    if memory and memory.user_id == user_id:
        db.session.delete(memory)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Memory deleted'})
    
    return jsonify({'success': False, 'message': 'Memory not found'}), 404


@ai_assistant_bp.route('/api/ai/memories/search', methods=['GET'])
@jwt_required()
def search_memories():
    """Search AI memories"""
    user_id = get_jwt_identity()
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'success': False, 'message': 'Search query required'}), 400
    
    memory = get_ai_service(user_id)
    results = memory.search_memories(query)
    
    return jsonify({
        'success': True,
        'results': results
    })


# =============================================================================
# PREDICTIONS ENDPOINTS
# =============================================================================

@ai_assistant_bp.route('/api/ai/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    """Get AI predictions for the user"""
    user_id = get_jwt_identity()
    
    prediction_type = request.args.get('type')
    
    memory = get_ai_service(user_id)
    predictions = memory.get_predictions(prediction_type)
    
    return jsonify({
        'success': True,
        'predictions': predictions
    })


@ai_assistant_bp.route('/api/ai/predictions/payroll', methods=['POST'])
@jwt_required()
def predict_payroll():
    """Generate payroll prediction"""
    user_id = get_jwt_identity()
    
    ai = get_saurellius_ai()
    result = ai.predict_payroll(user_id)
    
    return jsonify(result)


# =============================================================================
# ANALYSIS ENDPOINTS
# =============================================================================

@ai_assistant_bp.route('/api/ai/analyze/payroll', methods=['POST'])
@jwt_required()
def analyze_payroll():
    """Analyze payroll data"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    payroll_data = data.get('payroll_data', {})
    
    ai = get_saurellius_ai()
    result = ai.analyze_payroll(user_id, payroll_data)
    
    return jsonify(result)


@ai_assistant_bp.route('/api/ai/summarize', methods=['POST'])
@jwt_required()
def summarize_data():
    """Get AI summary of data"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    data_type = data.get('type', 'data')
    content = data.get('data')
    
    if not content:
        return jsonify({'success': False, 'message': 'data required'}), 400
    
    ai = get_saurellius_ai()
    summary = ai.summarize_data(user_id, data_type, content)
    
    return jsonify({
        'success': True,
        'summary': summary
    })


# =============================================================================
# CONTEXT TRACKING
# =============================================================================

@ai_assistant_bp.route('/api/ai/track-feature', methods=['POST'])
@jwt_required()
def track_feature():
    """Track feature usage for AI learning"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    feature = data.get('feature')
    if not feature:
        return jsonify({'success': False, 'message': 'feature required'}), 400
    
    memory = get_ai_service(user_id)
    memory.profile.track_feature(feature)
    db.session.commit()
    
    return jsonify({'success': True})


@ai_assistant_bp.route('/api/ai/context', methods=['GET'])
@jwt_required()
def get_context():
    """Get current AI context for debugging/display"""
    user_id = get_jwt_identity()
    
    feature = request.args.get('feature', 'general')
    
    memory = get_ai_service(user_id)
    context = memory.build_full_context(feature)
    
    return jsonify({
        'success': True,
        'context': context
    })


# =============================================================================
# AI STATUS
# =============================================================================

@ai_assistant_bp.route('/api/ai/status', methods=['GET'])
@jwt_required()
def ai_status():
    """Get AI service status and capabilities"""
    user_id = get_jwt_identity()
    
    ai = get_saurellius_ai()
    memory = get_ai_service(user_id)
    
    return jsonify({
        'success': True,
        'status': {
            'ai_enabled': ai.initialized,
            'learning_level': memory.profile.learning_level,
            'total_interactions': memory.profile.total_interactions,
            'features': list(ai.FEATURE_PROMPTS.keys()),
            'capabilities': [
                'chat',
                'insights',
                'predictions',
                'payroll_analysis',
                'summarization',
                'memory'
            ]
        }
    })
