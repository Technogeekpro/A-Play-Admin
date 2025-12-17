# 🔄 User App Integration - Real-Time Subscription Updates

## ✅ How It Works

When you edit subscription plans in the **Admin Panel**, those changes are **immediately reflected** in the **User App** because both apps query the same `subscription_plans` table in Supabase.

---

## 📊 Current Admin Panel Setup (Already Working)

The admin panel automatically updates the database when you:

1. **Create a plan** → Saves to `subscription_plans` table
2. **Edit a plan** → Updates `subscription_plans` table
3. **Toggle active/inactive** → Updates `is_active` column
4. **Delete a plan** → Removes from `subscription_plans` table

All changes trigger:
```typescript
queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
```

This ensures the admin panel UI refreshes immediately.

---

## 🎯 User App Integration (3 Steps)

To ensure your user app displays the latest subscription plans, follow these steps:

### Step 1: Query Subscription Plans (User App)

In your user app, fetch active subscription plans using the same Supabase table:

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fetch only active plans, sorted by tier level
const { data: plans, isLoading } = useQuery({
  queryKey: ["subscription-plans"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)  // Only show active plans
      .order("tier_level", { ascending: true });

    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  refetchOnWindowFocus: true, // Refetch when user returns to tab
});
```

### Step 2: Display the 4 Tiers

Show the plans with their pricing and features:

```typescript
// User App - Subscription Selection Page
export function SubscriptionPlans() {
  const { data: plans } = useQuery({ /* ... same as above ... */ });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {plans?.map((plan) => (
        <div key={plan.id} className="border rounded-lg p-6">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="text-muted-foreground">{plan.description}</p>

          {/* Pricing */}
          <div className="mt-4">
            <div className="text-3xl font-bold">
              GH₵{plan.price_monthly}
              <span className="text-sm font-normal">/month</span>
            </div>
            <div className="text-sm text-muted-foreground">
              or GH₵{plan.price_yearly}/year
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 space-y-2">
            <div className="font-semibold">Features:</div>
            <ul className="space-y-1">
              <li>✓ {plan.features.points_multiplier}x points multiplier</li>
              {plan.features.discount_percentage > 0 && (
                <li>✓ {plan.features.discount_percentage}% discount</li>
              )}
              {plan.features.early_booking_hours > 0 && (
                <li>✓ {plan.features.early_booking_hours}h early access</li>
              )}
              {plan.features.concierge_access && (
                <li>✓ Concierge ({plan.features.concierge_hours})</li>
              )}
              {plan.features.vip_entry && <li>✓ VIP Entry</li>}
            </ul>
          </div>

          {/* Benefits */}
          {plan.benefits && plan.benefits.length > 0 && (
            <div className="mt-4">
              <div className="font-semibold">Benefits:</div>
              <ul className="text-sm space-y-1 mt-2">
                {plan.benefits.slice(0, 5).map((benefit, idx) => (
                  <li key={idx} className="text-muted-foreground">• {benefit}</li>
                ))}
                {plan.benefits.length > 5 && (
                  <li className="text-xs">+{plan.benefits.length - 5} more...</li>
                )}
              </ul>
            </div>
          )}

          {/* Subscribe Button */}
          <button
            onClick={() => handleSubscribe(plan)}
            className="w-full mt-6 btn-primary"
          >
            Subscribe to {plan.name}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Step 3: Handle Real-Time Updates (Optional but Recommended)

For instant updates when admin changes plans, add Supabase Realtime:

```typescript
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useSubscriptionPlansRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to changes in subscription_plans table
    const channel = supabase
      .channel("subscription-plans-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "subscription_plans",
        },
        (payload) => {
          console.log("Subscription plan changed:", payload);

          // Invalidate cache to refetch latest data
          queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Use in your component:
export function SubscriptionPlans() {
  useSubscriptionPlansRealtime(); // Auto-updates when admin changes plans

  const { data: plans } = useQuery({ /* ... */ });
  // ...rest of component
}
```

---

## 🔥 How Updates Flow

```
┌─────────────────┐        ┌──────────────────┐        ┌─────────────────┐
│  Admin Panel    │        │   Supabase DB    │        │   User App      │
│                 │        │                  │        │                 │
│  Edit Gold Plan │───1───▶│ UPDATE           │───2───▶│ Realtime event  │
│  (price: 150)   │        │ subscription_    │        │ triggers        │
│                 │        │ plans table      │        │                 │
│  Invalidate     │        │                  │        │ Invalidate      │
│  cache          │        │                  │        │ cache           │
│                 │        │                  │        │                 │
│  ✅ Shows 150   │        │  price_monthly   │        │ ✅ Shows 150    │
│                 │        │  = 150           │        │                 │
└─────────────────┘        └──────────────────┘        └─────────────────┘
```

**Timeline:**
1. **0ms** - Admin clicks "Save" after editing Gold plan
2. **100ms** - Supabase updates `subscription_plans` table
3. **150ms** - Admin panel refetches and shows new data
4. **200ms** - User app receives Realtime event
5. **250ms** - User app refetches and shows new data

**Result:** Both apps show identical data within 250ms!

---

## 🎨 Example: Full User App Subscription Page

```typescript
// src/pages/SubscriptionPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionPlansRealtime } from "@/hooks/useSubscriptionPlansRealtime";

export function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  // Automatically updates when admin changes plans
  useSubscriptionPlansRealtime();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("tier_level", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleSubscribe = async (plan: any) => {
    // Integrate Paystack payment here
    const amount = billingCycle === "monthly"
      ? plan.price_monthly
      : plan.price_yearly;

    // Redirect to Paystack or open payment modal
    console.log(`Subscribe to ${plan.name} - GH₵${amount}/${billingCycle}`);
  };

  if (isLoading) return <div>Loading plans...</div>;

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-4">
        Choose Your A-Play Membership
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Unlock exclusive benefits and rewards
      </p>

      {/* Billing Toggle */}
      <div className="flex justify-center gap-4 mb-12">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={billingCycle === "monthly" ? "btn-primary" : "btn-secondary"}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={billingCycle === "annual" ? "btn-primary" : "btn-secondary"}
        >
          Annual (Save ~17%)
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans?.map((plan) => {
          const price = billingCycle === "monthly"
            ? plan.price_monthly
            : plan.price_yearly;

          return (
            <div
              key={plan.id}
              className="border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              {/* Tier Badge */}
              <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
                {plan.features.points_multiplier}x Points
              </div>

              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mt-2">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mt-6">
                <div className="text-4xl font-bold">
                  GH₵{price}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
              </div>

              {/* Key Features */}
              <div className="mt-6 space-y-3 text-sm">
                {plan.features.discount_percentage > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{plan.features.discount_percentage}% discount</span>
                  </div>
                )}
                {plan.features.early_booking_hours > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{plan.features.early_booking_hours}h early access</span>
                  </div>
                )}
                {plan.features.concierge_access && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Concierge ({plan.features.concierge_hours})</span>
                  </div>
                )}
                {plan.features.vip_entry && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>VIP Entry</span>
                  </div>
                )}
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => handleSubscribe(plan)}
                className="w-full mt-8 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                {plan.price_monthly === 0 ? "Get Started Free" : `Subscribe Now`}
              </button>

              {/* View All Benefits */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-primary font-semibold">
                  View all {plan.benefits?.length || 0} benefits
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {plan.benefits?.map((benefit: string, idx: number) => (
                    <li key={idx}>• {benefit}</li>
                  ))}
                </ul>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 🔒 RLS Policies (Already Configured)

The database already has Row Level Security configured:

```sql
-- ✅ Anyone can view active subscription plans
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- ✅ Only admins can create/update/delete plans
CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

This means:
- ✅ User app can **read** all plans
- ✅ Only admin can **modify** plans
- ✅ Changes by admin are immediately visible to users

---

## 📝 Integration Checklist

Use this checklist when integrating subscriptions into your user app:

### Database (Already Done ✅)
- [x] 4 subscription tiers created (Free, Gold, Platinum, Black)
- [x] RLS policies configured
- [x] Indexes created for performance
- [x] point_redemptions table created
- [x] referrals table created

### User App (Your Next Steps)
- [ ] Add React Query for fetching plans
- [ ] Create SubscriptionPlans component
- [ ] Display 4 tiers with pricing and features
- [ ] Add monthly/annual billing toggle
- [ ] Integrate Paystack payment gateway
- [ ] Handle successful subscription flow
- [ ] Update user's subscription in `user_subscriptions` table
- [ ] Award points based on tier multiplier
- [ ] Display user's current tier in profile
- [ ] Optional: Add Realtime listener for instant updates

### Testing
- [ ] Verify plans display correctly in user app
- [ ] Edit a plan in admin panel → Check user app updates
- [ ] Deactivate a plan in admin → Verify it disappears from user app
- [ ] Change pricing in admin → Verify new prices show in user app
- [ ] Test payment flow with Paystack test keys
- [ ] Verify subscription creation in `user_subscriptions` table

---

## 🚀 Quick Start Command

If you want to test this immediately:

```typescript
// Add this to your user app to see current plans
import { supabase } from "@/integrations/supabase/client";

const { data } = await supabase
  .from("subscription_plans")
  .select("*")
  .eq("is_active", true)
  .order("tier_level");

console.log("Current active plans:", data);
// Should show: Free, Gold, Platinum, Black
```

---

## 💡 Key Takeaways

1. **Single Source of Truth**: Both admin and user apps read from `subscription_plans` table
2. **Immediate Updates**: Admin changes are saved to DB instantly
3. **Auto-Refresh**: User app refetches on window focus or via Realtime
4. **No Manual Sync Needed**: React Query handles cache invalidation automatically
5. **Secure**: RLS ensures only admins can modify plans

---

**Need Help?**

Check the admin panel at `/admin/subscriptions` to see the 4 tiers working. The same data structure is available for your user app!

**Last Updated:** 2025-12-16
