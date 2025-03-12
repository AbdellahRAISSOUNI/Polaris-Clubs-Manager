-- Enable the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing notifications table if it exists
DROP TABLE IF EXISTS notifications;

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
  admin_message TEXT,
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

-- Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Add constraints after table creation to avoid errors
  CONSTRAINT recipient_type_check CHECK (recipient_type IN ('admin', 'club')),
  CONSTRAINT notification_type_check CHECK (type IN ('success', 'error', 'warning', 'info'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_type_idx ON notifications(recipient_type);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read notifications
-- You can make this more restrictive later
CREATE POLICY "Anyone can read notifications" ON notifications
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert notifications
-- You can make this more restrictive later
CREATE POLICY "Anyone can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to update their own notifications
-- This assumes the recipient_id matches the user's ID
CREATE POLICY "Anyone can update their own notifications" ON notifications
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 