'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (limit?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  lastFetched: number | null;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  lastFetched: null
});

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async (limit = 50) => {
    if (!user) return;

    // If we have cached notifications and the cache hasn't expired, don't fetch again
    if (notifications.length > 0 && lastFetched && Date.now() - lastFetched < CACHE_EXPIRATION) {
      console.log('Using cached notifications data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching notifications for user: ${user.id}`);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      // Count unread notifications
      const unreadNotifications = (data || []).filter(notification => !notification.is_read);
      
      console.log(`Found ${data?.length || 0} notifications, ${unreadNotifications.length} unread`);
      
      setNotifications(data || []);
      setUnreadCount(unreadNotifications.length);
      setLastFetched(Date.now());
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user, notifications.length, lastFetched]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Make API request
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      // Rollback on error (re-fetch to ensure consistent state)
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      // Optimistic update
      setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })));
      setUnreadCount(0);

      // Make API request
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      // Rollback on error (re-fetch to ensure consistent state)
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Setup real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time notifications subscription');

    // Subscribe to changes in the notifications table for this user
    const subscription = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (insert, update, delete)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Received notification update:', payload);
          
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            // Add new notification to the list
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            
            // Update unread count if the new notification is unread
            if (!newNotification.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update the notification in the list
            const updatedNotification = payload.new as Notification;
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === updatedNotification.id ? updatedNotification : notification
              )
            );
            
            // Recalculate unread count
            setNotifications(current => {
              const unreadCount = current.filter(n => !n.is_read).length;
              setUnreadCount(unreadCount);
              return current;
            });
          } else if (payload.eventType === 'DELETE') {
            // Remove the notification from the list
            const deletedNotification = payload.old as Notification;
            setNotifications(prev => 
              prev.filter(notification => notification.id !== deletedNotification.id)
            );
            
            // Recalculate unread count if the deleted notification was unread
            if (!deletedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      console.log('Cleaning up real-time notifications subscription');
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Initial fetch of notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const contextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    lastFetched
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext); 