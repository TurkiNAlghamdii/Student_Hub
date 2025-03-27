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

const NotificationsBox = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const { user } = useAuth()
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
  const boxRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    // Fetch notifications when the dropdown is opened
    if (isOpen) {
      fetchNotifications(5) // Only fetch 5 for the dropdown
    }
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    // Update position when button position changes
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right
        })
      }
    }

    if (isOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition)
    }

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleMarkAsReadClick = async (id: string) => {
    await markAsRead(id)
  }

  const handleMarkAllAsReadClick = async () => {
    await markAllAsRead()
  }

  const handleViewAll = () => {
    setIsOpen(false)
    router.push('/notifications')
  }

  const handleKeyDownToggle = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  if (!user) return null

  return (
    <>
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
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">{unreadCount}</span>
        )}
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={boxRef}
          className="notifications-box" 
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            right: `${position.right}px`,
            zIndex: 999999
          }}
          role="dialog" 
          aria-label="Notifications"
          aria-modal="true"
        >
          <div className="notifications-header">
            <h3 className="notifications-title">Notifications</h3>
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

          <div className="notifications-content">
            {loading ? (
              <div className="notifications-loading">
                <LoadingSpinner size="medium" />
                <p className="mt-3 text-gray-400 text-sm">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="notifications-error">
                <ExclamationCircleIcon className="w-8 h-8 mx-auto mb-2" />
                <p>{error}</p>
                <button 
                  onClick={() => fetchNotifications(5)}
                  className="mt-3 px-4 py-1.5 bg-gradient-to-r from-emerald-600/20 to-emerald-700/30 hover:from-emerald-600/30 hover:to-emerald-700/40 border border-emerald-600/30 text-emerald-500 rounded-md text-sm flex items-center justify-center gap-2 mx-auto transition-all duration-300 hover:shadow-md hover:shadow-emerald-900/10"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  <span>Try again</span>
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-emerald-800/30">
                  <BellSlashIcon className="w-7 h-7 text-emerald-500/70" />
                </div>
                <p className="text-sm font-medium bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">No new notifications</p>
                <p className="text-xs text-gray-500 mt-1">We&apos;ll notify you when something happens</p>
              </div>
            ) : (
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