"""
SAURELLIUS AI SERVICE
The core AI engine that powers intelligent assistance across the platform.
Uses Google Gemini with user-specific context and learning.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
import uuid

logger = logging.getLogger(__name__)

# Try to import Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("Google Generative AI not available")

from models import db, User, Company, Employee, Paystub
from services.ai_memory_service import AIMemoryService, get_ai_service


class SaurelliusAI:
    """
    The Saurellius AI Engine - A comprehensive, learning AI assistant.
    """
    
    # Feature-specific system prompts
    FEATURE_PROMPTS = {
        'general': """You are Saurellius AI, an intelligent payroll and HR assistant. 
You help users manage their payroll, employees, compliance, and business operations.
Be helpful, professional, and proactive in offering insights.""",

        'dashboard': """You are Saurellius AI analyzing the user's dashboard.
Focus on providing insights about their business metrics, trends, and actionable recommendations.
Highlight important numbers and suggest improvements.""",

        'payroll': """You are Saurellius AI, a payroll expert.
Help with payroll calculations, tax withholdings, deductions, pay schedules, and compliance.
Be precise with numbers and always explain tax implications.""",

        'employees': """You are Saurellius AI, an HR assistant.
Help manage employee information, onboarding, performance, and team management.
Be empathetic when discussing personnel matters.""",

        'compliance': """You are Saurellius AI, a compliance specialist.
Help with tax filings, regulatory requirements, deadlines, and legal obligations.
Always emphasize accuracy and timeliness for compliance matters.""",

        'reports': """You are Saurellius AI, a business analyst.
Help analyze reports, identify trends, and provide data-driven insights.
Present information clearly with actionable takeaways.""",

        'settings': """You are Saurellius AI helping with platform configuration.
Guide users through settings, preferences, and account management.
Be clear and step-by-step in explanations."""
    }
    
    def __init__(self):
        self.initialized = False
        self.model = None
        self._initialize_gemini()
    
    def _initialize_gemini(self):
        """Initialize Gemini API"""
        if not GEMINI_AVAILABLE:
            logger.warning("Gemini not available - AI features disabled")
            return
        
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            logger.warning("GEMINI_API_KEY not found")
            return
        
        try:
            genai.configure(api_key=api_key)
            # Try different model initialization approaches for compatibility
            try:
                self.model = genai.GenerativeModel('gemini-pro')
            except AttributeError:
                # Fallback for older API versions
                self.model = genai.GenerativeModel(model_name='gemini-pro')
            self.initialized = True
            logger.info("Saurellius AI initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {e}")
            # Try alternative initialization
            try:
                import google.generativeai as genai2
                genai2.configure(api_key=api_key)
                models = genai2.list_models()
                for m in models:
                    if 'generateContent' in m.supported_generation_methods:
                        self.model = genai2.GenerativeModel(m.name)
                        self.initialized = True
                        logger.info(f"Saurellius AI initialized with model: {m.name}")
                        break
            except Exception as e2:
                logger.error(f"Alternative Gemini init also failed: {e2}")
    
    def _build_system_prompt(self, user_context: dict, feature: str) -> str:
        """Build comprehensive system prompt with user context"""
        base_prompt = self.FEATURE_PROMPTS.get(feature, self.FEATURE_PROMPTS['general'])
        
        # Add user personalization
        profile = user_context.get('profile', {})
        tone = profile.get('preferred_tone', 'professional')
        style = profile.get('communication_style', 'balanced')
        length = profile.get('response_length', 'medium')
        
        prompt = f"""{base_prompt}

USER CONTEXT:
- Name: {user_context.get('user', {}).get('first_name', 'User')}
- Role: {user_context.get('user', {}).get('role', 'employer')}
- Subscription: {user_context.get('user', {}).get('subscription', 'free')}
- Company: {user_context.get('business', {}).get('company_name', 'Not set')}
- Employees: {user_context.get('business', {}).get('employee_count', 0)}
- Total Paystubs: {user_context.get('business', {}).get('paystub_count', 0)}
- Recent Payroll (30 days): ${user_context.get('business', {}).get('recent_payroll_total', 0):,.2f}

COMMUNICATION PREFERENCES:
- Tone: {tone}
- Style: {style}  
- Response Length: {length}

LEARNING LEVEL: {profile.get('learning_level', 1)}/10 (How well you know this user)

REMEMBERED FACTS ABOUT USER:
{self._format_memories(user_context.get('memories', []))}

ACTIVE INSIGHTS TO CONSIDER:
{self._format_insights(user_context.get('insights', []))}

INSTRUCTIONS:
1. Be personalized - use the user's name and reference their specific situation
2. Be proactive - offer relevant insights and suggestions without being asked
3. Be accurate - especially with numbers and compliance matters
4. Learn - note any new preferences or patterns the user reveals
5. Adapt your tone and detail level to the user's preferences
"""
        return prompt
    
    def _format_memories(self, memories: list) -> str:
        """Format memories for prompt"""
        if not memories:
            return "- No specific memories yet"
        
        return "\n".join([f"- {m['key']}: {m['value']}" for m in memories[:10]])
    
    def _format_insights(self, insights: list) -> str:
        """Format insights for prompt"""
        if not insights:
            return "- No pending insights"
        
        return "\n".join([f"- [{i['priority'].upper()}] {i['title']}" for i in insights[:5]])
    
    async def chat(self, user_id: int, message: str, feature: str = 'general',
                   session_id: str = None) -> dict:
        """
        Main chat interface with full context awareness.
        """
        if not self.initialized:
            return {
                'success': False,
                'response': "I apologize, but AI features are currently unavailable. Please try again later.",
                'session_id': session_id
            }
        
        # Get AI memory service
        memory = get_ai_service(user_id)
        
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Build full context
        context = memory.build_full_context(feature)
        
        # Log user message
        memory.log_conversation(
            session_id=session_id,
            role='user',
            message=message,
            context_type=feature
        )
        
        try:
            # Build prompt with context
            system_prompt = self._build_system_prompt(context, feature)
            
            # Get conversation history for continuity
            history = memory.get_conversation_history(session_id, limit=10)
            history_text = "\n".join([
                f"{m['role'].upper()}: {m['message']}" 
                for m in history[:-1]  # Exclude current message
            ]) if len(history) > 1 else ""
            
            # Build full prompt
            full_prompt = f"""{system_prompt}

CONVERSATION HISTORY:
{history_text if history_text else "This is the start of the conversation."}

USER MESSAGE: {message}

Respond naturally and helpfully. If you learn something new about the user or their preferences, note it mentally for future reference."""

            # Generate response
            response = self.model.generate_content(full_prompt)
            ai_response = response.text
            
            # Log AI response
            conv_id = memory.log_conversation(
                session_id=session_id,
                role='assistant',
                message=ai_response,
                context_type=feature
            )
            
            # Learn from interaction
            memory.learn_from_interaction(message, feature)
            
            # Extract and store any learnings
            self._extract_learnings(memory, message, ai_response)
            
            return {
                'success': True,
                'response': ai_response,
                'session_id': session_id,
                'conversation_id': conv_id,
                'context': {
                    'feature': feature,
                    'learning_level': context['profile'].get('learning_level', 1)
                }
            }
            
        except Exception as e:
            logger.error(f"AI chat error: {e}")
            return {
                'success': False,
                'response': "I encountered an issue processing your request. Please try again.",
                'session_id': session_id,
                'error': str(e)
            }
    
    def chat_sync(self, user_id: int, message: str, feature: str = 'general',
                  session_id: str = None) -> dict:
        """Synchronous version of chat for non-async contexts"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(self.chat(user_id, message, feature, session_id))
    
    def _extract_learnings(self, memory: AIMemoryService, message: str, response: str):
        """Extract learnable facts from conversation"""
        # Simple pattern matching for common preferences
        message_lower = message.lower()
        
        # Preference patterns
        if 'prefer' in message_lower or 'like' in message_lower:
            if 'detailed' in message_lower:
                memory.update_preferences(response_length='detailed')
            elif 'brief' in message_lower or 'short' in message_lower:
                memory.update_preferences(response_length='short')
            elif 'friendly' in message_lower or 'casual' in message_lower:
                memory.update_preferences(preferred_tone='friendly')
            elif 'formal' in message_lower or 'professional' in message_lower:
                memory.update_preferences(preferred_tone='professional')
        
        # Business context patterns
        if 'employees' in message_lower and any(char.isdigit() for char in message):
            # Try to extract employee count mentioned
            import re
            numbers = re.findall(r'\d+', message)
            if numbers:
                memory.remember(
                    key='mentioned_employee_count',
                    value=numbers[0],
                    memory_type='fact',
                    category='business',
                    source='user_stated'
                )
        
        # Industry patterns
        industries = ['restaurant', 'retail', 'tech', 'healthcare', 'construction', 
                     'manufacturing', 'consulting', 'legal', 'accounting']
        for industry in industries:
            if industry in message_lower:
                memory.set_business_context(industry=industry)
                break
    
    # =========================================================================
    # SPECIALIZED AI FUNCTIONS
    # =========================================================================
    
    def generate_insights(self, user_id: int) -> List[dict]:
        """Generate proactive insights for a user"""
        if not self.initialized:
            return []
        
        memory = get_ai_service(user_id)
        context = memory.build_full_context('insights')
        
        prompt = f"""Analyze this user's business data and generate 3-5 actionable insights.

USER DATA:
- Employees: {context['business'].get('employee_count', 0)}
- Paystubs Generated: {context['business'].get('paystub_count', 0)}
- Recent Payroll (30 days): ${context['business'].get('recent_payroll_total', 0):,.2f}
- Subscription: {context['user'].get('subscription', 'free')}
- Industry: {context['profile'].get('industry', 'Unknown')}

Generate insights in this JSON format:
[
  {{
    "type": "payroll|compliance|cost_saving|efficiency|alert",
    "category": "specific category",
    "priority": "low|medium|high|urgent",
    "title": "Brief title",
    "summary": "1-2 sentence summary",
    "recommendation": "What they should do"
  }}
]

Focus on actionable, relevant insights. Return ONLY valid JSON."""

        try:
            response = self.model.generate_content(prompt)
            insights_data = json.loads(response.text)
            
            created_insights = []
            for insight in insights_data:
                insight_id = memory.create_insight(
                    insight_type=insight.get('type', 'efficiency'),
                    title=insight.get('title', 'Insight'),
                    summary=insight.get('summary', ''),
                    category=insight.get('category'),
                    priority=insight.get('priority', 'medium'),
                    recommended_action=insight.get('recommendation'),
                    valid_days=7
                )
                created_insights.append(insight_id)
            
            return memory.get_insights(status='new')
            
        except Exception as e:
            logger.error(f"Failed to generate insights: {e}")
            return []
    
    def analyze_payroll(self, user_id: int, payroll_data: dict) -> dict:
        """Analyze payroll data and provide insights"""
        if not self.initialized:
            return {'success': False, 'analysis': 'AI unavailable'}
        
        memory = get_ai_service(user_id)
        context = memory.build_full_context('payroll')
        
        prompt = f"""Analyze this payroll run and provide insights:

PAYROLL DATA:
{json.dumps(payroll_data, indent=2)}

USER CONTEXT:
- Industry: {context['profile'].get('industry', 'Unknown')}
- Usual Patterns: {context['profile'].get('payroll_preferences', {})}

Provide:
1. Summary of the payroll
2. Any anomalies or concerns
3. Tax optimization suggestions
4. Compliance reminders

Be specific and actionable."""

        try:
            response = self.model.generate_content(prompt)
            return {
                'success': True,
                'analysis': response.text
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def predict_payroll(self, user_id: int, for_date: datetime = None) -> dict:
        """Predict next payroll based on patterns"""
        if not self.initialized:
            return {'success': False, 'prediction': None}
        
        memory = get_ai_service(user_id)
        
        # Get historical data
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'prediction': None}
        
        # Get recent paystubs for pattern analysis
        recent_paystubs = Paystub.query.filter_by(user_id=user_id).order_by(
            Paystub.created_at.desc()
        ).limit(10).all()
        
        if not recent_paystubs:
            return {'success': False, 'prediction': 'Not enough data'}
        
        payroll_history = [{
            'date': ps.created_at.isoformat() if ps.created_at else None,
            'gross': float(ps.gross_pay) if ps.gross_pay else 0,
            'net': float(ps.net_pay) if ps.net_pay else 0
        } for ps in recent_paystubs]
        
        prompt = f"""Based on this payroll history, predict the next payroll:

HISTORY:
{json.dumps(payroll_history, indent=2)}

Provide a prediction in JSON format:
{{
  "predicted_gross": number,
  "predicted_net": number,
  "confidence": 0-1,
  "reasoning": "brief explanation"
}}

Return ONLY valid JSON."""

        try:
            response = self.model.generate_content(prompt)
            prediction = json.loads(response.text)
            
            # Store prediction
            memory.store_prediction(
                prediction_type='payroll_total',
                value=json.dumps(prediction),
                confidence=prediction.get('confidence', 0.5),
                reasoning=prediction.get('reasoning', ''),
                prediction_for=for_date or datetime.utcnow() + timedelta(days=14)
            )
            
            return {
                'success': True,
                'prediction': prediction
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def answer_question(self, user_id: int, question: str, context_data: dict = None) -> str:
        """Quick Q&A without full conversation context"""
        if not self.initialized:
            return "AI features are currently unavailable."
        
        memory = get_ai_service(user_id)
        user_context = memory.build_full_context('general')
        
        prompt = f"""Answer this question for a payroll platform user:

USER: {user_context['user'].get('first_name', 'User')}
QUESTION: {question}

ADDITIONAL CONTEXT:
{json.dumps(context_data, indent=2) if context_data else 'None provided'}

Provide a helpful, accurate, and concise answer."""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"I couldn't process that question. Error: {str(e)}"
    
    def summarize_data(self, user_id: int, data_type: str, data: Any) -> str:
        """Summarize various types of data for the user"""
        if not self.initialized:
            return "AI summarization unavailable"
        
        prompt = f"""Summarize this {data_type} data in 2-3 sentences:

{json.dumps(data, indent=2) if isinstance(data, (dict, list)) else str(data)}

Be concise and highlight the most important points."""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Unable to summarize: {str(e)}"


# Global instance
saurellius_ai = SaurelliusAI()


def get_saurellius_ai() -> SaurelliusAI:
    """Get the global Saurellius AI instance"""
    return saurellius_ai
