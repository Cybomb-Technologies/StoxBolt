import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationService from '@/services/notifications/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                setNotifications([]);
                return;
            }

            const data = await notificationService.getNotifications(params);
            setNotifications(data.notifications || []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Mark notification as read
    const markAsRead = useCallback(async (id) => {
        try {
            await notificationService.markAsRead(id);

            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === id ? { ...notif, isRead: true } : notif
                )
            );

            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
            throw err;
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();

            // Update local state
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );

            // Reset unread count
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
            throw err;
        }
    }, []);

    // Delete notification
    const deleteNotification = useCallback(async (id) => {
        try {
            await notificationService.deleteNotification(id);

            // Update local state
            const deletedNotif = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(notif => notif._id !== id));

            // Update unread count if deleted notification was unread
            if (deletedNotif && !deletedNotif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
            throw err;
        }
    }, [notifications]);

    // Refresh notifications and count
    const refresh = useCallback(async () => {
        await Promise.all([
            fetchNotifications(),
            fetchUnreadCount()
        ]);
    }, [fetchNotifications, fetchUnreadCount]);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Initial fetch
        refresh();

        // Set up polling
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [refresh, fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
