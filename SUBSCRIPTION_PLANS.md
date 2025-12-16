# A-Play Subscription Plans Documentation

## Overview
A-Play offers tiered subscription plans that provide users with exclusive benefits, priority access, and enhanced features for booking events, tables, and experiences across Ghana.

---

## 📊 Subscription Tiers

### 1. **Bronze Tier** (Free)
**Price**: Free
**Duration**: Lifetime

**Features**:
- ✅ Browse all events and venues
- ✅ Basic event booking
- ✅ View upcoming events
- ✅ Access to public reviews
- ✅ Standard customer support
- ✅ Basic profile customization

**Limitations**:
- ❌ No priority booking
- ❌ No exclusive events access
- ❌ Standard pricing (no discounts)
- ❌ Limited support response time

**Points System**:
- Earn 10 points per event booking
- Earn 5 points per review posted
- 1,000 points needed to upgrade to Silver

---

### 2. **Silver Tier**
**Price**: GH₵ 50/month or GH₵ 500/year
**Duration**: Monthly or Annual

**Features**:
- ✅ All Bronze features
- ✅ **5% discount** on all event bookings
- ✅ **Priority booking** access (book 24 hours early)
- ✅ Access to **Silver-exclusive events**
- ✅ **Enhanced profile badge** (Silver)
- ✅ Priority customer support (24-hour response)
- ✅ **1 free table reservation** per month (restaurants/clubs)
- ✅ Birthday month special discount (additional 10%)

**Limitations**:
- ❌ No VIP lounge access
- ❌ No concierge service
- ❌ No event upgrade privileges

**Points System**:
- Earn 20 points per event booking
- Earn 10 points per review posted
- Bonus 100 points on subscription renewal
- 2,500 points needed to upgrade to Gold

---

### 3. **Gold Tier** ⭐
**Price**: GH₵ 120/month or GH₵ 1,200/year
**Duration**: Monthly or Annual

**Features**:
- ✅ All Silver features
- ✅ **10% discount** on all event bookings
- ✅ **48-hour early booking** access
- ✅ Access to **Gold-exclusive events**
- ✅ **Enhanced profile badge** (Gold)
- ✅ **Premium customer support** (12-hour response)
- ✅ **3 free table reservations** per month
- ✅ **1 free event upgrade** per month (zone upgrade)
- ✅ **VIP lounge access** at select venues
- ✅ **Concierge service** (3 requests per month)
- ✅ **Complimentary meet & greet** at 2 events per year
- ✅ Birthday month special discount (additional 15%)

**Limitations**:
- ❌ No unlimited concierge requests
- ❌ No personal event coordinator

**Points System**:
- Earn 30 points per event booking
- Earn 15 points per review posted
- Bonus 250 points on subscription renewal
- 5,000 points needed to upgrade to Platinum

---

### 4. **Platinum Tier** 💎
**Price**: GH₵ 250/month or GH₵ 2,500/year
**Duration**: Monthly or Annual

**Features**:
- ✅ All Gold features
- ✅ **15% discount** on all event bookings
- ✅ **72-hour early booking** access (3-day exclusive window)
- ✅ Access to **Platinum-exclusive events**
- ✅ **Premium profile badge** (Platinum with animation)
- ✅ **VIP customer support** (6-hour response, dedicated line)
- ✅ **Unlimited table reservations**
- ✅ **Unlimited event upgrades** (zone/seat upgrades)
- ✅ **All-access VIP lounge** pass
- ✅ **Unlimited concierge service**
- ✅ **Personal event coordinator**
- ✅ **Complimentary meet & greet** at all events
- ✅ **Free parking** at supported venues
- ✅ **Backstage access** at select events (2 per year)
- ✅ **Birthday month VIP treatment** (25% discount + free upgrade)
- ✅ **Quarterly exclusive gift** from partners

**Points System**:
- Earn 50 points per event booking
- Earn 25 points per review posted
- Bonus 500 points on subscription renewal
- Max tier reached - points can be redeemed for rewards

---

## 💳 Payment & Billing

### Payment Methods
- ✅ Mobile Money (MTN, Vodafone, AirtelTigo)
- ✅ Credit/Debit Cards (Visa, Mastercard)
- ✅ PayStack integration
- ✅ Bank Transfer (for annual subscriptions)

### Billing Cycle
- **Monthly**: Auto-renewed on the same date each month
- **Annual**: Auto-renewed after 12 months (save 15-20%)

### Cancellation Policy
- Cancel anytime before renewal date
- No refunds for partial months
- Benefits remain active until end of billing period
- Tier status maintained for 30 days grace period

---

## 🎁 Referral Rewards

### Referral Program
- Share your unique referral code
- Friend must subscribe to Silver tier or higher
- **You earn**: 100 bonus points + 1 month extension
- **Friend earns**: 50 bonus points + 10% first month discount

### Maximum Referrals
- Bronze/Silver: Up to 5 referrals per month
- Gold: Up to 10 referrals per month
- Platinum: Unlimited referrals

---

## 🏆 Points & Rewards System

### Point Earning Activities
| Activity | Bronze | Silver | Gold | Platinum |
|----------|---------|---------|-------|----------|
| Event Booking | 10 pts | 20 pts | 30 pts | 50 pts |
| Review Posted | 5 pts | 10 pts | 15 pts | 25 pts |
| Referral Success | 50 pts | 100 pts | 150 pts | 200 pts |
| Subscription Renewal | - | 100 pts | 250 pts | 500 pts |
| Birthday Month Bonus | 25 pts | 50 pts | 100 pts | 200 pts |

### Point Redemption
**500 Points** = GH₵ 10 discount voucher
**1,000 Points** = 1 free table reservation
**2,000 Points** = 1 free event ticket (up to GH₵ 100)
**5,000 Points** = 1 month Gold subscription upgrade
**10,000 Points** = VIP backstage pass for any event

---

## 📱 Subscription Management (In-App)

### How to Subscribe
1. Navigate to **Profile** → **Subscription**
2. View available plans
3. Select desired tier (Monthly/Annual)
4. Complete payment via PayStack
5. Instant activation upon successful payment

### How to Upgrade
1. Go to **Profile** → **Subscription** → **Upgrade**
2. Pay difference for remaining billing period
3. Immediate access to new tier benefits

### How to Downgrade
1. Go to **Profile** → **Subscription** → **Change Plan**
2. Select lower tier
3. Change takes effect at next billing cycle
4. No immediate charge or refund

### How to Cancel
1. Go to **Profile** → **Subscription** → **Cancel**
2. Confirm cancellation
3. Benefits remain until end of current period
4. Auto-renewal disabled

---

## 🔒 Subscription Data Model

### Database Structure

**Table**: `user_subscriptions`

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  tier TEXT NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime')),
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  payment_method TEXT,
  amount_paid DECIMAL(10, 2),
  currency TEXT DEFAULT 'GHS',
  reward_points INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Table**: `subscription_plans`

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  description TEXT,
  price_monthly DECIMAL(10, 2),
  price_annual DECIMAL(10, 2),
  currency TEXT DEFAULT 'GHS',
  features JSONB,
  discount_percentage INTEGER DEFAULT 0,
  early_booking_hours INTEGER DEFAULT 0,
  free_reservations_per_month INTEGER DEFAULT 0,
  priority_support BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛡️ Subscription Benefits Validation

### Backend Validation (Supabase Edge Functions)

**Function**: `verify-subscription-tier`
- Validates user's current tier
- Returns benefits available to user
- Checks subscription expiry
- Handles grace periods

**Function**: `apply-subscription-discount`
- Calculates discount based on tier
- Applies to event bookings
- Returns final price with discount

**Function**: `check-early-booking-access`
- Determines if user can access early booking
- Returns earliest booking time based on tier

---

## 📊 Analytics & Reporting

### Key Metrics to Track
- **Subscription Revenue**: Monthly/Annual recurring revenue
- **Tier Distribution**: % of users in each tier
- **Churn Rate**: Subscription cancellations per month
- **Upgrade Rate**: Users upgrading to higher tiers
- **Point Redemption**: Points earned vs redeemed
- **Referral Success**: Successful referrals per tier

---

## 🎯 Marketing Strategies

### Promotional Campaigns
1. **First Month Free** (Silver tier, new users)
2. **Annual Discount** (Save 15-20% on annual plans)
3. **Upgrade Bonus** (50% off first month when upgrading)
4. **Loyalty Rewards** (Extra 100 points after 6 months)
5. **Partner Offers** (Exclusive discounts with event organizers)

---

## 🔄 Integration Points

### User App Integration
- **File**: `lib/features/subscription/screens/subscription_plans_screen.dart`
- **Provider**: `lib/features/subscription/provider/subscription_provider.dart`
- **Service**: `lib/features/subscription/service/subscription_service.dart`

### Admin Panel Requirements
- Manage subscription plans (CRUD)
- View subscription analytics
- Process refunds/cancellations
- Generate revenue reports
- Manage promotional campaigns

---

## 📝 Legal & Compliance

### Terms of Service
- Auto-renewal notification requirements
- Cancellation policy disclosure
- Refund policy (non-refundable)
- Privacy policy for payment data

### Regulatory Compliance
- PCI DSS compliance (via PayStack)
- Ghana Data Protection Act compliance
- Consumer protection laws
- Payment processor requirements

---

## 🚀 Future Enhancements

### Planned Features
1. **Family Plans**: Share subscription with family (up to 5 members)
2. **Corporate Plans**: Bulk subscriptions for companies
3. **Student Discounts**: 30% off with valid student ID
4. **Seasonal Passes**: Special event-specific subscriptions
5. **Gift Subscriptions**: Purchase subscriptions as gifts

---

## 📞 Support & Resources

### Customer Support
- **Bronze**: Email support (48-hour response)
- **Silver**: Email + Chat (24-hour response)
- **Gold**: Priority support line (12-hour response)
- **Platinum**: Dedicated account manager (6-hour response)

### Help Resources
- In-app FAQ section
- Video tutorials for subscription management
- Email: subscriptions@aplay.com.gh
- WhatsApp: +233 XX XXX XXXX

---

**Last Updated**: December 15, 2024
**Version**: 2.0.0
**Document Owner**: A-Play Product Team
