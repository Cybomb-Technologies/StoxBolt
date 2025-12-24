const cron = require('node-cron');
const RSSFeedConfig = require('../models/RSSFeedConfig');
const rssParserService = require('./rssParserService');
const rssNotificationService = require('./rssNotification/rssNotificationService');

class RSSCronService {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
  }

  // Initialize the cron job
  init() {
    console.log('Initializing RSS Cron Service...');

    // Run every minute: '* * * * *' (Heartbeat)
    // We check for due feeds every minute and process a limited batch
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processFeeds();
    });

    console.log('RSS Cron Service started (Schedule: * * * * *, Distributed Fetch Mode)');

    // Run once immediately on startup to catch up
    this.processFeeds();
  }

  async processFeeds() {
    if (this.isRunning) {
      console.log('RSS Cron Job already running, skipping cycle');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();
      const BATCH_SIZE = 5; // Process max 5 feeds per minute

      // Find feeds that are active AND (never fetched OR due for fetch)
      // due for fetch = lastFetchedAt + (fetchIntervalMinutes * 60000) <= now
      const dueConfigs = await RSSFeedConfig.find({
        isActive: true,
        $or: [
          { lastFetchedAt: null },
          {
            $expr: {
              $lte: [
                { $add: ["$lastFetchedAt", { $multiply: ["$fetchIntervalMinutes", 60 * 1000] }] },
                now
              ]
            }
          }
        ]
      })
        .sort({ lastFetchedAt: 1 }) // Prioritize those waiting longest
        .limit(BATCH_SIZE);

      if (dueConfigs.length === 0) {
        // Silent return if nothing to do, to avoid log spam on 1-min cron
        this.isRunning = false;
        return;
      }

      console.log(`--- Distributed RSS Fetch: Processing ${dueConfigs.length} feeds ---`);

      // Process concurrently
      const promises = dueConfigs.map(config => this.processSingleFeed(config));
      await Promise.all(promises);

    } catch (error) {
      console.error('RSS Cron Job Error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async processSingleFeed(config) {
    console.log(`Processing feed: ${config.name} (${config.url})`);

    try {
      // Parse RSS
      const parseResult = await rssParserService.parseRSSFeed(config.url);

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse feed');
      }

      // Save Items
      // Note: We use the config creator as the default user ID for now, 
      // or we needs a "system" user ID. For now using config.createdBy
      const saveResult = await rssParserService.saveRSSItems(
        parseResult.items,
        config.createdBy,
        {
          saveAsDraft: false, // Auto-published as per requirements
          force: false,
          authorName: config.brandName // Use the brand name as author
        }
      );

      // Update config status
      config.lastFetchedAt = new Date();
      config.lastFetchStatus = 'success';
      config.lastErrorMessage = null;
      await config.save();

      console.log(`Feed ${config.name}: Saved ${saveResult.saved}, Skipped/Errors ${saveResult.errors}`);

      // Trigger notifications for new posts
      if (saveResult.savedPosts && saveResult.savedPosts.length > 0) {
        try {
          console.log(`📢 Triggering notifications for ${saveResult.savedPosts.length} new posts...`);

          // Get full post objects for notification
          const Post = require('../models/Post');
          const postIds = saveResult.savedPosts.map(p => p.id);
          const posts = await Post.find({ _id: { $in: postIds } }).populate('category');

          // Notify users
          const notificationResult = await rssNotificationService.notifyNewPosts(posts, config);
          console.log(`✅ Notifications: ${notificationResult.notified} sent, ${notificationResult.skipped} skipped`);
        } catch (notificationError) {
          console.error(`⚠️ Error sending notifications for feed ${config.name}:`, notificationError.message);
          // Don't fail the entire feed processing if notifications fail
        }
      }


    } catch (error) {
      console.error(`Error processing feed ${config.name}:`, error.message);

      // Update config with error
      config.lastFetchedAt = new Date();
      config.lastFetchStatus = 'error';
      config.lastErrorMessage = error.message;
      await config.save();
    }
  }
}

module.exports = new RSSCronService();
