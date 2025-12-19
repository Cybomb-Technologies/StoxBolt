const express = require('express');
const router = express.Router();
const inAppNotificationController = require('../../controllers/inAppNotification/inAppNotificationController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/notifications/in-app
 * @desc    Get user notifications with pagination
 * @access  Private
 * @query   page, limit, unreadOnly, type
 */
router.get('/', inAppNotificationController.getUserNotifications);

/**
 * @route   GET /api/notifications/in-app/count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/count', inAppNotificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/in-app/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', inAppNotificationController.getNotificationById);

/**
 * @route   PUT /api/notifications/in-app/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', inAppNotificationController.markAsRead);

/**
 * @route   PUT /api/notifications/in-app/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', inAppNotificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/in-app/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', inAppNotificationController.deleteNotification);

module.exports = router;
