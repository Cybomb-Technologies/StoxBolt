const express = require('express');
const router = express.Router();
const webPushController = require('../../controllers/webPush/webPushController');
const { authenticateToken } = require('../../middleware/authMiddleware');

/**
 * @route   POST /api/push/subscribe
 * @desc    Subscribe to web push notifications
 * @access  Public (can work without auth, but better with userId)
 */
router.post('/subscribe', webPushController.subscribe);

/**
 * @route   POST /api/push/unsubscribe
 * @desc    Unsubscribe from web push notifications
 * @access  Public
 */
router.post('/unsubscribe', webPushController.unsubscribe);

/**
 * @route   GET /api/push/vapid-public-key
 * @desc    Get VAPID public key for push subscription
 * @access  Public
 */
router.get('/vapid-public-key', webPushController.getVapidPublicKey);

/**
 * @route   GET /api/push/subscriptions
 * @desc    Get user's push subscriptions
 * @access  Private
 */
router.get('/subscriptions', authenticateToken, webPushController.getSubscriptions);

/**
 * @route   POST /api/push/test
 * @desc    Send test push notification
 * @access  Private
 */
router.post('/test', authenticateToken, webPushController.sendTestNotification);

module.exports = router;
