# SAURELLIUS CLOUD PAYROLL MANAGEMENT

## The Complete Enterprise Payroll & Workforce Management Platform

---

![Saurellius](https://img.shields.io/badge/Saurellius-Cloud%20Payroll-1473FF?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-BE01FF?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-iOS%20|%20Android%20|%20Web-10B981?style=for-the-badge)

**Developed by Diego Enterprises, Inc.**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Overview](#platform-overview)
3. [Core Features](#core-features)
   - [Paystub Generator](#1-paystub-generator)
   - [Saurellius AI](#2-saurellius-ai)
   - [State Compliance Engine](#3-state-compliance-engine)
   - [Communications Hub](#4-communications-hub)
   - [SWIPE - Schedule Swap](#5-swipe---schedule-swap-system)
   - [WORKFORCE - Real-Time Monitoring](#6-workforce---real-time-monitoring)
   - [Stripe Billing](#7-stripe-billing-integration)
4. [Enterprise Features](#enterprise-features)
   - [Saurellius Tax Engine API](#saurellius-tax-engine-api)
   - [DocuGinuity Compliance](#docuginuity-compliance)
   - [Admin Portal](#admin-portal)
5. [Technical Architecture](#technical-architecture)
6. [API Reference](#api-reference)
7. [Frontend Screens](#frontend-screens)
8. [Database Schema](#database-schema)
9. [Security & Compliance](#security--compliance)
10. [Deployment](#deployment)
11. [Subscription Tiers](#subscription-tiers)
12. [Tax Engine API Tiers](#tax-engine-api-tiers)

---

## Executive Summary

**Saurellius Cloud Payroll Management** is a next-generation enterprise payroll and workforce management platform designed to streamline payroll processing, ensure state-by-state compliance, and provide real-time workforce visibility. Built with modern technologies and AI-powered assistance, Saurellius delivers a comprehensive solution for businesses of all sizes.

### Key Differentiators

- **25 Professional Paystub Themes** - Bank-grade security features with QR verification
- **AI-Powered Assistant** - Gemini-powered payroll advisor
- **50-State Compliance** - Automatic tax calculations for all U.S. states + DC
- **Real-Time Workforce Monitoring** - Captain's tower view of your entire workforce
- **Employee Schedule Swapping** - SWIPE system with manager approval workflow
- **Enterprise Communications** - Built-in messaging, kudos, and announcements
- **Saurellius Tax Engine API** - Open API for enterprise partners with 7,400+ tax jurisdictions
- **DocuGinuity Compliance** - Automated document tracking for I-9, W-4, W-2, 941, 1099
- **Admin Portal** - Platform analytics, API usage tracking, Stripe integration

---

## Platform Overview

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React Native (Expo), TypeScript, TailwindCSS |
| **Backend** | Python, Flask, SQLAlchemy |
| **Database** | PostgreSQL (AWS RDS) / SQLite (local) |
| **AI Engine** | Google Gemini Pro |
| **PDF Generation** | Playwright + Chromium |
| **Payments** | Stripe |
| **Email** | Resend |
| **Cloud** | AWS (RDS, S3, EC2) |

### Repository

- **GitHub:** https://github.com/diegoenterprises/saurellius
- **Branch:** main

---

## Core Features

---

### 1. Paystub Generator

The crown jewel of Saurellius - a professional-grade paystub generation system with bank-level security features.

#### 25 Color Themes

| Theme | Primary | Secondary | Style |
|-------|---------|-----------|-------|
| Diego's Original | #1473FF | #BE01FF | Modern gradient |
| Modern Tech | #3B82F6 | #8B5CF6 | Tech-forward |
| Ocean Breeze | #06B6D4 | #0EA5E9 | Cool aquatic |
| Forest Green | #10B981 | #059669 | Natural earth |
| Sunset Orange | #F97316 | #FB923C | Warm vibrant |
| Royal Purple | #8B5CF6 | #A855F7 | Elegant regal |
| Midnight Blue | #1E3A8A | #1E40AF | Deep professional |
| Rose Gold | #F472B6 | #EC4899 | Soft premium |
| Electric Lime | #84CC16 | #A3E635 | Bold energy |
| Cherry Red | #EF4444 | #F87171 | Strong impact |
| Arctic Silver | #6B7280 | #9CA3AF | Minimalist |
| Golden Hour | #F59E0B | #FBBF24 | Warm luxury |
| Coral Reef | #FB7185 | #FDA4AF | Tropical soft |
| Steel Gray | #475569 | #64748B | Industrial |
| Emerald City | #059669 | #10B981 | Rich green |
| Lavender Dreams | #A78BFA | #C4B5FD | Soft purple |
| Copper Bronze | #EA580C | #F97316 | Metallic warm |
| Sapphire Blue | #2563EB | #3B82F6 | Classic blue |
| Mint Fresh | #14B8A6 | #2DD4BF | Clean fresh |
| Burgundy Wine | #BE185D | #DB2777 | Deep elegant |
| Slate Modern | #334155 | #475569 | Contemporary |
| Amber Glow | #D97706 | #F59E0B | Rich gold |
| Teal Wave | #0D9488 | #14B8A6 | Ocean depth |
| Plum Perfect | #7C3AED | #8B5CF6 | Deep purple |
| Carbon Black | #18181B | #27272A | Premium dark |

#### Security Features

- **QR Code Verification** - Unique verification ID embedded in QR code
- **Document Hash** - SHA-256 tamper-proof hash
- **Holographic Seal** - Visual authenticity indicator
- **Watermark Protection** - Background security pattern
- **Verification ID** - Unique identifier for each paystub

#### Paystub Data Structure

```json
{
  "company": {
    "name": "Company Name",
    "address": "123 Business St",
    "city": "City",
    "state": "CA",
    "zip": "90210",
    "ein": "XX-XXXXXXX"
  },
  "employee": {
    "name": "Employee Name",
    "address": "456 Worker Ave",
    "ssn_last_four": "1234",
    "employee_id": "EMP001"
  },
  "pay_period": {
    "start": "2025-01-01",
    "end": "2025-01-15",
    "pay_date": "2025-01-20"
  },
  "earnings": {
    "regular_hours": 80,
    "regular_rate": 25.00,
    "overtime_hours": 5,
    "overtime_rate": 37.50
  },
  "deductions": {
    "federal_tax": 450.00,
    "state_tax": 125.00,
    "social_security": 155.00,
    "medicare": 36.25,
    "health_insurance": 150.00,
    "retirement_401k": 200.00
  }
}
```

#### API Endpoints

```
POST /api/paystub-generator/generate    - Generate PDF paystub
GET  /api/paystub-generator/themes      - Get all 25 themes
GET  /api/paystub-generator/theme/:key  - Get specific theme
POST /api/paystub-generator/preview     - Preview paystub data
GET  /api/paystub-generator/verify/:id  - Verify paystub authenticity
```

---

### 2. Saurellius AI

An intelligent AI assistant powered by Google Gemini Pro, providing payroll expertise and personalized recommendations.

#### Capabilities

| Feature | Description |
|---------|-------------|
| **Payroll Questions** | Answer any payroll-related query |
| **Tax Guidance** | Federal and state tax explanations |
| **Compliance Advice** | State-specific regulation guidance |
| **Plan Recommendations** | Suggest optimal subscription tier |
| **Calculation Help** | Overtime, deductions, net pay |
| **Best Practices** | Industry payroll standards |

#### AI Personas

The AI adapts its expertise based on query context:
- Tax Specialist
- HR Compliance Expert
- Payroll Calculator
- Benefits Advisor

#### API Endpoints

```
POST /api/ai/chat           - Send message to AI
GET  /api/ai/status         - Check AI availability
POST /api/ai/recommend-plan - Get plan recommendation
GET  /api/ai/capabilities   - List AI capabilities
```

#### Example Interaction

```json
// Request
POST /api/ai/chat
{
  "message": "How do I calculate overtime for California employees?"
}

// Response
{
  "success": true,
  "response": "In California, overtime is calculated as follows:\n\n1. **Daily Overtime:**\n   - 1.5x regular rate for hours 8-12 in a workday\n   - 2x regular rate for hours beyond 12\n\n2. **Weekly Overtime:**\n   - 1.5x for hours beyond 40 in a workweek\n\n3. **7th Consecutive Day:**\n   - 1.5x for first 8 hours\n   - 2x for hours beyond 8\n\nCalifornia has some of the strictest overtime laws in the nation.",
  "model": "gemini-pro"
}
```

---

### 3. State Compliance Engine

Comprehensive payroll compliance rules for all 50 U.S. states plus Washington D.C.

#### Coverage

- **50 States + DC** - Complete coverage
- **Minimum Wage** - Current rates for each state
- **State Income Tax** - Tax brackets and rates
- **Unemployment Insurance** - SUTA rates and wage bases
- **Disability Insurance** - SDI states (CA, HI, NJ, NY, RI)
- **Paid Family Leave** - PFL states
- **Local Taxes** - City/county tax support

#### State Data Structure

```python
{
    "state_code": "CA",
    "state_name": "California",
    "minimum_wage": 16.00,
    "has_state_income_tax": True,
    "income_tax_brackets": [
        {"min": 0, "max": 10412, "rate": 0.01},
        {"min": 10412, "max": 24684, "rate": 0.02},
        {"min": 24684, "max": 38959, "rate": 0.04},
        {"min": 38959, "max": 54081, "rate": 0.06},
        {"min": 54081, "max": 68350, "rate": 0.08},
        {"min": 68350, "max": 349137, "rate": 0.093},
        {"min": 349137, "max": 418961, "rate": 0.103},
        {"min": 418961, "max": 698271, "rate": 0.113},
        {"min": 698271, "max": None, "rate": 0.123}
    ],
    "suta_rate": 0.034,
    "suta_wage_base": 7000,
    "has_sdi": True,
    "sdi_rate": 0.009,
    "has_pfl": True,
    "overtime_rules": {
        "daily_threshold": 8,
        "weekly_threshold": 40,
        "double_time_threshold": 12
    }
}
```

#### Special State Features

| State | Special Rules |
|-------|---------------|
| **California** | Daily overtime, meal/rest breaks, SDI, PFL |
| **New York** | NYC minimum wage differs, PFL |
| **Texas** | No state income tax |
| **Florida** | No state income tax |
| **Washington** | No state income tax, high minimum wage |
| **Nevada** | No state income tax |

#### API Endpoints

```
GET  /api/states                    - List all states
GET  /api/states/:code              - Get state details
GET  /api/states/:code/summary      - Get state summary
GET  /api/states/:code/tax-brackets - Get tax brackets
POST /api/states/:code/calculate    - Calculate state taxes
GET  /api/states/compare            - Compare multiple states
```

---

### 4. Communications Hub

Enterprise-grade internal communication system for workforce collaboration.

#### Features

| Feature | Description |
|---------|-------------|
| **Direct Messages** | One-on-one employee messaging |
| **Channels** | Team and department group chats |
| **Announcements** | Company-wide broadcasts |
| **Recognition (Kudos)** | Employee appreciation system |
| **Notifications** | Real-time alerts |
| **Presence** | Online/away/busy status |

#### Default Channels

- `#company-announcements` - Official company news
- `#general` - Company-wide discussion
- `#kudos-wall` - Public recognition feed
- `#hr-updates` - HR policies and updates
- `#random` - Off-topic conversation

#### Recognition Badges

| Badge | Icon | Points | Description |
|-------|------|--------|-------------|
| Kudos | clap | 10 | General appreciation |
| Praise | star | 15 | Outstanding work |
| Thank You | hands | 10 | Gratitude for help |
| Great Work | trophy | 20 | Exceptional performance |
| Team Player | handshake | 25 | Excellent collaboration |
| Above & Beyond | rocket | 50 | Exceeded expectations |
| Customer Hero | gem | 30 | Outstanding customer care |
| Innovation | lightbulb | 40 | Creative problem solving |
| Leadership | crown | 35 | Inspiring leadership |
| Milestone | target | 100 | Achievement unlocked |

#### API Endpoints

```
# Direct Messages
POST /api/messaging/dm/send              - Send DM
GET  /api/messaging/dm/conversations     - List conversations
GET  /api/messaging/dm/conversation/:id  - Get conversation

# Channels
GET  /api/messaging/channels             - List channels
POST /api/messaging/channels             - Create channel
POST /api/messaging/channels/:id/send    - Send to channel

# Recognition
POST /api/messaging/recognition/send     - Send kudos
GET  /api/messaging/recognition/feed     - Get kudos feed
GET  /api/messaging/recognition/my-stats - Get my recognition stats

# Notifications
GET  /api/messaging/notifications        - Get notifications
POST /api/messaging/notifications/mark-read - Mark as read
```

---

### 5. SWIPE - Schedule Swap System

Employee-to-employee shift swapping with intelligent matching and manager approval workflow.

#### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     SWIPE WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Employee A                    Employee B                   │
│  ┌─────────┐                  ┌─────────┐                  │
│  │ Tue 1-9p│  ──── SWAP ───▶ │ Fri 1-9p│                  │
│  └─────────┘                  └─────────┘                  │
│       │                            │                        │
│       ▼                            ▼                        │
│  ┌─────────────────────────────────────┐                   │
│  │     1. Employee A Requests Swap     │                   │
│  └─────────────────────────────────────┘                   │
│                    │                                        │
│                    ▼                                        │
│  ┌─────────────────────────────────────┐                   │
│  │  2. Employee B Accepts or Declines  │                   │
│  └─────────────────────────────────────┘                   │
│                    │                                        │
│                    ▼                                        │
│  ┌─────────────────────────────────────┐                   │
│  │   3. Manager Reviews & Approves     │                   │
│  └─────────────────────────────────────┘                   │
│                    │                                        │
│                    ▼                                        │
│  ┌─────────────────────────────────────┐                   │
│  │        4. Swap Executed             │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Swap Request Statuses

| Status | Description |
|--------|-------------|
| `pending` | Awaiting target employee response |
| `accepted` | Target accepted, awaiting manager |
| `declined` | Target declined the swap |
| `manager_pending` | Awaiting manager approval |
| `manager_approved` | Swap approved and executed |
| `manager_denied` | Manager denied the swap |
| `cancelled` | Requester cancelled |
| `expired` | Request expired |

#### Overtime Protection

The system automatically checks if a swap would cause overtime violations:
- Warns if weekly hours would exceed 40
- Alerts for shifts longer than 8 hours
- Considers existing scheduled shifts

#### Manager Approval Interface

| Column | Data |
|--------|------|
| User Name | Requester's name, date, time |
| Swipe User Name | Target employee |
| Position | Job role |
| Department | Department name |
| Action | Accept (green) / Reject (red) buttons |

#### API Endpoints

```
# Shifts
GET  /api/swipe/shifts              - Get my shifts
POST /api/swipe/shifts/:id/available - Mark available for swap
GET  /api/swipe/available           - Get available shifts

# Swap Requests
POST /api/swipe/request             - Create swap request
POST /api/swipe/request/:id/respond - Accept/decline (employee)
GET  /api/swipe/requests/my         - Get my requests

# Manager Approval
GET  /api/swipe/approval/pending    - Get pending approvals
POST /api/swipe/approval/:id/review - Approve/deny swap
GET  /api/swipe/history             - Get swap history
```

---

### 6. WORKFORCE - Real-Time Monitoring

The Captain's Observation Tower - bird's eye view of your entire workforce.

#### Dashboard Features

| Feature | Description |
|---------|-------------|
| **Weekly Schedule Grid** | All employees × 7 days |
| **Position Color Coding** | Pastel colors by role |
| **Overtime Alerts** | Visual warnings for OT |
| **Real-Time Status** | Clocked in/out/break |
| **Position Filters** | Filter by role |
| **Publish & Notify** | Send schedule to employees |

#### Position Colors (Pastel Theme)

| Position | Background | Text | Border |
|----------|------------|------|--------|
| Manager | #E8D5F2 | #7C3AED | #C4B5FD |
| Designer | #FFE4E6 | #E11D48 | #FDA4AF |
| Developer | #CCFBF1 | #0D9488 | #5EEAD4 |
| Chef | #FFEDD5 | #EA580C | #FDBA74 |
| Server | #DBEAFE | #2563EB | #93C5FD |
| Host | #FEE2E2 | #DC2626 | #FCA5A5 |
| Assistant | #E0E7FF | #4F46E5 | #A5B4FC |

#### Schedule Grid Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  WORKFORCE                              [Publish & Notify] [Today]   │
├──────────────────────────────────────────────────────────────────────┤
│  < Oct 9 - Oct 15 >                              [Week] [Month]      │
├──────────────────────────────────────────────────────────────────────┤
│  Employee      │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │           │
├──────────────────────────────────────────────────────────────────────┤
│  [*] Ben S.   │10-7p│10-7p│10-7p│10-7p│10-7p│     │     │ 45h +5 OT│
│     Designer   │█████│█████│█████│█████│█████│     │     │           │
├──────────────────────────────────────────────────────────────────────┤
│  [*] Elena S. │10-7p│TIME │10-7p│10-7p│     │10-7p│     │ 36h      │
│     Designer   │█████│ OFF │█████│█████│     │█████│     │           │
├──────────────────────────────────────────────────────────────────────┤
│  [*] Carmen L.│9-6p │9-6p │9-6p │9-6p │9-6p │     │     │ 45h +5 OT│
│     Developer  │█████│█████│█████│█████│█████│     │     │           │
└──────────────────────────────────────────────────────────────────────┘
```

#### Real-Time Status Tracking

| Status | Indicator | Description |
|--------|-----------|-------------|
| Clocked In | [active] | Currently working |
| On Break | [break] | Taking a break |
| Clocked Out | [off] | Not working |
| Time Off | [pto] | Approved time off |
| Unavailable | [unavail] | Cannot work |

#### API Endpoints

```
# Schedule
GET  /api/workforce/schedule         - Get weekly grid
GET  /api/workforce/schedule/daily   - Get daily view
POST /api/workforce/schedule/publish - Publish & notify

# Real-Time
GET  /api/workforce/live             - Get live status
POST /api/workforce/clock-in         - Clock in
POST /api/workforce/clock-out        - Clock out
POST /api/workforce/break/start      - Start break
POST /api/workforce/break/end        - End break

# Time Off
POST /api/workforce/time-off/request - Request time off
GET  /api/workforce/time-off/requests - List requests
POST /api/workforce/time-off/:id/review - Approve/deny

# Analytics
GET  /api/workforce/stats            - Get workforce stats
GET  /api/workforce/employees        - List employees
```

---

### 7. Stripe Billing Integration

Complete subscription management with three pricing tiers.

#### Subscription Tiers

| Tier | Price | Employees | Features |
|------|-------|-----------|----------|
| **Starter** | $29/mo | Up to 10 | Basic paystubs, email support |
| **Professional** | $79/mo | Up to 50 | AI assistant, all themes, priority support |
| **Business** | $199/mo | Unlimited | Full platform, dedicated support, API access |

#### Stripe Price IDs

```
STRIPE_PRICE_STARTER=price_1SWQj9JNYAYyd2rWD6cQwQkB
STRIPE_PRICE_PROFESSIONAL=price_1SWRHCJNYAYyd2rWxx9UjaIe
STRIPE_PRICE_BUSINESS=price_1SWRMDJNYAYyd2rWKQQ9MFof
```

#### API Endpoints

```
POST /api/stripe/create-checkout    - Create checkout session
POST /api/stripe/webhook            - Handle Stripe webhooks
GET  /api/stripe/subscription       - Get current subscription
POST /api/stripe/cancel             - Cancel subscription
GET  /api/stripe/invoices           - Get invoice history
```

---

## Enterprise Features

### Saurellius Tax Engine API

Enterprise-grade Open API for payroll tax calculations, available to enterprise partners.

#### Coverage

| Tax Type | Jurisdictions |
|----------|---------------|
| **Federal Income Tax** | 7 brackets, 4 filing statuses (2025 data) |
| **Social Security** | 6.2% up to $176,100 wage base |
| **Medicare** | 1.45% + 0.9% Additional Medicare (over $200K) |
| **State Income Tax** | All 50 states + D.C. |
| **SDI/VDI** | CA, HI, NJ, NY, RI, PR |
| **Paid Family Leave** | 12 states (CO, CT, DE, MA, MD, MN, NJ, NY, OR, RI, WA) |
| **Local Taxes** | NYC, Philadelphia, 30+ Ohio cities, MD counties |
| **SUTA/FUTA** | All 50 states |
| **Reciprocity** | 17 states with agreements |

#### API Endpoints

```
GET  /api/v1/tax-engine                 API info and status
POST /api/v1/tax-engine/calculate       Calculate taxes for single employee
POST /api/v1/tax-engine/batch           Batch calculate (up to 10,000)
GET  /api/v1/tax-engine/rates           Get rates by jurisdiction
GET  /api/v1/tax-engine/rates/federal   Get all 2025 federal rates
GET  /api/v1/tax-engine/rates/state/:code Get state-specific rates
POST /api/v1/tax-engine/multistate      Multi-state calculation
GET  /api/v1/tax-engine/reciprocity     Check reciprocity between states
GET  /api/v1/tax-engine/local/:state    Get local jurisdictions
POST /api/v1/tax-engine/local/calculate Calculate local tax
GET  /api/v1/tax-engine/sdi/:state      Get SDI/PFML rates
GET  /api/v1/tax-engine/usage           API usage and overage stats
```

---

### DocuGinuity Compliance

Automated document compliance and tracking system for employment and tax forms.

#### Federal Forms Supported

| Form | Purpose | Deadline |
|------|---------|----------|
| **I-9** | Employment Eligibility Verification | Within 3 days of hire |
| **W-4** | Employee Withholding Certificate | At hire |
| **W-2** | Wage and Tax Statement | January 31 |
| **W-3** | Transmittal of W-2s | January 31 |
| **940** | Employer's Annual FUTA Return | January 31 |
| **941** | Quarterly Federal Tax Return | Quarterly |
| **944** | Annual Federal Tax Return | January 31 |
| **W-9** | Request for TIN | At hire (contractors) |
| **1099-NEC** | Nonemployee Compensation | January 31 |
| **1096** | Transmittal of 1099s | January 31 |
| **1095-C** | ACA Health Coverage | March 2 |
| **1094-C** | ACA Transmittal | March 2 |

#### State W-4 Forms

All 50 states supported with state-specific withholding forms (CA DE 4, NY IT-2104, etc.)

#### API Endpoints

```
GET  /api/compliance/employee/required-documents   Get required forms
POST /api/compliance/onboarding/checklist          Create onboarding checklist
PUT  /api/compliance/onboarding/checklist/:id/document Update document status
GET  /api/compliance/company/:id/status            Check compliance status
GET  /api/compliance/forms                         Get all federal forms
GET  /api/compliance/forms/:id                     Get form details
GET  /api/compliance/deadlines                     Upcoming filing deadlines
GET  /api/compliance/calendar/:year                Full filing calendar
GET  /api/compliance/dashboard                     Compliance dashboard summary
```

---

### Admin Portal

Platform owner dashboard for analytics, API management, and system monitoring.

#### Features

- **Platform Analytics** - Total users, companies, paystubs, revenue
- **Tax Engine API Management** - Client tracking, usage monitoring
- **Tier Management** - Standard, Professional, Enterprise, Ultimate
- **Overage Tracking** - Daily limits, overage costs, billing
- **Stripe Integration** - Subscription IDs, payment status
- **System Health** - API server, database, payment processor status

#### API Endpoints

```
GET  /api/admin/dashboard              Platform analytics and KPIs
GET  /api/admin/users                  List all platform users
GET  /api/admin/companies              List all companies
GET  /api/admin/api-clients            List Tax Engine API clients
GET  /api/admin/api-usage              API usage statistics
GET  /api/admin/revenue                Revenue metrics
```

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│   │   iOS App   │   │ Android App │   │   Web App   │              │
│   │ React Native│   │ React Native│   │    React    │              │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘              │
│          │                 │                 │                      │
│          └─────────────────┼─────────────────┘                      │
│                            │                                        │
│                            ▼                                        │
├─────────────────────────────────────────────────────────────────────┤
│                         API GATEWAY                                  │
│                    Flask REST API (Port 5001)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│   │   Auth    │ │  Paystub  │ │    AI     │ │   State   │          │
│   │  Routes   │ │  Routes   │ │  Routes   │ │  Routes   │          │
│   └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘          │
│         │             │             │             │                  │
│   ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐          │
│   │ Messaging │ │   Swipe   │ │ Workforce │ │  Stripe   │          │
│   │  Routes   │ │  Routes   │ │  Routes   │ │  Routes   │          │
│   └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │ PaystubGenerator│  │  SaurelliusAI   │  │ StatePayrollRules│   │
│   │   (Playwright)  │  │   (Gemini Pro)  │  │   (50 States)   │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │Communications   │  │  SwipeService   │  │WorkforceService │    │
│   │     Hub         │  │  (Scheduling)   │  │  (Monitoring)   │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │   PostgreSQL    │  │      Redis      │  │    AWS S3       │    │
│   │   (AWS RDS)     │  │    (Sessions)   │  │   (File Storage)│    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
SAURELLIUS CLOUD PAYROLL MANAGEMENT/
├── backend/
│   ├── app.py                    # Flask application factory
│   ├── config.py                 # Configuration settings
│   ├── models.py                 # SQLAlchemy models
│   ├── .env                      # Environment variables
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py        # Authentication
│   │   ├── stripe_routes.py      # Billing
│   │   ├── ai_routes.py          # AI assistant
│   │   ├── paystub_routes.py     # Paystub management
│   │   ├── paystub_generator_routes.py  # PDF generation
│   │   ├── state_rules_routes.py # State compliance
│   │   ├── messaging_routes.py   # Communications
│   │   ├── swipe_routes.py       # Schedule swap
│   │   ├── workforce_routes.py   # Workforce monitoring
│   │   ├── email_routes.py       # Email service
│   │   └── weather_routes.py     # Weather API
│   │
│   └── services/
│       ├── __init__.py
│       ├── gemini_service.py     # Saurellius AI
│       ├── paystub_generator.py  # PDF generation (25 themes)
│       ├── state_payroll_rules.py # 50-state compliance
│       ├── messaging_service.py  # Communications Hub
│       ├── swipe_service.py      # SWIPE system
│       ├── workforce_service.py  # WORKFORCE monitoring
│       ├── email_service.py      # Resend integration
│       └── weather_service.py    # Weather API
│
├── frontend/
│   ├── App.tsx                   # Main app entry
│   ├── package.json              # Dependencies
│   │
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── SignUpScreen.tsx
│   │   │   │   └── ForgotPasswordScreen.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardScreen.tsx
│   │   │   ├── employees/
│   │   │   │   ├── EmployeesScreen.tsx
│   │   │   │   ├── EmployeeDetailScreen.tsx
│   │   │   │   └── AddEmployeeScreen.tsx
│   │   │   ├── paystubs/
│   │   │   │   ├── PaystubsScreen.tsx
│   │   │   │   ├── PaystubDetailScreen.tsx
│   │   │   │   ├── GeneratePaystubScreen.tsx
│   │   │   │   └── StandalonePaystubScreen.tsx
│   │   │   ├── messaging/
│   │   │   │   └── MessagesScreen.tsx
│   │   │   ├── swipe/
│   │   │   │   └── SwipeScreen.tsx
│   │   │   ├── workforce/
│   │   │   │   └── WorkforceScreen.tsx
│   │   │   ├── subscription/
│   │   │   │   └── SubscriptionScreen.tsx
│   │   │   ├── timesheet/
│   │   │   │   └── TimesheetScreen.tsx
│   │   │   ├── rewards/
│   │   │   │   └── RewardsScreen.tsx
│   │   │   └── settings/
│   │   │       ├── SettingsScreen.tsx
│   │   │       └── ProfileScreen.tsx
│   │   │
│   │   └── services/
│   │       ├── api.ts            # Base API client
│   │       ├── stripe.ts         # Stripe client
│   │       ├── ai.ts             # AI client
│   │       ├── stateRules.ts     # State rules client
│   │       ├── messaging.ts      # Messaging client
│   │       ├── swipe.ts          # SWIPE client
│   │       ├── workforce.ts      # WORKFORCE client
│   │       ├── email.ts          # Email client
│   │       └── weather.ts        # Weather client
│
├── database/
│   └── schema.sql                # Database schema
│
├── docs/
│   ├── credentials_template.md   # Credentials template
│   └── stripe_pricing_guide.md   # Stripe setup guide
│
├── .env                          # Root environment variables
├── .env.example                  # Example environment file
├── .gitignore                    # Git ignore rules
├── README.md                     # Project readme
└── SAURELLIUS_MASTER_DOCUMENT.md # This document
```

---

## API Reference

### Authentication

All API endpoints (except `/health` and `/api/auth/*`) require JWT authentication.

```http
Authorization: Bearer <access_token>
```

### Base URL

```
Development: http://localhost:5001
Production: https://api.saurellius.drpaystub.com
```

### Complete Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** |
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout user |
| **Paystub Generator** |
| POST | `/api/paystub-generator/generate` | Generate PDF |
| GET | `/api/paystub-generator/themes` | List themes |
| GET | `/api/paystub-generator/verify/:id` | Verify paystub |
| **AI** |
| POST | `/api/ai/chat` | Chat with AI |
| GET | `/api/ai/status` | AI status |
| **States** |
| GET | `/api/states` | List states |
| GET | `/api/states/:code` | State details |
| POST | `/api/states/:code/calculate` | Calculate taxes |
| **Messaging** |
| POST | `/api/messaging/dm/send` | Send DM |
| GET | `/api/messaging/channels` | List channels |
| POST | `/api/messaging/recognition/send` | Send kudos |
| **SWIPE** |
| POST | `/api/swipe/request` | Create swap |
| POST | `/api/swipe/approval/:id/review` | Manager review |
| **WORKFORCE** |
| GET | `/api/workforce/schedule` | Weekly grid |
| GET | `/api/workforce/live` | Live status |
| POST | `/api/workforce/clock-in` | Clock in |
| **Stripe** |
| POST | `/api/stripe/create-checkout` | Checkout |
| GET | `/api/stripe/subscription` | Current plan |

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Employees Table

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    position VARCHAR(100),
    department VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    hire_date DATE,
    ssn_encrypted VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Paystubs Table

```sql
CREATE TABLE paystubs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    employee_id INTEGER REFERENCES employees(id),
    verification_id VARCHAR(100) UNIQUE,
    pay_period_start DATE,
    pay_period_end DATE,
    pay_date DATE,
    gross_pay DECIMAL(12,2),
    net_pay DECIMAL(12,2),
    theme VARCHAR(50),
    pdf_url VARCHAR(500),
    document_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Security & Compliance

### Data Security

| Measure | Implementation |
|---------|----------------|
| **Encryption at Rest** | AES-256 encryption |
| **Encryption in Transit** | TLS 1.3 |
| **Password Hashing** | bcrypt with salt |
| **JWT Tokens** | RS256 signed, 15-min expiry |
| **SSN Storage** | Encrypted, last 4 only displayed |

### Compliance

- **SOC 2 Type II** - Security controls
- **GDPR** - Data privacy
- **CCPA** - California privacy
- **PCI DSS** - Payment security (via Stripe)

### Paystub Verification

Each generated paystub includes:
1. **Verification ID** - Unique identifier
2. **QR Code** - Scannable verification
3. **Document Hash** - SHA-256 tamper detection
4. **Timestamp** - Generation time

---

## Deployment

### Environment Variables

```env
# Application
FLASK_ENV=production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...

# AI
GEMINI_API_KEY=your-gemini-key

# Email
RESEND_API_KEY=re_...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=saurellius-files
```

### Start Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npx expo start
```

### Production Deployment

1. **Backend** → AWS EC2 / ECS
2. **Database** → AWS RDS PostgreSQL
3. **Files** → AWS S3
4. **Frontend** → App Store / Play Store / Vercel

---

## Subscription Tiers

### Platform Tiers

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
| **PTO Tracking** | - | Yes | Yes |
| **Custom Branding** | - | Company logo | White-label |
| **Bulk Generation** | - | Up to 25 | Unlimited |
| **API Access** | - | Beta | Full + Webhooks |
| **Support** | Email (48hr) | Priority (24hr) | Dedicated Manager |
| **Storage Duration** | 1 year | 3 years | Unlimited |
| **Multi-user Access** | - | 3 users | Unlimited + Roles |
| **SSO** | - | - | Available |
| **SLA** | - | - | 99.9% uptime |

---

## Tax Engine API Tiers

For enterprise partners using the Saurellius Tax Engine Open API:

| Feature | Standard | Professional | Enterprise | Ultimate |
|---------|----------|--------------|------------|----------|
| **Annual Price** | $2,000 | $5,000 | $10,000 | $15,000 |
| **Daily Request Limit** | 5,000 | 20,000 | 100,000 | Unlimited |
| **Overage Rate** | $0.50/req | $0.25/req | $0.10/req | N/A |
| **Jurisdictions** | Federal + 10 states | All states | All + Local | Full 7,400+ |
| **Multi-State Calculations** | - | Yes | Yes | Yes |
| **Batch Processing** | - | 100/batch | 1,000/batch | 10,000/batch |
| **Local Tax Calculations** | - | - | Major cities | All jurisdictions |
| **Webhooks** | - | - | Yes | Yes |
| **Geocoding Precision** | State | City | Zip+4 | Rooftop |
| **Historical Data** | 1 year | 3 years | 5 years | 7+ years |
| **Implementation Support** | - | 5 hours | 20 hours | 50 hours |
| **Support Response** | 48hr email | 24hr email/chat | 4hr phone | 1hr dedicated |
| **SLA** | 99% | 99.5% | 99.9% | 99.99% |
| **White-Label** | - | - | - | Yes |

---

## Support & Contact

**Diego Enterprises, Inc.**

- **Website:** https://saurellius.drpaystub.com
- **Support:** support@saurellius.com
- **Sales:** sales@saurellius.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial release |
| - | - | 25 paystub themes |
| - | - | Saurellius AI integration |
| - | - | 50-state compliance |
| - | - | Communications Hub |
| - | - | SWIPE schedule swap |
| - | - | WORKFORCE monitoring |
| - | - | Stripe billing |
| 1.1.0 | Dec 2025 | Enterprise Features |
| - | - | Saurellius Tax Engine API (Open API) |
| - | - | 7,400+ tax jurisdictions |
| - | - | 2025/2026 federal and state tax data |
| - | - | SDI, PFML, local taxes, reciprocity |
| - | - | DocuGinuity compliance module |
| - | - | I-9, W-4, W-2, 941, 1099 tracking |
| - | - | 2025 filing calendar |
| - | - | Admin Portal with analytics |
| - | - | API usage tracking with Stripe |
| - | - | Docker deployment ready |

---

**© 2025 Diego Enterprises, Inc. All rights reserved.**

*Saurellius Cloud Payroll Management - Enterprise Payroll, Simplified.*
