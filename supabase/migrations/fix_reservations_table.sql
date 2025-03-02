-- Drop existing reservations table if it exists
DROP TABLE IF EXISTS reservations;

-- Create the reservations table with proper types
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id TEXT NOT NULL, -- Using TEXT instead of UUID to match the API
  club_id TEXT NOT NULL, -- Using TEXT instead of UUID to match the API
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end_time is after start_time
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS reservations_club_id_idx ON reservations(club_id);
CREATE INDEX IF NOT EXISTS reservations_space_id_idx ON reservations(space_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status);

-- Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for reservations
DO $$
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reservations' 
        AND policyname = 'Anyone can read reservations'
    ) THEN
        DROP POLICY "Anyone can read reservations" ON reservations;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reservations' 
        AND policyname = 'Anyone can insert reservations'
    ) THEN
        DROP POLICY "Anyone can insert reservations" ON reservations;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reservations' 
        AND policyname = 'Anyone can update reservations'
    ) THEN
        DROP POLICY "Anyone can update reservations" ON reservations;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reservations' 
        AND policyname = 'Anyone can delete reservations'
    ) THEN
        DROP POLICY "Anyone can delete reservations" ON reservations;
    END IF;
END
$$;

-- Create new policies
CREATE POLICY "Anyone can read reservations" ON reservations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert reservations" ON reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update reservations" ON reservations
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete reservations" ON reservations
  FOR DELETE USING (true); 