# Saurellius Tax Engine Implementation Guide

## Introduction

This guide provides detailed instructions for implementing the Saurellius Tax Engine (STE) API in your application. The STE is available in two deployment models:

1. **Web API** (Recommended)
2. **On-Premise SDK**

## Web API Implementation

### Prerequisites

- Valid API key from Saurellius Software
- HTTPS-capable client
- JSON or XML parsing capabilities

### Getting Started

#### Step 1: Authentication

All API requests require authentication using your API key. Include the key in the header of each request:

```
Authorization: ApiKey YOUR_API_KEY
```

#### Step 2: Basic Tax Calculation

Here's a simple example of calculating taxes for an employee using the `/calculate` endpoint:

```javascript
// Example JavaScript implementation
const calculateTaxes = async (employeeData) => {
  try {
    const response = await fetch('https://api.saurellius.com/v1/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey YOUR_API_KEY'
      },
      body: JSON.stringify(employeeData)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const taxData = await response.json();
    return taxData;
  } catch (error) {
    console.error('Tax calculation error:', error);
    throw error;
  }
};

// Example usage
const employeeData = {
  employee: {
    id: "EMP12345",
    firstName: "Jane",
    lastName: "Doe",
    ssn: "123-45-6789",
    homeAddress: {
      street1: "123 Home St",
      city: "Phoenix",
      state: "AZ",
      zipCode: "85001"
    },
    workAddress: {
      street1: "456 Office Blvd",
      city: "Phoenix",
      state: "AZ",
      zipCode: "85004"
    }
  },
  payPeriod: {
    startDate: "2025-03-01",
    endDate: "2025-03-15",
    payDate: "2025-03-20",
    periodType: "biweekly"
  },
  earnings: {
    regularEarnings: 2000.00,
    overtimeEarnings: 150.00,
    bonusEarnings: 0,
    commissionEarnings: 0,
    otherEarnings: 0
  },
  preTaxDeductions: {
    retirement401k: 100.00,
    medical: 50.00,
    dental: 10.00,
    vision: 5.00,
    hsa: 25.00,
    fsa: 0,
    otherPreTaxDeductions: 0
  },
  postTaxDeductions: {
    garnishments: 0,
    otherPostTaxDeductions: 0
  },
  federalWithholding: {
    filingStatus: "single",
    allowances: 1,
    additionalWithholding: 0,
    nonResidentAlien: false
  },
  stateWithholding: {
    filingStatus: "single",
    allowances: 1,
    additionalWithholding: 0
  }
};

calculateTaxes(employeeData)
  .then(result => console.log('Tax calculation result:', result))
  .catch(error => console.error('Failed to calculate taxes:', error));
```

#### Step 3: Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid API key)
- 404: Not Found (invalid endpoint)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

All error responses include a JSON body with error details:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  }
}
```

#### Step 4: Webhook Implementation

To receive tax update notifications:

1. Register your webhook URL in the Saurellius dashboard
2. Implement an endpoint to process incoming webhooks
3. Verify the signature of incoming webhooks

Example webhook handler (Node.js/Express):

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// Webhook endpoint
app.post('/tax-updates-webhook', (req, res) => {
  // 1. Verify webhook signature
  const signature = req.headers['x-saurellius-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', 'YOUR_WEBHOOK_SECRET')
    .update(payload)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  // 2. Process the webhook data
  const event = req.body.event;
  const data = req.body.data;
  
  console.log(`Received ${event} webhook:`, data);
  
  // 3. Handle specific event types
  switch (event) {
    case 'tax_update':
      // Update your local tax rates
      handleTaxUpdate(data);
      break;
    case 'calculation_error':
      // Log calculation errors
      handleCalculationError(data);
      break;
    default:
      console.log(`Unknown event type: ${event}`);
  }
  
  // 4. Acknowledge receipt
  res.status(200).send('Webhook received');
});

function handleTaxUpdate(data) {
  // Implementation for handling tax updates
  console.log(`Tax update for ${data.jurisdictionName}: ${data.previousRate} -> ${data.newRate}`);
}

function handleCalculationError(data) {
  // Implementation for handling calculation errors
  console.error(`Calculation error: ${data.errorMessage} (ID: ${data.calculationId})`);
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

## On-Premise SDK Implementation

### Prerequisites

- Appropriate development environment for your chosen interface
- Valid license key from Saurellius Software
- Minimum system requirements:
  - 4GB RAM
  - 20GB disk space
  - Quad-core processor
  - Operating system: Windows Server 2016+ or Linux (kernel 4.4+)

### Installation

#### Windows Installation

1. Download the SDK installer from the Saurellius customer portal
2. Run the installer with administrator privileges
3. Follow the installation wizard
4. Activate the SDK using your license key

#### Linux Installation

1. Download the SDK package from the Saurellius customer portal
2. Extract the package: `tar -xzvf saurellius-sdk-linux-x64.tar.gz`
3. Run the installation script: `sudo ./install.sh`
4. Activate the SDK using your license key: `sudo ./activate.sh YOUR_LICENSE_KEY`

### SDK Usage Examples

#### C# / .NET Example

```csharp
using Saurellius.TaxEngine;
using Saurellius.TaxEngine.Models;
using System;

namespace TaxCalculationExample
{
    class Program
    {
        static void Main(string[] args)
        {
            // Initialize the tax engine
            var taxEngine = new SaurelliusTaxEngine();
            
            // Create an employee
            var employee = new Employee
            {
                Id = "EMP12345",
                FirstName = "Jane",
                LastName = "Doe",
                SSN = "123-45-6789",
                HomeAddress = new Address
                {
                    Street1 = "123 Home St",
                    City = "Phoenix",
                    State = "AZ",
                    ZipCode = "85001"
                },
                WorkAddress = new Address
                {
                    Street1 = "456 Office Blvd",
                    City = "Phoenix",
                    State = "AZ",
                    ZipCode = "85004"
                }
            };
            
            // Create payroll details
            var payrollDetails = new PayrollDetails
            {
                PayPeriod = new PayPeriod
                {
                    StartDate = new DateTime(2025, 3, 1),
                    EndDate = new DateTime(2025, 3, 15),
                    PayDate = new DateTime(2025, 3, 20),
                    PeriodType = PeriodType.Biweekly
                },
                Earnings = new Earnings
                {
                    RegularEarnings = 2000.00m,
                    OvertimeEarnings = 150.00m
                },
                PreTaxDeductions = new PreTaxDeductions
                {
                    Retirement401k = 100.00m,
                    Medical = 50.00m,
                    Dental = 10.00m,
                    Vision = 5.00m,
                    HSA = 25.00m
                },
                FederalWithholding = new FederalWithholding
                {
                    FilingStatus = FilingStatus.Single,
                    Allowances = 1
                },
                StateWithholding = new StateWithholding
                {
                    FilingStatus = FilingStatus.Single,
                    Allowances = 1
                }
            };
            
            try
            {
                // Calculate taxes
                var result = taxEngine.CalculateTaxes(employee, payrollDetails);
                
                // Display results
                Console.WriteLine($"Federal Income Tax: {result.Taxes.Federal.FederalIncomeTax:C}");
                Console.WriteLine($"Social Security: {result.Taxes.Federal.SocialSecurity:C}");
                Console.WriteLine($"Medicare: {result.Taxes.Federal.Medicare:C}");
                Console.WriteLine($"State Income Tax: {result.Taxes.State.StateIncomeTax:C}");
                Console.WriteLine($"Net Pay: {result.NetPay:C}");
            }
            catch (TaxCalculationException ex)
            {
                Console.WriteLine($"Tax calculation error: {ex.Message}");
            }
        }
    }
}
```

#### Java Example

```java
import com.saurellius.taxengine.*;
import com.saurellius.taxengine.models.*;

public class TaxCalculationExample {
    public static void main(String[] args) {
        // Initialize the tax engine
        SaurelliusTaxEngine taxEngine = new SaurelliusTaxEngine();
        
        // Create an employee
        Employee employee = new Employee();
        employee.setId("EMP12345");
        employee.setFirstName("Jane");
        employee.setLastName("Doe");
        employee.setSsn("123-45-6789");
        
        Address homeAddress = new Address();
        homeAddress.setStreet1("123 Home St");
        homeAddress.setCity("Phoenix");
        homeAddress.setState("AZ");
        homeAddress.setZipCode("85001");
        employee.setHomeAddress(homeAddress);
        
        Address workAddress = new Address();
        workAddress.setStreet1("456 Office Blvd");
        workAddress.setCity("Phoenix");
        workAddress.setState("AZ");
        workAddress.setZipCode("85004");
        employee.setWorkAddress(workAddress);
        
        // Create payroll details
        PayrollDetails payrollDetails = new PayrollDetails();
        
        PayPeriod payPeriod = new PayPeriod();
        payPeriod.setStartDate("2025-03-01");
        payPeriod.setEndDate("2025-03-15");
        payPeriod.setPayDate("2025-03-20");
        payPeriod.setPeriodType(PeriodType.BIWEEKLY);
        payrollDetails.setPayPeriod(payPeriod);
        
        Earnings earnings = new Earnings();
        earnings.setRegularEarnings(2000.00);
        earnings.setOvertimeEarnings(150.00);
        payrollDetails.setEarnings(earnings);
        
        PreTaxDeductions preTaxDeductions = new PreTaxDeductions();
        preTaxDeductions.setRetirement401k(100.00);
        preTaxDeductions.setMedical(50.00);
        preTaxDeductions.setDental(10.00);
        preTaxDeductions.setVision(5.00);
        preTaxDeductions.setHsa(25.00);
        payrollDetails.setPreTaxDeductions(preTaxDeductions);
        
        FederalWithholding federalWithholding = new FederalWithholding();
        federalWithholding.setFilingStatus(FilingStatus.SINGLE);
        federalWithholding.setAllowances(1);
        payrollDetails.setFederalWithholding(federalWithholding);
        
        StateWithholding stateWithholding = new StateWithholding();
        stateWithholding.setFilingStatus(FilingStatus.SINGLE);
        stateWithholding.setAllowances(1);
        payrollDetails.setStateWithholding(stateWithholding);
        
        try {
            // Calculate taxes
            TaxResult result = taxEngine.calculateTaxes(employee, payrollDetails);
            
            // Display results
            System.out.printf("Federal Income Tax: $%.2f\n", result.getTaxes().getFederal().getFederalIncomeTax());
            System.out.printf("Social Security: $%.2f\n", result.getTaxes().getFederal().getSocialSecurity());
            System.out.printf("Medicare: $%.2f\n", result.getTaxes().getFederal().getMedicare());
            System.out.printf("State Income Tax: $%.2f\n", result.getTaxes().getState().getStateIncomeTax());
            System.out.printf("Net Pay: $%.2f\n", result.getNetPay());
        } catch (TaxCalculationException e) {
            System.out.println("Tax calculation error: " + e.getMessage());
        }
    }
}
```

## Location Code Service

The Saurellius Tax Engine uses location codes to precisely identify tax jurisdictions. Each location code consists of three parts:

1. **State number** - Numeric identifier for the state
2. **County number** - Numeric identifier for the county within the state
3. **Feature ID** - Identifier for the specific locality (city, municipality, township, etc.)

Location codes are permanent and based on the Geographic Names Information System (GNIS), the federal standard for geographic nomenclature. This ensures consistent tax jurisdiction identification even when political boundaries change.

### Using Location Codes

The STE can automatically determine the appropriate location codes from addresses through its geocoding service. However, if you already know the location codes for your employees, you can pass them directly:

```json
{
  "employee": {
    "id": "EMP12345",
    "homeLocationCode": "04-013-2409704",
    "workLocationCode": "04-013-2409704"
  }
}
```

## Updating Tax Data

The STE is regularly updated to reflect changes in tax laws across all jurisdictions. Updates are distributed in two ways:

### Web API Updates

For Web API customers, updates are automatically applied. You'll receive notifications about tax changes through:

1. **Saurellius Tax Notification Service** - Email alerts with change details
2. **Webhooks** - Real-time system-to-system notifications
3. **API Endpoints** - `/taxes/updates` endpoint to query recent changes

### On-Premise SDK Updates

For On-Premise SDK customers, you'll need to download and install updates:

1. Monthly scheduled updates
2. Interim releases during periods of high tax change activity
3. Critical updates for urgent tax changes

## Multi-State Taxation Handling

The STE handles complex multi-state taxation scenarios including:

1. **Reciprocity agreements** between states
2. **Nexus considerations** for employers
3. **Work-from-home** tax implications
4. **Multi-jurisdiction allocation** of taxes

### Example: Multi-State Implementation

```javascript
// Example of handling an employee who works in multiple states
const multiStateRequest = {
  employee: {
    id: "EMP12345",
    firstName: "Jane",
    lastName: "Doe",
    ssn: "123-45-6789",
    homeAddress: {
      street1: "123 Home St",
      city: "Trenton",
      state: "NJ",
      zipCode: "08608"
    }
  },
  payPeriod: {
    startDate: "2025-03-01",
    endDate: "2025-03-15",
    payDate: "2025-03-20",
    periodType: "biweekly"
  },
  earnings: {
    totalEarnings: 3000.00
  },
  workLocations: [
    {
      state: "NJ",
      workAddress: {
        street1: "100 NJ Office",
        city: "Trenton",
        state: "NJ",
        zipCode: "08608"
      },
      daysWorked: 6,
      percentageOfTime: 60,
      earningsForLocation: 1800.00
    },
    {
      state: "NY",
      workAddress: {
        street1: "200 NY Office",
        city: "New York",
        state: "NY",
        zipCode: "10001"
      },
      daysWorked: 4,
      percentageOfTime: 40,
      earningsForLocation: 1200.00
    }
  ],
  preTaxDeductions: {
    total: 200.00
  },
  postTaxDeductions: {
    total: 50.00
  }
};

// Calculate multi-state taxes
const multiStateResult = await fetch('https://api.saurellius.com/v1/multistate/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'ApiKey YOUR_API_KEY'
  },
  body: JSON.stringify(multiStateRequest)
});
```

## Performance Considerations

The Saurellius Tax Engine is designed for high performance:

- Average calculation time of 3 milliseconds per calculation
- Capacity to handle 100,000+ gross-to-net calculations in 5 minutes
- Automatic load balancing and scaling (Web API)
- Optimized memory usage (On-Premise SDK)

### Batch Processing

For high-volume payroll processing, use the batch endpoints:

```javascript
// Example batch processing
const batchRequest = {
  payPeriod: {
    startDate: "2025-03-01",
    endDate: "2025-03-15",
    payDate: "2025-03-20",
    periodType: "biweekly"
  },
  employees: [
    // Array of up to 1000 employee records
    {
      id: "EMP12345",
      // Employee data
    },
    {
      id: "EMP12346",
      // Employee data
    }
    // ... more employees
  ]
};

const batchResult = await fetch('https://api.saurellius.com/v1/calculate/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'ApiKey YOUR_API_KEY'
  },
  body: JSON.stringify(batchRequest)
});
```

## Security and Compliance

The Saurellius Tax Engine is designed with security and compliance as top priorities:

- **Data Encryption**: All data is encrypted in transit
- **No Data Storage**: Personal data is not stored after calculations
- **Input Validation**: All input data is validated for security
- **API Key Authentication**: Secure access control for all API endpoints
- **SOC 2 Compliance**: Regular security audits and compliance certifications

## Support and Resources

Saurellius Software provides comprehensive support for the Tax Engine:

- **Documentation**: Detailed API documentation and implementation guides
- **Support Portal**: Ticket-based support system
- **Developer Community**: Forum for developer questions and best practices
- **Tax Updates Newsletter**: Regular updates on tax law changes
- **Implementation Consulting**: Expert guidance for complex implementations

Contact information:
- Email: support@saurellius.com
- Phone: (555) 555-1500
- Website: saurellius.com