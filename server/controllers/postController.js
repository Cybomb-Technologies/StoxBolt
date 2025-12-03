const Post = require('../models/Post');
const Activity = require('../models/Activity');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortTitle: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by author if admin (admin can only see their own posts)
    if (req.user.role === 'admin') {
      query.authorId = req.user._id;
    }
    // Superadmin can see all posts (no filter needed)
    
    const skip = (page - 1) * limit;
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('authorId', 'name email');
    
    const total = await Post.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: posts
    });
    
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('authorId', 'name email');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'admin' && post.authorId && post.authorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Admin can only access their own posts'
      });
    }
    // Superadmin can access any post
    
    res.status(200).json({
      success: true,
      data: post
    });
    
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private (Admin and Superadmin)
exports.createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      authorId: req.user._id
    };
    
    // Handle tags
    if (postData.tags && typeof postData.tags === 'string') {
      postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const post = await Post.create(postData);
    
    // Log activity
    await Activity.create({
      type: 'create',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { category: post.category, status: post.status }
    });
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
    
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Admin and Superadmin)
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check permissions for admin
    if (req.user.role === 'admin') {
      // Admin can only update their own posts
      if (post.authorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Admin can only update their own posts'
        });
      }
      
      // Admin cannot change status to published
      if (req.body.status && req.body.status === 'published') {
        return res.status(403).json({
          success: false,
          message: 'Admin cannot publish posts. Contact superadmin.'
        });
      }
      
      // If admin is trying to update a published post, don't allow status changes
      if (post.status === 'published' && req.body.status && req.body.status !== 'published') {
        return res.status(403).json({
          success: false,
          message: 'Admin cannot change status of published posts'
        });
      }
    }
    // Superadmin can update any post (no restrictions)
    
    // Handle tags - convert string to array if needed
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        req.body.tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(req.body.tags)) {
        req.body.tags = req.body.tags.filter(tag => tag && tag.trim());
      }
    }
    
    // Don't include authorId in update if it's in the request body
    const updateData = { ...req.body };
    delete updateData.authorId; // Prevent changing authorId
    
    // Update the post
    post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('authorId', 'name email');
    
    // Log activity
    await Activity.create({
      type: 'update',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: updateData
    });
    
    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
    
  } catch (error) {
    console.error('Update post error:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Server error';
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(val => val.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate field value entered';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Superadmin only)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Only superadmin can delete posts
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can delete posts'
      });
    }
    
    // Log activity before deletion
    await Activity.create({
      type: 'delete',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { category: post.category }
    });
    
    await post.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Publish post
// @route   PUT /api/posts/:id/publish
// @access  Private (Superadmin only)
exports.publishPost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Only superadmin can publish posts
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can publish posts'
      });
    }
    
    post.status = 'published';
    post.publishDateTime = Date.now();
    await post.save();
    
    // Log activity
    await Activity.create({
      type: 'publish',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id
    });
    
    res.status(200).json({
      success: true,
      message: 'Post published successfully',
      data: post
    });
    
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get scheduled posts
// @route   GET /api/posts/scheduled
// @access  Private
exports.getScheduledPosts = async (req, res) => {
  try {
    const query = { status: 'scheduled' };
    
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