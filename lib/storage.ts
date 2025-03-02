/**
 * Simple storage utility for client-side data
 */

// Store club ID
export const storeClubId = (clubId: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('clubId', clubId);
  }
};

// Get club ID
export const getClubId = (): string | null => {
  if (typeof window !== 'undefined') {
    const storedClubId = localStorage.getItem('clubId');
    if (!storedClubId) {
      console.warn('No club ID found in storage');
      return null;
    }
    return storedClubId;
  }
  return null; // Default for SSR
};

// Store admin status
export const storeIsAdmin = (isAdmin: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
  }
};

// Check if user is admin
export const isAdmin = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('isAdmin') === 'true';
  }
  return false; // Default for SSR
};

// Clear all storage
export const clearStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('clubId');
    localStorage.removeItem('isAdmin');
  }
}; 