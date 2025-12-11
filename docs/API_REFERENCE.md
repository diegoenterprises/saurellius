# Saurellius API Reference

Complete API documentation for all platform endpoints.

## Base URL

```
Production: https://api.saurellius.com
Development: http://localhost:5001
```

## Authentication

All API requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## API Modules

### Payroll Processing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payroll/runs` | GET | List payroll runs |
| `/api/payroll/runs` | POST | Create new payroll run |
| `/api/payroll/runs/{id}/process` | POST | Process payroll |
| `/api/payroll/runs/{id}/approve` | POST | Approve payroll |
| `/api/paystubs` | GET | List paystubs |
| `/api/paystubs/{id}` | GET | Get paystub details |
| `/api/paystubs/{id}/pdf` | GET | Generate PDF |

### Tax Engine

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/tax/calculate/gross-to-net` | POST | Calculate taxes from gross |
| `/api/v2/tax/calculate/gross-up` | POST | Calculate gross from net |
| `/api/v2/tax/rates` | GET | Get current tax rates |
| `/api/v2/tax/jurisdictions` | GET | List tax jurisdictions |

### Tax Auto-Updater

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tax-updater/status` | GET | Get updater status |
| `/api/tax-updater/rates` | GET | Get current cached rates |
| `/api/tax-updater/jurisdictions` | GET | List supported jurisdictions |
| `/api/tax-updater/force-update` | POST | Force immediate update |
| `/api/tax-updater/start` | POST | Start auto-updater |
| `/api/tax-updater/stop` | POST | Stop auto-updater |

### Benefits Administration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/benefits/plans` | GET | List benefit plans |
| `/api/benefits/enrollments` | GET | List enrollments |
| `/api/benefits/enrollments` | POST | Enroll employee |
| `/api/benefits/retirement/enrollment` | POST | 401(k) enrollment |
| `/api/benefits/retirement/vesting/{id}` | GET | Get vesting status |
| `/api/benefits/fmla/eligibility/{id}` | GET | Check FMLA eligibility |
| `/api/benefits/fmla/request` | POST | Create FMLA request |
| `/api/benefits/cobra/events` | GET | List COBRA events |

### Talent Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/talent/jobs` | GET | List job postings |
| `/api/talent/jobs` | POST | Create job posting |
| `/api/talent/applications` | GET | List applications |
| `/api/talent/applications` | POST | Submit application |
| `/api/talent/applications/{id}/stage` | PUT | Update pipeline stage |
| `/api/talent/applications/{id}/interview` | POST | Schedule interview |
| `/api/talent/reviews` | GET | List performance reviews |
| `/api/talent/reviews` | POST | Create review |
| `/api/talent/goals` | GET | List goals |
| `/api/talent/goals` | POST | Create goal |
| `/api/talent/goals/{id}/progress` | PUT | Update progress |
| `/api/talent/courses` | GET | List training courses |
| `/api/talent/courses/{id}/enroll` | POST | Enroll in course |
| `/api/talent/feedback-360` | GET | Get 360 feedback |
| `/api/talent/succession` | GET | Get succession plans |
| `/api/talent/compensation/benchmark` | POST | Get salary benchmark |

### Employee Experience

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/employee-experience/wellness/assessment` | GET | Get wellness score |
| `/api/employee-experience/wellness/goals` | GET | Get wellness goals |
| `/api/employee-experience/wellness/goals` | POST | Create wellness goal |
| `/api/employee-experience/charitable/organizations` | GET | List charities |
| `/api/employee-experience/charitable/donations` | GET | Get donations |
| `/api/employee-experience/charitable/donations` | POST | Setup donation |
| `/api/employee-experience/charitable/matching` | GET | Get matching info |
| `/api/employee-experience/surveys` | GET | List surveys |
| `/api/employee-experience/surveys` | POST | Create survey |
| `/api/employee-experience/surveys/{id}/respond` | POST | Submit response |
| `/api/employee-experience/surveys/{id}/results` | GET | Get results |
| `/api/employee-experience/recognition/give` | POST | Give recognition |
| `/api/employee-experience/recognition/leaderboard` | GET | Get leaderboard |

### Time & Attendance

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/timeclock/punch` | POST | Clock in/out |
| `/api/timeclock/entries` | GET | List time entries |
| `/api/timeclock/weekly-summary/{id}` | GET | Get weekly hours |
| `/api/timeclock/approve` | POST | Approve timesheet |
| `/api/timeclock/projects` | GET | List projects |
| `/api/timeclock/projects` | POST | Create project |
| `/api/timeclock/job-codes` | GET | List job codes |
| `/api/timeclock/job-codes` | POST | Create job code |
| `/api/timeclock/allocate` | POST | Allocate time to project |

### Contractor Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contractors` | GET | List contractors |
| `/api/contractors` | POST | Create contractor |
| `/api/contractors/{id}/payments` | GET | Get payments |
| `/api/contractors/{id}/payments` | POST | Create payment |
| `/api/contractors/1099` | GET | List 1099 forms |
| `/api/contractors/1099/generate` | POST | Generate 1099 |
| `/api/contractors/1099/generate-all` | POST | Generate all 1099s |
| `/api/contractors/exchange-rates` | GET | Get USD/CAD rates |
| `/api/contractors/convert-currency` | POST | Convert currency |

### Reporting & Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports` | GET | List reports |
| `/api/reports/payroll-summary` | POST | Generate payroll summary |
| `/api/reports/tax-liability` | POST | Generate tax report |
| `/api/reports/labor-cost` | POST | Generate labor cost report |
| `/api/reports/analytics/dashboard` | GET | Get dashboard data |
| `/api/reports/analytics/turnover` | GET | Get turnover analytics |
| `/api/reports/analytics/predictions/headcount` | GET | Get headcount forecast |
| `/api/reports/custom` | POST | Create custom report |
| `/api/reports/{id}/export/{format}` | GET | Export report |

### Digital Wallet

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet/balance` | GET | Get wallet balance |
| `/api/wallet/transactions` | GET | List transactions |
| `/api/wallet/fund` | POST | Fund wallet |
| `/api/wallet/transfer` | POST | Transfer funds |
| `/api/wallet/ewa/request` | POST | Request EWA |
| `/api/wallet/ewa/eligibility` | GET | Check EWA eligibility |

### AI Services (34 Features)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/assistant` | POST | Universal platform-aware assistant |
| `/api/ai/chat` | POST | AI chat assistant |
| `/api/ai/chat/contextual` | POST | Context-aware chat |
| `/api/ai/paystub/validate` | POST | Validate paystub |
| `/api/ai/dashboard/insights` | POST | Get dashboard insights |
| `/api/ai/compliance/check` | POST | Check compliance |

**Talent Management AI:**
| `/api/ai/talent/analyze-candidate` | POST | Score candidates, interview questions |
| `/api/ai/talent/generate-review` | POST | AI-assisted performance reviews |
| `/api/ai/talent/learning-path` | POST | Personalized learning recommendations |

**Employee Experience AI:**
| `/api/ai/experience/financial-wellness` | POST | Financial health scoring |
| `/api/ai/experience/survey-analysis` | POST | Engagement survey analytics |

**Benefits & Retirement AI:**
| `/api/ai/benefits/optimize-selection` | POST | Personalized plan recommendations |
| `/api/ai/benefits/retirement-readiness` | POST | 401(k) readiness analysis |

**Labor & Job Costing AI:**
| `/api/ai/labor/project-profitability` | POST | Project health and profit analysis |
| `/api/ai/labor/forecast` | POST | Labor demand forecasting |

**Contractor & Tax AI:**
| `/api/ai/contractor/analyze` | POST | Misclassification risk detection |
| `/api/ai/tax/analyze` | POST | Tax optimization opportunities |

**Wallet Intelligence:**
| `/api/ai/wallet/analyze-transaction` | POST | Fraud detection |
| `/api/ai/wallet/insights` | POST | Spending insights |
| `/api/ai/wallet/analyze-ewa` | POST | EWA risk assessment |

**Scheduling Intelligence:**
| `/api/ai/schedule/optimize` | POST | Schedule optimization |
| `/api/ai/schedule/predict` | POST | Demand forecasting |
| `/api/ai/schedule/analyze-swap` | POST | Shift swap analysis |

**Payroll Intelligence:**
| `/api/ai/payroll/analyze-run` | POST | Pre-run validation |
| `/api/ai/payroll/optimizations` | POST | Cost optimization suggestions |

**Smart Notifications:**
| `/api/ai/alerts/generate` | POST | Generate priority alerts |
| `/api/ai/alerts/preferences` | POST | Personalize notification delivery |

| `/api/ai/status` | GET | Check AI service status |

---

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Rate Limits

| Tier | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Standard | 60 | 10,000 |
| Professional | 300 | 50,000 |
| Enterprise | 1,000 | Unlimited |

---

*Last updated: December 2024*
