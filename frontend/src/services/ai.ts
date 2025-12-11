/**
 * AI SERVICE
 * Frontend API client for Gemini AI features
 */

import api from './api';

// =============================================================================
// Types
// =============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  state?: string;
  employee_count?: number;
  subscription_plan?: string;
}

export interface PaystubValidation {
  valid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

export interface DashboardInsights {
  headline: string;
  insights: string[];
  trends: {
    payroll_trend?: string;
    percent_change?: number;
  };
  recommendations: string[];
  alerts: string[];
}

export interface ComplianceCheck {
  compliant: boolean;
  requirements: Array<{
    item: string;
    status: string;
    details: string;
  }>;
  action_items: string[];
  resources: string[];
}

export interface EmployeeAnalysis {
  data_quality: string;
  missing_fields: string[];
  suggestions: string[];
  tax_setup_correct: boolean;
  notes: string;
}

export interface OnboardingTask {
  task: string;
  required: boolean;
  deadline: string;
  category: string;
}

export interface FraudDetection {
  anomalies_detected: boolean;
  risk_level: string;
  items: Array<{
    pay_period: number;
    issue: string;
    severity: string;
  }>;
  recommendation: string;
}

export interface PlanRecommendation {
  recommended_plan: string;
  reason: string;
  savings_potential?: string;
  urgency: string;
  projected_needs?: string;
}

export interface AIStatus {
  ai_enabled: boolean;
  model: string | null;
  features: string[];
}

// =============================================================================
// AI Service
// =============================================================================

export const aiService = {
  // ===========================================================================
  // Chat Assistant
  // ===========================================================================
  
  /**
   * Send a message to the AI chatbot
   */
  chat: async (message: string, context?: ChatContext): Promise<string> => {
    try {
      const response = await api.post('/api/ai/chat', {
        message,
        context,
        timestamp: new Date().toISOString(),
      });
      return response.data.response;
    } catch (error) {
      console.error('AI chat error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  },

  /**
   * Get quick help on a specific topic
   */
  quickHelp: async (topic: string): Promise<string> => {
    try {
      const response = await api.post('/api/ai/quick-help', { topic });
      return response.data.response;
    } catch (error) {
      console.error('AI quick help error:', error);
      return 'Unable to retrieve help at this time.';
    }
  },

  // ===========================================================================
  // Paystub Intelligence
  // ===========================================================================
  
  /**
   * Validate paystub data with AI
   */
  validatePaystub: async (paystubData: Record<string, any>): Promise<PaystubValidation> => {
    try {
      const response = await api.post('/api/ai/paystub/validate', {
        paystub: paystubData,
      });
      return response.data.validation;
    } catch (error) {
      console.error('Paystub validation error:', error);
      return { valid: true, issues: [], warnings: [], suggestions: [] };
    }
  },

  /**
   * Get AI explanation of a paystub
   */
  explainPaystub: async (paystubData: Record<string, any>): Promise<string> => {
    try {
      const response = await api.post('/api/ai/paystub/explain', {
        paystub: paystubData,
      });
      return response.data.explanation;
    } catch (error) {
      console.error('Paystub explanation error:', error);
      return 'Unable to generate explanation.';
    }
  },

  /**
   * Get AI suggestions to fix paystub errors
   */
  suggestCorrections: async (
    paystubData: Record<string, any>,
    errors: string[]
  ): Promise<Array<{ field: string; current_value: string; suggested_value: string; reason: string }>> => {
    try {
      const response = await api.post('/api/ai/paystub/suggest-corrections', {
        paystub: paystubData,
        errors,
      });
      return response.data.corrections;
    } catch (error) {
      console.error('Correction suggestion error:', error);
      return [];
    }
  },

  // ===========================================================================
  // Dashboard Insights
  // ===========================================================================
  
  /**
   * Get AI-powered dashboard insights
   */
  getDashboardInsights: async (metrics: Record<string, any>): Promise<DashboardInsights> => {
    try {
      const response = await api.post('/api/ai/dashboard/insights', { metrics });
      return response.data.insights;
    } catch (error) {
      console.error('Dashboard insights error:', error);
      return {
        headline: 'Unable to generate insights',
        insights: [],
        trends: {},
        recommendations: [],
        alerts: [],
      };
    }
  },

  // ===========================================================================
  // Compliance
  // ===========================================================================
  
  /**
   * Check compliance for a state
   */
  checkCompliance: async (
    state: string,
    businessInfo: Record<string, any>
  ): Promise<ComplianceCheck> => {
    try {
      const response = await api.post('/api/ai/compliance/check', {
        state,
        business_info: businessInfo,
      });
      return response.data.compliance;
    } catch (error) {
      console.error('Compliance check error:', error);
      return { compliant: true, requirements: [], action_items: [], resources: [] };
    }
  },

  /**
   * Get AI explanation of a state rule
   */
  explainStateRule: async (state: string, ruleType: string): Promise<string> => {
    try {
      const response = await api.get(`/api/ai/compliance/explain/${state}/${ruleType}`);
      return response.data.explanation;
    } catch (error) {
      console.error('Rule explanation error:', error);
      return 'Unable to retrieve rule explanation.';
    }
  },

  // ===========================================================================
  // Employee Management
  // ===========================================================================
  
  /**
   * Analyze employee data
   */
  analyzeEmployee: async (employeeData: Record<string, any>): Promise<EmployeeAnalysis> => {
    try {
      const response = await api.post('/api/ai/employee/analyze', {
        employee: employeeData,
      });
      return response.data.analysis;
    } catch (error) {
      console.error('Employee analysis error:', error);
      return {
        data_quality: 'unknown',
        missing_fields: [],
        suggestions: [],
        tax_setup_correct: true,
        notes: '',
      };
    }
  },

  /**
   * Generate onboarding checklist
   */
  getOnboardingChecklist: async (
    state: string,
    employeeType: string = 'full-time'
  ): Promise<OnboardingTask[]> => {
    try {
      const response = await api.post('/api/ai/employee/onboarding-checklist', {
        state,
        employee_type: employeeType,
      });
      return response.data.checklist;
    } catch (error) {
      console.error('Onboarding checklist error:', error);
      return [];
    }
  },

  // ===========================================================================
  // Tax Intelligence
  // ===========================================================================
  
  /**
   * Get AI explanation of tax calculations
   */
  explainTaxes: async (taxBreakdown: Record<string, any>): Promise<string> => {
    try {
      const response = await api.post('/api/ai/tax/explain', {
        tax_breakdown: taxBreakdown,
      });
      return response.data.explanation;
    } catch (error) {
      console.error('Tax explanation error:', error);
      return 'Unable to explain tax calculations.';
    }
  },

  /**
   * Get withholding optimization suggestions
   */
  optimizeWithholding: async (
    employeeInfo: Record<string, any>
  ): Promise<{
    current_assessment: string;
    suggestions: string[];
    potential_adjustment: string | null;
    disclaimer: string;
  }> => {
    try {
      const response = await api.post('/api/ai/tax/optimize', {
        employee_info: employeeInfo,
      });
      return response.data.optimization;
    } catch (error) {
      console.error('Withholding optimization error:', error);
      return {
        current_assessment: 'unknown',
        suggestions: [],
        potential_adjustment: null,
        disclaimer: 'Consult a tax professional.',
      };
    }
  },

  // ===========================================================================
  // Fraud Detection
  // ===========================================================================
  
  /**
   * Detect anomalies in paystub history
   */
  detectAnomalies: async (paystubHistory: Array<Record<string, any>>): Promise<FraudDetection> => {
    try {
      const response = await api.post('/api/ai/fraud/detect', {
        paystub_history: paystubHistory,
      });
      return response.data.analysis;
    } catch (error) {
      console.error('Fraud detection error:', error);
      return {
        anomalies_detected: false,
        risk_level: 'low',
        items: [],
        recommendation: '',
      };
    }
  },

  // ===========================================================================
  // Natural Language Queries
  // ===========================================================================
  
  /**
   * Process natural language query
   */
  processQuery: async (
    query: string,
    availableData?: Record<string, any>
  ): Promise<{
    intent: string;
    filters: Record<string, any>;
    aggregation: string;
    response_format: string;
    clarification_needed: string | null;
  }> => {
    try {
      const response = await api.post('/api/ai/query', {
        query,
        available_data: availableData,
      });
      return response.data.parsed_query;
    } catch (error) {
      console.error('Query processing error:', error);
      return {
        intent: 'unknown',
        filters: {},
        aggregation: 'list',
        response_format: 'list',
        clarification_needed: 'Could you rephrase your question?',
      };
    }
  },

  // ===========================================================================
  // Document Analysis
  // ===========================================================================
  
  /**
   * Analyze uploaded document
   */
  analyzeDocument: async (
    documentText: string,
    docType: string = 'unknown'
  ): Promise<{
    document_type: string;
    extracted_fields: Record<string, any>;
    completeness: string;
    missing_fields: string[];
    validation_issues: string[];
    confidence: number;
  }> => {
    try {
      const response = await api.post('/api/ai/document/analyze', {
        document_text: documentText,
        doc_type: docType,
      });
      return response.data.analysis;
    } catch (error) {
      console.error('Document analysis error:', error);
      return {
        document_type: 'unknown',
        extracted_fields: {},
        completeness: 'unknown',
        missing_fields: [],
        validation_issues: [],
        confidence: 0,
      };
    }
  },

  // ===========================================================================
  // Recommendations
  // ===========================================================================
  
  /**
   * Get plan recommendation
   */
  getRecommendedPlan: async (usageData: Record<string, any>): Promise<PlanRecommendation> => {
    try {
      const response = await api.post('/api/ai/recommend/plan', {
        usage_data: usageData,
      });
      return response.data.recommendation;
    } catch (error) {
      console.error('Plan recommendation error:', error);
      return {
        recommended_plan: 'Starter',
        reason: 'Unable to analyze usage data.',
        urgency: 'low',
      };
    }
  },

  // ===========================================================================
  // Status
  // ===========================================================================
  
  /**
   * Check AI service status
   */
  getStatus: async (): Promise<AIStatus> => {
    try {
      const response = await api.get('/api/ai/status');
      return response.data;
    } catch (error) {
      console.error('AI status error:', error);
      return { ai_enabled: false, model: null, features: [] };
    }
  },

  // ===========================================================================
  // Digital Wallet Intelligence
  // ===========================================================================

  /**
   * Analyze wallet transaction for fraud detection
   */
  analyzeWalletTransaction: async (
    transaction: Record<string, any>,
    history: Record<string, any>[]
  ): Promise<{
    risk_score: number;
    risk_level: string;
    flags: string[];
    insights: string[];
    recommendation: string;
    approved: boolean;
  }> => {
    try {
      const response = await api.post('/api/ai/wallet/analyze-transaction', {
        transaction,
        history,
      });
      return response.data.analysis;
    } catch (error) {
      console.error('Wallet transaction analysis error:', error);
      return { risk_score: 0, risk_level: 'low', flags: [], insights: [], recommendation: '', approved: true };
    }
  },

  /**
   * Get AI-powered wallet insights
   */
  getWalletInsights: async (walletData: Record<string, any>): Promise<{
    headline: string;
    health_score: number;
    insights: string[];
    recommendations: string[];
    alerts: string[];
    funding_suggestion: string;
  }> => {
    try {
      const response = await api.post('/api/ai/wallet/insights', { wallet_data: walletData });
      return response.data.insights;
    } catch (error) {
      console.error('Wallet insights error:', error);
      return { headline: '', health_score: 0, insights: [], recommendations: [], alerts: [], funding_suggestion: '' };
    }
  },

  /**
   * Analyze EWA (Earned Wage Access) request
   */
  analyzeEWARequest: async (
    requestData: Record<string, any>,
    employeeHistory: Record<string, any>
  ): Promise<{
    risk_score: number;
    risk_level: string;
    approval_recommended: boolean;
    max_recommended_amount: number;
    concerns: string[];
    financial_wellness_score: number;
    suggested_resources: string[];
  }> => {
    try {
      const response = await api.post('/api/ai/wallet/analyze-ewa', {
        request: requestData,
        employee_history: employeeHistory,
      });
      return response.data.analysis;
    } catch (error) {
      console.error('EWA analysis error:', error);
      return { risk_score: 0, risk_level: 'low', approval_recommended: true, max_recommended_amount: 0, concerns: [], financial_wellness_score: 75, suggested_resources: [] };
    }
  },

  // ===========================================================================
  // Workforce Scheduling Intelligence
  // ===========================================================================

  /**
   * Get AI-powered schedule optimization
   */
  optimizeSchedule: async (scheduleData: Record<string, any>): Promise<{
    optimization_score: number;
    issues: Array<{ issue: string; severity: string; affected: string }>;
    recommendations: Array<{ action: string; impact: string; priority: string }>;
    cost_savings_potential: string;
    overtime_alerts: string[];
    coverage_gaps: Array<{ day: string; time: string; needed: number }>;
  }> => {
    try {
      const response = await api.post('/api/ai/schedule/optimize', { schedule: scheduleData });
      return response.data.optimization;
    } catch (error) {
      console.error('Schedule optimization error:', error);
      return { optimization_score: 0, issues: [], recommendations: [], cost_savings_potential: '', overtime_alerts: [], coverage_gaps: [] };
    }
  },

  /**
   * Predict future scheduling needs
   */
  predictSchedulingNeeds: async (historicalData: Record<string, any>): Promise<{
    predicted_hours_needed: number;
    staffing_recommendation: string;
    peak_coverage_needs: Array<{ day: string; hours: string; staff_needed: number }>;
    trends: string[];
    risks: string[];
    confidence: number;
  }> => {
    try {
      const response = await api.post('/api/ai/schedule/predict', { historical_data: historicalData });
      return response.data.prediction;
    } catch (error) {
      console.error('Scheduling prediction error:', error);
      return { predicted_hours_needed: 0, staffing_recommendation: '', peak_coverage_needs: [], trends: [], risks: [], confidence: 0 };
    }
  },

  /**
   * Analyze shift swap request
   */
  analyzeShiftSwap: async (swapRequest: Record<string, any>): Promise<{
    approval_recommended: boolean;
    concerns: string[];
    overtime_impact: string;
    coverage_impact: string;
    notes: string;
  }> => {
    try {
      const response = await api.post('/api/ai/schedule/analyze-swap', { swap_request: swapRequest });
      return response.data.analysis;
    } catch (error) {
      console.error('Shift swap analysis error:', error);
      return { approval_recommended: true, concerns: [], overtime_impact: 'none', coverage_impact: 'neutral', notes: '' };
    }
  },

  // ===========================================================================
  // Smart Notifications & Alerts
  // ===========================================================================

  /**
   * Generate AI-powered smart alerts
   */
  generateSmartAlerts: async (platformData: Record<string, any>): Promise<Array<{
    type: string;
    priority: string;
    title: string;
    message: string;
    action: string;
    due_date: string;
  }>> => {
    try {
      const response = await api.post('/api/ai/alerts/generate', { platform_data: platformData });
      return response.data.alerts;
    } catch (error) {
      console.error('Smart alerts error:', error);
      return [];
    }
  },

  /**
   * Analyze notification preferences
   */
  analyzeNotificationPreferences: async (userBehavior: Record<string, any>): Promise<{
    optimal_notification_times: string[];
    preferred_channels: string[];
    reduce_frequency_for: string[];
    increase_priority_for: string[];
    personalization_suggestions: string[];
  }> => {
    try {
      const response = await api.post('/api/ai/notifications/preferences', { user_behavior: userBehavior });
      return response.data.preferences;
    } catch (error) {
      console.error('Notification preferences error:', error);
      return { optimal_notification_times: [], preferred_channels: [], reduce_frequency_for: [], increase_priority_for: [], personalization_suggestions: [] };
    }
  },

  // ===========================================================================
  // Enhanced Payroll Intelligence
  // ===========================================================================

  /**
   * Analyze payroll run before processing
   */
  analyzePayrollRun: async (payrollData: Record<string, any>): Promise<{
    ready_to_process: boolean;
    confidence_score: number;
    anomalies: Array<{ employee: string; issue: string; severity: string }>;
    warnings: string[];
    recommendations: string[];
    estimated_processing_time: string;
    cost_breakdown: {
      gross_wages: number;
      employer_taxes: number;
      benefits_cost: number;
      total_cost: number;
    };
  }> => {
    try {
      const response = await api.post('/api/ai/payroll/analyze-run', { payroll_data: payrollData });
      return response.data.analysis;
    } catch (error) {
      console.error('Payroll run analysis error:', error);
      return { ready_to_process: true, confidence_score: 0, anomalies: [], warnings: [], recommendations: [], estimated_processing_time: '', cost_breakdown: { gross_wages: 0, employer_taxes: 0, benefits_cost: 0, total_cost: 0 } };
    }
  },

  /**
   * Get payroll optimization suggestions
   */
  getPayrollOptimizations: async (companyData: Record<string, any>): Promise<{
    optimization_score: number;
    quick_wins: Array<{ action: string; savings: string; effort: string }>;
    strategic_recommendations: Array<{ action: string; impact: string; timeline: string }>;
    unused_features_to_adopt: string[];
    estimated_annual_savings: number;
  }> => {
    try {
      const response = await api.post('/api/ai/payroll/optimizations', { company_data: companyData });
      return response.data.optimizations;
    } catch (error) {
      console.error('Payroll optimizations error:', error);
      return { optimization_score: 0, quick_wins: [], strategic_recommendations: [], unused_features_to_adopt: [], estimated_annual_savings: 0 };
    }
  },

  // ===========================================================================
  // Contextual Chat (Enhanced)
  // ===========================================================================

  /**
   * Enhanced contextual chat with full platform awareness
   */
  contextualChat: async (message: string, fullContext: Record<string, any>): Promise<string> => {
    try {
      const response = await api.post('/api/ai/chat/contextual', {
        message,
        context: fullContext,
      });
      return response.data.response;
    } catch (error) {
      console.error('Contextual chat error:', error);
      return 'I apologize, but I could not process your request. Please try again.';
    }
  },

  // ===========================================================================
  // Talent Management Intelligence
  // ===========================================================================

  analyzeCandidate: async (candidateData: Record<string, any>, jobData: Record<string, any>): Promise<{
    match_score: number;
    strengths: string[];
    concerns: string[];
    interview_questions: string[];
    salary_recommendation: { min: number; max: number };
    hiring_recommendation: string;
    next_steps: string[];
  }> => {
    try {
      const response = await api.post('/api/ai/talent/analyze-candidate', { candidate: candidateData, job: jobData });
      return response.data.analysis;
    } catch (error) {
      console.error('Candidate analysis error:', error);
      return { match_score: 0, strengths: [], concerns: [], interview_questions: [], salary_recommendation: { min: 0, max: 0 }, hiring_recommendation: 'maybe', next_steps: [] };
    }
  },

  generatePerformanceReview: async (employeeData: Record<string, any>, metrics: Record<string, any>): Promise<{
    overall_rating: number;
    summary: string;
    strengths: string[];
    areas_for_improvement: string[];
    goals_for_next_period: string[];
    development_recommendations: string[];
    promotion_readiness: string;
  }> => {
    try {
      const response = await api.post('/api/ai/talent/generate-review', { employee: employeeData, metrics });
      return response.data.review;
    } catch (error) {
      console.error('Performance review generation error:', error);
      return { overall_rating: 3, summary: '', strengths: [], areas_for_improvement: [], goals_for_next_period: [], development_recommendations: [], promotion_readiness: 'developing' };
    }
  },

  suggestLearningPath: async (employeeData: Record<string, any>, careerGoals: string[]): Promise<{
    recommended_courses: Array<{ title: string; priority: string; duration_hours: number }>;
    skill_gaps: string[];
    certifications_to_pursue: string[];
    timeline_months: number;
    career_path: string[];
  }> => {
    try {
      const response = await api.post('/api/ai/talent/learning-path', { employee: employeeData, career_goals: careerGoals });
      return response.data.learning_path;
    } catch (error) {
      console.error('Learning path suggestion error:', error);
      return { recommended_courses: [], skill_gaps: [], certifications_to_pursue: [], timeline_months: 12, career_path: [] };
    }
  },

  // ===========================================================================
  // Employee Experience Intelligence
  // ===========================================================================

  analyzeFinancialWellness: async (employeeData: Record<string, any>): Promise<{
    wellness_score: number;
    risk_indicators: string[];
    positive_behaviors: string[];
    recommendations: Array<{ action: string; impact: string }>;
    resources: string[];
    retirement_projection: string;
  }> => {
    try {
      const response = await api.post('/api/ai/experience/financial-wellness', { employee: employeeData });
      return response.data.analysis;
    } catch (error) {
      console.error('Financial wellness analysis error:', error);
      return { wellness_score: 0, risk_indicators: [], positive_behaviors: [], recommendations: [], resources: [], retirement_projection: 'unknown' };
    }
  },

  analyzeSurveyResponses: async (surveyData: Record<string, any>): Promise<{
    overall_sentiment: string;
    engagement_score: number;
    top_strengths: string[];
    top_concerns: string[];
    action_items: Array<{ priority: string; action: string; owner: string }>;
    trend_analysis: string;
  }> => {
    try {
      const response = await api.post('/api/ai/experience/survey-analysis', { survey: surveyData });
      return response.data.analysis;
    } catch (error) {
      console.error('Survey analysis error:', error);
      return { overall_sentiment: 'neutral', engagement_score: 0, top_strengths: [], top_concerns: [], action_items: [], trend_analysis: 'stable' };
    }
  },

  // ===========================================================================
  // Job Costing & Labor Intelligence
  // ===========================================================================

  analyzeProjectProfitability: async (projectData: Record<string, any>): Promise<{
    profit_margin: number;
    health_status: string;
    budget_variance: number;
    projected_final_cost: number;
    risks: string[];
    recommendations: string[];
  }> => {
    try {
      const response = await api.post('/api/ai/labor/project-profitability', { project: projectData });
      return response.data.analysis;
    } catch (error) {
      console.error('Project profitability analysis error:', error);
      return { profit_margin: 0, health_status: 'unknown', budget_variance: 0, projected_final_cost: 0, risks: [], recommendations: [] };
    }
  },

  forecastLaborNeeds: async (historicalData: Record<string, any>): Promise<{
    next_week_hours_needed: number;
    next_month_hours_needed: number;
    recommended_headcount: number;
    hiring_recommendations: Array<{ role: string; count: number; urgency: string }>;
    overtime_forecast: number;
    confidence_level: number;
  }> => {
    try {
      const response = await api.post('/api/ai/labor/forecast', { historical: historicalData });
      return response.data.forecast;
    } catch (error) {
      console.error('Labor forecast error:', error);
      return { next_week_hours_needed: 0, next_month_hours_needed: 0, recommended_headcount: 0, hiring_recommendations: [], overtime_forecast: 0, confidence_level: 0 };
    }
  },

  // ===========================================================================
  // Benefits & Retirement Intelligence
  // ===========================================================================

  optimizeBenefitsSelection: async (employeeData: Record<string, any>, availablePlans: Record<string, any>[]): Promise<{
    recommended_medical: { plan_id: string; reason: string };
    recommended_dental: { plan_id: string; reason: string };
    hsa_recommendation: { contribute: boolean; amount: number };
    total_annual_cost: number;
  }> => {
    try {
      const response = await api.post('/api/ai/benefits/optimize-selection', { employee: employeeData, plans: availablePlans });
      return response.data.recommendations;
    } catch (error) {
      console.error('Benefits optimization error:', error);
      return { recommended_medical: { plan_id: '', reason: '' }, recommended_dental: { plan_id: '', reason: '' }, hsa_recommendation: { contribute: false, amount: 0 }, total_annual_cost: 0 };
    }
  },

  analyzeRetirementReadiness: async (employeeData: Record<string, any>): Promise<{
    readiness_score: number;
    on_track: boolean;
    projected_balance_at_retirement: number;
    monthly_retirement_income: number;
    recommendations: Array<{ action: string; impact: string }>;
    contribution_suggestion: number;
  }> => {
    try {
      const response = await api.post('/api/ai/benefits/retirement-readiness', { employee: employeeData });
      return response.data.analysis;
    } catch (error) {
      console.error('Retirement readiness error:', error);
      return { readiness_score: 0, on_track: false, projected_balance_at_retirement: 0, monthly_retirement_income: 0, recommendations: [], contribution_suggestion: 0 };
    }
  },

  // ===========================================================================
  // Contractor Intelligence
  // ===========================================================================

  analyzeContractor: async (contractorData: Record<string, any>): Promise<{
    classification_risk: string;
    misclassification_indicators: string[];
    compliance_score: number;
    recommendations: string[];
  }> => {
    try {
      const response = await api.post('/api/ai/contractor/analyze', { contractor: contractorData });
      return response.data.analysis;
    } catch (error) {
      console.error('Contractor analysis error:', error);
      return { classification_risk: 'unknown', misclassification_indicators: [], compliance_score: 0, recommendations: [] };
    }
  },

  // ===========================================================================
  // Tax Intelligence
  // ===========================================================================

  analyzeTaxSituation: async (companyData: Record<string, any>): Promise<{
    compliance_score: number;
    risk_areas: string[];
    optimization_opportunities: Array<{ area: string; potential_savings: number }>;
    upcoming_deadlines: Array<{ deadline: string; item: string; priority: string }>;
  }> => {
    try {
      const response = await api.post('/api/ai/tax/analyze', { company: companyData });
      return response.data.analysis;
    } catch (error) {
      console.error('Tax analysis error:', error);
      return { compliance_score: 0, risk_areas: [], optimization_opportunities: [], upcoming_deadlines: [] };
    }
  },

  // ===========================================================================
  // Universal Assistant
  // ===========================================================================

  universalAssistant: async (message: string, context: Record<string, any>): Promise<string> => {
    try {
      const response = await api.post('/api/ai/assistant', { message, context });
      return response.data.response;
    } catch (error) {
      console.error('Universal assistant error:', error);
      return 'I apologize, but I could not process your request. Please try again.';
    }
  },
};

export default aiService;
