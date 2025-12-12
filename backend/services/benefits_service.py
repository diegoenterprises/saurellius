"""
SAURELLIUS BENEFITS & INSURANCE SERVICE
Complete employee benefits administration including:
- Health Insurance (Medical, Dental, Vision)
- Life Insurance & AD&D
- Disability Insurance (Short-term, Long-term)
- Retirement Plans (401k, IRA, Roth)
- Flexible Spending Accounts (FSA, HSA, DCA)
- COBRA Administration
- Benefits Enrollment & Life Events
- Dependent Management
- Carrier Integrations
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from decimal import Decimal
import uuid


class BenefitType(Enum):
    MEDICAL = "medical"
    DENTAL = "dental"
    VISION = "vision"
    LIFE = "life"
    AD_D = "ad_d"
    STD = "short_term_disability"
    LTD = "long_term_disability"
    HSA = "hsa"
    FSA = "fsa"
    DCA = "dependent_care"
    RETIREMENT_401K = "401k"
    RETIREMENT_IRA = "ira"
    RETIREMENT_ROTH = "roth_401k"
    COBRA = "cobra"
    EAP = "eap"
    WELLNESS = "wellness"
    PTO = "pto"
    COMMUTER = "commuter"


class EnrollmentStatus(Enum):
    NOT_ENROLLED = "not_enrolled"
    PENDING = "pending"
    ENROLLED = "enrolled"
    WAIVED = "waived"
    TERMINATED = "terminated"
    COBRA_ELIGIBLE = "cobra_eligible"
    COBRA_ACTIVE = "cobra_active"
    COBRA_EXPIRED = "cobra_expired"


class LifeEvent(Enum):
    NEW_HIRE = "new_hire"
    MARRIAGE = "marriage"
    DIVORCE = "divorce"
    BIRTH = "birth"
    ADOPTION = "adoption"
    DEATH_OF_DEPENDENT = "death_of_dependent"
    LOSS_OF_COVERAGE = "loss_of_coverage"
    GAIN_OF_COVERAGE = "gain_of_coverage"
    CHANGE_IN_EMPLOYMENT = "change_in_employment"
    RELOCATION = "relocation"
    OPEN_ENROLLMENT = "open_enrollment"
    TERMINATION = "termination"


class CoverageLevel(Enum):
    EMPLOYEE_ONLY = "employee_only"
    EMPLOYEE_SPOUSE = "employee_spouse"
    EMPLOYEE_CHILDREN = "employee_children"
    FAMILY = "family"


class DependentRelationship(Enum):
    SPOUSE = "spouse"
    DOMESTIC_PARTNER = "domestic_partner"
    CHILD = "child"
    STEPCHILD = "stepchild"
    ADOPTED_CHILD = "adopted_child"
    FOSTER_CHILD = "foster_child"


# =============================================================================
# INSURANCE CARRIER DATA
# =============================================================================

INSURANCE_CARRIERS = {
    "blue_cross": {
        "name": "Blue Cross Blue Shield",
        "code": "BCBS",
        "types": ["medical", "dental", "vision"],
        "networks": ["PPO", "HMO", "EPO", "HDHP"],
        "contact": "1-800-262-2583"
    },
    "united_health": {
        "name": "UnitedHealthcare",
        "code": "UHC",
        "types": ["medical", "dental", "vision"],
        "networks": ["PPO", "HMO", "EPO", "HDHP"],
        "contact": "1-800-328-5979"
    },
    "aetna": {
        "name": "Aetna",
        "code": "AETNA",
        "types": ["medical", "dental", "vision"],
        "networks": ["PPO", "HMO", "EPO", "HDHP"],
        "contact": "1-800-872-3862"
    },
    "cigna": {
        "name": "Cigna",
        "code": "CIGNA",
        "types": ["medical", "dental", "vision"],
        "networks": ["PPO", "HMO", "OAP"],
        "contact": "1-800-244-6224"
    },
    "kaiser": {
        "name": "Kaiser Permanente",
        "code": "KAISER",
        "types": ["medical"],
        "networks": ["HMO"],
        "contact": "1-800-464-4000"
    },
    "delta_dental": {
        "name": "Delta Dental",
        "code": "DELTA",
        "types": ["dental"],
        "networks": ["PPO", "HMO"],
        "contact": "1-800-765-6003"
    },
    "vsp": {
        "name": "VSP Vision Care",
        "code": "VSP",
        "types": ["vision"],
        "networks": ["PPO"],
        "contact": "1-800-877-7195"
    },
    "metlife": {
        "name": "MetLife",
        "code": "METLIFE",
        "types": ["life", "ad_d", "dental", "vision"],
        "networks": ["PPO"],
        "contact": "1-800-638-5433"
    },
    "lincoln": {
        "name": "Lincoln Financial",
        "code": "LINCOLN",
        "types": ["life", "ad_d", "short_term_disability", "long_term_disability"],
        "networks": [],
        "contact": "1-800-423-2765"
    },
    "principal": {
        "name": "Principal Financial",
        "code": "PRINCIPAL",
        "types": ["life", "ad_d", "short_term_disability", "long_term_disability", "dental", "vision"],
        "networks": ["PPO"],
        "contact": "1-800-986-3343"
    },
    "fidelity": {
        "name": "Fidelity Investments",
        "code": "FIDELITY",
        "types": ["401k", "ira", "hsa"],
        "networks": [],
        "contact": "1-800-343-3548"
    },
    "vanguard": {
        "name": "Vanguard",
        "code": "VANGUARD",
        "types": ["401k", "ira"],
        "networks": [],
        "contact": "1-800-662-7447"
    },
    "healthequity": {
        "name": "HealthEquity",
        "code": "HEQ",
        "types": ["hsa", "fsa", "dependent_care"],
        "networks": [],
        "contact": "1-866-346-5800"
    },
    "wex": {
        "name": "WEX Health",
        "code": "WEX",
        "types": ["hsa", "fsa", "dependent_care", "commuter"],
        "networks": [],
        "contact": "1-866-451-3399"
    }
}


# =============================================================================
# BENEFIT PLAN TEMPLATES
# =============================================================================

MEDICAL_PLANS = {
    "gold_ppo": {
        "name": "Gold PPO",
        "type": "PPO",
        "tier": "gold",
        "deductible": {"individual": 500, "family": 1000},
        "out_of_pocket_max": {"individual": 3000, "family": 6000},
        "coinsurance": 80,
        "copays": {"primary_care": 20, "specialist": 40, "urgent_care": 50, "er": 150},
        "premium_monthly": {"employee_only": 450, "employee_spouse": 900, "employee_children": 750, "family": 1200}
    },
    "silver_ppo": {
        "name": "Silver PPO",
        "type": "PPO",
        "tier": "silver",
        "deductible": {"individual": 1500, "family": 3000},
        "out_of_pocket_max": {"individual": 5000, "family": 10000},
        "coinsurance": 70,
        "copays": {"primary_care": 30, "specialist": 50, "urgent_care": 75, "er": 200},
        "premium_monthly": {"employee_only": 350, "employee_spouse": 700, "employee_children": 580, "family": 950}
    },
    "bronze_hdhp": {
        "name": "Bronze HDHP",
        "type": "HDHP",
        "tier": "bronze",
        "deductible": {"individual": 3000, "family": 6000},
        "out_of_pocket_max": {"individual": 7000, "family": 14000},
        "coinsurance": 60,
        "copays": {"primary_care": 0, "specialist": 0, "urgent_care": 0, "er": 0},  # Deductible first
        "premium_monthly": {"employee_only": 200, "employee_spouse": 400, "employee_children": 330, "family": 550},
        "hsa_eligible": True
    },
    "hmo_standard": {
        "name": "HMO Standard",
        "type": "HMO",
        "tier": "silver",
        "deductible": {"individual": 0, "family": 0},
        "out_of_pocket_max": {"individual": 4000, "family": 8000},
        "coinsurance": 100,
        "copays": {"primary_care": 25, "specialist": 45, "urgent_care": 60, "er": 175},
        "premium_monthly": {"employee_only": 380, "employee_spouse": 760, "employee_children": 630, "family": 1020},
        "requires_referral": True
    }
}

DENTAL_PLANS = {
    "dental_ppo": {
        "name": "Dental PPO",
        "type": "PPO",
        "annual_maximum": 2000,
        "deductible": {"individual": 50, "family": 150},
        "coverage": {
            "preventive": 100,  # Cleanings, exams, x-rays
            "basic": 80,        # Fillings, extractions
            "major": 50         # Crowns, bridges, dentures
        },
        "orthodontia": {"coverage": 50, "lifetime_max": 2000},
        "premium_monthly": {"employee_only": 35, "employee_spouse": 70, "employee_children": 85, "family": 110}
    },
    "dental_hmo": {
        "name": "Dental HMO",
        "type": "HMO",
        "annual_maximum": None,  # No annual max
        "deductible": {"individual": 0, "family": 0},
        "coverage": {
            "preventive": 100,
            "basic": 100,
            "major": 100
        },
        "copays": {"preventive": 0, "basic": 15, "major": 75},
        "premium_monthly": {"employee_only": 20, "employee_spouse": 40, "employee_children": 50, "family": 65}
    }
}

VISION_PLANS = {
    "vision_standard": {
        "name": "Vision Standard",
        "type": "PPO",
        "exam_copay": 10,
        "materials_copay": 25,
        "frame_allowance": 150,
        "contact_lens_allowance": 150,
        "exam_frequency": "12 months",
        "lens_frequency": "12 months",
        "frame_frequency": "24 months",
        "premium_monthly": {"employee_only": 8, "employee_spouse": 16, "employee_children": 20, "family": 25}
    },
    "vision_premium": {
        "name": "Vision Premium",
        "type": "PPO",
        "exam_copay": 0,
        "materials_copay": 10,
        "frame_allowance": 250,
        "contact_lens_allowance": 250,
        "exam_frequency": "12 months",
        "lens_frequency": "12 months",
        "frame_frequency": "12 months",
        "premium_monthly": {"employee_only": 15, "employee_spouse": 30, "employee_children": 38, "family": 48}
    }
}

LIFE_INSURANCE_OPTIONS = {
    "basic_life": {
        "name": "Basic Life Insurance",
        "type": "basic",
        "coverage_amount": "1x annual salary",
        "max_coverage": 500000,
        "ad_d_included": True,
        "employer_paid": True,
        "premium_monthly": 0
    },
    "supplemental_life": {
        "name": "Supplemental Life Insurance",
        "type": "supplemental",
        "coverage_increments": 10000,
        "max_coverage": 500000,
        "guaranteed_issue": 100000,
        "rate_per_1000": {
            "under_30": 0.05,
            "30_39": 0.07,
            "40_49": 0.12,
            "50_59": 0.25,
            "60_plus": 0.50
        }
    },
    "spouse_life": {
        "name": "Spouse Life Insurance",
        "type": "spouse",
        "coverage_increments": 5000,
        "max_coverage": 250000,
        "guaranteed_issue": 25000
    },
    "child_life": {
        "name": "Child Life Insurance",
        "type": "child",
        "coverage_options": [5000, 10000, 15000, 20000],
        "flat_rate_monthly": 2.50
    }
}

DISABILITY_PLANS = {
    "std_standard": {
        "name": "Short-Term Disability",
        "type": "STD",
        "benefit_percentage": 60,
        "max_weekly_benefit": 1500,
        "elimination_period_days": 7,
        "benefit_duration_weeks": 26,
        "premium_rate": 0.003  # Per $100 of covered payroll
    },
    "ltd_standard": {
        "name": "Long-Term Disability",
        "type": "LTD",
        "benefit_percentage": 60,
        "max_monthly_benefit": 10000,
        "elimination_period_days": 90,
        "benefit_duration": "SSNRA",  # Social Security Normal Retirement Age
        "own_occupation_period_months": 24,
        "premium_rate": 0.005
    }
}

RETIREMENT_PLANS = {
    "401k_traditional": {
        "name": "Traditional 401(k)",
        "type": "401k",
        "employee_contribution_limit_2025": 23500,
        "catch_up_contribution_50_plus": 7500,
        "employer_match": {"rate": 100, "up_to": 4},  # 100% match up to 4% of salary
        "vesting_schedule": {
            "immediate": 0,
            "year_1": 20,
            "year_2": 40,
            "year_3": 60,
            "year_4": 80,
            "year_5": 100
        },
        "auto_enrollment": {"enabled": True, "default_rate": 3, "auto_escalation": 1}
    },
    "401k_roth": {
        "name": "Roth 401(k)",
        "type": "roth_401k",
        "employee_contribution_limit_2025": 23500,
        "catch_up_contribution_50_plus": 7500,
        "employer_match": {"rate": 100, "up_to": 4},
        "vesting_schedule": {
            "immediate": 0,
            "year_1": 20,
            "year_2": 40,
            "year_3": 60,
            "year_4": 80,
            "year_5": 100
        }
    }
}

FSA_HSA_LIMITS = {
    "hsa_2025": {
        "individual_limit": 4300,
        "family_limit": 8550,
        "catch_up_55_plus": 1000,
        "min_deductible_individual": 1650,
        "min_deductible_family": 3300,
        "max_oop_individual": 8300,
        "max_oop_family": 16600
    },
    "fsa_2025": {
        "healthcare_limit": 3300,
        "dependent_care_limit": 5000,
        "carryover_limit": 660,
        "grace_period_months": 2.5
    },
    "commuter_2025": {
        "transit_monthly": 325,
        "parking_monthly": 325
    }
}


# =============================================================================
# COBRA ADMINISTRATION
# =============================================================================

COBRA_RULES = {
    "qualifying_events": {
        "termination": {"duration_months": 18, "applies_to": ["employee", "spouse", "dependents"]},
        "reduction_hours": {"duration_months": 18, "applies_to": ["employee", "spouse", "dependents"]},
        "employee_medicare": {"duration_months": 36, "applies_to": ["spouse", "dependents"]},
        "divorce": {"duration_months": 36, "applies_to": ["spouse", "dependents"]},
        "death": {"duration_months": 36, "applies_to": ["spouse", "dependents"]},
        "dependent_aging_out": {"duration_months": 36, "applies_to": ["dependents"]},
        "disability": {"duration_months": 29, "applies_to": ["employee", "spouse", "dependents"]}
    },
    "employer_threshold": 20,  # Employees for COBRA applicability
    "election_period_days": 60,
    "payment_grace_period_days": 30,
    "admin_fee_percentage": 2,  # Can charge up to 102% of premium
    "disability_surcharge_percentage": 50,  # 150% for months 19-29 disability extension
    "notification_deadlines": {
        "employer_to_plan": 30,  # Days after qualifying event
        "plan_to_beneficiary": 14,  # Days after notification from employer
        "beneficiary_election": 60  # Days to elect COBRA
    }
}


# =============================================================================
# BENEFIT PLAN CLASS
# =============================================================================

class BenefitPlan:
    """Represents a configured benefit plan."""
    
    def __init__(
        self,
        plan_id: str,
        company_id: int,
        benefit_type: BenefitType,
        plan_name: str,
        carrier_code: str,
        effective_date: date,
        plan_details: Dict,
        employer_contribution: Dict[str, Decimal] = None,
        eligibility_rules: Dict = None
    ):
        self.plan_id = plan_id
        self.company_id = company_id
        self.benefit_type = benefit_type
        self.plan_name = plan_name
        self.carrier_code = carrier_code
        self.effective_date = effective_date
        self.plan_details = plan_details
        self.employer_contribution = employer_contribution or {}
        self.eligibility_rules = eligibility_rules or {
            "waiting_period_days": 30,
            "minimum_hours_per_week": 30,
            "employment_types": ["full_time"]
        }
        self.is_active = True
        self.created_at = datetime.now()
    
    def to_dict(self) -> Dict:
        return {
            "plan_id": self.plan_id,
            "company_id": self.company_id,
            "benefit_type": self.benefit_type.value,
            "plan_name": self.plan_name,
            "carrier": INSURANCE_CARRIERS.get(self.carrier_code, {}).get("name", self.carrier_code),
            "carrier_code": self.carrier_code,
            "effective_date": self.effective_date.isoformat(),
            "plan_details": self.plan_details,
            "employer_contribution": {k: float(v) for k, v in self.employer_contribution.items()},
            "eligibility_rules": self.eligibility_rules,
            "is_active": self.is_active
        }


class Enrollment:
    """Represents an employee's enrollment in a benefit plan."""
    
    def __init__(
        self,
        enrollment_id: str,
        employee_id: int,
        plan_id: str,
        coverage_level: CoverageLevel,
        effective_date: date,
        status: EnrollmentStatus = EnrollmentStatus.PENDING,
        dependents: List[int] = None,
        employee_contribution: Decimal = Decimal('0'),
        employer_contribution: Decimal = Decimal('0'),
        election_details: Dict = None
    ):
        self.enrollment_id = enrollment_id
        self.employee_id = employee_id
        self.plan_id = plan_id
        self.coverage_level = coverage_level
        self.effective_date = effective_date
        self.status = status
        self.dependents = dependents or []
        self.employee_contribution = employee_contribution
        self.employer_contribution = employer_contribution
        self.election_details = election_details or {}
        self.termination_date = None
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict:
        return {
            "enrollment_id": self.enrollment_id,
            "employee_id": self.employee_id,
            "plan_id": self.plan_id,
            "coverage_level": self.coverage_level.value,
            "effective_date": self.effective_date.isoformat(),
            "status": self.status.value,
            "dependents": self.dependents,
            "employee_contribution": float(self.employee_contribution),
            "employer_contribution": float(self.employer_contribution),
            "termination_date": self.termination_date.isoformat() if self.termination_date else None,
            "election_details": self.election_details
        }


class Dependent:
    """Represents an employee's dependent."""
    
    def __init__(
        self,
        dependent_id: str,
        employee_id: int,
        first_name: str,
        last_name: str,
        relationship: DependentRelationship,
        date_of_birth: date,
        ssn_last_four: str = None,
        gender: str = None,
        is_student: bool = False,
        is_disabled: bool = False,
        address_same_as_employee: bool = True
    ):
        self.dependent_id = dependent_id
        self.employee_id = employee_id
        self.first_name = first_name
        self.last_name = last_name
        self.relationship = relationship
        self.date_of_birth = date_of_birth
        self.ssn_last_four = ssn_last_four
        self.gender = gender
        self.is_student = is_student
        self.is_disabled = is_disabled
        self.address_same_as_employee = address_same_as_employee
        self.is_active = True
        self.created_at = datetime.now()
    
    def get_age(self) -> int:
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    def is_eligible_for_coverage(self, plan_type: BenefitType) -> Tuple[bool, str]:
        """Check if dependent is eligible for coverage."""
        age = self.get_age()
        
        if self.relationship in [DependentRelationship.SPOUSE, DependentRelationship.DOMESTIC_PARTNER]:
            return True, "Eligible as spouse/partner"
        
        # Child dependents
        if plan_type == BenefitType.MEDICAL:
            if age < 26:
                return True, "Eligible under ACA (under 26)"
            elif self.is_disabled:
                return True, "Eligible as disabled dependent"
            else:
                return False, "Dependent aged out (26+)"
        
        if plan_type == BenefitType.DENTAL or plan_type == BenefitType.VISION:
            if age < 26:
                return True, "Eligible (under 26)"
            elif self.is_disabled:
                return True, "Eligible as disabled dependent"
            elif self.is_student and age < 26:
                return True, "Eligible as student"
            else:
                return False, "Dependent aged out"
        
        return True, "Eligible"
    
    def to_dict(self) -> Dict:
        return {
            "dependent_id": self.dependent_id,
            "employee_id": self.employee_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": f"{self.first_name} {self.last_name}",
            "relationship": self.relationship.value,
            "date_of_birth": self.date_of_birth.isoformat(),
            "age": self.get_age(),
            "gender": self.gender,
            "is_student": self.is_student,
            "is_disabled": self.is_disabled,
            "is_active": self.is_active
        }


class COBRAEvent:
    """Represents a COBRA qualifying event."""
    
    def __init__(
        self,
        event_id: str,
        employee_id: int,
        event_type: str,
        event_date: date,
        beneficiaries: List[Dict],
        covered_plans: List[str]
    ):
        self.event_id = event_id
        self.employee_id = employee_id
        self.event_type = event_type
        self.event_date = event_date
        self.beneficiaries = beneficiaries
        self.covered_plans = covered_plans
        
        # Calculate dates
        event_rules = COBRA_RULES["qualifying_events"].get(event_type, {})
        self.duration_months = event_rules.get("duration_months", 18)
        self.election_deadline = event_date + timedelta(days=COBRA_RULES["election_period_days"])
        self.coverage_end_date = self._add_months(event_date, self.duration_months)
        
        self.status = "pending_notification"
        self.notification_sent_date = None
        self.election_received_date = None
        self.election_status = "pending"  # pending, elected, declined, expired
        self.premium_amount = Decimal('0')
        self.created_at = datetime.now()
    
    def _add_months(self, start_date: date, months: int) -> date:
        month = start_date.month - 1 + months
        year = start_date.year + month // 12
        month = month % 12 + 1
        day = min(start_date.day, [31,29,31,30,31,30,31,31,30,31,30,31][month-1])
        return date(year, month, day)
    
    def to_dict(self) -> Dict:
        return {
            "event_id": self.event_id,
            "employee_id": self.employee_id,
            "event_type": self.event_type,
            "event_date": self.event_date.isoformat(),
            "beneficiaries": self.beneficiaries,
            "covered_plans": self.covered_plans,
            "duration_months": self.duration_months,
            "election_deadline": self.election_deadline.isoformat(),
            "coverage_end_date": self.coverage_end_date.isoformat(),
            "status": self.status,
            "election_status": self.election_status,
            "premium_amount": float(self.premium_amount)
        }


# =============================================================================
# MAIN BENEFITS SERVICE
# =============================================================================

class SaurelliusBenefits:
    """
    Complete benefits administration service.
    Handles enrollment, life events, COBRA, and benefits calculations.
    """
    
    def __init__(self):
        self.plans: Dict[str, BenefitPlan] = {}
        self.enrollments: Dict[str, Enrollment] = {}
        self.dependents: Dict[str, Dependent] = {}
        self.cobra_events: Dict[str, COBRAEvent] = {}
        self.life_events: List[Dict] = []
        
        # Initialize with sample plans
        self._initialize_sample_plans()
    
    def _initialize_sample_plans(self):
        """Set up default benefit plans."""
        company_id = 1
        effective_date = date(2025, 1, 1)
        
        # Medical Plans
        for plan_key, plan_data in MEDICAL_PLANS.items():
            plan_id = f"MED-{plan_key.upper()}"
            self.plans[plan_id] = BenefitPlan(
                plan_id=plan_id,
                company_id=company_id,
                benefit_type=BenefitType.MEDICAL,
                plan_name=plan_data["name"],
                carrier_code="blue_cross",
                effective_date=effective_date,
                plan_details=plan_data,
                employer_contribution={
                    "employee_only": Decimal('300'),
                    "employee_spouse": Decimal('500'),
                    "employee_children": Decimal('450'),
                    "family": Decimal('650')
                }
            )
        
        # Dental Plans
        for plan_key, plan_data in DENTAL_PLANS.items():
            plan_id = f"DEN-{plan_key.upper()}"
            self.plans[plan_id] = BenefitPlan(
                plan_id=plan_id,
                company_id=company_id,
                benefit_type=BenefitType.DENTAL,
                plan_name=plan_data["name"],
                carrier_code="delta_dental",
                effective_date=effective_date,
                plan_details=plan_data,
                employer_contribution={
                    "employee_only": Decimal('25'),
                    "employee_spouse": Decimal('40'),
                    "employee_children": Decimal('50'),
                    "family": Decimal('60')
                }
            )
        
        # Vision Plans
        for plan_key, plan_data in VISION_PLANS.items():
            plan_id = f"VIS-{plan_key.upper()}"
            self.plans[plan_id] = BenefitPlan(
                plan_id=plan_id,
                company_id=company_id,
                benefit_type=BenefitType.VISION,
                plan_name=plan_data["name"],
                carrier_code="vsp",
                effective_date=effective_date,
                plan_details=plan_data,
                employer_contribution={
                    "employee_only": Decimal('8'),
                    "employee_spouse": Decimal('12'),
                    "employee_children": Decimal('15'),
                    "family": Decimal('20')
                }
            )
        
        # Life Insurance
        self.plans["LIFE-BASIC"] = BenefitPlan(
            plan_id="LIFE-BASIC",
            company_id=company_id,
            benefit_type=BenefitType.LIFE,
            plan_name="Basic Life Insurance",
            carrier_code="lincoln",
            effective_date=effective_date,
            plan_details=LIFE_INSURANCE_OPTIONS["basic_life"],
            employer_contribution={"all": Decimal('100')}  # 100% employer paid
        )
        
        # 401(k)
        self.plans["RET-401K"] = BenefitPlan(
            plan_id="RET-401K",
            company_id=company_id,
            benefit_type=BenefitType.RETIREMENT_401K,
            plan_name="401(k) Retirement Plan",
            carrier_code="fidelity",
            effective_date=effective_date,
            plan_details=RETIREMENT_PLANS["401k_traditional"]
        )
        
        # HSA
        self.plans["HSA-STANDARD"] = BenefitPlan(
            plan_id="HSA-STANDARD",
            company_id=company_id,
            benefit_type=BenefitType.HSA,
            plan_name="Health Savings Account",
            carrier_code="healthequity",
            effective_date=effective_date,
            plan_details=FSA_HSA_LIMITS["hsa_2025"],
            employer_contribution={"annual_seed": Decimal('500')}
        )
        
        # FSA
        self.plans["FSA-HEALTHCARE"] = BenefitPlan(
            plan_id="FSA-HEALTHCARE",
            company_id=company_id,
            benefit_type=BenefitType.FSA,
            plan_name="Healthcare FSA",
            carrier_code="healthequity",
            effective_date=effective_date,
            plan_details=FSA_HSA_LIMITS["fsa_2025"]
        )
    
    # =========================================================================
    # PLAN MANAGEMENT
    # =========================================================================
    
    def get_available_plans(self, company_id: int = 1, benefit_type: str = None) -> List[Dict]:
        """Get all available benefit plans for a company."""
        plans = []
        for plan in self.plans.values():
            if plan.company_id == company_id and plan.is_active:
                if benefit_type is None or plan.benefit_type.value == benefit_type:
                    plans.append(plan.to_dict())
        return plans
    
    def get_plan_details(self, plan_id: str) -> Optional[Dict]:
        """Get detailed information about a specific plan."""
        plan = self.plans.get(plan_id)
        if plan:
            return plan.to_dict()
        return None
    
    def get_plan_costs(self, plan_id: str, coverage_level: str, annual_salary: float = None) -> Dict:
        """Calculate costs for a specific plan and coverage level."""
        plan = self.plans.get(plan_id)
        if not plan:
            return {"error": "Plan not found"}
        
        details = plan.plan_details
        coverage_key = coverage_level.lower().replace(" ", "_")
        
        # Get premium
        premium_monthly = Decimal('0')
        if "premium_monthly" in details:
            premium_monthly = Decimal(str(details["premium_monthly"].get(coverage_key, 0)))
        
        # Get employer contribution
        employer_contrib = plan.employer_contribution.get(coverage_key, Decimal('0'))
        
        # Calculate employee cost
        employee_cost = max(premium_monthly - employer_contrib, Decimal('0'))
        
        return {
            "plan_id": plan_id,
            "plan_name": plan.plan_name,
            "coverage_level": coverage_level,
            "total_premium_monthly": float(premium_monthly),
            "employer_contribution_monthly": float(employer_contrib),
            "employee_cost_monthly": float(employee_cost),
            "employee_cost_per_paycheck": float(employee_cost / 2),  # Bi-weekly
            "employee_cost_annual": float(employee_cost * 12)
        }
    
    # =========================================================================
    # ENROLLMENT MANAGEMENT
    # =========================================================================
    
    def enroll_employee(
        self,
        employee_id: int,
        plan_id: str,
        coverage_level: str,
        effective_date: date,
        dependents: List[int] = None,
        election_details: Dict = None
    ) -> Dict:
        """Enroll an employee in a benefit plan."""
        plan = self.plans.get(plan_id)
        if not plan:
            return {"success": False, "error": "Plan not found"}
        
        # Calculate costs
        costs = self.get_plan_costs(plan_id, coverage_level)
        
        enrollment_id = str(uuid.uuid4())[:8]
        enrollment = Enrollment(
            enrollment_id=enrollment_id,
            employee_id=employee_id,
            plan_id=plan_id,
            coverage_level=CoverageLevel(coverage_level.lower().replace(" ", "_")),
            effective_date=effective_date,
            status=EnrollmentStatus.ENROLLED,
            dependents=dependents or [],
            employee_contribution=Decimal(str(costs["employee_cost_monthly"])),
            employer_contribution=Decimal(str(costs["employer_contribution_monthly"])),
            election_details=election_details or {}
        )
        
        self.enrollments[enrollment_id] = enrollment
        
        return {
            "success": True,
            "enrollment": enrollment.to_dict(),
            "costs": costs
        }
    
    def waive_coverage(self, employee_id: int, plan_id: str, reason: str = None) -> Dict:
        """Waive coverage for a benefit plan."""
        enrollment_id = str(uuid.uuid4())[:8]
        enrollment = Enrollment(
            enrollment_id=enrollment_id,
            employee_id=employee_id,
            plan_id=plan_id,
            coverage_level=CoverageLevel.EMPLOYEE_ONLY,
            effective_date=date.today(),
            status=EnrollmentStatus.WAIVED,
            election_details={"waiver_reason": reason}
        )
        
        self.enrollments[enrollment_id] = enrollment
        
        return {
            "success": True,
            "enrollment": enrollment.to_dict(),
            "message": "Coverage waived successfully"
        }
    
    def get_employee_enrollments(self, employee_id: int) -> List[Dict]:
        """Get all enrollments for an employee."""
        enrollments = []
        for enrollment in self.enrollments.values():
            if enrollment.employee_id == employee_id:
                enrollment_dict = enrollment.to_dict()
                plan = self.plans.get(enrollment.plan_id)
                if plan:
                    enrollment_dict["plan_name"] = plan.plan_name
                    enrollment_dict["benefit_type"] = plan.benefit_type.value
                    enrollment_dict["carrier"] = INSURANCE_CARRIERS.get(
                        plan.carrier_code, {}
                    ).get("name", plan.carrier_code)
                enrollments.append(enrollment_dict)
        return enrollments
    
    def terminate_enrollment(
        self,
        enrollment_id: str,
        termination_date: date,
        reason: str = "employment_termination"
    ) -> Dict:
        """Terminate a benefit enrollment."""
        enrollment = self.enrollments.get(enrollment_id)
        if not enrollment:
            return {"success": False, "error": "Enrollment not found"}
        
        enrollment.status = EnrollmentStatus.TERMINATED
        enrollment.termination_date = termination_date
        enrollment.updated_at = datetime.now()
        
        # Check COBRA eligibility
        cobra_eligible = self._check_cobra_eligibility(enrollment, reason)
        
        return {
            "success": True,
            "enrollment": enrollment.to_dict(),
            "cobra_eligible": cobra_eligible
        }
    
    # =========================================================================
    # DEPENDENT MANAGEMENT
    # =========================================================================
    
    def add_dependent(
        self,
        employee_id: int,
        first_name: str,
        last_name: str,
        relationship: str,
        date_of_birth: date,
        **kwargs
    ) -> Dict:
        """Add a dependent for an employee."""
        dependent_id = str(uuid.uuid4())[:8]
        dependent = Dependent(
            dependent_id=dependent_id,
            employee_id=employee_id,
            first_name=first_name,
            last_name=last_name,
            relationship=DependentRelationship(relationship),
            date_of_birth=date_of_birth,
            **kwargs
        )
        
        self.dependents[dependent_id] = dependent
        
        return {
            "success": True,
            "dependent": dependent.to_dict()
        }
    
    def get_employee_dependents(self, employee_id: int) -> List[Dict]:
        """Get all dependents for an employee."""
        deps = []
        for dep in self.dependents.values():
            if dep.employee_id == employee_id and dep.is_active:
                deps.append(dep.to_dict())
        return deps
    
    def remove_dependent(self, dependent_id: str) -> Dict:
        """Remove a dependent."""
        dependent = self.dependents.get(dependent_id)
        if not dependent:
            return {"success": False, "error": "Dependent not found"}
        
        dependent.is_active = False
        return {
            "success": True,
            "message": "Dependent removed successfully"
        }
    
    # =========================================================================
    # LIFE EVENTS
    # =========================================================================
    
    def record_life_event(
        self,
        employee_id: int,
        event_type: str,
        event_date: date,
        documentation: Dict = None
    ) -> Dict:
        """Record a qualifying life event."""
        event = LifeEvent(event_type)
        
        # Calculate enrollment window
        enrollment_window_end = event_date + timedelta(days=30)
        
        life_event = {
            "id": str(uuid.uuid4())[:8],
            "employee_id": employee_id,
            "event_type": event.value,
            "event_date": event_date.isoformat(),
            "enrollment_window_end": enrollment_window_end.isoformat(),
            "documentation": documentation,
            "status": "open",
            "created_at": datetime.now().isoformat()
        }
        
        self.life_events.append(life_event)
        
        return {
            "success": True,
            "life_event": life_event,
            "message": f"Life event recorded. You have until {enrollment_window_end} to make benefit changes."
        }
    
    def get_employee_life_events(self, employee_id: int) -> List[Dict]:
        """Get all life events for an employee."""
        return [e for e in self.life_events if e["employee_id"] == employee_id]
    
    # =========================================================================
    # COBRA ADMINISTRATION
    # =========================================================================
    
    def _check_cobra_eligibility(self, enrollment: Enrollment, reason: str) -> bool:
        """Check if terminated enrollment qualifies for COBRA."""
        return reason in COBRA_RULES["qualifying_events"]
    
    def initiate_cobra(
        self,
        employee_id: int,
        event_type: str,
        event_date: date,
        beneficiaries: List[Dict]
    ) -> Dict:
        """Initiate COBRA continuation coverage."""
        if event_type not in COBRA_RULES["qualifying_events"]:
            return {"success": False, "error": "Invalid qualifying event"}
        
        # Get employee's active enrollments
        covered_plans = []
        for enrollment in self.enrollments.values():
            if enrollment.employee_id == employee_id and enrollment.status == EnrollmentStatus.ENROLLED:
                plan = self.plans.get(enrollment.plan_id)
                if plan and plan.benefit_type in [BenefitType.MEDICAL, BenefitType.DENTAL, BenefitType.VISION]:
                    covered_plans.append(enrollment.plan_id)
        
        event_id = str(uuid.uuid4())[:8]
        cobra_event = COBRAEvent(
            event_id=event_id,
            employee_id=employee_id,
            event_type=event_type,
            event_date=event_date,
            beneficiaries=beneficiaries,
            covered_plans=covered_plans
        )
        
        # Calculate premium (102% of total cost)
        total_premium = Decimal('0')
        for plan_id in covered_plans:
            enrollment = next(
                (e for e in self.enrollments.values() 
                 if e.employee_id == employee_id and e.plan_id == plan_id),
                None
            )
            if enrollment:
                total_premium += enrollment.employee_contribution + enrollment.employer_contribution
        
        cobra_event.premium_amount = total_premium * Decimal('1.02')
        
        self.cobra_events[event_id] = cobra_event
        
        return {
            "success": True,
            "cobra_event": cobra_event.to_dict(),
            "message": "COBRA notification will be sent within 14 days"
        }
    
    def elect_cobra(
        self,
        event_id: str,
        elected_plans: List[str],
        beneficiary_elections: Dict
    ) -> Dict:
        """Process COBRA election."""
        cobra_event = self.cobra_events.get(event_id)
        if not cobra_event:
            return {"success": False, "error": "COBRA event not found"}
        
        if date.today() > cobra_event.election_deadline:
            return {"success": False, "error": "Election deadline has passed"}
        
        cobra_event.election_status = "elected"
        cobra_event.election_received_date = date.today()
        cobra_event.status = "active"
        
        # Create COBRA enrollments
        for plan_id in elected_plans:
            if plan_id in cobra_event.covered_plans:
                original_enrollment = next(
                    (e for e in self.enrollments.values() 
                     if e.employee_id == cobra_event.employee_id and e.plan_id == plan_id),
                    None
                )
                if original_enrollment:
                    original_enrollment.status = EnrollmentStatus.COBRA_ACTIVE
        
        return {
            "success": True,
            "cobra_event": cobra_event.to_dict(),
            "message": "COBRA coverage elected successfully"
        }
    
    def get_cobra_status(self, employee_id: int) -> List[Dict]:
        """Get COBRA status for an employee."""
        events = []
        for event in self.cobra_events.values():
            if event.employee_id == employee_id:
                events.append(event.to_dict())
        return events
    
    # =========================================================================
    # BENEFITS SUMMARY
    # =========================================================================
    
    def get_benefits_summary(self, employee_id: int) -> Dict:
        """Get complete benefits summary for an employee."""
        enrollments = self.get_employee_enrollments(employee_id)
        dependents = self.get_employee_dependents(employee_id)
        
        # Calculate total costs
        total_employee_cost = sum(e["employee_contribution"] for e in enrollments if e["status"] == "enrolled")
        total_employer_cost = sum(e["employer_contribution"] for e in enrollments if e["status"] == "enrolled")
        
        # Group by benefit type
        by_type = {}
        for enrollment in enrollments:
            benefit_type = enrollment.get("benefit_type", "other")
            if benefit_type not in by_type:
                by_type[benefit_type] = []
            by_type[benefit_type].append(enrollment)
        
        return {
            "employee_id": employee_id,
            "enrollments": enrollments,
            "dependents": dependents,
            "enrollments_by_type": by_type,
            "total_employee_cost_monthly": total_employee_cost,
            "total_employer_cost_monthly": total_employer_cost,
            "total_cost_monthly": total_employee_cost + total_employer_cost,
            "total_employee_cost_per_paycheck": total_employee_cost / 2,
            "total_employee_cost_annual": total_employee_cost * 12
        }
    
    # =========================================================================
    # CARRIER & PLAN DATA
    # =========================================================================
    
    def get_carriers(self, benefit_type: str = None) -> List[Dict]:
        """Get available insurance carriers."""
        carriers = []
        for code, data in INSURANCE_CARRIERS.items():
            if benefit_type is None or benefit_type in data["types"]:
                carriers.append({
                    "code": code,
                    "name": data["name"],
                    "types": data["types"],
                    "networks": data.get("networks", []),
                    "contact": data.get("contact")
                })
        return carriers
    
    def get_plan_templates(self, benefit_type: str) -> List[Dict]:
        """Get plan templates for a benefit type."""
        templates = {
            "medical": MEDICAL_PLANS,
            "dental": DENTAL_PLANS,
            "vision": VISION_PLANS,
            "life": LIFE_INSURANCE_OPTIONS,
            "disability": DISABILITY_PLANS,
            "retirement": RETIREMENT_PLANS
        }
        
        return templates.get(benefit_type, {})
    
    def get_contribution_limits(self) -> Dict:
        """Get current year contribution limits for FSA/HSA."""
        return {
            "hsa": FSA_HSA_LIMITS["hsa_2025"],
            "fsa": FSA_HSA_LIMITS["fsa_2025"],
            "commuter": FSA_HSA_LIMITS["commuter_2025"],
            "401k": {
                "employee_limit": RETIREMENT_PLANS["401k_traditional"]["employee_contribution_limit_2025"],
                "catch_up_50_plus": RETIREMENT_PLANS["401k_traditional"]["catch_up_contribution_50_plus"]
            }
        }
    
    def get_cobra_rules(self) -> Dict:
        """Get COBRA rules and requirements."""
        return COBRA_RULES


# Create singleton instance
benefits_service = SaurelliusBenefits()
