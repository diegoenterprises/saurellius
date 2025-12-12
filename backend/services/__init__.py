"""
SAURELLIUS SERVICES
Complete payroll platform services - Core and Enterprise features
"""

# Core Services
from .weather_service import WeatherService, weather_service
from .email_service import EmailService, email_service
from .gemini_service import SaurelliusAI, saurellius_ai, gemini_ai
from .state_payroll_rules import StatePayrollRules, state_payroll_rules
from .paystub_generator import PaystubGenerator, paystub_generator, COLOR_THEMES, number_to_words
from .messaging_service import SaurelliusCommunicationsHub, communications_hub, RECOGNITION_BADGES
from .swipe_service import SaurelliusSwipe, swipe_service
from .workforce_service import SaurelliusWorkforce, workforce_service
from .benefits_service import SaurelliusBenefits, benefits_service

# Enterprise Services
from .accounting_service import SaurelliusAccounting, accounting_service
from .contractor_service import SaurelliusContractors, contractor_service
from .ach_service import SaurelliusACH, ach_service
from .tax_filing_service import SaurelliusTaxFiling, tax_filing_service
from .pto_service import SaurelliusPTO, pto_service
from .garnishment_service import SaurelliusGarnishments, garnishment_service
from .payroll_run_service import SaurelliusPayrollRun, payroll_run_service
from .reporting_service import SaurelliusReporting, reporting_service
from .onboarding_service import SaurelliusOnboarding, onboarding_service
from .tax_engine_service import SaurelliusTaxEngine, tax_engine
from .compliance_service import DocuGinuityCompliance, compliance_service
from .scheduler_service import TaxUpdateScheduler, tax_scheduler, get_scheduler, init_scheduler

# Production Activation Services
from .production_tax_engine import ProductionTaxEngine
from .payroll_processing_service import PayrollProcessingService
from .ach_generation_service import ACHGenerationService
from .government_forms_service import GovernmentFormsService
from .security_service import SecurityService
from .employer_registration_service import EmployerRegistrationService
from .employee_onboarding_service import EmployeeOnboardingService
from .contractor_onboarding_service import ContractorOnboardingService

# Self-Service Modules
from .employee_self_service import EmployeeSelfServiceManager, employee_self_service
from .contractor_self_service import ContractorSelfServiceManager, contractor_self_service

# Document Storage
from .document_storage_service import DocumentStorageService, document_storage

# Regulatory Filing
from .regulatory_filing_service import RegulatoryFilingService, regulatory_filing_service

__all__ = [
    # Core
    'WeatherService',
    'weather_service',
    'EmailService',
    'email_service',
    'SaurelliusAI',
    'saurellius_ai',
    'gemini_ai',
    'StatePayrollRules',
    'state_payroll_rules',
    'PaystubGenerator',
    'paystub_generator',
    'COLOR_THEMES',
    'number_to_words',
    'SaurelliusCommunicationsHub',
    'communications_hub',
    'RECOGNITION_BADGES',
    'SaurelliusSwipe',
    'swipe_service',
    'SaurelliusWorkforce',
    'workforce_service',
    'SaurelliusBenefits',
    'benefits_service',
    # Enterprise
    'SaurelliusAccounting',
    'accounting_service',
    'SaurelliusContractors',
    'contractor_service',
    'SaurelliusACH',
    'ach_service',
    'SaurelliusTaxFiling',
    'tax_filing_service',
    'SaurelliusPTO',
    'pto_service',
    'SaurelliusGarnishments',
    'garnishment_service',
    'SaurelliusPayrollRun',
    'payroll_run_service',
    'SaurelliusReporting',
    'reporting_service',
    'SaurelliusOnboarding',
    'onboarding_service',
    # Tax Engine API
    'SaurelliusTaxEngine',
    'tax_engine',
    # DocuGinuity Compliance
    'DocuGinuityCompliance',
    'compliance_service',
    # Tax Update Scheduler
    'TaxUpdateScheduler',
    'tax_scheduler',
    'get_scheduler',
    'init_scheduler',
    # Production Activation
    'ProductionTaxEngine',
    'PayrollProcessingService',
    'ACHGenerationService',
    'GovernmentFormsService',
    'SecurityService',
    'EmployerRegistrationService',
    'EmployeeOnboardingService',
    'ContractorOnboardingService',
    # Self-Service Modules
    'EmployeeSelfServiceManager',
    'employee_self_service',
    'ContractorSelfServiceManager',
    'contractor_self_service',
    # Document Storage
    'DocumentStorageService',
    'document_storage',
    # Regulatory Filing
    'RegulatoryFilingService',
    'regulatory_filing_service',
]
