-- =====================================================
-- CHECK SUBSCRIPTION_PLANS SCHEMA
-- Run this first to see the current table structure
-- =====================================================

-- Show all columns and their constraints
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Show all constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'subscription_plans'
ORDER BY tc.constraint_type, tc.constraint_name;
