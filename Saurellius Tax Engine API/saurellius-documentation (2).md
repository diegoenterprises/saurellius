# Saurellius Cloud Payroll & HR Management
## 2025 Developed by Dr. Paystub Corp™

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [System Architecture](#system-architecture)
3. [Key Components](#key-components)
4. [Technical Specifications](#technical-specifications)
5. [Development Environment Setup](#development-environment-setup)
6. [Implementation Guide](#implementation-guide)
7. [API Integration](#api-integration)
8. [Multi-Jurisdiction Support](#multi-jurisdiction-support)
9. [U.S. Territory Compliance](#us-territory-compliance)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guidelines](#deployment-guidelines)
12. [Performance Considerations](#performance-considerations)
13. [Security Requirements](#security-requirements)
14. [Roadmap and Future Enhancements](#roadmap-and-future-enhancements)

---

## Platform Overview

Saurellius is a comprehensive payroll and HR management platform designed to handle complex business requirements across all 50 U.S. states and territories (Puerto Rico, U.S. Virgin Islands, Guam, American Samoa, and Northern Mariana Islands). The platform excels at multi-jurisdiction tax calculations, employee management, benefits administration, and time tracking with full territory compliance.

### Core Capabilities

- **Multi-jurisdiction payroll processing**: Handles employees working across multiple states and territories with different tax regulations
- **Territory-specific compliance**: Specializes in U.S. territory tax regulations and labor laws
- **Comprehensive employee management**: Tracks employee data across jurisdictions with specialized territory indicators
- **Complete payroll calculations**: Processes all aspects of payroll including taxes, deductions, garnishments, and benefits
- **Tax jurisdiction management**: Calculates and allocates taxes across different work locations
- **Benefits administration**: Manages health, retirement, and other benefits with territory-specific rules
- **Time and attendance tracking**: Tracks employee hours with geolocation verification
- **Digital wallet and early wage access**: Provides financial services for employees
- **AI-powered assistance**: Provides intelligent guidance on platform usage and compliance

---

## System Architecture

Saurellius follows a modern frontend architecture with a modular, service-oriented design.

### Frontend Architecture

- **Framework**: React (TypeScript)
- **State Management**: Redux Toolkit with slice pattern
- **Routing**: React Router v6
- **UI Components**: Material UI
- **Theming**: Custom Theme Context with light/dark mode
- **API Communication**: Axios with centralized services
- **Form Handling**: React Hook Form with Yup validation

### Backend Services (integration points)

- **Symmetry Tax Engine**: For complex tax calculations across 7,400+ jurisdictions
- **Geocoding Service**: For location verification and tax jurisdiction determination
- **Banking APIs**: For digital wallet and early wage access
- **Document Generation**: For payslips, tax forms, and reports

### Data Flow

1. User interactions trigger Redux actions
2. Thunks and services make API calls to backend services
3. Reducer functions update state based on API responses
4. Components re-render with updated data
5. Services handle complex calculations and third-party integrations

### Component Communication

![Architecture Diagram](architecture-diagram.png)

1. **Components → Redux**: Components dispatch actions to request data or perform operations
2. **Redux → Services**: Thunks call services to handle API requests and calculations
3. **Services → External APIs**: Services communicate with backend APIs and third-party services
4. **Redux → Components**: Components subscribe to Redux state for updates

---

## Key Components

### Core Modules

#### 1. Employee Management
- **Purpose**: Manage employee data with multi-jurisdiction support
- **Key Features**:
  - Employee records with territory indicators
  - Multi-state/territory employment tracking
  - Employee directory with filtering and sorting
  - Import/export with territory-specific fields

#### 2. Payroll Processing
- **Purpose**: Process payroll with multi-jurisdiction tax calculations
- **Key Features**:
  - Step-by-step payroll run wizard
  - Multi-state/territory tax calculations
  - Symmetry Tax Engine integration
  - Territory-specific tax forms and compliance

#### 3. Tax Jurisdiction Management
- **Purpose**: Manage work allocations across jurisdictions
- **Key Features**:
  - Jurisdiction allocation percentages
  - Reciprocity agreement handling
  - Territory-specific tax rates
  - Multi-state tax calculation

#### 4. Time and Attendance
- **Purpose**: Track employee hours and schedules
- **Key Features**:
  - Geolocation verification
  - Schedule management
  - Time off tracking
  - Overtime calculations with territory rules

#### 5. Benefits Management
- **Purpose**: Manage employee benefits with territory compliance
- **Key Features**:
  - Health, retirement, and supplemental benefits
  - Open enrollment period management
  - Territory-specific benefits regulations
  - Benefit deduction calculations

#### 6. Digital Wallet
- **Purpose**: Provide financial services for employees
- **Key Features**:
  - Early wage access
  - Virtual and physical payment cards
  - Fund transfers
  - Transaction history

#### 7. Reports and Analytics
- **Purpose**: Generate reports with territory compliance
- **Key Features**:
  - Standard and custom reports
  - Territory-specific tax forms
  - Multi-jurisdiction reporting
  - Compliance documentation

#### 8. AI Assistant
- **Purpose**: Provide intelligent guidance on platform usage
- **Key Features**:
  - Contextual help and insights
  - Territory-specific compliance guidance
  - Natural language query processing
  - Personalized recommendations

### Utility Components

#### 1. PayrollCalculator
- **Purpose**: Handle all payroll calculations
- **Key Features**:
  - Regular and overtime wages
  - Deductions and garnishments
  - Tax calculations and allocations
  - Territory-specific adjustments

#### 2. TerritoryComplianceBox
- **Purpose**: Display territory-specific compliance information
- **Key Features**:
  - Contextual compliance warnings
  - Territory-specific requirements
  - Expandable details
  - Visual indicators for territories

#### 3. TimeStatusIndicator
- **Purpose**: Display time with seasonal and time-of-day adaptations
- **Key Features**:
  - Seasonal visual elements
  - Time-of-day adaptations
  - Compact and expanded modes
  - Hemisphere awareness

---

## Technical Specifications

### Frontend Requirements

- **Node.js**: v16.x or higher
- **React**: v18.x
- **Redux Toolkit**: v1.9.x
- **TypeScript**: v4.9.x
- **Material UI**: v5.x
- **React Router**: v6.x
- **Axios**: v1.3.x
- **Day.js**: v1.11.x
- **React Hook Form**: v7.x
- **Yup**: v1.x
- **Chart.js**: v4.x
- **React Testing Library**: v13.x

### Backend Integration Points

- **Authentication API**: JWT-based authentication
- **Employee API**: CRUD operations for employee data
- **Payroll API**: Payroll processing and calculations
- **Tax API**: Tax jurisdiction and calculation services
- **Time Tracking API**: Time entries and scheduling
- **Benefits API**: Benefits enrollment and deductions
- **Reports API**: Report generation and delivery
- **Wallet API**: Digital wallet and financial services

### Third-Party Services

- **Symmetry Tax Engine**: Tax calculation service for 7,400+ jurisdictions
- **Geocoding API**: Location verification and jurisdiction determination
- **Banking Integration**: For direct deposit and early wage access
- **Document Generation**: For tax forms and reports
- **File Storage**: For document management

---

## Development Environment Setup

### Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher) or yarn (v1.22.x or higher)
- Git
- IDE with TypeScript support (VS Code recommended)

### Initial Setup

1. Clone the repository

```bash
git clone https://github.com/your-org/saurellius.git
cd saurellius
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` to include your API keys and endpoints:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_TAX_ENGINE_URL=https://api.symmetry.com/taxengine
REACT_APP_ENVIRONMENT=development
```

4. Start the development server

```bash
npm start
# or
yarn start
```

### Project Structure

```
saurellius/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/          # Shared UI components
│   │   ├── layout/          # Layout components
│   │   ├── employees/       # Employee-related components
│   │   ├── payroll/         # Payroll-related components
│   │   └── ...              # Other component categories
│   ├── contexts/            # React contexts
│   ├── features/            # Feature-specific components
│   │   ├── auth/            # Authentication features
│   │   ├── dashboard/       # Dashboard features
│   │   ├── employees/       # Employee management features
│   │   └── ...              # Other feature categories
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API and calculation services
│   ├── store/               # Redux store
│   │   ├── slices/          # Redux slices
│   │   └── middleware/      # Redux middleware
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main application component
│   └── index.tsx            # Application entry point
├── .env.example             # Example environment variables
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project readme
```

---

## Implementation Guide

### Step 1: Core Setup

1. Set up the project structure
2. Configure Redux store and slices
3. Implement ThemeContext for styling
4. Create MainLayout with navigation

### Step 2: Authentication System

1. Implement AuthContext and authentication logic
2. Create login/register forms
3. Set up protected routes
4. Implement user session management

### Step 3: Employee Management

1. Implement EmployeeManagement component
2. Create EmployeeForm with territory support
3. Set up employee filtering and searching
4. Implement TerritoryComplianceBox for territory-specific notices

### Step 4: Tax Jurisdiction System

1. Implement TaxJurisdictionManager
2. Create jurisdiction allocation interface
3. Set up reciprocity agreement handling
4. Implement territory-specific tax calculations

### Step 5: Payroll Processing

1. Implement PayrollCalculator utility
2. Create PayrollService for integration
3. Implement PayrollRun component with step wizard
4. Set up territory-specific payroll adjustments

### Step 6: Time and Attendance

1. Implement TimeTracking component
2. Create ScheduleManagement features
3. Set up geolocation verification
4. Implement territory-specific overtime rules

### Step 7: Benefits Management

1. Implement BenefitsManagement component
2. Create benefit enrollment features
3. Set up territory-specific benefit rules
4. Implement deduction calculations

### Step 8: Digital Wallet

1. Implement DigitalWallet component
2. Create early wage access features
3. Set up payment card management
4. Implement transaction history

### Step 9: Reports and Analytics

1. Implement Reports component
2. Create standard report templates
3. Set up territory-specific tax forms
4. Implement custom report builder

### Step 10: AI Assistant

1. Implement SaurelliusAIAssistant component
2. Create conversation interface
3. Set up contextual suggestions
4. Implement territory-specific guidance

---

## API Integration

### Authentication API

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Employee API

- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `PATCH /api/employees/:id/archive` - Archive employee
- `POST /api/employees/import` - Import employees
- `GET /api/employees/export` - Export employees

### Payroll API

- `GET /api/pay-periods/:companyId` - Get pay periods
- `GET /api/payroll-employees` - Get employees for payroll
- `POST /api/payroll-calculations` - Calculate employee pay
- `POST /api/payroll-runs` - Start payroll run
- `POST /api/payroll-runs/:id/submit` - Submit payroll run
- `GET /api/payroll-runs/:id` - Get payroll run details

### Tax API

- `GET /api/taxes/jurisdictions/:employeeId` - Get employee tax jurisdictions
- `PUT /api/taxes/jurisdictions/:employeeId/allocations` - Update work allocations
- `POST /api/taxes/jurisdictions/:employeeId/save` - Save jurisdiction changes
- `GET /api/taxes/rates` - Get tax rates for jurisdictions

### Time Tracking API

- `GET /api/time-entries` - Get time entries
- `POST /api/time-entries/clock-in` - Clock in
- `POST /api/time-entries/clock-out` - Clock out
- `POST /api/time-entries/break/start` - Start break
- `POST /api/time-entries/break/end` - End break
- `POST /api/time-sheets/submit` - Submit time sheet

### Benefits API

- `GET /api/benefits/plans` - Get benefit plans
- `GET /api/benefits/employee/:id` - Get employee benefits
- `PUT /api/benefits/employee/:id` - Update employee benefits
- `GET /api/benefits/open-enrollment` - Get open enrollment period
- `PUT /api/benefits/open-enrollment` - Set open enrollment period

### Reports API

- `GET /api/reports/list` - Get available reports
- `POST /api/reports/generate` - Generate report
- `GET /api/reports/saved` - Get saved reports
- `POST /api/reports/schedule` - Schedule report

### Wallet API

- `GET /api/wallet/:userId` - Get wallet details
- `GET /api/wallet/:userId/transactions` - Get transaction history
- `GET /api/wallet/:userId/cards` - Get payment cards
- `POST /api/wallet/early-access` - Request early wage access
- `POST /api/wallet/request-card` - Request payment card
- `POST /api/wallet/transfer` - Transfer funds

---

## Multi-Jurisdiction Support

### Work Allocation Percentages

Saurellius uses a work allocation system to distribute an employee's income across multiple jurisdictions:

1. Each work location is assigned a percentage allocation
2. Allocations must sum to 100%
3. Income is distributed according to these percentages
4. Each jurisdiction applies its tax rules to its portion of income

```javascript
// Sample allocation structure
const allocations = [
  { locationId: "1", state: "NY", percentage: 60 },
  { locationId: "2", state: "NJ", percentage: 40 }
];
```

### Reciprocity Agreements

The system manages state tax reciprocity agreements:

1. Identifies applicable agreements between states
2. Applies correct withholding based on agreements
3. Handles credit for taxes paid to other states
4. Supports special provisions for neighboring territories

```javascript
// Sample reciprocity agreement structure
const reciprocityAgreement = {
  id: "NY-NJ",
  states: ["NY", "NJ"],
  description: "New York and New Jersey Tax Reciprocity",
  effectiveDate: "1990-01-01",
  limitations: "Only applies to commuters"
};
```

### Symmetry Tax Engine Integration

For accurate tax calculations, Saurellius integrates with the Symmetry Tax Engine:

1. Sends employee and jurisdiction data to the engine
2. Receives tax rates for all applicable jurisdictions
3. Applies rates based on allocation percentages
4. Handles special territory tax rules

```javascript
// Sample tax engine request
const request = {
  employee: employeeData,
  jurisdictions: {
    residential: residentialJurisdiction,
    work: workJurisdictions
  },
  allocations: allocations
};
```

---

## U.S. Territory Compliance

### Puerto Rico

- **Tax Forms**: Uses Form 499R-2/W-2PR instead of W-2
- **Christmas Bonus**: Mandatory annual bonus (Bono de Navidad)
- **Special Deductions**: Certain voluntary deductions exempt from FICA
- **Local Taxes**: Municipal taxes vary by location

### U.S. Virgin Islands

- **Mirror Tax System**: Based on U.S. federal tax code
- **Form W-2VI**: Special territory-specific W-2 form
- **Special Credits**: Non-refundable territory income tax credits
- **Local Taxes**: Custom local tax certificates may be required

### Guam

- **Mirror Tax System**: Based on U.S. federal tax code
- **Form W-2GU**: Special territory-specific W-2 form
- **Military Provisions**: Special rules for military personnel
- **Business Privilege Tax**: Additional tax considerations

### American Samoa

- **Territory Tax System**: Unique territorial income tax system
- **Form W-2AS**: Special territory-specific W-2 form
- **U.S. National Provisions**: Special rules for U.S. nationals
- **Deduction Rules**: Territory-specific deduction rules

### Northern Mariana Islands

- **Mirror Tax System**: Based on U.S. federal tax code with modifications
- **Form W-2CM**: Special territory-specific W-2 form
- **Covenant Agreement**: Special provisions under Covenant Agreement
- **Rebate Credits**: Rebate credit system for certain income taxes

### Implementation Strategy

Saurellius handles these territory-specific requirements through:

1. **Territory Detection**: Automatically detects when employees are in territories
2. **Compliance Indicators**: Visual indicators for territory jurisdiction
3. **Custom Calculations**: Territory-specific tax and benefit calculations
4. **Specialized Forms**: Correct tax forms for each territory
5. **Compliance Boxes**: Context-sensitive compliance information

---

## Testing Strategy

### Unit Testing

- **Components**: Test individual component rendering and behavior
- **Services**: Test calculation and API service functions
- **Redux**: Test actions, reducers, and selectors
- **Utilities**: Test helper functions and calculations

```javascript
// Sample component test
test('TerritoryComplianceBox renders with correct territory details', () => {
  render(<TerritoryComplianceBox territory="PR" />);
  expect(screen.getByText('Puerto Rico')).toBeInTheDocument();
  expect(screen.getByText('Form 499R-2/W-2PR required')).toBeInTheDocument();
});
```

### Integration Testing

- **Component Interactions**: Test component communication
- **Redux Integration**: Test components with Redux store
- **API Mocking**: Test with mocked API responses
- **Form Submissions**: Test complete form workflows

```javascript
// Sample integration test
test('PayrollRun calculates correct taxes for Puerto Rico employee', async () => {
  // Mock API responses
  mockAxios.onGet('/api/employees').reply(200, prEmployeesData);
  mockAxios.onGet('/api/taxes/jurisdictions').reply(200, prJurisdictionData);
  
  render(<Provider store={store}><PayrollRun /></Provider>);
  // Test the complete payroll workflow
});
```

### End-to-End Testing

- **Complete Workflows**: Test full business processes
- **Browser Compatibility**: Test across different browsers
- **Responsive Design**: Test on different screen sizes
- **Performance**: Test loading times and resource usage

### Specialized Testing

- **Tax Calculation Testing**: Verify calculations against known examples
- **Multi-Jurisdiction Testing**: Test allocation and distribution logic
- **Territory Compliance Testing**: Verify territory-specific rules
- **Edge Cases**: Test boundary conditions and rare scenarios

---

## Deployment Guidelines

### Environment Configuration

- **Development**: Local development environment
- **Testing**: Dedicated QA environment
- **Staging**: Pre-production environment
- **Production**: Live environment

### Environment Variables

- `REACT_APP_API_URL`: Backend API endpoint
- `REACT_APP_TAX_ENGINE_URL`: Symmetry Tax Engine endpoint
- `REACT_APP_ENVIRONMENT`: Current environment (development, testing, staging, production)

### Build Process

1. **Install Dependencies**

```bash
npm install
# or
yarn install
```

2. **Build for Production**

```bash
npm run build
# or
yarn build
```

3. **Test Build**

```bash
npm run test
# or
yarn test
```

### Deployment Options

1. **Static Hosting**
   - AWS S3 + CloudFront
   - Netlify
   - Vercel
   - Azure Static Web Apps

2. **Container Deployment**
   - Docker container
   - Kubernetes cluster
   - AWS ECS

3. **Traditional Hosting**
   - Apache or Nginx web server
   - Server-side rendering option

### CI/CD Pipeline

1. **Code Push**: Developer pushes code to repository
2. **Automated Tests**: Run unit and integration tests
3. **Build**: Create production build
4. **Staging Deployment**: Deploy to staging environment
5. **User Acceptance Testing**: Test in staging environment
6. **Production Deployment**: Deploy to production environment
7. **Monitoring**: Monitor for errors and performance issues

---

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**: Split bundles by route and feature
2. **Lazy Loading**: Load components only when needed
3. **Memoization**: Use React.memo, useMemo, and useCallback
4. **Redux Selectors**: Optimize state access with selectors
5. **Virtualization**: Use virtualized lists for large datasets

### Performance Metrics

- **First Contentful Paint (FCP)**: Under 1.8 seconds
- **Time to Interactive (TTI)**: Under 3.5 seconds
- **Total Bundle Size**: Under 500KB (gzipped)
- **API Response Time**: Under 300ms for 95% of requests

### Handling Large Datasets

- **Pagination**: Implement server-side pagination
- **Filtering**: Apply server-side filtering
- **Sorting**: Implement efficient sorting algorithms
- **Caching**: Cache frequently accessed data

### Optimizing Calculations

- **Worker Threads**: Use Web Workers for complex calculations
- **Batch Processing**: Process large datasets in batches
- **Incremental Updates**: Update UI incrementally during long operations
- **Cached Calculations**: Store and reuse calculation results when possible

---

## Security Requirements

### Authentication and Authorization

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for different roles
- **Session Management**: Secure handling of user sessions
- **Password Policies**: Strong password requirements

### Data Protection

- **HTTPS**: Secure communication over SSL/TLS
- **Input Validation**: Validate all user inputs
- **Output Encoding**: Prevent XSS attacks
- **CSRF Protection**: Protect against cross-site request forgery

### Sensitive Data Handling

- **PII Protection**: Secure handling of personally identifiable information
- **Salary Information**: Restricted access to compensation data
- **Tax Information**: Secure handling of tax identification numbers
- **Banking Details**: Encrypted storage of banking information

### Compliance Requirements

- **SOC 2**: Security, availability, and confidentiality
- **GDPR**: Data protection and privacy
- **CCPA**: California Consumer Privacy Act
- **IRS Requirements**: Tax information handling
- **Territory Regulations**: Compliance with territory-specific data protection laws

---

## Roadmap and Future Enhancements

### Phase 1: Core Platform (Current)

- Multi-jurisdiction payroll processing
- Employee management with territory support
- Tax jurisdiction management
- Time and attendance tracking
- Basic reporting

### Phase 2: Enhanced Features

- Advanced benefits management
- Digital wallet and early wage access
- Extended territory compliance
- Enhanced reporting and analytics
- Mobile application

### Phase 3: Advanced Capabilities

- AI-powered insights and recommendations
- Predictive analytics
- Advanced scheduling optimization
- Global expansion beyond U.S. territories
- Integrated HR and talent management

### Future Considerations

- Blockchain for payroll transactions
- Machine learning for compliance monitoring
- Natural language processing for documentation
- Extended API for third-party integrations
- White-label customization options

---

## Appendix

### Glossary of Terms

- **Allocation Percentage**: Portion of income assigned to a tax jurisdiction
- **Reciprocity Agreement**: Agreement between states regarding taxation of non-residents
- **Territory**: U.S. territories (PR, VI, GU, AS, MP) with special tax rules
- **Symmetry Tax Engine**: Third-party service for tax calculations
- **Garnishment**: Court-ordered withholding from employee pay
- **Pre-tax Deduction**: Deduction taken before taxes are calculated
- **Post-tax Deduction**: Deduction taken after taxes are calculated

### Useful Resources

- [IRS Publication 80](https://www.irs.gov/pub/irs-pdf/p80.pdf) - Federal Tax Guide for Employers in U.S. Territories
- [Symmetry Tax Engine Documentation](https://docs.symmetry.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Material UI Documentation](https://mui.com/material-ui/getting-started/overview/)

### Contact Information

- **Technical Support**: support@saurellius.com
- **Development Team**: dev@saurellius.com
- **Tax Compliance Team**: compliance@saurellius.com

---

Document Version: 1.0  
Last Updated: March 18, 2025  
Author: Saurellius Development Team

## Version History
| Version | Release Date | Description |
|---------|-------------|-------------|
| v1.0.0 | Mar 18, 2025 | Initial release with core functionality and territory support |
| v1.1.0 | Apr 22, 2025 | Addition of AI Assistant and enhanced tax calculation engine |
| v1.2.0 | May 15, 2025 | Expanded territory compliance features and multi-jurisdiction improvements |
| v1.3.0 | Jun 20, 2025 | Enhanced digital wallet with early wage access functionality |
| v1.4.0 | Jul 25, 2025 | Advanced benefits administration with territory-specific rules |
| v1.5.0 | Sep 10, 2025 | Comprehensive reporting system with tax form generation |

© 2025 Dr. Paystub Corp™. All Rights Reserved.
This documentation is confidential and proprietary to Dr. Paystub Corp. It contains trade secrets and sensitive implementation details for the Saurellius Cloud Payroll & HR Management platform. It may not be shared, reproduced, or distributed without express written permission from Dr. Paystub Corp. Unauthorized use or disclosure may result in legal action.

The Saurellius™ name, logo, and all related product names are trademarks of Dr. Paystub Corp.
