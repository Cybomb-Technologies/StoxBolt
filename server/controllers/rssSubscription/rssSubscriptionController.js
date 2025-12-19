const RSSNotificationSubscription = require('../../models/rssNotification/RSSNotificationSubscription');
const RSSFeedConfig = require('../../models/RSSFeedConfig');

class RSSSubscriptionController {
    /**
     * Get user's current subscriptions
     * GET /api/rss-subscriptions
     */
    async getUserSubscriptions(req, res) {
        try {
            const userId = req.user.userId;

            const subscriptions = await RSSNotificationSubscription.find({
                userId: userId,
                isActive: true
            })
                .populate('feedId', 'name brandName url')
                .populate('categoryId', 'name')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: subscriptions.length,
                subscriptions
            });
        } catch (error) {
            console.error('Error getting user subscriptions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get subscriptions',
                error: error.message
            });
        }
    }

    /**
     * Create or update subscription
     * POST /api/rss-subscriptions
     */
    async createSubscription(req, res) {
        try {
            const userId = req.user.userId;
            const {
                subscriptionType, // 'all', 'feed', 'category'
                feedId,
                categoryId,
                channels
            } = req.body;

            // Validate subscription type
            if (!['all', 'feed', 'category'].includes(subscriptionType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid subscription type'
                });
            }

            // Validate required fields based on type
            if (subscriptionType === 'feed' && !feedId) {
                return res.status(400).json({
                    success: false,
                    message: 'Feed ID is required for feed subscription'
                });
            }

            if (subscriptionType === 'category' && !categoryId) {
                return res.status(400).json({
                    success: false,
                    message: 'Category ID is required for category subscription'
                });
            }

            // Check if subscription already exists
            const existingQuery = { userId, subscriptionType };
            if (feedId) existingQuery.feedId = feedId;
            if (categoryId) existingQuery.categoryId = categoryId;

            let subscription = await RSSNotificationSubscription.findOne(existingQuery);

            if (subscription) {
                // Update existing subscription
                subscription.channels = {
                    inApp: channels?.inApp !== undefined ? channels.inApp : true,
                    webPush: channels?.webPush !== undefined ? channels.webPush : false,
                    email: channels?.email !== undefined ? channels.email : false
                };
                subscription.isActive = true;
                await subscription.save();

                return res.status(200).json({
                    success: true,
                    message: 'Subscription updated successfully',
                    subscription
                });
            }

            // Create new subscription
            subscription = await RSSNotificationSubscription.create({
                userId,
                subscriptionType,
                feedId: feedId || null,
                categoryId: categoryId || null,
                channels: {
                    inApp: channels?.inApp !== undefined ? channels.inApp : true,
                    webPush: channels?.webPush !== undefined ? channels.webPush : false,
                    email: channels?.email !== undefined ? channels.email : false
                }
            });

            res.status(201).json({
                success: true,
                message: 'Subscription created successfully',
                subscription
            });
        } catch (error) {
            console.error('Error creating subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create subscription',
                error: error.message
            });
        }
    }

    /**
     * Update subscription channels
     * PUT /api/rss-subscriptions/:id
     */
    async updateSubscription(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { channels } = req.body;

            const subscription = await RSSNotificationSubscription.findOne({
                _id: id,
                userId: userId
            });

            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
            }

            // Update channels
            if (channels) {
                subscription.channels = {
                    inApp: channels.inApp !== undefined ? channels.inApp : subscription.channels.inApp,
                    webPush: channels.webPush !== undefined ? channels.webPush : subscription.channels.webPush,
                    email: channels.email !== undefined ? channels.email : subscription.channels.email
                };
            }

            await subscription.save();

            res.status(200).json({
                success: true,
                message: 'Subscription updated successfully',
                subscription
            });
        } catch (error) {
            console.error('Error updating subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update subscription',
                error: error.message
            });
        }
    }

    /**
     * Delete subscription (set inactive)
     * DELETE /api/rss-subscriptions/:id
     */
    async deleteSubscription(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;

            const subscription = await RSSNotificationSubscription.findOne({
                _id: id,
                userId: userId
            });

            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
            }

            // Soft delete - set inactive
            subscription.isActive = false;
            await subscription.save();

            res.status(200).json({
                success: true,
                message: 'Subscription deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete subscription',
                error: error.message
            });
        }
    }

    /**
     * Get available RSS feeds
     * GET /api/rss-subscriptions/available-feeds
     */
    async getAvailableFeeds(req, res) {
        try {
            const feeds = await RSSFeedConfig.find({ isActive: true })
                .select('name brandName url description')
                .sort({ name: 1 });

            res.status(200).json({
                success: true,
                count: feeds.length,
                feeds
            });
        } catch (error) {
            console.error('Error getting available feeds:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get available feeds',
                error: error.message
            });
        }
    }
}

module.exports = new RSSSubscriptionController();
