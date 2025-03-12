# Supabase Setup for Notification Deletion

To fix the notification deletion functionality, you need to add some database functions to your Supabase project. Follow these steps:

## 1. Access the Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

## 2. Create the Notification Deletion Functions

Copy and paste the following SQL code into the SQL Editor and run it:

```sql
-- Create a function to delete a notification by ID
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
```

## 3. Verify the Functions

After running the SQL, you should see a success message. The functions are now available to be called from your application.

## 4. Test the Functionality

1. Go to your application's notifications page
2. Try deleting a notification
3. Try deleting all notifications

The delete functionality should now work correctly.

## Troubleshooting

If you're still experiencing issues:

1. Check the browser console for any error messages
2. Verify that your Supabase client has the correct permissions
3. Make sure your RLS (Row Level Security) policies allow deletion operations
4. Try using the debug tools added to the notifications page (in development mode) 