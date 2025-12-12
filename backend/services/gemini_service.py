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


    # =========================================================================
    #  DIGITAL WALLET INTELLIGENCE
    # =========================================================================
    
    def analyze_wallet_transaction(self, transaction: Dict, history: List[Dict]) -> Dict[str, Any]:
        """
        AI-powered analysis of wallet transactions for fraud detection and insights.
        """
        recent_summary = []
        for t in history[-10:]:
            recent_summary.append(f"{t.get('type')}: ${t.get('amount', 0)}")
        
        prompt = f"""Analyze this digital wallet transaction:

Current Transaction:
- Type: {transaction.get('type', 'unknown')}
- Amount: ${transaction.get('amount', 0)}
- Description: {transaction.get('description', '')}
- Recipient: {transaction.get('recipient', 'N/A')}

Recent Transaction History:
{chr(10).join(recent_summary) if recent_summary else 'No history'}

Wallet Balance: ${transaction.get('balance_before', 0)}

Analyze for:
1. Unusual transaction patterns
2. Potential fraud indicators
3. Spending insights
4. Budget recommendations

Return JSON:
{{
    "risk_score": 0-100,
    "risk_level": "low/medium/high",
    "flags": ["flag1", "flag2"],
    "insights": ["insight1", "insight2"],
    "recommendation": "action to take",
    "approved": true/false
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
        
        return {"risk_score": 0, "risk_level": "low", "flags": [], "approved": True}

    def get_wallet_insights(self, wallet_data: Dict) -> Dict[str, Any]:
        """
        Generate AI-powered insights for wallet usage and spending patterns.
        """
        prompt = f"""Analyze this employer wallet data and provide business insights:

Wallet Summary:
- Current Balance: ${wallet_data.get('balance', 0)}
- Reserved for Payroll: ${wallet_data.get('reserved', 0)}
- Available Balance: ${wallet_data.get('available', 0)}
- Total Funded (MTD): ${wallet_data.get('funded_mtd', 0)}
- Total Paid Out (MTD): ${wallet_data.get('paid_mtd', 0)}
- Employee Count: {wallet_data.get('employee_count', 0)}

Transaction Breakdown:
- Payroll Payments: {wallet_data.get('payroll_count', 0)}
- EWA Requests: {wallet_data.get('ewa_count', 0)}
- Bank Transfers: {wallet_data.get('transfer_count', 0)}

Provide JSON:
{{
    "headline": "One-line wallet status summary",
    "health_score": 0-100,
    "insights": ["insight1", "insight2", "insight3"],
    "recommendations": ["recommendation1", "recommendation2"],
    "alerts": ["any urgent items"],
    "funding_suggestion": "recommended funding amount for next payroll"
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
            "headline": "Wallet is healthy",
            "health_score": 85,
            "insights": [],
            "recommendations": [],
            "alerts": []
        }

    def analyze_ewa_request(self, request_data: Dict, employee_history: Dict) -> Dict[str, Any]:
        """
        AI analysis of Earned Wage Access requests for risk assessment.
        """
        prompt = f"""Analyze this Earned Wage Access (EWA) request:

Request Details:
- Employee: {request_data.get('employee_name', 'Unknown')}
- Amount Requested: ${request_data.get('amount', 0)}
- Wages Earned (Current Period): ${request_data.get('earned_wages', 0)}
- Percentage of Earned: {request_data.get('percentage', 0)}%
- Days Until Payday: {request_data.get('days_to_payday', 0)}

Employee History:
- EWA Requests This Month: {employee_history.get('ewa_count_month', 0)}
- Average Request Amount: ${employee_history.get('avg_ewa_amount', 0)}
- On-Time Repayment Rate: {employee_history.get('repayment_rate', 100)}%
- Employment Duration: {employee_history.get('tenure_months', 0)} months

Evaluate:
1. Risk level of this request
2. Pattern analysis
3. Financial wellness indicators
4. Approval recommendation

Return JSON:
{{
    "risk_score": 0-100,
    "risk_level": "low/medium/high",
    "approval_recommended": true/false,
    "max_recommended_amount": 0,
    "concerns": ["concern1"],
    "financial_wellness_score": 0-100,
    "suggested_resources": ["resource1"]
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
            "risk_score": 20,
            "risk_level": "low",
            "approval_recommended": True,
            "financial_wellness_score": 75
        }

    # =========================================================================
    #  WORKFORCE SCHEDULING INTELLIGENCE
    # =========================================================================
    
    def optimize_schedule(self, schedule_data: Dict) -> Dict[str, Any]:
        """
        AI-powered schedule optimization recommendations.
        """
        prompt = f"""Analyze and optimize this workforce schedule:

Schedule Period: {schedule_data.get('week_of', 'Current Week')}
Total Employees: {schedule_data.get('employee_count', 0)}
Total Shifts: {schedule_data.get('shift_count', 0)}
Total Hours Scheduled: {schedule_data.get('total_hours', 0)}

Coverage by Day:
{json.dumps(schedule_data.get('daily_coverage', {}), indent=2)}

Issues Detected:
- Overtime Risk: {schedule_data.get('overtime_employees', 0)} employees over 40 hours
- Understaffed Shifts: {schedule_data.get('understaffed_count', 0)}
- Open Shifts: {schedule_data.get('open_shifts', 0)}

Employee Preferences:
- Availability Conflicts: {schedule_data.get('conflicts', 0)}
- Time-Off Requests: {schedule_data.get('pto_requests', 0)}

Provide JSON:
{{
    "optimization_score": 0-100,
    "issues": [{{"issue": "description", "severity": "low/medium/high", "affected": "who/what"}}],
    "recommendations": [{{"action": "what to do", "impact": "expected result", "priority": "high/medium/low"}}],
    "cost_savings_potential": "estimated savings",
    "overtime_alerts": ["employee names at risk"],
    "coverage_gaps": [{{"day": "day", "time": "time range", "needed": X}}]
}}"""

        response = self._safe_generate(prompt, max_tokens=700)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {
            "optimization_score": 80,
            "issues": [],
            "recommendations": [],
            "overtime_alerts": []
        }

    def predict_scheduling_needs(self, historical_data: Dict) -> Dict[str, Any]:
        """
        AI-powered prediction of future scheduling needs.
        """
        prompt = f"""Predict scheduling needs based on historical data:

Historical Patterns:
- Average Weekly Hours: {historical_data.get('avg_weekly_hours', 0)}
- Peak Days: {historical_data.get('peak_days', [])}
- Peak Hours: {historical_data.get('peak_hours', [])}
- Seasonal Trends: {historical_data.get('seasonal_notes', 'None noted')}

Upcoming Events:
{json.dumps(historical_data.get('upcoming_events', []), indent=2)}

Current Staff:
- Total Employees: {historical_data.get('employee_count', 0)}
- Full-Time: {historical_data.get('full_time', 0)}
- Part-Time: {historical_data.get('part_time', 0)}

Provide JSON:
{{
    "predicted_hours_needed": 0,
    "staffing_recommendation": "hire/maintain/reduce",
    "peak_coverage_needs": [{{"day": "day", "hours": "range", "staff_needed": X}}],
    "trends": ["trend1", "trend2"],
    "risks": ["risk1"],
    "confidence": 0-100
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
        
        return {"predicted_hours_needed": 0, "confidence": 50}

    def analyze_shift_swap(self, swap_request: Dict) -> Dict[str, Any]:
        """
        AI analysis of shift swap requests for approval recommendation.
        """
        prompt = f"""Analyze this shift swap request:

Requesting Employee: {swap_request.get('requester', 'Unknown')}
Original Shift: {swap_request.get('original_shift', 'N/A')}
Swap With: {swap_request.get('swap_with', 'Unknown')}
New Shift: {swap_request.get('new_shift', 'N/A')}

Requester Info:
- Weekly Hours (Current): {swap_request.get('requester_hours', 0)}
- Skill Level: {swap_request.get('requester_skill', 'N/A')}
- Position: {swap_request.get('requester_position', 'N/A')}

Swap Partner Info:
- Weekly Hours (Current): {swap_request.get('partner_hours', 0)}
- Skill Level: {swap_request.get('partner_skill', 'N/A')}
- Position: {swap_request.get('partner_position', 'N/A')}

Evaluate:
1. Skill compatibility
2. Overtime implications
3. Coverage impact
4. Fairness

Return JSON:
{{
    "approval_recommended": true/false,
    "concerns": ["concern1"],
    "overtime_impact": "none/minor/significant",
    "coverage_impact": "positive/neutral/negative",
    "notes": "additional context"
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
        
        return {"approval_recommended": True, "concerns": [], "overtime_impact": "none"}

    # =========================================================================
    #  SMART NOTIFICATIONS & ALERTS
    # =========================================================================
    
    def generate_smart_alerts(self, platform_data: Dict) -> List[Dict]:
        """
        Generate AI-powered smart alerts based on platform-wide data.
        """
        prompt = f"""Generate priority alerts based on this platform data:

Payroll:
- Next Payroll Date: {platform_data.get('next_payroll_date', 'N/A')}
- Pending Approvals: {platform_data.get('pending_approvals', 0)}
- Unprocessed Timesheets: {platform_data.get('unprocessed_timesheets', 0)}

Compliance:
- Expiring Documents: {platform_data.get('expiring_docs', 0)}
- Overdue Tasks: {platform_data.get('overdue_tasks', 0)}
- Upcoming Deadlines: {platform_data.get('upcoming_deadlines', [])}

Wallet:
- Balance: ${platform_data.get('wallet_balance', 0)}
- Next Payroll Estimate: ${platform_data.get('next_payroll_estimate', 0)}
- Pending EWA Requests: {platform_data.get('pending_ewa', 0)}

Workforce:
- Open Shifts: {platform_data.get('open_shifts', 0)}
- Overtime Employees: {platform_data.get('overtime_count', 0)}
- PTO Requests Pending: {platform_data.get('pending_pto', 0)}

Generate JSON array of priority alerts:
[{{
    "type": "payroll/compliance/wallet/workforce/general",
    "priority": "critical/high/medium/low",
    "title": "Short title",
    "message": "Detailed message",
    "action": "Suggested action",
    "due_date": "when action needed"
}}]

Return only the most important 5 alerts."""

        response = self._safe_generate(prompt, max_tokens=800)
        
        try:
            if response:
                start = response.find('[')
                end = response.rfind(']') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return []

    def analyze_notification_preferences(self, user_behavior: Dict) -> Dict[str, Any]:
        """
        AI analysis of user behavior to optimize notification delivery.
        """
        prompt = f"""Analyze user notification preferences based on behavior:

User Activity:
- Most Active Hours: {user_behavior.get('active_hours', [])}
- Most Used Features: {user_behavior.get('top_features', [])}
- Notification Open Rate: {user_behavior.get('open_rate', 0)}%
- Preferred Device: {user_behavior.get('device', 'mobile')}

Dismissed Notifications:
{json.dumps(user_behavior.get('dismissed_types', []))}

Acted-On Notifications:
{json.dumps(user_behavior.get('acted_types', []))}

Provide JSON:
{{
    "optimal_notification_times": ["HH:MM"],
    "preferred_channels": ["push/email/in-app"],
    "reduce_frequency_for": ["notification types"],
    "increase_priority_for": ["notification types"],
    "personalization_suggestions": ["suggestion1"]
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
        
        return {"optimal_notification_times": ["09:00", "14:00"]}

    # =========================================================================
    #  PAYROLL INTELLIGENCE (ENHANCED)
    # =========================================================================
    
    def analyze_payroll_run(self, payroll_data: Dict) -> Dict[str, Any]:
        """
        Comprehensive AI analysis of a payroll run before processing.
        """
        prompt = f"""Analyze this payroll run before processing:

Payroll Summary:
- Pay Period: {payroll_data.get('pay_period', 'N/A')}
- Total Employees: {payroll_data.get('employee_count', 0)}
- Total Gross: ${payroll_data.get('total_gross', 0)}
- Total Net: ${payroll_data.get('total_net', 0)}
- Total Taxes: ${payroll_data.get('total_taxes', 0)}

Compared to Last Period:
- Gross Change: {payroll_data.get('gross_change_percent', 0)}%
- Headcount Change: {payroll_data.get('headcount_change', 0)}

Flags:
- New Employees: {payroll_data.get('new_employees', 0)}
- Terminated: {payroll_data.get('terminated', 0)}
- Overtime Hours: {payroll_data.get('overtime_hours', 0)}
- Manual Adjustments: {payroll_data.get('adjustments', 0)}

Provide comprehensive analysis JSON:
{{
    "ready_to_process": true/false,
    "confidence_score": 0-100,
    "anomalies": [{{"employee": "name", "issue": "description", "severity": "low/medium/high"}}],
    "warnings": ["warning1"],
    "recommendations": ["recommendation1"],
    "estimated_processing_time": "X minutes",
    "cost_breakdown": {{
        "gross_wages": 0,
        "employer_taxes": 0,
        "benefits_cost": 0,
        "total_cost": 0
    }}
}}"""

        response = self._safe_generate(prompt, max_tokens=700)
        
        try:
            if response:
                start = response.find('{')
                end = response.rfind('}') + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass
        
        return {"ready_to_process": True, "confidence_score": 85, "anomalies": [], "warnings": []}

    def suggest_payroll_optimizations(self, company_data: Dict) -> Dict[str, Any]:
        """
        AI suggestions for optimizing payroll operations.
        """
        prompt = f"""Suggest payroll optimizations for this company:

Company Profile:
- Employees: {company_data.get('employee_count', 0)}
- States: {company_data.get('states', [])}
- Pay Frequency: {company_data.get('pay_frequency', 'Bi-weekly')}
- Average Processing Time: {company_data.get('avg_processing_time', 0)} minutes

Current Costs:
- Monthly Payroll Admin Cost: ${company_data.get('admin_cost', 0)}
- Error Rate: {company_data.get('error_rate', 0)}%
- Manual Intervention Rate: {company_data.get('manual_rate', 0)}%

Features Used:
{json.dumps(company_data.get('features_used', []))}

Features Not Used:
{json.dumps(company_data.get('features_unused', []))}

Provide JSON:
{{
    "optimization_score": 0-100,
    "quick_wins": [{{"action": "description", "savings": "estimated savings", "effort": "low/medium/high"}}],
    "strategic_recommendations": [{{"action": "description", "impact": "description", "timeline": "X weeks"}}],
    "unused_features_to_adopt": ["feature1"],
    "estimated_annual_savings": 0
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
        
        return {"optimization_score": 70, "quick_wins": [], "strategic_recommendations": []}

    # =========================================================================
    #  CONTEXTUAL CHAT (ENHANCED)
    # =========================================================================
    
    def contextual_chat(self, message: str, full_context: Dict) -> str:
        """
        Enhanced AI chat with full platform context awareness.
        """
        system_context = """You are Saurellius AI, the intelligent assistant for Saurellius Cloud Payroll Management.
        You have access to the user's complete platform context and can provide highly personalized assistance.
        
        Your capabilities span:
        - Payroll processing and tax calculations
        - Digital wallet management and transactions
        - Workforce scheduling and time tracking
        - Employee management and onboarding
        - Compliance and document management
        - Benefits administration
        - Reporting and analytics
        
        Personality: Professional, helpful, and proactive. Never use emojis.
        Always provide actionable advice based on the user's specific situation.
        Reference specific data from their context when relevant."""
        
        context_summary = f"""
USER CONTEXT:
- Company: {full_context.get('company_name', 'N/A')}
- Role: {full_context.get('user_role', 'employer')}
- Subscription: {full_context.get('subscription_plan', 'N/A')}
- Employees: {full_context.get('employee_count', 0)}
- Primary State: {full_context.get('primary_state', 'N/A')}

CURRENT STATUS:
- Wallet Balance: ${full_context.get('wallet_balance', 0)}
- Next Payroll: {full_context.get('next_payroll_date', 'N/A')}
- Pending Tasks: {full_context.get('pending_tasks', 0)}
- Open Shifts: {full_context.get('open_shifts', 0)}
- Pending Approvals: {full_context.get('pending_approvals', 0)}

RECENT ACTIVITY:
{json.dumps(full_context.get('recent_activity', [])[:5])}

ACTIVE ALERTS:
{json.dumps(full_context.get('active_alerts', [])[:3])}
"""
        
        prompt = f"""{system_context}

{context_summary}

User message: {message}

Provide a helpful, context-aware response:"""
        
        response = self._safe_generate(prompt, max_tokens=1000)
        return response or "I apologize, but I couldn't process your request. Please try again."


    # =========================================================================
    #  TALENT MANAGEMENT INTELLIGENCE
    # =========================================================================
    
    def analyze_candidate(self, candidate_data: Dict, job_data: Dict) -> Dict[str, Any]:
        """AI-powered candidate analysis and scoring."""
        prompt = f"""Analyze this job candidate:

Job Position:
- Title: {job_data.get('title', 'N/A')}
- Department: {job_data.get('department', 'N/A')}
- Requirements: {json.dumps(job_data.get('requirements', []))}

Candidate:
- Name: {candidate_data.get('name', 'N/A')}
- Experience: {candidate_data.get('years_experience', 0)} years
- Skills: {json.dumps(candidate_data.get('skills', []))}
- Education: {candidate_data.get('education', 'N/A')}
- Current Stage: {candidate_data.get('stage', 'applied')}

Provide JSON:
{{
    "match_score": 0-100,
    "strengths": ["strength1", "strength2"],
    "concerns": ["concern1"],
    "interview_questions": ["question1", "question2", "question3"],
    "salary_recommendation": {{"min": 0, "max": 0}},
    "hiring_recommendation": "strong_hire/hire/maybe/pass",
    "next_steps": ["step1"]
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
        return {"match_score": 70, "hiring_recommendation": "maybe", "strengths": [], "concerns": []}

    def generate_performance_review(self, employee_data: Dict, metrics: Dict) -> Dict[str, Any]:
        """AI-assisted performance review generation."""
        prompt = f"""Generate a performance review based on this data:

Employee:
- Name: {employee_data.get('name', 'N/A')}
- Role: {employee_data.get('title', 'N/A')}
- Tenure: {employee_data.get('tenure_months', 0)} months
- Department: {employee_data.get('department', 'N/A')}

Performance Metrics:
- Goals Completed: {metrics.get('goals_completed', 0)}/{metrics.get('goals_total', 0)}
- Attendance Rate: {metrics.get('attendance_rate', 100)}%
- Peer Feedback Score: {metrics.get('peer_score', 0)}/5
- Manager Observations: {json.dumps(metrics.get('observations', []))}

Provide JSON:
{{
    "overall_rating": 1-5,
    "summary": "2-3 sentence summary",
    "strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["area1"],
    "goals_for_next_period": ["goal1", "goal2"],
    "development_recommendations": ["recommendation1"],
    "promotion_readiness": "ready/developing/not_ready"
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
        return {"overall_rating": 3, "summary": "Meets expectations", "strengths": [], "areas_for_improvement": []}

    def suggest_learning_path(self, employee_data: Dict, career_goals: List[str]) -> Dict[str, Any]:
        """AI-powered learning path recommendations."""
        prompt = f"""Recommend a learning path for this employee:

Employee:
- Current Role: {employee_data.get('title', 'N/A')}
- Department: {employee_data.get('department', 'N/A')}
- Skills: {json.dumps(employee_data.get('skills', []))}
- Completed Courses: {json.dumps(employee_data.get('completed_courses', []))}

Career Goals: {json.dumps(career_goals)}

Provide JSON:
{{
    "recommended_courses": [{{"title": "course", "priority": "high/medium/low", "duration_hours": 0}}],
    "skill_gaps": ["skill1", "skill2"],
    "certifications_to_pursue": ["cert1"],
    "mentorship_areas": ["area1"],
    "timeline_months": 0,
    "career_path": ["current role", "next role", "future role"]
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
        return {"recommended_courses": [], "skill_gaps": [], "timeline_months": 12}

    # =========================================================================
    #  EMPLOYEE EXPERIENCE INTELLIGENCE
    # =========================================================================
    
    def analyze_financial_wellness(self, employee_data: Dict) -> Dict[str, Any]:
        """AI analysis of employee financial wellness."""
        prompt = f"""Analyze this employee's financial wellness:

Employee Financial Data:
- Salary: ${employee_data.get('salary', 0)}/year
- 401(k) Contribution: {employee_data.get('retirement_contribution', 0)}%
- Employer Match Used: {employee_data.get('match_utilized', 0)}%
- EWA Usage (Monthly): {employee_data.get('ewa_count', 0)} requests
- Average EWA Amount: ${employee_data.get('avg_ewa', 0)}
- Direct Deposit Splits: {employee_data.get('dd_splits', 1)}

Benefits Enrolled:
{json.dumps(employee_data.get('benefits', []))}

Provide JSON:
{{
    "wellness_score": 0-100,
    "risk_indicators": ["indicator1"],
    "positive_behaviors": ["behavior1"],
    "recommendations": [{{"action": "description", "impact": "high/medium/low"}}],
    "resources": ["resource1", "resource2"],
    "retirement_projection": "on track/needs attention/at risk"
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
        return {"wellness_score": 70, "risk_indicators": [], "recommendations": []}

    def analyze_survey_responses(self, survey_data: Dict) -> Dict[str, Any]:
        """AI analysis of engagement survey responses."""
        prompt = f"""Analyze these employee engagement survey results:

Survey: {survey_data.get('title', 'Engagement Survey')}
Response Rate: {survey_data.get('response_rate', 0)}%
Total Responses: {survey_data.get('response_count', 0)}

Question Scores (1-5 scale):
{json.dumps(survey_data.get('scores_by_question', {}))}

Open-Ended Feedback Themes:
{json.dumps(survey_data.get('feedback_themes', []))}

Comparison to Last Survey:
- Overall Change: {survey_data.get('score_change', 0)}

Provide JSON:
{{
    "overall_sentiment": "positive/neutral/negative",
    "engagement_score": 0-100,
    "top_strengths": ["strength1", "strength2"],
    "top_concerns": ["concern1", "concern2"],
    "action_items": [{{"priority": "high/medium/low", "action": "description", "owner": "HR/Manager/Leadership"}}],
    "trend_analysis": "improving/stable/declining",
    "benchmark_comparison": "above/at/below industry average"
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
        return {"overall_sentiment": "neutral", "engagement_score": 70, "top_strengths": [], "action_items": []}

    # =========================================================================
    #  JOB COSTING & LABOR INTELLIGENCE
    # =========================================================================
    
    def analyze_project_profitability(self, project_data: Dict) -> Dict[str, Any]:
        """AI analysis of project profitability and recommendations."""
        prompt = f"""Analyze this project's profitability:

Project: {project_data.get('name', 'N/A')}
Client: {project_data.get('client', 'N/A')}

Budget vs Actual:
- Budget Hours: {project_data.get('budget_hours', 0)}
- Actual Hours: {project_data.get('actual_hours', 0)}
- Budget Cost: ${project_data.get('budget_cost', 0)}
- Actual Cost: ${project_data.get('actual_cost', 0)}
- Revenue: ${project_data.get('revenue', 0)}

Timeline:
- Start: {project_data.get('start_date', 'N/A')}
- Expected End: {project_data.get('end_date', 'N/A')}
- Percent Complete: {project_data.get('percent_complete', 0)}%

Team:
- Headcount: {project_data.get('team_size', 0)}
- Avg Hourly Rate: ${project_data.get('avg_rate', 0)}

Provide JSON:
{{
    "profit_margin": 0,
    "health_status": "healthy/at_risk/critical",
    "budget_variance": 0,
    "projected_final_cost": 0,
    "projected_profit": 0,
    "risks": ["risk1"],
    "recommendations": ["recommendation1"],
    "resource_optimization": ["suggestion1"]
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
        return {"profit_margin": 20, "health_status": "healthy", "risks": [], "recommendations": []}

    def forecast_labor_needs(self, historical_data: Dict) -> Dict[str, Any]:
        """AI-powered labor demand forecasting."""
        prompt = f"""Forecast labor needs based on historical data:

Historical Patterns:
- Peak Days: {json.dumps(historical_data.get('peak_days', []))}
- Average Daily Hours: {historical_data.get('avg_daily_hours', 0)}
- Seasonal Trends: {json.dumps(historical_data.get('seasonal', {}))}
- Growth Rate: {historical_data.get('growth_rate', 0)}%

Current Workforce:
- Total Employees: {historical_data.get('employee_count', 0)}
- Full-Time: {historical_data.get('full_time', 0)}
- Part-Time: {historical_data.get('part_time', 0)}
- Average Utilization: {historical_data.get('utilization', 0)}%

Provide JSON:
{{
    "next_week_hours_needed": 0,
    "next_month_hours_needed": 0,
    "recommended_headcount": 0,
    "hiring_recommendations": [{{"role": "title", "count": 0, "urgency": "high/medium/low"}}],
    "overtime_forecast": 0,
    "cost_projection": 0,
    "confidence_level": 0-100
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
        return {"next_week_hours_needed": 0, "recommended_headcount": 0, "confidence_level": 70}

    # =========================================================================
    #  BENEFITS & RETIREMENT INTELLIGENCE
    # =========================================================================
    
    def optimize_benefits_selection(self, employee_data: Dict, available_plans: List[Dict]) -> Dict[str, Any]:
        """AI-powered benefits selection recommendations."""
        prompt = f"""Recommend optimal benefits selection:

Employee Profile:
- Age: {employee_data.get('age', 0)}
- Salary: ${employee_data.get('salary', 0)}
- Dependents: {employee_data.get('dependents', 0)}
- Spouse Covered Elsewhere: {employee_data.get('spouse_coverage', False)}
- Health Conditions: {employee_data.get('health_status', 'healthy')}
- Expected Medical Usage: {employee_data.get('medical_usage', 'low')}

Available Plans:
{json.dumps(available_plans[:5])}

Provide JSON:
{{
    "recommended_medical": {{"plan_id": "id", "reason": "explanation"}},
    "recommended_dental": {{"plan_id": "id", "reason": "explanation"}},
    "recommended_vision": {{"plan_id": "id", "reason": "explanation"}},
    "hsa_recommendation": {{"contribute": true/false, "amount": 0}},
    "fsa_recommendation": {{"contribute": true/false, "amount": 0}},
    "life_insurance_recommendation": {{"multiplier": 0, "reason": "explanation"}},
    "total_annual_cost": 0,
    "total_annual_value": 0,
    "savings_vs_max": 0
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
        return {"recommended_medical": {}, "total_annual_cost": 0}

    def analyze_retirement_readiness(self, employee_data: Dict) -> Dict[str, Any]:
        """AI analysis of retirement readiness and recommendations."""
        prompt = f"""Analyze retirement readiness:

Employee:
- Age: {employee_data.get('age', 0)}
- Target Retirement Age: {employee_data.get('retirement_age', 65)}
- Current Salary: ${employee_data.get('salary', 0)}
- Years of Service: {employee_data.get('tenure_years', 0)}

Retirement Accounts:
- 401(k) Balance: ${employee_data.get('balance_401k', 0)}
- Current Contribution: {employee_data.get('contribution_pct', 0)}%
- Employer Match: {employee_data.get('match_pct', 0)}%
- Match Utilized: {employee_data.get('match_utilized', 0)}%
- Vesting: {employee_data.get('vesting_pct', 0)}%

Provide JSON:
{{
    "readiness_score": 0-100,
    "on_track": true/false,
    "projected_balance_at_retirement": 0,
    "monthly_retirement_income": 0,
    "income_replacement_ratio": 0,
    "recommendations": [{{"action": "description", "impact": "high/medium/low"}}],
    "contribution_suggestion": 0,
    "catch_up_needed": true/false
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
        return {"readiness_score": 60, "on_track": False, "recommendations": []}

    # =========================================================================
    #  CONTRACTOR INTELLIGENCE
    # =========================================================================
    
    def analyze_contractor_relationship(self, contractor_data: Dict) -> Dict[str, Any]:
        """AI analysis of contractor relationships and compliance."""
        prompt = f"""Analyze this contractor relationship:

Contractor:
- Name: {contractor_data.get('name', 'N/A')}
- Type: {contractor_data.get('type', 'individual')}
- Engagement Duration: {contractor_data.get('months_engaged', 0)} months
- Total Paid YTD: ${contractor_data.get('ytd_paid', 0)}
- Projects: {contractor_data.get('project_count', 0)}

Work Patterns:
- Hours/Week: {contractor_data.get('avg_hours_week', 0)}
- Uses Own Equipment: {contractor_data.get('own_equipment', True)}
- Works for Others: {contractor_data.get('works_for_others', True)}
- Controls Own Schedule: {contractor_data.get('controls_schedule', True)}

Provide JSON:
{{
    "classification_risk": "low/medium/high",
    "misclassification_indicators": ["indicator1"],
    "compliance_score": 0-100,
    "1099_status": "required/not_required",
    "recommendations": ["recommendation1"],
    "cost_efficiency": "above_market/market_rate/below_market",
    "continue_engagement": true/false
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
        return {"classification_risk": "low", "compliance_score": 90, "1099_status": "required"}

    # =========================================================================
    #  TAX INTELLIGENCE
    # =========================================================================
    
    def analyze_tax_situation(self, company_data: Dict) -> Dict[str, Any]:
        """AI analysis of company tax situation and optimization opportunities."""
        prompt = f"""Analyze this company's payroll tax situation:

Company Profile:
- Employees: {company_data.get('employee_count', 0)}
- States: {json.dumps(company_data.get('states', []))}
- Annual Payroll: ${company_data.get('annual_payroll', 0)}

Tax Summary YTD:
- Federal Withholding: ${company_data.get('federal_withheld', 0)}
- State Withholding: ${company_data.get('state_withheld', 0)}
- FICA (Employee): ${company_data.get('fica_employee', 0)}
- FICA (Employer): ${company_data.get('fica_employer', 0)}
- FUTA: ${company_data.get('futa', 0)}
- SUTA: ${company_data.get('suta', 0)}

Issues:
- Late Deposits: {company_data.get('late_deposits', 0)}
- Amended Returns: {company_data.get('amendments', 0)}
- Penalties YTD: ${company_data.get('penalties', 0)}

Provide JSON:
{{
    "compliance_score": 0-100,
    "risk_areas": ["area1"],
    "optimization_opportunities": [{{"area": "description", "potential_savings": 0}}],
    "upcoming_deadlines": [{{"deadline": "date", "item": "description", "priority": "high/medium/low"}}],
    "suta_rate_recommendations": ["recommendation1"],
    "credit_opportunities": ["credit1"],
    "estimated_annual_tax_burden": 0
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
        return {"compliance_score": 85, "risk_areas": [], "optimization_opportunities": []}

    # =========================================================================
    #  REGULATORY FILING INTELLIGENCE
    # =========================================================================
    
    def analyze_compliance_status(self, company_data: Dict) -> Dict[str, Any]:
        """AI analysis of regulatory compliance status and risk assessment."""
        prompt = f"""Analyze this company's regulatory filing compliance:

Company Profile:
- EIN: {company_data.get('ein_masked', 'XX-XXXXXXX')}
- Employees: {company_data.get('employee_count', 0)}
- Contractors: {company_data.get('contractor_count', 0)}
- States Operating: {json.dumps(company_data.get('states', []))}
- Industry: {company_data.get('industry', 'General')}

Filing Status:
- Last 941 Filed: {company_data.get('last_941_filed', 'N/A')}
- Last 940 Filed: {company_data.get('last_940_filed', 'N/A')}
- W-2s Filed: {company_data.get('w2s_filed', 0)}
- 1099s Filed: {company_data.get('1099s_filed', 0)}
- New Hires Reported: {company_data.get('new_hires_reported', 0)}

Deposit History:
- EFTPS Deposits Made: {company_data.get('eftps_deposits', 0)}
- Late Deposits: {company_data.get('late_deposits', 0)}
- Deposit Schedule: {company_data.get('deposit_schedule', 'monthly')}

Outstanding Items:
- Pending Filings: {json.dumps(company_data.get('pending_filings', []))}
- Overdue Items: {company_data.get('overdue_count', 0)}

Provide JSON:
{{
    "overall_compliance_score": 0-100,
    "risk_level": "low/medium/high/critical",
    "immediate_actions": [{{"action": "description", "deadline": "date", "penalty_risk": "$amount"}}],
    "upcoming_deadlines": [{{"form": "name", "due_date": "date", "status": "pending/ready/overdue"}}],
    "audit_risk_factors": ["factor1"],
    "recommendations": [{{"area": "description", "priority": "high/medium/low", "impact": "description"}}],
    "estimated_penalty_exposure": 0,
    "state_specific_issues": [{{"state": "XX", "issue": "description"}}]
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
        return {"overall_compliance_score": 80, "risk_level": "low", "immediate_actions": [], "recommendations": []}

    def analyze_filing_deadline(self, deadline_data: Dict) -> Dict[str, Any]:
        """AI analysis of filing deadline with preparation guidance."""
        prompt = f"""Provide guidance for this upcoming filing deadline:

Filing Details:
- Form: {deadline_data.get('form_type', 'Unknown')}
- Due Date: {deadline_data.get('due_date', 'N/A')}
- Days Until Due: {deadline_data.get('days_until', 0)}
- Agency: {deadline_data.get('agency', 'IRS')}
- Period: {deadline_data.get('tax_period', 'N/A')}

Company Status:
- Data Ready: {deadline_data.get('data_ready', False)}
- Prior Year Filed: {deadline_data.get('prior_filed', True)}
- Amendment Required: {deadline_data.get('needs_amendment', False)}

Provide JSON:
{{
    "urgency_level": "low/medium/high/critical",
    "preparation_checklist": ["item1", "item2"],
    "common_errors_to_avoid": ["error1"],
    "late_filing_penalty": "$amount or description",
    "extension_available": true/false,
    "extension_deadline": "date or N/A",
    "filing_method": "electronic/paper/either",
    "estimated_preparation_time": "X hours",
    "tips": ["tip1"]
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
        return {"urgency_level": "medium", "preparation_checklist": [], "tips": []}

    def explain_tax_form(self, form_type: str, form_data: Optional[Dict] = None) -> str:
        """AI explanation of tax forms in plain language."""
        prompt = f"""Explain {form_type} tax form in plain language for a business owner:

Form: {form_type}
{f"Form Data: {json.dumps(form_data)}" if form_data else ""}

Provide:
1. What this form is for (2-3 sentences)
2. Who must file it
3. When it's due
4. Key sections/boxes to understand
5. Common mistakes to avoid
6. How Saurellius helps with this form

Keep the explanation clear and practical. No emojis."""

        response = self._safe_generate(prompt, max_tokens=600)
        return response or f"{form_type} is a required tax form. Please consult with a tax professional for specific guidance."

    def analyze_deposit_schedule(self, payroll_data: Dict) -> Dict[str, Any]:
        """AI analysis of EFTPS deposit requirements."""
        prompt = f"""Analyze EFTPS deposit requirements:

Payroll Summary:
- Pay Date: {payroll_data.get('pay_date', 'N/A')}
- Total Federal Liability: ${payroll_data.get('federal_liability', 0)}
- Employees Paid: {payroll_data.get('employee_count', 0)}

Tax Breakdown:
- Federal Withholding: ${payroll_data.get('federal_withheld', 0)}
- Social Security (Total): ${payroll_data.get('social_security_total', 0)}
- Medicare (Total): ${payroll_data.get('medicare_total', 0)}

Company Status:
- Current Schedule: {payroll_data.get('deposit_schedule', 'monthly')}
- Lookback Period Liability: ${payroll_data.get('lookback_liability', 0)}
- Accumulated This Period: ${payroll_data.get('accumulated', 0)}

Provide JSON:
{{
    "required_deposit": 0,
    "deposit_due_date": "YYYY-MM-DD",
    "deposit_rule_applied": "monthly/semi_weekly/next_day",
    "rule_explanation": "brief explanation",
    "next_day_threshold_warning": true/false,
    "schedule_change_recommended": true/false,
    "penalty_if_late": "$amount",
    "recommended_actions": ["action1"]
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
        return {"required_deposit": 0, "deposit_rule_applied": "monthly", "recommended_actions": []}

    # =========================================================================
    #  DOCUMENT INTELLIGENCE
    # =========================================================================
    
    def analyze_document(self, document_data: Dict) -> Dict[str, Any]:
        """AI analysis of uploaded documents for classification and extraction."""
        prompt = f"""Analyze this uploaded document:

Document Info:
- Filename: {document_data.get('filename', 'unknown')}
- File Type: {document_data.get('file_type', 'unknown')}
- Category: {document_data.get('category', 'uncategorized')}
- File Size: {document_data.get('file_size', 0)} bytes
- Upload Context: {document_data.get('context', 'general')}

{f"Extracted Text Sample: {document_data.get('text_sample', '')[:500]}" if document_data.get('text_sample') else ""}

Provide JSON:
{{
    "document_type": "w4/i9/w9/paystub/tax_form/receipt/contract/other",
    "confidence": 0-100,
    "suggested_category": "category_name",
    "extracted_data": {{"field1": "value1"}},
    "requires_review": true/false,
    "compliance_relevant": true/false,
    "retention_period": "X years",
    "action_items": ["action1"],
    "warnings": ["warning1"]
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
        return {"document_type": "other", "confidence": 50, "requires_review": True}

    def extract_receipt_data(self, receipt_data: Dict) -> Dict[str, Any]:
        """AI extraction of data from receipt images/documents."""
        prompt = f"""Extract expense data from this receipt:

Receipt Info:
- Filename: {receipt_data.get('filename', 'receipt')}
- Context: {receipt_data.get('context', 'business expense')}

{f"Text Content: {receipt_data.get('text_content', '')}" if receipt_data.get('text_content') else ""}

Extract and return JSON:
{{
    "vendor_name": "name",
    "date": "YYYY-MM-DD",
    "total_amount": 0.00,
    "subtotal": 0.00,
    "tax_amount": 0.00,
    "tip_amount": 0.00,
    "payment_method": "cash/credit/debit/other",
    "expense_category": "meals/travel/supplies/equipment/other",
    "tax_deductible": true/false,
    "line_items": [{{"description": "item", "amount": 0.00}}],
    "confidence": 0-100
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
        return {"vendor_name": "Unknown", "total_amount": 0, "confidence": 0}

    def classify_document(self, document_info: Dict) -> Dict[str, Any]:
        """AI classification of documents into appropriate categories."""
        prompt = f"""Classify this document:

Document: {document_info.get('filename', 'unknown')}
Type: {document_info.get('file_type', 'unknown')}
User Type: {document_info.get('user_type', 'employee')}
Upload Source: {document_info.get('source', 'manual')}

Available Categories for {document_info.get('user_type', 'employee')}:
{json.dumps(document_info.get('available_categories', []))}

{f"Content Preview: {document_info.get('preview', '')[:300]}" if document_info.get('preview') else ""}

Return JSON:
{{
    "primary_category": "category_name",
    "secondary_category": "category_name or null",
    "confidence": 0-100,
    "is_tax_document": true/false,
    "is_pii_sensitive": true/false,
    "suggested_tags": ["tag1", "tag2"],
    "auto_categorize": true/false
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
        return {"primary_category": "personal", "confidence": 50, "auto_categorize": False}

    # =========================================================================
    #  CONTRACTOR EXPENSE INTELLIGENCE
    # =========================================================================
    
    def analyze_contractor_expenses(self, expense_data: Dict) -> Dict[str, Any]:
        """AI analysis of contractor expenses for tax optimization."""
        prompt = f"""Analyze contractor expenses for tax optimization:

Contractor Profile:
- Business Type: {expense_data.get('business_type', 'sole_proprietor')}
- Industry: {expense_data.get('industry', 'consulting')}
- YTD Income: ${expense_data.get('ytd_income', 0)}

Expense Summary:
- Total Expenses YTD: ${expense_data.get('total_expenses', 0)}
- Categories: {json.dumps(expense_data.get('expense_breakdown', {}))}
- Mileage Logged: {expense_data.get('mileage_miles', 0)} miles
- Mileage Deduction: ${expense_data.get('mileage_deduction', 0)}

Missing Documentation:
- Receipts Needed: {expense_data.get('receipts_missing', 0)}
- Categories Without Receipts: {json.dumps(expense_data.get('undocumented_categories', []))}

Provide JSON:
{{
    "deduction_optimization_score": 0-100,
    "potential_missed_deductions": [{{"category": "name", "estimated_amount": 0, "description": "explanation"}}],
    "audit_risk_areas": ["area1"],
    "documentation_gaps": ["gap1"],
    "tax_savings_potential": 0,
    "quarterly_estimate_adjustment": 0,
    "recommendations": [{{"action": "description", "priority": "high/medium/low", "tax_impact": "$amount"}}],
    "expense_ratio_analysis": {{"category": "healthy/review/concerning"}}
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
        return {"deduction_optimization_score": 70, "recommendations": [], "potential_missed_deductions": []}

    def analyze_1099_readiness(self, contractor_data: Dict) -> Dict[str, Any]:
        """AI analysis of 1099 filing readiness."""
        prompt = f"""Analyze 1099 filing readiness:

Contractor Summary:
- Total Contractors: {contractor_data.get('contractor_count', 0)}
- Above $600 Threshold: {contractor_data.get('above_threshold', 0)}
- Total Payments: ${contractor_data.get('total_payments', 0)}

W-9 Status:
- W-9s on File: {contractor_data.get('w9_complete', 0)}
- W-9s Missing: {contractor_data.get('w9_missing', 0)}
- TIN Verification Pending: {contractor_data.get('tin_pending', 0)}

Filing Status:
- 1099s Generated: {contractor_data.get('generated', 0)}
- 1099s Sent to Recipients: {contractor_data.get('sent_recipients', 0)}
- 1099s Filed to IRS: {contractor_data.get('filed_irs', 0)}

Deadline: January 31

Provide JSON:
{{
    "readiness_score": 0-100,
    "ready_to_file": true/false,
    "blockers": ["blocker1"],
    "missing_w9_action": {{"count": 0, "deadline": "date", "template_available": true}},
    "filing_checklist": [{{"item": "description", "status": "complete/pending/blocked"}}],
    "estimated_completion_time": "X hours",
    "penalty_risk": "$amount if not filed by deadline",
    "recommendations": ["recommendation1"]
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
        return {"readiness_score": 75, "ready_to_file": False, "blockers": [], "recommendations": []}

    # =========================================================================
    #  PAYROLL OPTIMIZATION INTELLIGENCE
    # =========================================================================
    
    def optimize_payroll_run(self, payroll_data: Dict) -> Dict[str, Any]:
        """AI optimization suggestions for payroll runs."""
        prompt = f"""Analyze payroll run for optimization opportunities:

Payroll Summary:
- Pay Period: {payroll_data.get('pay_period', 'N/A')}
- Total Employees: {payroll_data.get('employee_count', 0)}
- Total Gross: ${payroll_data.get('total_gross', 0)}
- Total Net: ${payroll_data.get('total_net', 0)}
- Total Employer Taxes: ${payroll_data.get('employer_taxes', 0)}

Deductions:
- Pre-Tax Deductions: ${payroll_data.get('pretax_deductions', 0)}
- Post-Tax Deductions: ${payroll_data.get('posttax_deductions', 0)}
- 401(k) Participation: {payroll_data.get('401k_participation', 0)}%
- HSA Participation: {payroll_data.get('hsa_participation', 0)}%

Issues Detected:
- Zero Net Pay Employees: {payroll_data.get('zero_net_count', 0)}
- High Overtime: {payroll_data.get('high_overtime_count', 0)}
- Manual Adjustments: {payroll_data.get('manual_adjustments', 0)}

Provide JSON:
{{
    "optimization_score": 0-100,
    "cost_saving_opportunities": [{{"area": "description", "potential_savings": 0, "action": "how to achieve"}}],
    "compliance_flags": ["flag1"],
    "efficiency_recommendations": ["recommendation1"],
    "benefit_optimization": [{{"benefit": "name", "current_participation": 0, "target": 0, "employer_savings": 0}}],
    "overtime_analysis": {{"excessive": true/false, "recommendation": "description"}},
    "tax_efficiency_score": 0-100
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
        return {"optimization_score": 80, "cost_saving_opportunities": [], "efficiency_recommendations": []}

    def analyze_labor_costs(self, labor_data: Dict) -> Dict[str, Any]:
        """AI analysis of labor costs and workforce efficiency."""
        prompt = f"""Analyze labor costs and workforce efficiency:

Company Profile:
- Industry: {labor_data.get('industry', 'General')}
- Total Employees: {labor_data.get('employee_count', 0)}
- Revenue: ${labor_data.get('revenue', 0)}

Labor Costs (Monthly):
- Total Payroll: ${labor_data.get('total_payroll', 0)}
- Benefits Cost: ${labor_data.get('benefits_cost', 0)}
- Employer Taxes: ${labor_data.get('employer_taxes', 0)}
- Workers Comp: ${labor_data.get('workers_comp', 0)}
- Total Labor: ${labor_data.get('total_labor', 0)}

Metrics:
- Labor as % of Revenue: {labor_data.get('labor_percent', 0)}%
- Average Hourly Cost: ${labor_data.get('avg_hourly_cost', 0)}
- Overtime Ratio: {labor_data.get('overtime_ratio', 0)}%
- Turnover Rate: {labor_data.get('turnover_rate', 0)}%

Provide JSON:
{{
    "efficiency_score": 0-100,
    "labor_cost_rating": "excellent/good/average/concerning/critical",
    "benchmark_comparison": {{"your_ratio": 0, "industry_avg": 0, "status": "above/at/below"}},
    "cost_drivers": [{{"factor": "description", "impact": "high/medium/low", "controllable": true/false}}],
    "reduction_opportunities": [{{"area": "description", "potential_savings": 0, "risk": "low/medium/high"}}],
    "headcount_recommendations": {{"current": 0, "optimal": 0, "action": "hire/maintain/reduce"}},
    "overtime_optimization": {{"current_cost": 0, "optimal_cost": 0, "strategy": "description"}},
    "forecasted_costs_next_quarter": 0
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
        return {"efficiency_score": 75, "labor_cost_rating": "average", "cost_drivers": [], "reduction_opportunities": []}

    # =========================================================================
    #  EMPLOYEE SELF-SERVICE INTELLIGENCE
    # =========================================================================
    
    def analyze_employee_portal_usage(self, usage_data: Dict) -> Dict[str, Any]:
        """AI analysis of employee self-service portal usage."""
        prompt = f"""Analyze employee self-service portal engagement:

Portal Metrics:
- Total Employees: {usage_data.get('total_employees', 0)}
- Active Users (30 days): {usage_data.get('active_users', 0)}
- Adoption Rate: {usage_data.get('adoption_rate', 0)}%

Feature Usage:
- Paystub Views: {usage_data.get('paystub_views', 0)}
- Direct Deposit Changes: {usage_data.get('dd_changes', 0)}
- PTO Requests: {usage_data.get('pto_requests', 0)}
- Document Downloads: {usage_data.get('doc_downloads', 0)}
- Profile Updates: {usage_data.get('profile_updates', 0)}

HR Efficiency:
- HR Tickets Before Portal: {usage_data.get('tickets_before', 0)}/month
- HR Tickets After Portal: {usage_data.get('tickets_after', 0)}/month
- Self-Service Resolution Rate: {usage_data.get('self_service_rate', 0)}%

Provide JSON:
{{
    "engagement_score": 0-100,
    "adoption_status": "excellent/good/needs_improvement/poor",
    "hr_time_saved_hours": 0,
    "cost_savings_monthly": 0,
    "underutilized_features": ["feature1"],
    "engagement_recommendations": [{{"action": "description", "expected_impact": "description"}}],
    "communication_suggestions": ["suggestion1"],
    "training_needs": ["need1"]
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
        return {"engagement_score": 70, "adoption_status": "good", "engagement_recommendations": []}

    def personalize_employee_dashboard(self, employee_data: Dict) -> Dict[str, Any]:
        """AI-powered personalized dashboard recommendations for employees."""
        prompt = f"""Generate personalized dashboard recommendations:

Employee Profile:
- Tenure: {employee_data.get('tenure_months', 0)} months
- Department: {employee_data.get('department', 'General')}
- Role Level: {employee_data.get('role_level', 'individual_contributor')}

Current Status:
- PTO Balance: {employee_data.get('pto_balance', 0)} hours
- Next Review: {employee_data.get('next_review', 'N/A')}
- Open Goals: {employee_data.get('open_goals', 0)}
- Training Due: {employee_data.get('training_due', 0)}

Financial:
- 401(k) Contribution: {employee_data.get('contribution_401k', 0)}%
- HSA Balance: ${employee_data.get('hsa_balance', 0)}
- Direct Deposit: {employee_data.get('has_direct_deposit', False)}

Provide JSON:
{{
    "priority_actions": [{{"action": "description", "reason": "why important", "link": "module_name"}}],
    "personalized_insights": ["insight1"],
    "financial_tips": ["tip1"],
    "upcoming_deadlines": [{{"item": "description", "date": "date"}}],
    "recommended_features": ["feature1"],
    "wellness_score": 0-100,
    "career_development_suggestions": ["suggestion1"]
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
        return {"priority_actions": [], "personalized_insights": [], "wellness_score": 75}

    # =========================================================================
    #  ONBOARDING INTELLIGENCE
    # =========================================================================
    
    def analyze_onboarding_progress(self, onboarding_data: Dict) -> Dict[str, Any]:
        """AI analysis of employee onboarding progress and recommendations."""
        prompt = f"""Analyze employee onboarding progress:

Onboarding Status:
- Employee: {onboarding_data.get('employee_name', 'New Employee')}
- Start Date: {onboarding_data.get('start_date', 'N/A')}
- Days Since Start: {onboarding_data.get('days_elapsed', 0)}
- Current Step: {onboarding_data.get('current_step', 1)}/8
- Progress: {onboarding_data.get('progress_percent', 0)}%

Completed Items:
{json.dumps(onboarding_data.get('completed_items', []))}

Pending Items:
{json.dumps(onboarding_data.get('pending_items', []))}

Blockers:
{json.dumps(onboarding_data.get('blockers', []))}

Provide JSON:
{{
    "onboarding_health": "on_track/at_risk/delayed",
    "estimated_completion": "date",
    "bottleneck_analysis": [{{"step": "name", "issue": "description", "resolution": "action"}}],
    "priority_items": ["item1"],
    "compliance_status": {{"i9_compliant": true/false, "w4_compliant": true/false, "state_forms": true/false}},
    "new_hire_reporting_status": "filed/pending/overdue",
    "recommendations": ["recommendation1"],
    "manager_actions_needed": ["action1"]
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
        return {"onboarding_health": "on_track", "recommendations": [], "compliance_status": {}}

    # =========================================================================
    #  UNIVERSAL PLATFORM ASSISTANT (ENHANCED)
    # =========================================================================
    
    def universal_assistant(self, message: str, context: Dict) -> str:
        """
        Enhanced universal AI assistant with full platform awareness.
        Handles any question across all platform modules.
        """
        system_prompt = """You are Saurellius AI, the intelligent assistant powering Saurellius Cloud Payroll Management.
        You have comprehensive knowledge of and access to:
        
        CORE MODULES:
        - Payroll Processing: Gross-to-net calculations, tax withholding, direct deposit
        - Tax Compliance: Federal, state, local taxes for US and Canada
        - Employee Management: Onboarding, profiles, termination, COBRA
        
        REGULATORY FILING (NEW):
        - IRS FIRE System: 1099-NEC, 1099-MISC electronic filing
        - SSA BSO: W-2/W-3 electronic submission
        - EFTPS: Federal tax deposits (941, 944, 940)
        - State Filings: All 50 states quarterly withholding, SUTA
        - New Hire Reporting: Automatic state submission
        - Filing Calendar: Deadline tracking and alerts
        - Compliance Verification: Audit trail and status checks
        
        DOCUMENT MANAGEMENT (NEW):
        - Secure Upload: Employee, contractor, employer documents
        - Auto-Classification: AI-powered document categorization
        - Receipt Extraction: Expense data from receipts
        - Compliance Documents: W-4, I-9, W-9 storage
        - Signed URLs: Secure document access
        
        WORKFORCE MODULES:
        - Time & Attendance: Clock in/out, overtime, meal breaks, job costing
        - Scheduling: Shift management, SWIPE system, availability
        - PTO: Accruals, requests, balances
        
        TALENT MODULES:
        - Recruiting (ATS): Job postings, applications, hiring pipeline
        - Performance: Reviews, ratings, feedback
        - Learning (LMS): Training courses, certifications
        - Goals & OKRs: Individual and team goal tracking
        
        BENEFITS MODULES:
        - Health Insurance: Medical, dental, vision plans
        - 401(k): Enrollment, contributions, vesting, loans
        - FMLA: Eligibility, case management, time tracking
        - COBRA: Qualifying events, elections
        
        FINANCIAL MODULES:
        - Digital Wallet: Funding, transfers, payments
        - Earned Wage Access: Early wage requests
        - Contractor Payments: 1099, multi-currency USD/CAD
        
        SELF-SERVICE PORTALS (NEW):
        - Employee Portal: Paystubs, PTO, direct deposit, documents
        - Contractor Portal: W-9, invoicing, expenses, mileage, 1099s
        - Tax Center: Estimated taxes, quarterly deadlines
        
        EXPERIENCE MODULES:
        - Financial Wellness: Assessments, goals, resources
        - Engagement Surveys: Anonymous feedback, analytics
        - Recognition: Kudos, points, leaderboards
        - Charitable Giving: Payroll deductions, matching
        
        ANALYTICS MODULES:
        - Reporting: Payroll, tax, labor cost reports
        - Predictive: Turnover risk, headcount forecasting
        - Custom Reports: Configurable report builder
        
        You are professional, concise, and never use emojis.
        Provide actionable, specific guidance based on the user's context."""

        context_str = f"""
CURRENT CONTEXT:
- Company: {context.get('company_name', 'Your Company')}
- User Role: {context.get('role', 'employer')}
- Employees: {context.get('employee_count', 0)}
- Contractors: {context.get('contractor_count', 0)}
- Primary State: {context.get('primary_state', 'N/A')}
- States Operating: {json.dumps(context.get('states', []))}
- Subscription: {context.get('plan', 'Professional')}
- Current Module: {context.get('current_module', 'Dashboard')}

REGULATORY STATUS:
- Upcoming Deadlines: {context.get('upcoming_deadlines', 0)}
- Overdue Filings: {context.get('overdue_filings', 0)}
- Compliance Score: {context.get('compliance_score', 'N/A')}
- Last 941 Filed: {context.get('last_941', 'N/A')}
- EFTPS Deposits Due: {context.get('deposits_due', 0)}

ACTIVE STATUS:
- Wallet Balance: ${context.get('wallet_balance', 0)}
- Next Payroll: {context.get('next_payroll', 'N/A')}
- Open Tasks: {context.get('open_tasks', 0)}
- Pending Approvals: {context.get('pending_approvals', 0)}
- Pending Onboarding: {context.get('pending_onboarding', 0)}
- Documents Awaiting Review: {context.get('docs_pending', 0)}
- Active Job Postings: {context.get('active_jobs', 0)}
- Pending Reviews: {context.get('pending_reviews', 0)}
"""

        prompt = f"{system_prompt}\n{context_str}\n\nUser: {message}\n\nAssistant:"
        
        response = self._safe_generate(prompt, max_tokens=1200)
        return response or "I apologize, but I couldn't process your request. Please try again or contact support."


# Singleton instance
saurellius_ai = SaurelliusAI()

# Alias for backward compatibility
gemini_ai = saurellius_ai
