-- Add a new column to track read status updates separately from content edits
ALTER TABLE messages ADD COLUMN IF NOT EXISTS last_read_update TIMESTAMP WITH TIME ZONE;

-- Update existing messages to set last_read_update to updated_at for messages that are read
UPDATE messages 
SET last_read_update = updated_at 
WHERE is_read = true;

-- Create a function to update messages when marked as read
CREATE OR REPLACE FUNCTION update_message_read_status(
  p_message_id UUID,
  p_is_read BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET 
    is_read = p_is_read,
    last_read_update = CURRENT_TIMESTAMP
  WHERE id = p_message_id;
END;
$$;

-- Create a function to mark all messages in a conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_messages_read(
  p_sender_id UUID,
  p_sender_type TEXT,
  p_recipient_id UUID,
  p_recipient_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET 
    is_read = true,
    last_read_update = CURRENT_TIMESTAMP
  WHERE 
    sender_id = p_sender_id AND
    sender_type = p_sender_type AND
    recipient_id = p_recipient_id AND
    recipient_type = p_recipient_type AND
    is_read = false;
END;
$$;

-- Fix any messages that incorrectly show as edited due to read status updates
UPDATE messages
SET updated_at = created_at
WHERE 
  is_read = true AND 
  updated_at > created_at AND
  (reactions IS NULL OR reactions = '{}'::jsonb) AND
  NOT is_deleted; 