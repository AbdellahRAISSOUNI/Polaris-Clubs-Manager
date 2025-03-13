import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
} else {
  console.log('Supabase client initialized with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
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

// Initialize global real-time subscriptions
const initializeRealtime = () => {
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

// Test the connection with a simpler query
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