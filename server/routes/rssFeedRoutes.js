// backend/routes/rssFeedRoutes.js
const express = require('express');
const router = express.Router();
const rssParserService = require('../services/rssParserService');
const { protect, authorize } = require('../middleware/auth');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
// @route   POST /api/rss/parse
// @desc    Parse RSS feed from URL
// @access  Admin
router.post('/parse', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'RSS feed URL is required'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    const result = await rssParserService.parseRSSFeed(url);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse RSS feed',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: `Successfully parsed ${result.count} items`,
      data: {
        count: result.count,
        items: result.items.slice(0, 20), // Return first 20 items for preview
        sampleItem: result.items[0] || null
      }
    });
  } catch (error) {
    console.error('RSS parse error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while parsing RSS feed',
      error: error.message
    });
  }
});

// @route   POST /api/rss/save
// @desc    Save parsed RSS items as posts
// @access  Admin
router.post('/save', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { 
      url, 
      items, 
      saveAsDraft = false, 
      force = false,
      categoryFilter = null 
    } = req.body;

    if (!url && !items) {
      return res.status(400).json({
        success: false,
        message: 'Either URL or items array is required'
      });
    }

    let itemsToSave = items;

    // If URL is provided, parse it first
    if (url) {
      const parseResult = await rssParserService.parseRSSFeed(url);
      
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to parse RSS feed',
          error: parseResult.error
        });
      }

      itemsToSave = parseResult.items;
    }

    // Apply category filter if specified
    if (categoryFilter && itemsToSave) {
      itemsToSave = itemsToSave.filter(item => 
        item.categories && item.categories.some(cat => 
          cat.toLowerCase().includes(categoryFilter.toLowerCase())
        )
      );
    }

    if (!itemsToSave || itemsToSave.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items to save'
      });
    }

    const saveResult = await rssParserService.saveRSSItems(
      itemsToSave,
      req.user._id,
      { saveAsDraft, force }
    );

    res.json({
      success: saveResult.success,
      message: `Saved ${saveResult.saved} items, ${saveResult.errors} errors`,
      data: saveResult
    });
  } catch (error) {
    console.error('RSS save error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving RSS items',
      error: error.message
    });
  }
});

// @route   GET /api/rss/history
// @desc    Get RSS import history
// @access  Admin
router.get('/history', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // In a real implementation, you would have an RSSImport model
    // For now, we'll return posts imported from RSS
    
    const posts = await Post.find({ source: 'rss_feed' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name slug')
      .populate('authorId', 'name email');

    const total = await Post.countDocuments({ source: 'rss_feed' });

    res.json({
      success: true,
      data: posts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('RSS history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching RSS history',
      error: error.message
    });
  }
});

// @route   DELETE /api/rss/clear-history
// @desc    Clear RSS imported posts
// @access  Superadmin only
// @route   GET /api/rss/configs
// @desc    Get all RSS feed configurations
// @access  Admin
router.get('/configs', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const RSSFeedConfig = require('../models/RSSFeedConfig');
    const configs = await RSSFeedConfig.find().sort({ createdAt: -1 });
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching RSS configs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/rss/configs
// @desc    Create new RSS feed configuration
// @access  Admin
router.post(
  '/configs',
  protect,
  authorize('admin', 'superadmin'),
  async (req, res) => {
    try {
      const { name, url, brandName, isActive } = req.body;
      const RSSFeedConfig = require('../models/RSSFeedConfig');

      const config = new RSSFeedConfig({
        name,
        url,
        brandName,
        isActive,
        createdBy: req.user._id
      });

      await config.save();

      // 🔔 NOTIFICATION (ONLY ADDITION – OLD CODE SAFE)
      await Notification.create({
        type: 'rss-feed',
        title: 'New RSS Feed Added',
        message: `RSS Feed "${name}" has been created`,
        referenceId: config._id,
        createdBy: req.user._id,
        isRead: false
      });

      res.json({ success: true, data: config });

    } catch (error) {
      console.error('Error creating RSS config:', error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'This RSS feed URL already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Server error'
      });
    }
  }
);

// @route   PUT /api/rss/configs/:id
// @desc    Update RSS feed configuration
// @access  Admin
router.put('/configs/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, url, brandName, isActive } = req.body;
    const RSSFeedConfig = require('../models/RSSFeedConfig');

    const config = await RSSFeedConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }

    if (name) config.name = name;
    if (url) config.url = url;
    if (brandName) config.brandName = brandName;
    if (typeof isActive !== 'undefined') config.isActive = isActive;

    await config.save();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating RSS config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/rss/configs/:id
// @desc    Delete RSS feed configuration
// @access  Admin
router.delete('/configs/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const RSSFeedConfig = require('../models/RSSFeedConfig');
    await RSSFeedConfig.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Config deleted' });
  } catch (error) {
    console.error('Error deleting RSS config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/rss/configs/:id/run
// @desc    Manually run a specific feed fetch
// @access  Admin
router.post('/configs/:id/run', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const RSSFeedConfig = require('../models/RSSFeedConfig');
    const rssCronService = require('../services/rssCronService');
    
    const config = await RSSFeedConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }

    // Run asynchronously without waiting
    rssCronService.processSingleFeed(config);

    res.json({ success: true, message: 'Feed fetch triggered in background' });
  } catch (error) {
    console.error('Error triggering feed run:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/clear-history', protect, authorize('superadmin'), async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can clear RSS import history'
      });
    }

    const { days } = req.query;
    let deleteQuery = { source: 'rss_feed' };

    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
      deleteQuery.createdAt = { $lt: cutoffDate };
    }

    const Post = require('../models/Post');
    const result = await Post.deleteMany(deleteQuery);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} RSS imported posts`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear RSS history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing RSS history',
      error: error.message
    });
  }
});

module.exports = router;