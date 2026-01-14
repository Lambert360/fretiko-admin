/**
 * Navigation Badges Hook
 * Fetches and manages unread counts for sidebar navigation items
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface NavBadges {
  disputes: number;
  reports: number;
  memos: number;
  orders: number;
  notifications: number;
}

export function useNavBadges() {
  const { token, staff } = useAuth();
  const [badges, setBadges] = useState<NavBadges>({
    disputes: 0,
    reports: 0,
    memos: 0,
    orders: 0,
    notifications: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchBadges = async () => {
    if (!token || !staff) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/nav-badges`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      } else {
        console.warn('Failed to fetch nav badges:', response.status);
      }
    } catch (error) {
      console.error('Error fetching nav badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
    
    // Refresh badges every 30 seconds
    const interval = setInterval(fetchBadges, 30000);
    
    return () => clearInterval(interval);
  }, [token, staff]);

  return { 
    badges, 
    isLoading,
    refreshBadges: fetchBadges 
  };
}

