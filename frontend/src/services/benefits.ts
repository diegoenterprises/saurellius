/**
 * SAURELLIUS BENEFITS SERVICE
 * Frontend API client for benefits and insurance administration
 */

import api from './api';

// Types
export interface BenefitPlan {
  plan_id: string;
  company_id: number;
  benefit_type: string;
  plan_name: string;
  carrier: string;
  carrier_code: string;
  effective_date: string;
  plan_details: PlanDetails;
  employer_contribution: Record<string, number>;
  eligibility_rules: EligibilityRules;
  is_active: boolean;
}

export interface PlanDetails {
  name: string;
  type: string;
  tier?: string;
  deductible?: { individual: number; family: number };
  out_of_pocket_max?: { individual: number; family: number };
  coinsurance?: number;
  copays?: Record<string, number>;
  premium_monthly?: Record<string, number>;
  hsa_eligible?: boolean;
  annual_maximum?: number;
  coverage?: Record<string, number>;
}

export interface EligibilityRules {
  waiting_period_days: number;
  minimum_hours_per_week: number;
  employment_types: string[];
}

export interface Enrollment {
  enrollment_id: string;
  employee_id: number;
  plan_id: string;
  plan_name?: string;
  benefit_type?: string;
  carrier?: string;
  coverage_level: string;
  effective_date: string;
  status: string;
  dependents: number[];
  employee_contribution: number;
  employer_contribution: number;
  termination_date?: string;
  election_details: Record<string, any>;
}

export interface Dependent {
  dependent_id: string;
  employee_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  relationship: string;
  date_of_birth: string;
  age: number;
  gender?: string;
  is_student: boolean;
  is_disabled: boolean;
  is_active: boolean;
}

export interface LifeEvent {
  id: string;
  employee_id: number;
  event_type: string;
  event_date: string;
  enrollment_window_end: string;
  documentation?: Record<string, any>;
  status: string;
  created_at: string;
}

export interface COBRAEvent {
  event_id: string;
  employee_id: number;
  event_type: string;
  event_date: string;
  beneficiaries: any[];
  covered_plans: string[];
  duration_months: number;
  election_deadline: string;
  coverage_end_date: string;
  status: string;
  election_status: string;
  premium_amount: number;
}

export interface BenefitsSummary {
  employee_id: number;
  enrollments: Enrollment[];
  dependents: Dependent[];
  enrollments_by_type: Record<string, Enrollment[]>;
  total_employee_cost_monthly: number;
  total_employer_cost_monthly: number;
  total_cost_monthly: number;
  total_employee_cost_per_paycheck: number;
  total_employee_cost_annual: number;
}

export interface PlanCosts {
  plan_id: string;
  plan_name: string;
  coverage_level: string;
  total_premium_monthly: number;
  employer_contribution_monthly: number;
  employee_cost_monthly: number;
  employee_cost_per_paycheck: number;
  employee_cost_annual: number;
}

export interface Carrier {
  code: string;
  name: string;
  types: string[];
  networks: string[];
  contact?: string;
}

export interface ContributionLimits {
  hsa: {
    individual_limit: number;
    family_limit: number;
    catch_up_55_plus: number;
  };
  fsa: {
    healthcare_limit: number;
    dependent_care_limit: number;
    carryover_limit: number;
  };
  commuter: {
    transit_monthly: number;
    parking_monthly: number;
  };
  '401k': {
    employee_limit: number;
    catch_up_50_plus: number;
  };
}

export interface OpenEnrollmentStatus {
  is_open: boolean;
  start_date: string;
  end_date: string;
  effective_date: string;
  days_remaining?: number;
}

// =============================================================================
// PLAN MANAGEMENT
// =============================================================================

export const getAvailablePlans = async (
  benefitType?: string
): Promise<{ success: boolean; plans: BenefitPlan[]; count: number }> => {
  const params: Record<string, string> = {};
  if (benefitType) params.type = benefitType;
  
  const response = await api.get('/benefits/plans', { params });
  return response.data;
};

export const getPlanDetails = async (
  planId: string
): Promise<{ success: boolean; plan: BenefitPlan }> => {
  const response = await api.get(`/benefits/plans/${planId}`);
  return response.data;
};

export const getPlanCosts = async (
  planId: string,
  coverageLevel: string,
  annualSalary?: number
): Promise<{ success: boolean; costs: PlanCosts }> => {
  const params: Record<string, any> = { coverage_level: coverageLevel };
  if (annualSalary) params.annual_salary = annualSalary;
  
  const response = await api.get(`/benefits/plans/${planId}/costs`, { params });
  return response.data;
};

export const comparePlans = async (
  planIds: string[],
  coverageLevel: string
): Promise<{ success: boolean; comparisons: any[]; coverage_level: string }> => {
  const response = await api.post('/benefits/plans/compare', {
    plan_ids: planIds,
    coverage_level: coverageLevel,
  });
  return response.data;
};

// =============================================================================
// ENROLLMENT MANAGEMENT
// =============================================================================

export const enrollInPlan = async (
  employeeId: number,
  planId: string,
  coverageLevel: string,
  effectiveDate: string,
  dependents?: number[],
  electionDetails?: Record<string, any>
): Promise<{ success: boolean; enrollment: Enrollment; costs: PlanCosts }> => {
  const response = await api.post('/benefits/enroll', {
    employee_id: employeeId,
    plan_id: planId,
    coverage_level: coverageLevel,
    effective_date: effectiveDate,
    dependents,
    election_details: electionDetails,
  });
  return response.data;
};

export const waiveCoverage = async (
  employeeId: number,
  planId: string,
  reason?: string
): Promise<{ success: boolean; enrollment: Enrollment; message: string }> => {
  const response = await api.post('/benefits/waive', {
    employee_id: employeeId,
    plan_id: planId,
    reason,
  });
  return response.data;
};

export const getEnrollments = async (
  employeeId?: number
): Promise<{ success: boolean; enrollments: Enrollment[]; count: number }> => {
  const params: Record<string, number> = {};
  if (employeeId) params.employee_id = employeeId;
  
  const response = await api.get('/benefits/enrollments', { params });
  return response.data;
};

export const terminateEnrollment = async (
  enrollmentId: string,
  terminationDate: string,
  reason?: string
): Promise<{ success: boolean; enrollment: Enrollment; cobra_eligible: boolean }> => {
  const response = await api.post(`/benefits/enrollments/${enrollmentId}/terminate`, {
    termination_date: terminationDate,
    reason,
  });
  return response.data;
};

// =============================================================================
// DEPENDENT MANAGEMENT
// =============================================================================

export const getDependents = async (
  employeeId?: number
): Promise<{ success: boolean; dependents: Dependent[]; count: number }> => {
  const params: Record<string, number> = {};
  if (employeeId) params.employee_id = employeeId;
  
  const response = await api.get('/benefits/dependents', { params });
  return response.data;
};

export const addDependent = async (
  employeeId: number,
  firstName: string,
  lastName: string,
  relationship: string,
  dateOfBirth: string,
  options?: {
    ssn_last_four?: string;
    gender?: string;
    is_student?: boolean;
    is_disabled?: boolean;
  }
): Promise<{ success: boolean; dependent: Dependent }> => {
  const response = await api.post('/benefits/dependents', {
    employee_id: employeeId,
    first_name: firstName,
    last_name: lastName,
    relationship,
    date_of_birth: dateOfBirth,
    ...options,
  });
  return response.data;
};

export const removeDependent = async (
  dependentId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/benefits/dependents/${dependentId}`);
  return response.data;
};

// =============================================================================
// LIFE EVENTS
// =============================================================================

export const getLifeEvents = async (
  employeeId?: number
): Promise<{ success: boolean; life_events: LifeEvent[]; count: number }> => {
  const params: Record<string, number> = {};
  if (employeeId) params.employee_id = employeeId;
  
  const response = await api.get('/benefits/life-events', { params });
  return response.data;
};

export const recordLifeEvent = async (
  employeeId: number,
  eventType: string,
  eventDate: string,
  documentation?: Record<string, any>
): Promise<{ success: boolean; life_event: LifeEvent; message: string }> => {
  const response = await api.post('/benefits/life-events', {
    employee_id: employeeId,
    event_type: eventType,
    event_date: eventDate,
    documentation,
  });
  return response.data;
};

export const getLifeEventTypes = async (): Promise<{
  success: boolean;
  event_types: { type: string; name: string }[];
}> => {
  const response = await api.get('/benefits/life-events/types');
  return response.data;
};

// =============================================================================
// COBRA ADMINISTRATION
// =============================================================================

export const initiateCOBRA = async (
  employeeId: number,
  eventType: string,
  eventDate: string,
  beneficiaries: any[]
): Promise<{ success: boolean; cobra_event: COBRAEvent; message: string }> => {
  const response = await api.post('/benefits/cobra/initiate', {
    employee_id: employeeId,
    event_type: eventType,
    event_date: eventDate,
    beneficiaries,
  });
  return response.data;
};

export const electCOBRA = async (
  eventId: string,
  electedPlans: string[],
  beneficiaryElections?: Record<string, any>
): Promise<{ success: boolean; cobra_event: COBRAEvent; message: string }> => {
  const response = await api.post(`/benefits/cobra/${eventId}/elect`, {
    elected_plans: electedPlans,
    beneficiary_elections: beneficiaryElections,
  });
  return response.data;
};

export const getCOBRAStatus = async (
  employeeId?: number
): Promise<{ success: boolean; cobra_events: COBRAEvent[]; count: number }> => {
  const params: Record<string, number> = {};
  if (employeeId) params.employee_id = employeeId;
  
  const response = await api.get('/benefits/cobra/status', { params });
  return response.data;
};

export const getCOBRARules = async (): Promise<{
  success: boolean;
  rules: Record<string, any>;
}> => {
  const response = await api.get('/benefits/cobra/rules');
  return response.data;
};

// =============================================================================
// BENEFITS SUMMARY
// =============================================================================

export const getBenefitsSummary = async (
  employeeId?: number
): Promise<{ success: boolean; summary: BenefitsSummary }> => {
  const params: Record<string, number> = {};
  if (employeeId) params.employee_id = employeeId;
  
  const response = await api.get('/benefits/summary', { params });
  return response.data;
};

export const getBenefitDeductions = async (
  employeeId?: number,
  payFrequency: string = 'biweekly'
): Promise<{
  success: boolean;
  employee_id: number;
  pay_frequency: string;
  total_deduction_per_paycheck: number;
  total_monthly: number;
  deductions: any[];
}> => {
  const params: Record<string, any> = { pay_frequency: payFrequency };
  if (employeeId) params.employee_id = employeeId;
  
  const response = await api.get('/benefits/deductions', { params });
  return response.data;
};

// =============================================================================
// REFERENCE DATA
// =============================================================================

export const getCarriers = async (
  benefitType?: string
): Promise<{ success: boolean; carriers: Carrier[]; count: number }> => {
  const params: Record<string, string> = {};
  if (benefitType) params.type = benefitType;
  
  const response = await api.get('/benefits/carriers', { params });
  return response.data;
};

export const getPlanTemplates = async (
  benefitType: string
): Promise<{ success: boolean; benefit_type: string; templates: Record<string, any> }> => {
  const response = await api.get(`/benefits/templates/${benefitType}`);
  return response.data;
};

export const getContributionLimits = async (): Promise<{
  success: boolean;
  year: number;
  limits: ContributionLimits;
}> => {
  const response = await api.get('/benefits/limits');
  return response.data;
};

export const getBenefitTypes = async (): Promise<{
  success: boolean;
  benefit_types: { type: string; name: string }[];
}> => {
  const response = await api.get('/benefits/benefit-types');
  return response.data;
};

export const getCoverageLevels = async (): Promise<{
  success: boolean;
  coverage_levels: { level: string; name: string }[];
}> => {
  const response = await api.get('/benefits/coverage-levels');
  return response.data;
};

// =============================================================================
// OPEN ENROLLMENT
// =============================================================================

export const getOpenEnrollmentStatus = async (): Promise<{
  success: boolean;
  open_enrollment: OpenEnrollmentStatus;
}> => {
  const response = await api.get('/benefits/open-enrollment/status');
  return response.data;
};

export const submitOpenEnrollmentElections = async (
  employeeId: number,
  elections: Array<{
    plan_id: string;
    coverage_level?: string;
    dependents?: number[];
    action: 'enroll' | 'waive';
  }>
): Promise<{
  success: boolean;
  effective_date: string;
  elections_processed: number;
  results: any[];
}> => {
  const response = await api.post('/benefits/open-enrollment/elections', {
    employee_id: employeeId,
    elections,
  });
  return response.data;
};

// Default export
const benefitsService = {
  // Plans
  getAvailablePlans,
  getPlanDetails,
  getPlanCosts,
  comparePlans,
  // Enrollment
  enrollInPlan,
  waiveCoverage,
  getEnrollments,
  terminateEnrollment,
  // Dependents
  getDependents,
  addDependent,
  removeDependent,
  // Life Events
  getLifeEvents,
  recordLifeEvent,
  getLifeEventTypes,
  // COBRA
  initiateCOBRA,
  electCOBRA,
  getCOBRAStatus,
  getCOBRARules,
  // Summary
  getBenefitsSummary,
  getBenefitDeductions,
  // Reference
  getCarriers,
  getPlanTemplates,
  getContributionLimits,
  getBenefitTypes,
  getCoverageLevels,
  // Open Enrollment
  getOpenEnrollmentStatus,
  submitOpenEnrollmentElections,
};

export default benefitsService;
