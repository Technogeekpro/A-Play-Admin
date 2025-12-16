-- =====================================================
-- SUPABASE DATABASE MIGRATIONS
-- Apply this script in your Supabase SQL Editor
-- Project: yvnfhsipyfxdmulajbgl
-- =====================================================

-- First, add category column to events table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'category'
  ) THEN
    ALTER TABLE events ADD COLUMN category TEXT;
    COMMENT ON COLUMN events.category IS 'Event category: Club Event, Live Show, Concert, Festival, Pub Event, Sports Event, or Other';
  END IF;
END $$;

-- Create lounges table
CREATE TABLE IF NOT EXISTS lounges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  cover_image TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB,
  amenities TEXT[],
  price_range TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pubs table
CREATE TABLE IF NOT EXISTS pubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  cover_image TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB,
  amenities TEXT[],
  cuisine_types TEXT[],
  price_range TEXT,
  has_live_music BOOLEAN DEFAULT false,
  has_sports_viewing BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create arcade_centers table
CREATE TABLE IF NOT EXISTS arcade_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  cover_image TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB,
  amenities TEXT[],
  game_types TEXT[],
  price_range TEXT,
  age_restriction TEXT,
  has_food_court BOOLEAN DEFAULT false,
  has_party_rooms BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create beaches table
CREATE TABLE IF NOT EXISTS beaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  cover_image TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours JSONB,
  amenities TEXT[],
  beach_type TEXT,
  water_activities TEXT[],
  has_lifeguard BOOLEAN DEFAULT false,
  has_restaurant BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  entry_fee TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live_shows table
CREATE TABLE IF NOT EXISTS live_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  venue_name TEXT,
  cover_image TEXT,
  performer_name TEXT NOT NULL,
  performer_image TEXT,
  show_date TIMESTAMP WITH TIME ZONE NOT NULL,
  show_time TEXT,
  duration_minutes INTEGER,
  genre TEXT[],
  ticket_price_min DECIMAL(10, 2),
  ticket_price_max DECIMAL(10, 2),
  ticket_url TEXT,
  capacity INTEGER,
  age_restriction TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lounges_is_featured ON lounges(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_lounges_is_active ON lounges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_lounges_created_at ON lounges(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pubs_is_featured ON pubs(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_pubs_is_active ON pubs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pubs_created_at ON pubs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_arcade_centers_is_featured ON arcade_centers(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_arcade_centers_is_active ON arcade_centers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_arcade_centers_created_at ON arcade_centers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_beaches_is_featured ON beaches(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_beaches_is_active ON beaches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_beaches_created_at ON beaches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_shows_is_featured ON live_shows(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_live_shows_is_active ON live_shows(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_live_shows_show_date ON live_shows(show_date);
CREATE INDEX IF NOT EXISTS idx_live_shows_created_at ON live_shows(created_at DESC);

-- Enable Row Level Security
ALTER TABLE lounges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE beaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_shows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to active lounges" ON lounges;
DROP POLICY IF EXISTS "Allow admin full access to lounges" ON lounges;
DROP POLICY IF EXISTS "Allow public read access to active pubs" ON pubs;
DROP POLICY IF EXISTS "Allow admin full access to pubs" ON pubs;
DROP POLICY IF EXISTS "Allow public read access to active arcade centers" ON arcade_centers;
DROP POLICY IF EXISTS "Allow admin full access to arcade centers" ON arcade_centers;
DROP POLICY IF EXISTS "Allow public read access to active beaches" ON beaches;
DROP POLICY IF EXISTS "Allow admin full access to beaches" ON beaches;
DROP POLICY IF EXISTS "Allow public read access to active live shows" ON live_shows;
DROP POLICY IF EXISTS "Allow admin full access to live shows" ON live_shows;

-- Create RLS Policies for lounges
CREATE POLICY "Allow public read access to active lounges"
  ON lounges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin full access to lounges"
  ON lounges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create RLS Policies for pubs
CREATE POLICY "Allow public read access to active pubs"
  ON pubs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin full access to pubs"
  ON pubs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create RLS Policies for arcade_centers
CREATE POLICY "Allow public read access to active arcade centers"
  ON arcade_centers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin full access to arcade centers"
  ON arcade_centers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create RLS Policies for beaches
CREATE POLICY "Allow public read access to active beaches"
  ON beaches FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin full access to beaches"
  ON beaches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create RLS Policies for live_shows
CREATE POLICY "Allow public read access to active live shows"
  ON live_shows FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin full access to live shows"
  ON live_shows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments
COMMENT ON TABLE lounges IS 'Lounge venues with amenities and pricing information';
COMMENT ON TABLE pubs IS 'Pub venues with food, drinks, and entertainment options';
COMMENT ON TABLE arcade_centers IS 'Arcade gaming centers with game types and facilities';
COMMENT ON TABLE beaches IS 'Beach locations with activities and amenities';
COMMENT ON TABLE live_shows IS 'Live entertainment shows and performances';

-- Verify tables were created
SELECT 'Tables created successfully!' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('lounges', 'pubs', 'arcade_centers', 'beaches', 'live_shows', 'events')
ORDER BY table_name;
