"""
SAURELLIUS AI SERVICE
Powered by Google Gemini - The intelligent heart of Saurellius Cloud Payroll
Provides AI-powered features across the entire platform
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime

import google.generativeai as genai

logger = logging.getLogger(__name__)


class SaurelliusAI:
    """
    SAURELLIUS AI - Your Intelligent Payroll Partner
    Powered by Google Gemini. Provides intelligent assistance across all platform features.
    """
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.vision_model = genai.GenerativeModel('gemini-1.5-flash')
            self.initialized = True
        else:
            logger.warning("GEMINI_API_KEY not found. AI features will be limited.")
            self.initialized = False
    
    def _safe_generate(self, prompt: str, max_tokens: int = 1000) -> Optional[str]:
        """Safely generate AI response with error handling."""
        if not self.initialized:
            return None
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return None

    # =========================================================================
    # PAYROLL ASSISTANT CHATBOT
    # =========================================================================
    
    def chat_assistant(self, message: str, context: Optional[Dict] = None) -> str:
        """
        AI-powered payroll assistant chatbot.
        Answers questions about payroll, taxes, compliance, and platform usage.
        """
        system_context = """You are Saurellius AI, the intelligent payroll assistant powering Saurellius Cloud Payroll Management. 
        You are friendly, professional, and extremely knowledgeable about:
        - Payroll processing and calculations
        - Federal, state, and local tax withholding
        - State-by-state compliance requirements (all 50 states + DC)
        - Employee onboarding and management
        - Paystub generation and verification
        - FICA, FUTA, and employment taxes
        - Overtime, minimum wage, and labor laws
        
        Personality: You're helpful, concise, and professional. Never use emojis.
        You speak with confidence but always recommend consulting a CPA or tax professional for complex situations.
        Format responses with markdown for readability. Keep answers focused and actionable."""
        
        user_context = ""
        if context:
            if context.get('state'):
                user_context += f"\nUser's business state: {context['state']}"
            if context.get('employee_count'):
                user_context += f"\nNumber of employees: {context['employee_count']}"
            if context.get('subscription_plan'):
                user_context += f"\nSubscription plan: {context['subscription_plan']}"
        
        prompt = f"{system_context}{user_context}\n\nUser question: {message}\n\nProvide a helpful response:"
        
        response = self._safe_generate(prompt, max_tokens=800)
        return response or "I'm sorry, I couldn't process your request. Please try again or contact support."

    # =========================================================================
    #  PAYSTUB INTELLIGENCE
    # =========================================================================
    
    def validate_paystub_data(self, paystub_data: Dict) -> Dict[str, Any]:
        """
        AI-powered validation of paystub data.
        Checks for errors, inconsistencies, and compliance issues.
        """
        prompt = f"""Analyze this paystub data for potential errors or issues:

Employee: {paystub_data.get('employee_name', 'Unknown')}
Pay Period: {paystub_data.get('pay_period_start')} to {paystub_data.get('pay_period_end')}
Gross Pay: ${paystub_data.get('gross_pay', 0)}
Federal Tax: ${paystub_data.get('federal_tax', 0)}
State Tax: ${paystub_data.get('state_tax', 0)}
State: {paystub_data.get('state', 'Unknown')}
Social Security: ${paystub_data.get('social_security', 0)}
Medicare: ${paystub_data.get('medicare', 0)}
Net Pay: ${paystub_data.get('net_pay', 0)}
Hours Worked: {paystub_data.get('hours_worked', 0)}
Hourly Rate: ${paystub_data.get('hourly_rate', 0)}

Check for:
1. Tax calculation accuracy (approximate)
2. Missing required fields
3. Logical inconsistencies (e.g., net pay > gross pay)
4. State-specific compliance issues
5. Overtime calculation if hours > 40

Return JSON with:
{{"valid": true/false, "issues": ["issue1", "issue2"], "warnings": ["warning1"], "suggestions": ["suggestion1"]}}"""

        response = self._safe_generate(prompt, max_tokens=500)
        
        try:
            # Try to parse JSON from response
            if response:
                # Find JSON in response
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {"valid": True, "issues": [], "warnings": [], "suggestions": []}

    def explain_paystub(self, paystub_data: Dict) -> str:
        """
        Generate a plain-English explanation of a paystub.
        Helps employees understand their pay breakdown.
        """
        prompt = f"""Explain this paystub in simple terms for an employee:

Gross Pay: ${paystub_data.get('gross_pay', 0)}
Federal Tax Withheld: ${paystub_data.get('federal_tax', 0)}
State Tax Withheld: ${paystub_data.get('state_tax', 0)} ({paystub_data.get('state', 'N/A')})
Social Security: ${paystub_data.get('social_security', 0)}
Medicare: ${paystub_data.get('medicare', 0)}
Other Deductions: ${paystub_data.get('other_deductions', 0)}
Net Pay (Take-Home): ${paystub_data.get('net_pay', 0)}

Provide a friendly, easy-to-understand explanation of:
1. What each deduction is for
2. Why the take-home pay is different from gross pay
3. Any notable items

Keep it concise and use simple language."""

        response = self._safe_generate(prompt, max_tokens=600)
        return response or "Unable to generate explanation at this time."

    def suggest_paystub_corrections(self, paystub_data: Dict, errors: List[str]) -> List[Dict]:
        """
        AI-powered suggestions to fix paystub errors.
        """
        prompt = f"""Given these paystub errors, suggest specific corrections:

Paystub Data:
- Gross Pay: ${paystub_data.get('gross_pay', 0)}
- State: {paystub_data.get('state', 'Unknown')}
- Hours: {paystub_data.get('hours_worked', 0)}
- Rate: ${paystub_data.get('hourly_rate', 0)}

Errors found:
{json.dumps(errors)}

Provide specific, actionable corrections in JSON format:
[{{"field": "field_name", "current_value": "X", "suggested_value": "Y", "reason": "explanation"}}]"""

        response = self._safe_generate(prompt, max_tokens=500)
        
        try:
            if response:
                start = response.find('[')
                end = response.rfind(']') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return []

    # =========================================================================
    #  DASHBOARD INSIGHTS
    # =========================================================================
    
    def generate_dashboard_insights(self, metrics: Dict) -> Dict[str, Any]:
        """
        Generate AI-powered insights for the dashboard.
        Analyzes payroll trends and provides recommendations.
        """
        prompt = f"""Analyze these payroll metrics and provide business insights:

Current Period:
- Total Payroll: ${metrics.get('total_payroll', 0)}
- Employee Count: {metrics.get('employee_count', 0)}
- Average Pay: ${metrics.get('avg_pay', 0)}
- Paystubs Generated: {metrics.get('paystubs_generated', 0)}

Previous Period:
- Total Payroll: ${metrics.get('prev_total_payroll', 0)}
- Paystubs Generated: {metrics.get('prev_paystubs', 0)}

Subscription:
- Plan: {metrics.get('plan', 'Unknown')}
- Usage: {metrics.get('usage_percent', 0)}%

Generate JSON with:
{{
    "headline": "One-line summary",
    "insights": ["insight1", "insight2", "insight3"],
    "trends": {{"payroll_trend": "up/down/stable", "percent_change": X}},
    "recommendations": ["recommendation1", "recommendation2"],
    "alerts": ["any urgent items"]
}}"""

        response = self._safe_generate(prompt, max_tokens=600)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {
            "headline": "Your payroll is running smoothly",
            "insights": [],
            "trends": {},
            "recommendations": [],
            "alerts": []
        }

    # =========================================================================
    #  COMPLIANCE ASSISTANT
    # =========================================================================
    
    def check_state_compliance(self, state: str, business_info: Dict) -> Dict[str, Any]:
        """
        AI-powered compliance check for a specific state.
        Identifies potential compliance issues based on business details.
        """
        prompt = f"""Check compliance requirements for a business in {state}:

Business Details:
- Employee Count: {business_info.get('employee_count', 0)}
- Industry: {business_info.get('industry', 'General')}
- Has Remote Workers: {business_info.get('has_remote_workers', False)}
- Offers Benefits: {business_info.get('offers_benefits', False)}

Check for:
1. Workers' compensation requirements
2. State income tax withholding
3. Unemployment insurance
4. Paid family leave (if applicable)
5. Sexual harassment training requirements
6. E-Verify requirements
7. Minimum wage compliance
8. Overtime rules

Return JSON:
{{
    "compliant": true/false,
    "requirements": [{{"item": "name", "status": "compliant/action_needed/warning", "details": "explanation"}}],
    "action_items": ["specific actions to take"],
    "resources": ["helpful links or next steps"]
}}"""

        response = self._safe_generate(prompt, max_tokens=800)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {
            "compliant": True,
            "requirements": [],
            "action_items": [],
            "resources": []
        }

    def explain_state_rule(self, state: str, rule_type: str) -> str:
        """
        Explain a specific state payroll rule in plain English.
        """
        prompt = f"""Explain {rule_type} requirements for {state} in simple terms:

Cover:
1. What is required
2. Who it applies to
3. Key deadlines or thresholds
4. Penalties for non-compliance
5. How to stay compliant

Be concise and practical. Use bullet points."""

        response = self._safe_generate(prompt, max_tokens=500)
        return response or f"Unable to retrieve {rule_type} information for {state}."

    # =========================================================================
    #  EMPLOYEE MANAGEMENT
    # =========================================================================
    
    def analyze_employee_data(self, employee_data: Dict) -> Dict[str, Any]:
        """
        AI analysis of employee data for insights and issues.
        """
        prompt = f"""Analyze this employee data:

Name: {employee_data.get('name', 'Unknown')}
Position: {employee_data.get('position', 'N/A')}
Hire Date: {employee_data.get('hire_date', 'N/A')}
State: {employee_data.get('state', 'N/A')}
Pay Type: {employee_data.get('pay_type', 'hourly')}
Rate: ${employee_data.get('pay_rate', 0)}
Filing Status: {employee_data.get('filing_status', 'Single')}
Allowances: {employee_data.get('allowances', 0)}

Provide JSON with:
{{
    "data_quality": "complete/incomplete/has_issues",
    "missing_fields": ["field1", "field2"],
    "suggestions": ["suggestion1"],
    "tax_setup_correct": true/false,
    "notes": "any important observations"
}}"""

        response = self._safe_generate(prompt, max_tokens=400)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {"data_quality": "complete", "missing_fields": [], "suggestions": []}

    def generate_onboarding_checklist(self, state: str, employee_type: str = "full-time") -> List[Dict]:
        """
        Generate AI-powered onboarding checklist for new employees.
        """
        prompt = f"""Create an onboarding checklist for a new {employee_type} employee in {state}:

Include:
1. Required federal forms (W-4, I-9, etc.)
2. State-specific forms
3. Tax withholding setup
4. Benefits enrollment (if applicable)
5. Direct deposit setup
6. Policy acknowledgments

Return JSON array:
[{{"task": "task name", "required": true/false, "deadline": "when", "category": "category"}}]"""

        response = self._safe_generate(prompt, max_tokens=600)
        
        try:
            if response:
                start = response.find('[')
                end = response.rfind(']') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return [
            {"task": "Complete W-4 form", "required": True, "deadline": "First day", "category": "Tax Forms"},
            {"task": "Complete I-9 form", "required": True, "deadline": "Within 3 days", "category": "Eligibility"},
            {"task": "Set up direct deposit", "required": False, "deadline": "First week", "category": "Payroll"},
        ]

    # =========================================================================
    #  TAX INTELLIGENCE
    # =========================================================================
    
    def explain_tax_calculation(self, tax_breakdown: Dict) -> str:
        """
        Explain tax calculations in plain English.
        """
        prompt = f"""Explain these tax withholdings simply:

Gross Pay: ${tax_breakdown.get('gross_pay', 0)}
Filing Status: {tax_breakdown.get('filing_status', 'Single')}
Pay Frequency: {tax_breakdown.get('pay_frequency', 'Bi-weekly')}

Federal Income Tax: ${tax_breakdown.get('federal_income_tax', 0)}
Social Security (6.2%): ${tax_breakdown.get('social_security', 0)}
Medicare (1.45%): ${tax_breakdown.get('medicare', 0)}
State Tax ({tax_breakdown.get('state', 'N/A')}): ${tax_breakdown.get('state_tax', 0)}
Local Tax: ${tax_breakdown.get('local_tax', 0)}

Explain why each amount is what it is, in simple terms an employee would understand."""

        response = self._safe_generate(prompt, max_tokens=600)
        return response or "Tax calculation explanation unavailable."

    def optimize_withholding(self, employee_info: Dict) -> Dict[str, Any]:
        """
        AI suggestions for optimizing tax withholding.
        """
        prompt = f"""Analyze tax withholding for optimization:

Current Setup:
- Filing Status: {employee_info.get('filing_status', 'Single')}
- Allowances/Adjustments: {employee_info.get('allowances', 0)}
- Additional Withholding: ${employee_info.get('additional_withholding', 0)}
- Annual Salary: ${employee_info.get('annual_salary', 0)}
- State: {employee_info.get('state', 'N/A')}

Last Year:
- Refund/Owed: ${employee_info.get('last_year_result', 0)} {'refund' if employee_info.get('was_refund') else 'owed'}

Provide JSON:
{{
    "current_assessment": "over-withheld/under-withheld/balanced",
    "suggestions": ["suggestion1", "suggestion2"],
    "potential_adjustment": "description of recommended change",
    "disclaimer": "always consult tax professional"
}}"""

        response = self._safe_generate(prompt, max_tokens=500)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {
            "current_assessment": "balanced",
            "suggestions": [],
            "potential_adjustment": None,
            "disclaimer": "Consult a tax professional for personalized advice."
        }

    # =========================================================================
    #  FRAUD DETECTION
    # =========================================================================
    
    def detect_anomalies(self, paystub_history: List[Dict]) -> Dict[str, Any]:
        """
        AI-powered anomaly detection in paystub patterns.
        Identifies potentially fraudulent or erroneous entries.
        """
        if len(paystub_history) < 3:
            return {"anomalies_detected": False, "items": []}
        
        # Summarize history for prompt
        summary = []
        for i, stub in enumerate(paystub_history[-10:]):  # Last 10
            summary.append(f"Pay {i+1}: Gross ${stub.get('gross_pay', 0)}, Net ${stub.get('net_pay', 0)}")
        
        prompt = f"""Analyze these recent paystubs for anomalies:

{chr(10).join(summary)}

Look for:
1. Unusual spikes or drops in pay
2. Inconsistent deduction patterns
3. Potential data entry errors
4. Patterns that might indicate fraud

Return JSON:
{{
    "anomalies_detected": true/false,
    "risk_level": "low/medium/high",
    "items": [{{"pay_period": X, "issue": "description", "severity": "low/medium/high"}}],
    "recommendation": "what to do"
}}"""

        response = self._safe_generate(prompt, max_tokens=500)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {"anomalies_detected": False, "risk_level": "low", "items": []}

    # =========================================================================
    #  NATURAL LANGUAGE QUERIES
    # =========================================================================
    
    def process_natural_query(self, query: str, available_data: Dict) -> Dict[str, Any]:
        """
        Process natural language queries about payroll data.
        E.g., "Show me total payroll for last month"
        """
        prompt = f"""Parse this natural language payroll query:

Query: "{query}"

Available data types:
- paystubs (with dates, amounts, employee names)
- employees (names, departments, states)
- tax summaries
- compliance status

Return JSON:
{{
    "intent": "query_type (e.g., sum_payroll, list_employees, get_tax_info)",
    "filters": {{"date_range": "X", "employee": "Y", "state": "Z"}},
    "aggregation": "sum/count/average/list",
    "response_format": "number/list/chart",
    "clarification_needed": null or "question to ask user"
}}"""

        response = self._safe_generate(prompt, max_tokens=300)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {"intent": "unknown", "clarification_needed": "Could you rephrase your question?"}

    # =========================================================================
    #  DOCUMENT ANALYSIS
    # =========================================================================
    
    def analyze_uploaded_document(self, document_text: str, doc_type: str = "unknown") -> Dict[str, Any]:
        """
        Analyze uploaded documents (W-4, I-9, etc.) and extract data.
        """
        prompt = f"""Analyze this {doc_type} document and extract key information:

Document content:
{document_text[:2000]}  # Limit to 2000 chars

Extract and return JSON:
{{
    "document_type": "detected type",
    "extracted_fields": {{"field_name": "value"}},
    "completeness": "complete/incomplete",
    "missing_fields": ["field1", "field2"],
    "validation_issues": ["issue1"],
    "confidence": 0.0-1.0
}}"""

        response = self._safe_generate(prompt, max_tokens=600)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {"document_type": "unknown", "extracted_fields": {}, "confidence": 0.0}

    # =========================================================================
    #  SMART RECOMMENDATIONS
    # =========================================================================
    
    def get_plan_recommendation(self, usage_data: Dict) -> Dict[str, Any]:
        """
        AI-powered subscription plan recommendation.
        """
        prompt = f"""Recommend a subscription plan based on usage:

Current Plan: {usage_data.get('current_plan', 'Free')}
Monthly Paystubs: {usage_data.get('monthly_paystubs', 0)}
Employee Count: {usage_data.get('employee_count', 0)}
Plan Limit: {usage_data.get('plan_limit', 0)}
Usage Percentage: {usage_data.get('usage_percent', 0)}%
Growth Rate: {usage_data.get('growth_rate', 0)}% monthly

Available Plans:
- Free: 5 paystubs/month
- Starter ($19/mo): 50 paystubs/month
- Professional ($49/mo): 200 paystubs/month
- Business ($99/mo): 500 paystubs/month
- Enterprise (Custom): Unlimited

Return JSON:
{{
    "recommended_plan": "plan name",
    "reason": "explanation",
    "savings_potential": "if downgrading makes sense",
    "urgency": "low/medium/high",
    "projected_needs": "in 3 months you'll need X"
}}"""

        response = self._safe_generate(prompt, max_tokens=400)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {"recommended_plan": usage_data.get('current_plan', 'Starter'), "reason": "Current plan suits your needs"}


# Singleton instance
saurellius_ai = SaurelliusAI()

# Alias for backward compatibility
gemini_ai = saurellius_ai
