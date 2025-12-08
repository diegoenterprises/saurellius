"""
 STATE PAYROLL RULES - All 50 States + DC
Comprehensive payroll compliance rules based on OnPay state guides
Includes: Minimum wage, overtime, pay frequency, final pay, breaks, etc.
"""

from decimal import Decimal
from typing import Dict, Any, Optional
from datetime import date


class StatePayrollRules:
    """
    Complete state-by-state payroll rules for all 50 US states + DC.
    Data sourced from OnPay state payroll guides (2025).
    """

    # =========================================================================
    # MINIMUM WAGE BY STATE (2025)
    # =========================================================================
    MINIMUM_WAGE_2025 = {
        'AL': Decimal('7.25'),   # Federal minimum (no state minimum)
        'AK': Decimal('11.91'),
        'AZ': Decimal('14.70'),
        'AR': Decimal('11.00'),
        'CA': Decimal('16.50'),  # Large employers; $16.00 for <26 employees
        'CO': Decimal('14.81'),
        'CT': Decimal('16.35'),
        'DE': Decimal('15.00'),
        'DC': Decimal('17.50'),
        'FL': Decimal('14.00'),
        'GA': Decimal('7.25'),   # Federal minimum applies
        'HI': Decimal('14.00'),
        'ID': Decimal('7.25'),
        'IL': Decimal('15.00'),
        'IN': Decimal('7.25'),
        'IA': Decimal('7.25'),
        'KS': Decimal('7.25'),
        'KY': Decimal('7.25'),
        'LA': Decimal('7.25'),   # No state minimum
        'ME': Decimal('14.65'),
        'MD': Decimal('15.00'),
        'MA': Decimal('15.00'),
        'MI': Decimal('10.56'),
        'MN': Decimal('11.13'),  # Large employers
        'MS': Decimal('7.25'),   # No state minimum
        'MO': Decimal('13.75'),
        'MT': Decimal('10.55'),
        'NE': Decimal('13.50'),
        'NV': Decimal('12.00'),
        'NH': Decimal('7.25'),
        'NJ': Decimal('15.49'),
        'NM': Decimal('12.00'),
        'NY': Decimal('16.50'),  # NYC; varies by region
        'NC': Decimal('7.25'),
        'ND': Decimal('7.25'),
        'OH': Decimal('10.70'),
        'OK': Decimal('7.25'),
        'OR': Decimal('15.95'),  # Portland Metro; varies by region
        'PA': Decimal('7.25'),
        'RI': Decimal('15.00'),
        'SC': Decimal('7.25'),   # No state minimum
        'SD': Decimal('11.50'),
        'TN': Decimal('7.25'),   # No state minimum
        'TX': Decimal('7.25'),
        'UT': Decimal('7.25'),
        'VT': Decimal('14.01'),
        'VA': Decimal('12.41'),
        'WA': Decimal('16.66'),
        'WV': Decimal('8.75'),
        'WI': Decimal('7.25'),
        'WY': Decimal('7.25'),
    }

    # =========================================================================
    # STATE INCOME TAX STATUS
    # =========================================================================
    NO_INCOME_TAX_STATES = ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']
    
    FLAT_TAX_STATES = {
        'AZ': Decimal('0.025'),
        'CO': Decimal('0.044'),
        'ID': Decimal('0.058'),
        'IL': Decimal('0.0495'),
        'IN': Decimal('0.0315'),
        'KY': Decimal('0.045'),
        'MA': Decimal('0.05'),
        'MI': Decimal('0.0425'),
        'NC': Decimal('0.0475'),
        'PA': Decimal('0.0307'),
        'UT': Decimal('0.0465'),
    }

    # =========================================================================
    # PAY FREQUENCY REQUIREMENTS BY STATE
    # =========================================================================
    PAY_FREQUENCY_RULES = {
        'AL': {'required': 'semi-monthly', 'notes': 'At least semi-monthly'},
        'AK': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'AZ': {'required': 'semi-monthly', 'notes': '2 pay periods per month minimum'},
        'AR': {'required': 'semi-monthly', 'notes': 'At least semi-monthly'},
        'CA': {'required': 'semi-monthly', 'notes': 'Semi-monthly or more frequent; wages earned 1-15 due by 26th'},
        'CO': {'required': 'monthly', 'notes': 'At least once per month'},
        'CT': {'required': 'weekly', 'notes': 'Weekly for most employees'},
        'DE': {'required': 'monthly', 'notes': 'At least once per month'},
        'DC': {'required': 'semi-monthly', 'notes': 'At least semi-monthly'},
        'FL': {'required': 'none', 'notes': 'No state requirement'},
        'GA': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'HI': {'required': 'semi-monthly', 'notes': 'At least semi-monthly'},
        'ID': {'required': 'monthly', 'notes': 'At least once per month'},
        'IL': {'required': 'semi-monthly', 'notes': 'At least semi-monthly'},
        'IN': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'IA': {'required': 'monthly', 'notes': 'At least once per month'},
        'KS': {'required': 'monthly', 'notes': 'At least once per month'},
        'KY': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'LA': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'ME': {'required': 'bi-weekly', 'notes': 'At least every 16 days'},
        'MD': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'MA': {'required': 'weekly', 'notes': 'Weekly or bi-weekly'},
        'MI': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'MN': {'required': 'monthly', 'notes': 'At least once per month'},
        'MS': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'MO': {'required': 'semi-monthly', 'notes': 'At least semi-monthly'},
        'MT': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'NE': {'required': 'semi-monthly', 'notes': 'At least semi-monthly'},
        'NV': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'NH': {'required': 'weekly', 'notes': 'Weekly or bi-weekly'},
        'NJ': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'NM': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'NY': {'required': 'semi-monthly', 'notes': 'At least twice per month; weekly for manual laborers'},
        'NC': {'required': 'monthly', 'notes': 'At least once per month'},
        'ND': {'required': 'monthly', 'notes': 'At least once per month'},
        'OH': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'OK': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'OR': {'required': 'monthly', 'notes': 'At least once per month; within 35 days'},
        'PA': {'required': 'monthly', 'notes': 'At least once per month'},
        'RI': {'required': 'weekly', 'notes': 'Weekly for most employees'},
        'SC': {'required': 'none', 'notes': 'No state requirement'},
        'SD': {'required': 'monthly', 'notes': 'At least once per month'},
        'TN': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'TX': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'UT': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'VT': {'required': 'weekly', 'notes': 'Weekly or bi-weekly'},
        'VA': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'WA': {'required': 'monthly', 'notes': 'At least once per month'},
        'WV': {'required': 'semi-monthly', 'notes': 'At least twice per month'},
        'WI': {'required': 'monthly', 'notes': 'At least once per month'},
        'WY': {'required': 'monthly', 'notes': 'At least once per month'},
    }

    # =========================================================================
    # FINAL PAY REQUIREMENTS (Upon Termination/Resignation)
    # =========================================================================
    FINAL_PAY_RULES = {
        'AL': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'AK': {'termination': '3_business_days', 'resignation': 'next_payday'},
        'AZ': {'termination': '7_days_or_next_payday', 'resignation': 'next_payday'},
        'AR': {'termination': '7_days', 'resignation': 'next_payday'},
        'CA': {'termination': 'immediately', 'resignation': '72_hours_or_immediately'},
        'CO': {'termination': 'immediately', 'resignation': 'next_payday'},
        'CT': {'termination': 'next_business_day', 'resignation': 'next_payday'},
        'DE': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'DC': {'termination': 'next_business_day', 'resignation': 'next_payday'},
        'FL': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'GA': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'HI': {'termination': 'immediately', 'resignation': 'next_payday'},
        'ID': {'termination': 'next_payday_or_10_days', 'resignation': 'next_payday'},
        'IL': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'IN': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'IA': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'KS': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'KY': {'termination': 'next_payday_or_14_days', 'resignation': 'next_payday'},
        'LA': {'termination': 'next_payday_or_15_days', 'resignation': 'next_payday'},
        'ME': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'MD': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'MA': {'termination': 'immediately', 'resignation': 'next_payday'},
        'MI': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'MN': {'termination': 'immediately', 'resignation': 'next_payday'},
        'MS': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'MO': {'termination': 'immediately', 'resignation': 'next_payday'},
        'MT': {'termination': 'immediately', 'resignation': 'next_payday'},
        'NE': {'termination': 'next_payday_or_2_weeks', 'resignation': 'next_payday'},
        'NV': {'termination': 'immediately', 'resignation': '7_days'},
        'NH': {'termination': '72_hours', 'resignation': 'next_payday'},
        'NJ': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'NM': {'termination': '5_days', 'resignation': 'next_payday'},
        'NY': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'NC': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'ND': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'OH': {'termination': 'next_payday_or_15_days', 'resignation': 'next_payday'},
        'OK': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'OR': {'termination': 'immediately', 'resignation': '5_days_or_next_payday'},
        'PA': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'RI': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'SC': {'termination': '48_hours_or_next_payday', 'resignation': 'next_payday'},
        'SD': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'TN': {'termination': '21_days_or_next_payday', 'resignation': 'next_payday'},
        'TX': {'termination': '6_days', 'resignation': 'next_payday'},
        'UT': {'termination': '24_hours', 'resignation': 'next_payday'},
        'VT': {'termination': '72_hours', 'resignation': 'next_payday'},
        'VA': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'WA': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'WV': {'termination': '72_hours', 'resignation': 'next_payday'},
        'WI': {'termination': 'next_payday', 'resignation': 'next_payday'},
        'WY': {'termination': '5_days', 'resignation': 'next_payday'},
    }

    # =========================================================================
    # OVERTIME RULES BY STATE
    # =========================================================================
    OVERTIME_RULES = {
        # Most states follow FLSA: 1.5x after 40 hours/week
        'default': {
            'threshold_weekly': 40,
            'threshold_daily': None,
            'rate': Decimal('1.5'),
            'double_time': None,
        },
        # States with daily overtime
        'AK': {
            'threshold_weekly': 40,
            'threshold_daily': 8,
            'rate': Decimal('1.5'),
            'double_time': None,
        },
        'CA': {
            'threshold_weekly': 40,
            'threshold_daily': 8,
            'rate': Decimal('1.5'),
            'double_time': 12,  # 2x after 12 hours/day
            'seventh_day': True,  # 1.5x for first 8 hours on 7th consecutive day
        },
        'CO': {
            'threshold_weekly': 40,
            'threshold_daily': 12,
            'rate': Decimal('1.5'),
            'double_time': None,
        },
        'NV': {
            'threshold_weekly': 40,
            'threshold_daily': 8,
            'rate': Decimal('1.5'),
            'double_time': None,
            'notes': 'Daily OT if paid less than 1.5x minimum wage',
        },
        'OR': {
            'threshold_weekly': 40,
            'threshold_daily': None,
            'rate': Decimal('1.5'),
            'double_time': None,
            'manufacturing_daily': 10,  # Manufacturing has 10-hour daily OT
        },
    }

    # =========================================================================
    # MEAL AND REST BREAK REQUIREMENTS
    # =========================================================================
    BREAK_REQUIREMENTS = {
        # States with mandated breaks
        'CA': {
            'meal_break': '30_min_after_5_hours',
            'rest_break': '10_min_per_4_hours',
            'paid_rest': True,
            'paid_meal': False,
        },
        'CO': {
            'meal_break': '30_min_after_5_hours',
            'rest_break': '10_min_per_4_hours',
            'paid_rest': True,
            'paid_meal': False,
        },
        'CT': {
            'meal_break': '30_min_after_7.5_hours',
            'rest_break': None,
            'paid_rest': False,
            'paid_meal': False,
        },
        'DE': {
            'meal_break': '30_min_after_7.5_hours',
            'rest_break': None,
            'paid_rest': False,
            'paid_meal': False,
        },
        'IL': {
            'meal_break': '20_min_after_7.5_hours',
            'rest_break': None,
            'paid_rest': False,
            'paid_meal': False,
        },
        'KY': {
            'meal_break': 'reasonable_period',
            'rest_break': '10_min_per_4_hours',
            'paid_rest': True,
            'paid_meal': False,
        },
        'MA': {
            'meal_break': '30_min_after_6_hours',
            'rest_break': None,
            'paid_rest': False,
            'paid_meal': False,
        },
        'MN': {
            'meal_break': 'sufficient_time_after_8_hours',
            'rest_break': 'bathroom_breaks_required',
            'paid_rest': True,
            'paid_meal': False,
        },
        'NV': {
            'meal_break': '30_min_after_8_hours',
            'rest_break': '10_min_per_4_hours',
            'paid_rest': True,
            'paid_meal': False,
        },
        'NY': {
            'meal_break': '30_min_midday',
            'rest_break': None,
            'paid_rest': False,
            'paid_meal': False,
            'notes': 'Factory workers: 60 min; shift workers: additional 20 min',
        },
        'OR': {
            'meal_break': '30_min_after_6_hours',
            'rest_break': '10_min_per_4_hours',
            'paid_rest': True,
            'paid_meal': False,
        },
        'RI': {
            'meal_break': '30_min_after_6_hours',
            'rest_break': None,
            'paid_rest': False,
            'paid_meal': False,
        },
        'TN': {
            'meal_break': '30_min_after_6_hours',
            'rest_break': None,
            'paid_rest': False,
            'paid_meal': False,
        },
        'WA': {
            'meal_break': '30_min_after_5_hours',
            'rest_break': '10_min_per_4_hours',
            'paid_rest': True,
            'paid_meal': False,
        },
        'WV': {
            'meal_break': '20_min_after_6_hours',
            'rest_break': None,
            'paid_rest': False,
            'paid_meal': False,
        },
    }

    # =========================================================================
    # STATE UNEMPLOYMENT INSURANCE (SUI) WAGE BASES 2025
    # =========================================================================
    SUI_WAGE_BASES_2025 = {
        'AL': Decimal('8000'),
        'AK': Decimal('49700'),
        'AZ': Decimal('8000'),
        'AR': Decimal('7000'),
        'CA': Decimal('7000'),
        'CO': Decimal('23800'),
        'CT': Decimal('25000'),
        'DE': Decimal('10500'),
        'DC': Decimal('9000'),
        'FL': Decimal('7000'),
        'GA': Decimal('9500'),
        'HI': Decimal('59100'),
        'ID': Decimal('53500'),
        'IL': Decimal('13590'),
        'IN': Decimal('9500'),
        'IA': Decimal('38200'),
        'KS': Decimal('14000'),
        'KY': Decimal('11400'),
        'LA': Decimal('7700'),
        'ME': Decimal('12000'),
        'MD': Decimal('8500'),
        'MA': Decimal('15000'),
        'MI': Decimal('9500'),
        'MN': Decimal('42000'),
        'MS': Decimal('14000'),
        'MO': Decimal('10500'),
        'MT': Decimal('45200'),
        'NE': Decimal('9000'),
        'NV': Decimal('40600'),
        'NH': Decimal('14000'),
        'NJ': Decimal('42300'),
        'NM': Decimal('31700'),
        'NY': Decimal('12500'),
        'NC': Decimal('31400'),
        'ND': Decimal('43800'),
        'OH': Decimal('9000'),
        'OK': Decimal('27000'),
        'OR': Decimal('52800'),
        'PA': Decimal('10000'),
        'RI': Decimal('29700'),
        'SC': Decimal('14000'),
        'SD': Decimal('15000'),
        'TN': Decimal('7000'),
        'TX': Decimal('9000'),
        'UT': Decimal('47000'),
        'VT': Decimal('16100'),
        'VA': Decimal('8000'),
        'WA': Decimal('68500'),
        'WV': Decimal('9000'),
        'WI': Decimal('14000'),
        'WY': Decimal('30900'),
    }

    # =========================================================================
    # STATE DISABILITY INSURANCE (SDI) STATES
    # =========================================================================
    SDI_STATES = {
        'CA': {
            'rate': Decimal('0.009'),
            'wage_base': Decimal('153164'),
            'employee_paid': True,
        },
        'HI': {
            'rate': Decimal('0.005'),
            'wage_base': None,  # No cap
            'employee_paid': True,
        },
        'NJ': {
            'rate': Decimal('0.0047'),
            'wage_base': Decimal('161400'),
            'employee_paid': True,
        },
        'NY': {
            'rate': Decimal('0.005'),
            'wage_base': Decimal('260'),  # Max $0.60/week
            'employee_paid': True,
        },
        'RI': {
            'rate': Decimal('0.011'),
            'wage_base': Decimal('87000'),
            'employee_paid': True,
        },
        'PR': {
            'rate': Decimal('0.003'),
            'wage_base': Decimal('9000'),
            'employee_paid': True,
        },
    }

    # =========================================================================
    # WORKERS COMPENSATION REQUIREMENTS (From OnPay PDFs)
    # =========================================================================
    WORKERS_COMP_REQUIRED = {
        'AL': {'required': True, 'threshold': 5, 'notes': 'Required for 5+ employees'},
        'AK': {'required': True, 'threshold': 1, 'notes': 'Required for almost all employers'},
        'AZ': {'required': True, 'threshold': 1, 'notes': 'Required for almost all employers'},
        'AR': {'required': True, 'threshold': 3, 'notes': 'Required for 3+ employees'},
        'CA': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'CO': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'CT': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'DE': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'DC': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'FL': {'required': True, 'threshold': 4, 'notes': 'Required for 4+ employees'},
        'GA': {'required': True, 'threshold': 3, 'notes': 'Required for 3+ employees'},
        'HI': {'required': True, 'threshold': 1, 'notes': 'Required for almost all employers'},
        'ID': {'required': True, 'threshold': 1, 'notes': 'Required for almost all employers'},
        'IL': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'IN': {'required': True, 'threshold': 1, 'notes': 'Required for almost all employers'},
        'IA': {'required': True, 'threshold': 1, 'notes': 'Required for almost all employers'},
        'KS': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'KY': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'LA': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'ME': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'MD': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'MA': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'MI': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'MN': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'MS': {'required': True, 'threshold': 5, 'notes': 'Required for 5+ employees'},
        'MO': {'required': True, 'threshold': 5, 'notes': 'Required for 5+ employees'},
        'MT': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'NE': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'NV': {'required': True, 'threshold': 1, 'notes': 'Required for almost all employers'},
        'NH': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'NJ': {'required': True, 'threshold': 1, 'notes': 'Required for almost all businesses with 1+ employees'},
        'NM': {'required': True, 'threshold': 3, 'notes': 'Required for 3+ employees'},
        'NY': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'NC': {'required': True, 'threshold': 3, 'notes': 'Required for 3+ employees'},
        'ND': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'OH': {'required': True, 'threshold': 1, 'notes': 'Required for almost all employers'},
        'OK': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'OR': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'PA': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'RI': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'SC': {'required': True, 'threshold': 4, 'notes': 'Required for 4+ employees'},
        'SD': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'TN': {'required': True, 'threshold': 5, 'notes': 'Required for 5+ employees'},
        'TX': {'required': False, 'threshold': None, 'notes': 'Not required - Texas does not mandate workers comp'},
        'UT': {'required': True, 'threshold': 1, 'notes': 'Required for almost all businesses with 1+ employees'},
        'VT': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'VA': {'required': True, 'threshold': 2, 'notes': 'Required for 2+ employees'},
        'WA': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'WV': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
        'WI': {'required': True, 'threshold': 3, 'notes': 'Required for 3+ employees'},
        'WY': {'required': True, 'threshold': 1, 'notes': 'Required for most employers'},
    }

    # =========================================================================
    # SEXUAL HARASSMENT TRAINING REQUIREMENTS (From OnPay PDFs)
    # =========================================================================
    HARASSMENT_TRAINING_REQUIRED = {
        'CA': {'required': True, 'threshold': 5, 'notes': 'Required for businesses with 5+ employees'},
        'CT': {'required': True, 'threshold': 3, 'notes': 'Required for businesses with 3+ employees'},
        'DE': {'required': True, 'threshold': 50, 'notes': 'Required for businesses with 50+ employees'},
        'IL': {'required': True, 'threshold': 1, 'notes': 'Required annually for almost all employees'},
        'ME': {'required': True, 'threshold': 15, 'notes': 'Required for businesses with 15+ employees'},
        'NY': {'required': True, 'threshold': 1, 'notes': 'Required for ALL businesses for all employees'},
        # States where training is recommended but not required
        'AL': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'AK': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'AZ': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'AR': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'CO': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'DC': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'FL': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'GA': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'HI': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'ID': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'IN': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'IA': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'KS': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'KY': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'LA': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'MD': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'MA': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'MI': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'MN': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'MS': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'MO': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'MT': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'NE': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'NV': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'NH': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'NJ': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'NM': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'NC': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'ND': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'OH': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'OK': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'OR': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'PA': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'RI': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'SC': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'SD': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'TN': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'TX': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'UT': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'VT': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'VA': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'WA': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'WV': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'WI': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
        'WY': {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'},
    }

    # =========================================================================
    # E-VERIFY REQUIREMENTS (From OnPay PDFs)
    # =========================================================================
    E_VERIFY_REQUIRED = {
        'FL': {'required': True, 'threshold': 25, 'notes': 'Required for private employers with 25+ employees (as of July 1, 2023)'},
        'AL': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'AZ': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'GA': {'required': True, 'threshold': 10, 'notes': 'Required for employers with 10+ employees'},
        'LA': {'required': True, 'threshold': 1, 'notes': 'Required for employers with state contracts'},
        'MS': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'NC': {'required': True, 'threshold': 25, 'notes': 'Required for employers with 25+ employees'},
        'SC': {'required': True, 'threshold': 1, 'notes': 'Required for all employers'},
        'TN': {'required': True, 'threshold': 6, 'notes': 'Required for employers with 6+ employees'},
        'UT': {'required': True, 'threshold': 1, 'notes': 'Required for employers with state contracts'},
    }

    # =========================================================================
    # PAID FAMILY LEAVE STATES (From OnPay PDFs - Enhanced)
    # =========================================================================
    PAID_FAMILY_LEAVE_STATES = {
        'CA': {
            'rate': Decimal('0.009'),
            'wage_base': Decimal('153164'),
            'max_weeks': 8,
            'wage_replacement': Decimal('0.70'),
        },
        'CO': {
            'rate': Decimal('0.009'),
            'wage_base': Decimal('176100'),
            'max_weeks': 12,
            'wage_replacement': Decimal('0.90'),
        },
        'CT': {
            'rate': Decimal('0.005'),
            'wage_base': None,
            'max_weeks': 12,
            'wage_replacement': Decimal('0.60'),
        },
        'MA': {
            'rate': Decimal('0.0088'),
            'wage_base': Decimal('176100'),
            'max_weeks': 26,
            'wage_replacement': Decimal('0.80'),
        },
        'NJ': {
            'rate': Decimal('0.0006'),
            'wage_base': Decimal('161400'),
            'max_weeks': 12,
            'wage_replacement': Decimal('0.85'),
        },
        'NY': {
            'rate': Decimal('0.00455'),
            'wage_base': Decimal('1718.15'),  # Weekly cap
            'max_weeks': 12,
            'wage_replacement': Decimal('0.67'),
        },
        'OR': {
            'rate': Decimal('0.01'),
            'wage_base': Decimal('168600'),
            'max_weeks': 12,
            'wage_replacement': Decimal('1.0'),  # Up to 100% for low earners
        },
        'RI': {
            'rate': Decimal('0.011'),
            'wage_base': Decimal('87000'),
            'max_weeks': 6,
            'wage_replacement': Decimal('0.60'),
        },
        'WA': {
            'rate': Decimal('0.0074'),
            'wage_base': Decimal('168600'),
            'max_weeks': 12,
            'wage_replacement': Decimal('0.90'),
        },
    }

    # =========================================================================
    # METHODS
    # =========================================================================

    @classmethod
    def get_minimum_wage(cls, state_code: str) -> Decimal:
        """Get minimum wage for a state."""
        return cls.MINIMUM_WAGE_2025.get(state_code.upper(), Decimal('7.25'))

    @classmethod
    def get_pay_frequency_rule(cls, state_code: str) -> Dict[str, Any]:
        """Get pay frequency requirements for a state."""
        return cls.PAY_FREQUENCY_RULES.get(
            state_code.upper(),
            {'required': 'none', 'notes': 'No specific state requirement'}
        )

    @classmethod
    def get_final_pay_rule(cls, state_code: str) -> Dict[str, str]:
        """Get final pay requirements for termination/resignation."""
        return cls.FINAL_PAY_RULES.get(
            state_code.upper(),
            {'termination': 'next_payday', 'resignation': 'next_payday'}
        )

    @classmethod
    def get_overtime_rule(cls, state_code: str) -> Dict[str, Any]:
        """Get overtime rules for a state."""
        return cls.OVERTIME_RULES.get(
            state_code.upper(),
            cls.OVERTIME_RULES['default']
        )

    @classmethod
    def get_break_requirements(cls, state_code: str) -> Optional[Dict[str, Any]]:
        """Get meal/rest break requirements for a state."""
        return cls.BREAK_REQUIREMENTS.get(state_code.upper())

    @classmethod
    def get_sui_wage_base(cls, state_code: str) -> Decimal:
        """Get State Unemployment Insurance wage base."""
        return cls.SUI_WAGE_BASES_2025.get(state_code.upper(), Decimal('7000'))

    @classmethod
    def has_state_income_tax(cls, state_code: str) -> bool:
        """Check if state has income tax."""
        return state_code.upper() not in cls.NO_INCOME_TAX_STATES

    @classmethod
    def has_state_disability(cls, state_code: str) -> bool:
        """Check if state has State Disability Insurance."""
        return state_code.upper() in cls.SDI_STATES

    @classmethod
    def has_paid_family_leave(cls, state_code: str) -> bool:
        """Check if state has Paid Family Leave."""
        return state_code.upper() in cls.PAID_FAMILY_LEAVE_STATES

    @classmethod
    def get_sdi_rate(cls, state_code: str) -> Optional[Dict[str, Any]]:
        """Get SDI rate and wage base for applicable states."""
        return cls.SDI_STATES.get(state_code.upper())

    @classmethod
    def get_pfl_rate(cls, state_code: str) -> Optional[Dict[str, Any]]:
        """Get Paid Family Leave rate for applicable states."""
        return cls.PAID_FAMILY_LEAVE_STATES.get(state_code.upper())

    @classmethod
    def get_workers_comp_requirement(cls, state_code: str) -> Dict[str, Any]:
        """Get workers compensation requirements for a state (from OnPay)."""
        return cls.WORKERS_COMP_REQUIRED.get(
            state_code.upper(),
            {'required': True, 'threshold': 1, 'notes': 'Check state requirements'}
        )

    @classmethod
    def get_harassment_training_requirement(cls, state_code: str) -> Dict[str, Any]:
        """Get sexual harassment training requirements for a state (from OnPay)."""
        return cls.HARASSMENT_TRAINING_REQUIRED.get(
            state_code.upper(),
            {'required': False, 'threshold': None, 'notes': 'Highly recommended but not required'}
        )

    @classmethod
    def get_everify_requirement(cls, state_code: str) -> Optional[Dict[str, Any]]:
        """Get E-Verify requirements for a state (from OnPay)."""
        return cls.E_VERIFY_REQUIRED.get(state_code.upper())

    @classmethod
    def requires_harassment_training(cls, state_code: str) -> bool:
        """Check if state requires harassment training."""
        req = cls.HARASSMENT_TRAINING_REQUIRED.get(state_code.upper(), {})
        return req.get('required', False)

    @classmethod
    def requires_everify(cls, state_code: str) -> bool:
        """Check if state requires E-Verify."""
        return state_code.upper() in cls.E_VERIFY_REQUIRED

    @classmethod
    def get_state_summary(cls, state_code: str) -> Dict[str, Any]:
        """Get comprehensive payroll summary for a state (includes OnPay data)."""
        state = state_code.upper()
        return {
            'state_code': state,
            'minimum_wage': float(cls.get_minimum_wage(state)),
            'has_income_tax': cls.has_state_income_tax(state),
            'income_tax_type': 'none' if state in cls.NO_INCOME_TAX_STATES else (
                'flat' if state in cls.FLAT_TAX_STATES else 'progressive'
            ),
            'flat_tax_rate': float(cls.FLAT_TAX_STATES.get(state, 0)) if state in cls.FLAT_TAX_STATES else None,
            'pay_frequency': cls.get_pay_frequency_rule(state),
            'final_pay': cls.get_final_pay_rule(state),
            'overtime': cls.get_overtime_rule(state),
            'break_requirements': cls.get_break_requirements(state),
            'sui_wage_base': float(cls.get_sui_wage_base(state)),
            'has_sdi': cls.has_state_disability(state),
            'sdi_info': cls.get_sdi_rate(state),
            'has_pfl': cls.has_paid_family_leave(state),
            'pfl_info': cls.get_pfl_rate(state),
            # OnPay compliance data
            'workers_comp': cls.get_workers_comp_requirement(state),
            'harassment_training': cls.get_harassment_training_requirement(state),
            'requires_harassment_training': cls.requires_harassment_training(state),
            'e_verify': cls.get_everify_requirement(state),
            'requires_e_verify': cls.requires_everify(state),
        }

    @classmethod
    def get_all_states_summary(cls) -> Dict[str, Dict[str, Any]]:
        """Get payroll summary for all states."""
        states = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
            'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
            'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
            'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
            'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ]
        return {state: cls.get_state_summary(state) for state in states}


# Singleton instance
state_payroll_rules = StatePayrollRules()
