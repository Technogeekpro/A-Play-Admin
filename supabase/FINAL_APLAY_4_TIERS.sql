-- =====================================================
-- A-PLAY SUBSCRIPTION SYSTEM - FINAL 4 TIERS
-- Based on A play deck.pdf slide 5
-- FREE → GOLD → PLATINUM → BLACK
-- =====================================================

-- Clear existing plans
TRUNCATE subscription_plans CASCADE;

-- First, drop the foreign key constraint if it exists (to avoid type conflicts)
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_fkey;

-- Ensure all required fields exist with correct types
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS tier TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Drop existing constraints to recreate them properly
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_tier_check;
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_billing_cycle_check;

-- Add CHECK constraints
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_tier_check
  CHECK (tier IN ('Free', 'Gold', 'Platinum', 'Black'));

ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_billing_cycle_check
  CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime'));

-- Add foreign key constraint (plan_id is TEXT to match subscription_plans.id)
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_referral_code ON user_subscriptions(referral_code);

-- =====================================================
-- UPDATE SUBSCRIPTION_PLANS TABLE SCHEMA
-- Add new columns for the 4-tier system
-- =====================================================
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT ARRAY[]::TEXT[];

-- =====================================================
-- TIER 1: FREE
-- Access & base points
-- =====================================================
INSERT INTO subscription_plans (
  name,
  description,
  price_monthly,
  price_yearly,
  tier_level,
  features,
  benefits,
  is_active
)
VALUES (
  'Free',
  'Access & base points - Perfect for getting started',
  0.00,
  0.00,
  1,
  '{
    "tier": "Free",
    "color": "#FF5722",
    "max_events": 100,
    "max_bookings": 100,
    "discount_percentage": 0,
    "points_multiplier": 1,
    "early_booking_hours": 0,
    "concierge_access": false,
    "concierge_hours": "none",
    "vip_entry": false,
    "priority_support": false,
    "free_reservations_per_month": 0,
    "points_per_booking": 10,
    "points_per_review": 5,
    "referral_limit": 5,
    "support_response_hours": 48,
    "badge_type": "basic"
  }'::jsonb,
  ARRAY[
    'Browse all events and venues',
    'Basic event booking',
    'Earn base points on activities',
    'Access to public events',
    'Standard customer support',
    'Mobile app access'
  ],
  true
);

-- =====================================================
-- TIER 2: GOLD
-- Early alerts, double points, concierge access
-- =====================================================
INSERT INTO subscription_plans (
  name,
  description,
  price_monthly,
  price_yearly,
  tier_level,
  features,
  benefits,
  is_active
)
VALUES (
  'Gold',
  'Early alerts, double points, concierge access',
  120.00,
  1200.00,
  2,
  '{
    "tier": "Gold",
    "color": "#FFD700",
    "max_events": -1,
    "max_bookings": -1,
    "discount_percentage": 10,
    "points_multiplier": 2,
    "early_booking_hours": 48,
    "early_alerts": true,
    "concierge_access": true,
    "concierge_hours": "business_hours",
    "concierge_requests_per_month": 5,
    "vip_entry": false,
    "priority_support": true,
    "free_reservations_per_month": 3,
    "vip_lounge_access": true,
    "event_upgrades_per_month": 1,
    "points_per_booking": 20,
    "points_per_review": 10,
    "referral_limit": 10,
    "support_response_hours": 12,
    "badge_type": "gold",
    "exclusive_events": true
  }'::jsonb,
  ARRAY[
    'All Free tier features',
    'Double points on all activities',
    'Early alerts for new events (48 hours)',
    'Concierge access during business hours',
    '5 concierge requests per month',
    '10% discount on event bookings',
    '3 free table reservations per month',
    'VIP lounge access at select venues',
    '1 event upgrade per month',
    'Priority customer support (12-hour response)',
    'Gold member badge',
    'Access to Gold-exclusive events',
    'Up to 10 referrals per month'
  ],
  true
);

-- =====================================================
-- TIER 3: PLATINUM
-- VIP entries, triple points, 24/7 concierge
-- =====================================================
INSERT INTO subscription_plans (
  name,
  description,
  price_monthly,
  price_yearly,
  tier_level,
  features,
  benefits,
  is_active
)
VALUES (
  'Platinum',
  'VIP entries, triple points, 24/7 concierge',
  250.00,
  2500.00,
  3,
  '{
    "tier": "Platinum",
    "color": "#E5E4E2",
    "max_events": -1,
    "max_bookings": -1,
    "discount_percentage": 15,
    "points_multiplier": 3,
    "early_booking_hours": 72,
    "early_alerts": true,
    "concierge_access": true,
    "concierge_hours": "24/7",
    "concierge_requests_per_month": -1,
    "vip_entry": true,
    "priority_support": true,
    "free_reservations_per_month": -1,
    "vip_lounge_access": true,
    "all_access_vip_lounge": true,
    "event_upgrades_per_month": -1,
    "meet_greet_per_year": -1,
    "backstage_access_per_year": 2,
    "free_parking": true,
    "personal_coordinator": true,
    "quarterly_gifts": true,
    "points_per_booking": 30,
    "points_per_review": 15,
    "referral_limit": -1,
    "support_response_hours": 6,
    "badge_type": "platinum",
    "animated_badge": true,
    "exclusive_events": true
  }'::jsonb,
  ARRAY[
    'All Gold tier features',
    'Triple points on all activities',
    'VIP entry at all venues',
    '24/7 concierge service (unlimited requests)',
    'Early alerts for new events (72 hours)',
    '15% discount on event bookings',
    'Unlimited table reservations',
    'All-access VIP lounge pass',
    'Unlimited event upgrades',
    'Complimentary meet & greet at events',
    'Backstage access (2 times per year)',
    'Free parking at supported venues',
    'Personal event coordinator',
    'Quarterly exclusive gifts',
    'VIP customer support (6-hour response)',
    'Animated Platinum badge',
    'Access to Platinum-exclusive events',
    'Unlimited referrals'
  ],
  true
);

-- =====================================================
-- TIER 4: BLACK
-- Invite-only elite luxury experiences
-- =====================================================
INSERT INTO subscription_plans (
  name,
  description,
  price_monthly,
  price_yearly,
  tier_level,
  features,
  benefits,
  is_active
)
VALUES (
  'Black',
  'Invite-only elite luxury experiences',
  500.00,
  5000.00,
  4,
  '{
    "tier": "Black",
    "color": "#000000",
    "invite_only": true,
    "max_events": -1,
    "max_bookings": -1,
    "discount_percentage": 20,
    "points_multiplier": 5,
    "early_booking_hours": 168,
    "early_alerts": true,
    "exclusive_first_access": true,
    "concierge_access": true,
    "concierge_hours": "24/7",
    "concierge_requests_per_month": -1,
    "dedicated_concierge": true,
    "vip_entry": true,
    "priority_support": true,
    "free_reservations_per_month": -1,
    "vip_lounge_access": true,
    "all_access_vip_lounge": true,
    "private_lounge_access": true,
    "event_upgrades_per_month": -1,
    "meet_greet_per_year": -1,
    "backstage_access_per_year": -1,
    "free_parking": true,
    "valet_service": true,
    "personal_coordinator": true,
    "dedicated_account_manager": true,
    "quarterly_gifts": true,
    "luxury_gifts": true,
    "private_events": true,
    "celebrity_access": true,
    "luxury_transport": true,
    "international_perks": true,
    "points_per_booking": 50,
    "points_per_review": 25,
    "referral_limit": -1,
    "support_response_hours": 1,
    "badge_type": "black",
    "animated_badge": true,
    "exclusive_events": true
  }'::jsonb,
  ARRAY[
    'All Platinum tier features',
    'Invite-only elite status',
    '5x points on all activities',
    'Exclusive first access to all events (7 days early)',
    '20% discount on all bookings',
    'Dedicated 24/7 personal concierge',
    'VIP entry everywhere with priority treatment',
    'Unlimited everything (reservations, upgrades, requests)',
    'Private VIP lounge access',
    'Unlimited backstage access',
    'Complimentary valet service',
    'Dedicated account manager',
    'Luxury quarterly gifts from premium brands',
    'Access to private Black-only events',
    'Celebrity meet & greet opportunities',
    'Luxury transport arrangements',
    'International lifestyle perks',
    'Instant response support (1-hour maximum)',
    'Exclusive animated Black badge',
    'Unlimited referrals with premium bonuses'
  ],
  true
);

-- =====================================================
-- CREATE POINT REDEMPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS point_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10, 2),
  description TEXT,
  status TEXT DEFAULT 'redeemed' CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- CREATE REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  tier TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  points_awarded INTEGER DEFAULT 0,
  bonus_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE point_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own redemptions" ON point_redemptions;
CREATE POLICY "Users can view own redemptions"
  ON point_redemptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own redemptions" ON point_redemptions;
CREATE POLICY "Users can create own redemptions"
  ON point_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all redemptions" ON point_redemptions;
CREATE POLICY "Admins can manage all redemptions"
  ON point_redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "Admins can manage all referrals" ON referrals;
CREATE POLICY "Admins can manage all referrals"
  ON referrals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- VERIFY INSTALLATION
-- =====================================================
SELECT
  'A-Play 4-Tier System Created Successfully!' as status,
  COUNT(*) as total_plans
FROM subscription_plans;

-- Display all tiers
SELECT
  name as tier,
  tier_level,
  price_monthly as monthly_ghc,
  price_yearly as yearly_ghc,
  features->>'points_multiplier' as points_multiplier,
  features->>'concierge_hours' as concierge,
  features->>'vip_entry' as vip_entry,
  is_active
FROM subscription_plans
ORDER BY tier_level;
