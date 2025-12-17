# 🎯 A-Play Subscription System - Complete Integration Guide

## 📋 Overview

Your A-Play subscription system now implements the **Bronze, Silver, Gold, and Platinum** tiers as specified in your SUBSCRIPTION_PLANS.md document, with full point tracking, referral system, and all premium features.

---

## ✅ What's Been Implemented

### 1. **Database Schema - All Tiers Created**

Four complete subscription tiers matching your specifications:

| Tier | Monthly | Yearly | Discount | Early Booking | Reservations/Month |
|------|---------|--------|----------|---------------|-------------------|
| **Bronze** | GH₵ 0 (Free) | GH₵ 0 | 0% | 0 hours | 0 |
| **Silver** | GH₵ 50 | GH₵ 500 | 5% | 24 hours | 1 |
| **Gold** | GH₵ 120 | GH₵ 1,200 | 10% | 48 hours | 3 |
| **Platinum** | GH₵ 250 | GH₵ 2,500 | 15% | 72 hours | Unlimited |

### 2. **Points System Implemented**

Points per action by tier:

| Action | Bronze | Silver | Gold | Platinum |
|--------|--------|--------|------|----------|
| Event Booking | 10 pts | 20 pts | 30 pts | 50 pts |
| Review Posted | 5 pts | 10 pts | 15 pts | 25 pts |
| Referral Success | 50 pts | 100 pts | 150 pts | 200 pts |
| Subscription Renewal | 0 pts | 100 pts | 250 pts | 500 pts |
| Birthday Month Bonus | 25 pts | 50 pts | 100 pts | 200 pts |

### 3. **New Database Tables Created**

- ✅ `point_redemptions` - Track point spending and rewards
- ✅ `referrals` - Track referral program
- ✅ Helper functions for point calculation

### 4. **All Features Tracked**

Each tier includes all features from your spec:

**Bronze Features:**
- Browse all events
- Basic booking
- Standard support (48hr response)
- 10 pts per booking, 5 pts per review

**Silver Features:**
- Everything in Bronze
- 5% discount
- 24-hour early booking
- 1 free reservation/month
- Priority support (24hr)
- Birthday discount (+10%)
- Silver badge

**Gold Features:**
- Everything in Silver
- 10% discount
- 48-hour early booking
- 3 free reservations/month
- VIP lounge access
- 3 concierge requests/month
- 1 event upgrade/month
- 2 meet & greets/year
- Premium support (12hr)
- Gold badge

**Platinum Features:**
- Everything in Gold
- 15% discount
- 72-hour early booking
- **Unlimited** reservations
- **Unlimited** concierge
- **Unlimited** upgrades
- Personal coordinator
- All-access VIP lounge
- Backstage access (2/year)
- Free parking
- Quarterly gifts
- VIP support (6hr)
- Animated Platinum badge

---

## 🚀 Apply Database Changes

### Step 1: Run the SQL Migration

```bash
# Open in Supabase SQL Editor:
https://supabase.com/dashboard/project/yvnfhsipyfxdmulajbgl/sql/new

# Copy and paste:
supabase/APLAY_SUBSCRIPTION_TIERS.sql

# Click "Run"
```

This will:
1. Clear old dummy data
2. Add missing fields to user_subscriptions
3. Create all 4 tiers (Bronze, Silver, Gold, Platinum)
4. Create point_redemptions table
5. Create referrals table
6. Add helper functions for point calculation

---

## 📱 USER APP IMPLEMENTATION

### 1. **Subscription Plans Display Page**

Show all 4 tiers with proper Ghana pricing (GH₵):

```typescript
// src/pages/SubscriptionPlans.tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Sparkles, Diamond } from "lucide-react";

const tierIcons = {
  Bronze: Star,
  Silver: Crown,
  Gold: Sparkles,
  Platinum: Diamond,
};

const tierColors = {
  Bronze: "bg-amber-700",
  Silver: "bg-gray-400",
  Gold: "bg-yellow-500",
  Platinum: "bg-purple-600",
};

export function SubscriptionPlansPage() {
  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("tier_level");

      if (error) throw error;
      return data;
    },
  });

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const getPrice = (plan: any) => {
    return billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
  };

  const getSavings = (plan: any) => {
    if (!plan.price_yearly || plan.price_yearly === 0) return 0;
    const monthlyTotal = plan.price_monthly * 12;
    return Math.round(((monthlyTotal - plan.price_yearly) / monthlyTotal) * 100);
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Tier</h1>
        <p className="text-lg text-muted-foreground">
          Unlock exclusive benefits and earn points with every subscription
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant={billingCycle === "monthly" ? "default" : "outline"}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === "annual" ? "default" : "outline"}
            onClick={() => setBillingCycle("annual")}
          >
            Annual (Save up to 20%)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans?.map((plan) => {
          const Icon = tierIcons[plan.name as keyof typeof tierIcons];
          const colorClass = tierColors[plan.name as keyof typeof tierColors];
          const price = getPrice(plan);
          const savings = getSavings(plan);
          const features = plan.features || {};

          return (
            <Card
              key={plan.id}
              className={`p-6 relative ${
                plan.name === "Gold" ? "border-yellow-500 border-2" : ""
              }`}
            >
              {plan.name === "Gold" && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500">
                  Most Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <div className={`w-16 h-16 ${colorClass} rounded-full mx-auto flex items-center justify-center mb-4`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              <div className="text-center mb-6">
                <div className="text-4xl font-bold">
                  GH₵ {price.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </div>
                {billingCycle === "annual" && savings > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    Save {savings}%
                  </Badge>
                )}
              </div>

              {/* Key Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{features.discount_percentage || 0}% discount on bookings</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>
                    {features.early_booking_hours || 0}h early booking
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>
                    {features.free_reservations_per_month === -1
                      ? "Unlimited"
                      : features.free_reservations_per_month || 0}{" "}
                    free reservations/month
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{features.points_per_booking || 0} points per booking</span>
                </div>
                {features.vip_lounge_access && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-gold-500" />
                    <span>VIP Lounge Access</span>
                  </div>
                )}
                {features.personal_coordinator && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span>Personal Event Coordinator</span>
                  </div>
                )}
              </div>

              {/* All Benefits */}
              <details className="mb-6">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  View all benefits
                </summary>
                <div className="space-y-2 mt-2">
                  {plan.benefits?.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </details>

              <Button
                className="w-full"
                variant={plan.name === "Gold" ? "default" : "outline"}
                onClick={() => handleSubscribe(plan)}
              >
                {plan.price_monthly === 0 ? "Get Started" : "Subscribe Now"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Points Info */}
      <div className="mt-12 text-center">
        <h3 className="text-2xl font-bold mb-4">Earn Points with Every Action</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
          <Card className="p-4">
            <div className="text-2xl font-bold mb-1">500 pts</div>
            <div className="text-xs text-muted-foreground">GH₵ 10 voucher</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold mb-1">1,000 pts</div>
            <div className="text-xs text-muted-foreground">Free reservation</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold mb-1">2,000 pts</div>
            <div className="text-xs text-muted-foreground">Free ticket</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold mb-1">5,000 pts</div>
            <div className="text-xs text-muted-foreground">Gold upgrade</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold mb-1">10,000 pts</div>
            <div className="text-xs text-muted-foreground">Backstage pass</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function handleSubscribe(plan: any) {
  // Navigate to payment page
  window.location.href = `/checkout?plan=${plan.id}&tier=${plan.name}`;
}
```

---

### 2. **Payment Integration with Paystack**

Ghana-specific payment setup:

```typescript
// src/components/PaymentCheckout.tsx
import { usePaystackPayment } from 'react-paystack';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function PaymentCheckout({ planId, tierName, amount, billingCycle }: any) {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function getUserEmail() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || "");
    }
    getUserEmail();
  }, []);

  const config = {
    reference: `APLAY-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: userEmail,
    amount: amount * 100, // Convert GH₵ to pesewas
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    currency: 'GHS', // Ghana Cedis
    metadata: {
      plan_id: planId,
      tier: tierName,
      billing_cycle: billingCycle,
    },
  };

  const onSuccess = async (reference: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get plan details
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (billingCycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Generate referral code
      const referralCode = `REF-${user.id.substring(0, 8).toUpperCase()}`;

      // Create subscription
      const { error } = await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        subscription_type: tierName,
        plan_type: billingCycle,
        plan_id: planId,
        tier: tierName,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount: amount,
        currency: "GHS",
        payment_method: "Paystack",
        payment_reference: reference.reference,
        billing_cycle: billingCycle,
        is_auto_renew: true,
        features_unlocked: plan?.features || {},
        referral_code: referralCode,
        reward_points: 0,
      });

      if (error) throw error;

      // Update user profile
      await supabase
        .from("profiles")
        .update({
          is_premium: tierName !== "Bronze",
        })
        .eq("id", user.id);

      toast.success(`${tierName} subscription activated!`);
      window.location.href = "/my-subscription";
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to activate subscription");
    }
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <div className="max-w-md mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Complete Payment</h2>
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-bold">{tierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Billing:</span>
            <span className="font-bold">{billingCycle}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total:</span>
            <span className="font-bold">GH₵ {amount.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => initializePayment(onSuccess, () => toast.info("Payment cancelled"))}
        >
          Pay with Paystack
        </Button>
      </Card>
    </div>
  );
}
```

---

### 3. **Points & Rewards System**

Track and display user points:

```typescript
// src/hooks/usePoints.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePoints() {
  const queryClient = useQueryClient();

  // Get user's current points
  const { data: pointsData } = useQuery({
    queryKey: ["user-points"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_subscriptions")
        .select("reward_points, tier")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      return data;
    },
  });

  // Award points for action
  const awardPoints = useMutation({
    mutationFn: async ({ action, additionalPoints = 0 }: {
      action: "booking" | "review" | "referral" | "renewal" | "birthday";
      additionalPoints?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call the SQL function to calculate points
      const { data: points } = await supabase
        .rpc("calculate_points", {
          p_user_id: user.id,
          p_action: action,
        });

      const totalPoints = (points || 0) + additionalPoints;

      // Update user's points
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          reward_points: (pointsData?.reward_points || 0) + totalPoints,
        })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      return totalPoints;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
    },
  });

  // Redeem points
  const redeemPoints = useMutation({
    mutationFn: async ({
      pointsToSpend,
      rewardType,
      rewardValue,
    }: {
      pointsToSpend: number;
      rewardType: string;
      rewardValue: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if ((pointsData?.reward_points || 0) < pointsToSpend) {
        throw new Error("Insufficient points");
      }

      // Create redemption record
      const { error: redemptionError } = await supabase
        .from("point_redemptions")
        .insert({
          user_id: user.id,
          points_spent: pointsToSpend,
          reward_type: rewardType,
          reward_value: rewardValue,
          status: "redeemed",
        });

      if (redemptionError) throw redemptionError;

      // Deduct points
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          reward_points: (pointsData?.reward_points || 0) - pointsToSpend,
        })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      toast.success("Points redeemed successfully!");
    },
  });

  return {
    points: pointsData?.reward_points || 0,
    tier: pointsData?.tier || "Bronze",
    awardPoints,
    redeemPoints,
  };
}
```

**Use in booking component:**

```typescript
import { usePoints } from "@/hooks/usePoints";

export function BookingComponent() {
  const { awardPoints } = usePoints();

  const handleBookingSuccess = async () => {
    // After successful booking
    await awardPoints.mutateAsync({ action: "booking" });
    toast.success("Booking confirmed! Points awarded.");
  };
}
```

---

### 4. **Referral System**

```typescript
// src/pages/Referrals.tsx
export function ReferralsPage() {
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    async function loadReferralData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's referral code
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select("referral_code")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      setReferralCode(subscription?.referral_code || "");

      // Get referral history
      const { data: referralData } = await supabase
        .from("referrals")
        .select("*, referred_user:profiles!referred_user_id(full_name)")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });

      setReferrals(referralData || []);
    }

    loadReferralData();
  }, []);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Referral Program</h1>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
        <div className="flex gap-3">
          <Input value={referralCode} readOnly className="flex-1 text-lg font-mono" />
          <Button onClick={copyReferralCode}>
            Copy Code
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Share this code with friends. When they subscribe to Silver or higher, you both earn bonus points!
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Your Referrals</h2>
        {referrals.length === 0 ? (
          <p className="text-muted-foreground">No referrals yet. Start sharing your code!</p>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref: any) => (
              <div key={ref.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">{ref.referred_user?.full_name || "User"}</p>
                  <p className="text-sm text-muted-foreground">
                    {ref.status === "completed" ? "✓ Active" : "Pending"}
                  </p>
                </div>
                <Badge variant={ref.status === "completed" ? "default" : "secondary"}>
                  {ref.points_awarded} points
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

## 🔧 Admin Panel Updates Needed

The current admin panel needs these improvements to support the new system:

1. **Update SubscriptionsView to show proper tier names** (Bronze, Silver, Gold, Platinum)
2. **Add points management interface**
3. **Add referral tracking view**
4. **Add point redemption approval system**

Would you like me to create these admin components?

---

## 📊 Testing Checklist

- [ ] Apply SQL migration
- [ ] Verify 4 tiers show in admin panel
- [ ] Test user subscription flow (payment → activation)
- [ ] Test points awarded after booking
- [ ] Test referral code generation
- [ ] Test point redemption
- [ ] Test tier upgrade/downgrade

---

## 🔑 Environment Variables

Add to `.env`:

```env
# Paystack (Ghana)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
VITE_PAYSTACK_SECRET_KEY=sk_test_your_key_here
```

---

## 📞 Next Steps

1. **Apply the SQL migration** - Run `APLAY_SUBSCRIPTION_TIERS.sql`
2. **Test in admin panel** - Verify all 4 tiers appear
3. **Implement user app pages** - Use code provided above
4. **Set up Paystack** - Get API keys and test
5. **Test full flow** - Subscribe, earn points, redeem rewards

Need help with any specific part? Let me know!
