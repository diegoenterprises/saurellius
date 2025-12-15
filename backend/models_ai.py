"""
SAURELLIUS AI DATABASE MODELS
Comprehensive AI memory and learning system for personalized user experiences
"""

from datetime import datetime
from models import db
import json


class UserAIProfile(db.Model):
    """
    Stores learned user preferences, behaviors, and AI personality settings.
    This is the core of user-specific AI learning.
    """
    __tablename__ = 'user_ai_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    
    # AI Personality & Communication Style
    preferred_tone = db.Column(db.String(50), default='professional')  # professional, friendly, concise, detailed
    communication_style = db.Column(db.String(50), default='balanced')  # balanced, technical, simple
    response_length = db.Column(db.String(20), default='medium')  # short, medium, detailed
    
    # Learned User Patterns (JSON stored)
    work_patterns = db.Column(db.Text)  # Peak hours, busy days, workflow habits
    payroll_preferences = db.Column(db.Text)  # Common deductions, pay schedules, etc.
    common_questions = db.Column(db.Text)  # Frequently asked topics
    feature_usage = db.Column(db.Text)  # Which features user uses most
    
    # Business Context
    industry = db.Column(db.String(100))
    company_size = db.Column(db.String(50))
    primary_use_case = db.Column(db.String(100))
    
    # AI Interaction Stats
    total_interactions = db.Column(db.Integer, default=0)
    helpful_responses = db.Column(db.Integer, default=0)
    improvement_feedback = db.Column(db.Integer, default=0)
    
    # Learning Progress
    learning_level = db.Column(db.Integer, default=1)  # 1-10, increases with interactions
    last_learning_update = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_work_patterns(self):
        return json.loads(self.work_patterns) if self.work_patterns else {}
    
    def set_work_patterns(self, patterns):
        self.work_patterns = json.dumps(patterns)
    
    def get_payroll_preferences(self):
        return json.loads(self.payroll_preferences) if self.payroll_preferences else {}
    
    def set_payroll_preferences(self, prefs):
        self.payroll_preferences = json.dumps(prefs)
    
    def get_common_questions(self):
        return json.loads(self.common_questions) if self.common_questions else []
    
    def add_common_question(self, question, category):
        questions = self.get_common_questions()
        questions.append({'question': question, 'category': category, 'count': 1, 'last_asked': datetime.utcnow().isoformat()})
        # Keep only top 50 questions
        self.common_questions = json.dumps(questions[-50:])
    
    def get_feature_usage(self):
        return json.loads(self.feature_usage) if self.feature_usage else {}
    
    def track_feature(self, feature_name):
        usage = self.get_feature_usage()
        if feature_name in usage:
            usage[feature_name]['count'] += 1
            usage[feature_name]['last_used'] = datetime.utcnow().isoformat()
        else:
            usage[feature_name] = {'count': 1, 'first_used': datetime.utcnow().isoformat(), 'last_used': datetime.utcnow().isoformat()}
        self.feature_usage = json.dumps(usage)
    
    def to_context_dict(self):
        """Returns a context dictionary for AI prompts"""
        return {
            'preferred_tone': self.preferred_tone,
            'communication_style': self.communication_style,
            'response_length': self.response_length,
            'industry': self.industry,
            'company_size': self.company_size,
            'primary_use_case': self.primary_use_case,
            'learning_level': self.learning_level,
            'total_interactions': self.total_interactions,
            'work_patterns': self.get_work_patterns(),
            'payroll_preferences': self.get_payroll_preferences(),
            'top_features': self.get_feature_usage()
        }


class UserAIConversation(db.Model):
    """
    Stores conversation history for context continuity.
    Allows AI to reference past conversations.
    """
    __tablename__ = 'user_ai_conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Conversation metadata
    session_id = db.Column(db.String(100), index=True)  # Groups messages in a session
    context_type = db.Column(db.String(50))  # dashboard, payroll, employee, settings, general
    
    # Message content
    role = db.Column(db.String(20))  # user, assistant
    message = db.Column(db.Text, nullable=False)
    
    # AI Analysis
    intent = db.Column(db.String(100))  # question, request, feedback, complaint
    entities = db.Column(db.Text)  # JSON: extracted entities (employee names, dates, amounts)
    sentiment = db.Column(db.String(20))  # positive, neutral, negative
    
    # Feedback
    was_helpful = db.Column(db.Boolean)
    feedback_notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def get_entities(self):
        return json.loads(self.entities) if self.entities else {}
    
    def set_entities(self, entities):
        self.entities = json.dumps(entities)


class UserAIInsight(db.Model):
    """
    Stores AI-generated insights about the user's business.
    Proactive recommendations and observations.
    """
    __tablename__ = 'user_ai_insights'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Insight Classification
    insight_type = db.Column(db.String(50), nullable=False)  # payroll, compliance, cost_saving, efficiency, alert
    category = db.Column(db.String(50))  # tax, scheduling, overtime, benefits, etc.
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    
    # Content
    title = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    detailed_analysis = db.Column(db.Text)
    recommended_action = db.Column(db.Text)
    
    # Data References
    related_data = db.Column(db.Text)  # JSON: IDs of related records (employees, paystubs, etc.)
    metrics = db.Column(db.Text)  # JSON: relevant numbers/stats
    
    # Status
    status = db.Column(db.String(20), default='new')  # new, viewed, acted_upon, dismissed
    is_actionable = db.Column(db.Boolean, default=True)
    
    # Validity
    valid_until = db.Column(db.DateTime)  # Some insights expire
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    viewed_at = db.Column(db.DateTime)
    acted_at = db.Column(db.DateTime)
    
    def get_related_data(self):
        return json.loads(self.related_data) if self.related_data else {}
    
    def get_metrics(self):
        return json.loads(self.metrics) if self.metrics else {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.insight_type,
            'category': self.category,
            'priority': self.priority,
            'title': self.title,
            'summary': self.summary,
            'detailed_analysis': self.detailed_analysis,
            'recommended_action': self.recommended_action,
            'metrics': self.get_metrics(),
            'status': self.status,
            'is_actionable': self.is_actionable,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserAIMemory(db.Model):
    """
    Long-term memory storage for important facts about the user.
    Things the AI should "remember" across sessions.
    """
    __tablename__ = 'user_ai_memories'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Memory Classification
    memory_type = db.Column(db.String(50), nullable=False)  # preference, fact, event, goal, concern
    category = db.Column(db.String(50))  # payroll, employees, business, personal
    
    # Content
    key = db.Column(db.String(100), nullable=False)  # Identifier for the memory
    value = db.Column(db.Text, nullable=False)  # The actual memory content
    context = db.Column(db.Text)  # Additional context
    
    # Importance & Relevance
    importance = db.Column(db.Integer, default=5)  # 1-10
    access_count = db.Column(db.Integer, default=0)  # How often this memory is retrieved
    last_accessed = db.Column(db.DateTime)
    
    # Source
    source = db.Column(db.String(50))  # user_stated, inferred, observed
    confidence = db.Column(db.Float, default=1.0)  # 0-1, how confident AI is in this memory
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint on user + key
    __table_args__ = (db.UniqueConstraint('user_id', 'key', name='unique_user_memory'),)


class UserAIPrediction(db.Model):
    """
    Stores AI predictions about user behavior, business trends, etc.
    Used for proactive assistance.
    """
    __tablename__ = 'user_ai_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Prediction Type
    prediction_type = db.Column(db.String(50), nullable=False)  # payroll_total, employee_turnover, cash_flow, compliance_risk
    
    # Prediction Details
    prediction_value = db.Column(db.Text, nullable=False)  # The predicted value/outcome
    confidence_score = db.Column(db.Float)  # 0-1
    reasoning = db.Column(db.Text)  # Why AI made this prediction
    
    # Time Frame
    prediction_for = db.Column(db.DateTime)  # When this prediction is for
    valid_from = db.Column(db.DateTime, default=datetime.utcnow)
    valid_until = db.Column(db.DateTime)
    
    # Accuracy Tracking
    actual_outcome = db.Column(db.Text)  # What actually happened
    accuracy_score = db.Column(db.Float)  # How accurate was the prediction
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime)


class AIFeatureContext(db.Model):
    """
    Stores feature-specific AI context and configuration.
    Allows AI to behave differently in different parts of the app.
    """
    __tablename__ = 'ai_feature_contexts'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Feature identification
    feature_name = db.Column(db.String(100), unique=True, nullable=False)
    feature_description = db.Column(db.Text)
    
    # AI Behavior
    system_prompt = db.Column(db.Text)  # Base prompt for this feature
    capabilities = db.Column(db.Text)  # JSON: what AI can do in this feature
    restrictions = db.Column(db.Text)  # JSON: what AI cannot do
    
    # Response Templates
    common_responses = db.Column(db.Text)  # JSON: pre-approved response templates
    
    # Analytics
    usage_count = db.Column(db.Integer, default=0)
    avg_satisfaction = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Helper function to initialize AI profile for new users
def get_or_create_ai_profile(user_id):
    """Get existing AI profile or create new one for user"""
    profile = UserAIProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = UserAIProfile(user_id=user_id)
        db.session.add(profile)
        db.session.commit()
    return profile
