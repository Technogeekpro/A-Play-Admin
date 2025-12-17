-- =====================================================
-- FIX SUBSCRIPTION SCHEMA & ADD REAL DATA
-- Apply this in your Supabase SQL Editor
-- =====================================================

-- Fix user_subscriptions table - add missing fields
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Clear any existing dummy plans
TRUNCATE subscription_plans CASCADE;

-- Insert Real Subscription Plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, tier_level, features, benefits, is_active, created_at, updated_at)
VALUES
-- Free Plan
(
  'Free',
  'Perfect for getting started with basic features',
  0.00,
  0.00,
  1,
  '{"max_events": 5, "max_bookings": 10, "event_notifications": true, "priority_support": false, "featured_events": false, "analytics_dashboard": false, "custom_branding": false}'::jsonb,
  ARRAY['Access to 5 events per month', 'Basic event notifications', 'Community support', 'Mobile app access'],
  true,
  NOW(),
  NOW()
),

-- Premium Plan
(
  'Premium',
  'Unlock unlimited events and premium features',
  19.99,
  199.99,
  2,
  '{"max_events": -1, "max_bookings": -1, "event_notifications": true, "priority_support": true, "featured_events": true, "analytics_dashboard": true, "custom_branding": false, "early_access": true}'::jsonb,
  ARRAY['Unlimited events access', 'Priority booking', 'Featured event listings', 'Advanced notifications', 'Email support', 'Analytics dashboard', 'Early access to new features'],
  true,
  NOW(),
  NOW()
),

-- Pro Plan
(
  'Pro',
  'For professionals and organizers who need everything',
  49.99,
  499.99,
  3,
  '{"max_events": -1, "max_bookings": -1, "event_notifications": true, "priority_support": true, "featured_events": true, "analytics_dashboard": true, "custom_branding": true, "early_access": true, "api_access": true, "white_label": true, "dedicated_support": true}'::jsonb,
  ARRAY['Everything in Premium', 'Custom branding', 'White-label options', 'API access', 'Dedicated account manager', 'Priority phone support', 'Custom integrations', 'Advanced analytics', 'Unlimited team members'],
  true,
  NOW(),
  NOW()
);

-- Add some example user subscriptions (you can customize these)
-- Note: Replace user IDs with actual user IDs from your profiles table

-- Example: Create a sample premium subscription
-- INSERT INTO user_subscriptions (
--   user_id,
--   subscription_type,
--   plan_type,
--   status,
--   start_date,
--   end_date,
--   amount,
--   currency,
--   payment_method,
--   payment_reference,
--   is_auto_renew,
--   features_unlocked
-- )
-- SELECT
--   id as user_id,
--   'Premium' as subscription_type,
--   'monthly' as plan_type,
--   'active' as status,
--   NOW() as start_date,
--   NOW() + INTERVAL '30 days' as end_date,
--   19.99 as amount,
--   'USD' as currency,
--   'Credit Card' as payment_method,
--   'PAY-' || gen_random_uuid()::text as payment_reference,
--   true as is_auto_renew,
--   '{"max_events": -1, "max_bookings": -1, "priority_support": true}'::jsonb as features_unlocked
-- FROM profiles
-- WHERE role = 'user'
-- LIMIT 1;

-- Add RLS policies for subscription management
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public can view active plans
DROP POLICY IF EXISTS "Allow public read access to active subscription plans" ON subscription_plans;
CREATE POLICY "Allow public read access to active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Admins can manage all plans
DROP POLICY IF EXISTS "Allow admin full access to subscription plans" ON subscription_plans;
CREATE POLICY "Allow admin full access to subscription plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT 'Subscription schema fixed and plans created!' AS status;
SELECT id, name, price_monthly, price_yearly, tier_level, is_active FROM subscription_plans ORDER BY tier_level;
