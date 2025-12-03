const Post = require('../models/Post');
const Activity = require('../models/Activity');
const cron = require('node-cron');

// @desc    Get scheduled posts
// @route   GET /api/scheduler/posts
// @access  Private
exports.getScheduledPosts = async (req, res) => {
  try {
    const query = { status: 'scheduled' };
    
    // Filter by author if not admin/superadmin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      query.authorId = req.user._id;
    }
    
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
    if (post.status !== 'scheduled') {
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

// @desc    Process scheduled posts (cron job)
// @route   Internal
exports.processScheduledPosts = async () => {
  try {
    const now = new Date();
    
    // Find posts scheduled for publication
    const posts = await Post.find({
      status: 'scheduled',
      publishDateTime: { $lte: now }
    });
    
    for (const post of posts) {
      post.status = 'published';
      await post.save();
      
      // Log activity
      await Activity.create({
        type: 'publish',
        userId: post.authorId,
        user: 'System',
        title: post.title,
        postId: post._id,
        details: { automated: true }
      });
      
      console.log(`Auto-published: ${post.title}`);
    }
    
    return posts.length;
    
  } catch (error) {
    console.error('Process scheduled posts error:', error);
    return 0;
  }
};

// Schedule cron job to run every minute
cron.schedule('* * * * *', () => {
  exports.processScheduledPosts();
});