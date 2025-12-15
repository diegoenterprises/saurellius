/**
 * SAURELLIUS AI SERVICE
 * Frontend service for interacting with the intelligent AI assistant
 */

import api from './api';

export interface AIMessage {
  role: 'user' | 'assistant';
  message: string;
  time: string;
  context?: string;
}

export interface AIInsight {
  id: number;
  type: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  summary: string;
  detailed_analysis?: string;
  recommended_action?: string;
  metrics?: Record<string, any>;
  status: string;
  is_actionable: boolean;
  created_at: string;
}

export interface AIProfile {
  preferred_tone: string;
  communication_style: string;
  response_length: string;
  industry?: string;
  company_size?: string;
  primary_use_case?: string;
  learning_level: number;
  total_interactions: number;
  helpful_responses: number;
  top_features: Record<string, any>;
}

export interface AIMemory {
  id: number;
  key: string;
  value: string;
  type: string;
  category: string;
  importance: number;
  source: string;
}

export interface AIPrediction {
  id: number;
  type: string;
  value: string;
  confidence: number;
  reasoning: string;
  for_date?: string;
}

export type AIFeature = 
  | 'general'
  | 'dashboard'
  | 'payroll'
  | 'employees'
  | 'compliance'
  | 'reports'
  | 'settings';

class SaurelliusAIService {
  private currentSessionId: string | null = null;

  /**
   * Start a new conversation session
   */
  startSession(): string {
    this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.currentSessionId;
  }

  /**
   * Get current session ID or start new one
   */
  getSessionId(): string {
    if (!this.currentSessionId) {
      return this.startSession();
    }
    return this.currentSessionId;
  }

  /**
   * Main chat function with full context awareness
   */
  async chat(message: string, feature: AIFeature = 'general', sessionId?: string): Promise<{
    success: boolean;
    response: string;
    session_id: string;
    conversation_id?: number;
    error?: string;
  }> {
    try {
      const response = await api.post('/api/ai/chat', {
        message,
        feature,
        session_id: sessionId || this.getSessionId()
      });
      
      if (response.data.session_id) {
        this.currentSessionId = response.data.session_id;
      }
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        response: 'Unable to connect to AI assistant. Please try again.',
        session_id: this.getSessionId(),
        error: error.message
      };
    }
  }

  /**
   * Quick Q&A without full conversation context
   */
  async quickHelp(question: string, context?: Record<string, any>): Promise<string> {
    try {
      const response = await api.post('/api/ai/quick-help', {
        question,
        context
      });
      return response.data.answer || 'Unable to answer that question.';
    } catch (error) {
      return 'AI assistant is currently unavailable.';
    }
  }

  /**
   * Get conversation history
   */
  async getConversation(sessionId?: string): Promise<AIMessage[]> {
    try {
      const sid = sessionId || this.currentSessionId;
      if (!sid) return [];
      
      const response = await api.get(`/api/ai/conversation/${sid}`);
      return response.data.conversation || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Submit feedback on AI response
   */
  async submitFeedback(conversationId: number, helpful: boolean, notes?: string): Promise<boolean> {
    try {
      await api.post('/api/ai/feedback', {
        conversation_id: conversationId,
        helpful,
        notes
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // =========================================================================
  // INSIGHTS
  // =========================================================================

  /**
   * Get AI-generated insights
   */
  async getInsights(options?: {
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<AIInsight[]> {
    try {
      const params = new URLSearchParams();
      if (options?.type) params.append('type', options.type);
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      
      const response = await api.get(`/api/ai/insights?${params.toString()}`);
      return response.data.insights || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate new insights based on current data
   */
  async generateInsights(): Promise<AIInsight[]> {
    try {
      const response = await api.post('/api/ai/insights/generate');
      return response.data.insights || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Mark insight as viewed
   */
  async viewInsight(insightId: number): Promise<boolean> {
    try {
      await api.post(`/api/ai/insights/${insightId}/view`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark insight as acted upon
   */
  async actOnInsight(insightId: number): Promise<boolean> {
    try {
      await api.post(`/api/ai/insights/${insightId}/act`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Dismiss an insight
   */
  async dismissInsight(insightId: number): Promise<boolean> {
    try {
      await api.post(`/api/ai/insights/${insightId}/dismiss`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // =========================================================================
  // AI PROFILE & PREFERENCES
  // =========================================================================

  /**
   * Get AI profile and learning status
   */
  async getProfile(): Promise<AIProfile | null> {
    try {
      const response = await api.get('/api/ai/profile');
      return response.data.profile || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update AI communication preferences
   */
  async updateProfile(updates: Partial<{
    preferred_tone: string;
    communication_style: string;
    response_length: string;
    industry: string;
    company_size: string;
    primary_use_case: string;
  }>): Promise<boolean> {
    try {
      await api.put('/api/ai/profile', updates);
      return true;
    } catch (error) {
      return false;
    }
  }

  // =========================================================================
  // MEMORIES
  // =========================================================================

  /**
   * Get AI memories about the user
   */
  async getMemories(category?: string, limit: number = 20): Promise<AIMemory[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', limit.toString());
      
      const response = await api.get(`/api/ai/memories?${params.toString()}`);
      return response.data.memories || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Add a memory for AI to remember
   */
  async addMemory(key: string, value: string, options?: {
    type?: string;
    category?: string;
    importance?: number;
  }): Promise<boolean> {
    try {
      await api.post('/api/ai/memories', {
        key,
        value,
        ...options
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: number): Promise<boolean> {
    try {
      await api.delete(`/api/ai/memories/${memoryId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search memories
   */
  async searchMemories(query: string): Promise<AIMemory[]> {
    try {
      const response = await api.get(`/api/ai/memories/search?q=${encodeURIComponent(query)}`);
      return response.data.results || [];
    } catch (error) {
      return [];
    }
  }

  // =========================================================================
  // PREDICTIONS
  // =========================================================================

  /**
   * Get AI predictions
   */
  async getPredictions(type?: string): Promise<AIPrediction[]> {
    try {
      const params = type ? `?type=${type}` : '';
      const response = await api.get(`/api/ai/predictions${params}`);
      return response.data.predictions || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate payroll prediction
   */
  async predictPayroll(): Promise<{
    success: boolean;
    prediction?: {
      predicted_gross: number;
      predicted_net: number;
      confidence: number;
      reasoning: string;
    };
    error?: string;
  }> {
    try {
      const response = await api.post('/api/ai/predictions/payroll');
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // =========================================================================
  // ANALYSIS
  // =========================================================================

  /**
   * Analyze payroll data
   */
  async analyzePayroll(payrollData: Record<string, any>): Promise<{
    success: boolean;
    analysis?: string;
    error?: string;
  }> {
    try {
      const response = await api.post('/api/ai/analyze/payroll', {
        payroll_data: payrollData
      });
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get AI summary of data
   */
  async summarize(dataType: string, data: any): Promise<string> {
    try {
      const response = await api.post('/api/ai/summarize', {
        type: dataType,
        data
      });
      return response.data.summary || 'Unable to summarize data.';
    } catch (error) {
      return 'Summary unavailable.';
    }
  }

  // =========================================================================
  // TRACKING & STATUS
  // =========================================================================

  /**
   * Track feature usage for AI learning
   */
  async trackFeature(feature: string): Promise<void> {
    try {
      await api.post('/api/ai/track-feature', { feature });
    } catch (error) {
      // Silent fail for tracking
    }
  }

  /**
   * Get AI service status
   */
  async getStatus(): Promise<{
    ai_enabled: boolean;
    learning_level: number;
    total_interactions: number;
    features: string[];
    capabilities: string[];
  } | null> {
    try {
      const response = await api.get('/api/ai/status');
      return response.data.status || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current AI context (for debugging)
   */
  async getContext(feature: AIFeature = 'general'): Promise<Record<string, any> | null> {
    try {
      const response = await api.get(`/api/ai/context?feature=${feature}`);
      return response.data.context || null;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const saurelliusAI = new SaurelliusAIService();
export default saurelliusAI;
