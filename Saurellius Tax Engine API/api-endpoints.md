# Saurellius Tax Engine API Endpoints

## Core Calculation Endpoints

### Calculate Taxes
`POST /v1/calculate`

Calculate all applicable taxes for an employee based on their information.

**Example Request:**
```json
{
  "employee": {
    "id": "EMP12345",
    "firstName": "Jane",
    "lastName": "Doe",
    "ssn": "123-45-6789",
    "homeAddress": {
      "street1": "123 Home St",
      "city": "Phoenix",
      "state": "AZ",
      "zipCode": "85001"
    },
    "workAddress": {
      "street1": "456 Office Blvd",
      "city": "Phoenix",
      "state": "AZ",
      "zipCode": "85004"
    }
  },
  "payPeriod": {
    "startDate": "2025-03-01",
    "endDate": "2025-03-15",
    "payDate": "2025-03-20",
    "periodType": "biweekly"
  },
  "earnings": {
    "regularEarnings": 2000.00,
    "overtimeEarnings": 150.00,
    "bonusEarnings": 0,
    "commissionEarnings": 0,
    "otherEarnings": 0
  },
  "preTaxDeductions": {
    "retirement401k": 100.00,
    "medical": 50.00,
    "dental": 10.00,
    "vision": 5.00,
    "hsa": 25.00,
    "fsa": 0,
    "otherPreTaxDeductions": 0
  },
  "postTaxDeductions": {
    "garnishments": 0,
    "otherPostTaxDeductions": 0
  },
  "federalWithholding": {
    "filingStatus": "single",
    "allowances": 1,
    "additionalWithholding": 0,
    "nonResidentAlien": false
  },
  "stateWithholding": {
    "filingStatus": "single",
    "allowances": 1,
    "additionalWithholding": 0
  }
}
```

**Example Response:**
```json
{
  "calculationId": "f8c3de3d-1d47-4f5b-a6c2-8d6f4e1a7b90",
  "timestamp": "2025-03-18T14:23:56.123Z",
  "taxes": {
    "federal": {
      "federalIncomeTax": 235.42,
      "socialSecurity": 133.30,
      "medicare": 31.17,
      "additionalMedicare": 0
    },
    "state": {
      "stateCode": "AZ",
      "stateIncomeTax": 76.10,
      "stateDisabilityInsurance": 0,
      "stateSUI": 0,
      "paidFamilyLeave": 0
    },
    "local": [],
    "employer": {
      "federalUnemployment": 12.90,
      "stateUnemployment": 43.00,
      "employerSocialSecurity": 133.30,
      "employerMedicare": 31.17,
      "otherEmployerTaxes": 0
    }
  },
  "netPay": 1619.01,
  "totalTaxes": 475.99,
  "grossToNetSummary": {
    "grossPay": 2150.00,
    "preTaxDeductions": 190.00,
    "taxableIncome": 1960.00,
    "taxes": 475.99,
    "postTaxDeductions": 0,
    "netPay": 1619.01
  }
}
```

### Batch Tax Calculations
`POST /v1/calculate/batch`

Calculate taxes for multiple employees in a single request.

**Example Request:**
```json
{
  "payPeriod": {
    "startDate": "2025-03-01",
    "endDate": "2025-03-15",
    "payDate": "2025-03-20",
    "periodType": "biweekly"
  },
  "employees": [
    {
      "id": "EMP12345",
      "firstName": "Jane",
      "lastName": "Doe",
      "ssn": "123-45-6789",
      "homeAddress": {
        "street1": "123 Home St",
        "city": "Phoenix",
        "state": "AZ",
        "zipCode": "85001"
      },
      "workAddress": {
        "street1": "456 Office Blvd",
        "city": "Phoenix",
        "state": "AZ",
        "zipCode": "85004"
      },
      "earnings": {
        "regularEarnings": 2000.00,
        "overtimeEarnings": 150.00
      },
      "preTaxDeductions": {
        "retirement401k": 100.00,
        "medical": 50.00
      },
      "federalWithholding": {
        "filingStatus": "single",
        "allowances": 1
      },
      "stateWithholding": {
        "filingStatus": "single",
        "allowances": 1
      }
    },
    {
      "id": "EMP12346",
      "firstName": "John",
      "lastName": "Smith",
      "ssn": "987-65-4321",
      "homeAddress": {
        "street1": "789 Home Ave",
        "city": "Phoenix",
        "state": "AZ",
        "zipCode": "85002"
      },
      "workAddress": {
        "street1": "456 Office Blvd",
        "city": "Phoenix",
        "state": "AZ",
        "zipCode": "85004"
      },
      "earnings": {
        "regularEarnings": 2500.00,
        "overtimeEarnings": 200.00
      },
      "preTaxDeductions": {
        "retirement401k": 150.00,
        "medical": 75.00
      },
      "federalWithholding": {
        "filingStatus": "married",
        "allowances": 2
      },
      "stateWithholding": {
        "filingStatus": "married",
        "allowances": 2
      }
    }
  ]
}
```

**Example Response:**
```json
{
  "batchId": "b2a59c15-37c6-4e81-8c7f-d4e7b3a5c1f0",
  "timestamp": "2025-03-18T14:25:12.456Z",
  "totalEmployees": 2,
  "results": [
    {
      "calculationId": "f8c3de3d-1d47-4f5b-a6c2-8d6f4e1a7b90",
      "timestamp": "2025-03-18T14:25:12.456Z",
      "taxes": { /* tax details */ },
      "netPay": 1619.01,
      "totalTaxes": 475.99,
      "grossToNetSummary": { /* summary details */ }
    },
    {
      "calculationId": "e7b2ad4c-0e35-4f6a-b1d3-9c8e2d1a7b60",
      "timestamp": "2025-03-18T14:25:12.456Z",
      "taxes": { /* tax details */ },
      "netPay": 2032.78,
      "totalTaxes": 592.22,
      "grossToNetSummary": { /* summary details */ }
    }
  ]
}
```

### Multistate Tax Calculations
`POST /v1/multistate/calculate`

Calculate taxes for employees who work in multiple states.

**Example Request:**
```json
{
  "employee": {
    "id": "EMP12345",
    "firstName": "Jane",
    "lastName": "Doe",
    "ssn": "123-45-6789",
    "homeAddress": {
      "street1": "123 Home St",
      "city": "Trenton",
      "state": "NJ",
      "zipCode": "08608"
    }
  },
  "payPeriod": {
    "startDate": "2025-03-01",
    "endDate": "2025-03-15",
    "payDate": "2025-03-20",
    "periodType": "biweekly"
  },
  "earnings": {
    "totalEarnings": 3000.00
  },
  "workLocations": [
    {
      "state": "NJ",
      "workAddress": {
        "street1": "100 NJ Office",
        "city": "Trenton",
        "state": "NJ",
        "zipCode": "08608"
      },
      "daysWorked": 6,
      "percentageOfTime": 60,
      "earningsForLocation": 1800.00
    },
    {
      "state": "NY",
      "workAddress": {
        "street1": "200 NY Office",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001"
      },
      "daysWorked": 4,
      "percentageOfTime": 40,
      "earningsForLocation": 1200.00
    }
  ],
  "preTaxDeductions": {
    "total": 200.00
  },
  "postTaxDeductions": {
    "total": 50.00
  },
  "federalWithholding": {
    "filingStatus": "single",
    "allowances": 1
  }
}
```

**Example Response:**
```json
{
  "calculationId": "d1c4b8a7-36e5-4f2b-9d0c-e7f5a3b2c1d0",
  "timestamp": "2025-03-18T14:27:33.789Z",
  "taxesByState": [
    {
      "state": "NJ",
      "stateWithholding": 63.00,
      "localWithholding": 0,
      "sdiFees": 16.20,
      "otherStateTaxes": 0,
      "daysWorked": 6,
      "percentageOfTime": 60,
      "earningsForLocation": 1800.00,
      "reciprocityApplied": false
    },
    {
      "state": "NY",
      "stateWithholding": 50.40,
      "localWithholding": 40.80,
      "sdiFees": 1.50,
      "otherStateTaxes": 5.46,
      "daysWorked": 4,
      "percentageOfTime": 40,
      "earningsForLocation": 1200.00,
      "reciprocityApplied": false
    }
  ],
  "federalTaxes": {
    "federalIncomeTax": 317.12,
    "socialSecurity": 186.00,
    "medicare": 43.50
  },
  "netPay": 2226.02,
  "reciprocityRulesApplied": []
}
```

## Location Services

### Validate Location
`POST /v1/locations/validate`

Validate and enhance address data using geocoding service.

**Example Request:**
```json
{
  "address": {
    "street1": "123 Main St",
    "street2": "Suite 100",
    "city": "Phoenix",
    "state": "AZ",
    "zipCode": "85001"
  }
}
```

**Example Response:**
```json
{
  "normalizedAddress": {
    "street1": "123 Main St",
    "street2": "Ste 100",
    "city": "Phoenix",
    "state": "AZ",
    "zipCode": "85001",
    "county": "Maricopa"
  },
  "locationCode": "04-013-2410342",
  "taxJurisdictions": [
    {
      "jurisdictionType": "state",
      "jurisdictionName": "Arizona",
      "jurisdictionCode": "AZ"
    },
    {
      "jurisdictionType": "county",
      "jurisdictionName": "Maricopa County",
      "jurisdictionCode": "013"
    },
    {
      "jurisdictionType": "city",
      "jurisdictionName": "Phoenix",
      "jurisdictionCode": "2410342"
    }
  ],
  "geocode": {
    "latitude": 33.4484,
    "longitude": -112.0740,
    "precision": "rooftop"
  }
}
```

## Jurisdiction & Tax Rate Endpoints

### Get Jurisdiction Information
`GET /v1/jurisdictions/{jurisdictionId}`

Get detailed information about a specific tax jurisdiction.

**Example Response:**
```json
{
  "jurisdictionId": "CTY_AZ_PHOENIX",
  "name": "Phoenix",
  "type": "city",
  "parentJurisdictions": [
    {
      "id": "ST_AZ",
      "name": "Arizona",
      "type": "state"
    },
    {
      "id": "CTY_AZ_MARICOPA",
      "name": "Maricopa County",
      "type": "county"
    }
  ],
  "taxes": [
    {
      "taxId": "PHX_TAX_1",
      "name": "Phoenix City Tax",
      "type": "sales",
      "currentRate": 0.025,
      "effectiveDate": "2024-01-01",
      "expirationDate": null
    }
  ],
  "reciprocityAgreements": []
}
```

### Get Tax Rates
`GET /v1/taxes/rates`

Get current tax rates for multiple jurisdictions.

**Example Request:**
```
GET /v1/taxes/rates?jurisdictionIds=ST_AZ,CTY_AZ_MARICOPA&taxTypes=income_tax,sales_tax&effectiveDate=2025-01-01
```

**Example Response:**
```json
{
  "effectiveDate": "2025-01-01",
  "rates": [
    {
      "jurisdictionId": "ST_AZ",
      "jurisdictionName": "Arizona",
      "jurisdictionType": "state",
      "taxId": "AZ_INCOME",
      "taxName": "Arizona Income Tax",
      "taxType": "income_tax",
      "rate": null,
      "flatAmount": null,
      "brackets": [
        {
          "minimum": 0,
          "maximum": 29304,
          "rate": 0.0259,
          "flatAmount": 0
        },
        {
          "minimum": 29304,
          "maximum": 58598,
          "rate": 0.0334,
          "flatAmount": 759
        },
        {
          "minimum": 58598,
          "maximum": 100000,
          "rate": 0.0417,
          "flatAmount": 1721
        },
        {
          "minimum": 100000,
          "maximum": null,
          "rate": 0.045,
          "flatAmount": 3458
        }
      ],
      "effectiveDate": "2024-01-01",
      "expirationDate": null
    }
  ]
}
```

### W-4 Calculator
`POST /v1/w4/calculate`

Calculate optimal withholding based on employee information.

**Example Request:**
```json
{
  "personalInfo": {
    "filingStatus": "single",
    "dependents": 1,
    "otherIncome": 5000,
    "deductions": 12000,
    "annualSalary": 75000
  },
  "payrollInfo": {
    "payFrequency": "biweekly",
    "stateOfResidence": "AZ",
    "stateOfEmployment": "AZ"
  },
  "preferences": {
    "refundTarget": 500,
    "additionalWithholding": 0
  }
}
```

**Example Response:**
```json
{
  "recommendations": {
    "federalW4": {
      "filingStatus": "single",
      "multipleJobs": false,
      "claimDependents": 2000,
      "otherIncome": 5000,
      "deductions": 12000,
      "additionalWithholding": 25
    },
    "stateW4": {
      "filingStatus": "single",
      "allowances": 1,
      "additionalWithholding": 5
    }
  },
  "projections": {
    "annualWithholding": 14758,
    "projectedTaxLiability": 14275,
    "projectedRefund": 483
  }
}
```

### Reciprocity Rules
`GET /v1/reciprocity/rules`

Get reciprocity rules between states.

**Example Request:**
```
GET /v1/reciprocity/rules?homeState=NJ&workState=NY
```

**Example Response:**
```json
{
  "homeState": "NJ",
  "workState": "NY",
  "hasReciprocityAgreement": false,
  "details": "New Jersey and New York do not have a reciprocity agreement. Employees must pay income tax to the state where they work (NY) and may receive a credit for those taxes on their home state (NJ) return.",
  "conditions": [],
  "forms": [
    {
      "formName": "New York IT-2104",
      "formNumber": "IT-2104",
      "formUrl": "https://www.tax.ny.gov/pdf/current_forms/it/it2104_fill_in.pdf"
    }
  ]
}
```

## Update Tracking

### Tax Updates
`GET /v1/taxes/updates`

Get information about recent tax updates.

**Example Request:**
```
GET /v1/taxes/updates?since=2024-10-01&jurisdictionIds=ST_CA,ST_NY&taxTypes=income_tax,disability_insurance
```

**Example Response:**
```json
{
  "updates": [
    {
      "updateId": "upd_123456",
      "taxId": "CA_SDI",
      "jurisdictionId": "ST_CA",
      "jurisdictionName": "California",
      "updateType": "modified",
      "effectiveDate": "2025-01-01",
      "previousRate": 0.009,
      "newRate": 0.01,
      "documentationUrl": "https://edd.ca.gov/en/Payroll_Taxes/Rates_and_Withholding",
      "summary": "California SDI rate increased for 2025"
    },
    {
      "updateId": "upd_123457",
      "taxId": "NY_PFL",
      "jurisdictionId": "ST_NY",
      "jurisdictionName": "New York",
      "updateType": "modified",
      "effectiveDate": "2025-01-01",
      "previousRate": 0.00455,
      "newRate": 0.005,
      "documentationUrl": "https://paidfamilyleave.ny.gov/2025",
      "summary": "New York PFL rate increased for 2025"
    }
  ],
  "totalUpdates": 2,
  "releaseVersion": "1.5.2",
  "releaseDate": "2024-12-15"
}
```

## Data Management

### Employees
`POST /v1/employees`

Create or update employee records.

**Example Request:**
```json
{
  "employees": [
    {
      "id": "EMP12345",
      "firstName": "Jane",
      "lastName": "Doe",
      "ssn": "123-45-6789",
      "homeAddress": {
        "street1": "123 Home St",
        "city": "Phoenix",
        "state": "AZ",
        "zipCode": "85001"
      },
      "workAddress": {
        "street1": "456 Office Blvd",
        "city": "Phoenix",
        "state": "AZ",
        "zipCode": "85004"
      },
      "federalTaxSettings": {
        "filingStatus": "single",
        "allowances": 1,
        "additionalWithholding": 0
      },
      "stateTaxSettings": [
        {
          "state": "AZ",
          "filingStatus": "single",
          "allowances": 1,
          "additionalWithholding": 0
        }
      ]
    }
  ]
}
```

**Example Response:**
```json
{
  "status": "success",
  "created": 1,
  "updated": 0,
  "errors": [],
  "employeeIds": ["EMP12345"]
}
```

## Webhooks

### Register Webhook
`POST /v1/webhooks`

Register a webhook to receive notifications about tax updates and other events.

**Example Request:**
```json
{
  "url": "https://yourdomain.com/webhook/tax-updates",
  "events": ["tax_update", "calculation_error"],
  "secret": "your_webhook_secret_key"
}
```

**Example Response:**
```json
{
  "webhookId": "wh_987654",
  "url": "https://yourdomain.com/webhook/tax-updates",
  "events": ["tax_update", "calculation_error"],
  "created": "2025-03-18T14:35:22.123Z"
}
```

### Tax Update Notification
Example webhook payload for tax updates:

```json
{
  "event": "tax_update",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "data": {
    "updateId": "upd_123456",
    "taxId": "CA_SDI",
    "jurisdictionId": "ST_CA",
    "jurisdictionName": "California",
    "updateType": "modified",
    "effectiveDate": "2025-01-01",
    "previousRate": 0.009,
    "newRate": 0.01,
    "documentationUrl": "https://edd.ca.gov/en/Payroll_Taxes/Rates_and_Withholding",
    "summary": "California SDI rate increased for 2025"
  }
}
```

### Calculation Error Notification
Example webhook payload for calculation errors:

```json
{
  "event": "calculation_error",
  "timestamp": "2025-03-18T14:42:18.456Z",
  "data": {
    "calculationId": "f8c3de3d-1d47-4f5b-a6c2-8d6f4e1a7b90",
    "errorCode": "invalid_work_location",
    "errorMessage": "Could not determine tax jurisdiction for work location",
    "requestData": {
      "employee": {
        "id": "EMP12345",
        "workAddress": {
          "city": "Unknown City",
          "state": "ZZ",
          "zipCode": "00000"
        }
      }
    }
  }
}
```
