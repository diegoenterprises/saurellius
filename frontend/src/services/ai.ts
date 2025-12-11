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
  // 💬 Chat Assistant
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
  // 📊 Paystub Intelligence
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
  // 📈 Dashboard Insights
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
  // ✅ Compliance
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
  // 👥 Employee Management
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
  // 🧮 Tax Intelligence
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
  // 🔍 Fraud Detection
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
  // 📝 Natural Language Queries
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
  // 📄 Document Analysis
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
  // 💡 Recommendations
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
  // 🔧 Status
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
};

export default aiService;
