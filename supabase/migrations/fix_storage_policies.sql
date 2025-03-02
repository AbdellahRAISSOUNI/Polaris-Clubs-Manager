-- Drop existing policies if they exist
DO $$
BEGIN
    -- Check if the policy exists before trying to drop it
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Club logos are publicly accessible'
    ) THEN
        DROP POLICY "Club logos are publicly accessible" ON storage.objects;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload club logos'
    ) THEN
        DROP POLICY "Authenticated users can upload club logos" ON storage.objects;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can update club logos'
    ) THEN
        DROP POLICY "Authenticated users can update club logos" ON storage.objects;
    END IF;
END
$$;

-- Create storage bucket for club logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clubs', 'clubs', true)
ON CONFLICT (id) DO NOTHING;

-- Create new policies with proper permissions
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

-- Enable RLS on clubs table if not already enabled
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to select clubs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clubs' 
        AND policyname = 'Anyone can view clubs'
    ) THEN
        CREATE POLICY "Anyone can view clubs" ON clubs
          FOR SELECT USING (true);
    END IF;
END
$$;

-- Create policy to allow anyone to insert clubs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clubs' 
        AND policyname = 'Anyone can insert clubs'
    ) THEN
        CREATE POLICY "Anyone can insert clubs" ON clubs
          FOR INSERT WITH CHECK (true);
    END IF;
END
$$;

-- Create policy to allow anyone to update clubs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clubs' 
        AND policyname = 'Anyone can update clubs'
    ) THEN
        CREATE POLICY "Anyone can update clubs" ON clubs
          FOR UPDATE USING (true);
    END IF;
END
$$;

-- Create policy to allow anyone to delete clubs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clubs' 
        AND policyname = 'Anyone can delete clubs'
    ) THEN
        CREATE POLICY "Anyone can delete clubs" ON clubs
          FOR DELETE USING (true);
    END IF;
END
$$; 