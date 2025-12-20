const webPushService = require('../../services/webPush/webPushNotificationService');

class WebPushController {
    /**
     * Subscribe to web push notifications
     * POST /api/push/subscribe
     */
    async subscribe(req, res) {
        try {
            const { subscription } = req.body;
            const userId = req.user?._id; // From auth middleware (optional)

            if (!subscription || !subscription.endpoint || !subscription.keys) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid subscription object'
                });
            }

            const pushSubscription = await webPushService.subscribe(subscription, userId);

            res.status(201).json({
                success: true,
                message: 'Successfully subscribed to push notifications',
                subscription: {
                    id: pushSubscription._id,
                    endpoint: pushSubscription.endpoint
                }
            });
        } catch (error) {
            console.error('Error subscribing to push:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to subscribe to push notifications',
                error: error.message
            });
        }
    }

    /**
     * Unsubscribe from web push notifications
     * POST /api/push/unsubscribe
     */
    async unsubscribe(req, res) {
        try {
            const { endpoint } = req.body;

            if (!endpoint) {
                return res.status(400).json({
                    success: false,
                    message: 'Endpoint is required'
                });
            }

            const result = await webPushService.unsubscribe(endpoint);

            if (result) {
                res.status(200).json({
                    success: true,
                    message: 'Successfully unsubscribed from push notifications'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
            }
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unsubscribe from push notifications',
                error: error.message
            });
        }
    }

    /**
     * Get user's push subscriptions
     * GET /api/push/subscriptions
     */
    async getSubscriptions(req, res) {
        try {
            const userId = req.user._id;
            const subscriptions = await webPushService.getUserSubscriptions(userId);

            res.status(200).json({
                success: true,
                count: subscriptions.length,
                subscriptions: subscriptions.map(sub => ({
                    id: sub._id,
                    endpoint: sub.endpoint,
                    createdAt: sub.createdAt
                }))
            });
        } catch (error) {
            console.error('Error getting subscriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get subscriptions',
                error: error.message
            });
        }
    }

    /**
     * Send test push notification
     * POST /api/push/test
     */
    async sendTestNotification(req, res) {
        try {
            const userId = req.user._id;
            const result = await webPushService.sendTestNotification(userId);

            res.status(200).json({
                success: true,
                message: 'Test notification sent',
                result
            });
        } catch (error) {
            console.error('Error sending test notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send test notification',
                error: error.message
            });
        }
    }

    /**
     * Get VAPID public key
     * GET /api/push/vapid-public-key
     */
    async getVapidPublicKey(req, res) {
        try {
            const notificationConfig = require('../../config/notification/notificationConfig');
            const publicKey = notificationConfig.channels.webPush.vapidKeys.publicKey;

            if (!publicKey) {
                return res.status(500).json({
                    success: false,
                    message: 'VAPID public key not configured'
                });
            }

            res.status(200).json({
                success: true,
                publicKey
            });
        } catch (error) {
            console.error('Error getting VAPID public key:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get VAPID public key',
                error: error.message
            });
        }
    }
}

module.exports = new WebPushController();
