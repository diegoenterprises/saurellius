# 🏆 Saurellius Cloud Payroll Management

Enterprise-grade cloud payroll management platform built with React Native for Web, connecting to a Python backend with PostgreSQL database, deployed on AWS.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Integration](#api-integration)

## 🎯 Overview

Saurellius Cloud Payroll Management is a comprehensive payroll platform that enables businesses to:

- Generate professional paystubs with 25+ themes
- Manage employees and company information
- Track time with clock in/out and break management
- Handle shift swaps and schedule changes
- Monitor PTO balances and requests
- Earn rewards through a gamification system

## ✨ Features

### 🔐 Authentication
- Email/password login
- Google OAuth integration
- Multi-factor authentication
- Password reset flow

### 📊 Dashboard
- Real-time statistics
- Recent activity feed
- Quick actions
- Rewards progress tracker

### 👥 Employee Management
- Full employee profiles
- W-4 information
- Direct deposit setup
- Document management

### 📄 Paystub Generation
- 25+ professional themes
- Automatic tax calculations (all 50 states)
- YTD tracking with continuation
- PDF export with security features
- QR code verification

### ⏱️ Timesheet
- Clock in/out
- Break tracking
- GPS location capture
- Weekly summaries

### 🔄 Interchange (Shift Swap)
- Request shift swaps
- Browse available shifts
- Manager approval workflow

### 🏆 Rewards System
- Points for actions
- 5-tier progression (Bronze → Diamond)
- Achievement badges
- Login streak bonuses

## 🛠️ Tech Stack

### Frontend
- **React Native for Web** (v0.73.2)
- **Expo** (v50.0.0)
- **TypeScript**
- **Redux Toolkit** - State management
- **React Navigation** - Navigation
- **Expo Linear Gradient** - UI styling
- **React Hook Form + Zod** - Form validation

### Backend
- **Python 3.11+**
- **FastAPI / Flask** - API framework
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **Playwright** - PDF generation

### Database
- **PostgreSQL 15** - Primary database
- **AWS RDS** - Managed database hosting

### Infrastructure
- **AWS CloudFront** - CDN
- **AWS S3** - Static hosting & file storage
- **AWS Lambda** - Serverless functions
- **AWS Cognito** - Authentication

## 📁 Project Structure

```
SAURELLIUS CLOUD PAYROLL MANAGEMENT/
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── employees/
│       │   ├── paystubs/
│       │   ├── timesheet/
│       │   └── common/
│       ├── screens/         # Screen components
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── employees/
│       │   ├── paystubs/
│       │   ├── timesheet/
│       │   ├── rewards/
│       │   └── settings/
│       ├── navigation/      # Navigation configuration
│       ├── services/        # API services
│       ├── store/           # Redux store & slices
│       ├── hooks/           # Custom hooks
│       ├── utils/           # Utility functions
│       ├── styles/          # Theme & styling
│       └── assets/          # Static assets
├── backend/
│   ├── api/                 # API routes
│   ├── services/            # Business logic
│   ├── models/              # Database models
│   └── config/              # Configuration
├── database/
│   └── schema.sql           # PostgreSQL schema
├── infrastructure/
│   └── aws-cloudformation.yaml
├── App.tsx                  # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 15+
- Python 3.11+ (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/saurellius-cloud-payroll.git
   cd saurellius-cloud-payroll
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   psql -U postgres -f database/schema.sql
   ```

5. **Start development server**
   ```bash
   npm run web
   ```

## 💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run web` | Start web development server |
| `npm run ios` | Start iOS simulator |
| `npm run android` | Start Android emulator |
| `npm run build:web` | Build for web production |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Path aliases for clean imports

## 🌐 Deployment

### AWS Deployment

1. **Deploy infrastructure**
   ```bash
   aws cloudformation create-stack \
     --stack-name saurellius-production \
     --template-body file://infrastructure/aws-cloudformation.yaml \
     --parameters ParameterKey=DBPassword,ParameterValue=YOUR_PASSWORD
   ```

2. **Build frontend**
   ```bash
   npm run build:production
   ```

3. **Deploy to S3**
   ```bash
   aws s3 sync dist/ s3://saurellius-production-frontend --delete
   ```

4. **Invalidate CloudFront cache**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

## 🔌 API Integration

The frontend connects to the Python backend via REST API. See `frontend/src/services/api.ts` for full API documentation.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/paystubs/generate` | POST | Generate paystub |
| `/api/employees` | GET/POST | Employee management |
| `/api/timesheet/clock-in` | POST | Clock in |
| `/api/rewards/points` | GET | Get reward points |

## 📞 Support

For support, email support@saurellius.com or join our Slack channel.

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ by Saurellius Platform Team
