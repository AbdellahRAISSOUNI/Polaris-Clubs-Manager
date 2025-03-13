-- Add sender_id column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id UUID;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS notifications_sender_id_idx ON notifications(sender_id);

-- Add a foreign key constraint to reference the clubs table
ALTER TABLE notifications 
  ADD CONSTRAINT fk_notifications_sender_id 
  FOREIGN KEY (sender_id) 
  REFERENCES clubs(id) 
  ON DELETE SET NULL; 