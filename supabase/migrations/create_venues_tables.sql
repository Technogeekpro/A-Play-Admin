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
  opening_hours JSONB, -- Store as {"monday": "9:00 AM - 11:00 PM", ...}
  amenities TEXT[], -- Array of amenities like ["WiFi", "Air Conditioning", "Parking"]
  price_range TEXT, -- e.g., "$", "$$", "$$$", "$$$$"
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure created_by column exists on lounges for existing databases
ALTER TABLE lounges
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

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
  cuisine_types TEXT[], -- e.g., ["British", "Irish", "American"]
  price_range TEXT,
  has_live_music BOOLEAN DEFAULT false,
  has_sports_viewing BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure created_by column exists on pubs for existing databases
ALTER TABLE pubs
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

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
  game_types TEXT[], -- e.g., ["VR Games", "Classic Arcade", "Racing Games"]
  price_range TEXT,
  age_restriction TEXT, -- e.g., "All Ages", "13+", "18+"
  has_food_court BOOLEAN DEFAULT false,
  has_party_rooms BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure created_by column exists on arcade_centers for existing databases
ALTER TABLE arcade_centers
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

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
  beach_type TEXT, -- e.g., "Public", "Private", "Resort"
  water_activities TEXT[], -- e.g., ["Swimming", "Surfing", "Jet Ski"]
  has_lifeguard BOOLEAN DEFAULT false,
  has_restaurant BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  entry_fee TEXT, -- e.g., "Free", "$10", "$20"
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure created_by column exists on beaches for existing databases
ALTER TABLE beaches
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

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
  show_time TEXT, -- e.g., "8:00 PM"
  duration_minutes INTEGER, -- Show duration in minutes
  genre TEXT[], -- e.g., ["Comedy", "Music", "Theatre"]
  ticket_price_min DECIMAL(10, 2),
  ticket_price_max DECIMAL(10, 2),
  ticket_url TEXT, -- External booking link
  capacity INTEGER,
  age_restriction TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure created_by column exists on live_shows for existing databases
ALTER TABLE live_shows
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Create indexes for better query performance
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

DROP POLICY IF EXISTS "Allow public read access to active lounges" ON lounges;
DROP POLICY IF EXISTS "Allow admin full access to lounges" ON lounges;
DROP POLICY IF EXISTS "Allow organizers manage own lounges" ON lounges;
DROP POLICY IF EXISTS "Allow public read access to active pubs" ON pubs;
DROP POLICY IF EXISTS "Allow admin full access to pubs" ON pubs;
DROP POLICY IF EXISTS "Allow organizers manage own pubs" ON pubs;
DROP POLICY IF EXISTS "Allow public read access to active arcade centers" ON arcade_centers;
DROP POLICY IF EXISTS "Allow admin full access to arcade centers" ON arcade_centers;
DROP POLICY IF EXISTS "Allow organizers manage own arcade centers" ON arcade_centers;
DROP POLICY IF EXISTS "Allow public read access to active beaches" ON beaches;
DROP POLICY IF EXISTS "Allow admin full access to beaches" ON beaches;
DROP POLICY IF EXISTS "Allow organizers manage own beaches" ON beaches;
DROP POLICY IF EXISTS "Allow public read access to active live shows" ON live_shows;
DROP POLICY IF EXISTS "Allow admin full access to live shows" ON live_shows;
DROP POLICY IF EXISTS "Allow organizers manage own live shows" ON live_shows;

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

-- Add comments for documentation
COMMENT ON TABLE lounges IS 'Lounge venues with amenities and pricing information';
COMMENT ON TABLE pubs IS 'Pub venues with food, drinks, and entertainment options';
COMMENT ON TABLE arcade_centers IS 'Arcade gaming centers with game types and facilities';
COMMENT ON TABLE beaches IS 'Beach locations with activities and amenities';
COMMENT ON TABLE live_shows IS 'Live entertainment shows and performances';
