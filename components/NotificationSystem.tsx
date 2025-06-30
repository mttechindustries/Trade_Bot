import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { tradingStore } from '../store/tradingStore';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from './icons/InterfaceIcons';
import { formatTime } from '../services/timeService';

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000); // Auto dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-success/20 border-success/50';
      case 'error':
        return 'bg-danger/20 border-danger/50';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50';
      default:
        return 'bg-blue-500/20 border-blue-500/50';
    }
  };

  return (
    <div className={`${getBgColor()} border rounded-lg p-4 mb-3 shadow-lg backdrop-blur-sm animate-slide-in`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-semibold text-gray-100">{notification.title}</h4>
          <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {formatTime(new Date(notification.timestamp), true)}
          </p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotificationAdded = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications
    };

    tradingStore.on('notificationAdded', handleNotificationAdded);

    return () => {
      tradingStore.off('notificationAdded', handleNotificationAdded);
    };
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-w-sm">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
};

export default NotificationSystem;
