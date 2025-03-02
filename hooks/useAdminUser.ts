import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/storage';

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export function useAdminUser() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminUser = async () => {
      if (!isAdmin()) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('role', 'admin')
          .single();

        if (error) {
          throw error;
        }

        setAdminUser(data);
      } catch (err: any) {
        console.error('Error fetching admin user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminUser();
  }, []);

  return { adminUser, loading, error };
} 