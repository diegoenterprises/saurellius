"""
Saurellius Scheduler Service
Automated tax, payroll, and compliance updates based on effective dates.
Ensures platform is always current with latest regulations.
"""

from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import pytz

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('SaurelliusScheduler')


class TaxUpdateScheduler:
    """
    Manages scheduled tax and compliance updates.
    Automatically applies new rates when they take effect.
    """
    
    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone=pytz.UTC)
        self.last_update_check = None
        self.pending_updates = []
        self.applied_updates = []
        
        # Tax year effective dates
        self.tax_year_dates = {
            2025: {
                'federal_start': date(2025, 1, 1),
                'q1_941_due': date(2025, 4, 30),
                'q2_941_due': date(2025, 7, 31),
                'q3_941_due': date(2025, 10, 31),
                'q4_941_due': date(2026, 1, 31),
                'w2_due': date(2026, 1, 31),
                '1099_due': date(2026, 1, 31),
                '940_due': date(2026, 1, 31),
            },
            2026: {
                'federal_start': date(2026, 1, 1),
                'q1_941_due': date(2026, 4, 30),
                'q2_941_due': date(2026, 7, 31),
                'q3_941_due': date(2026, 10, 31),
                'q4_941_due': date(2027, 1, 31),
                'w2_due': date(2027, 1, 31),
                '1099_due': date(2027, 1, 31),
                '940_due': date(2027, 1, 31),
            }
        }
        
        # Federal tax data by year (automatically applied on effective date)
        self.federal_rates_by_year = {
            2025: {
                'social_security_rate': 0.062,
                'social_security_wage_base': 176100,
                'medicare_rate': 0.0145,
                'additional_medicare_rate': 0.009,
                'additional_medicare_threshold': 200000,
                'futa_rate': 0.006,
                'futa_wage_base': 7000,
                'federal_brackets': {
                    'single': [
                        (11925, 0.10),
                        (48475, 0.12),
                        (103350, 0.22),
                        (197300, 0.24),
                        (250525, 0.32),
                        (626350, 0.35),
                        (float('inf'), 0.37)
                    ],
                    'married_filing_jointly': [
                        (23850, 0.10),
                        (96950, 0.12),
                        (206700, 0.22),
                        (394600, 0.24),
                        (501050, 0.32),
                        (751600, 0.35),
                        (float('inf'), 0.37)
                    ],
                    'married_filing_separately': [
                        (11925, 0.10),
                        (48475, 0.12),
                        (103350, 0.22),
                        (197300, 0.24),
                        (250525, 0.32),
                        (375800, 0.35),
                        (float('inf'), 0.37)
                    ],
                    'head_of_household': [
                        (17000, 0.10),
                        (64850, 0.12),
                        (103350, 0.22),
                        (197300, 0.24),
                        (250500, 0.32),
                        (626350, 0.35),
                        (float('inf'), 0.37)
                    ]
                },
                'standard_deductions': {
                    'single': 15000,
                    'married_filing_jointly': 30000,
                    'married_filing_separately': 15000,
                    'head_of_household': 22500
                }
            },
            2026: {
                'social_security_rate': 0.062,
                'social_security_wage_base': 181200,  # Projected increase
                'medicare_rate': 0.0145,
                'additional_medicare_rate': 0.009,
                'additional_medicare_threshold': 200000,
                'futa_rate': 0.006,
                'futa_wage_base': 7000,
                'federal_brackets': {
                    'single': [
                        (12300, 0.10),
                        (50000, 0.12),
                        (106500, 0.22),
                        (203500, 0.24),
                        (258500, 0.32),
                        (645800, 0.35),
                        (float('inf'), 0.37)
                    ],
                    'married_filing_jointly': [
                        (24600, 0.10),
                        (100000, 0.12),
                        (213000, 0.22),
                        (407000, 0.24),
                        (517000, 0.32),
                        (775200, 0.35),
                        (float('inf'), 0.37)
                    ],
                    'married_filing_separately': [
                        (12300, 0.10),
                        (50000, 0.12),
                        (106500, 0.22),
                        (203500, 0.24),
                        (258500, 0.32),
                        (387600, 0.35),
                        (float('inf'), 0.37)
                    ],
                    'head_of_household': [
                        (17550, 0.10),
                        (66900, 0.12),
                        (106500, 0.22),
                        (203500, 0.24),
                        (258500, 0.32),
                        (645800, 0.35),
                        (float('inf'), 0.37)
                    ]
                },
                'standard_deductions': {
                    'single': 15500,
                    'married_filing_jointly': 31000,
                    'married_filing_separately': 15500,
                    'head_of_household': 23250
                }
            }
        }
        
        # State rate changes with effective dates
        self.state_updates = [
            {
                'state': 'CA',
                'effective_date': date(2025, 1, 1),
                'changes': {'sdi_rate': 0.009, 'sdi_wage_base': 173400}
            },
            {
                'state': 'CA',
                'effective_date': date(2026, 1, 1),
                'changes': {'sdi_rate': 0.009, 'sdi_wage_base': 178800}
            },
            {
                'state': 'NY',
                'effective_date': date(2025, 1, 1),
                'changes': {'pfl_rate': 0.00373, 'pfl_wage_base': 89343.80}
            },
            {
                'state': 'NY',
                'effective_date': date(2026, 1, 1),
                'changes': {'pfl_rate': 0.00388, 'pfl_wage_base': 92100}
            },
            {
                'state': 'WA',
                'effective_date': date(2025, 1, 1),
                'changes': {'pfml_rate': 0.0074, 'pfml_wage_base': 176100}
            },
            {
                'state': 'CO',
                'effective_date': date(2025, 1, 1),
                'changes': {'pfml_rate': 0.009, 'pfml_wage_base': 176100}
            },
            {
                'state': 'MA',
                'effective_date': date(2025, 1, 1),
                'changes': {'pfml_rate': 0.0088, 'pfml_wage_base': 176100}
            },
            {
                'state': 'OR',
                'effective_date': date(2025, 1, 1),
                'changes': {'pfml_rate': 0.01, 'pfml_wage_base': 176100}
            },
            {
                'state': 'CT',
                'effective_date': date(2025, 1, 1),
                'changes': {'pfml_rate': 0.005, 'pfml_wage_base': 176100}
            },
        ]
        
        # Minimum wage updates by state
        self.minimum_wage_updates = [
            {'state': 'CA', 'effective_date': date(2025, 1, 1), 'rate': 16.50},
            {'state': 'CA', 'effective_date': date(2026, 1, 1), 'rate': 17.00},
            {'state': 'WA', 'effective_date': date(2025, 1, 1), 'rate': 16.66},
            {'state': 'NY', 'effective_date': date(2025, 1, 1), 'rate': 16.50},
            {'state': 'NY', 'effective_date': date(2026, 1, 1), 'rate': 17.00},
            {'state': 'CO', 'effective_date': date(2025, 1, 1), 'rate': 14.81},
            {'state': 'MA', 'effective_date': date(2025, 1, 1), 'rate': 15.00},
            {'state': 'AZ', 'effective_date': date(2025, 1, 1), 'rate': 14.70},
            {'state': 'FL', 'effective_date': date(2025, 9, 30), 'rate': 14.00},
            {'state': 'FL', 'effective_date': date(2026, 9, 30), 'rate': 15.00},
        ]
        
        # Compliance deadlines
        self.compliance_deadlines = []
        self._generate_compliance_deadlines()
    
    def _generate_compliance_deadlines(self):
        """Generate compliance deadlines for current and next year"""
        current_year = datetime.now().year
        
        for year in [current_year, current_year + 1]:
            deadlines = [
                {
                    'form': '941',
                    'quarter': 'Q1',
                    'deadline': date(year, 4, 30),
                    'description': f'Q1 {year} Form 941 - Quarterly Federal Tax Return'
                },
                {
                    'form': '941',
                    'quarter': 'Q2',
                    'deadline': date(year, 7, 31),
                    'description': f'Q2 {year} Form 941 - Quarterly Federal Tax Return'
                },
                {
                    'form': '941',
                    'quarter': 'Q3',
                    'deadline': date(year, 10, 31),
                    'description': f'Q3 {year} Form 941 - Quarterly Federal Tax Return'
                },
                {
                    'form': '941',
                    'quarter': 'Q4',
                    'deadline': date(year + 1, 1, 31),
                    'description': f'Q4 {year} Form 941 - Quarterly Federal Tax Return'
                },
                {
                    'form': 'W-2',
                    'quarter': 'Annual',
                    'deadline': date(year + 1, 1, 31),
                    'description': f'{year} W-2 - Wage and Tax Statement'
                },
                {
                    'form': '1099-NEC',
                    'quarter': 'Annual',
                    'deadline': date(year + 1, 1, 31),
                    'description': f'{year} 1099-NEC - Nonemployee Compensation'
                },
                {
                    'form': '940',
                    'quarter': 'Annual',
                    'deadline': date(year + 1, 1, 31),
                    'description': f'{year} Form 940 - FUTA Tax Return'
                },
                {
                    'form': '1095-C',
                    'quarter': 'Annual',
                    'deadline': date(year + 1, 3, 2),
                    'description': f'{year} 1095-C - ACA Health Coverage'
                },
            ]
            self.compliance_deadlines.extend(deadlines)
    
    def get_current_tax_year(self) -> int:
        """Get the current tax year based on today's date"""
        today = date.today()
        return today.year
    
    def get_effective_federal_rates(self, as_of_date: Optional[date] = None) -> Dict:
        """
        Get federal rates effective as of a specific date.
        Automatically returns the correct year's rates.
        """
        if as_of_date is None:
            as_of_date = date.today()
        
        year = as_of_date.year
        
        # Return rates for the effective year
        if year in self.federal_rates_by_year:
            return self.federal_rates_by_year[year]
        
        # Default to latest available year
        latest_year = max(self.federal_rates_by_year.keys())
        return self.federal_rates_by_year[latest_year]
    
    def get_effective_state_rates(self, state: str, as_of_date: Optional[date] = None) -> Dict:
        """
        Get state-specific rates effective as of a specific date.
        """
        if as_of_date is None:
            as_of_date = date.today()
        
        # Find the most recent update for this state that has taken effect
        state_updates = [u for u in self.state_updates 
                        if u['state'] == state and u['effective_date'] <= as_of_date]
        
        if not state_updates:
            return {}
        
        # Sort by effective date descending and get the most recent
        state_updates.sort(key=lambda x: x['effective_date'], reverse=True)
        return state_updates[0]['changes']
    
    def get_effective_minimum_wage(self, state: str, as_of_date: Optional[date] = None) -> float:
        """
        Get minimum wage effective as of a specific date.
        """
        if as_of_date is None:
            as_of_date = date.today()
        
        # Federal minimum wage fallback
        federal_minimum = 7.25
        
        # Find state-specific minimum wage
        state_updates = [u for u in self.minimum_wage_updates 
                        if u['state'] == state and u['effective_date'] <= as_of_date]
        
        if not state_updates:
            return federal_minimum
        
        # Sort by effective date descending and get the most recent
        state_updates.sort(key=lambda x: x['effective_date'], reverse=True)
        return max(state_updates[0]['rate'], federal_minimum)
    
    def get_upcoming_deadlines(self, days_ahead: int = 30) -> List[Dict]:
        """
        Get compliance deadlines coming up in the next N days.
        """
        today = date.today()
        cutoff = today + timedelta(days=days_ahead)
        
        upcoming = [d for d in self.compliance_deadlines 
                   if today <= d['deadline'] <= cutoff]
        
        upcoming.sort(key=lambda x: x['deadline'])
        return upcoming
    
    def get_pending_rate_changes(self) -> List[Dict]:
        """
        Get rate changes that will take effect in the future.
        """
        today = date.today()
        
        pending_federal = []
        for year, rates in self.federal_rates_by_year.items():
            effective_date = date(year, 1, 1)
            if effective_date > today:
                pending_federal.append({
                    'type': 'federal',
                    'year': year,
                    'effective_date': effective_date.isoformat(),
                    'changes': {
                        'social_security_wage_base': rates['social_security_wage_base'],
                        'standard_deduction_single': rates['standard_deductions']['single']
                    }
                })
        
        pending_state = [
            {
                'type': 'state',
                'state': u['state'],
                'effective_date': u['effective_date'].isoformat(),
                'changes': u['changes']
            }
            for u in self.state_updates if u['effective_date'] > today
        ]
        
        pending_wage = [
            {
                'type': 'minimum_wage',
                'state': u['state'],
                'effective_date': u['effective_date'].isoformat(),
                'rate': u['rate']
            }
            for u in self.minimum_wage_updates if u['effective_date'] > today
        ]
        
        return pending_federal + pending_state + pending_wage
    
    def check_and_apply_updates(self) -> Dict:
        """
        Check for any tax/rate updates that should now be in effect.
        Called by the scheduler at midnight on the first of each month.
        """
        today = date.today()
        self.last_update_check = datetime.now()
        
        updates_applied = {
            'timestamp': datetime.now().isoformat(),
            'federal_updates': [],
            'state_updates': [],
            'minimum_wage_updates': [],
            'compliance_alerts': []
        }
        
        # Check if it's January 1st - new tax year
        if today.month == 1 and today.day == 1:
            year = today.year
            if year in self.federal_rates_by_year:
                updates_applied['federal_updates'].append({
                    'year': year,
                    'status': 'applied',
                    'message': f'Federal tax rates for {year} are now in effect',
                    'social_security_wage_base': self.federal_rates_by_year[year]['social_security_wage_base']
                })
                logger.info(f"Applied {year} federal tax rates")
        
        # Check for state updates effective today
        for update in self.state_updates:
            if update['effective_date'] == today:
                updates_applied['state_updates'].append({
                    'state': update['state'],
                    'changes': update['changes'],
                    'status': 'applied'
                })
                logger.info(f"Applied {update['state']} state rate updates")
        
        # Check for minimum wage updates effective today
        for update in self.minimum_wage_updates:
            if update['effective_date'] == today:
                updates_applied['minimum_wage_updates'].append({
                    'state': update['state'],
                    'rate': update['rate'],
                    'status': 'applied'
                })
                logger.info(f"Applied {update['state']} minimum wage: ${update['rate']}")
        
        # Check for upcoming compliance deadlines (7 day warning)
        upcoming = self.get_upcoming_deadlines(days_ahead=7)
        for deadline in upcoming:
            updates_applied['compliance_alerts'].append({
                'form': deadline['form'],
                'deadline': deadline['deadline'].isoformat(),
                'description': deadline['description'],
                'days_remaining': (deadline['deadline'] - today).days
            })
        
        self.applied_updates.append(updates_applied)
        return updates_applied
    
    def start(self):
        """Start the scheduler with all jobs"""
        
        # Daily check at midnight UTC
        self.scheduler.add_job(
            self.check_and_apply_updates,
            CronTrigger(hour=0, minute=0),
            id='daily_tax_update_check',
            name='Daily Tax Update Check',
            replace_existing=True
        )
        
        # Check on the 1st of every month at midnight
        self.scheduler.add_job(
            self.check_and_apply_updates,
            CronTrigger(day=1, hour=0, minute=1),
            id='monthly_rate_check',
            name='Monthly Rate Change Check',
            replace_existing=True
        )
        
        # Compliance deadline reminder - check every Monday at 9 AM
        self.scheduler.add_job(
            lambda: self.get_upcoming_deadlines(days_ahead=14),
            CronTrigger(day_of_week='mon', hour=9, minute=0),
            id='weekly_deadline_check',
            name='Weekly Compliance Deadline Check',
            replace_existing=True
        )
        
        # Hourly health check
        self.scheduler.add_job(
            self._health_check,
            IntervalTrigger(hours=1),
            id='hourly_health_check',
            name='Hourly Health Check',
            replace_existing=True
        )
        
        self.scheduler.start()
        logger.info("Saurellius Tax Update Scheduler started")
        
        # Run initial check
        self.check_and_apply_updates()
    
    def stop(self):
        """Stop the scheduler"""
        self.scheduler.shutdown()
        logger.info("Saurellius Tax Update Scheduler stopped")
    
    def _health_check(self) -> Dict:
        """Perform health check on scheduler"""
        return {
            'status': 'healthy',
            'scheduler_running': self.scheduler.running,
            'last_update_check': self.last_update_check.isoformat() if self.last_update_check else None,
            'jobs_scheduled': len(self.scheduler.get_jobs()),
            'updates_applied_count': len(self.applied_updates)
        }
    
    def get_status(self) -> Dict:
        """Get current scheduler status"""
        today = date.today()
        current_year = today.year
        
        return {
            'scheduler_running': self.scheduler.running if hasattr(self.scheduler, 'running') else False,
            'last_update_check': self.last_update_check.isoformat() if self.last_update_check else None,
            'current_tax_year': current_year,
            'current_federal_rates': {
                'social_security_wage_base': self.get_effective_federal_rates()['social_security_wage_base'],
                'medicare_rate': self.get_effective_federal_rates()['medicare_rate'],
            },
            'pending_updates': len(self.get_pending_rate_changes()),
            'upcoming_deadlines': len(self.get_upcoming_deadlines(30)),
            'jobs': [
                {'id': job.id, 'name': job.name, 'next_run': str(job.next_run_time)}
                for job in self.scheduler.get_jobs()
            ] if self.scheduler.running else []
        }


# Global scheduler instance
tax_scheduler = TaxUpdateScheduler()


def get_scheduler() -> TaxUpdateScheduler:
    """Get the global scheduler instance"""
    return tax_scheduler


def init_scheduler(app=None):
    """Initialize and start the scheduler"""
    global tax_scheduler
    
    if not tax_scheduler.scheduler.running:
        tax_scheduler.start()
        logger.info("Tax Update Scheduler initialized and running")
    
    return tax_scheduler
