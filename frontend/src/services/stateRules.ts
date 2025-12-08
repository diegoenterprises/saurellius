/**
 * 📋 STATE RULES SERVICE
 * API calls for state-by-state payroll compliance rules
 */

import api from './api';

export interface StateBasicInfo {
  code: string;
  name: string;
  minimum_wage: number;
  has_income_tax: boolean;
  has_sdi: boolean;
  has_pfl: boolean;
}

export interface PayFrequencyRule {
  required: string;
  notes: string;
}

export interface FinalPayRule {
  termination: string;
  resignation: string;
}

export interface OvertimeRule {
  threshold_weekly: number;
  threshold_daily: number | null;
  rate: number;
  double_time: number | null;
}

export interface BreakRequirements {
  meal_break: string;
  rest_break: string | null;
  paid_rest: boolean;
  paid_meal: boolean;
  notes?: string;
}

export interface SDIInfo {
  rate: number;
  wage_base: number | null;
  employee_paid: boolean;
}

export interface PFLInfo {
  rate: number;
  wage_base: number | null;
  max_weeks: number;
  wage_replacement: number;
}

export interface StateDetails {
  state_code: string;
  state_name: string;
  minimum_wage: number;
  has_income_tax: boolean;
  income_tax_type: 'none' | 'flat' | 'progressive';
  flat_tax_rate: number | null;
  pay_frequency: PayFrequencyRule;
  final_pay: FinalPayRule;
  overtime: OvertimeRule;
  break_requirements: BreakRequirements | null;
  sui_wage_base: number;
  has_sdi: boolean;
  sdi_info: SDIInfo | null;
  has_pfl: boolean;
  pfl_info: PFLInfo | null;
}

export const stateRulesService = {
  /**
   * Get all states with basic info
   */
  getAllStates: async (): Promise<StateBasicInfo[]> => {
    try {
      const response = await api.get('/api/states');
      if (response.data.success) {
        return response.data.states;
      }
      return [];
    } catch (error) {
      console.error('State rules service error:', error);
      return [];
    }
  },

  /**
   * Get detailed rules for a specific state
   */
  getStateDetails: async (stateCode: string): Promise<StateDetails | null> => {
    try {
      const response = await api.get(`/api/states/${stateCode}`);
      if (response.data.success) {
        return response.data.state;
      }
      return null;
    } catch (error) {
      console.error('State details error:', error);
      return null;
    }
  },

  /**
   * Get minimum wage for a state
   */
  getMinimumWage: async (stateCode: string): Promise<{ state: number; federal: number } | null> => {
    try {
      const response = await api.get(`/api/states/${stateCode}/minimum-wage`);
      if (response.data.success) {
        return {
          state: response.data.minimum_wage,
          federal: response.data.federal_minimum,
        };
      }
      return null;
    } catch (error) {
      console.error('Minimum wage error:', error);
      return null;
    }
  },

  /**
   * Get overtime rules for a state
   */
  getOvertimeRules: async (stateCode: string): Promise<OvertimeRule | null> => {
    try {
      const response = await api.get(`/api/states/${stateCode}/overtime`);
      if (response.data.success) {
        return response.data.overtime_rules;
      }
      return null;
    } catch (error) {
      console.error('Overtime rules error:', error);
      return null;
    }
  },

  /**
   * Get final pay requirements for a state
   */
  getFinalPayRules: async (stateCode: string): Promise<FinalPayRule | null> => {
    try {
      const response = await api.get(`/api/states/${stateCode}/final-pay`);
      if (response.data.success) {
        return response.data.final_pay_rules;
      }
      return null;
    } catch (error) {
      console.error('Final pay rules error:', error);
      return null;
    }
  },

  /**
   * Get break requirements for a state
   */
  getBreakRequirements: async (stateCode: string): Promise<BreakRequirements | null> => {
    try {
      const response = await api.get(`/api/states/${stateCode}/breaks`);
      if (response.data.success) {
        return response.data.break_requirements;
      }
      return null;
    } catch (error) {
      console.error('Break requirements error:', error);
      return null;
    }
  },

  /**
   * Get states with no income tax
   */
  getNoIncomeTaxStates: async (): Promise<string[]> => {
    try {
      const response = await api.get('/api/states/no-income-tax');
      if (response.data.success) {
        return response.data.states;
      }
      return [];
    } catch (error) {
      console.error('No income tax states error:', error);
      return [];
    }
  },

  /**
   * Get states with SDI
   */
  getSDIStates: async (): Promise<Array<{ state_code: string; rate: number; wage_base: number | null }>> => {
    try {
      const response = await api.get('/api/states/with-sdi');
      if (response.data.success) {
        return response.data.states;
      }
      return [];
    } catch (error) {
      console.error('SDI states error:', error);
      return [];
    }
  },

  /**
   * Get states with Paid Family Leave
   */
  getPFLStates: async (): Promise<Array<{ state_code: string; rate: number; max_weeks: number }>> => {
    try {
      const response = await api.get('/api/states/with-pfl');
      if (response.data.success) {
        return response.data.states;
      }
      return [];
    } catch (error) {
      console.error('PFL states error:', error);
      return [];
    }
  },

  /**
   * Get all state rules (comprehensive)
   */
  getAllStateRules: async (): Promise<Record<string, StateDetails>> => {
    try {
      const response = await api.get('/api/states/all-rules');
      if (response.data.success) {
        return response.data.states;
      }
      return {};
    } catch (error) {
      console.error('All state rules error:', error);
      return {};
    }
  },
};

export default stateRulesService;
