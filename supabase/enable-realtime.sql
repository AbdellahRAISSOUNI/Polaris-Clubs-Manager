-- First, check if the supabase_realtime publication exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        -- Create the publication if it doesn't exist
        EXECUTE 'CREATE PUBLICATION supabase_realtime FOR ALL TABLES';
    END IF;
END
$$;

-- Make sure the messages table is included in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Make sure the online_status table is included in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE online_status;

-- Enable row-level security for the messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable row-level security for the online_status table
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

-- Create or replace policies for the messages table
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
CREATE POLICY "Anyone can read messages" ON messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert messages" ON messages;
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update messages" ON messages;
CREATE POLICY "Anyone can update messages" ON messages
  FOR UPDATE USING (true);

-- Create or replace policies for the online_status table
DROP POLICY IF EXISTS "Anyone can read online_status" ON online_status;
CREATE POLICY "Anyone can read online_status" ON online_status
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert online_status" ON online_status;
CREATE POLICY "Anyone can insert online_status" ON online_status
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update online_status" ON online_status;
CREATE POLICY "Anyone can update online_status" ON online_status
  FOR UPDATE USING (true);

-- Verify that real-time is enabled for these tables
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename IN ('messages', 'online_status'); 