# CONTRACTOR SELF-SERVICE MODULE

## Overview

Complete self-service contractor registration and portal system that allows independent contractors (1099 workers) to sign up independently, complete all IRS-required documentation, manage invoicing and payments, track expenses and mileage, and access their earnings records **without any client or HR intervention**.

---

## Implementation Status

### ✅ Backend Implementation

| Component | File | Status |
|-----------|------|--------|
| Self-Service Module | `backend/services/contractor_self_service.py` | Complete (1200+ lines) |
| API Routes | `backend/routes/contractor_self_service_routes.py` | Complete (700+ lines) |

### ✅ Frontend Implementation

| Component | File | Status |
|-----------|------|--------|
| API Service | `frontend/src/services/contractorSelfService.ts` | Complete (350+ lines) |
| Portal Dashboard | `frontend/src/screens/contractor/ContractorPortalDashboard.tsx` | Complete (450+ lines) |

---

## Dual Registration Paths

### Path 1: Self-Service Sign-Up
Contractor independently registers and finds their client.

```
POST /api/contractor/register
{
  "email": "contractor@business.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "phone": "5551234567",
  "business_classification": "single_member_llc",
  "business_name": "Smith Consulting LLC",
  "accept_terms": true,
  "accept_privacy": true,
  "accept_electronic_communications": true,
  "accept_contractor_acknowledgment": true
}
```

**Flow:**
1. Contractor registers → Account created with "pending_verification" status
2. Email verification code sent → Contractor verifies
3. SMS verification code sent → Contractor verifies
4. Status changes to "pending_client"
5. Contractor searches for client or requests to join
6. Client approves → Onboarding continues

### Path 2: Client-Invited
Contractor receives invitation from client company.

```
GET /api/contractor/invitation/{token}
POST /api/contractor/invitation/accept
```

**Flow:**
1. Client sends invitation with email, name, start date, project description
2. Contractor clicks link (14-day expiry)
3. Contractor creates account or connects existing
4. Automatically linked to client
5. Onboarding begins immediately

---

## Business Classifications

| Value | Label |
|-------|-------|
| `individual` | Individual/Sole Proprietor |
| `single_member_llc` | Single-Member LLC |
| `multi_member_llc` | Multi-Member LLC |
| `partnership` | Partnership |
| `s_corporation` | S Corporation |
| `c_corporation` | C Corporation |
| `non_profit` | Non-Profit Organization |
| `trust_estate` | Trust/Estate |

---

## 9-Section Onboarding Workflow

| # | Section | Required | Description |
|---|---------|----------|-------------|
| 1 | Business & Personal Information | ✅ | Legal name, EIN/SSN, address, industry |
| 2 | Tax Information (W-9) | ✅ | Complete IRS W-9 with digital signature |
| 3 | Payment Information | ✅ | ACH, check, wire, or digital wallet |
| 4 | Contract & Engagement Details | ❌ | Client relationships, payment terms |
| 5 | Business Documentation | ❌ | Formation docs, licenses, insurance |
| 6 | Invoicing & Billing Setup | ✅ | Invoice templates, payment terms |
| 7 | Tax Compliance Setup | ❌ | Estimated taxes, retirement accounts |
| 8 | Additional Business Info | ❌ | Credentials, certifications |
| 9 | Document Vault Setup | ❌ | Document organization |

---

## W-9 Form Handling

### Guided W-9 Wizard

**Part I - Name and Business Information:**
- Line 1: Legal name (individual or business)
- Line 2: Business name/DBA (if different)
- Line 3: Tax classification
- Line 4: Exemptions (if applicable)

**Part II - Taxpayer Identification Number:**
- SSN (for individuals): XXX-XX-XXXX
- EIN (for businesses): XX-XXXXXXX
- Encrypted immediately with AES-256
- Masked for display (***-**-1234)

**Part III - Certification:**
- Certify TIN is correct
- Certify not subject to backup withholding
- Certify U.S. person status
- Digital signature with timestamp and IP

### Tax Classifications

| Value | Label |
|-------|-------|
| `individual` | Individual/sole proprietor or single-member LLC |
| `c_corp` | C Corporation |
| `s_corp` | S Corporation |
| `partnership` | Partnership |
| `trust_estate` | Trust/estate |
| `llc_c` | LLC taxed as C Corporation |
| `llc_s` | LLC taxed as S Corporation |
| `llc_p` | LLC taxed as Partnership |

---

## Payment Methods

### Direct Deposit (ACH) - Recommended
```json
{
  "payment_method": "direct_deposit",
  "bank_name": "Chase Bank",
  "routing_number": "021000021",
  "account_number": "123456789",
  "account_number_confirm": "123456789",
  "account_type": "checking",
  "account_holder_name": "Smith Consulting LLC"
}
```
- Routing number validation with ABA checksum
- Account number encrypted with AES-256
- Prenote verification support

### Paper Check
```json
{
  "payment_method": "check",
  "street_address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001"
}
```

### Wire Transfer
```json
{
  "payment_method": "wire",
  "bank_name": "International Bank",
  "swift_code": "CHASUS33",
  "account_number": "123456789"
}
```

### Digital Wallet
```json
{
  "payment_method": "wallet",
  "wallet_pin": "123456"
}
```

---

## Invoicing System

### Create Invoice
```
POST /api/contractor/invoices
{
  "client_id": "client-uuid",
  "line_items": [
    {
      "description": "Web Development Services",
      "quantity": 40,
      "rate": 150
    }
  ],
  "tax_rate": 0,
  "payment_terms": "net_30",
  "notes": "Thank you for your business!"
}
```

### Invoice Features
- Auto-generated invoice numbers (INV-0001)
- Line item calculations
- Tax rate support
- Payment terms (net_15, net_30, net_60)
- Status tracking (draft, sent, viewed, paid, overdue, partial)
- Partial payment support
- PDF generation

---

## Expense Tracking

### Log Expense
```
POST /api/contractor/expenses
{
  "category": "software",
  "description": "Adobe Creative Cloud subscription",
  "vendor": "Adobe",
  "amount": 54.99,
  "date": "2024-12-01",
  "tax_deductible": true
}
```

### Expense Categories
- Home Office
- Vehicle/Transportation
- Equipment & Supplies
- Software & Subscriptions
- Professional Services
- Business Insurance
- Education & Training
- Travel
- Meals (50% deductible)
- Marketing & Advertising
- Subcontractor Payments
- Phone & Internet
- Other

---

## Mileage Tracking

### Log Mileage
```
POST /api/contractor/mileage
{
  "date": "2024-12-01",
  "miles": 45.5,
  "purpose": "Client meeting",
  "from_location": "Home Office",
  "to_location": "Client HQ",
  "is_round_trip": true
}
```

### IRS Standard Mileage Rate
- **2024 Rate:** $0.67 per mile
- Auto-calculated deduction amount
- Annual mileage summary for tax purposes
- GPS location support (mobile)

---

## 1099-NEC Generation

### Eligibility Check
```
GET /api/contractor/1099/eligibility?year=2024
```

**Response:**
```json
{
  "contractor_id": "uuid",
  "year": 2024,
  "total_paid": 15000.00,
  "threshold": 600.00,
  "eligible_for_1099": true,
  "payment_count": 12
}
```

### Key Rules
- 1099-NEC required if total payments ≥ $600 in calendar year
- W-9 must be on file to generate 1099
- Form includes Box 1 (Nonemployee Compensation)
- Filing deadline: January 31

---

## Tax Calculations

### Estimated Quarterly Taxes
```
GET /api/contractor/tax/estimated?year=2024
```

**Response:**
```json
{
  "year": 2024,
  "gross_income": 75000.00,
  "total_expenses": 12000.00,
  "mileage_deduction": 2500.00,
  "net_income": 60500.00,
  "self_employment_tax": 9256.50,
  "self_employment_rate": 15.3,
  "estimated_federal_tax": 13310.00,
  "total_estimated_tax": 22566.50,
  "quarterly_payment": 5641.63,
  "quarterly_deadlines": [
    "2024-04-15",
    "2024-06-15",
    "2024-09-15",
    "2025-01-15"
  ]
}
```

### Tax Rates
- **Self-Employment Tax:** 15.3% (12.4% Social Security + 2.9% Medicare)
- **Backup Withholding:** 24% (if no valid TIN)
- **1099 Threshold:** $600

---

## API Endpoints (50+)

### Registration & Verification
```
POST   /api/contractor/register
POST   /api/contractor/verify/email
POST   /api/contractor/verify/phone
GET    /api/contractor/invitation/:token
POST   /api/contractor/invitation/accept
POST   /api/contractor/invitation
GET    /api/contractor/clients/search
POST   /api/contractor/clients/join
```

### W-9 & Payment
```
POST   /api/contractor/w9
GET    /api/contractor/w9
GET    /api/contractor/w9/tax-classifications
POST   /api/contractor/payment-method
GET    /api/contractor/payment-method
```

### Onboarding
```
GET    /api/contractor/onboarding/status
GET    /api/contractor/onboarding/sections
```

### Invoicing
```
POST   /api/contractor/invoices
GET    /api/contractor/invoices
GET    /api/contractor/invoices/:id
POST   /api/contractor/invoices/:id/send
POST   /api/contractor/invoices/:id/payment
```

### Expenses & Mileage
```
POST   /api/contractor/expenses
GET    /api/contractor/expenses
GET    /api/contractor/expenses/categories
POST   /api/contractor/mileage
GET    /api/contractor/mileage
GET    /api/contractor/mileage/rate
```

### Tax & 1099
```
GET    /api/contractor/1099/eligibility
GET    /api/contractor/1099
POST   /api/contractor/1099/generate
GET    /api/contractor/tax/estimated
GET    /api/contractor/tax/deadlines
GET    /api/contractor/tax/rates
```

### Portal & Profile
```
GET    /api/contractor/portal/dashboard
GET    /api/contractor/profile
PUT    /api/contractor/profile
```

### Validation
```
POST   /api/contractor/validate/password
POST   /api/contractor/validate/ein
POST   /api/contractor/validate/ssn
POST   /api/contractor/validate/routing
```

---

## Security Features

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Data Encryption
- SSN: AES-256 encrypted, last 4 stored for display
- EIN: AES-256 encrypted, last 4 stored for display
- Bank accounts: AES-256 encrypted, last 4 stored
- All API calls over HTTPS/TLS 1.3

### Validation
- EIN format validation (XX-XXXXXXX)
- SSN format validation (XXX-XX-XXXX)
- Routing number ABA checksum validation
- Email verification (6-digit code, 24-hour expiry)
- SMS verification (6-digit code, 10-minute expiry)
- Digital signatures with timestamp and IP logging

---

## IRS Compliance

| Requirement | Implementation |
|-------------|----------------|
| W-9 Collection | Guided wizard with validation, encrypted storage |
| 1099-NEC Generation | Auto-generate when payments ≥ $600 |
| 1099 Filing Deadline | January 31 deadline tracking |
| Backup Withholding | 24% rate if no valid TIN |
| Self-Employment Tax | 15.3% calculation |
| Quarterly Estimated Taxes | Calculator with deadlines |
| Document Retention | 4+ years for tax documents |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Onboarding Time | < 40 minutes |
| W-9 Completion Rate | > 95% |
| Invoice Creation Time | < 5 minutes |
| 1099 Accuracy | 100% |
| Payment Success Rate | > 98% |
| Error Rate | < 1% |

---

## Frontend Screens

### ContractorPortalDashboard.tsx
- Green gradient header (contractor branding)
- YTD earnings prominent display
- Onboarding alert (if incomplete)
- 4 quick stat cards
- 6 quick action buttons
- Recent invoices list with status badges
- Recent payments list
- Quarterly tax reminder card
- Pull-to-refresh

---

## Files Created

```
backend/
├── services/
│   └── contractor_self_service.py        # 1200+ lines
└── routes/
    └── contractor_self_service_routes.py # 700+ lines

frontend/src/
├── services/
│   └── contractorSelfService.ts          # 350+ lines
└── screens/contractor/
    └── ContractorPortalDashboard.tsx     # 450+ lines

docs/
└── CONTRACTOR_SELF_SERVICE.md            # This file
```

**Total: ~2,700+ lines of code**

---

## Integration with Existing Platform

### Uses Existing Services
- `security_service.py` for encryption and audit logging
- `government_forms_service.py` for 1099-NEC generation
- Theme system from `frontend/src/theme`

### Parallels Employee Self-Service
- Same password validation rules
- Same encryption approach
- Same verification code system
- Consistent API patterns

---

## Quarterly Tax Deadlines

| Quarter | Period | Due Date |
|---------|--------|----------|
| Q1 | Jan 1 - Mar 31 | April 15 |
| Q2 | Apr 1 - May 31 | June 15 |
| Q3 | Jun 1 - Aug 31 | September 15 |
| Q4 | Sep 1 - Dec 31 | January 15 (next year) |

---

*This module delivers complete contractor self-service functionality: contractors can register, submit W-9, set up payments, create invoices, track expenses/mileage, and manage taxes without any manual intervention from clients.*
