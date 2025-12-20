const Post = require('../models/Post');
const Activity = require('../models/Activity');
const cron = require('node-cron');
const rssNotificationService = require('../services/rssNotification/rssNotificationService');

// @desc    Get scheduled posts
// @route   GET /api/scheduler/posts
// @access  Private
exports.getScheduledPosts = async (req, res) => {
  try {
    const query = {
      isScheduled: true,
      scheduleApproved: true,
      status: 'scheduled'
    };

    // Filter by author if admin
    if (req.user.role === 'admin') {
      query.authorId = req.user._id;
    }
    // Superadmin can see all scheduled posts

    const posts = await Post.find(query)
      .sort({ publishDateTime: 1 })
      .populate('authorId', 'name email');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });

  } catch (error) {
    console.error('Get scheduled posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update timezone setting
// @route   PUT /api/scheduler/timezone
// @access  Private
exports.updateTimezone = async (req, res) => {
  try {
    const { timezone } = req.body;

    if (!timezone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide timezone'
      });
    }

    // Update user's timezone setting
    req.user.settings.timezone = timezone;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Timezone updated successfully',
      timezone: timezone
    });

  } catch (error) {
    console.error('Update timezone error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete scheduled post
// @route   DELETE /api/scheduler/posts/:id
// @access  Private
exports.deleteScheduledPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is scheduled
    if (!post.isScheduled) {
      return res.status(400).json({
        success: false,
        message: 'Post is not scheduled'
      });
    }

    // Check permissions
    if (!['admin', 'superadmin'].includes(req.user.role) &&
      post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Change status to draft
    post.isScheduled = false;
    post.scheduleApproved = false;
    post.status = 'draft';
    await post.save();

    // Log activity
    await Activity.create({
      type: 'update',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { from: 'scheduled', to: 'draft' }
    });

    res.status(200).json({
      success: true,
      message: 'Scheduled post removed',
      data: post
    });

  } catch (error) {
    console.error('Delete scheduled post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// In schedulerController.js - Update the processScheduledPosts function:
exports.processScheduledPosts = async () => {
  try {
    console.log('=== PROCESSING SCHEDULED POSTS CRON JOB ===');
    const now = new Date();
    console.log('Current time:', now.toISOString());
    console.log('Local time:', now.toString());

    // Find posts that are scheduled, approved, and their publish time has passed
    // Look for posts scheduled in the past 30 minutes to catch any that might have been missed
    const thirtyMinutesAgo = new Date(now.getTime() - (30 * 60 * 1000));

    const query = {
      isScheduled: true,
      scheduleApproved: true,
      status: 'scheduled',
      publishDateTime: {
        $lte: now,
        $gte: thirtyMinutesAgo // Only check posts scheduled in the last 30 minutes
      }
    };

    console.log('Query for auto-publish:', JSON.stringify(query, null, 2));

    const posts = await Post.find(query)
      .populate('authorId', 'name email')
      .lean()
      .exec();

    console.log(`Found ${posts.length} posts to auto-publish`);

    const processedPosts = [];

    for (const post of posts) {
      console.log(`\nProcessing post: ${post.title}`);
      console.log(`Post ID: ${post._id}`);
      console.log(`Scheduled for: ${post.publishDateTime}`);
      console.log(`Current time: ${now}`);

      // Update post to published
      const updatedPost = await Post.findByIdAndUpdate(
        post._id,
        {
          status: 'published',
          isScheduled: false,
          lastApprovedBy: post.authorId?._id || null,
          lastApprovedAt: now,
          $unset: {
            scheduleApproved: "",
            scheduleApprovedBy: "",
            scheduleApprovedAt: ""
          }
        },
        { new: true }
      );

      console.log(`Updated post status to: ${updatedPost.status}`);
      // console.log(`Auto-published: ${post.title}`);

      // Send notifications for auto-published post
      try {
        await rssNotificationService.notifyUsersAboutAdminPost(updatedPost);
        // console.log(`✅ Notifications sent for auto-published post: ${post.title}`);
      } catch (notificationError) {
        console.error(`❌ Notification error for ${post.title}:`, notificationError.message);
      }

      processedPosts.push(updatedPost);

      // Log activity
      try {
        await Activity.create({
          type: 'publish',
          userId: post.authorId?._id || null,
          user: 'System (Auto-publish)',
          title: post.title,
          postId: post._id,
          details: {
            automated: true,
            scheduled: true,
            scheduledTime: post.publishDateTime,
            actualPublishTime: now,
            author: post.authorId?.name || 'Unknown'
          }
        });
      } catch (activityError) {
        console.error(`Activity log error: ${activityError.message}`);
      }
    }

    if (posts.length === 0) {
      console.log('No posts to auto-publish at this time.');
    }

    console.log('=== CRON JOB COMPLETED ===');

    return processedPosts.length;

  } catch (error) {
    console.error('Process scheduled posts error:', error);
    console.error('Error stack:', error.stack);
    return 0;
  }
};

// @desc    Manual trigger for scheduled posts (for testing)
// @route   GET /api/scheduler/trigger-auto-publish
// @access  Private (Superadmin only)
exports.triggerAutoPublish = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can trigger auto-publish'
      });
    }

    const count = await exports.processScheduledPosts();

    res.status(200).json({
      success: true,
      message: `Auto-publish triggered. Processed ${count} posts.`,
      count: count
    });

  } catch (error) {
    console.error('Trigger auto-publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Schedule cron job to run every minute - SINGLE INSTANCE
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('* * * * *', async () => {
    console.log('--- Running scheduled posts cron job ---');
    try {
      const count = await exports.processScheduledPosts();
      if (count > 0) {
        console.log(`✅ Successfully auto-published ${count} scheduled post(s)`);
      }
    } catch (error) {
      console.error('❌ Cron job execution error:', error);
    }
  });

  console.log('Scheduled posts cron job initialized');
}