-- Create a function to delete a notification by ID
-- This function can be called using supabase.rpc('delete_notification', { notification_id: 'your-id' })
CREATE OR REPLACE FUNCTION delete_notification(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE id = notification_id
  RETURNING 1 INTO deleted_count;
  
  -- Return true if a notification was deleted, false otherwise
  RETURN deleted_count > 0;
END;
$$;

-- Create a function to delete all notifications for a user
-- This function can be called using supabase.rpc('delete_all_notifications', { user_id: 'your-id', user_type: 'admin' })
CREATE OR REPLACE FUNCTION delete_all_notifications(user_id TEXT, user_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- First count how many notifications will be deleted
  SELECT COUNT(*) INTO deleted_count
  FROM notifications
  WHERE recipient_id = user_id AND recipient_type = user_type;
  
  -- Then delete them
  DELETE FROM notifications
  WHERE recipient_id = user_id AND recipient_type = user_type;
  
  -- Return the number of notifications deleted
  RETURN deleted_count;
END;
$$;

-- Grant execute permission on the functions to authenticated users
GRANT EXECUTE ON FUNCTION delete_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_all_notifications(TEXT, TEXT) TO authenticated; 