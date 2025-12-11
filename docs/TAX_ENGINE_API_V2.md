# Saurellius Tax Engine API V2

## Enterprise-Grade Payroll Tax Calculations

The Saurellius Tax Engine V2 provides accurate, compliant payroll tax calculations for all 50 US states plus 7,400+ local jurisdictions.

---

## Authentication

All API requests require an API key passed via header:

```
X-API-Key: your_api_key_here
```

Or using Bearer token:
```
Authorization: Bearer your_api_key_here
```

---

## Pricing Tiers

| Tier | Price | Daily Limit | Features |
|------|-------|-------------|----------|
| **Starter** | $1,000/year | 1,000 | geocode, calculate |
| **Growth** | $3,000/year | 10,000 | + batch, grossup |
| **Scale** | $8,000/year | 100,000 | + multistate, local |
| **Enterprise** | Custom | Unlimited | All features |

---

## Core Concepts

### Location Codes

Location codes uniquely identify tax jurisdictions using the format:
```
SS-CCC-LLLL
```
- **SS**: State FIPS code (2 digits)
- **CCC**: County code (3 digits)
- **LLLL**: Local code (4 characters)

Examples:
- `00-000-0000` - Federal
- `06-000-0000` - California State
- `36-061-NYC1` - New York City

### Unique Tax IDs

Every tax is identified by a unique ID:
```
SS-CCC-LLLL-TYPE-VVV
```

Tax types:
- **FIT** - Federal Income Tax
- **SIT** - State Income Tax
- **FICA** - Social Security
- **MEDI** - Medicare
- **MEDI2** - Additional Medicare (>$200k)
- **FUTA** - Federal Unemployment
- **SUTA** - State Unemployment
- **SDI** - State Disability Insurance
- **PFML** - Paid Family Medical Leave
- **LIT** - Local Income Tax

---

## API Endpoints

### 1. Geocode Address

Convert an address to location codes.

**POST** `/api/v2/tax/geocode`

```json
{
  "address": {
    "street": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location_codes": [
      {"location_code": "00-000-0000", "jurisdiction_name": "Federal"},
      {"location_code": "06-000-0000", "jurisdiction_name": "CA State"}
    ],
    "primary_location_code": "06-000-0000"
  }
}
```

---

### 2. Find Applicable Taxes

Get all taxes that apply to given location codes.

**POST** `/api/v2/tax/taxes/applicable`

```json
{
  "tax_references": [
    {"location_code": "00-000-0000", "is_resident": true},
    {"location_code": "06-000-0000", "is_resident": true}
  ],
  "pay_date": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taxes": [
      {
        "unique_tax_id": "00-000-0000-FIT-000",
        "description": "Federal Income Tax",
        "required_parameters": [
          {"name": "filing_status", "type": "enum", "values": ["S", "MFJ", "MFS", "HOH"]}
        ]
      }
    ]
  }
}
```

---

### 3. Calculate Gross-to-Net

Calculate payroll taxes from gross wages.

**POST** `/api/v2/tax/calculate/gross-to-net`

```json
{
  "employee_id": "EMP-001",
  "payroll_run": {
    "pay_date": "2025-01-15",
    "pay_periods_per_year": 26,
    "pay_period_number": 1
  },
  "wages": [
    {
      "location_code": "00-000-0000",
      "wage_type": "regular",
      "gross_wages": 2500,
      "hours": 80,
      "ytd_wages": 0
    }
  ],
  "tax_parameters": [
    {
      "unique_tax_id": "00-000-0000-FIT-000",
      "location_code": "00-000-0000",
      "is_exempt": false,
      "ytd_withholding": 0,
      "parameters": {
        "filing_status": "S",
        "w4_version": "2020",
        "dependents_amount": 0,
        "other_income": 0,
        "deductions": 0,
        "extra_withholding": 0
      }
    },
    {
      "unique_tax_id": "00-000-0000-FICA-000",
      "location_code": "00-000-0000",
      "is_exempt": false,
      "ytd_withholding": 0
    },
    {
      "unique_tax_id": "00-000-0000-MEDI-000",
      "location_code": "00-000-0000",
      "is_exempt": false,
      "ytd_withholding": 0
    }
  ],
  "pre_tax_deductions": {
    "401k": 250,
    "health_insurance": 150
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employee_id": "EMP-001",
    "gross_wages": 2500.00,
    "pre_tax_deductions": 400.00,
    "taxable_wages": 2100.00,
    "tax_withholdings": [
      {
        "unique_tax_id": "00-000-0000-FIT-000",
        "description": "Federal Income Tax",
        "tax_amount": 252.33,
        "employer_amount": 0
      },
      {
        "unique_tax_id": "00-000-0000-FICA-000",
        "description": "Social Security",
        "tax_amount": 130.20,
        "employer_amount": 130.20
      },
      {
        "unique_tax_id": "00-000-0000-MEDI-000",
        "description": "Medicare",
        "tax_amount": 30.45,
        "employer_amount": 30.45
      }
    ],
    "total_employee_taxes": 412.98,
    "total_employer_taxes": 160.65,
    "net_pay": 1687.02
  }
}
```

---

### 4. Gross-Up Calculation

Calculate required gross pay for a target net pay.

**POST** `/api/v2/tax/calculate/gross-up`

```json
{
  "target_net_pay": 5000,
  "location_code": "06-000-0000",
  "filing_status": "S",
  "supplemental_rate": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "target_net_pay": 5000.00,
    "calculated_gross_pay": 7092.20,
    "tax_breakdown": {
      "federal_income_tax": 1560.28,
      "state_income_tax": 354.61,
      "social_security": 439.72,
      "medicare": 102.84,
      "total_taxes": 2457.45
    },
    "calculated_net_pay": 4999.98
  }
}
```

---

### 5. Batch Processing

Process multiple employees in one request.

**POST** `/api/v2/tax/calculate/batch`

```json
{
  "payroll_run": {
    "pay_date": "2025-01-15",
    "pay_periods_per_year": 26
  },
  "employees": [
    {
      "employee_id": "EMP-001",
      "wages": [{"location_code": "00-000-0000", "gross_wages": 2500}],
      "tax_parameters": [{"unique_tax_id": "00-000-0000-FIT-000"}]
    },
    {
      "employee_id": "EMP-002",
      "wages": [{"location_code": "00-000-0000", "gross_wages": 3000}],
      "tax_parameters": [{"unique_tax_id": "00-000-0000-FIT-000"}]
    }
  ]
}
```

---

### 6. Benefits Taxability

Check if benefits are pre-tax or post-tax.

**POST** `/api/v2/tax/benefits/taxability`

```json
{
  "benefits": [
    {"type": "401k_traditional", "amount": 500},
    {"type": "health_insurance_employee", "amount": 200}
  ],
  "state": "CA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "benefits": [
      {
        "benefit_type": "401k_traditional",
        "pre_tax_federal": true,
        "pre_tax_fica": false,
        "pre_tax_state": true
      }
    ],
    "totals": {
      "pre_tax_federal": 700.00,
      "pre_tax_fica": 200.00,
      "pre_tax_state": 700.00
    }
  }
}
```

---

### 7. Account Information

Get usage and limits.

**GET** `/api/v2/tax/account`

---

### 8. API Schema

Get endpoint documentation.

**GET** `/api/v2/tax/schema`

---

## Error Handling

All errors return JSON with an `error` object:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human readable message"
  }
}
```

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Invalid or missing API key |
| `rate_limit` | 429 | Daily limit exceeded |
| `feature_unavailable` | 403 | Feature not in your plan |
| `invalid_request` | 400 | Malformed request |
| `not_found` | 404 | Resource not found |

---

## W-4 Parameters

For 2020+ W-4 forms:

| Parameter | Type | Description |
|-----------|------|-------------|
| `filing_status` | enum | S, MFJ, MFS, HOH, QSS |
| `w4_version` | enum | "2020" or "pre2020" |
| `dependents_amount` | decimal | Total from Step 3 |
| `other_income` | decimal | Step 4(a) amount |
| `deductions` | decimal | Step 4(b) amount |
| `extra_withholding` | decimal | Step 4(c) amount |

---

## Support

- **Email**: api-support@saurellius.com
- **Documentation**: https://docs.saurellius.com/tax-engine
- **Status Page**: https://status.saurellius.com

---

© 2025 Saurellius Cloud Payroll. All rights reserved.
