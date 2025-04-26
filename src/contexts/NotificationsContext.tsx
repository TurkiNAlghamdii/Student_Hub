/**
 * NotificationsContext Module
 *
 * This context provides notification management throughout the application.
 * It handles fetching, caching, and updating notification data from Supabase,
 * as well as tracking read/unread status and providing notification counts.
 *
 * Key features:
 * - Fetches and caches user notifications
 * - Tracks unread notification count
 * - Provides functions to mark notifications as read
 * - Implements optimistic updates for better UX
 * - Handles loading and error states
 * - Integrates with the auth system
 * - Implements smart caching to reduce API calls
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Interface representing a notification object from the database
 * 
 * @property id - Unique identifier for the notification
 * @property type - Type of notification (e.g., 'announcement', 'event')
 * @property title - Title/heading of the notification
 * @property message - Main content of the notification
 * @property link - Optional URL to navigate to when clicking the notification
 * @property is_read - Boolean indicating if the notification has been read
 * @property created_at - ISO date string when the notification was created
 * @property user_id - ID of the user this notification belongs to
 */
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

/**
 * Interface defining the shape of the notifications context
 * 
 * @property notifications - Array of notification objects
 * @property unreadCount - Number of unread notifications
 * @property loading - Boolean indicating if notifications are being fetched
 * @property error - Error message if notification fetching failed, or null
 * @property fetchNotifications - Function to fetch notifications with optional limit
 * @property markAsRead - Function to mark a single notification as read
 * @property markAllAsRead - Function to mark all notifications as read
 * @property lastFetched - Timestamp of when notifications were last fetched, or null
 */
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

/**
 * Create the notifications context with default values
 * These defaults are used before the provider is initialized
 */
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

/**
 * Cache expiration time in milliseconds (5 minutes)
 * This determines how long to use cached notifications before fetching fresh data
 */
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * NotificationsProvider component that wraps the application and provides notifications context
 * 
 * This provider handles:
 * - Fetching notifications from Supabase
 * - Caching notifications to reduce API calls
 * - Tracking read/unread status
 * - Updating notification state
 * 
 * @param props - Component props
 * @param props.children - Child components to be wrapped with the notifications context
 * @returns React component that provides notifications context to its children
 */
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for the list of notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // State for the count of unread notifications
  const [unreadCount, setUnreadCount] = useState(0);
  // Loading state while notifications are being fetched
  const [loading, setLoading] = useState(false);
  // Error state if notification fetching fails
  const [error, setError] = useState<string | null>(null);
  // Timestamp of when notifications were last fetched
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  // Get current user from auth context
  const { user } = useAuth();

  /**
   * Fetches notifications from Supabase for the current user
   * Implements caching to reduce API calls
   * 
   * @param limit - Maximum number of notifications to fetch (default: 50)
   * @returns Promise that resolves when notifications are fetched
   */
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

      // Query Supabase for notifications
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
      
      // Update state with fetched data
      setNotifications(data || []);
      setUnreadCount(unreadNotifications.length);
      setLastFetched(Date.now());
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching notifications:', error);
        setError(error.message || 'Failed to fetch notifications');
      } else {
        console.error('Unknown error fetching notifications:', error);
        setError('Failed to fetch notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, notifications.length, lastFetched]);

  /**
   * Marks a single notification as read
   * Uses optimistic updates for better UX
   * 
   * @param id - ID of the notification to mark as read
   * @returns Promise that resolves when the notification is marked as read
   */
  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      // Optimistic update - update UI immediately before API call completes
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Make API request to update in database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error marking notification as read:', error);
        // Don't call fetchNotifications to avoid circular dependencies
        console.error('Not refreshing notifications to avoid circular dependencies');
      } else {
        console.error('Unknown error marking notification as read:', error);
        // Don't call fetchNotifications to avoid circular dependencies
        console.error('Not refreshing notifications to avoid circular dependencies');
      }
    }
  }, [user?.id]);

  /**
   * Marks all notifications as read for the current user
   * Uses optimistic updates for better UX
   * 
   * @returns Promise that resolves when all notifications are marked as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      // Optimistic update - update UI immediately before API call completes
      setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })));
      setUnreadCount(0);

      // Make API request to update in database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error marking all notifications as read:', error);
        // Don't call fetchNotifications to avoid circular dependencies
        console.error('Not refreshing notifications to avoid circular dependencies');
      } else {
        console.error('Unknown error marking all notifications as read:', error);
        // Don't call fetchNotifications to avoid circular dependencies
        console.error('Not refreshing notifications to avoid circular dependencies');
      }
    }
  }, [user?.id]);

  /**
   * Effect for real-time notification subscription (currently disabled)
   * 
   * This would set up a real-time subscription to notification changes,
   * but is currently disabled to prevent excessive requests to Supabase.
   * Instead, we rely on manual refresh and polling.
   */
  useEffect(() => {
    // DISABLED - Causing too many requests
    console.log('Real-time notifications subscription is DISABLED to prevent excessive requests');
    
    // Original code:
    /*
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
          filter: `user_id=eq.${user?.id}`
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
            setNotifications(prev => {
              const updated = prev.map(notification => 
                notification.id === updatedNotification.id ? updatedNotification : notification
              );
              
              // Recalculate unread count here
              const newUnreadCount = updated.filter(n => !n.is_read).length;
              setUnreadCount(newUnreadCount);
              
              return updated;
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
    */
  }, []);

  /**
   * Effect for initial fetch of notifications
   * Only runs once when the component mounts and the user is available
   * Uses a slight delay to avoid race conditions during app startup
   */
  useEffect(() => {
    // Only fetch once when the component mounts and the user is available
    const alreadyFetched = !!lastFetched;
    
    if (user && !alreadyFetched) {
      console.log('Initial notifications fetch - will only happen once');
      
      // Use this timeout to delay the initial fetch slightly
      // This helps avoid race conditions during app startup
      const timeoutId = setTimeout(() => {
        if (user) {
          fetchNotifications();
        }
      }, 1000);
      
      // Clean up timeout on unmount
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id, lastFetched, fetchNotifications]);

  // Create the context value object with current state and functions
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

  // Provide notifications context to children components
  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

/**
 * Custom hook to access the notifications context throughout the application
 * Provides a convenient way to access notification state and functions
 * 
 * @returns The current notifications context value
 */
export const useNotifications = () => useContext(NotificationsContext); 