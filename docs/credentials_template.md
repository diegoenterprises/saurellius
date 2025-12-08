# Saurellius Credentials Reference

> **SECURITY**: Store actual credentials in `.env` file only (never commit to git)

---

## Required Environment Variables

### Database (PostgreSQL)
```
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

### JWT Authentication
```
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

### Stripe Payment Processing
```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxx
STRIPE_PRICE_BUSINESS=price_xxxxx
```

#### Pricing Plans
- **Starter**: $50/month (5 paystubs included)
- **Professional**: $100/month (25 paystubs included)
- **Business**: $150/month (Unlimited paystubs)

### AWS Configuration
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_PAYSTUBS_BUCKET=your-bucket-name
```

### Weather & Location APIs
```
OPENWEATHER_API_KEY=your_openweather_key
IPGEOLOCATION_API_KEY=your_ipgeolocation_key
```

### Email Service (Resend)
```
RESEND_API_KEY=re_your_api_key
SENDER_EMAIL=noreply@yourdomain.com
```

### AI Integration (Google Gemini)
```
GEMINI_API_KEY=your_gemini_api_key
```

---

## Quick Setup

1. Copy `.env.example` to `.env`
2. Fill in all values with your actual credentials
3. Create Stripe products in dashboard and add Price IDs
4. Set up webhook: `https://api.yourdomain.com/api/stripe/webhook`

---

*Last updated: December 2025*
