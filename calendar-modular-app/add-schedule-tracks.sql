-- Add schedule tracks feature to group classes by PDF upload

-- Create schedule_tracks table
CREATE TABLE IF NOT EXISTS schedule_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- User-friendly name like "Fall 2025 - Option A"
  pdf_filename TEXT, -- Original PDF filename
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE schedule_tracks ENABLE ROW LEVEL SECURITY;

-- Policies for schedule_tracks
CREATE POLICY "Users can view their own tracks"
  ON schedule_tracks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks"
  ON schedule_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks"
  ON schedule_tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks"
  ON schedule_tracks FOR DELETE
  USING (auth.uid() = user_id);

-- Add track_id column to class_catalog if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'class_catalog' AND column_name = 'track_id'
  ) THEN
    ALTER TABLE class_catalog 
    ADD COLUMN track_id UUID REFERENCES schedule_tracks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_class_catalog_track_id ON class_catalog(track_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tracks_user_id ON schedule_tracks(user_id);
