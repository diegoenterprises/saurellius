# SAURELLIUS

### Cloud Payroll Management

<div align="center">

![Saurellius](https://img.shields.io/badge/Saurellius-1473FF?style=flat-square)
![Version](https://img.shields.io/badge/v1.0.0-333333?style=flat-square)
![Platform](https://img.shields.io/badge/iOS%20%7C%20Android%20%7C%20Web-666666?style=flat-square)

The complete enterprise payroll and workforce management platform.

[Features](#features) | [Tech Stack](#tech-stack) | [Getting Started](#getting-started) | [API](#api-reference) | [Documentation](#documentation)

</div>

---

## Overview

Saurellius Cloud Payroll Management is a next-generation enterprise platform that combines payroll processing, workforce monitoring, and team communication into one unified solution.

### Highlights

- **25 Professional Paystub Themes** — Bank-grade security features
- **AI-Powered Assistant** — Google Gemini integration
- **50-State Tax Compliance** — Including Washington D.C.
- **WORKFORCE** — Real-time employee monitoring dashboard
- **SWIPE** — Schedule swap with manager approval workflow
- **Communications Hub** — Messaging, channels, recognition
- **Stripe Billing** — Three-tier subscription model

---

## Features

### Paystub Generator
| Feature | Description |
|---------|-------------|
| **25 Themes** | Professional color schemes from "Diego's Original" to "Carbon Black" |
| **QR Verification** | Unique verification ID embedded in scannable QR code |
| **Security Features** | Document hash, holographic seal, watermarks |
| **PDF Export** | Playwright-powered high-quality PDF generation |

### Saurellius AI
- Powered by Google Gemini Pro
- Payroll questions & tax guidance
- State compliance advice
- Plan recommendations

### State Compliance Engine
- All 50 U.S. states + D.C.
- State income tax brackets
- SUTA/SDI/PFL calculations
- Overtime rules by state

### Communications Hub
- **Direct Messages** - 1:1 employee chat
- **Channels** - Team/department groups
- **Recognition System** — 10 badges for employee appreciation
- **Announcements** - Company-wide broadcasts
- **Notifications** - Real-time alerts

### SWIPE — Schedule Swap
```
Employee A (Tue 1-9p)  <->  Employee B (Fri 1-9p)
         ↓
   Target Accepts
         ↓
   Manager Approves
         ↓
     Swap Complete
```

### WORKFORCE — Real-Time Monitoring
- Weekly schedule grid (employees × days)
- Pastel color-coded positions
- Live status (clocked in/break/out)
- Overtime tracking & alerts
- Publish & notify schedules

### Subscription Tiers
| Tier | Price | Employees | AI | SWIPE | WORKFORCE |
|------|-------|-----------|----|----|-----------|
| Starter | $29/mo | 10 | — | — | — |
| Professional | $79/mo | 50 | Yes | Yes | Yes |
| Business | $199/mo | Unlimited | Yes | Yes | Yes |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React Native, Expo, TypeScript |
| **Backend** | Python 3.9+, Flask, SQLAlchemy |
| **Database** | PostgreSQL (AWS RDS) |
| **AI** | Google Gemini Pro |
| **PDF** | Playwright + Chromium |
| **Payments** | Stripe |
| **Email** | Resend |
| **Cloud** | AWS (RDS, S3, EC2) |

---

## Project Structure

```
SAURELLIUS CLOUD PAYROLL MANAGEMENT/
│
├── backend/
│   ├── app.py                          # Flask application
│   ├── config.py                       # Configuration
│   ├── models.py                       # SQLAlchemy models
│   ├── .env                            # Environment variables
│   │
│   ├── routes/                      # API Routes (13 files)
│   │   ├── auth_routes.py              # Authentication
│   │   ├── stripe_routes.py            # Billing
│   │   ├── ai_routes.py                # Saurellius AI
│   │   ├── paystub_generator_routes.py # PDF generation
│   │   ├── state_rules_routes.py       # State compliance
│   │   ├── messaging_routes.py         # Communications
│   │   ├── swipe_routes.py             # SWIPE
│   │   ├── workforce_routes.py         # WORKFORCE
│   │   └── ...                         # + 5 more
│   │
│   └── services/                       # Business Logic (9 files)
│       ├── gemini_service.py           # Saurellius AI
│       ├── paystub_generator.py        # 25 themes + PDF
│       ├── state_payroll_rules.py      # 50 states
│       ├── messaging_service.py        # Communications Hub
│       ├── swipe_service.py            # SWIPE
│       ├── workforce_service.py        # WORKFORCE
│       └── ...                         # + 3 more
│
├── frontend/
│   ├── App.tsx                         # Entry point
│   ├── package.json
│   │
│   └── src/
│       ├── screens/                 # UI Screens (19 files)
│       │   ├── auth/
│       │   │   ├── LoginScreen.tsx
│       │   │   ├── SignUpScreen.tsx
│       │   │   └── ForgotPasswordScreen.tsx
│       │   ├── dashboard/
│       │   │   └── DashboardScreen.tsx
│       │   ├── employees/
│       │   │   ├── EmployeesScreen.tsx
│       │   │   ├── EmployeeDetailScreen.tsx
│       │   │   └── AddEmployeeScreen.tsx
│       │   ├── paystubs/
│       │   │   ├── PaystubsScreen.tsx
│       │   │   ├── GeneratePaystubScreen.tsx
│       │   │   └── ...
│       │   ├── messaging/
│       │   │   └── MessagesScreen.tsx
│       │   ├── swipe/
│       │   │   └── SwipeScreen.tsx      # SWIPE UI
│       │   ├── workforce/
│       │   │   └── WorkforceScreen.tsx  # WORKFORCE UI
│       │   └── ...
│       │
│       └── services/                   # API Clients (9 files)
│           ├── api.ts                  # Base client
│           ├── ai.ts                   # AI service
│           ├── stateRules.ts           # State compliance
│           ├── messaging.ts            # Communications
│           ├── swipe.ts                # SWIPE
│           ├── workforce.ts            # WORKFORCE
│           └── ...
│
├── database/
│   └── schema.sql                      # PostgreSQL schema
│
├── docs/
│   ├── credentials_template.md
│   └── stripe_pricing_guide.md
│
├── .env                                # Root environment
├── .env.example                        # Template
├── .gitignore
├── README.md                           # This file
└── SAURELLIUS_MASTER_DOCUMENT.md       # Full documentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 15+ (or SQLite for local dev)

### Installation

```bash
# Clone the repository
git clone https://github.com/diegoenterprises/saurellius.git
cd saurellius

# Set up environment
cp .env.example .env
# Edit .env with your credentials
```

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
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

# Start Expo
npx expo start

# Press 'w' for web, 'i' for iOS, 'a' for Android
```

---

## API Reference

**Base URL:** `http://localhost:5001` (dev) | `https://api.saurellius.drpaystub.com` (prod)

### Authentication
```http
POST /api/auth/signup     # Register
POST /api/auth/login      # Login (returns JWT)
```

### Paystub Generator
```http
GET  /api/paystub-generator/themes       # List 25 themes
POST /api/paystub-generator/generate     # Generate PDF
GET  /api/paystub-generator/verify/:id   # Verify authenticity
```

### Saurellius AI
```http
POST /api/ai/chat                        # Chat with AI
GET  /api/ai/status                      # Check availability
```

### State Compliance
```http
GET  /api/states                         # List all states
GET  /api/states/:code                   # State details (CA, TX, etc.)
POST /api/states/:code/calculate         # Calculate taxes
```

### Communications
```http
POST /api/messaging/dm/send              # Send DM
GET  /api/messaging/channels             # List channels
POST /api/messaging/recognition/send     # Send kudos
```

### SWIPE (Schedule Swap)
```http
POST /api/swipe/request                  # Create swap request
POST /api/swipe/request/:id/respond      # Accept/decline
POST /api/swipe/approval/:id/review      # Manager approve/deny
```

### WORKFORCE (Monitoring)
```http
GET  /api/workforce/schedule             # Weekly grid
GET  /api/workforce/live                 # Real-time status
POST /api/workforce/clock-in             # Clock in
POST /api/workforce/schedule/publish     # Publish & notify
```

---

## Documentation

For complete documentation, see:

**[SAURELLIUS_MASTER_DOCUMENT.md](./SAURELLIUS_MASTER_DOCUMENT.md)**

Includes:
- Full feature descriptions
- API endpoint reference
- Database schema
- Architecture diagrams
- Security & compliance
- Deployment guide

---

## Environment Variables

```env
# Application
FLASK_ENV=production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...

# AI
GEMINI_API_KEY=your-gemini-key

# Email
RESEND_API_KEY=re_...
```

---

## Feature Summary

| Category | Features |
|----------|----------|
| **Paystubs** | 25 themes, PDF generation, QR verification, security features |
| **AI** | Gemini-powered assistant, payroll advice, tax guidance |
| **Compliance** | 50 states + DC, tax brackets, SUTA/SDI/PFL, overtime rules |
| **Communications** | DM, channels, kudos (10 badges), announcements, presence |
| **SWIPE** | Shift swap requests, employee response, manager approval |
| **WORKFORCE** | Schedule grid, position colors, live status, overtime alerts |
| **Billing** | Stripe integration, 3 subscription tiers |

---

## Team

**Diego Enterprises, Inc.**

- Website: https://saurellius.drpaystub.com
- Support: support@saurellius.com

---

## License

Proprietary - © 2025 Diego Enterprises, Inc. All rights reserved.

---

<div align="center">

**Built by Diego Enterprises**

*Saurellius Cloud Payroll Management - Enterprise Payroll, Simplified.*

</div>
