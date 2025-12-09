# SAURELLIUS

### Cloud Payroll Management Platform

<div align="center">

![Saurellius](https://img.shields.io/badge/Saurellius-1473FF?style=flat-square)
![Version](https://img.shields.io/badge/v1.0.0-333333?style=flat-square)
![Platform](https://img.shields.io/badge/iOS%20%7C%20Android%20%7C%20Web-666666?style=flat-square)

The complete enterprise payroll, workforce management, and team communication platform.

[Features](#features) | [Architecture](#architecture) | [Project Structure](#project-structure) | [API Reference](#api-reference) | [Getting Started](#getting-started)

</div>

---

## Overview

Saurellius Cloud Payroll Management is a full-featured enterprise platform that handles every aspect of payroll processing, employee management, time tracking, workforce scheduling, and internal communications.

### Platform Capabilities

| Category | Features |
|----------|----------|
| **Payroll Processing** | 25 paystub themes, PDF generation, QR verification, YTD tracking |
| **Tax Compliance** | 50 U.S. states + D.C., tax brackets, SUTA/SDI/PFL, overtime rules |
| **Benefits & Insurance** | Medical, Dental, Vision, Life, Disability, 401(k), FSA/HSA, COBRA |
| **AI Assistant** | Google Gemini-powered payroll advisor, compliance checker, onboarding helper |
| **Employee Management** | Profiles, W-4 info, direct deposit, document storage |
| **Time & Attendance** | Clock in/out, break tracking, GPS location, weekly timesheets |
| **Workforce Scheduling** | Weekly grid view, position color-coding, overtime alerts, publish & notify |
| **Schedule Swapping** | Employee requests, peer acceptance, manager approval workflow |
| **Communications** | Direct messages, channels, announcements, recognition/kudos system |
| **Rewards System** | Points, tiers (Bronze to Diamond), badges, streak bonuses |
| **Billing** | Stripe integration, 3 tiers ($50/$100/$150), paystub-based pricing |
| **Weather Integration** | Location-based weather for dashboard |
| **Email System** | Transactional emails via Resend |
| **Tax Engine API** | Open API for enterprise partners, 7,400+ jurisdictions, real-time tax calculations |
| **DocuGinuity Compliance** | Automated document tracking, I-9, W-4, W-2, 941, 1099, filing calendars |
| **Admin Portal** | Platform analytics, KPIs, API usage tracking, Stripe integration |

---

## Features

### Paystub Generator
- **25 Professional Themes** — Diego's Original, Modern Tech, Ocean Breeze, Forest Green, Sunset Orange, Royal Purple, Midnight Blue, Rose Gold, Electric Lime, Cherry Red, Arctic Silver, Golden Hour, Coral Reef, Steel Gray, Emerald City, Lavender Dream, Copper Tone, Ice Blue, Burgundy Wine, Sage Green, Peach Glow, Navy Command, Teal Wave, Charcoal Slate, Carbon Black
- **Security Features** — QR code verification, document hash, holographic seal, watermarks
- **PDF Generation** — Playwright + Chromium headless browser rendering

### Saurellius AI
- **Gemini Pro Integration** — Natural language payroll assistance
- **AI Chat** — Ask questions about taxes, deductions, compliance
- **Compliance Checker** — Verify payroll against state regulations
- **Onboarding Helper** — Guide new users through setup
- **Paystub Helper** — Assist with paystub generation
- **Plan Recommendations** — Suggest optimal subscription tier

### State Compliance Engine
- **50 States + D.C.** — Complete U.S. coverage
- **Tax Calculations** — Federal, state, local income tax
- **Special Rules** — California daily overtime, NY PFL, state-specific deductions
- **SDI States** — California, Hawaii, New Jersey, New York, Rhode Island
- **No-Tax States** — Texas, Florida, Washington, Nevada, Wyoming, Alaska, South Dakota, Tennessee, New Hampshire

### Communications Hub
- **Direct Messages** — 1:1 encrypted employee chat
- **Channels** — Team, department, project groups
- **Announcements** — Company-wide broadcasts with priority levels
- **Recognition System** — 10 kudos badges with point values
- **Notifications** — Real-time alerts with read receipts
- **Presence Status** — Online, away, busy indicators

### SWIPE — Schedule Swap System
- **Shift Matching** — Find compatible swap partners
- **Request Flow** — Create request → Peer accepts → Manager approves
- **Overtime Protection** — Automatic compliance checking
- **Status Tracking** — Pending, accepted, declined, approved, denied, cancelled, expired
- **History & Analytics** — Complete swap audit trail

### WORKFORCE — Real-Time Monitoring
- **Weekly Schedule Grid** — Employees × Days matrix view
- **Position Color Coding** — Pastel theme per role (Manager, Designer, Developer, Chef, Server, Host, Assistant)
- **Live Status** — Clocked in, on break, clocked out, time off
- **Overtime Alerts** — Visual warnings for 40+ hour weeks
- **Publish & Notify** — Send schedules to employees instantly

### Timesheet & Attendance
- **Clock In/Out** — One-tap time tracking
- **Break Management** — Track paid and unpaid breaks
- **GPS Location** — Capture location on clock events
- **Weekly Summary** — Hours worked, overtime, PTO used
- **Timesheet Approval** — Manager review workflow

### Rewards & Gamification
- **Points System** — Earn points for actions
- **5 Tiers** — Bronze, Silver, Gold, Platinum, Diamond
- **Achievement Badges** — Unlock for milestones
- **Login Streaks** — Bonus points for consecutive days
- **Leaderboards** — Company-wide rankings

### Benefits & Insurance
- **Medical Plans** — PPO, HMO, HDHP options with cost comparison
- **Dental & Vision** — Preventive, basic, major coverage tiers
- **Life Insurance** — Basic, supplemental, AD&D options
- **Disability** — Short-term and long-term coverage
- **Retirement** — 401(k) with employer matching
- **FSA/HSA** — Healthcare and dependent care accounts
- **COBRA Administration** — Qualifying events, premium tracking

### Subscription & Billing
- **Stripe Integration** — Secure payment processing
- **3 Tiers** — Starter ($50), Professional ($100), Business ($150)
- **Paystub-Based Pricing** — 5/25/Unlimited paystubs per month
- **Overage Billing** — $5 per additional paystub (Starter/Professional)
- **Invoice History** — Download past invoices

### Saurellius Tax Engine API (Open API)
Enterprise-grade payroll tax calculation engine for partners.

- **7,400+ Tax Jurisdictions** — Federal, state, local, school district, transit
- **2025/2026 Tax Data** — Real IRS and state revenue data
- **Federal Taxes** — Income tax (7 brackets), Social Security ($176,100 wage base), Medicare with Additional Medicare
- **State Taxes** — All 50 states + D.C. (progressive and flat rates)
- **SDI/VDI** — California, Hawaii, New Jersey, New York, Rhode Island, Puerto Rico
- **Paid Family Leave (PFML)** — 12 states (CO, CT, DE, MA, MD, MN, NJ, NY, OR, RI, WA)
- **Local Taxes** — NYC, Philadelphia, Ohio cities, Maryland counties, transit districts
- **Multi-State Calculations** — Reciprocity agreements for 17 states
- **SUTA/FUTA** — State and federal unemployment for all states
- **Batch Processing** — Up to 10,000 employees per request (Ultimate tier)
- **3ms Average Response** — Enterprise performance

#### API Pricing Tiers

| Tier | Annual Price | Daily Limit | Overage Rate | Features |
|------|--------------|-------------|--------------|----------|
| Standard | $2,000 | 5,000 | $0.50/request | Federal + 10 states |
| Professional | $5,000 | 20,000 | $0.25/request | All states, multi-state, batch (100) |
| Enterprise | $10,000 | 100,000 | $0.10/request | Local taxes, webhooks, batch (1,000) |
| Ultimate | $15,000 | Unlimited | N/A | Full access, batch (10,000), white-label |

### DocuGinuity Compliance Module
Automated document compliance and tracking system.

- **Federal Forms** — I-9, W-4, W-2, W-3, 940, 941, 944, W-9, 1099-NEC, 1096, 1095-C, 1094-C
- **State W-4 Forms** — All 50 states (CA DE 4, NY IT-2104, IL IL-W-4, etc.)
- **2025 Filing Calendar** — All quarterly and annual deadlines
- **Onboarding Checklists** — Auto-generated with due dates (I-9 within 3 days)
- **Compliance Tracking** — Status, completion rate, missing/expiring documents
- **Deadline Alerts** — Upcoming filing reminders
- **Company Compliance Score** — Overall compliance status assessment

### Admin Portal
Platform owner dashboard for analytics and management.

- **Platform Analytics** — Users, companies, paystubs, revenue metrics
- **Tax Engine API Management** — Client usage tracking, tier management
- **Stripe Integration** — Subscription IDs, overage billing
- **Usage Monitoring** — Daily limits, overage calculations
- **System Health** — API server, database, payment processor status
- **User Management** — View and manage platform users

---

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React Native + Expo | Cross-platform mobile & web |
| **Language** | TypeScript | Type-safe frontend code |
| **Backend** | Python + Flask | REST API server |
| **ORM** | SQLAlchemy | Database abstraction |
| **Database** | PostgreSQL | Primary data store (AWS RDS) |
| **AI** | Google Gemini Pro | Natural language processing |
| **PDF** | Playwright + Chromium | Paystub rendering |
| **Payments** | Stripe | Subscription billing |
| **Email** | Resend | Transactional emails |
| **Weather** | OpenWeather API | Dashboard widget |
| **Auth** | JWT + bcrypt | Secure authentication |
| **Cloud** | AWS (RDS, S3, EC2) | Infrastructure |

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│   │   iOS App    │    │ Android App  │    │   Web App    │                 │
│   │ React Native │    │ React Native │    │    React     │                 │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                 │
│          │                   │                   │                          │
│          └───────────────────┼───────────────────┘                          │
│                              │                                               │
│                              ▼                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                         FLASK REST API (Port 5001)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │    Auth    │ │  Dashboard │ │  Paystubs  │ │  Employees │ │ Timesheet │ │
│  │   Routes   │ │   Routes   │ │   Routes   │ │   Routes   │ │  Routes   │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │     AI     │ │   State    │ │  Messaging │ │   SWIPE    │ │ WORKFORCE │ │
│  │   Routes   │ │   Routes   │ │   Routes   │ │   Routes   │ │  Routes   │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                               │
│  │   Stripe   │ │   Email    │ │  Weather   │                               │
│  │   Routes   │ │   Routes   │ │   Routes   │                               │
│  └────────────┘ └────────────┘ └────────────┘                               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                            SERVICE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │  Paystub Generator  │  │    Saurellius AI    │  │  State Payroll Rules│ │
│  │    (25 themes)      │  │   (Gemini Pro)      │  │    (50 states)      │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │ Communications Hub  │  │   SWIPE Service     │  │  WORKFORCE Service  │ │
│  │  (DM, Channels)     │  │ (Schedule Swap)     │  │  (Live Monitoring)  │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │   Email Service     │  │   Weather Service   │  │   Billing Service   │ │
│  │     (Resend)        │  │   (OpenWeather)     │  │     (Stripe)        │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PostgreSQL (AWS RDS)                             │   │
│  │  Users | Employees | Paystubs | Timesheets | Messages | Schedules   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
SAURELLIUS CLOUD PAYROLL MANAGEMENT/
│
├── backend/
│   │
│   ├── app.py                              # Flask application entry point
│   ├── config.py                           # Environment configuration
│   ├── models.py                           # SQLAlchemy database models
│   ├── billing.py                          # Stripe billing utilities
│   │
│   ├── routes/                             # API Route Handlers (20 files)
│   │   ├── __init__.py                     # Route exports
│   │   ├── auth_routes.py                  # Authentication (signup, login, logout)
│   │   ├── dashboard_routes.py             # Dashboard data aggregation
│   │   ├── paystub_routes.py               # Paystub CRUD operations
│   │   ├── paystub_generator_routes.py     # PDF generation with 25 themes
│   │   ├── state_rules_routes.py           # State tax compliance API
│   │   ├── ai_routes.py                    # Saurellius AI chat & helpers
│   │   ├── benefits_routes.py              # Benefits & Insurance API
│   │   ├── messaging_routes.py             # Communications Hub API
│   │   ├── swipe_routes.py                 # SWIPE schedule swap API
│   │   ├── workforce_routes.py             # WORKFORCE monitoring API
│   │   ├── stripe_routes.py                # Subscription billing API
│   │   ├── email_routes.py                 # Email sending API
│   │   ├── weather_routes.py               # Weather widget API
│   │   ├── tax_engine_routes.py            # Tax Engine Open API
│   │   ├── compliance_routes.py            # DocuGinuity compliance API
│   │   ├── admin_routes.py                 # Admin Portal API
│   │   ├── accounting_routes.py            # Accounting integrations
│   │   ├── contractor_routes.py            # 1099 contractor management
│   │   └── pto_routes.py                   # PTO and leave management
│   │
│   └── services/                           # Business Logic Layer (15 files)
│       ├── __init__.py                     # Service exports
│       ├── paystub_generator.py            # 25 themes, PDF, security features
│       ├── state_payroll_rules.py          # 50 states + D.C. tax rules
│       ├── gemini_service.py               # Saurellius AI (Gemini Pro)
│       ├── benefits_service.py             # Benefits, insurance, COBRA management
│       ├── messaging_service.py            # DM, channels, kudos, notifications
│       ├── swipe_service.py                # Schedule swap matching & approval
│       ├── workforce_service.py            # Real-time monitoring & scheduling
│       ├── email_service.py                # Resend email integration
│       ├── weather_service.py              # OpenWeather API integration
│       ├── tax_engine_service.py           # Tax Engine (2025/2026 tax data)
│       ├── compliance_service.py           # DocuGinuity compliance tracking
│       ├── accounting_service.py           # Accounting integrations
│       ├── contractor_service.py           # 1099 contractor management
│       ├── pto_service.py                  # PTO and leave tracking
│       └── reporting_service.py            # Payroll reports and analytics
│
├── frontend/
│   │
│   ├── App.tsx                             # Application entry point
│   ├── app.json                            # Expo configuration
│   ├── package.json                        # Dependencies
│   ├── tsconfig.json                       # TypeScript configuration
│   ├── babel.config.js                     # Babel configuration
│   │
│   └── src/
│       │
│       ├── navigation/
│       │   └── AppNavigator.tsx            # React Navigation setup
│       │
│       ├── screens/                        # UI Screens (18 files)
│       │   │
│       │   ├── auth/                       # Authentication
│       │   │   ├── LoginScreen.tsx         # Email/password login
│       │   │   ├── SignUpScreen.tsx        # New user registration
│       │   │   └── ForgotPasswordScreen.tsx # Password reset flow
│       │   │
│       │   ├── dashboard/
│       │   │   └── DashboardScreen.tsx     # Main dashboard with stats, weather
│       │   │
│       │   ├── employees/                  # Employee Management
│       │   │   ├── EmployeesScreen.tsx     # Employee list with search/filter
│       │   │   ├── EmployeeDetailScreen.tsx # Individual employee profile
│       │   │   └── AddEmployeeScreen.tsx   # New employee form
│       │   │
│       │   ├── paystubs/                   # Paystub Management
│       │   │   ├── PaystubsScreen.tsx      # Paystub history with YTD summary
│       │   │   ├── PaystubDetailScreen.tsx # Individual paystub view
│       │   │   ├── GeneratePaystubScreen.tsx # Create new paystub
│       │   │   └── StandalonePaystubScreen.tsx # Full-page paystub viewer (25 themes)
│       │   │
│       │   ├── benefits/                   # Benefits & Insurance
│       │   │   └── BenefitsScreen.tsx      # Plan enrollment, dependents, costs
│       │   │
│       │   ├── timesheet/                  # Time & Attendance
│       │   │   └── TimesheetScreen.tsx     # Clock in/out, breaks, weekly view
│       │   │
│       │   ├── messaging/                  # Communications
│       │   │   └── MessagesScreen.tsx      # DM, channels, kudos, notifications
│       │   │
│       │   ├── swipe/                      # Schedule Swap
│       │   │   └── SwipeScreen.tsx         # Swap requests & manager approval
│       │   │
│       │   ├── workforce/                  # Workforce Monitoring
│       │   │   └── WorkforceScreen.tsx     # Weekly schedule grid, live status
│       │   │
│       │   ├── rewards/                    # Gamification
│       │   │   └── RewardsScreen.tsx       # Points, tiers, badges, streaks
│       │   │
│       │   ├── subscription/               # Billing
│       │   │   └── SubscriptionScreen.tsx  # Plans, usage, payment
│       │   │
│       │   └── settings/                   # User Settings
│       │       ├── SettingsScreen.tsx      # App preferences
│       │       └── ProfileScreen.tsx       # User profile editor
│       │
│       ├── components/                     # Reusable Components (17 files)
│       │   │
│       │   ├── ai/                         # AI Components
│       │   │   ├── index.ts                # AI component exports
│       │   │   ├── AIChat.tsx              # Chat interface
│       │   │   ├── AIComplianceChecker.tsx # Compliance verification
│       │   │   ├── AIInsightsCard.tsx      # Dashboard AI insights
│       │   │   ├── AIOnboardingHelper.tsx  # Setup wizard
│       │   │   └── AIPaystubHelper.tsx     # Paystub generation assistant
│       │   │
│       │   ├── dashboard/                  # Dashboard Components
│       │   │   ├── Header.tsx              # App header with user info
│       │   │   ├── StatsCard.tsx           # Metric display card
│       │   │   ├── ActivityItem.tsx        # Recent activity item
│       │   │   ├── EmployeeCard.tsx        # Employee summary card
│       │   │   ├── RewardsCard.tsx         # Rewards progress card
│       │   │   ├── SubscriptionCard.tsx    # Plan status card
│       │   │   └── WeatherWidget.tsx       # Weather display
│       │   │
│       │   ├── subscription/               # Billing Components
│       │   │   ├── PricingCard.tsx         # Plan pricing display
│       │   │   └── UsageTracker.tsx        # Usage meter
│       │   │
│       │   └── common/                     # Shared Components
│       │       └── ToastConfig.tsx         # Toast notifications
│       │
│       ├── services/                       # API Client Services (14 files)
│       │   ├── api.ts                      # Axios base client with JWT
│       │   ├── ai.ts                       # Saurellius AI API
│       │   ├── benefits.ts                 # Benefits & Insurance API
│       │   ├── stateRules.ts               # State compliance API
│       │   ├── messaging.ts                # Communications API
│       │   ├── swipe.ts                    # SWIPE API
│       │   ├── workforce.ts                # WORKFORCE API
│       │   ├── stripe.ts                   # Billing API
│       │   ├── email.ts                    # Email API
│       │   ├── weather.ts                  # Weather API
│       │   ├── taxEngine.ts                # Tax Engine API
│       │   ├── compliance.ts               # DocuGinuity compliance API
│       │   ├── contractors.ts              # Contractor management API
│       │   └── pto.ts                      # PTO tracking API
│       │
│       ├── hooks/                          # Custom React Hooks
│       │   ├── index.ts                    # Hook exports
│       │   ├── useAuth.ts                  # Authentication state
│       │   ├── useDebounce.ts              # Input debouncing
│       │   └── useRefresh.ts               # Pull-to-refresh state
│       │
│       └── utils/                          # Utility Functions
│           ├── index.ts                    # Utility exports
│           ├── formatters.ts               # Currency, date, phone formatting
│           ├── validators.ts               # Email, phone, SSN validation
│           └── constants.ts                # Colors, tiers, states
│
├── database/
│   └── schema.sql                          # PostgreSQL schema definition
│
├── docs/
│   ├── credentials_template.md             # API keys template
│   └── stripe_pricing_guide.md             # Subscription setup guide
│
├── infrastructure/
│   └── aws-cloudformation.yaml             # AWS deployment template
│
├── .env                                    # Environment variables
├── .env.example                            # Environment template
├── .gitignore                              # Git ignore rules
├── package.json                            # Root dependencies
├── tsconfig.json                           # Root TypeScript config
├── test_platform.py                        # Platform integration tests
├── README.md                               # This documentation
└── SAURELLIUS_MASTER_DOCUMENT.md           # Complete technical documentation
```

---

## API Reference

**Base URL:** `http://localhost:5001` (development) | `https://api.saurellius.drpaystub.com` (production)

### Authentication
```
POST /api/auth/signup                   Register new user
POST /api/auth/login                    Authenticate user (returns JWT)
POST /api/auth/logout                   Invalidate session
POST /api/auth/forgot-password          Request password reset
POST /api/auth/reset-password           Complete password reset
GET  /api/auth/me                       Get current user profile
```

### Dashboard
```
GET  /api/dashboard                     Get dashboard summary data
GET  /api/dashboard/stats               Get key metrics
GET  /api/dashboard/activity            Get recent activity feed
```

### Employees
```
GET  /api/employees                     List all employees
POST /api/employees                     Create new employee
GET  /api/employees/:id                 Get employee details
PUT  /api/employees/:id                 Update employee
DELETE /api/employees/:id               Remove employee
GET  /api/employees/:id/paystubs        Get employee paystub history
GET  /api/employees/:id/timesheets      Get employee timesheet history
```

### Paystubs
```
GET  /api/paystubs                      List all paystubs
POST /api/paystubs                      Create new paystub
GET  /api/paystubs/:id                  Get paystub details
DELETE /api/paystubs/:id                Remove paystub
```

### Paystub Generator
```
GET  /api/paystub-generator/themes      List all 25 themes
GET  /api/paystub-generator/themes/:key Get theme details
POST /api/paystub-generator/generate    Generate paystub PDF
POST /api/paystub-generator/preview     Generate preview image
GET  /api/paystub-generator/verify/:id  Verify paystub authenticity
```

### Saurellius AI
```
POST /api/ai/chat                       Send message to AI
GET  /api/ai/status                     Check AI availability
GET  /api/ai/capabilities               List AI capabilities
POST /api/ai/compliance-check           Check payroll compliance
POST /api/ai/recommend-plan             Get plan recommendation
```

### State Compliance
```
GET  /api/states                        List all states with rules
GET  /api/states/:code                  Get state details (e.g., CA, TX)
GET  /api/states/:code/summary          Get state summary
GET  /api/states/:code/tax-brackets     Get tax brackets
POST /api/states/:code/calculate        Calculate state taxes
GET  /api/states/compare                Compare multiple states
```

### Benefits & Insurance
```
# Plans
GET  /api/benefits/plans                List all available plans
GET  /api/benefits/plans/:type          Get plans by type (medical, dental, etc.)
GET  /api/benefits/plans/:id/details    Get plan details with costs

# Enrollment
GET  /api/benefits/enrollment           Get employee enrollment status
POST /api/benefits/enrollment           Enroll in benefit plan
PUT  /api/benefits/enrollment/:id       Update enrollment
DELETE /api/benefits/enrollment/:id     Cancel enrollment

# Dependents
GET  /api/benefits/dependents           List dependents
POST /api/benefits/dependents           Add dependent
PUT  /api/benefits/dependents/:id       Update dependent
DELETE /api/benefits/dependents/:id     Remove dependent

# Life Events
POST /api/benefits/life-events          Report qualifying life event
GET  /api/benefits/life-events          Get life event history

# COBRA
GET  /api/benefits/cobra/status         Get COBRA eligibility status
POST /api/benefits/cobra/elect          Elect COBRA coverage
GET  /api/benefits/cobra/payments       Get COBRA payment history

# Summary
GET  /api/benefits/summary              Get complete benefits summary
GET  /api/benefits/costs                Get benefit cost breakdown
```

### Communications Hub
```
# Direct Messages
POST /api/messaging/dm/send             Send direct message
GET  /api/messaging/dm/conversations    List conversations
GET  /api/messaging/dm/conversation/:id Get conversation messages

# Channels
GET  /api/messaging/channels            List channels
POST /api/messaging/channels            Create channel
GET  /api/messaging/channels/:id        Get channel messages
POST /api/messaging/channels/:id/send   Send to channel
POST /api/messaging/channels/:id/join   Join channel
POST /api/messaging/channels/:id/leave  Leave channel

# Recognition
POST /api/messaging/recognition/send    Send kudos
GET  /api/messaging/recognition/feed    Get kudos feed
GET  /api/messaging/recognition/stats   Get recognition stats
GET  /api/messaging/recognition/badges  List available badges

# Notifications
GET  /api/messaging/notifications       Get notifications
POST /api/messaging/notifications/read  Mark as read
DELETE /api/messaging/notifications/:id Dismiss notification
```

### SWIPE - Schedule Swap
```
# Shifts
GET  /api/swipe/shifts                  Get my shifts
POST /api/swipe/shifts/:id/available    Mark shift available for swap
GET  /api/swipe/available               Get available shifts to swap

# Swap Requests
POST /api/swipe/request                 Create swap request
GET  /api/swipe/requests/my             Get my swap requests
POST /api/swipe/request/:id/respond     Accept or decline swap
POST /api/swipe/request/:id/cancel      Cancel my request

# Manager Approval
GET  /api/swipe/approval/pending        Get pending approvals (manager)
POST /api/swipe/approval/:id/review     Approve or deny swap (manager)
GET  /api/swipe/history                 Get swap history
```

### WORKFORCE - Monitoring
```
# Schedule
GET  /api/workforce/schedule            Get weekly schedule grid
GET  /api/workforce/schedule/daily      Get daily schedule
POST /api/workforce/schedule/publish    Publish and notify employees
PUT  /api/workforce/schedule/shift      Update shift

# Real-Time Status
GET  /api/workforce/live                Get live employee status
POST /api/workforce/clock-in            Clock in
POST /api/workforce/clock-out           Clock out
POST /api/workforce/break/start         Start break
POST /api/workforce/break/end           End break

# Time Off
POST /api/workforce/time-off/request    Request time off
GET  /api/workforce/time-off/requests   List time off requests
POST /api/workforce/time-off/:id/review Approve or deny (manager)

# Analytics
GET  /api/workforce/stats               Get workforce statistics
GET  /api/workforce/employees           List all employees with status
GET  /api/workforce/overtime            Get overtime report
```

### Timesheet
```
GET  /api/timesheet                     Get current timesheet
GET  /api/timesheet/history             Get timesheet history
POST /api/timesheet/clock-in            Clock in
POST /api/timesheet/clock-out           Clock out
POST /api/timesheet/break               Log break
GET  /api/timesheet/summary             Get weekly summary
POST /api/timesheet/submit              Submit for approval
POST /api/timesheet/:id/approve         Approve timesheet (manager)
```

### Billing & Subscription
```
GET  /api/stripe/subscription           Get current subscription
GET  /api/stripe/plans                  List available plans
POST /api/stripe/create-checkout        Create checkout session
POST /api/stripe/create-portal          Create billing portal session
POST /api/stripe/webhook                Handle Stripe webhooks
GET  /api/stripe/invoices               Get invoice history
POST /api/stripe/cancel                 Cancel subscription
```

### Email
```
POST /api/email/send                    Send email
POST /api/email/send-paystub            Email paystub to employee
POST /api/email/send-invite             Send employee invitation
```

### Weather
```
GET  /api/weather                       Get weather for user location
GET  /api/weather/:city                 Get weather for specific city
```

### Tax Engine API (Open API)
```
# Core Endpoints
GET  /api/v1/tax-engine                 API info and status
POST /api/v1/tax-engine/calculate       Calculate taxes for single employee
POST /api/v1/tax-engine/batch           Batch calculate (up to 10,000)

# Tax Rates
GET  /api/v1/tax-engine/rates           Get rates by jurisdiction
GET  /api/v1/tax-engine/rates/federal   Get all 2025 federal rates
GET  /api/v1/tax-engine/rates/state/:code Get state-specific rates

# Multi-State
POST /api/v1/tax-engine/multistate      Multi-state calculation with reciprocity
GET  /api/v1/tax-engine/reciprocity     Check reciprocity between states

# Local Taxes
GET  /api/v1/tax-engine/local/:state    Get local jurisdictions for state
POST /api/v1/tax-engine/local/calculate Calculate local tax

# Additional
GET  /api/v1/tax-engine/sdi/:state      Get SDI/PFML rates for state
GET  /api/v1/tax-engine/jurisdictions   List all jurisdictions
POST /api/v1/tax-engine/w4/calculate    W-4 recommendations
GET  /api/v1/tax-engine/usage           API usage and overage stats

# Webhooks (Enterprise+)
GET  /api/v1/tax-engine/webhooks        List registered webhooks
POST /api/v1/tax-engine/webhooks        Register webhook
DELETE /api/v1/tax-engine/webhooks/:id  Delete webhook
```

### DocuGinuity Compliance
```
# Employee Documents
GET  /api/compliance/employee/required-documents   Get required forms
POST /api/compliance/onboarding/checklist          Create onboarding checklist
PUT  /api/compliance/onboarding/checklist/:id/document Update document status

# Company Compliance
GET  /api/compliance/company/required-documents    Get company required forms
GET  /api/compliance/company/:id/status            Check compliance status

# Form Library
GET  /api/compliance/forms                         Get all federal forms
GET  /api/compliance/forms/:id                     Get form details
GET  /api/compliance/forms/state/:code/withholding Get state W-4 form

# Deadlines
GET  /api/compliance/deadlines                     Upcoming filing deadlines
GET  /api/compliance/calendar/:year                Full filing calendar

# Dashboard
GET  /api/compliance/dashboard                     Compliance dashboard summary
```

### Admin Portal
```
GET  /api/admin/dashboard              Platform analytics and KPIs
GET  /api/admin/users                  List all platform users
GET  /api/admin/companies              List all companies
GET  /api/admin/api-clients            List Tax Engine API clients
GET  /api/admin/api-usage              API usage statistics
GET  /api/admin/revenue                Revenue metrics
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Python | 3.9+ |
| PostgreSQL | 15+ (or SQLite for local dev) |

### Installation

```bash
# Clone the repository
git clone https://github.com/diegoenterprises/saurellius.git
cd saurellius

# Copy environment template
cp .env.example .env
# Edit .env with your credentials
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers for PDF generation
playwright install chromium

# Run the server
python app.py
# Server runs on http://localhost:5001
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Press 'w' for web, 'i' for iOS, 'a' for Android
```

---

## Environment Variables

```env
# Flask Application
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saurellius
# For local development, can use SQLite:
# DATABASE_URL=sqlite:///saurellius.db

# Stripe Billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Resend Email
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@saurellius.com

# OpenWeather
OPENWEATHER_API_KEY=your-openweather-key

# AWS (Production)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=saurellius-files

# Tax Engine API (for Open API clients)
TAX_ENGINE_API_URL=https://api.saurellius.drpaystub.com/api/v1/tax-engine
```

---

## Subscription Tiers

| Feature | Starter | Professional | Business |
|---------|---------|--------------|----------|
| **Price** | $50/mo | $100/mo | $150/mo |
| **Included Paystubs** | 5/month | 25/month | Unlimited |
| **Overage Rate** | $5/each | $5/each | N/A |
| **All 50 States** | Yes | Yes | Yes |
| **Complete Tax Calculations** | Yes | Yes | Yes |
| **YTD Tracking** | Yes | Yes | Yes |
| **Premium PDF Templates** | Yes | Yes + Custom | Unlimited Custom |
| **QR Verification** | Yes | Yes | Yes |
| **PTO Tracking** | — | Yes | Yes |
| **Custom Branding** | — | Company logo | White-label |
| **Bulk Generation** | — | Up to 25 | Unlimited |
| **API Access** | — | Beta | Full + Webhooks |
| **Support** | Email (48hr) | Priority (24hr) | Dedicated Manager |
| **Storage Duration** | 1 year | 3 years | Unlimited |
| **Multi-user Access** | — | 3 users | Unlimited + Roles |
| **SSO** | — | — | Available |
| **SLA** | — | — | 99.9% uptime |

---

## Tax Engine API Tiers

For enterprise partners using the Saurellius Tax Engine Open API:

| Feature | Standard | Professional | Enterprise | Ultimate |
|---------|----------|--------------|------------|----------|
| **Annual Price** | $2,000 | $5,000 | $10,000 | $15,000 |
| **Daily Request Limit** | 5,000 | 20,000 | 100,000 | Unlimited |
| **Overage Rate** | $0.50/req | $0.25/req | $0.10/req | N/A |
| **Jurisdictions** | Federal + 10 states | All states | All + Local | Full 7,400+ |
| **Multi-State Calculations** | — | Yes | Yes | Yes |
| **Batch Processing** | — | 100/batch | 1,000/batch | 10,000/batch |
| **Local Tax Calculations** | — | — | Major cities | All jurisdictions |
| **Webhooks** | — | — | Yes | Yes |
| **Geocoding Precision** | State | City | Zip+4 | Rooftop |
| **Historical Data** | 1 year | 3 years | 5 years | 7+ years |
| **Implementation Support** | — | 5 hours | 20 hours | 50 hours |
| **Support Response** | 48hr email | 24hr email/chat | 4hr phone | 1hr dedicated |
| **SLA** | 99% | 99.5% | 99.9% | 99.99% |
| **White-Label** | — | — | — | Yes |

---

## Documentation

For complete technical documentation, see:

**[SAURELLIUS_MASTER_DOCUMENT.md](./SAURELLIUS_MASTER_DOCUMENT.md)**

Contents:
- Executive Summary
- Platform Overview
- All Feature Descriptions
- Complete API Reference
- Database Schema
- Security & Compliance
- Deployment Guide
- Architecture Diagrams

---

## Team

**Diego Enterprises, Inc.**

- **Website:** https://saurellius.drpaystub.com
- **Support:** support@saurellius.com
- **Sales:** sales@saurellius.com

---

## License

Proprietary - © 2025 Diego Enterprises, Inc. All rights reserved.

---

<div align="center">

**Built by Diego Enterprises**

*Saurellius Cloud Payroll Management — Enterprise Payroll, Simplified.*

</div>
