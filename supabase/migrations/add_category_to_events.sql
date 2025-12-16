-- Add category column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN events.category IS 'Event category: Club Event, Live Show, Concert, Festival, Pub Event, Sports Event, or Other';
