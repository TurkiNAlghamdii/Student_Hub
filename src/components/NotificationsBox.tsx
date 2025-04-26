/**
 * NotificationsBox Component
 *
 * A dropdown notification center that displays recent notifications and provides
 * actions to interact with them. This component is typically rendered in the application
 * header and shows a badge with unread count when there are unread notifications.
 *
 * Key features:
 * - Displays recent notifications with appropriate styling and icons
 * - Shows unread notification count as a badge
 * - Provides actions to mark individual or all notifications as read
 * - Handles loading, error, and empty states
 * - Implements accessibility features including keyboard navigation
 * - Uses React Portal for proper stacking context
 * - Theme-aware styling that adapts to light/dark mode
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import { 
  BellIcon, 
  BellSlashIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import NotificationItem from './NotificationItem'
import LoadingSpinner from './LoadingSpinner/LoadingSpinner'
import '../app/notifications/notifications.css'

/**
 * NotificationsBox component implementation
 * 
 * @returns React component for the notifications dropdown
 */
const NotificationsBox = () => {
  // State for dropdown open/closed status
  const [isOpen, setIsOpen] = useState(false)
  // State for dropdown position (calculated based on button position)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  
  // Get current user from auth context
  const { user } = useAuth()
  
  // Get notifications data and methods from context
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications()
  
  const router = useRouter()
  
  // Refs for handling click outside and positioning
  const boxRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  /**
   * Effect for handling clicks outside the dropdown and keyboard events
   * Closes the dropdown when clicking outside or pressing ESC
   */
  useEffect(() => {
    // Close the dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Close the dropdown when ESC key is pressed
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        // Return focus to the toggle button for better accessibility
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    // Clean up event listeners on unmount or when dependencies change
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  /**
   * Effect that runs when the dropdown is opened
   * Note: We don't automatically fetch to prevent potential request loops
   * Users can manually refresh using the refresh button
   */
  useEffect(() => {
    // Fetch notifications when the dropdown is opened
    if (isOpen && user) {
      console.log('Dropdown opened - manual fetch only');
      // Don't automatically fetch - let user click "Try again" if needed
      // This prevents automatic loops of requests
    }
  }, [isOpen, user]);

  /**
   * Calculates the dropdown position based on the toggle button's position
   * Positions the dropdown below the button with appropriate spacing
   * 
   * @returns Object with top and right position values
   */
  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      return {
        top: rect.bottom + window.scrollY + 8, // 8px spacing below button
        right: window.innerWidth - rect.right  // Align with right edge of button
      }
    }
    return { top: 0, right: 0 } // Default fallback position
  }

  /**
   * Handles toggle button click
   * Calculates position and toggles the dropdown open/closed state
   */
  const handleToggle = () => {
    if (!isOpen) {
      // Calculate position before opening
      setPosition(calculatePosition())
    }
    setIsOpen(!isOpen)
  }

  /**
   * Effect to update dropdown position when window is resized or scrolled
   * Ensures the dropdown stays positioned correctly relative to the button
   */
  useEffect(() => {
    // Update position when window is resized or scrolled
    const updatePosition = () => {
      if (isOpen) {
        setPosition(calculatePosition())
      }
    }

    // Only add listeners when dropdown is open
    if (isOpen) {
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition)
    }

    // Clean up event listeners
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isOpen])

  /**
   * Marks a single notification as read
   * @param id - ID of the notification to mark as read
   */
  const handleMarkAsReadClick = async (id: string) => {
    await markAsRead(id)
  }

  /**
   * Marks all notifications as read
   */
  const handleMarkAllAsReadClick = async () => {
    await markAllAsRead()
  }

  /**
   * Navigates to the full notifications page
   * Closes the dropdown before navigation
   */
  const handleViewAll = () => {
    setIsOpen(false)
    router.push('/notifications')
  }

  /**
   * Handles keyboard events on the toggle button
   * Allows activation with Enter or Space keys for accessibility
   * 
   * @param e - Keyboard event object
   */
  const handleKeyDownToggle = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  /**
   * Manually fetches notifications when refresh button is clicked
   * Limits to 5 notifications for the dropdown view
   */
  const handleManualFetch = () => {
    if (user) {
      fetchNotifications(5); // Limit to 5 for the dropdown
    }
  }

  // Only render the component if a user is logged in
  if (!user) return null

  return (
    <>
      {/* Notification bell button with unread count badge */}
      <button
        ref={buttonRef}
        className="notification-toggle-btn"
        onClick={handleToggle}
        onKeyDown={handleKeyDownToggle}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        tabIndex={0}
      >
        <BellIcon className="h-6 w-6 text-emerald-500" />
        {/* Badge showing unread count - only displayed when there are unread notifications */}
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">{unreadCount}</span>
        )}
      </button>

      {/* Render the dropdown using Portal when open (client-side only) */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={boxRef}
          className="notifications-box" 
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            right: `${position.right}px`,
            zIndex: 999999 // High z-index to ensure it appears above other content
          }}
          role="dialog" 
          aria-label="Notifications"
          aria-modal="true"
        >
          {/* Header with title and action buttons */}
          <div className="notifications-header">
            <h3 className="notifications-title">Notifications</h3>
            <div className="flex items-center gap-2">
              {/* Refresh button - always visible */}
              <button
                onClick={handleManualFetch}
                className="p-1.5 text-gray-400 hover:text-emerald-500 rounded-full transition-colors"
                aria-label="Refresh notifications"
                title="Refresh notifications"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              
              {/* Mark all as read button - only visible when there are unread notifications */}
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsReadClick}
                  className="mark-all-read-button"
                  aria-label="Mark all as read"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          </div>

          {/* Main content area with conditional rendering based on state */}
          <div className="notifications-content">
            {/* Loading state */}
            {loading ? (
              <div className="notifications-loading">
                <LoadingSpinner size="medium" />
                <p className="mt-3 text-gray-400 text-sm">Loading notifications...</p>
              </div>
            ) : error ? (
              // Error state with retry button
              <div className="notifications-error">
                <ExclamationCircleIcon className="w-8 h-8 mx-auto mb-2" />
                <p>{error}</p>
                <button 
                  onClick={handleManualFetch}
                  className="mt-3 px-4 py-1.5 bg-gradient-to-r from-emerald-600/20 to-emerald-700/30 hover:from-emerald-600/30 hover:to-emerald-700/40 border border-emerald-600/30 text-emerald-500 rounded-md text-sm flex items-center justify-center gap-2 mx-auto transition-all duration-300 hover:shadow-md hover:shadow-emerald-900/10"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  <span>Try again</span>
                </button>
              </div>
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="notifications-empty">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-emerald-800/30">
                  <BellSlashIcon className="w-7 h-7 text-emerald-500/70" />
                </div>
                <p className="text-sm font-medium bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">No new notifications</p>
                <p className="text-xs text-gray-500 mt-1">We&apos;ll notify you when something happens</p>
              </div>
            ) : (
              // List of notifications - limited to 5 items
              <div className="notifications-list">
                {notifications.slice(0, 5).map((notification) => (
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
            )}
          </div>

          {/* Footer with link to full notifications page */}
          <div className="notifications-footer">
            <button 
              onClick={handleViewAll}
              className="view-all-button"
              aria-label="View all notifications"
            >
              View all notifications
              <ArrowRightIcon className="h-4 w-4 ml-2 inline" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default NotificationsBox