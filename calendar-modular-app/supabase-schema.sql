-- Calendar Modular Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Class Catalog table (stores all extracted classes from PDF)
CREATE TABLE IF NOT EXISTS class_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_name TEXT NOT NULL,
  course_code TEXT,
  section TEXT,
  instructor TEXT,
  location TEXT,
  days TEXT[], -- Array of days: ['M', 'W', 'F'] or ['T', 'R']
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE, -- Controls visibility in calendar
  pdf_source TEXT, -- Reference to original PDF file
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE class_catalog ENABLE ROW LEVEL SECURITY;

-- Policies for class_catalog
CREATE POLICY "Users can view their own classes"
  ON class_catalog FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classes"
  ON class_catalog FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes"
  ON class_catalog FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes"
  ON class_catalog FOR DELETE
  USING (auth.uid() = user_id);

-- Events table (stores both fixed and flexible events)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT, -- 'class', 'work', 'study', 'gym', 'personal', etc.
  event_type TEXT CHECK (event_type IN ('fixed', 'flexible')) NOT NULL, -- 'fixed' = PDF classes, 'flexible' = personal events
  class_catalog_id UUID REFERENCES class_catalog(id) ON DELETE CASCADE, -- Links to class_catalog if it's a class
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- RRULE format for recurring events (Phase 3)
  color TEXT, -- Hex color code for the event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- PDF Uploads table (tracks uploaded PDF files)
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size INTEGER,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  classes_extracted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for pdf_uploads
CREATE POLICY "Users can view their own uploads"
  ON pdf_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON pdf_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads"
  ON pdf_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
  ON pdf_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Calendar Exports table (tracks exports to Google/Outlook/Apple Calendar)
CREATE TABLE IF NOT EXISTS calendar_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calendar_type TEXT CHECK (calendar_type IN ('google', 'outlook', 'apple')) NOT NULL,
  export_date TIMESTAMPTZ DEFAULT NOW(),
  events_exported INTEGER DEFAULT 0,
  external_calendar_id TEXT, -- ID from external calendar service
  sync_token TEXT, -- For maintaining connection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE calendar_exports ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_exports
CREATE POLICY "Users can view their own exports"
  ON calendar_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exports"
  ON calendar_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exports"
  ON calendar_exports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
  ON calendar_exports FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_catalog_updated_at BEFORE UPDATE ON class_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_exports_updated_at BEFORE UPDATE ON calendar_exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-uploads', 'pdf-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for PDF uploads
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pdf-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdf-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pdf-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
