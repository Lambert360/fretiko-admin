/**
 * ADMIN NOTIFICATIONS HOOK
 * WebSocket-powered real-time notifications for admin panel
 * 
 * Requirements: npm install socket.io-client
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminNotification {
  id: string;
  staff_id: string;
  type: string;
  category: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  message: string;
  data: any;
  link?: string;
  icon: string;
  is_read: boolean;
  is_deleted: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationStats {
  unread: number;
  total: number;
  read: number;
}

export function useAdminNotifications() {
  const { staff } = useAuth();
  // Get token from localStorage (where it's actually stored)
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // STABLE WebSocket connection - connects once per component lifecycle
  useEffect(() => {
    // Prevent multiple connections and check auth
    if (!token || !staff?.id) {
      console.log('⚠️ No token or staff - skipping WebSocket connection');
      return;
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) {
      console.log('🔄 WebSocket already connected, skipping reconnection');
      return;
    }

    console.log('🔍 Auth Debug:', {
      hasToken: !!token,
      hasStaff: !!staff,
      staffId: staff.id,
      staffRole: staff.role
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socketUrl = apiUrl.replace('/api', '');

    console.log(`🔌 Connecting to admin notifications WebSocket: ${socketUrl}/admin-notifications`);

    const socket = io(`${socketUrl}/admin-notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event
    socket.on('connect', () => {
      console.log('✅ Admin notifications WebSocket connected');
      setIsConnected(true);

      // Request initial notifications and count
      socket.emit('notification:get_all');
      socket.emit('notification:get_count');
    });

    // Connection confirmation
    socket.on('connection:confirmed', (data: any) => {
      console.log('✅ Connection confirmed:', data);
    });

    // Initial notifications load
    socket.on('notification:all', (notifications: AdminNotification[]) => {
      console.log('📋 Initial notifications loaded:', notifications?.length || 0);
      setNotifications(Array.isArray(notifications) ? notifications : []);
    });

    // Initial count load
    socket.on('notification:count', ({ unread, total }: { unread: number; total: number }) => {
      console.log(`📊 Initial count: ${unread} unread / ${total} total`);
      setUnreadCount(unread);
    });

    // New notification
    socket.on('notification:new', (notification: AdminNotification) => {
      console.log('🔔 New notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.priority === 'urgent' || notification.priority === 'high',
          });
        } catch (error) {
          console.error('Failed to show browser notification:', error);
        }
      }
    });

    // Broadcast notifications
    socket.on('notification:broadcast', (notification: any) => {
      console.log('📣 Broadcast notification:', notification);
      setNotifications((prev) => [
        {
          ...notification,
          id: `broadcast-${Date.now()}`,
          staff_id: staff.id,
          is_read: false,
          is_deleted: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    // Disconnection
    socket.on('disconnect', (reason: string) => {
      console.log('❌ Admin notifications WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    // Error handling
    socket.on('connect_error', (error: any) => {
      console.error('🔴 WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Success responses for actions
    socket.on('notification:mark_read:success', ({ id }: { id: string }) => {
      console.log(`✅ Notification ${id} marked as read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on('notification:mark_all_read:success', () => {
      console.log('✅ All notifications marked as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    });

    socket.on('notification:delete:success', ({ id }: { id: string }) => {
      console.log(`✅ Notification ${id} deleted`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // Recalculate unread count
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });

    socketRef.current = socket;

    // Cleanup only on component unmount
    return () => {
      console.log('🔌 Component unmounting - disconnecting WebSocket');
      socket.disconnect();
    };
  }, []); // Empty dependency array - connect once per component lifecycle

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    if (!socketRef.current) return;

    console.log(`📖 Marking notification ${id} as read`);
    socketRef.current.emit('notification:mark_read', { id });

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    if (!socketRef.current) return;

    console.log('📖 Marking all notifications as read');
    socketRef.current.emit('notification:mark_all_read');

    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    if (!socketRef.current) return;

    console.log(`🗑️ Deleting notification ${id}`);
    socketRef.current.emit('notification:delete', { id });

    // Optimistically update UI
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const notification = notifications.find((n) => n.id === id);
      return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
    });
  }, [notifications]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser does not support notifications');
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log(`🔔 Notification permission: ${permission}`);
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, []);

  // Fetch initial notifications from API
  const fetchNotifications = useCallback(async (page: number = 1, limit: number = 20) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/notifications?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result = await response.json();
      setNotifications(result.data || []);
      
      // Update unread count
      const unread = (result.data || []).filter((n: AdminNotification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch stats
  const fetchStats = useCallback(async (): Promise<NotificationStats | null> => {
    if (!token) return null;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/notifications/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notification stats');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch notification stats:', error);
      return null;
    }
  }, [token]);

  // Fetch initial notifications on mount
  useEffect(() => {
    if (token && staff) {
      fetchNotifications();
      fetchStats().then((stats) => {
        if (stats) {
          setUnreadCount(stats.unread);
        }
      });
    }
  }, [token, staff, fetchNotifications, fetchStats]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    fetchNotifications,
    fetchStats,
  };
}

