const express = require('express');
const router = express.Router();
const rssSubscriptionController = require('../../controllers/rssSubscription/rssSubscriptionController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/rss-subscriptions
 * @desc    Get user's current subscriptions
 * @access  Private
 */
router.get('/', rssSubscriptionController.getUserSubscriptions);

/**
 * @route   GET /api/rss-subscriptions/available-feeds
 * @desc    Get available RSS feeds
 * @access  Private
 */
router.get('/available-feeds', rssSubscriptionController.getAvailableFeeds);

/**
 * @route   POST /api/rss-subscriptions
 * @desc    Create or update subscription
 * @access  Private
 */
router.post('/', rssSubscriptionController.createSubscription);

/**
 * @route   PUT /api/rss-subscriptions/:id
 * @desc    Update subscription channels
 * @access  Private
 */
router.put('/:id', rssSubscriptionController.updateSubscription);

/**
 * @route   DELETE /api/rss-subscriptions/:id
 * @desc    Delete subscription (set inactive)
 * @access  Private
 */
router.delete('/:id', rssSubscriptionController.deleteSubscription);

module.exports = router;
