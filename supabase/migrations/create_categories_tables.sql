-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_categories join table
CREATE TABLE IF NOT EXISTS event_categories (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (event_id, category_id)
);

-- Indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_event_categories_category_id ON event_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_event_categories_event_id ON event_categories(event_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "Allow public read access to active categories" ON categories;
DROP POLICY IF EXISTS "Allow admin full access to categories" ON categories;

CREATE POLICY "Allow public read access to active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin full access to categories"
  ON categories FOR ALL
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

-- Event categories policies
DROP POLICY IF EXISTS "Allow public read access to event categories" ON event_categories;
DROP POLICY IF EXISTS "Allow admin full access to event categories" ON event_categories;

CREATE POLICY "Allow public read access to event categories"
  ON event_categories FOR SELECT
  USING (true);

CREATE POLICY "Allow admin full access to event categories"
  ON event_categories FOR ALL
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

