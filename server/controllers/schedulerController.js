const Post = require('../models/Post');
const Activity = require('../models/Activity');
const cron = require('node-cron');

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

// @desc    Process scheduled posts (cron job) - IMPROVED VERSION
// @route   Internal
exports.processScheduledPosts = async () => {
  try {
    console.log('=== PROCESSING SCHEDULED POSTS CRON JOB ===');
    const now = new Date();
    console.log('Current time (UTC):', now.toISOString());
    console.log('Current time (Local):', now.toString());
    
    // Find posts scheduled for publication that are approved
    // Use a buffer of 5 minutes to catch any missed posts
    const bufferTime = new Date(now.getTime() - (5 * 60 * 1000)); // 5 minutes ago
    
    const posts = await Post.find({
      isScheduled: true,
      scheduleApproved: true,
      status: { $in: ['scheduled', 'pending_approval'] }, // Check both statuses
      publishDateTime: { 
        $lte: now,
        $gte: bufferTime // Only posts from last 5 minutes to avoid reprocessing old ones
      }
    }).populate('authorId', 'name email');
    
    console.log(`Found ${posts.length} posts to auto-publish`);
    
    for (const post of posts) {
      console.log(`Processing post: ${post.title}`);
      console.log(`Scheduled for: ${post.publishDateTime}`);
      console.log(`Scheduled time (Local): ${new Date(post.publishDateTime).toString()}`);
      console.log(`Author: ${post.authorId?.name || 'Unknown'}`);
      
      // Calculate time difference
      const scheduledTime = new Date(post.publishDateTime);
      const timeDiffMs = now - scheduledTime;
      const timeDiffMins = Math.floor(timeDiffMs / (1000 * 60));
      
      console.log(`Time difference: ${timeDiffMins} minutes`);
      
      // Update post to published
      post.status = 'published';
      post.publishDateTime = now; // Update to actual publish time
      post.isScheduled = false; // Remove scheduled flag
      post.lastApprovedBy = post.authorId?._id || null;
      post.lastApprovedAt = now;
      
      await post.save();
      
      console.log(`Auto-published: ${post.title} (ID: ${post._id})`);
      
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
            timeDifferenceMinutes: timeDiffMins,
            author: post.authorId?.name || 'Unknown'
          }
        });
      } catch (activityError) {
        console.error(`Failed to log activity for post ${post._id}:`, activityError.message);
      }
    }
    
    if (posts.length === 0) {
      console.log('No posts to auto-publish at this time.');
    }
    
    console.log('=== CRON JOB COMPLETED ===');
    
    return posts.length;
    
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