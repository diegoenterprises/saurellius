"""
SAURELLIUS AI MEMORY SERVICE
Manages user-specific AI learning, memory, and context
"""

from datetime import datetime, timedelta
from models import db, User, Company, Employee, Paystub
from models_ai import (
    UserAIProfile, UserAIConversation, UserAIInsight, 
    UserAIMemory, UserAIPrediction, get_or_create_ai_profile
)
import json
import logging
from sqlalchemy import func, desc

logger = logging.getLogger(__name__)


class AIMemoryService:
    """
    Comprehensive AI memory and learning service.
    Handles all user-specific AI context and personalization.
    """
    
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.profile = get_or_create_ai_profile(user_id)
        self._user = None
        self._company = None
    
    @property
    def user(self):
        if not self._user:
            self._user = User.query.get(self.user_id)
        return self._user
    
    @property
    def company(self):
        if not self._company and self.user:
            self._company = Company.query.filter_by(user_id=self.user_id).first()
        return self._company
    
    # =========================================================================
    # CONTEXT BUILDING
    # =========================================================================
    
    def build_full_context(self, feature: str = 'general') -> dict:
        """
        Build comprehensive context for AI interactions.
        This is the main method that provides all relevant user context.
        """
        context = {
            'user': self._get_user_context(),
            'business': self._get_business_context(),
            'profile': self.profile.to_context_dict(),
            'recent_activity': self._get_recent_activity(),
            'memories': self._get_relevant_memories(feature),
            'insights': self._get_active_insights(),
            'feature_context': feature,
            'timestamp': datetime.utcnow().isoformat()
        }
        return context
    
    def _get_user_context(self) -> dict:
        """Get basic user information for context"""
        if not self.user:
            return {}
        return {
            'name': self.user.full_name,
            'first_name': self.user.first_name,
            'role': self.user.role,
            'subscription': self.user.subscription_tier,
            'member_since': self.user.created_at.isoformat() if self.user.created_at else None,
            'is_admin': self.user.is_admin
        }
    
    def _get_business_context(self) -> dict:
        """Get business/company information for context"""
        context = {
            'has_company': False,
            'employee_count': 0,
            'paystub_count': 0,
            'recent_payroll_total': 0
        }
        
        if self.company:
            context['has_company'] = True
            context['company_name'] = self.company.name
            context['industry'] = getattr(self.company, 'industry', None)
            
        # Get employee count
        context['employee_count'] = Employee.query.filter_by(
            user_id=self.user_id, is_active=True
        ).count()
        
        # Get paystub stats
        context['paystub_count'] = Paystub.query.filter_by(user_id=self.user_id).count()
        
        # Recent payroll total (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_total = db.session.query(func.sum(Paystub.gross_pay)).filter(
            Paystub.user_id == self.user_id,
            Paystub.created_at >= thirty_days_ago
        ).scalar() or 0
        context['recent_payroll_total'] = float(recent_total)
        
        return context
    
    def _get_recent_activity(self, limit: int = 10) -> list:
        """Get recent user activity for context"""
        activities = []
        
        # Recent conversations
        recent_convos = UserAIConversation.query.filter_by(
            user_id=self.user_id
        ).order_by(desc(UserAIConversation.created_at)).limit(5).all()
        
        for convo in recent_convos:
            activities.append({
                'type': 'conversation',
                'context': convo.context_type,
                'message': convo.message[:100] if convo.role == 'user' else None,
                'time': convo.created_at.isoformat()
            })
        
        # Recent paystubs
        recent_paystubs = Paystub.query.filter_by(
            user_id=self.user_id
        ).order_by(desc(Paystub.created_at)).limit(3).all()
        
        for ps in recent_paystubs:
            activities.append({
                'type': 'paystub_created',
                'amount': float(ps.gross_pay) if ps.gross_pay else 0,
                'time': ps.created_at.isoformat() if ps.created_at else None
            })
        
        return activities[:limit]
    
    def _get_relevant_memories(self, feature: str, limit: int = 10) -> list:
        """Get memories relevant to the current feature/context"""
        memories = UserAIMemory.query.filter_by(
            user_id=self.user_id
        ).filter(
            (UserAIMemory.category == feature) | (UserAIMemory.category == 'general')
        ).order_by(
            desc(UserAIMemory.importance),
            desc(UserAIMemory.access_count)
        ).limit(limit).all()
        
        result = []
        for mem in memories:
            result.append({
                'type': mem.memory_type,
                'key': mem.key,
                'value': mem.value,
                'importance': mem.importance
            })
            # Update access tracking
            mem.access_count += 1
            mem.last_accessed = datetime.utcnow()
        
        db.session.commit()
        return result
    
    def _get_active_insights(self, limit: int = 5) -> list:
        """Get active/relevant insights for the user"""
        insights = UserAIInsight.query.filter_by(
            user_id=self.user_id,
            status='new'
        ).filter(
            (UserAIInsight.valid_until == None) | (UserAIInsight.valid_until > datetime.utcnow())
        ).order_by(
            desc(UserAIInsight.priority == 'urgent'),
            desc(UserAIInsight.priority == 'high'),
            desc(UserAIInsight.created_at)
        ).limit(limit).all()
        
        return [i.to_dict() for i in insights]
    
    # =========================================================================
    # MEMORY MANAGEMENT
    # =========================================================================
    
    def remember(self, key: str, value: str, memory_type: str = 'fact', 
                 category: str = 'general', importance: int = 5, 
                 source: str = 'inferred', confidence: float = 1.0):
        """
        Store a memory about the user.
        Updates existing memory if key exists.
        """
        existing = UserAIMemory.query.filter_by(
            user_id=self.user_id, key=key
        ).first()
        
        if existing:
            existing.value = value
            existing.importance = max(existing.importance, importance)
            existing.confidence = confidence
            existing.updated_at = datetime.utcnow()
        else:
            memory = UserAIMemory(
                user_id=self.user_id,
                memory_type=memory_type,
                category=category,
                key=key,
                value=value,
                importance=importance,
                source=source,
                confidence=confidence
            )
            db.session.add(memory)
        
        db.session.commit()
        logger.info(f"Stored memory for user {self.user_id}: {key}")
    
    def recall(self, key: str) -> str:
        """Recall a specific memory by key"""
        memory = UserAIMemory.query.filter_by(
            user_id=self.user_id, key=key
        ).first()
        
        if memory:
            memory.access_count += 1
            memory.last_accessed = datetime.utcnow()
            db.session.commit()
            return memory.value
        return None
    
    def forget(self, key: str):
        """Remove a memory"""
        UserAIMemory.query.filter_by(
            user_id=self.user_id, key=key
        ).delete()
        db.session.commit()
    
    def search_memories(self, query: str, limit: int = 10) -> list:
        """Search memories by content"""
        memories = UserAIMemory.query.filter(
            UserAIMemory.user_id == self.user_id,
            (UserAIMemory.key.ilike(f'%{query}%')) | 
            (UserAIMemory.value.ilike(f'%{query}%'))
        ).order_by(desc(UserAIMemory.importance)).limit(limit).all()
        
        return [{
            'key': m.key,
            'value': m.value,
            'type': m.memory_type,
            'category': m.category
        } for m in memories]
    
    # =========================================================================
    # CONVERSATION MANAGEMENT
    # =========================================================================
    
    def log_conversation(self, session_id: str, role: str, message: str,
                        context_type: str = 'general', intent: str = None,
                        entities: dict = None, sentiment: str = 'neutral'):
        """Log a conversation message"""
        convo = UserAIConversation(
            user_id=self.user_id,
            session_id=session_id,
            context_type=context_type,
            role=role,
            message=message,
            intent=intent,
            sentiment=sentiment
        )
        if entities:
            convo.set_entities(entities)
        
        db.session.add(convo)
        
        # Update profile stats
        if role == 'user':
            self.profile.total_interactions += 1
        
        db.session.commit()
        return convo.id
    
    def get_conversation_history(self, session_id: str = None, limit: int = 20) -> list:
        """Get conversation history"""
        query = UserAIConversation.query.filter_by(user_id=self.user_id)
        
        if session_id:
            query = query.filter_by(session_id=session_id)
        
        messages = query.order_by(desc(UserAIConversation.created_at)).limit(limit).all()
        
        return [{
            'role': m.role,
            'message': m.message,
            'context': m.context_type,
            'time': m.created_at.isoformat()
        } for m in reversed(messages)]
    
    def mark_response_helpful(self, conversation_id: int, helpful: bool, notes: str = None):
        """Mark a response as helpful or not"""
        convo = UserAIConversation.query.get(conversation_id)
        if convo and convo.user_id == self.user_id:
            convo.was_helpful = helpful
            convo.feedback_notes = notes
            
            if helpful:
                self.profile.helpful_responses += 1
            else:
                self.profile.improvement_feedback += 1
            
            db.session.commit()
    
    # =========================================================================
    # INSIGHT MANAGEMENT
    # =========================================================================
    
    def create_insight(self, insight_type: str, title: str, summary: str,
                      category: str = None, priority: str = 'medium',
                      detailed_analysis: str = None, recommended_action: str = None,
                      related_data: dict = None, metrics: dict = None,
                      valid_days: int = None) -> int:
        """Create a new AI insight for the user"""
        insight = UserAIInsight(
            user_id=self.user_id,
            insight_type=insight_type,
            category=category,
            priority=priority,
            title=title,
            summary=summary,
            detailed_analysis=detailed_analysis,
            recommended_action=recommended_action,
            is_actionable=recommended_action is not None
        )
        
        if related_data:
            insight.related_data = json.dumps(related_data)
        if metrics:
            insight.metrics = json.dumps(metrics)
        if valid_days:
            insight.valid_until = datetime.utcnow() + timedelta(days=valid_days)
        
        db.session.add(insight)
        db.session.commit()
        
        logger.info(f"Created insight for user {self.user_id}: {title}")
        return insight.id
    
    def get_insights(self, insight_type: str = None, status: str = None, 
                    limit: int = 20) -> list:
        """Get user insights"""
        query = UserAIInsight.query.filter_by(user_id=self.user_id)
        
        if insight_type:
            query = query.filter_by(insight_type=insight_type)
        if status:
            query = query.filter_by(status=status)
        
        insights = query.order_by(desc(UserAIInsight.created_at)).limit(limit).all()
        return [i.to_dict() for i in insights]
    
    def mark_insight_viewed(self, insight_id: int):
        """Mark insight as viewed"""
        insight = UserAIInsight.query.get(insight_id)
        if insight and insight.user_id == self.user_id:
            insight.status = 'viewed'
            insight.viewed_at = datetime.utcnow()
            db.session.commit()
    
    def mark_insight_acted(self, insight_id: int):
        """Mark insight as acted upon"""
        insight = UserAIInsight.query.get(insight_id)
        if insight and insight.user_id == self.user_id:
            insight.status = 'acted_upon'
            insight.acted_at = datetime.utcnow()
            db.session.commit()
    
    def dismiss_insight(self, insight_id: int):
        """Dismiss an insight"""
        insight = UserAIInsight.query.get(insight_id)
        if insight and insight.user_id == self.user_id:
            insight.status = 'dismissed'
            db.session.commit()
    
    # =========================================================================
    # LEARNING & PROFILE UPDATES
    # =========================================================================
    
    def learn_from_interaction(self, message: str, context: str, response_helpful: bool = None):
        """Learn from a user interaction to improve future responses"""
        
        # Track feature usage
        self.profile.track_feature(context)
        
        # Extract and store common question patterns
        if '?' in message:
            self.profile.add_common_question(message, context)
        
        # Update learning level based on interactions
        total = self.profile.total_interactions
        if total >= 100 and self.profile.learning_level < 10:
            self.profile.learning_level = min(10, total // 10)
        elif total >= 50 and self.profile.learning_level < 5:
            self.profile.learning_level = 5
        elif total >= 20 and self.profile.learning_level < 3:
            self.profile.learning_level = 3
        elif total >= 10 and self.profile.learning_level < 2:
            self.profile.learning_level = 2
        
        self.profile.last_learning_update = datetime.utcnow()
        db.session.commit()
    
    def update_preferences(self, preferred_tone: str = None, 
                          communication_style: str = None,
                          response_length: str = None):
        """Update user's AI communication preferences"""
        if preferred_tone:
            self.profile.preferred_tone = preferred_tone
        if communication_style:
            self.profile.communication_style = communication_style
        if response_length:
            self.profile.response_length = response_length
        
        db.session.commit()
    
    def set_business_context(self, industry: str = None, company_size: str = None,
                            primary_use_case: str = None):
        """Set business context for better AI understanding"""
        if industry:
            self.profile.industry = industry
        if company_size:
            self.profile.company_size = company_size
        if primary_use_case:
            self.profile.primary_use_case = primary_use_case
        
        db.session.commit()
    
    # =========================================================================
    # PREDICTIONS
    # =========================================================================
    
    def store_prediction(self, prediction_type: str, value: str, 
                        confidence: float, reasoning: str,
                        prediction_for: datetime = None, valid_days: int = 30) -> int:
        """Store an AI prediction"""
        prediction = UserAIPrediction(
            user_id=self.user_id,
            prediction_type=prediction_type,
            prediction_value=value,
            confidence_score=confidence,
            reasoning=reasoning,
            prediction_for=prediction_for,
            valid_until=datetime.utcnow() + timedelta(days=valid_days)
        )
        
        db.session.add(prediction)
        db.session.commit()
        return prediction.id
    
    def get_predictions(self, prediction_type: str = None, limit: int = 10) -> list:
        """Get predictions for user"""
        query = UserAIPrediction.query.filter_by(user_id=self.user_id)
        
        if prediction_type:
            query = query.filter_by(prediction_type=prediction_type)
        
        predictions = query.filter(
            UserAIPrediction.valid_until > datetime.utcnow()
        ).order_by(desc(UserAIPrediction.created_at)).limit(limit).all()
        
        return [{
            'id': p.id,
            'type': p.prediction_type,
            'value': p.prediction_value,
            'confidence': p.confidence_score,
            'reasoning': p.reasoning,
            'for_date': p.prediction_for.isoformat() if p.prediction_for else None
        } for p in predictions]
    
    def verify_prediction(self, prediction_id: int, actual_outcome: str, accuracy: float):
        """Verify a prediction with actual outcome"""
        prediction = UserAIPrediction.query.get(prediction_id)
        if prediction and prediction.user_id == self.user_id:
            prediction.actual_outcome = actual_outcome
            prediction.accuracy_score = accuracy
            prediction.verified_at = datetime.utcnow()
            db.session.commit()


# Utility function
def get_ai_service(user_id: int) -> AIMemoryService:
    """Get AI memory service instance for a user"""
    return AIMemoryService(user_id)
