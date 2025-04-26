/**
 * Notifications Page Component
 * 
 * This client-side component displays user notifications from various system events.
 * It provides a centralized interface for users to view, manage, and interact with
 * their notifications, such as course updates, announcements, and system messages.
 * 
 * Key features:
 * - Authentication-protected access
 * - Real-time notification display
 * - Mark as read functionality (individual and bulk)
 * - Error handling with retry options
 * - Empty state handling
 * - Loading states with visual feedback
 * 
 * The component integrates with the application's theme system through CSS classes
 * that adapt to both light and dark modes via the root element class, ensuring
 * consistent styling across the application.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ArrowPathIcon,
  InboxIcon
} from '@heroicons/react/24/outline'
import NotificationItem from '@/components/NotificationItem'
import './notifications.css'

/**
 * Notifications Page Component
 * 
 * Displays and manages user notifications with features for viewing, marking as read,
 * and handling various states (loading, error, empty).
 * 
 * @returns The rendered notifications page with appropriate state handling
 */
export default function NotificationsPage() {
  // Authentication state from AuthContext
  const { user, loading: isLoading } = useAuth()
  
  // Notifications state and methods from NotificationsContext
  const { 
    notifications,              // Array of user notifications
    unreadCount,               // Count of unread notifications
    loading: notificationsLoading, // Loading state for notifications
    error,                     // Error state if fetching fails
    fetchNotifications,        // Method to fetch notifications
    markAsRead,                // Method to mark a single notification as read
    markAllAsRead              // Method to mark all notifications as read
  } = useNotifications()
  
  // Router for navigation
  const router = useRouter()
  
  /**
   * Authentication check effect
   * 
   * Redirects unauthenticated users to the login page once the auth state is confirmed.
   * This ensures the notifications page is only accessible to authenticated users.
   */
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])
  
  /**
   * Notifications initialization effect
   * 
   * Note: Automatic fetching is disabled to prevent request loops.
   * Instead, users can manually refresh notifications using the refresh button.
   * This approach prevents excessive API calls while still providing up-to-date data.
   */
  useEffect(() => {
    // We'll disable automatic fetching to prevent request loops
    console.log('Notifications page loaded - manual fetch only');
    // The user can click the "Try again" button if needed
  }, []);  // Empty dependency array - only runs once

  /**
   * Marks a single notification as read
   * Updates the notification state through the NotificationsContext
   * 
   * @param id - The ID of the notification to mark as read
   */
  const handleMarkAsReadClick = async (id: string) => {
    await markAsRead(id)
  }

  /**
   * Marks all notifications as read
   * Updates all notifications through the NotificationsContext
   */
  const handleMarkAllAsReadClick = async () => {
    await markAllAsRead()
  }

  /**
   * Manually triggers a notifications refresh
   * Used for the refresh button and error retry functionality
   */
  const handleRetry = () => {
    if (user) {
      console.log('Manual fetch triggered');
      fetchNotifications();
    }
  }

  /**
   * Loading state display while authentication state is being determined
   * Shows a full-page loading spinner until we know if the user is authenticated
   */
  if (isLoading) {
    return (
      <div className="full-page-loading">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-400">Loading notifications...</p>
      </div>
    )
  }

  /**
   * Main notifications page render
   * Displays the notifications interface with appropriate state handling
   * The component uses CSS classes that adapt to both light and dark themes
   */
  return (
    <div className="notifications-page">
      <Navbar />
      {/* Main content container */}
      <div className="notifications-container">
        {/* Notifications panel with header and content */}
        <div className="notifications-panel">
          {/* Header with title and action buttons */}
          <div className="notifications-header">
            {/* Title area with unread count badge */}
            <div className="flex items-center">
              <h1 className="page-title">Notifications</h1>
              {/* Conditional unread count badge */}
              {unreadCount > 0 && (
                <span className="ml-3 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>
            
            {/* Action buttons container */}
            <div className="flex items-center gap-2">
              {/* Refresh button - always visible */}
              <button
                onClick={handleRetry}
                className="refresh-button px-2 py-2 text-gray-400 hover:text-emerald-500 rounded-lg transition-colors"
                aria-label="Refresh notifications"
                title="Refresh notifications"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              
              {/* Mark all as read button - only visible when there are unread notifications */}
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsReadClick}
                  className="mark-all-read-button"
                  aria-label="Mark all as read"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          </div>

          {/* Conditional content rendering based on state */}
          {/* Loading state while fetching notifications */}
          {notificationsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-400 text-sm">Loading your notifications...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <ExclamationCircleIcon className="w-10 h-10 mx-auto mb-3" />
              <p className="text-lg">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-600/20 to-emerald-700/30 hover:from-emerald-600/30 hover:to-emerald-700/40 border border-emerald-600/30 text-emerald-500 rounded-md flex items-center gap-2 mx-auto transition-all duration-300 hover:shadow-md"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Try again</span>
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-emerald-800/30">
                <InboxIcon className="w-9 h-9 text-emerald-500/70" />
              </div>
              <h2 className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Your notification center is empty</h2>
              <p className="text-gray-400">When you receive notifications about course updates, file uploads, or announcements, they&apos;ll appear here.</p>
            </div>
          ) : (
            <div className="notifications-list-container">
              {/* Notification count summary */}
              <p className="notification-count">
                <span className="text-emerald-500">{notifications.length}</span> {notifications.length === 1 ? 'notification' : 'notifications'}
                {unreadCount > 0 && <span className="ml-2 text-emerald-500">• {unreadCount} unread</span>}
              </p>
              {/* Scrollable list of notification items */}
              <div className="notifications-list scrollbar-custom">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    id={notification.id}
                    title={notification.title}
                    message={notification.message}
                    isRead={notification.is_read}
                    createdAt={notification.created_at}
                    link={notification.link}
                    type={notification.type}
                    onMarkAsRead={handleMarkAsReadClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}