// backend/services/rssParserService.js
const axios = require('axios');
const xml2js = require('xml2js');
const Post = require('../models/Post');
const Category = require('../models/Category');
const { v4: uuidv4 } = require('uuid');

class RSSParserService {
  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      normalizeTags: true,
      normalize: true,
      trim: true
    });
  }

  async parseRSSFeed(url) {
    try {
      console.log(`Fetching RSS feed from: ${url}`);
      
      // Fetch the RSS feed
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'StoxBolt-RSS-Parser/1.0'
        }
      });

      if (!response.data) {
        throw new Error('No data received from RSS feed');
      }

      // Parse XML to JSON
      const parsedData = await this.parser.parseStringPromise(response.data);
      
      // Extract items from RSS
      const items = this.extractItems(parsedData);
      
      console.log(`Successfully parsed ${items.length} items from RSS feed`);
      
      return {
        success: true,
        count: items.length,
        items: items,
        rawData: parsedData
      };
    } catch (error) {
      console.error('RSS parsing error:', error.message);
      return {
        success: false,
        error: error.message,
        count: 0,
        items: []
      };
    }
  }

  extractItems(parsedData) {
    try {
      let items = [];
      
      // Handle different RSS formats
      if (parsedData.rss && parsedData.rss.channel && parsedData.rss.channel.item) {
        items = Array.isArray(parsedData.rss.channel.item) 
          ? parsedData.rss.channel.item 
          : [parsedData.rss.channel.item];
      } 
      else if (parsedData.feed && parsedData.feed.entry) {
        // Atom format
        items = Array.isArray(parsedData.feed.entry) 
          ? parsedData.feed.entry 
          : [parsedData.feed.entry];
        items = items.map(this.convertAtomToRSS);
      }
      else if (parsedData.channel && parsedData.channel.item) {
        items = Array.isArray(parsedData.channel.item) 
          ? parsedData.channel.item 
          : [parsedData.channel.item];
      }

      // Process each item
      return items.map(item => this.processItem(item)).filter(Boolean);
    } catch (error) {
      console.error('Error extracting items:', error);
      return [];
    }
  }

  processItem(item) {
    try {
      // Extract title
      const title = item.title?._ || item.title?.$?.text || item.title || '';
      const shortTitle = title.length > 100 ? title.substring(0, 97) + '...' : title;

      // Extract description/content
      let description = '';
      if (item.description) {
        description = item.description?._ || item.description?.$?.text || item.description || '';
      } else if (item.content) {
        description = item.content?._ || item.content?.$?.text || item.content || '';
      } else if (item.summary) {
        description = item.summary?._ || item.summary?.$?.text || item.summary || '';
      }

      // Clean HTML tags from description
      description = description.replace(/<[^>]*>/g, '').trim();

      // Extract link
      let link = '';
      if (typeof item.link === 'string') {
        link = item.link;
      } else if (item.link && item.link.$.href) {
        link = item.link.$.href;
      } else if (item.link && item.link.$ && item.link.$.url) {
        link = item.link.$.url;
      } else if (Array.isArray(item.link)) {
        const alternateLink = item.link.find(l => l.$.rel === 'alternate');
        link = alternateLink ? alternateLink.$.href : item.link[0]?.$?.href || '';
      }

      // Extract categories/tags
      let categories = [];
      if (item.category) {
        if (Array.isArray(item.category)) {
          categories = item.category.map(cat => 
            typeof cat === 'string' ? cat : cat._ || cat.$.term || ''
          ).filter(cat => cat && cat.trim() !== '');
        } else {
          const cat = typeof item.category === 'string' 
            ? item.category 
            : item.category._ || item.category.$.term || '';
          if (cat && cat.trim() !== '') {
            categories = [cat];
          }
        }
      }

      // Extract publication date
      let pubDate = '';
      if (item.pubdate) {
        pubDate = item.pubdate;
      } else if (item.pubDate) {
        pubDate = item.pubDate;
      } else if (item.published) {
        pubDate = item.published;
      } else if (item.updated) {
        pubDate = item.updated;
      } else if (item.date) {
        pubDate = item.date;
      }

      // Extract image/media
      let imageUrl = '';
      if (item['media:content']) {
        if (Array.isArray(item['media:content'])) {
          const imageContent = item['media:content'].find(media => 
            media.$ && (media.$.medium === 'image' || media.$['medium'] === 'image')
          );
          imageUrl = imageContent ? imageContent.$.url : '';
        } else if (item['media:content'].$ && item['media:content'].$.url) {
          imageUrl = item['media:content'].$.url;
        }
      } else if (item.enclosure && item.enclosure.$.url) {
        imageUrl = item.enclosure.$.url;
      }

      // Generate unique GUID if not present
      const guid = item.guid?._ || item.guid || link || uuidv4();

      return {
        guid,
        title: title.trim(),
        shortTitle: shortTitle.trim(),
        description: description.trim(),
        content: description.trim(), // Use description as content initially
        link,
        categories,
        pubDate,
        imageUrl,
        source: 'rss_feed',
        rawData: item // Keep raw data for debugging
      };
    } catch (error) {
      console.error('Error processing item:', error);
      return null;
    }
  }

  convertAtomToRSS(atomEntry) {
    return {
      title: atomEntry.title,
      description: atomEntry.summary || atomEntry.content,
      link: atomEntry.link ? (atomEntry.link.href || atomEntry.link) : '',
      guid: atomEntry.id,
      pubDate: atomEntry.published || atomEntry.updated,
      category: atomEntry.category ? 
        (Array.isArray(atomEntry.category) ? 
          atomEntry.category.map(cat => cat.term) : 
          [atomEntry.category.term]) : 
        []
    };
  }

  async saveRSSItems(items, userId, options = {}) {
    try {
      const savedPosts = [];
      const errors = [];

      for (const item of items) {
        try {
          // Check if post already exists by GUID or title
          const existingPost = await Post.findOne({
            $or: [
              { guid: item.guid },
              { title: item.title },
              { link: item.link }
            ]
          });

          if (existingPost && !options.force) {
            console.log(`Post already exists: ${item.title}`);
            errors.push({
              item: item.title,
              error: 'Post already exists',
              guid: item.guid
            });
            continue;
          }

          // Find or create category
          let categoryId = null;
          if (item.categories && item.categories.length > 0) {
            const categoryName = item.categories[0]; // Use first category
            let category = await Category.findOne({ 
              name: { $regex: new RegExp(`^${categoryName}$`, 'i') } 
            });

            if (!category) {
              // Create new category
              category = new Category({
                name: categoryName,
                slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
                description: `Auto-created from RSS feed`,
                createdBy: userId,
                type: 'news'
              });
              await category.save();
            }
            categoryId = category._id;
          }

          // If no category found/created from RSS, use default
          if (!categoryId) {
            let defaultCategory = await Category.findOne({ name: 'General' });
            if (!defaultCategory) {
              defaultCategory = new Category({
                name: 'General',
                slug: 'general',
                description: 'General category',
                createdBy: userId,
                type: 'news'
              });
              await defaultCategory.save();
            }
            categoryId = defaultCategory._id;
          }

          // Create new post
          const postData = {
            title: item.title,
            shortTitle: item.shortTitle,
            body: item.content || item.description,
            link: item.link,
            guid: item.guid,
            category: categoryId,
            imageUrl: item.imageUrl,
            author: options.authorName || 'RSS Feed',
            authorId: userId,
            source: item.source || 'rss_feed',
            status: options.saveAsDraft ? 'draft' : 'published',
            publishDateTime: item.pubDate ? new Date(item.pubDate) : new Date(),
            metaDescription: item.description.substring(0, 160),
            tags: item.categories || [],
            rssData: {
              originalPubDate: item.pubDate,
              categories: item.categories,
              rawItem: item.rawData
            }
          };

          const post = existingPost ? 
            await Post.findByIdAndUpdate(existingPost._id, postData, { new: true }) :
            new Post(postData);

          await post.save();
          savedPosts.push(post);

          console.log(`Saved post: ${post.title}`);
        } catch (error) {
          console.error(`Error saving item "${item.title}":`, error.message);
          errors.push({
            item: item.title,
            error: error.message,
            guid: item.guid
          });
        }
      }

      return {
        success: savedPosts.length > 0 || errors.length === 0,
        saved: savedPosts.length,
        errors: errors.length,
        savedPosts: savedPosts.map(p => ({
          id: p._id,
          title: p.title,
          status: p.status
        })),
        errorDetails: errors
      };
    } catch (error) {
      console.error('Error in saveRSSItems:', error);
      throw error;
    }
  }
}

module.exports = new RSSParserService();