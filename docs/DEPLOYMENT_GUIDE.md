# Saurellius Cloud Payroll Management - Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate IAM permissions
2. **Domain Name** (e.g., saurellius.drpaystub.com)
3. **SSL Certificate** via AWS Certificate Manager
4. **API Keys** for all external services

## Required API Keys

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| Stripe | STRIPE_SECRET_KEY | Payment processing |
| Stripe | STRIPE_WEBHOOK_SECRET | Webhook verification |
| Google Gemini | GEMINI_API_KEY | AI assistant |
| Resend | RESEND_API_KEY | Transactional emails |
| OpenWeather | OPENWEATHER_API_KEY | Weather widget |

## Local Development

### Using Docker Compose

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python app.py

# Frontend (separate terminal)
cd frontend
npm install
npx expo start
```

## AWS Deployment

### Step 1: Deploy Infrastructure

```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name saurellius-production \
  --template-body file://infrastructure/aws-cloudformation.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=DBPassword,ParameterValue=YOUR_SECURE_PASSWORD \
    ParameterKey=DomainName,ParameterValue=saurellius.drpaystub.com \
  --capabilities CAPABILITY_IAM
```

### Step 2: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
cd backend
docker build -t saurellius-api .

# Tag for ECR
docker tag saurellius-api:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/saurellius-api:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/saurellius-api:latest
```

### Step 3: Configure Environment Variables

In AWS Systems Manager Parameter Store, create:

```
/saurellius/production/SECRET_KEY
/saurellius/production/JWT_SECRET_KEY
/saurellius/production/DATABASE_URL
/saurellius/production/STRIPE_SECRET_KEY
/saurellius/production/STRIPE_WEBHOOK_SECRET
/saurellius/production/GEMINI_API_KEY
/saurellius/production/RESEND_API_KEY
/saurellius/production/OPENWEATHER_API_KEY
```

### Step 4: Deploy ECS Service

The CloudFormation template creates an ECS service. Update it with:

```bash
aws ecs update-service \
  --cluster saurellius-production-cluster \
  --service saurellius-api-service \
  --force-new-deployment
```

### Step 5: Configure DNS

1. Get the ALB DNS name from CloudFormation outputs
2. Create CNAME record in your DNS provider:
   - `api.saurellius.drpaystub.com` -> ALB DNS name

### Step 6: Configure Stripe Webhooks

1. Go to Stripe Dashboard -> Developers -> Webhooks
2. Add endpoint: `https://api.saurellius.drpaystub.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

## Frontend Deployment

### Expo/React Native

For web deployment:

```bash
cd frontend
npx expo export:web
# Deploy the web-build folder to your hosting
```

For mobile apps:

```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

## Health Checks

### Backend Health
```
GET https://api.saurellius.drpaystub.com/health
```

Expected response:
```json
{"status": "healthy", "service": "saurellius-api"}
```

### Database Health
```
GET https://api.saurellius.drpaystub.com/api/auth/me
```
Returns 401 (no auth) but confirms API is connected to database.

## Monitoring

### CloudWatch Logs

All container logs are sent to CloudWatch Log Groups:
- `/ecs/saurellius-production/api`

### CloudWatch Alarms (Recommended)

Create alarms for:
- API 5xx error rate > 1%
- API latency p99 > 3 seconds
- Database CPU > 80%
- Database connections > 80% of max

## Scaling

### Horizontal Scaling

ECS auto-scaling is configured for:
- Min: 2 tasks
- Max: 10 tasks
- Target CPU: 70%

### Database Scaling

RDS can be scaled by:
1. Modifying instance class
2. Adding read replicas
3. Enabling Aurora Serverless (if using Aurora)

## Backup and Recovery

### Database Backups

RDS automated backups are enabled:
- Retention: 7 days
- Backup window: 03:00-04:00 UTC

### Manual Snapshot

```bash
aws rds create-db-snapshot \
  --db-instance-identifier saurellius-production-db \
  --db-snapshot-identifier saurellius-backup-$(date +%Y%m%d)
```

## Security Checklist

Before going live:

- [ ] All API keys are in Parameter Store (not in code)
- [ ] Database is in private subnet
- [ ] Security groups restrict access appropriately
- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] Stripe webhook signature verification is enabled
- [ ] JWT tokens have appropriate expiration
- [ ] CORS is configured for your domains only
- [ ] Rate limiting is enabled for Tax Engine API

## Support

- Technical: support@saurellius.com
- Sales: sales@saurellius.com
- Documentation: https://docs.saurellius.com
