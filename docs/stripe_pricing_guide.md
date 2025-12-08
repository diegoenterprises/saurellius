# Saurellius Stripe Pricing & Implementation Guide

## 📊 Complete Tier Pricing Map

### Starter Plan - $50/month
**Target:** Small businesses, freelancers, 1-5 employees

| Feature | Included |
|---------|----------|
| **Monthly Price** | $50.00 |
| **Included Paystubs** | 5 per month |
| **Additional Paystubs** | $5.00 each |
| **States Supported** | All 50 states |
| **Tax Calculations** | Complete (Federal, State, Local, FICA) |
| **YTD Tracking** | ✅ Yes |
| **Premium PDF Templates** | ✅ Yes |
| **QR Verification** | ✅ Yes |
| **Document Security** | ✅ Standard |
| **PTO Tracking** | ❌ No |
| **Custom Branding** | ❌ No |
| **Bulk Generation** | ❌ No |
| **API Access** | ❌ No |
| **Support** | Email (48hr response) |
| **Storage Duration** | 1 year |
| **Multi-user Access** | ❌ No |

**Stripe Product ID:** `prod_starter_xxxxx`  
**Stripe Price ID:** `price_starter_xxxxx`

---

### Professional Plan - $100/month ⭐ MOST POPULAR
**Target:** Growing businesses, 5-25 employees

| Feature | Included |
|---------|----------|
| **Monthly Price** | $100.00 |
| **Included Paystubs** | 25 per month |
| **Additional Paystubs** | $5.00 each |
| **States Supported** | All 50 states |
| **Tax Calculations** | Advanced (includes SDI, local taxes) |
| **YTD Tracking** | ✅ Yes |
| **Premium PDF Templates** | ✅ Yes + 5 custom templates |
| **QR Verification** | ✅ Yes |
| **Document Security** | ✅ Enhanced |
| **PTO Tracking** | ✅ Yes (Vacation, Sick, Personal) |
| **Custom Branding** | ✅ Company logo & colors |
| **Bulk Generation** | ✅ Yes (up to 25 at once) |
| **API Access** | ✅ Beta access |
| **Support** | Priority Email (24hr response) |
| **Storage Duration** | 3 years |
| **Multi-user Access** | ✅ 3 users |
| **Export Options** | CSV, Excel reports |
| **Deduction Templates** | ✅ Custom templates |

**Stripe Product ID:** `prod_professional_xxxxx`  
**Stripe Price ID:** `price_professional_xxxxx`

---

### Business Plan - $150/month 🚀 UNLIMITED
**Target:** Enterprises, payroll providers, 25+ employees

| Feature | Included |
|---------|----------|
| **Monthly Price** | $150.00 |
| **Included Paystubs** | **UNLIMITED** |
| **Additional Paystubs** | **FREE (no extra charges)** |
| **States Supported** | All 50 states |
| **Tax Calculations** | Advanced + Custom rules |
| **YTD Tracking** | ✅ Yes |
| **Premium PDF Templates** | ✅ Unlimited custom templates |
| **QR Verification** | ✅ Yes |
| **Document Security** | ✅ Enterprise-grade |
| **PTO Tracking** | ✅ Advanced (custom policies) |
| **Custom Branding** | ✅ White-label (remove Saurellius branding) |
| **Bulk Generation** | ✅ Yes (unlimited) |
| **API Access** | ✅ Full API access + webhooks |
| **Support** | Dedicated account manager + phone |
| **Storage Duration** | Unlimited |
| **Multi-user Access** | ✅ Unlimited users + roles |
| **Export Options** | CSV, Excel, PDF, JSON |
| **Deduction Templates** | ✅ Unlimited custom |
| **SSO (Single Sign-On)** | ✅ Available |
| **Custom Integrations** | ✅ Available |
| **SLA** | 99.9% uptime guarantee |
| **Advanced Analytics** | ✅ Full dashboard |
| **Audit Logs** | ✅ Complete history |

**Stripe Product ID:** `prod_business_xxxxx`  
**Stripe Price ID:** `price_business_xxxxx`

---

## 💰 Pricing Examples

### Starter Plan Examples
```
Scenario 1: 5 paystubs/month
Cost: $50.00 (no additional charges)

Scenario 2: 8 paystubs/month  
Cost: $50.00 + (3 × $5.00) = $65.00

Scenario 3: 15 paystubs/month
Cost: $50.00 + (10 × $5.00) = $100.00
```

### Professional Plan Examples
```
Scenario 1: 25 paystubs/month
Cost: $100.00 (no additional charges)

Scenario 2: 30 paystubs/month
Cost: $100.00 + (5 × $5.00) = $125.00

Scenario 3: 50 paystubs/month
Cost: $100.00 + (25 × $5.00) = $225.00
```

### Business Plan
```
ANY number of paystubs: $150.00 (flat rate)
50 paystubs: $150.00
100 paystubs: $150.00
1,000 paystubs: $150.00
```

---

## 🔧 Stripe Product Setup Instructions

### Step 1: Create Products in Stripe Dashboard

#### Product 1: Starter Plan
```
1. Go to Stripe Dashboard → Products → Add Product
2. Fill in:
   Name: Saurellius Starter Plan
   Description: Professional paystub generation for small businesses. Includes 5 paystubs per month with complete tax calculations for all 50 states. Additional paystubs $5 each.
   
3. Add Price:
   Pricing Model: Standard pricing
   Price: $50.00
   Billing Period: Monthly
   Currency: USD
   
4. Add Metadata:
   Key: included_paystubs | Value: 5
   Key: additional_cost | Value: 5
   Key: tier | Value: starter
   Key: features | Value: basic

5. Save and copy the Price ID (price_xxxxx)
```

#### Product 2: Professional Plan
```
1. Add Product
2. Fill in:
   Name: Saurellius Professional Plan
   Description: Advanced paystub generation for growing businesses. Includes 25 paystubs per month with PTO tracking, custom branding, and priority support. Additional paystubs $5 each.
   
3. Add Price:
   Pricing Model: Standard pricing
   Price: $100.00
   Billing Period: Monthly
   Currency: USD
   
4. Add Metadata:
   Key: included_paystubs | Value: 25
   Key: additional_cost | Value: 5
   Key: tier | Value: professional
   Key: features | Value: advanced

5. Save and copy the Price ID
```

#### Product 3: Business Plan
```
1. Add Product
2. Fill in:
   Name: Saurellius Business Plan
   Description: Unlimited paystub generation for enterprises. No per-paystub charges. Includes white-label options, full API access, and dedicated support.
   
3. Add Price:
   Pricing Model: Standard pricing
   Price: $150.00
   Billing Period: Monthly
   Currency: USD
   
4. Add Metadata:
   Key: included_paystubs | Value: -1
   Key: additional_cost | Value: 0
   Key: tier | Value: business
   Key: features | Value: enterprise

5. Save and copy the Price ID
```

---

## 💻 Implementation Code

### 1. Update `config.py` - Add Stripe Price IDs

```python
# config.py
import os

class Config:
    # Stripe Configuration
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    # Stripe Price IDs (Update these with your actual IDs)
    STRIPE_PRICES = {
        'starter': 'price_1QRzT2LxxxxxxxxxxStarter',
        'professional': 'price_1QRzT2LxxxxxxxxxxProfessional',
        'business': 'price_1QRzT2LxxxxxxxxxxBusiness'
    }
    
    # Plan Configurations
    PLAN_LIMITS = {
        'starter': {
            'name': 'Starter',
            'price': 50.00,
            'included_paystubs': 5,
            'additional_cost': 5.00,
            'features': [
                'All 50 states',
                'Complete tax calculations',
                'YTD tracking',
                'Premium PDFs',
                'Email support'
            ]
        },
        'professional': {
            'name': 'Professional',
            'price': 100.00,
            'included_paystubs': 25,
            'additional_cost': 5.00,
            'features': [
                'Everything in Starter',
                'PTO tracking',
                'Custom branding',
                'Bulk generation',
                'Priority support',
                'API access (beta)',
                '3 users'
            ]
        },
        'business': {
            'name': 'Business',
            'price': 150.00,
            'included_paystubs': -1,  # -1 = unlimited
            'additional_cost': 0,
            'features': [
                'Everything in Professional',
                'Unlimited paystubs',
                'White-label options',
                'Full API access',
                'Dedicated support',
                'Unlimited users',
                'SSO available',
                '99.9% SLA'
            ]
        }
    }
```

---

### 2. Create `billing.py` - Billing Logic

```python
# billing.py
import stripe
from datetime import datetime, timedelta
from flask import current_app
from models import User, Paystub, db
from sqlalchemy import func

stripe.api_key = current_app.config['STRIPE_SECRET_KEY']

class BillingManager:
    
    @staticmethod
    def check_paystub_limit(user):
        """
        Check if user can generate another paystub
        Returns: dict with allowed status and billing info
        """
        plan_config = current_app.config['PLAN_LIMITS'].get(
            user.subscription_tier, 
            current_app.config['PLAN_LIMITS']['starter']
        )
        
        # Unlimited plan (Business)
        if plan_config['included_paystubs'] == -1:
            return {
                'allowed': True,
                'remaining': -1,  # unlimited
                'overage': 0,
                'cost': 0,
                'message': 'Unlimited paystubs available'
            }
        
        # Get billing period dates
        billing_start = BillingManager.get_billing_period_start(user)
        
        # Count paystubs in current period
        paystub_count = Paystub.query.filter(
            Paystub.user_id == user.id,
            Paystub.created_at >= billing_start
        ).count()
        
        included = plan_config['included_paystubs']
        remaining = max(0, included - paystub_count)
        
        # Check if within included limit
        if paystub_count < included:
            return {
                'allowed': True,
                'remaining': remaining,
                'overage': 0,
                'cost': 0,
                'message': f'{remaining} paystubs remaining in your plan'
            }
        
        # Calculate overage
        overage_count = paystub_count - included + 1
        overage_cost = overage_count * plan_config['additional_cost']
        
        return {
            'allowed': True,
            'remaining': 0,
            'overage': overage_count,
            'cost': overage_cost,
            'message': f'Additional charge of ${overage_cost:.2f} will be added to your next invoice'
        }
    
    @staticmethod
    def bill_overage(user):
        """
        Create invoice item for paystub overage
        """
        plan_config = current_app.config['PLAN_LIMITS'][user.subscription_tier]
        
        # Skip if unlimited plan
        if plan_config['included_paystubs'] == -1:
            return {'success': True, 'charged': 0}
        
        billing_start = BillingManager.get_billing_period_start(user)
        
        # Count paystubs in current period
        paystub_count = Paystub.query.filter(
            Paystub.user_id == user.id,
            Paystub.created_at >= billing_start
        ).count()
        
        included = plan_config['included_paystubs']
        
        # Only bill if over limit
        if paystub_count <= included:
            return {'success': True, 'charged': 0}
        
        # Calculate overage for THIS paystub only
        cost = plan_config['additional_cost']
        
        try:
            # Create invoice item
            invoice_item = stripe.InvoiceItem.create(
                customer=user.stripe_customer_id,
                amount=int(cost * 100),  # Convert to cents
                currency='usd',
                description=f'Additional paystub (overage)',
                subscription=user.stripe_subscription_id
            )
            
            return {
                'success': True,
                'charged': cost,
                'invoice_item_id': invoice_item.id
            }
        
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_billing_period_start(user):
        """
        Get the start date of the current billing period
        """
        if not user.stripe_subscription_id:
            # Default to start of current month
            return datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        try:
            subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)
            return datetime.fromtimestamp(subscription.current_period_start)
        except:
            return datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    @staticmethod
    def get_usage_summary(user):
        """
        Get detailed usage summary for user's dashboard
        """
        plan_config = current_app.config['PLAN_LIMITS'][user.subscription_tier]
        billing_start = BillingManager.get_billing_period_start(user)
        billing_end = BillingManager.get_billing_period_end(user)
        
        # Count paystubs
        paystub_count = Paystub.query.filter(
            Paystub.user_id == user.id,
            Paystub.created_at >= billing_start
        ).count()
        
        # Calculate costs
        included = plan_config['included_paystubs']
        
        if included == -1:  # Unlimited
            overage = 0
            overage_cost = 0
            remaining = -1
        else:
            overage = max(0, paystub_count - included)
            overage_cost = overage * plan_config['additional_cost']
            remaining = max(0, included - paystub_count)
        
        return {
            'plan': plan_config['name'],
            'billing_period_start': billing_start.isoformat(),
            'billing_period_end': billing_end.isoformat(),
            'included_paystubs': included,
            'paystubs_generated': paystub_count,
            'remaining': remaining,
            'overage_count': overage,
            'overage_cost': overage_cost,
            'total_cost': plan_config['price'] + overage_cost
        }
    
    @staticmethod
    def get_billing_period_end(user):
        """Get end of billing period"""
        if not user.stripe_subscription_id:
            # Default to end of current month
            next_month = datetime.now().replace(day=28) + timedelta(days=4)
            return next_month.replace(day=1) - timedelta(seconds=1)
        
        try:
            subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)
            return datetime.fromtimestamp(subscription.current_period_end)
        except:
            next_month = datetime.now().replace(day=28) + timedelta(days=4)
            return next_month.replace(day=1) - timedelta(seconds=1)
```

---

### 3. Update `routes/paystubs.py` - Add Billing Check

```python
# routes/paystubs.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Paystub, db
from billing import BillingManager

paystubs_bp = Blueprint('paystubs', __name__)

@paystubs_bp.route('/api/paystubs/generate-complete', methods=['POST'])
@jwt_required()
def generate_paystub():
    """Generate a new paystub with billing check"""
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    # Check billing limits
    billing_check = BillingManager.check_paystub_limit(user)
    
    if not billing_check['allowed']:
        return jsonify({
            'success': False,
            'message': 'Plan limit reached. Please upgrade your plan.',
            'billing_info': billing_check
        }), 403
    
    # Get paystub data from request
    data = request.get_json()
    
    try:
        # Generate paystub (your existing logic here)
        # ... paystub generation code ...
        
        # After successful generation, bill overage if needed
        if billing_check['overage'] > 0:
            billing_result = BillingManager.bill_overage(user)
            
            if not billing_result['success']:
                # Log error but don't fail the paystub generation
                print(f"Billing error: {billing_result.get('error')}")
        
        return jsonify({
            'success': True,
            'message': billing_check['message'],
            'paystub_id': 'PS123',  # Your generated paystub ID
            'billing_info': {
                'overage_charge': billing_check['cost'],
                'remaining_paystubs': billing_check['remaining']
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error generating paystub: {str(e)}'
        }), 500
```

---

### 4. Update `routes/stripe.py` - Checkout & Webhooks

```python
# routes/stripe.py
import stripe
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db

stripe_bp = Blueprint('stripe', __name__)
stripe.api_key = current_app.config['STRIPE_SECRET_KEY']

@stripe_bp.route('/api/stripe/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Create Stripe checkout session for subscription"""
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    data = request.get_json()
    plan = data.get('plan', 'professional')
    
    # Get price ID from config
    price_id = current_app.config['STRIPE_PRICES'].get(plan)
    
    if not price_id:
        return jsonify({
            'success': False,
            'message': 'Invalid plan selected'
        }), 400
    
    try:
        # Create or get Stripe customer
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={'user_id': user.id}
            )
            user.stripe_customer_id = customer.id
            db.session.commit()
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{request.host_url}dashboard?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{request.host_url}?success=false",
            metadata={
                'user_id': user.id,
                'plan': plan
            }
        )
        
        return jsonify({
            'success': True,
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id
        }), 200
    
    except stripe.error.StripeError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400


@stripe_bp.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, current_app.config['STRIPE_WEBHOOK_SECRET']
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle subscription events
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_successful_checkout(session)
    
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_update(subscription)
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_cancelled(subscription)
    
    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_successful_payment(invoice)
    
    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        handle_failed_payment(invoice)
    
    return jsonify({'success': True}), 200


def handle_successful_checkout(session):
    """Handle successful checkout"""
    user_id = session['metadata'].get('user_id')
    plan = session['metadata'].get('plan')
    subscription_id = session.get('subscription')
    
    user = User.query.get(user_id)
    if user:
        user.subscription_tier = plan
        user.stripe_subscription_id = subscription_id
        user.subscription_status = 'active'
        db.session.commit()


def handle_subscription_update(subscription):
    """Handle subscription updates"""
    customer_id = subscription['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user:
        user.subscription_status = subscription['status']
        
        # Update plan if price changed
        price_id = subscription['items']['data'][0]['price']['id']
        for plan, pid in current_app.config['STRIPE_PRICES'].items():
            if pid == price_id:
                user.subscription_tier = plan
                break
        
        db.session.commit()


def handle_subscription_cancelled(subscription):
    """Handle subscription cancellation"""
    customer_id = subscription['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user:
        user.subscription_status = 'cancelled'
        db.session.commit()


def handle_successful_payment(invoice):
    """Handle successful invoice payment"""
    customer_id = invoice['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user and user.subscription_status != 'active':
        user.subscription_status = 'active'
        db.session.commit()


def handle_failed_payment(invoice):
    """Handle failed payment"""
    customer_id = invoice['customer']
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    
    if user:
        user.subscription_status = 'past_due'
        db.session.commit()


@stripe_bp.route('/api/stripe/billing-portal', methods=['POST'])
@jwt_required()
def create_billing_portal():
    """Create Stripe customer portal session"""
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user.stripe_customer_id:
        return jsonify({
            'success': False,
            'message': 'No billing account found'
        }), 404
    
    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{request.host_url}dashboard"
        )
        
        return jsonify({
            'success': True,
            'url': portal_session.url
        }), 200
    
    except stripe.error.StripeError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
```

---

### 5. Add Billing Dashboard Endpoint

```python
# routes/dashboard.py
from billing import BillingManager

@dashboard_bp.route('/api/dashboard/billing', methods=['GET'])
@jwt_required()
def get_billing_info():
    """Get user's billing information and usage"""
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Get usage summary
    usage = BillingManager.get_usage_summary(user)
    
    # Get plan details
    plan_config = current_app.config['PLAN_LIMITS'][user.subscription_tier]
    
    return jsonify({
        'success': True,
        'billing': {
            'current_plan': {
                'tier': user.subscription_tier,
                'name': plan_config['name'],
                'monthly_price': plan_config['price'],
                'included_paystubs': plan_config['included_paystubs'],
                'additional_cost': plan_config['additional_cost'],
                'features': plan_config['features']
            },
            'usage': usage,
            'subscription_status': user.subscription_status
        }
    }), 200
```

---

## 🔐 Environment Variables

Add these to your `.env` file or Elastic Beanstalk environment:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS=price_xxxxxxxxxxxxx
```

---

## 🚀 Deployment Steps

### 1. Update Stripe Dashboard
```
1. Create 3 products (Starter, Professional, Business)
2. Copy Price IDs
3. Set up webhook endpoint: https://saurellius.drpaystub.com/api/stripe/webhook
4. Select events: 
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
5. Copy webhook secret
```

### 2. Update Environment Variables
```bash
eb setenv \
  STRIPE_SECRET_KEY=sk_live_xxxxx \
  STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx \
  STRIPE_PRICE_STARTER=price_xxxxx \
  STRIPE_PRICE_PROFESSIONAL=price_xxxxx \
  STRIPE_PRICE_BUSINESS=price_xxxxx
```

### 3. Deploy Application
```bash
# Update code
git add .
git commit -m "Add Stripe billing integration"

# Deploy
eb deploy
```

---

## 📊 Testing

### Test Overage Billing
```python
# Test script
from billing import BillingManager
from models import User

user = User.query.filter_by(email='test@example.com').first()

# Check current limit
result = BillingManager.check_paystub_limit(user)
print(f"Allowed: {result['allowed']}")
print(f"Remaining: {result['remaining']}")
print(f"Overage: {result['overage']}")
print(f"Cost: ${result['cost']}")

# Get usage summary
summary = BillingManager.get_usage_summary(user)
print(summary)
```

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

---

## 📱 Frontend Integration

Update your signup form to pass the selected plan:

```javascript
// In auth pages (index.html)
async function handleSignup(event) {
    event.preventDefault();
    
    const plan = document.getElementById('signupPlan').value;
    
    // 1. Create user account
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: document.getElementById('signupName').value,
            email: document.getElementById('signupEmail').value,
            phone: document.getElementById('signupPhone').value,
            password: document.getElementById('signupPassword').value,
            subscription_tier: plan
        })
    });
    
    const data = await response.json();
    
    // 2. Create Stripe checkout session
    const checkoutResponse = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({ plan: plan })
    });
    
    const checkoutData = await checkoutResponse.json();
    
    // 3. Redirect to Stripe
    window.location.href = checkoutData.checkout_url;
}
```

---

## ✅ Checklist

- [ ] Create 3 products in Stripe Dashboard
- [ ] Copy all Price IDs
- [ ] Set up webhook endpoint
- [ ] Add environment variables
- [ ] Add `billing.py` file
- [ ] Update `routes/paystubs.py`