import api from './api';

export type RulesetKey = 'irs_federal_withholding';

export interface RulesetMeta {
  id: number;
  key: string;
  jurisdiction: string;
  rule_type: string;
  version: string;
  effective_start: string;
  effective_end: string | null;
  source_name?: string | null;
  source_ref?: string | null;
  created_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ActiveRulesetResponse {
  success: boolean;
  ruleset: RulesetMeta | null;
  payload?: any;
}

export const rulesetsService = {
  getActiveRuleset: async (params: { key: RulesetKey; date?: string }): Promise<ActiveRulesetResponse> => {
    const response = await api.get('/api/rulesets/active', { params });
    return response.data;
  },

  seedIrs2026FederalWithholding: async (): Promise<any> => {
    const response = await api.post('/api/admin/rules/seed/irs-2026-federal-withholding');
    return response.data;
  },
};
