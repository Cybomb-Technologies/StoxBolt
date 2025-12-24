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
    // Sequential Round-Robin: One feed per minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processFeeds();
    });

    console.log('RSS Cron Service started (Schedule: * * * * *, Sequential Mode)');

    // Run once immediately on startup
    this.processFeeds();
  }

  async processFeeds() {
    if (this.isRunning) {
      console.log('RSS Cron Job already running, skipping cycle');
      return;
    }

    this.isRunning = true;

    try {
      const BATCH_SIZE = 1; // Strict 1 feed per minute as requested

      // Find the "oldest" fetched feed (or one that has never been fetched)
      // This creates a natural Round-Robin queue
      const feeds = await RSSFeedConfig.find({ isActive: true })
        .sort({ lastFetchedAt: 1 }) // nulls first, then oldest dates
        .limit(BATCH_SIZE);

      if (feeds.length === 0) {
        this.isRunning = false;
        return;
      }

      const feed = feeds[0];

      // SAFEGUARD: If the "oldest" feed was fetched very recently (e.g., < 10 mins ago),
      // it means we have very few feeds and we are cycling too fast.
      // We should pause to avoid spamming the source.
      if (feed.lastFetchedAt) {
        const now = new Date();
        const diffMinutes = (now - feed.lastFetchedAt) / 1000 / 60;
        const MIN_COOLDOWN_MINUTES = 10;

        if (diffMinutes < MIN_COOLDOWN_MINUTES) {
          // console.log(`[RSS Skipper] Feed "${feed.name}" fetched ${diffMinutes.toFixed(1)}m ago. Waiting for cooldown.`);
          this.isRunning = false;
          return;
        }
      }

      console.log(`--- Sequential RSS Fetch: Processing "${feed.name}" ---`);

      await this.processSingleFeed(feed);

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
