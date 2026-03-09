-- Fix admin RLS policies for restaurants and other venue tables
-- The missing WITH CHECK clause was preventing admin from updating/deleting records

DROP POLICY IF EXISTS "Allow admin full access to restaurants" ON restaurants;

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

-- Also fix the admin SELECT policy to allow admins to see ALL restaurants (including inactive)
-- The current public read policy only shows active restaurants, which is fine for public users
-- but admins need to see all restaurants for management purposes
DROP POLICY IF EXISTS "Allow admin read all restaurants" ON restaurants;

CREATE POLICY "Allow admin read all restaurants"
  ON restaurants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
