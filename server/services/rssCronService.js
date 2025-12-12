const cron = require('node-cron');
const RSSFeedConfig = require('../models/RSSFeedConfig');
const rssParserService = require('./rssParserService');

class RSSCronService {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
  }

  // Initialize the cron job
  init() {
    console.log('Initializing RSS Cron Service...');
    
    // Run every 15 minutes: '*/15 * * * *'
    // For testing/demo, we might want it faster, but 15m is good for production
    this.cronJob = cron.schedule('*/15 * * * *', async () => {
      await this.processFeeds();
    });

    console.log('RSS Cron Service started (Schedule: */15 * * * *)');
    
    // Run once immediately on startup to catch up
    // this.processFeeds(); 
  }

  async processFeeds() {
    if (this.isRunning) {
      console.log('RSS Cron Job already running, skipping cycle');
      return;
    }

    this.isRunning = true;
    console.log('--- RSS Automatic Fetch Started ---');

    try {
      // Find all active feed configs
      const activeConfigs = await RSSFeedConfig.find({ isActive: true });
      
      if (activeConfigs.length === 0) {
        console.log('No active RSS feeds to process');
        this.isRunning = false;
        return;
      }

      console.log(`Found ${activeConfigs.length} active feeds to process`);

      for (const config of activeConfigs) {
        await this.processSingleFeed(config);
      }
      
    } catch (error) {
      console.error('RSS Cron Job Error:', error);
    } finally {
      this.isRunning = false;
      console.log('--- RSS Automatic Fetch Completed ---');
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

      console.log(`Feed ${config.name}: Saved ${saveResult.saved}, Scpped/Errors ${saveResult.errors}`);
      
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
