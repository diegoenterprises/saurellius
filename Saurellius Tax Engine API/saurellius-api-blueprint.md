# Saurellius Tax Engine API Documentation

## Introduction

The Saurellius Tax Engine (STE) is a powerful, comprehensive payroll tax calculation system designed to handle complex tax scenarios across more than 7,400 tax jurisdictions. This API provides fast, accurate tax calculations with an average response time of 3 milliseconds per calculation.

## API Specifications

### Hosting & Architecture
- Hosted on Amazon Web Services (AWS) with automatic load balancing
- Service redundancy and resiliency built into the architecture
- Accessible via HTTPS requests to secure endpoints
- Supports both JSON and XML request/response formats
- Monthly updates with interim releases as tax laws change
- Staging environment available for testing before production deployment

### Authentication
All API requests require authentication using an API key provided upon subscription.

```
Authorization: ApiKey YOUR_API_KEY
```

### Base URL
```
https://api.saurellius.com/v1
```

## Core Endpoints

### Calculate Taxes
`POST /calculate`

Calculate all applicable taxes for an employee based on their information.

#### Request Body
```json
{
  "employee": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "ssn": "string",
    "homeAddress": {
      "street1": "string",
      "street2": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string"
    },
    "workAddress": {
      "street1": "string",
      "street2": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string"
    }
  },
  "payPeriod": {
    "startDate": "string (YYYY-MM-DD)",
    "endDate": "string (YYYY-MM-DD)",
    "payDate": "string (YYYY-MM-DD)",
    "periodType": "string" // weekly, biweekly, semimonthly, monthly
  },
  "earnings": {
    "regularEarnings": "number",
    "overtimeEarnings": "number",
    "bonusEarnings": "number",
    "commissionEarnings": "number",
    "otherEarnings": "number"
  },
  "preTaxDeductions": {
    "retirement401k": "number",
    "medical": "number",
    "dental": "number",
    "vision": "number",
    "hsa": "number",
    "fsa": "number",
    "otherPreTaxDeductions": "number"
  },
  "postTaxDeductions": {
    "garnishments": "number",
    "otherPostTaxDeductions": "number"
  },
  "federalWithholding": {
    "filingStatus": "string", // single, married, headOfHousehold
    "allowances": "number",
    "additionalWithholding": "number",
    "nonResidentAlien": "boolean"
  },
  "stateWithholding": {
    "filingStatus": "string",
    "allowances": "number",
    "additionalWithholding": "number"
  }
}
```

#### Response
```json
{
  "calculationId": "string",
  "timestamp": "string (ISO date)",
  "taxes": {
    "federal": {
      "federalIncomeTax": "number",
      "socialSecurity": "number",
      "medicare": "number",
      "additionalMedicare": "number"
    },
    "state": {
      "stateCode": "string",
      "stateIncomeTax": "number",
      "stateDisabilityInsurance": "number",
      "stateSUI": "number",
      "paidFamilyLeave": "number"
    },
    "local": [
      {
        "localityName": "string",
        "localityType": "string", // city, county, school, municipality, etc.
        "localityCode": "string",
        "localIncomeTax": "number",
        "schoolDistrictTax": "number",
        "localServicesTax": "number"
      }
    ],
    "employer": {
      "federalUnemployment": "number",
      "stateUnemployment": "number",
      "employerSocialSecurity": "number",
      "employerMedicare": "number",
      "otherEmployerTaxes": "number"
    }
  },
  "netPay": "number",
  "totalTaxes": "number",
  "grossToNetSummary": {
    "grossPay": "number",
    "preTaxDeductions": "number",
    "taxableIncome": "number",
    "taxes": "number",
    "postTaxDeductions": "number",
    "netPay": "number"
  }
}
```

### Geocoding and Location Services
`POST /locations/validate`

Validate and enhance address data using our geocoding service.

#### Request Body
```json
{
  "address": {
    "street1": "string",
    "street2": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  }
}
```

#### Response
```json
{
  "normalizedAddress": {
    "street1": "string",
    "street2": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "county": "string"
  },
  "locationCode": "string", // Saurellius location code (format: SS-CCC-FFFFFFFF)
  "taxJurisdictions": [
    {
      "jurisdictionType": "string", // state, county, city, school, special
      "jurisdictionName": "string",
      "jurisdictionCode": "string"
    }
  ],
  "geocode": {
    "latitude": "number",
    "longitude": "number",
    "precision": "string" // rooftop, interpolated, zip+4, zip
  }
}
```

### Tax Jurisdiction Information
`GET /jurisdictions/{jurisdictionId}`

Get detailed information about a specific tax jurisdiction.

#### Response
```json
{
  "jurisdictionId": "string",
  "name": "string",
  "type": "string", // federal, state, county, city, school, special
  "parentJurisdictions": [
    {
      "id": "string",
      "name": "string",
      "type": "string"
    }
  ],
  "taxes": [
    {
      "taxId": "string",
      "name": "string",
      "type": "string", // income, property, sales, unemployment, etc.
      "currentRate": "number",
      "effectiveDate": "string (YYYY-MM-DD)",
      "expirationDate": "string (YYYY-MM-DD)"
    }
  ],
  "reciprocityAgreements": [
    {
      "jurisdictionId": "string",
      "jurisdictionName": "string",
      "details": "string"
    }
  ]
}
```

### Tax Rates
`GET /taxes/rates`

Get current tax rates for multiple jurisdictions.

#### Query Parameters
- `jurisdictionIds`: Comma-separated list of jurisdiction IDs
- `taxTypes`: Comma-separated list of tax types
- `effectiveDate`: Date in YYYY-MM-DD format (defaults to current date)

#### Response
```json
{
  "effectiveDate": "string (YYYY-MM-DD)",
  "rates": [
    {
      "jurisdictionId": "string",
      "jurisdictionName": "string",
      "jurisdictionType": "string",
      "taxId": "string",
      "taxName": "string",
      "taxType": "string",
      "rate": "number",
      "flatAmount": "number",
      "thresholds": [
        {
          "minimum": "number",
          "maximum": "number",
          "rate": "number",
          "flatAmount": "number"
        }
      ],
      "effectiveDate": "string (YYYY-MM-DD)",
      "expirationDate": "string (YYYY-MM-DD)"
    }
  ]
}
```

### W-4 Calculator
`POST /w4/calculate`

Calculate optimal withholding based on employee information.

#### Request Body
```json
{
  "personalInfo": {
    "filingStatus": "string", // single, married, headOfHousehold
    "dependents": "number",
    "otherIncome": "number",
    "deductions": "number",
    "annualSalary": "number"
  },
  "payrollInfo": {
    "payFrequency": "string", // weekly, biweekly, semimonthly, monthly
    "stateOfResidence": "string",
    "stateOfEmployment": "string"
  },
  "preferences": {
    "refundTarget": "number",
    "additionalWithholding": "number"
  }
}
```

#### Response
```json
{
  "recommendations": {
    "federalW4": {
      "filingStatus": "string",
      "multipleJobs": "boolean",
      "claimDependents": "number",
      "otherIncome": "number",
      "deductions": "number",
      "additionalWithholding": "number"
    },
    "stateW4": {
      "filingStatus": "string",
      "allowances": "number",
      "additionalWithholding": "number"
    }
  },
  "projections": {
    "annualWithholding": "number",
    "projectedTaxLiability": "number",
    "projectedRefund": "number"
  }
}
```

### Multi-state Calculations
`POST /multistate/calculate`

Calculate taxes for employees who work in multiple states.

#### Request Body
```json
{
  "employee": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "ssn": "string",
    "homeAddress": {
      "street1": "string",
      "street2": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string"
    }
  },
  "payPeriod": {
    "startDate": "string (YYYY-MM-DD)",
    "endDate": "string (YYYY-MM-DD)",
    "payDate": "string (YYYY-MM-DD)",
    "periodType": "string"
  },
  "earnings": {
    "totalEarnings": "number"
  },
  "workLocations": [
    {
      "state": "string",
      "workAddress": {
        "street1": "string",
        "street2": "string",
        "city": "string",
        "state": "string",
        "zipCode": "string"
      },
      "daysWorked": "number",
      "percentageOfTime": "number",
      "earningsForLocation": "number"
    }
  ],
  "preTaxDeductions": {
    "total": "number"
  },
  "postTaxDeductions": {
    "total": "number"
  }
}
```

#### Response
```json
{
  "calculationId": "string",
  "timestamp": "string (ISO date)",
  "taxesByState": [
    {
      "state": "string",
      "stateWithholding": "number",
      "localWithholding": "number",
      "sdiFees": "number",
      "otherStateTaxes": "number"
    }
  ],
  "federalTaxes": {
    "federalIncomeTax": "number",
    "socialSecurity": "number",
    "medicare": "number"
  },
  "netPay": "number",
  "reciprocityRulesApplied": [
    {
      "homeState": "string",
      "workState": "string",
      "reciprocityRule": "string",
      "impact": "string"
    }
  ]
}
```

### Tax Updates Subscription
`GET /taxes/updates`

Get information about recent tax updates.

#### Query Parameters
- `since`: Date in YYYY-MM-DD format
- `jurisdictionIds`: Comma-separated list of jurisdiction IDs (optional)
- `taxTypes`: Comma-separated list of tax types (optional)

#### Response
```json
{
  "updates": [
    {
      "updateId": "string",
      "taxId": "string",
      "jurisdictionId": "string",
      "jurisdictionName": "string",
      "updateType": "string", // new, modified, expired
      "effectiveDate": "string (YYYY-MM-DD)",
      "previousRate": "number",
      "newRate": "number",
      "documentationUrl": "string",
      "summary": "string"
    }
  ],
  "totalUpdates": "number",
  "releaseVersion": "string",
  "releaseDate": "string (YYYY-MM-DD)"
}
```

## Data Management Endpoints

### Employees
`POST /employees`

Create or update employee records.

#### Request Body
```json
{
  "employees": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "ssn": "string",
      "homeAddress": {
        "street1": "string",
        "street2": "string",
        "city": "string",
        "state": "string",
        "zipCode": "string"
      },
      "workAddress": {
        "street1": "string",
        "street2": "string",
        "city": "string",
        "state": "string",
        "zipCode": "string"
      },
      "federalTaxSettings": {
        "filingStatus": "string",
        "allowances": "number",
        "additionalWithholding": "number"
      },
      "stateTaxSettings": [
        {
          "state": "string",
          "filingStatus": "string",
          "allowances": "number",
          "additionalWithholding": "number"
        }
      ]
    }
  ]
}
```

### Reciprocity Rules
`GET /reciprocity/rules`

Get reciprocity rules between states.

#### Query Parameters
- `homeState`: Two-letter state code
- `workState`: Two-letter state code

#### Response
```json
{
  "homeState": "string",
  "workState": "string",
  "hasReciprocityAgreement": "boolean",
  "details": "string",
  "conditions": [
    {
      "condition": "string",
      "description": "string"
    }
  ],
  "forms": [
    {
      "formName": "string",
      "formNumber": "string",
      "formUrl": "string"
    }
  ]
}
```

## Webhooks

The Saurellius Tax Engine supports webhooks for real-time notifications about tax updates and other events.

### Tax Update Notifications
```json
{
  "event": "tax_update",
  "timestamp": "string (ISO date)",
  "data": {
    "updateId": "string",
    "taxId": "string",
    "jurisdictionId": "string",
    "jurisdictionName": "string",
    "updateType": "string",
    "effectiveDate": "string (YYYY-MM-DD)",
    "previousRate": "number",
    "newRate": "number",
    "documentationUrl": "string",
    "summary": "string"
  }
}
```

### Calculation Error Notifications
```json
{
  "event": "calculation_error",
  "timestamp": "string (ISO date)",
  "data": {
    "calculationId": "string",
    "errorCode": "string",
    "errorMessage": "string",
    "requestData": {}
  }
}
```

## Implementation Interfaces

The Saurellius Tax Engine supports the following interfaces:

| Interface | Web API | Windows 32-Bit | Windows 64-Bit | Linux 64-Bit |
|-----------|---------|---------------|---------------|-------------|
| JSON      |        |              |              |            |
| XML       |        |              |              |            |
| C/C++     |         |              |              |            |
| JAVA      |         |              |              |            |
| .NET      |         |              |              |             |
| .NET Core |         |               |              |            |
| Delphi    |         |              |               |             |
