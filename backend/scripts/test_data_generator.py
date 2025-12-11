"""
🏭 SAURELLIUS TEST DATA GENERATOR - 100 Employees
Generates diverse test employees per production testing plan
"""

import random
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal

# States and tax info
STATES_TAX = ['CA', 'NY', 'NJ', 'PA', 'IL', 'MA', 'OH', 'GA', 'NC', 'VA']
STATES_NO_TAX = ['TX', 'FL', 'WA', 'NV', 'WY']
DEPARTMENTS = ['Engineering', 'Sales', 'Operations', 'HR', 'Finance']

FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 
               'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
               'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy']

LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
              'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor']

class TestDataGenerator:
    def __init__(self):
        self.employees = []
        self.contractors = []
        self.used_ids = set()
    
    def gen_id(self, prefix='EMP'):
        while True:
            eid = f"{prefix}{random.randint(1000, 9999)}"
            if eid not in self.used_ids:
                self.used_ids.add(eid)
                return eid
    
    def gen_ssn(self):
        return f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(1000,9999)}"
    
    def gen_bank(self):
        return {
            'routing': '121000248',
            'account': str(random.randint(1000000000, 9999999999)),
            'type': random.choice(['checking', 'savings'])
        }
    
    def create_employee(self, emp_type, pay_type, index):
        """Create single employee with full data"""
        state = random.choice(STATES_TAX if random.random() < 0.7 else STATES_NO_TAX)
        dept = random.choice(DEPARTMENTS)
        
        # Filing status distribution
        filing = random.choices(
            ['single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household'],
            weights=[35, 40, 15, 10]
        )[0]
        
        dependents = random.choices([0, 1, 2, 3, 4], weights=[30, 25, 20, 15, 10])[0]
        
        # Pay rate based on type
        if pay_type == 'salary':
            pay_rate = random.randint(50000, 180000)
            pay_freq = random.choice(['biweekly', 'semi_monthly'])
        elif pay_type == 'hourly':
            pay_rate = round(random.uniform(15, 75), 2)
            pay_freq = 'biweekly'
        else:  # commission/mixed
            pay_rate = random.randint(40000, 90000)
            pay_freq = 'semi_monthly'
        
        # Hire date
        if random.random() < 0.1:
            hire = date.today() - timedelta(days=random.randint(1, 30))
        else:
            hire = date.today() - timedelta(days=random.randint(60, 1500))
        
        emp = {
            'id': self.gen_id(),
            'first_name': random.choice(FIRST_NAMES),
            'last_name': random.choice(LAST_NAMES),
            'ssn': self.gen_ssn(),
            'dob': date(random.randint(1965, 1998), random.randint(1,12), random.randint(1,28)),
            'hire_date': hire,
            'department': dept,
            'position': f"{dept} Associate",
            'employment_type': emp_type,
            'work_state': state,
            'home_state': state,
            'pay_type': pay_type,
            'pay_rate': pay_rate,
            'pay_frequency': pay_freq,
            'filing_status': filing,
            'dependents': dependents,
            'additional_withholding': 50 if index < 3 else 0,
            'exempt': index < 5,
            'local_tax_code': 'NYC' if state == 'NY' and random.random() < 0.3 else None,
            
            # Benefits (50% health, 40% 401k)
            'health_insurance': random.randint(150, 400) if random.random() < 0.5 else 0,
            '401k_percent': random.choice([0, 3, 5, 6, 10]) if random.random() < 0.4 else 0,
            'hsa': random.randint(50, 200) if random.random() < 0.15 else 0,
            
            # Direct deposit
            'payment_method': 'direct_deposit' if index < 95 else 'paper_check',
            'bank_accounts': [self.gen_bank()] if index < 95 else [],
            
            # YTD (simplified)
            'ytd_gross': 0 if (date.today() - hire).days < 30 else random.randint(20000, 150000),
            
            'garnishments': [],
            'created_at': datetime.now().isoformat()
        }
        
        # Add garnishments for specific employees
        if index < 5:  # Child support
            emp['garnishments'].append({
                'type': 'child_support',
                'amount': random.choice([15, 25, 50]),
                'amount_type': 'percent_disposable',
                'priority': 1
            })
        elif index < 8:  # IRS levy
            emp['garnishments'].append({
                'type': 'irs_levy',
                'amount_type': 'irs_table',
                'priority': 2
            })
        elif index < 10:  # Student loan
            emp['garnishments'].append({
                'type': 'student_loan',
                'amount': 15,
                'amount_type': 'percent_disposable',
                'priority': 3
            })
        
        return emp
    
    def generate_all(self):
        """Generate 100 employees per distribution"""
        print("Generating 100 test employees...")
        
        idx = 0
        
        # 70 Full-time (40 salary, 25 hourly, 5 commission)
        for i in range(40):
            self.employees.append(self.create_employee('full_time', 'salary', idx))
            idx += 1
        for i in range(25):
            self.employees.append(self.create_employee('full_time', 'hourly', idx))
            idx += 1
        for i in range(5):
            self.employees.append(self.create_employee('full_time', 'commission', idx))
            idx += 1
        
        # 15 Part-time hourly
        for i in range(15):
            self.employees.append(self.create_employee('part_time', 'hourly', idx))
            idx += 1
        
        # 5 Seasonal
        for i in range(5):
            self.employees.append(self.create_employee('seasonal', 'hourly', idx))
            idx += 1
        
        # 10 Contractors
        for i in range(10):
            con = {
                'id': self.gen_id('CON'),
                'business_name': f"{random.choice(LAST_NAMES)} Consulting LLC",
                'ein': f"{random.randint(10,99)}-{random.randint(1000000,9999999)}",
                'contact_name': f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                'rate': random.randint(50, 200),
                'rate_type': 'hourly',
                'state': random.choice(STATES_TAX + STATES_NO_TAX),
                'bank_account': self.gen_bank(),
                'ytd_payments': random.randint(10000, 80000)
            }
            self.contractors.append(con)
        
        print(f"✅ Generated {len(self.employees)} employees + {len(self.contractors)} contractors")
        return {'employees': self.employees, 'contractors': self.contractors}


if __name__ == "__main__":
    gen = TestDataGenerator()
    data = gen.generate_all()
    print(f"\nEmployee distribution:")
    print(f"  Full-time: {len([e for e in data['employees'] if e['employment_type'] == 'full_time'])}")
    print(f"  Part-time: {len([e for e in data['employees'] if e['employment_type'] == 'part_time'])}")
    print(f"  Seasonal: {len([e for e in data['employees'] if e['employment_type'] == 'seasonal'])}")
    print(f"  Contractors: {len(data['contractors'])}")
