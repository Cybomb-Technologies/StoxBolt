const inAppNotificationService = require('../../services/inAppNotification/inAppNotificationService');

class InAppNotificationController {
    /**
     * Get user notifications with pagination
     * GET /api/notifications/in-app
     */
    async getUserNotifications(req, res) {
        try {
            const userId = req.user.userId; // Changed from req.user._id to req.user.userId
            const {
                page = 1,
                limit = 20,
                unreadOnly = false,
                type = null
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                unreadOnly: unreadOnly === 'true',
                type: type
            };

            const notifications = await inAppNotificationService.getUserNotifications(userId, options);

            res.status(200).json({
                success: true,
                count: notifications.length,
                page: options.page,
                limit: options.limit,
                notifications
            });
        } catch (error) {
            console.error('Error getting user notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notifications',
                error: error.message
            });
        }
    }

    /**
     * Get unread notification count
     * GET /api/notifications/in-app/count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.userId;
            const count = await inAppNotificationService.getUnreadCount(userId);

            res.status(200).json({
                success: true,
                count
            });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count',
                error: error.message
            });
        }
    }

    /**
     * Mark notification as read
     * PUT /api/notifications/in-app/:id/read
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;

            const notification = await inAppNotificationService.markAsRead(id, userId);

            res.status(200).json({
                success: true,
                message: 'Notification marked as read',
                notification
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(error.message === 'Notification not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to mark notification as read',
                error: error.message
            });
        }
    }

    /**
     * Mark all notifications as read
     * PUT /api/notifications/in-app/read-all
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.userId;
            const result = await inAppNotificationService.markAllAsRead(userId);

            res.status(200).json({
                success: true,
                message: 'All notifications marked as read',
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            console.error('Error marking all as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all as read',
                error: error.message
            });
        }
    }

    /**
     * Delete notification
     * DELETE /api/notifications/in-app/:id
     */
    async deleteNotification(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;

            await inAppNotificationService.deleteNotification(id, userId);

            res.status(200).json({
                success: true,
                message: 'Notification deleted'
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(error.message === 'Notification not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to delete notification',
                error: error.message
            });
        }
    }

    /**
     * Get notification by ID
     * GET /api/notifications/in-app/:id
     */
    async getNotificationById(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;

            const Notification = require('../../models/inAppNotification/Notification');
            const notification = await Notification.findOne({
                _id: id,
                userId: userId
            }).populate('relatedId');

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.status(200).json({
                success: true,
                notification
            });
        } catch (error) {
            console.error('Error getting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notification',
                error: error.message
            });
        }
    }
}

module.exports = new InAppNotificationController();
