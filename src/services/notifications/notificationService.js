import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class NotificationService {
    /**
     * Get user notifications
     * @param {Object} params - Query parameters
     * @returns {Promise}
     */
    async getNotifications(params = {}) {
        try {
            const { page = 1, limit = 20, unreadOnly = false, type = null } = params;

            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                unreadOnly: unreadOnly.toString()
            });

            if (type) {
                queryParams.append('type', type);
            }

            const response = await axios.get(
                `${API_URL}/api/notifications/in-app?${queryParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw error;
        }
    }

    /**
     * Get unread notification count
     * @returns {Promise<Number>}
     */
    async getUnreadCount() {
        try {
            const response = await axios.get(
                `${API_URL}/api/notifications/in-app/count`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            return response.data.count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    /**
     * Get notification by ID
     * @param {String} id - Notification ID
     * @returns {Promise}
     */
    async getNotificationById(id) {
        try {
            const response = await axios.get(
                `${API_URL}/api/notifications/in-app/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            return response.data.notification;
        } catch (error) {
            console.error('Error getting notification:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     * @param {String} id - Notification ID
     * @returns {Promise}
     */
    async markAsRead(id) {
        try {
            const response = await axios.put(
                `${API_URL}/api/notifications/in-app/${id}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     * @returns {Promise}
     */
    async markAllAsRead() {
        try {
            const response = await axios.put(
                `${API_URL}/api/notifications/in-app/read-all`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    /**
     * Delete notification
     * @param {String} id - Notification ID
     * @returns {Promise}
     */
    async deleteNotification(id) {
        try {
            const response = await axios.delete(
                `${API_URL}/api/notifications/in-app/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }
}

export default new NotificationService();
