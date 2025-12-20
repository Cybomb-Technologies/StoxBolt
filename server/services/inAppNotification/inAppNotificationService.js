const Notification = require('../../models/inAppNotification/Notification');
const notificationConfig = require('../../config/notification/notificationConfig');

class InAppNotificationService {
    /**
     * Create a new in-app notification
     * @param {ObjectId} userId - User ID
     * @param {Object} data - Notification data
     * @returns {Promise<Notification>}
     */
    async createNotification(userId, data) {
        try {
            const notification = await Notification.create({
                userId,
                title: data.title,
                message: data.message,
                type: data.type || 'system',
                relatedId: data.relatedId,
                relatedModel: data.relatedModel || 'Post',
                metadata: data.metadata || {},
                channels: {
                    inApp: true,
                    webPush: data.channels?.webPush || false,
                    email: data.channels?.email || false
                }
            });
            // console.log(`✅ In-app notification created for user ${userId}: ${data.title}`);
            return notification;
        } catch (error) {
            console.error('Error creating in-app notification:', error);
            throw error;
        }
    }

    /**
     * Create RSS notification for a user
     * @param {ObjectId} userId - User ID
     * @param {Object} post - Post object
     * @param {Object} feedConfig - RSS feed configuration
     * @returns {Promise<Notification>}
     */
    async createRSSNotification(userId, post, feedConfig) {
        try {
            const notification = await Notification.createRSSNotification(userId, post, feedConfig);
            // console.log(`✅ RSS notification created for user ${userId}: ${post.title}`);
            return notification;
        } catch (error) {
            console.error('Error creating RSS notification:', error);
            throw error;
        }
    }

    /**
     * Get user's unread notification count
     * @param {ObjectId} userId - User ID
     * @returns {Promise<Number>}
     */
    async getUnreadCount(userId) {
        try {
            const count = await Notification.getUnreadCount(userId);
            return count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    /**
     * Get user notifications with pagination
     * @param {ObjectId} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getUserNotifications(userId, options = {}) {
        try {
            const notifications = await Notification.getUserNotifications(userId, options);
            return notifications;
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     * @param {ObjectId} notificationId - Notification ID
     * @param {ObjectId} userId - User ID (for verification)
     * @returns {Promise<Notification>}
     */
    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOne({
                _id: notificationId,
                userId: userId
            });

            if (!notification) {
                throw new Error('Notification not found');
            }

            await notification.markAsRead();
            // console.log(`✅ Notification ${notificationId} marked as read`);
            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {ObjectId} userId - User ID
     * @returns {Promise<Object>}
     */
    async markAllAsRead(userId) {
        try {
            const result = await Notification.markAllAsRead(userId);
            // console.log(`✅ All notifications marked as read for user ${userId}`);
            return result;
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     * @param {ObjectId} notificationId - Notification ID
     * @param {ObjectId} userId - User ID (for verification)
     * @returns {Promise<Boolean>}
     */
    async deleteNotification(notificationId, userId) {
        try {
            const result = await Notification.deleteOne({
                _id: notificationId,
                userId: userId
            });

            if (result.deletedCount === 0) {
                throw new Error('Notification not found');
            }
            // console.log(`✅ Notification ${notificationId} deleted`);
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Clean up old notifications
     * @returns {Promise<Object>}
     */
    async cleanupOldNotifications() {
        try {
            const { deleteReadAfterDays, deleteUnreadAfterDays } = notificationConfig.cleanup;

            const readCutoff = new Date(Date.now() - deleteReadAfterDays * 24 * 60 * 60 * 1000);
            const unreadCutoff = new Date(Date.now() - deleteUnreadAfterDays * 24 * 60 * 60 * 1000);

            // Delete old read notifications
            const readResult = await Notification.deleteMany({
                isRead: true,
                createdAt: { $lt: readCutoff }
            });

            // Delete very old unread notifications
            const unreadResult = await Notification.deleteMany({
                isRead: false,
                createdAt: { $lt: unreadCutoff }
            });

            // console.log(`✅ Cleanup: Deleted ${readResult.deletedCount} read and ${unreadResult.deletedCount} unread notifications`);

            return {
                deletedRead: readResult.deletedCount,
                deletedUnread: unreadResult.deletedCount
            };
        } catch (error) {
            console.error('Error cleaning up notifications:', error);
            throw error;
        }
    }

    /**
     * Check if user should receive notification (throttling)
     * @param {ObjectId} userId - User ID
     * @returns {Promise<Boolean>}
     */
    async shouldNotifyUser(userId) {
        try {
            if (!notificationConfig.throttling.enabled) {
                return true;
            }

            const { maxNotificationsPerHour, maxNotificationsPerDay } = notificationConfig.throttling;

            // Check hourly limit
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const hourlyCount = await Notification.countDocuments({
                userId: userId,
                createdAt: { $gte: hourAgo }
            });

            if (hourlyCount >= maxNotificationsPerHour) {
                console.log(`⚠️ User ${userId} exceeded hourly notification limit`);
                return false;
            }

            // Check daily limit
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const dailyCount = await Notification.countDocuments({
                userId: userId,
                createdAt: { $gte: dayAgo }
            });

            if (dailyCount >= maxNotificationsPerDay) {
                console.log(`⚠️ User ${userId} exceeded daily notification limit`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking throttling:', error);
            return true; // Allow notification on error
        }
    }
}

module.exports = new InAppNotificationService();
