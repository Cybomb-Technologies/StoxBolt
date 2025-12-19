import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from '@/utils/dateUtils';

const NotificationItem = ({ notification, onClose }) => {
    const navigate = useNavigate();
    const { markAsRead, deleteNotification } = useNotifications();

    const handleClick = async () => {
        try {
            // Mark as read if unread
            if (!notification.isRead) {
                await markAsRead(notification._id);
            }

            // Navigate to related content
            if (notification.metadata?.postLink) {
                navigate(notification.metadata.postLink);
                onClose?.();
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        try {
            await deleteNotification(notification._id);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = () => {
        switch (notification.type) {
            case 'rss-new-post':
                return '📰';
            case 'create-post':
                return '📝';
            case 'create-category':
                return '📁';
            case 'admin-post':
                return '👤';
            default:
                return '🔔';
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`
        relative p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150
        ${!notification.isRead ? 'bg-blue-50' : 'bg-white'}
      `}
        >
            {/* Unread Indicator */}
            {!notification.isRead && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
            )}

            <div className="flex items-start gap-3 ml-4">
                {/* Icon/Image */}
                <div className="flex-shrink-0">
                    {notification.metadata?.postImage ? (
                        <img
                            src={notification.metadata.postImage}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl">
                            {getNotificationIcon()}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                                {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {notification.message}
                            </p>

                            {/* Metadata */}
                            {notification.metadata?.feedName && (
                                <p className="text-xs text-gray-500 mt-1">
                                    From: {notification.metadata.feedName}
                                </p>
                            )}

                            {notification.metadata?.postCategory && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                                    {notification.metadata.postCategory}
                                </span>
                            )}
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={handleDelete}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-150"
                            aria-label="Delete notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>{formatDistanceToNow(notification.createdAt)}</span>
                        {notification.metadata?.postLink && (
                            <ExternalLink className="w-3 h-3" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationItem;
