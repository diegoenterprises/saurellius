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
| **AI Assistant** | Google Gemini-powered payroll advisor, compliance checker, onboarding helper |
| **Employee Management** | Profiles, W-4 info, direct deposit, document storage |
| **Time & Attendance** | Clock in/out, break tracking, GPS location, weekly timesheets |
| **Workforce Scheduling** | Weekly grid view, position color-coding, overtime alerts, publish & notify |
| **Schedule Swapping** | Employee requests, peer acceptance, manager approval workflow |
| **Communications** | Direct messages, channels, announcements, recognition/kudos system |
| **Rewards System** | Points, tiers (Bronze to Diamond), badges, streak bonuses |
| **Billing** | Stripe integration, 3 subscription tiers, usage tracking |
| **Weather Integration** | Location-based weather for dashboard |
| **Email System** | Transactional emails via Resend |

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

### Subscription & Billing
- **Stripe Integration** — Secure payment processing
- **3 Tiers** — Starter ($29), Professional ($79), Business ($199)
- **Usage Tracking** — Employee count, API calls, storage
- **Invoice History** — Download past invoices

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
│   ├── routes/                             # API Route Handlers (13 files)
│   │   ├── __init__.py                     # Route exports
│   │   ├── auth_routes.py                  # Authentication (signup, login, logout)
│   │   ├── dashboard_routes.py             # Dashboard data aggregation
│   │   ├── paystub_routes.py               # Paystub CRUD operations
│   │   ├── paystub_generator_routes.py     # PDF generation with 25 themes
│   │   ├── state_rules_routes.py           # State tax compliance API
│   │   ├── ai_routes.py                    # Saurellius AI chat & helpers
│   │   ├── messaging_routes.py             # Communications Hub API
│   │   ├── swipe_routes.py                 # SWIPE schedule swap API
│   │   ├── workforce_routes.py             # WORKFORCE monitoring API
│   │   ├── stripe_routes.py                # Subscription billing API
│   │   ├── email_routes.py                 # Email sending API
│   │   └── weather_routes.py               # Weather widget API
│   │
│   └── services/                           # Business Logic Layer (8 files)
│       ├── __init__.py                     # Service exports
│       ├── paystub_generator.py            # 25 themes, PDF, security features
│       ├── state_payroll_rules.py          # 50 states + D.C. tax rules
│       ├── gemini_service.py               # Saurellius AI (Gemini Pro)
│       ├── messaging_service.py            # DM, channels, kudos, notifications
│       ├── swipe_service.py                # Schedule swap matching & approval
│       ├── workforce_service.py            # Real-time monitoring & scheduling
│       ├── email_service.py                # Resend email integration
│       └── weather_service.py              # OpenWeather API integration
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
│       ├── screens/                        # UI Screens (17 files)
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
│       │   │   ├── EmployeesScreen.tsx     # Employee list view
│       │   │   ├── EmployeeDetailScreen.tsx # Individual employee profile
│       │   │   └── AddEmployeeScreen.tsx   # New employee form
│       │   │
│       │   ├── paystubs/                   # Paystub Management
│       │   │   ├── PaystubsScreen.tsx      # Paystub history list
│       │   │   ├── PaystubDetailScreen.tsx # Individual paystub view
│       │   │   ├── GeneratePaystubScreen.tsx # Create new paystub
│       │   │   └── StandalonePaystubScreen.tsx # Full-page paystub viewer
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
│       └── services/                       # API Client Services (9 files)
│           ├── api.ts                      # Axios base client with JWT
│           ├── ai.ts                       # Saurellius AI API
│           ├── stateRules.ts               # State compliance API
│           ├── messaging.ts                # Communications API
│           ├── swipe.ts                    # SWIPE API
│           ├── workforce.ts                # WORKFORCE API
│           ├── stripe.ts                   # Billing API
│           ├── email.ts                    # Email API
│           └── weather.ts                  # Weather API
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
```

---

## Subscription Tiers

| Feature | Starter | Professional | Business |
|---------|---------|--------------|----------|
| **Price** | $29/mo | $79/mo | $199/mo |
| **Employees** | 10 | 50 | Unlimited |
| **Paystub Themes** | 5 | 25 | 25 |
| **Saurellius AI** | — | Yes | Yes |
| **State Compliance** | 1 state | All 50 states | All 50 states |
| **SWIPE (Schedule Swap)** | — | Yes | Yes |
| **WORKFORCE Monitoring** | — | Yes | Yes |
| **Communications Hub** | Basic | Full | Full |
| **Timesheets** | Basic | Advanced | Advanced |
| **API Access** | — | Limited | Unlimited |
| **Support** | Email | Priority | Dedicated |
| **Custom Branding** | — | — | Yes |

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
