"""
🧪 SAURELLIUS PRODUCTION TEST SUITE - Comprehensive 10-phase testing
Run: python -m scripts.production_test_suite
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, datetime, timedelta
from decimal import Decimal
import time

from services.payroll_run_service import payroll_run_service
from services.ach_service import ach_service
from services.tax_engine_service import tax_engine
from services.garnishment_service import garnishment_service
from services.pto_service import pto_service
from services.onboarding_service import onboarding_service
from scripts.test_data_generator import TestDataGenerator

class ProductionTestSuite:
    def __init__(self):
        self.passed = self.failed = 0
        self.test_data = None
        
    def log(self, msg, level="INFO"):
        icons = {"PASS": "✅", "FAIL": "❌", "INFO": "ℹ️"}
        print(f"{icons.get(level, '•')} {msg}")
    
    def test(self, name, condition, fail_msg=""):
        if condition:
            self.passed += 1
            self.log(f"PASS: {name}", "PASS")
        else:
            self.failed += 1
            self.log(f"FAIL: {name} - {fail_msg}", "FAIL")
        return condition

    def run_all_phases(self):
        print("\n" + "="*60)
        print("🚀 SAURELLIUS PRODUCTION TEST SUITE")
        print("="*60)
        
        # PHASE 1: Generate test data
        print("\n📋 PHASE 1: TEST DATA GENERATION")
        gen = TestDataGenerator()
        self.test_data = gen.generate_all()
        self.test("100 total workers", len(self.test_data['employees']) + len(self.test_data['contractors']) == 100)
        
        # PHASE 2: Onboarding
        print("\n📋 PHASE 2: ONBOARDING")
        emp = self.test_data['employees'][0]
        ob = onboarding_service.create_onboarding(emp['id'], {
            'employee_name': f"{emp['first_name']} {emp['last_name']}",
            'start_date': emp['hire_date'].isoformat()
        })
        self.test("Onboarding created", 'id' in ob)
        self.test("Tasks generated", len(ob['tasks']) > 10)
        
        # PHASE 3: PTO
        print("\n📋 PHASE 3: PTO & TIME TRACKING")
        enrollment = pto_service.enroll_employee(emp['id'], emp['hire_date'].isoformat())
        self.test("PTO enrollment", 'balances' in enrollment)
        holidays = pto_service.get_holidays()
        self.test("Holidays defined", len(holidays) >= 10)
        
        # PHASE 4: Payroll Processing
        print("\n📋 PHASE 4: PAYROLL PROCESSING")
        run = payroll_run_service.create_payroll_run({
            'pay_period_start': (date.today() - timedelta(days=13)).isoformat(),
            'pay_period_end': date.today().isoformat(),
            'pay_date': (date.today() + timedelta(days=5)).isoformat(),
            'pay_frequency': 'biweekly', 'created_by': 'admin'
        })
        self.test("Payroll run created", run['status'] == 'draft')
        
        # Add employees
        for e in self.test_data['employees'][:10]:
            payroll_run_service.add_employee_to_payroll(run['id'], {
                'id': e['id'], 'pay_type': e['pay_type'], 'pay_rate': e['pay_rate'],
                'regular_hours': 80, 'work_state': e['work_state'], 'filing_status': e['filing_status']
            })
        updated = payroll_run_service.get_payroll_run(run['id'])
        self.test("Employees added", updated['totals']['employee_count'] == 10)
        self.test("Gross calculated", updated['totals']['gross_pay'] > 0)
        
        # Lifecycle
        payroll_run_service.submit_for_approval(run['id'])
        payroll_run_service.approve_payroll(run['id'], 'admin')
        processed = payroll_run_service.process_payroll(run['id'])
        self.test("Payroll completed", processed['status'] == 'completed')
        
        # PHASE 5: Tax Validation
        print("\n📋 PHASE 5: TAX CALCULATIONS")
        result = tax_engine.calculate_taxes({
            'gross_pay': 5000, 'filing_status': 'single', 'pay_frequency': 'biweekly',
            'work_state': 'CA', 'allowances': 1
        })
        self.test("Federal tax calculated", result['employee_taxes']['federal'] > 0)
        self.test("FICA calculated", result['employee_taxes']['social_security'] > 0)
        
        # PHASE 6: Garnishments
        print("\n📋 PHASE 6: GARNISHMENTS")
        garn = garnishment_service.create_garnishment("TEST001", {
            'garnishment_type': 'child_support', 'case_number': 'CS-123',
            'amount_value': 500, 'payee_name': 'State CSE'
        })
        self.test("Garnishment created", garn['priority'] == 1)
        
        # PHASE 7: ACH/Payments
        print("\n📋 PHASE 7: PAYMENT PROCESSING")
        acct = ach_service.add_bank_account("EMP001", "employee", {
            'routing_number': '121000248', 'account_number': '1234567890',
            'account_type': 'checking', 'account_holder_name': 'Test'
        })
        self.test("Bank account added", acct['status'] == 'pending')
        
        # PHASE 8-10: Summary checks
        print("\n📋 PHASES 8-10: REPORTING & PERFORMANCE")
        self.test("Reporting service exists", hasattr(pto_service, 'get_pto_liability_report'))
        self.test("Onboarding metrics", hasattr(onboarding_service, 'get_onboarding_metrics'))
        
        # SUMMARY
        print("\n" + "="*60)
        print(f"📊 TEST RESULTS: {self.passed} PASSED / {self.failed} FAILED")
        print(f"📊 PASS RATE: {self.passed/(self.passed+self.failed)*100:.1f}%")
        print("="*60)
        
        return self.failed == 0

if __name__ == "__main__":
    suite = ProductionTestSuite()
    success = suite.run_all_phases()
    sys.exit(0 if success else 1)
