# Supabase Real-time Setup Guide

To ensure real-time messaging works correctly, you need to properly configure your Supabase project. Follow these steps:

## 1. Enable Real-time in Supabase Dashboard

1. Log in to your Supabase dashboard
2. Select your project
3. Go to **Database** → **Replication**
4. In the **Realtime** section, make sure it's enabled
5. Click on **Manage tables**
6. Add both `messages` and `online_status` tables to the list of tables that broadcast changes
7. Make sure to check all event types: `INSERT`, `UPDATE`, `DELETE`
8. Save your changes

## 2. Run the SQL Commands

Run the SQL commands in the `supabase/enable-realtime.sql` file in your Supabase SQL editor. This will:

- Ensure the `supabase_realtime` publication exists
- Add the `messages` and `online_status` tables to the publication
- Set up the necessary Row Level Security policies

## 3. Verify Real-time is Working

After setting up real-time, you can verify it's working by:

1. Opening the browser console
2. Looking for log messages like:
   - "Messages subscription status: SUBSCRIBED"
   - "Online status subscription status: SUBSCRIBED"
   - "Global real-time subscription status: SUBSCRIBED"

3. Send a test message and check if it appears without refreshing

## Troubleshooting

If real-time is not working:

1. **Check Supabase Dashboard**:
   - Verify that real-time is enabled
   - Verify that the correct tables are added to the real-time configuration

2. **Check Browser Console**:
   - Look for any error messages related to Supabase or real-time
   - Verify that the subscription status is "SUBSCRIBED"

3. **Check Network Tab**:
   - Look for WebSocket connections to Supabase
   - Verify that the connection is established and maintained

4. **Run the SQL Commands Again**:
   - Sometimes you need to run the SQL commands again to ensure the publication is properly set up

5. **Restart the Supabase Project**:
   - In rare cases, you might need to restart your Supabase project to apply the changes

## Additional Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/subscribe) 