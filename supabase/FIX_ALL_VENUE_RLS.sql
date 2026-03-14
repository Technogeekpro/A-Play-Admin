-- =====================================================
-- FIX ALL VENUE TABLE RLS POLICIES
-- Apply this in your Supabase SQL Editor
-- Project: yvnfhsipyfxdmulajbgl
--
-- Root cause 1: Admin policies were missing WITH CHECK clause,
-- which is required for INSERT and UPDATE operations in PostgreSQL.
-- Root cause 2: created_by column was never added to venue tables.
-- =====================================================

-- -------------------------------------------------------
-- STEP 1: Add missing created_by column to all venue tables
-- -------------------------------------------------------
ALTER TABLE restaurants  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE lounges      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE pubs         ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE arcade_centers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE beaches      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE live_shows   ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- -------------------------------------------------------
-- STEP 2: Fix RLS policies
-- -------------------------------------------------------

-- -------------------------------------------------------
-- RESTAURANTS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Allow admin full access to restaurants" ON restaurants;
DROP POLICY IF EXISTS "Allow admin read all restaurants" ON restaurants;
DROP POLICY IF EXISTS "Allow organizers manage own restaurants" ON restaurants;

-- Public can read active restaurants
CREATE POLICY "Allow public read access to active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

-- Admins can read ALL restaurants (including inactive)
CREATE POLICY "Allow admin read all restaurants"
  ON restaurants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins have full write access (WITH CHECK required for INSERT/UPDATE)
CREATE POLICY "Allow admin full access to restaurants"
  ON restaurants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Organizers manage their own restaurants
CREATE POLICY "Allow organizers manage own restaurants"
  ON restaurants FOR ALL
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  );

-- -------------------------------------------------------
-- LOUNGES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to active lounges" ON lounges;
DROP POLICY IF EXISTS "Allow admin full access to lounges" ON lounges;
DROP POLICY IF EXISTS "Allow admin read all lounges" ON lounges;
DROP POLICY IF EXISTS "Allow organizers manage own lounges" ON lounges;

CREATE POLICY "Allow public read access to active lounges"
  ON lounges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin read all lounges"
  ON lounges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin full access to lounges"
  ON lounges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow organizers manage own lounges"
  ON lounges FOR ALL
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  );

-- -------------------------------------------------------
-- PUBS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to active pubs" ON pubs;
DROP POLICY IF EXISTS "Allow admin full access to pubs" ON pubs;
DROP POLICY IF EXISTS "Allow admin read all pubs" ON pubs;
DROP POLICY IF EXISTS "Allow organizers manage own pubs" ON pubs;

CREATE POLICY "Allow public read access to active pubs"
  ON pubs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin read all pubs"
  ON pubs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin full access to pubs"
  ON pubs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow organizers manage own pubs"
  ON pubs FOR ALL
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  );

-- -------------------------------------------------------
-- ARCADE CENTERS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to active arcade centers" ON arcade_centers;
DROP POLICY IF EXISTS "Allow admin full access to arcade centers" ON arcade_centers;
DROP POLICY IF EXISTS "Allow admin read all arcade centers" ON arcade_centers;
DROP POLICY IF EXISTS "Allow organizers manage own arcade centers" ON arcade_centers;

CREATE POLICY "Allow public read access to active arcade centers"
  ON arcade_centers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin read all arcade centers"
  ON arcade_centers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin full access to arcade centers"
  ON arcade_centers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow organizers manage own arcade centers"
  ON arcade_centers FOR ALL
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  );

-- -------------------------------------------------------
-- BEACHES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to active beaches" ON beaches;
DROP POLICY IF EXISTS "Allow admin full access to beaches" ON beaches;
DROP POLICY IF EXISTS "Allow admin read all beaches" ON beaches;
DROP POLICY IF EXISTS "Allow organizers manage own beaches" ON beaches;

CREATE POLICY "Allow public read access to active beaches"
  ON beaches FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin read all beaches"
  ON beaches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin full access to beaches"
  ON beaches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow organizers manage own beaches"
  ON beaches FOR ALL
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  );

-- -------------------------------------------------------
-- LIVE SHOWS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to active live shows" ON live_shows;
DROP POLICY IF EXISTS "Allow admin full access to live shows" ON live_shows;
DROP POLICY IF EXISTS "Allow admin read all live shows" ON live_shows;
DROP POLICY IF EXISTS "Allow organizers manage own live shows" ON live_shows;

CREATE POLICY "Allow public read access to active live shows"
  ON live_shows FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin read all live shows"
  ON live_shows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin full access to live shows"
  ON live_shows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow organizers manage own live shows"
  ON live_shows FOR ALL
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_organizer = true
    )
  );

-- -------------------------------------------------------
-- CLUBS (fix if same issue exists)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin full access to clubs" ON clubs;
DROP POLICY IF EXISTS "Allow admin read all clubs" ON clubs;

CREATE POLICY "Allow admin read all clubs"
  ON clubs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin full access to clubs"
  ON clubs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- -------------------------------------------------------
-- VERIFY
-- -------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'has USING' ELSE 'no USING' END as using_clause,
  CASE WHEN with_check IS NOT NULL THEN 'has WITH CHECK' ELSE 'no WITH CHECK' END as check_clause
FROM pg_policies
WHERE tablename IN ('restaurants', 'lounges', 'pubs', 'arcade_centers', 'beaches', 'live_shows', 'clubs')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;
