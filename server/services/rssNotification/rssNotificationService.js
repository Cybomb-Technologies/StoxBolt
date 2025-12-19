const RSSNotificationSubscription = require('../../models/rssNotification/RSSNotificationSubscription');
const inAppNotificationService = require('../inAppNotification/inAppNotificationService');
const webPushService = require('../webPush/webPushNotificationService');
const notificationConfig = require('../../config/notification/notificationConfig');

class RSSNotificationService {
    /**
     * Notify users about new RSS posts
     * @param {Array} savedPosts - Array of newly saved posts
     * @param {Object} feedConfig - RSS feed configuration
     * @returns {Promise<Object>}
     */
    async notifyNewPosts(savedPosts, feedConfig) {
        try {
            if (!savedPosts || savedPosts.length === 0) {
                console.log('No new posts to notify about');
                return { notified: 0, skipped: 0 };
            }

            console.log(`📢 Processing notifications for ${savedPosts.length} new posts from ${feedConfig.name}`);

            let notifiedCount = 0;
            let skippedCount = 0;

            for (const post of savedPosts) {
                try {
                    const result = await this.notifySinglePost(post, feedConfig);
                    notifiedCount += result.notified;
                    skippedCount += result.skipped;
                } catch (error) {
                    console.error(`Error notifying for post ${post._id}:`, error.message);
                    skippedCount++;
                }
            }

            console.log(`✅ Notification complete: ${notifiedCount} sent, ${skippedCount} skipped`);

            return {
                notified: notifiedCount,
                skipped: skippedCount,
                total: savedPosts.length
            };
        } catch (error) {
            console.error('Error in notifyNewPosts:', error);
            throw error;
        }
    }

    /**
     * Notify users about a single post
     * @param {Object} post - Post object
     * @param {Object} feedConfig - RSS feed configuration
     * @returns {Promise<Object>}
     */
    async notifySinglePost(post, feedConfig) {
        try {
            // Populate category if needed
            if (post.category && !post.category.name) {
                await post.populate('category');
            }

            // Get subscribed users
            const subscribedUsers = await this.getSubscribedUsers(feedConfig._id, post.category?._id);

            if (subscribedUsers.length === 0) {
                console.log(`No subscribers for post: ${post.title}`);
                return { notified: 0, skipped: 0 };
            }

            console.log(`Found ${subscribedUsers.length} subscribers for post: ${post.title}`);

            let notifiedCount = 0;
            let skippedCount = 0;

            for (const subscription of subscribedUsers) {
                try {
                    // Check throttling
                    const shouldNotify = await inAppNotificationService.shouldNotifyUser(subscription.userId._id);

                    if (!shouldNotify) {
                        console.log(`⚠️ Skipping notification for user ${subscription.userId._id} (throttled)`);
                        skippedCount++;
                        continue;
                    }

                    // Create in-app notification if enabled
                    if (subscription.channels.inApp) {
                        await inAppNotificationService.createRSSNotification(
                            subscription.userId._id,
                            post,
                            feedConfig
                        );
                        notifiedCount++;
                    }

                    // Send web push notification if enabled
                    if (subscription.channels.webPush) {
                        try {
                            await webPushService.sendRSSNotification(
                                subscription.userId._id,
                                post,
                                feedConfig
                            );
                            console.log(`✅ Web push sent to user ${subscription.userId._id}`);
                        } catch (error) {
                            console.error(`⚠️ Web push failed for user ${subscription.userId._id}:`, error.message);
                        }
                    }

                    // TODO: Add email notification if enabled
                    // if (subscription.channels.email) {
                    //   await emailService.sendNotification(subscription.userId._id, post, feedConfig);
                    // }

                } catch (error) {
                    console.error(`Error notifying user ${subscription.userId._id}:`, error.message);
                    skippedCount++;
                }
            }

            return { notified: notifiedCount, skipped: skippedCount };
        } catch (error) {
            console.error('Error in notifySinglePost:', error);
            throw error;
        }
    }

    /**
     * Get users subscribed to a feed or category
     * @param {ObjectId} feedId - RSS feed ID
     * @param {ObjectId} categoryId - Category ID
     * @returns {Promise<Array>}
     */
    async getSubscribedUsers(feedId, categoryId) {
        try {
            const subscriptions = [];

            // Get users subscribed to this specific feed
            const feedSubscriptions = await RSSNotificationSubscription.findActiveByFeed(feedId);
            subscriptions.push(...feedSubscriptions);

            // Get users subscribed to this category (if post has category)
            if (categoryId) {
                const categorySubscriptions = await RSSNotificationSubscription.findActiveByCategory(categoryId);
                subscriptions.push(...categorySubscriptions);
            }

            // Remove duplicates (users might be subscribed via multiple methods)
            const uniqueSubscriptions = this.removeDuplicateSubscriptions(subscriptions);

            return uniqueSubscriptions;
        } catch (error) {
            console.error('Error getting subscribed users:', error);
            throw error;
        }
    }

    /**
     * Remove duplicate subscriptions (same user)
     * @param {Array} subscriptions - Array of subscriptions
     * @returns {Array}
     */
    removeDuplicateSubscriptions(subscriptions) {
        const seen = new Set();
        return subscriptions.filter(sub => {
            const userId = sub.userId._id.toString();
            if (seen.has(userId)) {
                return false;
            }
            seen.add(userId);
            return true;
        });
    }

    /**
     * Create default subscription for a new user
     * @param {ObjectId} userId - User ID
     * @returns {Promise<RSSNotificationSubscription>}
     */
    async createDefaultSubscription(userId) {
        try {
            const { subscriptionType, channels } = notificationConfig.defaultSubscriptions;

            const subscription = await RSSNotificationSubscription.create({
                userId,
                subscriptionType,
                channels,
                isActive: true
            });

            console.log(`✅ Created default RSS notification subscription for user ${userId}`);
            return subscription;
        } catch (error) {
            console.error('Error creating default subscription:', error);
            throw error;
        }
    }

    /**
     * Subscribe user to RSS notifications
     * @param {ObjectId} userId - User ID
     * @param {Object} options - Subscription options
     * @returns {Promise<RSSNotificationSubscription>}
     */
    async subscribe(userId, options) {
        try {
            const { subscriptionType, feedId, categoryId, channels } = options;

            // Check if subscription already exists
            const query = { userId, subscriptionType };
            if (feedId) query.feedId = feedId;
            if (categoryId) query.categoryId = categoryId;

            let subscription = await RSSNotificationSubscription.findOne(query);

            if (subscription) {
                // Update existing subscription
                subscription.channels = channels;
                subscription.isActive = true;
                await subscription.save();
                console.log(`✅ Updated RSS notification subscription for user ${userId}`);
            } else {
                // Create new subscription
                subscription = await RSSNotificationSubscription.create({
                    userId,
                    subscriptionType,
                    feedId,
                    categoryId,
                    channels,
                    isActive: true
                });
                console.log(`✅ Created RSS notification subscription for user ${userId}`);
            }

            return subscription;
        } catch (error) {
            console.error('Error subscribing user:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe user from RSS notifications
     * @param {ObjectId} subscriptionId - Subscription ID
     * @param {ObjectId} userId - User ID (for verification)
     * @returns {Promise<Boolean>}
     */
    async unsubscribe(subscriptionId, userId) {
        try {
            const subscription = await RSSNotificationSubscription.findOne({
                _id: subscriptionId,
                userId: userId
            });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            subscription.isActive = false;
            await subscription.save();

            console.log(`✅ Unsubscribed user ${userId} from RSS notifications`);
            return true;
        } catch (error) {
            console.error('Error unsubscribing user:', error);
            throw error;
        }
    }

    /**
     * Get user's subscriptions
     * @param {ObjectId} userId - User ID
     * @returns {Promise<Array>}
     */
    async getUserSubscriptions(userId) {
        try {
            const subscriptions = await RSSNotificationSubscription.find({ userId })
                .populate('feedId', 'name brandName url')
                .populate('categoryId', 'name slug')
                .sort({ createdAt: -1 });

            return subscriptions;
        } catch (error) {
            console.error('Error getting user subscriptions:', error);
            throw error;
        }
    }

    /**
     * Update subscription preferences
     * @param {ObjectId} subscriptionId - Subscription ID
     * @param {ObjectId} userId - User ID (for verification)
     * @param {Object} updates - Updates to apply
     * @returns {Promise<RSSNotificationSubscription>}
     */
    async updateSubscription(subscriptionId, userId, updates) {
        try {
            const subscription = await RSSNotificationSubscription.findOne({
                _id: subscriptionId,
                userId: userId
            });

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            if (updates.channels) {
                subscription.channels = { ...subscription.channels, ...updates.channels };
            }

            if (typeof updates.isActive !== 'undefined') {
                subscription.isActive = updates.isActive;
            }

            await subscription.save();
            console.log(`✅ Updated subscription ${subscriptionId}`);

            return subscription;
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }
}

module.exports = new RSSNotificationService();
