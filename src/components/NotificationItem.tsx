import { useRouter } from 'next/navigation';
import { 
  CheckIcon, 
  ArrowTopRightOnSquareIcon, 
  DocumentIcon,
  CalendarIcon,
  MegaphoneIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

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
  const notificationType = type || getNotificationType(title);

  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead(id);
    }
    if (link) {
      router.push(link);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

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
      className={`notification-item ${!isRead ? 'unread' : ''}`} 
      data-type={notificationType}
      onClick={link ? handleClick : undefined}
      onKeyDown={link ? handleKeyDown : undefined}
      tabIndex={link ? 0 : -1}
      role={link ? 'button' : 'listitem'}
      aria-label={`${title}${!isRead ? ', unread' : ''}`}
    >
      <div className="notification-content">
        <div className="flex items-start space-x-3">
          <div className="notification-icon-container mt-0.5">
            {getNotificationIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="notification-title">{title}</h3>
            <p className="notification-message">{message}</p>
            <span className="notification-time">{formatDate(createdAt)}</span>
          </div>
          <div className="notification-actions flex items-center gap-2 ml-2">
            {!isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(id);
                }}
                className="notification-read-btn"
                aria-label="Mark as read"
              >
                <CheckIcon className="action-icon" />
              </button>
            )}
            {link && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
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