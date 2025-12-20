import React, { useEffect } from 'react';
import { CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationList = ({ onClose }) => {
    const {
        notifications,
        loading,
        error,
        unreadCount,
        fetchNotifications,
        markAllAsRead
    } = useNotifications();

    useEffect(() => {
        fetchNotifications({ limit: 10 });
    }, [fetchNotifications]);

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                    {unreadCount > 0 && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({unreadCount} unread)
                        </span>
                    )}
                </h3>

                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-150"
                    >
                        <CheckCheck className="w-4 h-4" />
                        <span>Mark all read</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto max-h-[500px]">
                {loading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <p className="text-red-600 text-sm">{error}</p>
                        <button
                            onClick={() => fetchNotifications({ limit: 10 })}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                            Try again
                        </button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <Inbox className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">No notifications yet</p>
                        <p className="text-gray-400 text-xs mt-1">
                            You'll see notifications here when there's new content
                        </p>
                    </div>
                ) : (
                    <div>
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification._id}
                                notification={notification}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-2">
                {notifications.length > 0 && (
                    <button
                        onClick={() => {
                            // TODO: Navigate to full notifications page
                            console.log('View all notifications');
                            onClose?.();
                        }}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
                    >
                        View all notifications
                    </button>
                )}
                <button
                    onClick={() => {
                        window.location.href = '/notification-settings';
                    }}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium py-2 hover:bg-gray-100 rounded transition-colors duration-150"
                >
                    ⚙️ Notification Settings
                </button>
            </div>
        </div>
    );
};

export default NotificationList;
