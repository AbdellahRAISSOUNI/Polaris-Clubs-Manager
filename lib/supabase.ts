import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// During MongoDB migration, Supabase may not be configured
// Create a dummy client if env vars are missing to prevent crashes
const isSupabaseConfigured = supabaseUrl && supabaseKey;

if (!isSupabaseConfigured) {
  console.warn('⚠️  Supabase credentials not found. This is expected during MongoDB migration.');
} else {
  console.log('Supabase client initialized with URL:', supabaseUrl);
}

// Use dummy values if not configured to prevent createClient from throwing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 20
    },
    timeout: 60000
  }
});

// Initialize global real-time subscriptions only if Supabase is configured
const initializeRealtime = () => {
  if (!isSupabaseConfigured) {
    console.warn('⚠️  Skipping Supabase realtime initialization (migration in progress)');
    return null;
  }
  
  try {
    // Create a global channel for database changes
    const channel = supabase.channel('global-db-changes', {
      config: {
        broadcast: { self: true }
      }
    });
    
    // Subscribe to messages table changes
    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'messages' }, 
      (payload) => {
        console.log('Global message change detected:', payload.eventType);
      }
    );
    
    // Subscribe to online_status table changes
    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'online_status' }, 
      (payload) => {
        console.log('Global online status change detected:', payload.eventType);
      }
    );
    
    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log('Global real-time subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to real-time changes');
      } else {
        console.error('Failed to subscribe to real-time changes:', status);
      }
    });
    
    return channel;
  } catch (error) {
    console.error('Error initializing real-time subscriptions:', error);
    return null;
  }
};

// Initialize real-time subscriptions
const globalChannel = initializeRealtime();

// Test the connection only if Supabase is configured
if (isSupabaseConfigured) {
  (async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error('Error connecting to Supabase:', error);
      } else {
        console.log('Successfully connected to Supabase messages table');
      }
    } catch (err) {
      console.error('Unexpected error testing Supabase connection:', err);
    }
  })();
} 