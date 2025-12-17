-- =====================================================
-- A-PLAY SUBSCRIPTION SYSTEM - COMPLETE IMPLEMENTATION
-- Based on SUBSCRIPTION_PLANS.md specifications
-- =====================================================

-- Drop existing plans and start fresh
TRUNCATE subscription_plans CASCADE;

-- Ensure user_subscriptions has all required fields
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime')),
ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS tier_points_earned INTEGER DEFAULT 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_referral_code ON user_subscriptions(referral_code);

-- =====================================================
-- INSERT BRONZE TIER (FREE)
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
  'Bronze',
  'Perfect for getting started with basic features',
  0.00,
  0.00,
  1,
  '{
    "max_events": 100,
    "max_bookings": 100,
    "discount_percentage": 0,
    "early_booking_hours": 0,
    "free_reservations_per_month": 0,
    "priority_support": false,
    "vip_lounge_access": false,
    "concierge_requests_per_month": 0,
    "event_upgrades_per_month": 0,
    "meet_greet_per_year": 0,
    "backstage_access_per_year": 0,
    "free_parking": false,
    "unlimited_reservations": false,
    "unlimited_upgrades": false,
    "unlimited_concierge": false,
    "personal_coordinator": false,
    "quarterly_gifts": false,
    "points_per_booking": 10,
    "points_per_review": 5,
    "points_to_next_tier": 1000,
    "referral_limit": 5,
    "support_response_hours": 48
  }'::jsonb,
  ARRAY[
    'Browse all events and venues',
    'Basic event booking',
    'View upcoming events',
    'Access to public reviews',
    'Standard customer support',
    'Basic profile customization',
    'Earn 10 points per booking',
    'Earn 5 points per review'
  ],
  true
);

-- =====================================================
-- INSERT SILVER TIER
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
  'Silver',
  'Enhanced experience with priority access and exclusive perks',
  50.00,
  500.00,
  2,
  '{
    "max_events": -1,
    "max_bookings": -1,
    "discount_percentage": 5,
    "birthday_month_discount": 10,
    "early_booking_hours": 24,
    "free_reservations_per_month": 1,
    "priority_support": true,
    "vip_lounge_access": false,
    "concierge_requests_per_month": 0,
    "event_upgrades_per_month": 0,
    "meet_greet_per_year": 0,
    "backstage_access_per_year": 0,
    "free_parking": false,
    "unlimited_reservations": false,
    "unlimited_upgrades": false,
    "unlimited_concierge": false,
    "personal_coordinator": false,
    "quarterly_gifts": false,
    "silver_exclusive_events": true,
    "enhanced_badge": "Silver",
    "points_per_booking": 20,
    "points_per_review": 10,
    "renewal_bonus_points": 100,
    "points_to_next_tier": 2500,
    "referral_limit": 5,
    "support_response_hours": 24
  }'::jsonb,
  ARRAY[
    'All Bronze features included',
    '5% discount on all event bookings',
    'Priority booking access (24 hours early)',
    'Access to Silver-exclusive events',
    'Enhanced Silver profile badge',
    'Priority customer support (24-hour response)',
    '1 free table reservation per month',
    'Birthday month special discount (+10%)',
    'Earn 20 points per booking',
    'Earn 10 points per review',
    'Bonus 100 points on renewal',
    'Up to 5 referrals per month'
  ],
  true
);

-- =====================================================
-- INSERT GOLD TIER
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
  'Premium access with VIP treatment and concierge service',
  120.00,
  1200.00,
  3,
  '{
    "max_events": -1,
    "max_bookings": -1,
    "discount_percentage": 10,
    "birthday_month_discount": 15,
    "early_booking_hours": 48,
    "free_reservations_per_month": 3,
    "priority_support": true,
    "vip_lounge_access": true,
    "concierge_requests_per_month": 3,
    "event_upgrades_per_month": 1,
    "meet_greet_per_year": 2,
    "backstage_access_per_year": 0,
    "free_parking": false,
    "unlimited_reservations": false,
    "unlimited_upgrades": false,
    "unlimited_concierge": false,
    "personal_coordinator": false,
    "quarterly_gifts": false,
    "gold_exclusive_events": true,
    "enhanced_badge": "Gold",
    "points_per_booking": 30,
    "points_per_review": 15,
    "renewal_bonus_points": 250,
    "points_to_next_tier": 5000,
    "referral_limit": 10,
    "support_response_hours": 12
  }'::jsonb,
  ARRAY[
    'All Silver features included',
    '10% discount on all event bookings',
    '48-hour early booking access',
    'Access to Gold-exclusive events',
    'Enhanced Gold profile badge',
    'Premium customer support (12-hour response)',
    '3 free table reservations per month',
    '1 free event upgrade per month (zone upgrade)',
    'VIP lounge access at select venues',
    'Concierge service (3 requests per month)',
    'Complimentary meet & greet at 2 events per year',
    'Birthday month special discount (+15%)',
    'Earn 30 points per booking',
    'Earn 15 points per review',
    'Bonus 250 points on renewal',
    'Up to 10 referrals per month'
  ],
  true
);

-- =====================================================
-- INSERT PLATINUM TIER
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
  'Ultimate VIP experience with unlimited access and exclusive privileges',
  250.00,
  2500.00,
  4,
  '{
    "max_events": -1,
    "max_bookings": -1,
    "discount_percentage": 15,
    "birthday_month_discount": 25,
    "early_booking_hours": 72,
    "free_reservations_per_month": -1,
    "priority_support": true,
    "vip_lounge_access": true,
    "concierge_requests_per_month": -1,
    "event_upgrades_per_month": -1,
    "meet_greet_per_year": -1,
    "backstage_access_per_year": 2,
    "free_parking": true,
    "unlimited_reservations": true,
    "unlimited_upgrades": true,
    "unlimited_concierge": true,
    "personal_coordinator": true,
    "quarterly_gifts": true,
    "platinum_exclusive_events": true,
    "enhanced_badge": "Platinum",
    "animated_badge": true,
    "points_per_booking": 50,
    "points_per_review": 25,
    "renewal_bonus_points": 500,
    "points_to_next_tier": 0,
    "referral_limit": -1,
    "support_response_hours": 6
  }'::jsonb,
  ARRAY[
    'All Gold features included',
    '15% discount on all event bookings',
    '72-hour early booking access (3-day exclusive window)',
    'Access to Platinum-exclusive events',
    'Premium Platinum profile badge with animation',
    'VIP customer support (6-hour response, dedicated line)',
    'Unlimited table reservations',
    'Unlimited event upgrades (zone/seat upgrades)',
    'All-access VIP lounge pass',
    'Unlimited concierge service',
    'Personal event coordinator',
    'Complimentary meet & greet at all events',
    'Free parking at supported venues',
    'Backstage access at select events (2 per year)',
    'Birthday month VIP treatment (25% discount + free upgrade)',
    'Quarterly exclusive gift from partners',
    'Earn 50 points per booking',
    'Earn 25 points per review',
    'Bonus 500 points on renewal',
    'Unlimited referrals'
  ],
  true
);

-- =====================================================
-- CREATE POINT REDEMPTION TABLE
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
-- CREATE REFERRAL TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  points_awarded INTEGER DEFAULT 0,
  bonus_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- CREATE FUNCTION TO GENERATE UNIQUE REFERRAL CODE
-- =====================================================
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'REF-' || UPPER(SUBSTRING(MD5(user_id::TEXT || NOW()::TEXT), 1, 8));
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE FUNCTION TO CALCULATE POINTS FOR ACTION
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_points(
  p_user_id UUID,
  p_action TEXT -- 'booking', 'review', 'referral', 'renewal', 'birthday'
)
RETURNS INTEGER AS $$
DECLARE
  v_tier TEXT;
  v_features JSONB;
  v_points INTEGER := 0;
BEGIN
  -- Get user's current subscription tier
  SELECT tier INTO v_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to Bronze if no subscription
  IF v_tier IS NULL THEN
    v_tier := 'Bronze';
  END IF;

  -- Get plan features
  SELECT features INTO v_features
  FROM subscription_plans
  WHERE name = v_tier;

  -- Calculate points based on action
  CASE p_action
    WHEN 'booking' THEN
      v_points := (v_features->>'points_per_booking')::INTEGER;
    WHEN 'review' THEN
      v_points := (v_features->>'points_per_review')::INTEGER;
    WHEN 'referral' THEN
      v_points := CASE v_tier
        WHEN 'Bronze' THEN 50
        WHEN 'Silver' THEN 100
        WHEN 'Gold' THEN 150
        WHEN 'Platinum' THEN 200
        ELSE 50
      END;
    WHEN 'renewal' THEN
      v_points := (v_features->>'renewal_bonus_points')::INTEGER;
    WHEN 'birthday' THEN
      v_points := CASE v_tier
        WHEN 'Bronze' THEN 25
        WHEN 'Silver' THEN 50
        WHEN 'Gold' THEN 100
        WHEN 'Platinum' THEN 200
        ELSE 25
      END;
  END CASE;

  RETURN v_points;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADD RLS POLICIES
-- =====================================================

-- Point redemptions policies
ALTER TABLE point_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON point_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions"
  ON point_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all redemptions"
  ON point_redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Referrals policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_user_id);

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
  'A-Play Subscription Tiers Created Successfully!' as status,
  COUNT(*) as total_plans
FROM subscription_plans;

-- Display all plans
SELECT
  name as tier,
  price_monthly,
  price_yearly,
  tier_level,
  is_active,
  features->>'discount_percentage' as discount,
  features->>'early_booking_hours' as early_booking,
  features->>'points_per_booking' as points_per_booking
FROM subscription_plans
ORDER BY tier_level;

-- Show point calculation examples
SELECT
  'Points Calculation Examples' as info;

SELECT
  'Bronze booking: ' || calculate_points(NULL, 'booking') as example
UNION ALL
SELECT 'Bronze review: ' || calculate_points(NULL, 'review');
