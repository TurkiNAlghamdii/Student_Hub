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

export default function NotificationsPage() {
  const { user, loading: isLoading } = useAuth()
  const { 
    notifications, 
    unreadCount, 
    loading: notificationsLoading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications()
  const router = useRouter()
  
  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])
  
  // Fetch all notifications when the page loads
  useEffect(() => {
    if (user) {
      // Fetch all notifications (default limit is 50)
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  const handleMarkAsReadClick = async (id: string) => {
    await markAsRead(id)
  }

  const handleMarkAllAsReadClick = async () => {
    await markAllAsRead()
  }

  const handleRetry = () => {
    fetchNotifications()
  }

  if (isLoading) {
    return (
      <div className="full-page-loading">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-400">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="notifications-page">
      <Navbar />
      <div className="notifications-container">
        <div className="notifications-panel">
          <div className="notifications-header">
            <div className="flex items-center">
              <h1 className="page-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="ml-3 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>
            
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
              <p className="notification-count">
                <span className="text-emerald-500">{notifications.length}</span> {notifications.length === 1 ? 'notification' : 'notifications'}
                {unreadCount > 0 && <span className="ml-2 text-emerald-500">• {unreadCount} unread</span>}
              </p>
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