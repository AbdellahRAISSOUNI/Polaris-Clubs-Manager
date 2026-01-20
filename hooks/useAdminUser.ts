import { useState, useEffect } from 'react';
import { isAdmin, getAdminId } from '@/lib/storage';

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

      const adminId = getAdminId();
      if (!adminId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch from users API - we'll need to create this endpoint or use existing one
        // For now, using a workaround to get user data
        const response = await fetch(`/api/users?id=${adminId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch admin user');
        }

        const data = await response.json();
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