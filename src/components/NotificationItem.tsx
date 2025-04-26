/**
 * NotificationItem Component
 *
 * This component displays a single notification item with appropriate styling,
 * icons based on notification type, and interactive elements for marking as read
 * or navigating to related content. It's designed to work within the NotificationsBox
 * component as part of the application's notification system.
 *
 * Key features:
 * - Dynamic icon selection based on notification type
 * - Relative time formatting (e.g., "2h ago")
 * - Interactive elements for user actions
 * - Accessibility support with appropriate ARIA attributes
 * - Visual distinction between read and unread notifications
 * - Theme-aware styling
 */

import { useRouter } from 'next/navigation';
import { 
  CheckIcon, 
  ArrowTopRightOnSquareIcon, 
  DocumentIcon,
  CalendarIcon,
  MegaphoneIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

/**
 * Props interface for the NotificationItem component
 * 
 * @property id - Unique identifier for the notification
 * @property title - Title or heading of the notification
 * @property message - Main content/body of the notification
 * @property isRead - Boolean indicating whether the notification has been read
 * @property createdAt - ISO date string when the notification was created
 * @property link - Optional URL to navigate to when clicking the notification
 * @property type - Optional explicit type of notification (overrides automatic detection)
 * @property onMarkAsRead - Callback function to mark notification as read
 */
interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  type?: string;
  onMarkAsRead: (id: string) => void;
}

/**
 * Formats a date string into a human-readable relative time
 * 
 * Converts timestamps into user-friendly formats like "Just now", "5m ago",
 * "2h ago", "3d ago", or a formatted date for older notifications.
 * 
 * @param dateString - ISO date string to format
 * @returns Formatted relative time string
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
};

/**
 * Determines notification type based on keywords in the title
 * 
 * Analyzes the notification title to categorize it into one of several
 * predefined types, which affects the icon displayed and potentially other styling.
 * 
 * @param title - The notification title to analyze
 * @returns String identifier for the notification type
 */
const getNotificationType = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('file') || lowerTitle.includes('upload') || lowerTitle.includes('document')) {
    return 'file_upload';
  } else if (lowerTitle.includes('event') || lowerTitle.includes('schedule') || lowerTitle.includes('deadline')) {
    return 'event';
  } else if (lowerTitle.includes('announcement') || lowerTitle.includes('notice')) {
    return 'announcement';
  } else if (lowerTitle.includes('course') || lowerTitle.includes('class')) {
    return 'course_update';
  }
  
  return '';
};

/**
 * NotificationItem component implementation
 * 
 * Renders a single notification with appropriate styling, icons, and interactive elements.
 * 
 * @param props - Component props
 * @returns React component for a notification item
 */
const NotificationItem = ({
  id,
  title,
  message,
  isRead,
  createdAt,
  link,
  type,
  onMarkAsRead
}: NotificationItemProps) => {
  const router = useRouter();
  // Use provided type or detect it from the title
  const notificationType = type || getNotificationType(title);

  /**
   * Handles click events on the notification
   * Marks unread notifications as read and navigates to the link if provided
   */
  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead(id);
    }
    if (link) {
      router.push(link);
    }
  };

  /**
   * Handles keyboard navigation for accessibility
   * Allows users to activate the notification with Enter or Space keys
   * 
   * @param e - Keyboard event object
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  /**
   * Returns the appropriate icon based on notification type
   * Uses Heroicons components with consistent styling
   * 
   * @returns React element with the appropriate icon component
   */
  const getNotificationIcon = () => {
    switch(notificationType) {
      case 'file_upload':
        return <DocumentIcon className="w-5 h-5 text-emerald-500" />;
      case 'event':
        return <CalendarIcon className="w-5 h-5 text-emerald-500" />;
      case 'announcement':
        return <MegaphoneIcon className="w-5 h-5 text-emerald-500" />;
      case 'course_update':
        return <BookOpenIcon className="w-5 h-5 text-emerald-500" />;
      default:
        return <DocumentIcon className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div 
      // Apply base styles and special class for unread notifications
      className={`notification-item ${!isRead ? 'unread' : ''}`} 
      // Add data attribute for potential CSS targeting by notification type
      data-type={notificationType}
      // Only make clickable if there's a link to navigate to
      onClick={link ? handleClick : undefined}
      onKeyDown={link ? handleKeyDown : undefined}
      // Make focusable only if it's interactive
      tabIndex={link ? 0 : -1}
      // Appropriate ARIA role based on interactivity
      role={link ? 'button' : 'listitem'}
      // Accessible label including read status
      aria-label={`${title}${!isRead ? ', unread' : ''}`}
    >
      <div className="notification-content">
        <div className="flex items-start space-x-3">
          {/* Icon based on notification type */}
          <div className="notification-icon-container mt-0.5">
            {getNotificationIcon()}
          </div>
          {/* Notification text content */}
          <div className="flex-1 min-w-0">
            <h3 className="notification-title">{title}</h3>
            <p className="notification-message">{message}</p>
            <span className="notification-time">{formatDate(createdAt)}</span>
          </div>
          {/* Action buttons */}
          <div className="notification-actions flex items-center gap-2 ml-2">
            {/* Mark as read button - only shown for unread notifications */}
            {!isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering parent click
                  onMarkAsRead(id);
                }}
                className="notification-read-btn"
                aria-label="Mark as read"
              >
                <CheckIcon className="action-icon" />
              </button>
            )}
            {/* View details button - only shown if there's a link */}
            {link && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering parent click
                  router.push(link);
                }}
                className="notification-view-btn"
                aria-label="View details"
              >
                <span>View</span>
                <ArrowTopRightOnSquareIcon className="action-icon ml-1 w-3 h-3 inline" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem; 