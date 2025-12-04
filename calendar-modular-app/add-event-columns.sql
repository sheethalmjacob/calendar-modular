-- Add is_flexible column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_flexible BOOLEAN DEFAULT true;

-- Add category column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_flexible ON events(is_flexible);
