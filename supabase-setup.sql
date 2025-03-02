-- Enable the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the existing table if it exists
DROP TABLE IF EXISTS reservations;

-- Create the reservations table with TEXT types for club_id and space_id
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id TEXT NOT NULL,
  club_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on club_id for faster queries
CREATE INDEX IF NOT EXISTS reservations_club_id_idx ON reservations(club_id);

-- Create an index on space_id for faster queries
CREATE INDEX IF NOT EXISTS reservations_space_id_idx ON reservations(space_id);

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status);

-- Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read reservations
CREATE POLICY "Anyone can read reservations" ON reservations
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert reservations
CREATE POLICY "Anyone can insert reservations" ON reservations
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to update reservations
CREATE POLICY "Anyone can update reservations" ON reservations
  FOR UPDATE USING (true); 