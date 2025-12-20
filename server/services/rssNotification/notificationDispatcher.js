const inAppNotificationService = require('../inAppNotification/inAppNotificationService');
// const webPushService = require('../webPush/webPushNotificationService');
// const emailService = require('../emailService');

class NotificationDispatcher {
    /**
     * Dispatch notification to all enabled channels
     * @param {ObjectId} userId - User ID
     * @param {Object} notificationData - Notification data
     * @param {Object} channels - Enabled channels
     * @returns {Promise<Object>}
     */
    async dispatch(userId, notificationData, channels = {}) {
        const results = {
            inApp: { success: false, error: null },
            webPush: { success: false, error: null },
            email: { success: false, error: null }
        };

        // Dispatch to in-app notifications
        if (channels.inApp) {
            try {
                await inAppNotificationService.createNotification(userId, notificationData);
                results.inApp.success = true;
                console.log(`✅ In-app notification dispatched to user ${userId}`);
            } catch (error) {
                results.inApp.error = error.message;
                console.error(`❌ In-app notification failed for user ${userId}:`, error.message);
            }
        }

        // Dispatch to web push (TODO: Implement in Phase 3)
        if (channels.webPush) {
            try {
                // await webPushService.sendNotification(userId, notificationData);
                // results.webPush.success = true;
                console.log(`⏭️ Web push notification skipped (not implemented yet)`);
            } catch (error) {
                results.webPush.error = error.message;
                console.error(`❌ Web push notification failed for user ${userId}:`, error.message);
            }
        }

        // Dispatch to email (TODO: Implement in Phase 5)
        if (channels.email) {
            try {
                // await emailService.sendNotification(userId, notificationData);
                // results.email.success = true;
                console.log(`⏭️ Email notification skipped (not implemented yet)`);
            } catch (error) {
                results.email.error = error.message;
                console.error(`❌ Email notification failed for user ${userId}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Dispatch batch notification
     * @param {ObjectId} userId - User ID
     * @param {Array} posts - Array of posts
     * @param {Object} feedConfig - RSS feed configuration
     * @param {Object} channels - Enabled channels
     * @returns {Promise<Object>}
     */
    async dispatchBatch(userId, posts, feedConfig, channels = {}) {
        const batchData = {
            title: `${posts.length} new posts from ${feedConfig.brandName}`,
            message: `${posts.length} new articles available to read`,
            type: 'rss-new-post',
            metadata: {
                feedName: feedConfig.name,
                postCount: posts.length,
                posts: posts.map(p => ({
                    id: p._id,
                    title: p.title,
                    image: p.imageUrl
                }))
            }
        };

        return await this.dispatch(userId, batchData, channels);
    }

    /**
     * Dispatch to multiple users
     * @param {Array} userIds - Array of user IDs
     * @param {Object} notificationData - Notification data
     * @param {Object} channels - Enabled channels
     * @returns {Promise<Array>}
     */
    async dispatchToMultiple(userIds, notificationData, channels = {}) {
        const results = [];

        for (const userId of userIds) {
            try {
                const result = await this.dispatch(userId, notificationData, channels);
                results.push({ userId, ...result });
            } catch (error) {
                console.error(`Error dispatching to user ${userId}:`, error.message);
                results.push({
                    userId,
                    error: error.message
                });
            }
        }

        return results;
    }
}

module.exports = new NotificationDispatcher();
