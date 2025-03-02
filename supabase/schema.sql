-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT, -- In a real app, you'd use Supabase Auth and not store passwords
  role TEXT NOT NULL CHECK (role IN ('admin', 'club')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public) VALUES ('clubs', 'clubs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for space images
INSERT INTO storage.buckets (id, name, public) VALUES ('spaces', 'spaces', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for club logos
-- Allow anyone to view club logos
CREATE POLICY "Anyone can view club logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'clubs');

-- Allow anyone to upload club logos (we'll handle authorization in our app)
CREATE POLICY "Anyone can upload club logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clubs');

-- Allow anyone to update club logos (we'll handle authorization in our app)
CREATE POLICY "Anyone can update club logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'clubs');

-- Allow anyone to delete club logos (we'll handle authorization in our app)
CREATE POLICY "Anyone can delete club logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'clubs');

-- Set up storage policies for space images
-- Allow anyone to view space images
CREATE POLICY "Anyone can view space images" ON storage.objects
  FOR SELECT USING (bucket_id = 'spaces');

-- Allow anyone to upload space images (we'll handle authorization in our app)
CREATE POLICY "Anyone can upload space images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'spaces');

-- Allow anyone to update space images (we'll handle authorization in our app)
CREATE POLICY "Anyone can update space images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'spaces');

-- Allow anyone to delete space images (we'll handle authorization in our app)
CREATE POLICY "Anyone can delete space images" ON storage.objects
  FOR DELETE USING (bucket_id = 'spaces');

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- Hashed password for club login
  logo TEXT,
  members INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on clubs table
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to select clubs
CREATE POLICY "Anyone can view clubs" ON clubs
  FOR SELECT USING (true);

-- Create policy to allow anyone to insert clubs
CREATE POLICY "Anyone can insert clubs" ON clubs
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anyone to update clubs
CREATE POLICY "Anyone can update clubs" ON clubs
  FOR UPDATE USING (true);

-- Create policy to allow anyone to delete clubs
CREATE POLICY "Anyone can delete clubs" ON clubs
  FOR DELETE USING (true);

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::JSONB,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id TEXT NOT NULL, -- Using TEXT instead of UUID to match the API
  club_id TEXT NOT NULL, -- Using TEXT instead of UUID to match the API
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_full_day BOOLEAN DEFAULT FALSE, -- Indicates if this is a full day reservation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end_time is after start_time
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to select reservations
CREATE POLICY "Anyone can read reservations" ON reservations
  FOR SELECT USING (true);

-- Create policy to allow anyone to insert reservations
CREATE POLICY "Anyone can insert reservations" ON reservations
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anyone to update reservations
CREATE POLICY "Anyone can update reservations" ON reservations
  FOR UPDATE USING (true);

-- Create policy to allow anyone to delete reservations
CREATE POLICY "Anyone can delete reservations" ON reservations
  FOR DELETE USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reservations_space_id ON reservations(space_id);
CREATE INDEX IF NOT EXISTS idx_reservations_club_id ON reservations(club_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- Insert sample data for testing
INSERT INTO users (email, name, role) VALUES
  ('admin@example.com', 'Admin User', 'admin'),
  ('club@example.com', 'Club User', 'club')
ON CONFLICT (email) DO NOTHING;

INSERT INTO clubs (name, description, email, logo, members) VALUES
  ('Computer Science Club', 'A club for students interested in computer science and programming', 'cs-club@example.com', '/clubs/cs-club.jpg', 45),
  ('Debate Society', 'Fostering critical thinking through competitive debate', 'debate@example.com', '/clubs/debate.jpg', 30),
  ('Photography Club', 'Exploring the art of photography together', 'photo-club@example.com', '/clubs/photography.jpg', 25),
  ('Chess Club', 'For chess enthusiasts of all skill levels', 'chess@example.com', '/clubs/chess.jpg', 20),
  ('Environmental Action', 'Working together for a sustainable campus and community', 'eco-action@example.com', '/clubs/environmental.jpg', 35)
ON CONFLICT (email) DO NOTHING;

INSERT INTO spaces (name, capacity, features, image) VALUES
  ('Main Auditorium', 200, '["Stage", "Sound System", "Projector"]', '/spaces/auditorium.jpg'),
  ('Conference Room A', 50, '["Whiteboard", "Projector", "Video Conferencing"]', '/spaces/conference-a.jpg'),
  ('Conference Room B', 30, '["Whiteboard", "TV Screen"]', '/spaces/conference-b.jpg'),
  ('Student Lounge', 100, '["Casual Seating", "Kitchenette"]', '/spaces/lounge.jpg'),
  ('Outdoor Courtyard', 150, '["Open Air", "Power Outlets"]', '/spaces/courtyard.jpg')
ON CONFLICT DO NOTHING; 