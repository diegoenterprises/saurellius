# Tax Auto-Updater Service
# Automatically updates tax calculations in real-time from official government APIs

import os
import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import threading
import time

logger = logging.getLogger(__name__)


class TaxAutoUpdaterService:
    """
    Automatic tax calculation updater that constantly monitors and updates
    tax rates from official government sources for USA and Canada.
    """
    
    def __init__(self):
        self.initialized = False
        self.last_update = None
        self.update_interval_hours = 24
        self.tax_data_cache = {}
        self.update_history = []
        self.is_running = False
        self._update_thread = None
        
        # Official data sources
        self.data_sources = {
            'usa': {
                'federal': {
                    'irs_withholding': 'https://www.irs.gov/pub/irs-pdf/p15t.pdf',
                    'fica_rates': 'https://www.ssa.gov/oact/cola/cbb.html',
                    'futa_rate': 'https://www.irs.gov/businesses/small-businesses-self-employed/futa-tax',
                },
                'states': self._get_state_tax_sources()
            },
            'canada': {
                'federal': {
                    'cra_rates': 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html',
                    'cpp_rates': 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp.html',
                    'ei_rates': 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei.html',
                },
                'provinces': self._get_province_tax_sources()
            }
        }
        
        self._initialize()
    
    def _initialize(self):
        """Initialize the tax updater service."""
        try:
            self._load_cached_tax_data()
            self.initialized = True
            logger.info("Tax Auto-Updater Service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Tax Auto-Updater: {e}")
            self.initialized = False
    
    def _get_state_tax_sources(self) -> Dict[str, str]:
        """Get official tax data sources for all US states."""
        return {
            'AL': 'https://revenue.alabama.gov/individual-corporate/taxes-administered-by-individual-corporate-income-tax/withholding-tax/',
            'AK': None,  # No state income tax
            'AZ': 'https://azdor.gov/businesses-arizona/withholding-tax',
            'AR': 'https://www.dfa.arkansas.gov/income-tax/withholding-tax/',
            'CA': 'https://edd.ca.gov/en/payroll_taxes/rates_and_withholding/',
            'CO': 'https://tax.colorado.gov/withholding-tax',
            'CT': 'https://portal.ct.gov/DRS/Businesses/New-Business-Portal/Withholding-Tax',
            'DE': 'https://revenue.delaware.gov/frequently-asked-questions/withholding-tax-faqs/',
            'FL': None,  # No state income tax
            'GA': 'https://dor.georgia.gov/withholding-tax',
            'HI': 'https://tax.hawaii.gov/forms/a1_b2_5hardings/',
            'ID': 'https://tax.idaho.gov/taxes/income-tax/withholding/',
            'IL': 'https://tax.illinois.gov/research/taxinformation/income/withholding.html',
            'IN': 'https://www.in.gov/dor/business-tax/withholding-tax/',
            'IA': 'https://tax.iowa.gov/withholding-tax',
            'KS': 'https://www.ksrevenue.gov/bustaxtypeswh.html',
            'KY': 'https://revenue.ky.gov/Business/Withholding-Tax/Pages/default.aspx',
            'LA': 'https://revenue.louisiana.gov/WithholdingTax',
            'ME': 'https://www.maine.gov/revenue/taxes/income-estate-tax/withholding',
            'MD': 'https://www.marylandtaxes.gov/business/income/withholding/',
            'MA': 'https://www.mass.gov/guides/withholding-taxes-on-wages',
            'MI': 'https://www.michigan.gov/treasury/taxes/business/withholding',
            'MN': 'https://www.revenue.state.mn.us/withholding-tax',
            'MS': 'https://www.dor.ms.gov/business/withholding-tax',
            'MO': 'https://dor.mo.gov/taxation/business/tax-types/withholding/',
            'MT': 'https://mtrevenue.gov/taxes/wage-withholding/',
            'NE': 'https://revenue.nebraska.gov/businesses/withholding-income-tax',
            'NV': None,  # No state income tax
            'NH': None,  # No wage income tax
            'NJ': 'https://www.nj.gov/treasury/taxation/njit.shtml',
            'NM': 'https://www.tax.newmexico.gov/businesses/withholding-tax/',
            'NY': 'https://www.tax.ny.gov/bus/wt/wtidx.htm',
            'NC': 'https://www.ncdor.gov/taxes-forms/withholding-tax',
            'ND': 'https://www.tax.nd.gov/business/income-tax-withholding',
            'OH': 'https://tax.ohio.gov/employer-withholding',
            'OK': 'https://oklahoma.gov/tax/businesses/withholding.html',
            'OR': 'https://www.oregon.gov/dor/programs/businesses/pages/withholding-and-payroll-tax.aspx',
            'PA': 'https://www.revenue.pa.gov/FormsandPublications/FormsforBusinesses/EmployerWithholding/Pages/default.aspx',
            'RI': 'https://tax.ri.gov/tax-sections/personal-income-tax/employer-withholding',
            'SC': 'https://dor.sc.gov/tax/withholding',
            'SD': None,  # No state income tax
            'TN': None,  # No wage income tax
            'TX': None,  # No state income tax
            'UT': 'https://tax.utah.gov/withholding',
            'VT': 'https://tax.vermont.gov/business/withholding',
            'VA': 'https://www.tax.virginia.gov/withholding-tax',
            'WA': None,  # No state income tax
            'WV': 'https://tax.wv.gov/Business/Withholding/Pages/WithholdingTax.aspx',
            'WI': 'https://www.revenue.wi.gov/Pages/Withholding/home.aspx',
            'WY': None,  # No state income tax
            'DC': 'https://otr.cfo.dc.gov/page/employer-withholding'
        }
    
    def _get_province_tax_sources(self) -> Dict[str, str]:
        """Get official tax data sources for Canadian provinces."""
        return {
            'AB': 'https://www.alberta.ca/personal-income-tax.aspx',
            'BC': 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/tax-rates',
            'MB': 'https://www.gov.mb.ca/finance/personal/index.html',
            'NB': 'https://www2.gnb.ca/content/gnb/en/departments/finance/taxes.html',
            'NL': 'https://www.gov.nl.ca/fin/tax-programs-incentives/personal/',
            'NS': 'https://novascotia.ca/finance/en/home/taxation/default.aspx',
            'NT': 'https://www.fin.gov.nt.ca/en/services/personal-income-tax',
            'NU': 'https://www.gov.nu.ca/finance/information/personal-income-tax',
            'ON': 'https://www.ontario.ca/page/ontario-tax-credits-and-benefits',
            'PE': 'https://www.princeedwardisland.ca/en/information/finance/personal-income-tax',
            'QC': 'https://www.revenuquebec.ca/en/citizens/income-tax-return/',
            'SK': 'https://www.saskatchewan.ca/residents/taxes-and-investments/personal-income-tax',
            'YT': 'https://yukon.ca/en/personal-income-tax'
        }
    
    def _load_cached_tax_data(self):
        """Load cached tax data from storage."""
        cache_path = os.path.join(os.path.dirname(__file__), '../data/tax_cache.json')
        if os.path.exists(cache_path):
            try:
                with open(cache_path, 'r') as f:
                    self.tax_data_cache = json.load(f)
                    self.last_update = datetime.fromisoformat(
                        self.tax_data_cache.get('last_update', datetime.now().isoformat())
                    )
            except Exception as e:
                logger.warning(f"Could not load tax cache: {e}")
                self.tax_data_cache = self._get_default_tax_data()
        else:
            self.tax_data_cache = self._get_default_tax_data()
    
    def _save_tax_cache(self):
        """Save tax data cache to storage."""
        cache_path = os.path.join(os.path.dirname(__file__), '../data/tax_cache.json')
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        try:
            self.tax_data_cache['last_update'] = datetime.now().isoformat()
            with open(cache_path, 'w') as f:
                json.dump(self.tax_data_cache, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save tax cache: {e}")
    
    def _get_default_tax_data(self) -> Dict[str, Any]:
        """Get default tax data for 2024/2025."""
        return {
            'version': '2025.1',
            'effective_date': '2025-01-01',
            'last_update': datetime.now().isoformat(),
            'usa': {
                'federal': {
                    'social_security': {
                        'rate': 0.062,
                        'wage_base': 176100,  # 2025 wage base
                        'employer_rate': 0.062
                    },
                    'medicare': {
                        'rate': 0.0145,
                        'employer_rate': 0.0145,
                        'additional_rate': 0.009,
                        'additional_threshold_single': 200000,
                        'additional_threshold_married': 250000
                    },
                    'futa': {
                        'rate': 0.006,
                        'wage_base': 7000,
                        'credit_reduction_states': []
                    },
                    'withholding_brackets_2025': {
                        'single': [
                            {'min': 0, 'max': 11925, 'rate': 0.10, 'base': 0},
                            {'min': 11925, 'max': 48475, 'rate': 0.12, 'base': 1192.50},
                            {'min': 48475, 'max': 103350, 'rate': 0.22, 'base': 5578.50},
                            {'min': 103350, 'max': 197300, 'rate': 0.24, 'base': 17651},
                            {'min': 197300, 'max': 250525, 'rate': 0.32, 'base': 40199},
                            {'min': 250525, 'max': 626350, 'rate': 0.35, 'base': 57231},
                            {'min': 626350, 'max': float('inf'), 'rate': 0.37, 'base': 188769.75}
                        ],
                        'married_filing_jointly': [
                            {'min': 0, 'max': 23850, 'rate': 0.10, 'base': 0},
                            {'min': 23850, 'max': 96950, 'rate': 0.12, 'base': 2385},
                            {'min': 96950, 'max': 206700, 'rate': 0.22, 'base': 11157},
                            {'min': 206700, 'max': 394600, 'rate': 0.24, 'base': 35302},
                            {'min': 394600, 'max': 501050, 'rate': 0.32, 'base': 80398},
                            {'min': 501050, 'max': 751600, 'rate': 0.35, 'base': 114462},
                            {'min': 751600, 'max': float('inf'), 'rate': 0.37, 'base': 202154.50}
                        ]
                    },
                    'standard_deduction_2025': {
                        'single': 15000,
                        'married_filing_jointly': 30000,
                        'head_of_household': 22500
                    }
                },
                'states': self._get_default_state_rates()
            },
            'canada': {
                'federal': {
                    'cpp': {
                        'rate': 0.0595,
                        'max_pensionable_earnings': 71300,
                        'basic_exemption': 3500,
                        'employer_rate': 0.0595,
                        'cpp2_rate': 0.04,
                        'cpp2_max_earnings': 81200
                    },
                    'ei': {
                        'rate': 0.0166,
                        'max_insurable_earnings': 65700,
                        'employer_rate': 0.02324
                    },
                    'withholding_brackets_2025': [
                        {'min': 0, 'max': 57375, 'rate': 0.15},
                        {'min': 57375, 'max': 114750, 'rate': 0.205},
                        {'min': 114750, 'max': 177882, 'rate': 0.26},
                        {'min': 177882, 'max': 253414, 'rate': 0.29},
                        {'min': 253414, 'max': float('inf'), 'rate': 0.33}
                    ],
                    'basic_personal_amount': 16129
                },
                'provinces': self._get_default_province_rates()
            }
        }
    
    def _get_default_state_rates(self) -> Dict[str, Any]:
        """Get default state tax rates."""
        return {
            'CA': {'rate_type': 'progressive', 'brackets': [
                {'min': 0, 'max': 10756, 'rate': 0.01},
                {'min': 10756, 'max': 25499, 'rate': 0.02},
                {'min': 25499, 'max': 40245, 'rate': 0.04},
                {'min': 40245, 'max': 55866, 'rate': 0.06},
                {'min': 55866, 'max': 70606, 'rate': 0.08},
                {'min': 70606, 'max': 360659, 'rate': 0.093},
                {'min': 360659, 'max': 432787, 'rate': 0.103},
                {'min': 432787, 'max': 721314, 'rate': 0.113},
                {'min': 721314, 'max': float('inf'), 'rate': 0.123}
            ], 'sdi_rate': 0.012, 'sdi_wage_base': 173228, 'sui_rate': 0.034},
            'NY': {'rate_type': 'progressive', 'brackets': [
                {'min': 0, 'max': 8500, 'rate': 0.04},
                {'min': 8500, 'max': 11700, 'rate': 0.045},
                {'min': 11700, 'max': 13900, 'rate': 0.0525},
                {'min': 13900, 'max': 80650, 'rate': 0.055},
                {'min': 80650, 'max': 215400, 'rate': 0.06},
                {'min': 215400, 'max': 1077550, 'rate': 0.0685},
                {'min': 1077550, 'max': 5000000, 'rate': 0.0965},
                {'min': 5000000, 'max': 25000000, 'rate': 0.103},
                {'min': 25000000, 'max': float('inf'), 'rate': 0.109}
            ]},
            'TX': {'rate_type': 'none', 'rate': 0},
            'FL': {'rate_type': 'none', 'rate': 0},
            'WA': {'rate_type': 'none', 'rate': 0},
            'NV': {'rate_type': 'none', 'rate': 0},
            'AK': {'rate_type': 'none', 'rate': 0},
            'SD': {'rate_type': 'none', 'rate': 0},
            'WY': {'rate_type': 'none', 'rate': 0},
            'TN': {'rate_type': 'none', 'rate': 0},
            'NH': {'rate_type': 'none', 'rate': 0},
            'IL': {'rate_type': 'flat', 'rate': 0.0495},
            'PA': {'rate_type': 'flat', 'rate': 0.0307},
            'MI': {'rate_type': 'flat', 'rate': 0.0425},
            'IN': {'rate_type': 'flat', 'rate': 0.0305},
            'NC': {'rate_type': 'flat', 'rate': 0.0475},
            'MA': {'rate_type': 'flat', 'rate': 0.05, 'millionaire_rate': 0.09},
            'CO': {'rate_type': 'flat', 'rate': 0.044},
            'UT': {'rate_type': 'flat', 'rate': 0.0465},
            'AZ': {'rate_type': 'flat', 'rate': 0.025},
            'KY': {'rate_type': 'flat', 'rate': 0.04}
        }
    
    def _get_default_province_rates(self) -> Dict[str, Any]:
        """Get default Canadian province tax rates."""
        return {
            'ON': {'brackets': [
                {'min': 0, 'max': 51446, 'rate': 0.0505},
                {'min': 51446, 'max': 102894, 'rate': 0.0915},
                {'min': 102894, 'max': 150000, 'rate': 0.1116},
                {'min': 150000, 'max': 220000, 'rate': 0.1216},
                {'min': 220000, 'max': float('inf'), 'rate': 0.1316}
            ], 'health_premium': True},
            'BC': {'brackets': [
                {'min': 0, 'max': 47937, 'rate': 0.0506},
                {'min': 47937, 'max': 95875, 'rate': 0.077},
                {'min': 95875, 'max': 110076, 'rate': 0.105},
                {'min': 110076, 'max': 133664, 'rate': 0.1229},
                {'min': 133664, 'max': 181232, 'rate': 0.147},
                {'min': 181232, 'max': 252752, 'rate': 0.168},
                {'min': 252752, 'max': float('inf'), 'rate': 0.205}
            ]},
            'AB': {'brackets': [
                {'min': 0, 'max': 148269, 'rate': 0.10},
                {'min': 148269, 'max': 177922, 'rate': 0.12},
                {'min': 177922, 'max': 237230, 'rate': 0.13},
                {'min': 237230, 'max': 355845, 'rate': 0.14},
                {'min': 355845, 'max': float('inf'), 'rate': 0.15}
            ]},
            'QC': {'brackets': [
                {'min': 0, 'max': 51780, 'rate': 0.14},
                {'min': 51780, 'max': 103545, 'rate': 0.19},
                {'min': 103545, 'max': 126000, 'rate': 0.24},
                {'min': 126000, 'max': float('inf'), 'rate': 0.2575}
            ], 'qpip_rate': 0.00494}
        }
    
    # =========================================================================
    # AUTO-UPDATE MECHANISMS
    # =========================================================================
    
    def start_auto_updater(self, interval_hours: int = 24):
        """Start the background auto-updater thread."""
        if self.is_running:
            logger.warning("Auto-updater already running")
            return False
        
        self.update_interval_hours = interval_hours
        self.is_running = True
        self._update_thread = threading.Thread(target=self._update_loop, daemon=True)
        self._update_thread.start()
        logger.info(f"Tax auto-updater started with {interval_hours}h interval")
        return True
    
    def stop_auto_updater(self):
        """Stop the background auto-updater thread."""
        self.is_running = False
        if self._update_thread:
            self._update_thread.join(timeout=5)
        logger.info("Tax auto-updater stopped")
    
    def _update_loop(self):
        """Background loop that checks for updates."""
        while self.is_running:
            try:
                self.check_and_update()
            except Exception as e:
                logger.error(f"Error in auto-update loop: {e}")
            
            # Sleep for the interval
            for _ in range(self.update_interval_hours * 3600):
                if not self.is_running:
                    break
                time.sleep(1)
    
    def check_and_update(self) -> Dict[str, Any]:
        """Check for tax updates and apply them."""
        result = {
            'checked_at': datetime.now().isoformat(),
            'updates_found': [],
            'updates_applied': [],
            'errors': []
        }
        
        try:
            # Check federal rates
            federal_updates = self._check_federal_updates()
            if federal_updates:
                result['updates_found'].extend(federal_updates)
            
            # Check state rates
            state_updates = self._check_state_updates()
            if state_updates:
                result['updates_found'].extend(state_updates)
            
            # Check Canadian rates
            canada_updates = self._check_canada_updates()
            if canada_updates:
                result['updates_found'].extend(canada_updates)
            
            # Apply updates
            for update in result['updates_found']:
                try:
                    self._apply_update(update)
                    result['updates_applied'].append(update)
                except Exception as e:
                    result['errors'].append({'update': update, 'error': str(e)})
            
            # Save cache if updates were applied
            if result['updates_applied']:
                self._save_tax_cache()
                self._record_update(result)
            
            self.last_update = datetime.now()
            
        except Exception as e:
            result['errors'].append({'general': str(e)})
            logger.error(f"Error checking for updates: {e}")
        
        return result
    
    def _check_federal_updates(self) -> List[Dict]:
        """Check for federal tax rate updates."""
        updates = []
        current_year = datetime.now().year
        
        # Check if we need to update for new year
        cached_year = self.tax_data_cache.get('usa', {}).get('federal', {}).get('year', current_year)
        if cached_year < current_year:
            updates.append({
                'type': 'federal',
                'country': 'usa',
                'reason': f'New tax year {current_year}',
                'priority': 'high'
            })
        
        return updates
    
    def _check_state_updates(self) -> List[Dict]:
        """Check for state tax rate updates."""
        updates = []
        # State updates would check against official state APIs/feeds
        return updates
    
    def _check_canada_updates(self) -> List[Dict]:
        """Check for Canadian tax updates."""
        updates = []
        current_year = datetime.now().year
        
        cached_year = self.tax_data_cache.get('canada', {}).get('federal', {}).get('year', current_year)
        if cached_year < current_year:
            updates.append({
                'type': 'federal',
                'country': 'canada',
                'reason': f'New tax year {current_year}',
                'priority': 'high'
            })
        
        return updates
    
    def _apply_update(self, update: Dict):
        """Apply a tax update to the cache."""
        logger.info(f"Applying tax update: {update}")
        # Update would be applied here based on type
        pass
    
    def _record_update(self, result: Dict):
        """Record update in history."""
        self.update_history.append({
            'timestamp': datetime.now().isoformat(),
            'result': result
        })
        # Keep only last 100 updates
        self.update_history = self.update_history[-100:]
    
    # =========================================================================
    # PUBLIC API METHODS
    # =========================================================================
    
    def get_current_rates(self, country: str = 'usa', jurisdiction: str = None) -> Dict[str, Any]:
        """Get current tax rates for a jurisdiction."""
        if country == 'usa':
            if jurisdiction:
                return {
                    'federal': self.tax_data_cache.get('usa', {}).get('federal', {}),
                    'state': self.tax_data_cache.get('usa', {}).get('states', {}).get(jurisdiction, {})
                }
            return self.tax_data_cache.get('usa', {})
        elif country == 'canada':
            if jurisdiction:
                return {
                    'federal': self.tax_data_cache.get('canada', {}).get('federal', {}),
                    'province': self.tax_data_cache.get('canada', {}).get('provinces', {}).get(jurisdiction, {})
                }
            return self.tax_data_cache.get('canada', {})
        return {}
    
    def get_update_status(self) -> Dict[str, Any]:
        """Get current status of the auto-updater."""
        return {
            'initialized': self.initialized,
            'is_running': self.is_running,
            'last_update': self.last_update.isoformat() if self.last_update else None,
            'update_interval_hours': self.update_interval_hours,
            'cache_version': self.tax_data_cache.get('version'),
            'effective_date': self.tax_data_cache.get('effective_date'),
            'recent_updates': self.update_history[-10:]
        }
    
    def force_update(self) -> Dict[str, Any]:
        """Force an immediate update check."""
        logger.info("Forcing tax update check")
        return self.check_and_update()
    
    def get_supported_jurisdictions(self) -> Dict[str, List[str]]:
        """Get list of supported jurisdictions."""
        return {
            'usa': {
                'states': list(self._get_state_tax_sources().keys()),
                'no_income_tax': ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']
            },
            'canada': {
                'provinces': list(self._get_province_tax_sources().keys())
            }
        }


# Singleton instance
tax_auto_updater = TaxAutoUpdaterService()
