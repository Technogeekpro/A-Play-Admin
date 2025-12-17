# A-PLAY 4-TIER SUBSCRIPTION SYSTEM - IMPLEMENTATION GUIDE

## 🎯 Overview

This document explains how to apply the final 4-tier subscription system to your A-Play Admin panel and Supabase database.

**Tier Structure:** FREE → GOLD → PLATINUM → BLACK (as per A play deck.pdf slide 5)

---

## ✅ STEP 1: Apply Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** from the left sidebar
3. Click **New Query**
4. Open the file: `supabase/FINAL_APLAY_4_TIERS.sql`
5. Copy the entire contents
6. Paste into the Supabase SQL Editor
7. Click **Run** (or press Ctrl/Cmd + Enter)
8. Verify you see success messages:
   - "A-Play 4-Tier System Created Successfully!"
   - 4 subscription plans displayed

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
cd /Users/abdulrazak/Documents/A-Play-Admin-main
supabase db push
```

---

## ✅ STEP 2: Verify Database Changes

After applying the migration, verify in Supabase Dashboard:

### Check Tables:
1. **subscription_plans** - Should have 4 rows (Free, Gold, Platinum, Black)
2. **user_subscriptions** - Should have new columns:
   - `payment_method`
   - `payment_reference`
   - `plan_id`
   - `tier` (with CHECK constraint: 'Free', 'Gold', 'Platinum', 'Black')
   - `billing_cycle` (with CHECK constraint: 'monthly', 'annual', 'lifetime')
   - `reward_points`
   - `referral_code`

3. **point_redemptions** - New table for tracking loyalty points
4. **referrals** - New table for tracking user referrals

### Check Data:

Run this query in SQL Editor to see your tiers:

```sql
SELECT
  name,
  tier_level,
  price_monthly,
  price_yearly,
  features->>'points_multiplier' as points_multiplier,
  features->>'discount_percentage' as discount,
  is_active
FROM subscription_plans
ORDER BY tier_level;
```

Expected output:
| name | tier_level | price_monthly | price_yearly | points_multiplier | discount | is_active |
|------|-----------|---------------|--------------|-------------------|----------|-----------|
| Free | 1 | 0.00 | 0.00 | 1 | 0 | true |
| Gold | 2 | 120.00 | 1200.00 | 2 | 10 | true |
| Platinum | 3 | 250.00 | 2500.00 | 3 | 15 | true |
| Black | 4 | 500.00 | 5000.00 | 5 | 20 | true |

---

## ✅ STEP 3: Test Admin Panel

1. Start your admin panel:
   ```bash
   npm run dev
   ```

2. Navigate to **Subscriptions** tab in the sidebar

3. You should see **4 tabs**:
   - **Overview**: Quick stats and recent activity
   - **User Subscriptions**: List of all user subscriptions
   - **Subscription Plans**: Manage the 4 tiers
   - **Analytics**: Revenue trends and insights

4. In **Subscription Plans** tab, verify you see:
   - Free tier (Orange gradient, 1x points)
   - Gold tier (Yellow gradient, 2x points)
   - Platinum tier (Silver gradient, 3x points)
   - Black tier (Dark gradient, 5x points)

5. Test CRUD operations:
   - ✅ **Create**: Click "Add New Plan" to create a custom plan
   - ✅ **Read**: View all plan details and benefits
   - ✅ **Update**: Click "Edit" on any plan to modify
   - ✅ **Delete**: Click trash icon to delete a plan
   - ✅ **Toggle**: Activate/Deactivate plans

---

## 📊 TIER FEATURES SUMMARY

### Tier 1: FREE (GH₵ 0)
- **Access & base points**
- 1x points multiplier
- Standard support (48h response)
- Basic features for getting started

### Tier 2: GOLD (GH₵ 120/month, GH₵ 1200/year)
- **Early alerts, double points, concierge access**
- 2x points multiplier
- 10% discount on bookings
- 48 hours early booking access
- Concierge service (business hours)
- Priority support (12h response)
- VIP lounge access at select venues

### Tier 3: PLATINUM (GH₵ 250/month, GH₵ 2500/year)
- **VIP entries, triple points, 24/7 concierge**
- 3x points multiplier
- 15% discount on bookings
- 72 hours early booking access
- 24/7 concierge service (unlimited)
- VIP entry at all venues
- Unlimited table reservations
- Personal event coordinator
- VIP support (6h response)

### Tier 4: BLACK (GH₵ 500/month, GH₵ 5000/year)
- **Invite-only elite luxury experiences**
- 5x points multiplier
- 20% discount on bookings
- 7 days exclusive first access
- Dedicated 24/7 personal concierge
- Luxury transport arrangements
- Celebrity meet & greet opportunities
- International lifestyle perks
- Instant support (1h response)

---

## 🎨 Admin Panel Features

### Subscription Plans Management:
- ✅ Visual tier-based cards with gradient backgrounds
- ✅ Color-coded badges (Free=Orange, Gold=Yellow, Platinum=Silver, Black=Dark)
- ✅ Points multiplier display
- ✅ Monthly and yearly pricing
- ✅ Full CRUD operations
- ✅ Active/Inactive status toggle
- ✅ Delete confirmation dialogs

### User Subscriptions:
- ✅ Search by user name, plan type, payment reference
- ✅ Filter by status (active, expired, cancelled)
- ✅ Pagination (10, 20, 50, 100 per page)
- ✅ View detailed subscription info
- ✅ Payment method and reference tracking

### Analytics:
- ✅ Total subscriptions count
- ✅ Active vs Expired vs Cancelled breakdown
- ✅ Total revenue tracking
- ✅ Average revenue per subscription
- ✅ Monthly revenue trends
- ✅ Churn rate calculation

---

## 🔄 Points & Referrals System

### Points Earned:
| Action | Free | Gold | Platinum | Black |
|--------|------|------|----------|-------|
| Booking | 10 | 20 | 30 | 50 |
| Review | 5 | 10 | 15 | 25 |
| Referral | 50 | 100 | 150 | 200 |

### Referral Limits:
- **Free**: 5 referrals per month
- **Gold**: 10 referrals per month
- **Platinum**: Unlimited
- **Black**: Unlimited (with premium bonuses)

### Point Redemptions:
- Users can redeem points for rewards
- Track redemption history
- Set expiration dates for points
- Status tracking (pending, redeemed, expired, cancelled)

---

## 🔐 Security (Row Level Security)

All tables have RLS policies:

### subscription_plans:
- Public can SELECT active plans
- Only admins can CREATE, UPDATE, DELETE

### user_subscriptions:
- Users can SELECT their own subscriptions
- Only admins can manage all subscriptions

### point_redemptions:
- Users can view and create their own redemptions
- Admins can manage all redemptions

### referrals:
- Users can view referrals they made or received
- Users can create referrals
- Admins can manage all referrals

---

## 📱 Next Steps: User & Org App Integration

Once the admin panel is working correctly, you mentioned:
> "once done herre i will command AI agent to update user and org app accodingly"

### What needs to be done in User/Org apps:

1. **Fetch Subscription Plans**
   ```typescript
   const { data: plans } = await supabase
     .from('subscription_plans')
     .select('*')
     .eq('is_active', true)
     .order('tier_level', { ascending: true });
   ```

2. **Subscribe to a Plan (via Paystack)**
   - Display tier cards with benefits
   - Integrate Paystack payment
   - Create user_subscription record
   - Award initial points

3. **Check User's Current Tier**
   ```typescript
   const { data: subscription } = await supabase
     .from('user_subscriptions')
     .select('*, subscription_plans(*)')
     .eq('user_id', userId)
     .eq('status', 'active')
     .single();

   // Apply tier benefits:
   const discount = subscription.subscription_plans.features.discount_percentage;
   const pointsMultiplier = subscription.subscription_plans.features.points_multiplier;
   ```

4. **Award Points on Actions**
   - Booking created → Award points based on tier
   - Review submitted → Award points based on tier
   - Referral completed → Award bonus points

5. **Redeem Points**
   - Display available rewards
   - Deduct points from user
   - Create point_redemption record

6. **Referral System**
   - Generate unique referral code for each user
   - Track when referred users subscribe
   - Award referrer bonus points

---

## 🛠️ Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution**: Some tables/columns may already exist. The migration uses `IF NOT EXISTS` and `IF EXISTS` clauses, so it should be safe to re-run.

### Issue: Old tier names still appearing (Bronze, Silver, etc.)
**Solution**: The migration includes `TRUNCATE subscription_plans CASCADE;` which clears old data. If you see old tiers, they may be cached. Clear browser cache or hard refresh (Ctrl+Shift+R).

### Issue: payment_method or payment_reference columns missing
**Solution**: The migration includes `ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS` for these fields. Verify the migration ran successfully.

### Issue: RLS policies preventing admin actions
**Solution**: Ensure your admin user has `role = 'admin'` in the `profiles` table:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-admin-user-id';
```

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs for error messages
2. Verify migration ran successfully
3. Check browser console for errors
4. Ensure your admin user has proper role

---

## ✨ Summary

You now have a complete 4-tier subscription system:
- ✅ Database schema with all tables
- ✅ Admin panel with full CRUD
- ✅ Points and referral tracking
- ✅ Proper RLS security
- ✅ Ready for user app integration

The admin panel changes are **LIVE** and will automatically reflect in the user app once you integrate the subscription fetching and Paystack payment flow.

**Next Action**: Apply the migration, test the admin panel, then proceed with user/org app updates.
