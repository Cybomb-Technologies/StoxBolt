const webpush = require('web-push');
const PushSubscription = require('../../models/webPush/PushSubscription');
const notificationConfig = require('../../config/notification/notificationConfig');

class WebPushNotificationService {
    constructor() {
        this.setupVapid();
    }

    /**
     * Setup VAPID keys for web push
     */
    setupVapid() {
        const { publicKey, privateKey, subject } = notificationConfig.channels.webPush.vapidKeys;

        if (!publicKey || !privateKey) {
            console.warn('⚠️ VAPID keys not configured. Web push notifications will not work.');
            console.warn('Generate keys with: npx web-push generate-vapid-keys');
            return;
        }

        webpush.setVapidDetails(subject, publicKey, privateKey);
        // console.log('✅ VAPID keys configured for web push');
    }

    /**
     * Subscribe user to web push
     * @param {Object} subscription - Push subscription object from browser
     * @param {ObjectId} userId - User ID
     * @returns {Promise<PushSubscription>}
     */
    async subscribe(subscription, userId) {
        try {
            // Check if subscription already exists
            const existing = await PushSubscription.findOne({
                endpoint: subscription.endpoint
            });

            if (existing) {
                // Update user ID if needed
                if (userId && existing.userId?.toString() !== userId.toString()) {
                    existing.userId = userId;
                    await existing.save();
                }
                // console.log(`✅ Push subscription updated for user ${userId}`);
                return existing;
            }

            // Create new subscription
            const newSubscription = await PushSubscription.create({
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                userId: userId
            });

            // console.log(`✅ New push subscription created for user ${userId}`);
            return newSubscription;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe user from web push
     * @param {String} endpoint - Push subscription endpoint
     * @returns {Promise<Boolean>}
     */
    async unsubscribe(endpoint) {
        try {
            const result = await PushSubscription.deleteOne({ endpoint });

            if (result.deletedCount > 0) {
                // console.log(`✅ Push subscription removed: ${endpoint}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            throw error;
        }
    }

    /**
     * Send push notification to a user
     * @param {ObjectId} userId - User ID
     * @param {Object} payload - Notification payload
     * @returns {Promise<Object>}
     */
    async sendPushToUser(userId, payload) {
        try {
            // Get user's push subscriptions
            const subscriptions = await PushSubscription.find({ userId });

            if (subscriptions.length === 0) {
                // console.log(`No push subscriptions found for user ${userId}`);
                return { success: false, sent: 0, failed: 0 };
            }

            const results = {
                success: true,
                sent: 0,
                failed: 0,
                errors: []
            };

            // Send to all user's subscriptions
            for (const subscription of subscriptions) {
                try {
                    await this.sendPush(subscription, payload);
                    results.sent++;
                } catch (error) {
                    console.error(`Failed to send push to ${subscription.endpoint}:`, error.message);
                    results.failed++;
                    results.errors.push({
                        endpoint: subscription.endpoint,
                        error: error.message
                    });

                    // Remove invalid subscriptions
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await this.unsubscribe(subscription.endpoint);
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Error sending push to user:', error);
            throw error;
        }
    }

    /**
     * Send push notification to a subscription
     * @param {Object} subscription - Push subscription object
     * @param {Object} payload - Notification payload
     * @returns {Promise}
     */
    async sendPush(subscription, payload) {
        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
        };

        const options = {
            TTL: notificationConfig.channels.webPush.ttl,
            urgency: notificationConfig.channels.webPush.urgency
        };

        return webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload),
            options
        );
    }

    /**
     * Send RSS notification via push
     * @param {ObjectId} userId - User ID
     * @param {Object} post - Post object
     * @param {Object} feedConfig - RSS feed configuration
     * @returns {Promise<Object>}
     */
    async sendRSSNotification(userId, post, feedConfig) {
        const payload = {
            title: `📰 ${feedConfig.brandName}`,
            body: post.shortTitle || post.title,
            icon: post.imageUrl || '/images/logo.png',
            badge: '/images/notification-badge.png',
            data: {
                url: `/post/${post._id}`,
                postId: post._id,
                feedName: feedConfig.name,
                type: 'rss-new-post'
            },
            actions: [
                {
                    action: 'view',
                    title: 'View Post'
                },
                {
                    action: 'close',
                    title: 'Dismiss'
                }
            ]
        };

        return await this.sendPushToUser(userId, payload);
    }

    /**
     * Send batch notification via push
     * @param {ObjectId} userId - User ID
     * @param {Array} posts - Array of posts
     * @param {Object} feedConfig - RSS feed configuration
     * @returns {Promise<Object>}
     */
    async sendBatchNotification(userId, posts, feedConfig) {
        const payload = {
            title: `📰 ${feedConfig.brandName} (${posts.length} new)`,
            body: `${posts.length} new articles available to read`,
            icon: '/images/logo.png',
            badge: '/images/notification-badge.png',
            data: {
                url: `/category/${posts[0].category?.slug || 'all'}`,
                feedName: feedConfig.name,
                postCount: posts.length,
                type: 'rss-batch'
            },
            actions: [
                {
                    action: 'view',
                    title: 'View Articles'
                },
                {
                    action: 'close',
                    title: 'Dismiss'
                }
            ]
        };

        return await this.sendPushToUser(userId, payload);
    }

    /**
     * Get user's push subscriptions
     * @param {ObjectId} userId - User ID
     * @returns {Promise<Array>}
     */
    async getUserSubscriptions(userId) {
        try {
            const subscriptions = await PushSubscription.find({ userId });
            return subscriptions;
        } catch (error) {
            console.error('Error getting user subscriptions:', error);
            throw error;
        }
    }

    /**
     * Clean up invalid/expired subscriptions
     * @returns {Promise<Number>}
     */
    async cleanupInvalidSubscriptions() {
        try {
            // This would require testing each subscription
            // For now, we rely on automatic cleanup when sends fail
            // console.log('Push subscription cleanup completed');
            return 0;
        } catch (error) {
            console.error('Error cleaning up subscriptions:', error);
            throw error;
        }
    }

    /**
     * Test push notification
     * @param {ObjectId} userId - User ID
     * @returns {Promise<Object>}
     */
    async sendTestNotification(userId) {
        const payload = {
            title: '🔔 Test Notification',
            body: 'This is a test notification from StoxBolt',
            icon: '/images/logo.png',
            badge: '/images/notification-badge.png',
            data: {
                url: '/',
                type: 'test'
            }
        };

        return await this.sendPushToUser(userId, payload);
    }
}

module.exports = new WebPushNotificationService();
