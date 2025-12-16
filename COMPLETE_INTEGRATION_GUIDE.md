# 📚 A-Play Complete Integration Guide
## User App & Organization App - All Changes & Updates Reference

**Last Updated:** 2025-12-16
**Version:** 1.0
**Admin Panel Version:** Production Ready

---

## 📋 Table of Contents

1. [Overview - What Changed](#overview---what-changed)
2. [Database Schema Updates](#database-schema-updates)
3. [Subscription System (4-Tier)](#subscription-system-4-tier)
4. [Events Management](#events-management)
5. [Venues Management](#venues-management)
6. [Points & Rewards System](#points--rewards-system)
7. [Referral System](#referral-system)
8. [Payment Integration (Paystack)](#payment-integration-paystack)
9. [User Subscriptions Tracking](#user-subscriptions-tracking)
10. [Real-Time Updates](#real-time-updates)
11. [API Integration Examples](#api-integration-examples)
12. [TypeScript Types & Interfaces](#typescript-types--interfaces)
13. [Security & RLS Policies](#security--rls-policies)
14. [Testing Checklist](#testing-checklist)

---

## 🎯 Overview - What Changed

### Admin Panel (✅ Complete)
The admin panel now has full CRUD operations for:
- ✅ **Subscription Plans** - 4-tier system (Free → Gold → Platinum → Black)
- ✅ **Events Management** - Create, edit, delete events with media
- ✅ **Venues Management** - Full venue CRUD with categories
- ✅ **User Subscriptions** - View and manage user subscriptions
- ✅ **Analytics Dashboard** - Revenue tracking, tier distribution

### What Your Apps Need to Integrate
Both **User App** and **Organization App** need to:
1. Query the updated database schema
2. Display the 4 subscription tiers
3. Handle user subscription flow
4. Implement points/rewards system
5. Track referrals
6. Apply tier-based benefits (discounts, early access, etc.)
7. Integrate with Paystack for payments

---

## 🗄️ Database Schema Updates

### New Tables Created

#### 1. **subscription_plans** (Updated Schema)

```sql
Table: subscription_plans
Columns:
  - id (TEXT, PRIMARY KEY) -- Changed from UUID to TEXT
  - name (TEXT) -- "Free", "Gold", "Platinum", "Black"
  - description (TEXT)
  - price_monthly (DECIMAL) -- New column
  - price_yearly (DECIMAL) -- New column
  - tier_level (INTEGER) -- 1, 2, 3, 4
  - features (JSONB) -- Rich feature set
  - benefits (TEXT[]) -- Array of benefit strings
  - is_active (BOOLEAN)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

**Key Changes:**
- ❗ `id` changed from `UUID` to `TEXT`
- ✅ Added `price_monthly` and `price_yearly` (old `price` is deprecated)
- ✅ Added `tier_level` for sorting (1=Free, 2=Gold, 3=Platinum, 4=Black)
- ✅ Added `benefits` array for bullet-point lists

**Example Row:**
```json
{
  "id": "abc123-def456",
  "name": "Gold",
  "description": "Early alerts, double points, concierge access",
  "price_monthly": 120.00,
  "price_yearly": 1200.00,
  "tier_level": 2,
  "features": {
    "tier": "Gold",
    "color": "#FFD700",
    "points_multiplier": 2,
    "discount_percentage": 10,
    "early_booking_hours": 48,
    "concierge_access": true,
    "concierge_hours": "business_hours",
    "vip_entry": false
  },
  "benefits": [
    "All Free tier features",
    "Double points on all activities",
    "Early alerts for new events (48 hours)",
    "10% discount on event bookings"
  ],
  "is_active": true
}
```

#### 2. **user_subscriptions** (Updated Schema)

```sql
Table: user_subscriptions
Columns:
  - id (UUID, PRIMARY KEY)
  - user_id (UUID, REFERENCES profiles)
  - plan_id (TEXT, REFERENCES subscription_plans) -- Changed from UUID
  - tier (TEXT) -- "Free", "Gold", "Platinum", "Black"
  - billing_cycle (TEXT) -- "monthly", "annual", "lifetime"
  - status (TEXT) -- "active", "cancelled", "expired"
  - start_date (TIMESTAMP)
  - end_date (TIMESTAMP)
  - payment_method (TEXT) -- "paystack", "cash", etc.
  - payment_reference (TEXT) -- Paystack reference
  - reward_points (INTEGER) -- Current points balance
  - referral_code (TEXT) -- User's unique referral code
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

**Key Changes:**
- ❗ `plan_id` changed from `UUID` to `TEXT` to match subscription_plans.id
- ✅ Added `tier` for quick tier lookup
- ✅ Added `billing_cycle` (monthly/annual/lifetime)
- ✅ Added `payment_method` and `payment_reference`
- ✅ Added `reward_points` for loyalty tracking
- ✅ Added `referral_code` for referral system

#### 3. **point_redemptions** (New Table)

```sql
Table: point_redemptions
Columns:
  - id (UUID, PRIMARY KEY)
  - user_id (UUID, REFERENCES profiles)
  - points_spent (INTEGER)
  - reward_type (TEXT) -- "discount", "free_event", "upgrade", etc.
  - reward_value (DECIMAL) -- Monetary value of reward
  - description (TEXT)
  - status (TEXT) -- "pending", "redeemed", "expired", "cancelled"
  - created_at (TIMESTAMP)
  - expires_at (TIMESTAMP)
```

**Purpose:** Track when users redeem their loyalty points for rewards.

**Example Use Cases:**
- User spends 500 points for GH₵50 discount
- User spends 1000 points for free event upgrade
- User spends 2000 points for VIP lounge access

#### 4. **referrals** (New Table)

```sql
Table: referrals
Columns:
  - id (UUID, PRIMARY KEY)
  - referrer_user_id (UUID, REFERENCES profiles)
  - referred_user_id (UUID, REFERENCES profiles)
  - referral_code (TEXT)
  - subscription_plan_id (TEXT, REFERENCES subscription_plans)
  - tier (TEXT)
  - status (TEXT) -- "pending", "completed", "expired"
  - points_awarded (INTEGER)
  - bonus_applied (BOOLEAN)
  - created_at (TIMESTAMP)
  - completed_at (TIMESTAMP)
```

**Purpose:** Track user referrals and bonus point awards.

**Referral Flow:**
1. User A shares referral code
2. User B signs up with code → `status = "pending"`
3. User B subscribes to a plan → `status = "completed"`
4. User A gets bonus points based on tier

---

## 🎖️ Subscription System (4-Tier)

### The 4 Tiers

| Tier | Level | Monthly | Annual | Discount | Points Multiplier | Early Access | Concierge |
|------|-------|---------|--------|----------|-------------------|--------------|-----------|
| **Free** | 1 | GH₵0 | GH₵0 | 0% | 1x | 0 hours | ❌ |
| **Gold** | 2 | GH₵120 | GH₵1,200 | 10% | 2x | 48 hours | Business hours |
| **Platinum** | 3 | GH₵250 | GH₵2,500 | 15% | 3x | 72 hours | 24/7 |
| **Black** | 4 | GH₵500 | GH₵5,000 | 20% | 5x | 168 hours (7 days) | 24/7 Dedicated |

### Fetching Plans in Your Apps

```typescript
// User App / Org App - Fetch active subscription plans
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true) // Only active plans
        .order("tier_level", { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns
  });
}
```

### Displaying Subscription Plans

```tsx
// User App - Subscription Selection Page
export function SubscriptionPage() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h1>Choose Your Membership</h1>

      {/* Billing Toggle */}
      <div className="flex gap-4 justify-center mb-8">
        <button onClick={() => setBillingCycle("monthly")}>Monthly</button>
        <button onClick={() => setBillingCycle("annual")}>Annual (Save 17%)</button>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {plans?.map((plan) => {
          const price = billingCycle === "monthly"
            ? plan.price_monthly
            : plan.price_yearly;

          return (
            <div key={plan.id} className="border rounded-lg p-6">
              {/* Tier Badge */}
              <div className="badge">
                {plan.features.points_multiplier}x Points
              </div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-gray-600">{plan.description}</p>

              {/* Price */}
              <div className="mt-4">
                <span className="text-4xl font-bold">GH₵{price}</span>
                <span className="text-sm">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>

              {/* Key Features */}
              <div className="mt-6 space-y-2">
                {plan.features.discount_percentage > 0 && (
                  <div>✓ {plan.features.discount_percentage}% discount</div>
                )}
                {plan.features.early_booking_hours > 0 && (
                  <div>✓ {plan.features.early_booking_hours}h early access</div>
                )}
                {plan.features.concierge_access && (
                  <div>✓ Concierge ({plan.features.concierge_hours})</div>
                )}
                {plan.features.vip_entry && <div>✓ VIP Entry</div>}
              </div>

              {/* Benefits */}
              <div className="mt-4">
                <strong>Benefits:</strong>
                <ul className="text-sm mt-2">
                  {plan.benefits?.slice(0, 5).map((benefit, idx) => (
                    <li key={idx}>• {benefit}</li>
                  ))}
                </ul>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => handleSubscribe(plan, billingCycle)}
                className="w-full mt-6 btn-primary"
              >
                {plan.price_monthly === 0 ? "Get Started Free" : "Subscribe Now"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Features Object Structure

Every plan has a `features` JSONB object with these common fields:

```typescript
interface PlanFeatures {
  tier: string; // "Free", "Gold", "Platinum", "Black"
  color: string; // Hex color code
  points_multiplier: number; // 1, 2, 3, 5
  discount_percentage: number; // 0, 10, 15, 20
  early_booking_hours: number; // 0, 48, 72, 168
  concierge_access: boolean;
  concierge_hours: string; // "none", "business_hours", "24/7"
  concierge_requests_per_month?: number; // -1 = unlimited
  vip_entry: boolean;
  priority_support: boolean;
  free_reservations_per_month: number; // -1 = unlimited
  vip_lounge_access: boolean;
  event_upgrades_per_month?: number; // -1 = unlimited
  points_per_booking: number; // 10, 20, 30, 50
  points_per_review: number; // 5, 10, 15, 25
  referral_limit: number; // 5, 10, -1 (unlimited)
  support_response_hours: number; // 48, 12, 6, 1
  badge_type: string; // "basic", "gold", "platinum", "black"

  // Premium features (Platinum & Black only)
  all_access_vip_lounge?: boolean;
  meet_greet_per_year?: number;
  backstage_access_per_year?: number;
  free_parking?: boolean;
  personal_coordinator?: boolean;
  quarterly_gifts?: boolean;
  animated_badge?: boolean;

  // Black tier exclusive
  invite_only?: boolean;
  exclusive_first_access?: boolean;
  dedicated_concierge?: boolean;
  private_lounge_access?: boolean;
  valet_service?: boolean;
  dedicated_account_manager?: boolean;
  luxury_gifts?: boolean;
  private_events?: boolean;
  celebrity_access?: boolean;
  luxury_transport?: boolean;
  international_perks?: boolean;
}
```

---

## 🎉 Events Management

### Events Table Schema

```sql
Table: events
Columns:
  - id (UUID, PRIMARY KEY)
  - title (TEXT)
  - description (TEXT)
  - event_date (TIMESTAMP)
  - end_date (TIMESTAMP)
  - venue_id (UUID, REFERENCES venues)
  - category (TEXT)
  - event_type (TEXT) -- "concert", "club_night", "festival", etc.
  - capacity (INTEGER)
  - price (DECIMAL)
  - vip_price (DECIMAL)
  - early_bird_price (DECIMAL)
  - status (TEXT) -- "draft", "published", "cancelled", "completed"
  - featured_image (TEXT) -- URL to main image
  - images (TEXT[]) -- Array of additional image URLs
  - organizer_id (UUID, REFERENCES profiles)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

### Fetching Events (User App)

```typescript
// Fetch upcoming events
export function useUpcomingEvents() {
  return useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          venues (
            id,
            name,
            address,
            city,
            featured_image
          )
        `)
        .eq("status", "published")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
}
```

### Early Access for Premium Tiers

```typescript
// Check if user has early access to event
export function hasEarlyAccess(
  userTier: string,
  eventDate: Date,
  tierFeatures: PlanFeatures
): boolean {
  const now = new Date();
  const earlyAccessHours = tierFeatures.early_booking_hours || 0;
  const earlyAccessDate = new Date(eventDate);
  earlyAccessDate.setHours(earlyAccessDate.getHours() - earlyAccessHours);

  return now >= earlyAccessDate;
}

// Example usage
const event = events[0];
const userSubscription = await getUserSubscription(userId);
const plan = await getSubscriptionPlan(userSubscription.plan_id);

if (hasEarlyAccess(userSubscription.tier, event.event_date, plan.features)) {
  // Show "Book Now" button
} else {
  // Show countdown timer or "Available in X hours"
}
```

### Applying Tier Discounts

```typescript
// Calculate discounted price based on user tier
export function calculateEventPrice(
  basePrice: number,
  userTier: string,
  tierFeatures: PlanFeatures
): number {
  const discountPercentage = tierFeatures.discount_percentage || 0;
  const discount = (basePrice * discountPercentage) / 100;
  return basePrice - discount;
}

// Example
const basePrice = 100; // GH₵100
const goldFeatures = { discount_percentage: 10, ... };
const finalPrice = calculateEventPrice(basePrice, "Gold", goldFeatures);
// Returns: 90 (GH₵90 - 10% discount)
```

---

## 🏢 Venues Management

### Venues Table Schema

```sql
Table: venues
Columns:
  - id (UUID, PRIMARY KEY)
  - name (TEXT)
  - description (TEXT)
  - address (TEXT)
  - city (TEXT)
  - country (TEXT)
  - latitude (DECIMAL)
  - longitude (DECIMAL)
  - capacity (INTEGER)
  - venue_type (TEXT) -- "club", "arena", "bar", "outdoor", etc.
  - amenities (TEXT[]) -- ["parking", "vip_lounge", "wheelchair_accessible"]
  - featured_image (TEXT)
  - images (TEXT[])
  - contact_phone (TEXT)
  - contact_email (TEXT)
  - website (TEXT)
  - status (TEXT) -- "active", "inactive", "maintenance"
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

### Fetching Venues

```typescript
// User App - Get all active venues
export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

// Get venue with upcoming events
export function useVenueWithEvents(venueId: string) {
  return useQuery({
    queryKey: ["venue", venueId, "with-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select(`
          *,
          events (
            id,
            title,
            event_date,
            price,
            status,
            featured_image
          )
        `)
        .eq("id", venueId)
        .eq("events.status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });
}
```

---

## 🎁 Points & Rewards System

### How Points Work

Users earn points based on their tier multiplier:

| Activity | Base Points | Free (1x) | Gold (2x) | Platinum (3x) | Black (5x) |
|----------|-------------|-----------|-----------|---------------|------------|
| Book Event | 10 | 10 | 20 | 30 | 50 |
| Post Review | 5 | 5 | 10 | 15 | 25 |
| Referral Success | 50 | 50 | 100 | 150 | 250 |
| Monthly Subscription | - | - | 100 | 250 | 500 |

### Awarding Points

```typescript
// Award points to user after action
export async function awardPoints(
  userId: string,
  action: "booking" | "review" | "referral" | "subscription",
  tierFeatures: PlanFeatures
) {
  // Get base points for action
  const basePoints = {
    booking: tierFeatures.points_per_booking || 10,
    review: tierFeatures.points_per_review || 5,
    referral: 50,
    subscription: tierFeatures.tier === "Gold" ? 100 :
                  tierFeatures.tier === "Platinum" ? 250 :
                  tierFeatures.tier === "Black" ? 500 : 0,
  };

  const points = basePoints[action];

  // Update user's reward_points
  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      reward_points: supabase.raw(`reward_points + ${points}`)
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Example: Award points after event booking
await awardPoints(currentUser.id, "booking", goldFeatures);
```

### Redeeming Points

```typescript
// Redeem points for a reward
export async function redeemPoints(
  userId: string,
  pointsToSpend: number,
  rewardType: string,
  rewardValue: number,
  description: string
) {
  // Check if user has enough points
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("reward_points")
    .eq("user_id", userId)
    .single();

  if (!subscription || subscription.reward_points < pointsToSpend) {
    throw new Error("Insufficient points");
  }

  // Create redemption record
  const { data: redemption, error: redemptionError } = await supabase
    .from("point_redemptions")
    .insert({
      user_id: userId,
      points_spent: pointsToSpend,
      reward_type: rewardType,
      reward_value: rewardValue,
      description: description,
      status: "redeemed",
    })
    .select()
    .single();

  if (redemptionError) throw redemptionError;

  // Deduct points from user
  const { error: updateError } = await supabase
    .from("user_subscriptions")
    .update({
      reward_points: subscription.reward_points - pointsToSpend
    })
    .eq("user_id", userId);

  if (updateError) throw updateError;

  return redemption;
}

// Example: Redeem 500 points for GH₵50 discount
await redeemPoints(
  userId,
  500,
  "discount",
  50.00,
  "GH₵50 discount on next booking"
);
```

### Displaying User Points

```tsx
// User App - Points Balance Widget
export function PointsBalance({ userId }: { userId: string }) {
  const { data: subscription } = useQuery({
    queryKey: ["user-subscription", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("reward_points, tier")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="points-widget">
      <div className="points-balance">
        {subscription?.reward_points || 0} Points
      </div>
      <div className="tier-badge">
        {subscription?.tier || "Free"} Member
      </div>
    </div>
  );
}
```

---

## 👥 Referral System

### Generating Referral Codes

```typescript
// Generate unique referral code for user
export function generateReferralCode(userId: string, userName: string): string {
  const cleanName = userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const shortId = userId.substring(0, 6).toUpperCase();
  return `${cleanName}-${shortId}`;
}

// Example: John Doe (user-id: abc123-def456)
// Returns: "JOHNDOE-ABC123"
```

### Tracking Referrals

```typescript
// When new user signs up with referral code
export async function trackReferral(
  referralCode: string,
  newUserId: string
) {
  // Find the referrer
  const { data: referrer } = await supabase
    .from("user_subscriptions")
    .select("user_id, plan_id, tier")
    .eq("referral_code", referralCode)
    .single();

  if (!referrer) throw new Error("Invalid referral code");

  // Create referral record
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      referrer_user_id: referrer.user_id,
      referred_user_id: newUserId,
      referral_code: referralCode,
      status: "pending", // Will complete when new user subscribes
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Completing Referrals (Award Bonus)

```typescript
// When referred user subscribes to a plan
export async function completeReferral(
  referredUserId: string,
  subscriptionPlanId: string,
  tier: string
) {
  // Find pending referral
  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_user_id", referredUserId)
    .eq("status", "pending")
    .single();

  if (!referral) return; // No referral to complete

  // Calculate bonus points based on tier
  const bonusPoints = {
    "Free": 0,
    "Gold": 100,
    "Platinum": 150,
    "Black": 250,
  }[tier] || 0;

  // Update referral status
  await supabase
    .from("referrals")
    .update({
      status: "completed",
      subscription_plan_id: subscriptionPlanId,
      tier: tier,
      points_awarded: bonusPoints,
      bonus_applied: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  // Award bonus points to referrer
  await supabase
    .from("user_subscriptions")
    .update({
      reward_points: supabase.raw(`reward_points + ${bonusPoints}`)
    })
    .eq("user_id", referral.referrer_user_id);

  return bonusPoints;
}
```

### Referral Dashboard (User App)

```tsx
// User's referral stats and code
export function ReferralDashboard({ userId }: { userId: string }) {
  const { data: subscription } = useQuery({
    queryKey: ["user-subscription", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("referral_code, tier")
        .eq("user_id", userId)
        .single();
      return data;
    },
  });

  const { data: referrals } = useQuery({
    queryKey: ["referrals", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", userId)
        .order("created_at", { descending: true });
      return data;
    },
  });

  const totalReferrals = referrals?.length || 0;
  const completedReferrals = referrals?.filter(r => r.status === "completed").length || 0;
  const totalPointsEarned = referrals?.reduce((sum, r) => sum + (r.points_awarded || 0), 0) || 0;

  return (
    <div className="referral-dashboard">
      <h2>Your Referral Code</h2>
      <div className="referral-code">
        {subscription?.referral_code}
        <button onClick={() => copyToClipboard(subscription?.referral_code)}>
          Copy
        </button>
      </div>

      <div className="stats">
        <div>Total Referrals: {totalReferrals}</div>
        <div>Successful: {completedReferrals}</div>
        <div>Points Earned: {totalPointsEarned}</div>
      </div>

      <div className="referral-list">
        {referrals?.map(referral => (
          <div key={referral.id} className="referral-item">
            <span>{referral.tier || "Pending"}</span>
            <span>{referral.status}</span>
            <span>+{referral.points_awarded || 0} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 💳 Payment Integration (Paystack)

### Subscribe to a Plan Flow

```typescript
// Initialize Paystack payment for subscription
export async function initiateSubscriptionPayment(
  userId: string,
  planId: string,
  billingCycle: "monthly" | "annual",
  userEmail: string
) {
  // Get plan details
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (!plan) throw new Error("Plan not found");

  const amount = billingCycle === "monthly"
    ? plan.price_monthly
    : plan.price_yearly;

  // Paystack expects amount in pesewas (kobo)
  const amountInPesewas = Math.round(amount * 100);

  // Initialize Paystack
  const paystack = new PaystackPop();
  paystack.newTransaction({
    key: 'YOUR_PAYSTACK_PUBLIC_KEY',
    email: userEmail,
    amount: amountInPesewas,
    currency: 'GHS',
    ref: generatePaymentReference(userId, planId),
    metadata: {
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      tier: plan.name,
    },
    onSuccess: (transaction) => {
      // Create subscription record
      handleSubscriptionSuccess(transaction, userId, planId, billingCycle, plan.name);
    },
    onCancel: () => {
      console.log('Payment cancelled');
    },
  });
}

function generatePaymentReference(userId: string, planId: string): string {
  return `SUB-${userId.substring(0, 8)}-${Date.now()}`;
}
```

### Creating Subscription After Payment

```typescript
// Create user subscription after successful payment
async function handleSubscriptionSuccess(
  transaction: any,
  userId: string,
  planId: string,
  billingCycle: "monthly" | "annual",
  tier: string
) {
  // Calculate subscription period
  const startDate = new Date();
  const endDate = new Date();
  if (billingCycle === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // Create or update user subscription
  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert({
      user_id: userId,
      plan_id: planId,
      tier: tier,
      billing_cycle: billingCycle,
      status: "active",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      payment_method: "paystack",
      payment_reference: transaction.reference,
      referral_code: generateReferralCode(userId, "UserName"),
    })
    .select()
    .single();

  if (error) throw error;

  // Complete any pending referrals
  await completeReferral(userId, planId, tier);

  return data;
}
```

### Webhook Handler (Backend)

```typescript
// Paystack webhook endpoint (Next.js API route or backend)
export async function POST(request: Request) {
  const body = await request.json();
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(body))
    .digest('hex');

  if (hash !== request.headers.get('x-paystack-signature')) {
    return new Response('Invalid signature', { status: 400 });
  }

  if (body.event === 'charge.success') {
    const { reference, metadata } = body.data;

    // Update subscription in database
    await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        payment_reference: reference,
      })
      .eq("user_id", metadata.user_id)
      .eq("plan_id", metadata.plan_id);
  }

  return new Response('Webhook processed', { status: 200 });
}
```

---

## 📊 User Subscriptions Tracking

### Get User's Current Subscription

```typescript
// Fetch current user subscription with plan details
export function useUserSubscription(userId: string) {
  return useQuery({
    queryKey: ["user-subscription", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription_plans (
            id,
            name,
            description,
            price_monthly,
            price_yearly,
            tier_level,
            features,
            benefits
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (error) throw error;
      return data;
    },
  });
}
```

### Check Subscription Status

```typescript
// Check if user has active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("id, status, end_date")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!data) return false;

  // Check if subscription has expired
  const now = new Date();
  const endDate = new Date(data.end_date);

  if (endDate < now) {
    // Mark as expired
    await supabase
      .from("user_subscriptions")
      .update({ status: "expired" })
      .eq("id", data.id);
    return false;
  }

  return true;
}
```

### Upgrade/Downgrade Subscription

```typescript
// Change user's subscription plan
export async function changeSubscription(
  userId: string,
  newPlanId: string,
  newTier: string
) {
  // Get current subscription
  const { data: current } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!current) throw new Error("No active subscription found");

  // Update to new plan
  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      plan_id: newPlanId,
      tier: newTier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Cancel Subscription

```typescript
// Cancel user subscription
export async function cancelSubscription(userId: string) {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", "active")
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## 🔄 Real-Time Updates

### Enable Realtime for Subscription Changes

```typescript
// Hook to listen for subscription plan changes
export function useSubscriptionPlansRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("subscription-plans-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "subscription_plans",
        },
        (payload) => {
          console.log("Plan changed:", payload);

          // Invalidate cache to refetch
          queryClient.invalidateQueries({
            queryKey: ["subscription-plans"]
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Use in your component
export function SubscriptionPage() {
  useSubscriptionPlansRealtime(); // Auto-updates when admin changes plans

  const { data: plans } = useSubscriptionPlans();
  // ... rest of component
}
```

### Listen for User Subscription Changes

```typescript
// Listen for changes to user's subscription
export function useUserSubscriptionRealtime(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`user-subscription-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("User subscription changed:", payload);

          queryClient.invalidateQueries({
            queryKey: ["user-subscription", userId]
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
```

---

## 🔧 API Integration Examples

### Organization App - Create Event

```typescript
// Organization creates a new event
export async function createEvent(
  organizerId: string,
  eventData: {
    title: string;
    description: string;
    event_date: string;
    end_date: string;
    venue_id: string;
    category: string;
    event_type: string;
    capacity: number;
    price: number;
    vip_price?: number;
    early_bird_price?: number;
    featured_image: string;
    images?: string[];
  }
) {
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...eventData,
      organizer_id: organizerId,
      status: "draft", // Start as draft
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### User App - Book Event

```typescript
// User books an event ticket
export async function bookEvent(
  userId: string,
  eventId: string,
  ticketType: "regular" | "vip" | "early_bird"
) {
  // Get user's subscription for discount
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select(`
      tier,
      subscription_plans (features)
    `)
    .eq("user_id", userId)
    .single();

  // Get event details
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event) throw new Error("Event not found");

  // Calculate price with tier discount
  let basePrice = ticketType === "vip" ? event.vip_price :
                  ticketType === "early_bird" ? event.early_bird_price :
                  event.price;

  const discount = subscription?.subscription_plans?.features?.discount_percentage || 0;
  const finalPrice = basePrice - (basePrice * discount / 100);

  // Create booking record (simplified - you'll have a bookings table)
  const booking = {
    user_id: userId,
    event_id: eventId,
    ticket_type: ticketType,
    price_paid: finalPrice,
    discount_applied: discount,
    tier: subscription?.tier || "Free",
  };

  // Award points after booking
  if (subscription?.subscription_plans?.features) {
    await awardPoints(userId, "booking", subscription.subscription_plans.features);
  }

  return booking;
}
```

---

## 📦 TypeScript Types & Interfaces

```typescript
// Copy these types to your apps

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  tier_level: number;
  features: PlanFeatures;
  benefits: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatures {
  tier: "Free" | "Gold" | "Platinum" | "Black";
  color: string;
  points_multiplier: number;
  discount_percentage: number;
  early_booking_hours: number;
  concierge_access: boolean;
  concierge_hours: string;
  concierge_requests_per_month?: number;
  vip_entry: boolean;
  priority_support: boolean;
  free_reservations_per_month: number;
  vip_lounge_access: boolean;
  event_upgrades_per_month?: number;
  points_per_booking: number;
  points_per_review: number;
  referral_limit: number;
  support_response_hours: number;
  badge_type: string;
  all_access_vip_lounge?: boolean;
  meet_greet_per_year?: number;
  backstage_access_per_year?: number;
  free_parking?: boolean;
  personal_coordinator?: boolean;
  quarterly_gifts?: boolean;
  animated_badge?: boolean;
  invite_only?: boolean;
  exclusive_first_access?: boolean;
  dedicated_concierge?: boolean;
  private_lounge_access?: boolean;
  valet_service?: boolean;
  dedicated_account_manager?: boolean;
  luxury_gifts?: boolean;
  private_events?: boolean;
  celebrity_access?: boolean;
  luxury_transport?: boolean;
  international_perks?: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  tier: "Free" | "Gold" | "Platinum" | "Black";
  billing_cycle: "monthly" | "annual" | "lifetime";
  status: "active" | "cancelled" | "expired";
  start_date: string;
  end_date: string;
  payment_method: string;
  payment_reference: string;
  reward_points: number;
  referral_code: string;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface PointRedemption {
  id: string;
  user_id: string;
  points_spent: number;
  reward_type: string;
  reward_value: number;
  description: string;
  status: "pending" | "redeemed" | "expired" | "cancelled";
  created_at: string;
  expires_at: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  subscription_plan_id: string;
  tier: string;
  status: "pending" | "completed" | "expired";
  points_awarded: number;
  bonus_applied: boolean;
  created_at: string;
  completed_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  venue_id: string;
  category: string;
  event_type: string;
  capacity: number;
  price: number;
  vip_price?: number;
  early_bird_price?: number;
  status: "draft" | "published" | "cancelled" | "completed";
  featured_image: string;
  images: string[];
  organizer_id: string;
  created_at: string;
  updated_at: string;
  venues?: Venue;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  capacity: number;
  venue_type: string;
  amenities: string[];
  featured_image: string;
  images: string[];
  contact_phone: string;
  contact_email: string;
  website: string;
  status: "active" | "inactive" | "maintenance";
  created_at: string;
  updated_at: string;
}
```

---

## 🔒 Security & RLS Policies

### Current RLS Policies

```sql
-- Subscription Plans (READ ONLY for users)
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User Subscriptions (Users can view/update own)
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Point Redemptions (Users can view/create own)
CREATE POLICY "Users can view own redemptions"
  ON point_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions"
  ON point_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Referrals (Users can view own referrals)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

-- Events (Public can view published events)
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (status = 'published' OR auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage own events"
  ON events FOR ALL
  USING (auth.uid() = organizer_id);

-- Venues (Public can view active venues)
CREATE POLICY "Anyone can view active venues"
  ON venues FOR SELECT
  USING (status = 'active');
```

---

## ✅ Testing Checklist

### User App Integration

#### Subscription Plans
- [ ] Fetch and display all 4 tiers (Free, Gold, Platinum, Black)
- [ ] Show monthly and annual pricing correctly
- [ ] Display tier features and benefits
- [ ] Implement billing cycle toggle (monthly/annual)
- [ ] Handle Free tier (no payment required)

#### Payment Flow
- [ ] Initialize Paystack for paid tiers
- [ ] Handle successful payment callback
- [ ] Create user_subscription record after payment
- [ ] Generate unique referral code for new subscriber
- [ ] Handle payment failures gracefully

#### Tier Benefits
- [ ] Apply tier discount to event bookings
- [ ] Implement early access for premium tiers
- [ ] Show tier badge/icon on user profile
- [ ] Display current tier and benefits in settings

#### Points System
- [ ] Award points after event booking
- [ ] Award points after posting review
- [ ] Display current points balance
- [ ] Multiply points based on tier (1x, 2x, 3x, 5x)
- [ ] Implement points redemption for rewards

#### Referrals
- [ ] Display user's referral code
- [ ] Track referral signups
- [ ] Award bonus points when referral subscribes
- [ ] Show referral stats (total, completed, points earned)

#### Events
- [ ] Fetch upcoming events
- [ ] Show tier-based pricing (with discount)
- [ ] Implement early access countdown for premium users
- [ ] Book events with tier discounts applied

### Organization App Integration

#### Events Management
- [ ] Create new events
- [ ] Edit event details
- [ ] Upload event images
- [ ] Set pricing (regular, VIP, early bird)
- [ ] Publish/unpublish events
- [ ] View event analytics

#### Venues Management
- [ ] View all venues
- [ ] Create events at specific venues
- [ ] Display venue details with events

#### Subscription Awareness
- [ ] Show tier-based user counts in analytics
- [ ] Filter bookings by user tier
- [ ] Offer tier-exclusive events

### General
- [ ] Real-time updates when admin changes plans
- [ ] Handle subscription expiration
- [ ] Allow subscription upgrade/downgrade
- [ ] Implement subscription cancellation
- [ ] Test all Paystack webhooks

---

## 🚀 Quick Start Commands

### Fetch Subscription Plans
```typescript
const { data: plans } = await supabase
  .from("subscription_plans")
  .select("*")
  .eq("is_active", true)
  .order("tier_level");
```

### Get User's Subscription
```typescript
const { data: subscription } = await supabase
  .from("user_subscriptions")
  .select(`
    *,
    subscription_plans (*)
  `)
  .eq("user_id", userId)
  .eq("status", "active")
  .single();
```

### Award Points
```typescript
await supabase
  .from("user_subscriptions")
  .update({
    reward_points: supabase.raw("reward_points + 20")
  })
  .eq("user_id", userId);
```

### Fetch Events with Venues
```typescript
const { data: events } = await supabase
  .from("events")
  .select(`
    *,
    venues (name, address, city, featured_image)
  `)
  .eq("status", "published")
  .gte("event_date", new Date().toISOString())
  .order("event_date");
```

---

## 📞 Support & Questions

If you need clarification on any integration:

1. **Database Schema**: Check `supabase/APPLY_4_TIER_SYSTEM.sql`
2. **Admin Panel Reference**: See `src/components/admin/views/SubscriptionsView.tsx`
3. **Type Definitions**: See `src/integrations/supabase/types.ts`
4. **Quick Start**: See `QUICK_START.md`

---

**🎉 Everything is Ready!**

The admin panel is production-ready with full CRUD operations. Your apps just need to:
1. Query the database tables
2. Display subscription plans
3. Handle Paystack payments
4. Award points based on tier
5. Apply tier benefits (discounts, early access, etc.)

All changes made in the admin panel are **instantly reflected** in your apps through the shared Supabase database.

---

**Last Updated:** 2025-12-16
**Status:** ✅ Production Ready
