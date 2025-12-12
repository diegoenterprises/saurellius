/**
 * SAURELLIUS REGULATORY FILING SERVICE
 * Frontend service for government form submission and compliance
 */

import api from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface Filing {
  id: string;
  company_id: string;
  filing_type: string;
  agency: string;
  tax_year?: number;
  tax_period?: string;
  status: 'draft' | 'pending' | 'submitted' | 'accepted' | 'rejected' | 'corrected';
  confirmation_number?: string;
  submitted_at: string;
}

export interface FilingDeadline {
  form: string;
  description: string;
  deadline: string;
  agency: string;
  level: 'federal' | 'state' | 'local';
  state?: string;
  days_until: number;
  status: 'overdue' | 'upcoming' | 'scheduled';
}

export interface ComplianceResult {
  company_id: string;
  year: number;
  compliant: boolean;
  issues: Array<{
    type: string;
    form: string;
    level: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  filings_submitted: number;
  verified_at: string;
}

export interface StateRequirements {
  state: string;
  agency_name: string;
  agency_url: string;
  electronic_filing: boolean;
  has_income_tax: boolean;
  has_sdi: boolean;
  has_pfml: boolean;
  requirements: {
    withholding: boolean;
    unemployment: boolean;
    new_hire: boolean;
    disability: boolean;
    paid_leave: boolean;
  };
}

// ============================================================================
// REGULATORY FILING SERVICE
// ============================================================================

export const regulatoryService = {
  // ==========================================================================
  // IRS FIRE - 1099 Filing
  // ==========================================================================

  /**
   * Submit 1099 forms to IRS FIRE system
   */
  submit1099Forms: async (
    companyId: string,
    forms: Array<{
      recipient_tin: string;
      recipient_name: string;
      recipient_address: string;
      amount: number;
      payer_tin: string;
    }>,
    taxYear: number,
    isCorrection: boolean = false
  ) => {
    const response = await api.post('/api/regulatory/irs/1099/submit', {
      company_id: companyId,
      forms,
      tax_year: taxYear,
      is_correction: isCorrection,
    });
    return response.data;
  },

  /**
   * Submit Form 941 quarterly
   */
  submitForm941: async (
    companyId: string,
    quarter: number,
    year: number,
    data: {
      company: Record<string, any>;
      payroll_data: Record<string, any>;
    }
  ) => {
    const response = await api.post('/api/regulatory/irs/941/submit', {
      company_id: companyId,
      quarter,
      year,
      data,
    });
    return response.data;
  },

  /**
   * Submit Form 940 annual FUTA
   */
  submitForm940: async (
    companyId: string,
    year: number,
    data: {
      payroll_data: Record<string, any>;
    }
  ) => {
    const response = await api.post('/api/regulatory/irs/940/submit', {
      company_id: companyId,
      year,
      data,
    });
    return response.data;
  },

  // ==========================================================================
  // SSA BSO - W-2 Filing
  // ==========================================================================

  /**
   * Submit W-2/W-3 forms to SSA
   */
  submitW2Forms: async (
    companyId: string,
    w2Forms: Array<Record<string, any>>,
    w3Form: Record<string, any>,
    taxYear: number
  ) => {
    const response = await api.post('/api/regulatory/ssa/w2/submit', {
      company_id: companyId,
      w2_forms: w2Forms,
      w3_form: w3Form,
      tax_year: taxYear,
    });
    return response.data;
  },

  // ==========================================================================
  // EFTPS - Federal Tax Deposits
  // ==========================================================================

  /**
   * Submit federal tax deposit via EFTPS
   */
  submitEFTPSDeposit: async (
    companyId: string,
    ein: string,
    depositType: '941' | '944' | '940',
    amount: number,
    taxPeriod: string,
    settlementDate?: string
  ) => {
    const response = await api.post('/api/regulatory/eftps/deposit', {
      company_id: companyId,
      ein,
      deposit_type: depositType,
      amount,
      tax_period: taxPeriod,
      settlement_date: settlementDate,
    });
    return response.data;
  },

  /**
   * Get deposit schedule requirements
   */
  getDepositSchedule: async () => {
    const response = await api.get('/api/regulatory/eftps/schedule');
    return response.data;
  },

  // ==========================================================================
  // STATE FILINGS
  // ==========================================================================

  /**
   * Submit state tax filing
   */
  submitStateFiling: async (
    companyId: string,
    state: string,
    filingType: string,
    taxPeriod: string,
    data: Record<string, any>
  ) => {
    const response = await api.post('/api/regulatory/state/submit', {
      company_id: companyId,
      state,
      filing_type: filingType,
      tax_period: taxPeriod,
      data,
    });
    return response.data;
  },

  /**
   * Submit new hire report
   */
  submitNewHireReport: async (
    companyId: string,
    state: string,
    employee: {
      first_name: string;
      last_name: string;
      ssn: string;
      hire_date: string;
      address: string;
    }
  ) => {
    const response = await api.post('/api/regulatory/state/new-hire', {
      company_id: companyId,
      state,
      employee,
    });
    return response.data;
  },

  /**
   * Submit SUTA quarterly report
   */
  submitSUTA: async (
    companyId: string,
    state: string,
    quarter: number,
    year: number,
    data: Record<string, any>
  ) => {
    const response = await api.post('/api/regulatory/state/unemployment', {
      company_id: companyId,
      state,
      quarter,
      year,
      data,
    });
    return response.data;
  },

  /**
   * Get state filing requirements
   */
  getStateRequirements: async (state: string): Promise<{ success: boolean; requirements: StateRequirements }> => {
    const response = await api.get(`/api/regulatory/state/requirements/${state}`);
    return response.data;
  },

  /**
   * Get all state agencies
   */
  getAllStateAgencies: async () => {
    const response = await api.get('/api/regulatory/state/agencies');
    return response.data;
  },

  // ==========================================================================
  // LOCAL FILINGS
  // ==========================================================================

  /**
   * Submit local/municipal filing
   */
  submitLocalFiling: async (
    companyId: string,
    jurisdiction: string,
    jurisdictionType: 'city' | 'county' | 'school_district' | 'transit',
    filingType: string,
    taxPeriod: string,
    data: Record<string, any>
  ) => {
    const response = await api.post('/api/regulatory/local/submit', {
      company_id: companyId,
      jurisdiction,
      jurisdiction_type: jurisdictionType,
      filing_type: filingType,
      tax_period: taxPeriod,
      data,
    });
    return response.data;
  },

  // ==========================================================================
  // CALENDAR & DEADLINES
  // ==========================================================================

  /**
   * Get filing calendar for the year
   */
  getFilingCalendar: async (
    companyId: string,
    year: number,
    states?: string[]
  ): Promise<{
    success: boolean;
    year: number;
    filings: FilingDeadline[];
    upcoming_count: number;
    overdue_count: number;
  }> => {
    const params = new URLSearchParams();
    params.append('company_id', companyId);
    params.append('year', year.toString());
    if (states) {
      states.forEach((s) => params.append('states', s));
    }
    const response = await api.get(`/api/regulatory/calendar?${params.toString()}`);
    return response.data;
  },

  /**
   * Get upcoming deadlines
   */
  getUpcomingDeadlines: async (
    companyId: string,
    daysAhead: number = 30
  ): Promise<{ success: boolean; deadlines: FilingDeadline[]; count: number }> => {
    const response = await api.get(
      `/api/regulatory/deadlines?company_id=${companyId}&days=${daysAhead}`
    );
    return response.data;
  },

  // ==========================================================================
  // COMPLIANCE
  // ==========================================================================

  /**
   * Verify compliance status
   */
  verifyCompliance: async (
    companyId: string,
    year: number
  ): Promise<{ success: boolean } & ComplianceResult> => {
    const response = await api.get(
      `/api/regulatory/compliance/verify?company_id=${companyId}&year=${year}`
    );
    return response.data;
  },

  /**
   * Get audit trail
   */
  getAuditTrail: async (
    companyId: string,
    startDate?: string,
    endDate?: string
  ) => {
    const params = new URLSearchParams();
    params.append('company_id', companyId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.get(`/api/regulatory/compliance/audit-trail?${params.toString()}`);
    return response.data;
  },

  // ==========================================================================
  // FILING STATUS & HISTORY
  // ==========================================================================

  /**
   * Get filing status
   */
  getFilingStatus: async (filingId: string): Promise<{ success: boolean; filing: Filing }> => {
    const response = await api.get(`/api/regulatory/filings/${filingId}`);
    return response.data;
  },

  /**
   * Get filing history
   */
  getFilingHistory: async (
    companyId: string,
    year?: number,
    agency?: string
  ): Promise<{ success: boolean; filings: Filing[]; count: number }> => {
    const params = new URLSearchParams();
    params.append('company_id', companyId);
    if (year) params.append('year', year.toString());
    if (agency) params.append('agency', agency);
    const response = await api.get(`/api/regulatory/filings?${params.toString()}`);
    return response.data;
  },

  // ==========================================================================
  // REFERENCE DATA
  // ==========================================================================

  /**
   * Get supported forms
   */
  getSupportedForms: async () => {
    const response = await api.get('/api/regulatory/forms');
    return response.data;
  },

  /**
   * Get filing agencies
   */
  getAgencies: async () => {
    const response = await api.get('/api/regulatory/agencies');
    return response.data;
  },
};

// ============================================================================
// COMPLIANCE HELPERS
// ============================================================================

/**
 * Check if a deadline is approaching (within X days)
 */
export const isDeadlineApproaching = (deadline: string, withinDays: number = 14): boolean => {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= withinDays;
};

/**
 * Check if a deadline is overdue
 */
export const isDeadlineOverdue = (deadline: string): boolean => {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  return deadlineDate < today;
};

/**
 * Get severity color for compliance issues
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return '#DC2626'; // red-600
    case 'high':
      return '#EA580C'; // orange-600
    case 'medium':
      return '#CA8A04'; // yellow-600
    case 'low':
      return '#16A34A'; // green-600
    default:
      return '#6B7280'; // gray-500
  }
};

/**
 * Get status color for filings
 */
export const getFilingStatusColor = (status: string): string => {
  switch (status) {
    case 'accepted':
      return '#16A34A'; // green-600
    case 'submitted':
      return '#2563EB'; // blue-600
    case 'pending':
      return '#CA8A04'; // yellow-600
    case 'rejected':
      return '#DC2626'; // red-600
    case 'draft':
      return '#6B7280'; // gray-500
    default:
      return '#6B7280';
  }
};

/**
 * Format tax period for display
 */
export const formatTaxPeriod = (period: string): string => {
  if (period.includes('Q')) {
    const [year, quarter] = period.split('-');
    return `${quarter} ${year}`;
  }
  return period;
};

export default regulatoryService;
