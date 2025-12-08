const mongoose = require('mongoose');
const Post = require('../models/Post');
const AdminPost = require('../models/AdminPost');
const Activity = require('../models/Activity');

// Add this helper function at the beginning of the file
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @desc    Get all posts with CRUD access consideration
// @route   GET /api/posts
// @access  Private
// In the getPosts function, update the beginning:
exports.getPosts = async (req, res) => {
  try {
    const { 
      status = 'published', // Default to published for public access
      category, 
      search, 
      page = 1, 
      limit = 10,
      sort = '-createdAt'
    } = req.query;
    
    const query = {};
    
    // For public access, only show published posts
    if (!req.user) {
      // Public access - only show published posts
      query.status = 'published';
    } else {
      // Authenticated users can filter by status
      if (status && status !== 'all') {
        if (status === 'scheduled') {
          query.isScheduled = true;
          query.scheduleApproved = true;
          query.status = 'scheduled';
        } else if (status === 'pending_schedule') {
          query.isScheduled = true;
          query.scheduleApproved = false;
          query.status = { $in: ['pending_approval', 'draft'] };
        } else {
          query.status = status;
        }
      } else if (req.user.role === 'admin' && !req.user.hasCRUDAccess) {
        // Admin without CRUD access can only see their own posts
        query.authorId = req.user._id;
      }
    }
    // Superadmin and admin with CRUD access can see all posts
    
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
    
    const skip = (page - 1) * limit;
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('authorId', 'name email')
      .populate('category', 'name');
    
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

// @desc    Get single post with CRUD access consideration
// @route   GET /api/posts/:id
// @access  Private
// In the getPost function, update the beginning:
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'name email')
      .populate('category', 'name');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // For public access, only allow viewing published posts
    if (!req.user && post.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This post is not published.'
      });
    }
    
    // Check permissions for authenticated users
    if (req.user && req.user.role === 'admin') {
      const isOwnPost = post.authorId && post.authorId._id.toString() === req.user._id.toString();
      
      // Admin can only access:
      // 1. Their own posts
      // 2. Any post if they have CRUD access
      if (!isOwnPost && !req.user.hasCRUDAccess) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own posts'
        });
      }
    }
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

// @desc    Create new post with CRUD access consideration
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    console.log('=== CREATE POST STARTED ===');
    console.log('User role:', req.user.role);
    console.log('User hasCRUDAccess:', req.user.hasCRUDAccess);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Admin without CRUD access must use draft system
    if (req.user.role === 'admin' && !req.user.hasCRUDAccess) {
      return res.status(403).json({
        success: false,
        message: 'Admin must use draft system to create posts. CRUD access is required for direct creation.'
      });
    }
    
    // In the createPost function, update the postData section:
const postData = {
  ...req.body,
  authorId: req.user._id,
  author: req.body.author || req.user.name
};

// Make sure category is an ObjectId
if (req.body.category) {
  if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
    // If category is a string (new category), create it first
    const Category = require('../models/Category');
    let category = await Category.findOne({ name: req.body.category });
    
    if (!category) {
      // Create new category
      category = await Category.create({
        name: req.body.category,
        createdBy: req.user._id
      });
    }
    
    postData.category = category._id;
  }
}

// In the updatePost function, add similar logic:
if (req.body.category) {
  if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
    // If category is a string (new category), create it first
    const Category = require('../models/Category');
    let category = await Category.findOne({ name: req.body.category });
    
    if (!category) {
      // Create new category
      category = await Category.create({
        name: req.body.category,
        createdBy: req.user._id
      });
    }
    
    updateData.category = category._id;
  }
}

    
    // Handle tags
    if (postData.tags && typeof postData.tags === 'string') {
      postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Check if it's a scheduled post
    const publishDate = new Date(postData.publishDateTime);
    const now = new Date();
    const isScheduled = publishDate > now;
    
    console.log('Is scheduled post?', isScheduled);
    console.log('Publish date:', postData.publishDateTime);
    console.log('Publish date (local):', publishDate.toString());
    console.log('Current time (local):', now.toString());
    
    if (isScheduled) {
      postData.isScheduled = true;
      
      if (req.user.role === 'admin') {
        // Admin with CRUD access can schedule directly
        if (req.user.hasCRUDAccess) {
          console.log('Admin with CRUD access scheduling directly');
          postData.scheduleApproved = true;
          postData.scheduleApprovedBy = req.user._id;
          postData.scheduleApprovedAt = Date.now();
          postData.status = 'scheduled';
        } else {
          // Admin without CRUD access needs approval
          console.log('Admin without CRUD access needs approval');
          postData.scheduleApproved = false;
          postData.status = 'pending_approval';
        }
      } else if (req.user.role === 'superadmin') {
        // Superadmin can schedule directly
        console.log('Superadmin scheduling directly');
        postData.scheduleApproved = true;
        postData.scheduleApprovedBy = req.user._id;
        postData.scheduleApprovedAt = Date.now();
        postData.status = 'scheduled';
      }
    } else {
      // NOT scheduled - Immediate publication
      console.log('Not scheduled - checking direct publication rights');
      
      if (req.user.role === 'admin' && req.user.hasCRUDAccess) {
        // Admin with CRUD access can publish directly
        console.log('Admin with CRUD access publishing directly');
        postData.status = 'published';
        postData.publishDateTime = new Date(); // Set to now
      } else if (req.user.role === 'superadmin') {
        // Superadmin can publish directly
        console.log('Superadmin publishing directly');
        postData.status = 'published';
        postData.publishDateTime = new Date();
      } else {
        // Admin without CRUD access needs approval
        console.log('Admin without CRUD access needs approval');
        postData.status = 'pending_approval';
      }
    }
    
    // Ensure publishDateTime is a proper Date object
    if (postData.publishDateTime && typeof postData.publishDateTime === 'string') {
      postData.publishDateTime = new Date(postData.publishDateTime);
    }
    
    console.log('Final post data:', JSON.stringify(postData, null, 2));
    
    const post = await Post.create(postData);
    
    // If admin without CRUD access created a scheduled post, create AdminPost for approval
    if (req.user.role === 'admin' && !req.user.hasCRUDAccess && post.isScheduled && !post.scheduleApproved) {
      const adminPostData = {
        ...postData,
        postId: post._id,
        isScheduledPost: true,
        approvalStatus: 'scheduled_pending'
      };
      
      await AdminPost.create(adminPostData);
    }
    
    // Log activity with CRUD mode info
    await Activity.create({
      type: 'create',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { 
        category: post.category, 
        status: post.status,
        isScheduled: post.isScheduled,
        scheduleApproved: post.scheduleApproved,
        publishDateTime: post.publishDateTime,
        createdWithCRUD: req.user.hasCRUDAccess || false,
        userRole: req.user.role
      }
    });
    
    console.log('=== CREATE POST COMPLETED ===');
    
    res.status(201).json({
      success: true,
      message: req.user.hasCRUDAccess ? 'Post created successfully' : 'Post created - scheduled posts need approval',
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

// @desc    Update post with CRUD access consideration
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if user can update this post
    if (req.user.role === 'admin') {
      const isOwnPost = post.authorId.toString() === req.user._id.toString();
      
      // Admin can update:
      // 1. Their own posts
      // 2. Any post if they have CRUD access
      if (!isOwnPost && !req.user.hasCRUDAccess) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own posts'
        });
      }
      
      // If admin doesn't have CRUD access, they cannot directly update published posts
      if (!req.user.hasCRUDAccess && post.status === 'published') {
        return res.status(403).json({
          success: false,
          message: 'Admin must use approval system to update published posts. Please use the "Request Update" feature.'
        });
      }
      
      // Admin without CRUD access cannot update approved scheduled posts
      if (!req.user.hasCRUDAccess && post.isScheduled && post.scheduleApproved) {
        return res.status(403).json({
          success: false,
          message: 'Cannot update approved scheduled post. Please cancel and create new.'
        });
      }
    }
    
    // Superadmin can update any post
    // Admin with CRUD access can update any post (checked above)
    
    console.log('=== UPDATE POST STARTED ===');
    console.log('Original post status:', post.status);
    console.log('Original publishDateTime:', post.publishDateTime);
    console.log('Original publishDateTime (ISO):', post.publishDateTime?.toISOString());
    console.log('User role:', req.user.role);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
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
    
    const now = new Date();
    
    // IMPORTANT: If post is already published, update the publishDateTime to now
    // This ensures the "Last Updated" time is correct
    if (post.status === 'published') {
      console.log('Post is already published. Updating publishDateTime to current time.');
      updateData.publishDateTime = now;
      updateData.lastUpdatedAt = now;
    }
    
    // Check if updating to scheduled post
    if (updateData.publishDateTime && new Date(updateData.publishDateTime) > new Date()) {
      updateData.isScheduled = true;
      
      if (req.user.role === 'admin') {
        if (req.user.hasCRUDAccess) {
          // Admin with CRUD access can schedule directly
          updateData.scheduleApproved = true;
          updateData.scheduleApprovedBy = req.user._id;
          updateData.scheduleApprovedAt = Date.now();
          updateData.status = 'scheduled';
        } else {
          // Admin without CRUD access needs approval
          updateData.scheduleApproved = false;
          updateData.status = 'pending_approval';
          
          // Create AdminPost for approval
          const adminPostData = {
            ...updateData,
            authorId: post.authorId,
            postId: post._id,
            isScheduledPost: true,
            approvalStatus: 'scheduled_pending'
          };
          
          // Check if AdminPost already exists
          let adminPost = await AdminPost.findOne({ postId: post._id });
          if (adminPost) {
            adminPost = await AdminPost.findByIdAndUpdate(
              adminPost._id,
              adminPostData,
              { new: true, runValidators: true }
            );
          } else {
            adminPost = await AdminPost.create(adminPostData);
          }
        }
      } else if (req.user.role === 'superadmin') {
        // Superadmin can schedule directly
        updateData.scheduleApproved = true;
        updateData.scheduleApprovedBy = req.user._id;
        updateData.scheduleApprovedAt = Date.now();
        updateData.status = 'scheduled';
      }
    } else if (updateData.publishDateTime && new Date(updateData.publishDateTime) <= new Date()) {
      // If publish date is in past, remove schedule
      updateData.isScheduled = false;
      updateData.scheduleApproved = false;
      
      // If it was scheduled but the date has passed, publish it now
      if (post.isScheduled) {
        console.log('Scheduled date has passed. Publishing now.');
        updateData.status = 'published';
        updateData.publishDateTime = now;
        updateData.lastApprovedBy = req.user._id;
        updateData.lastApprovedAt = now;
      }
    }
    
    console.log('Final update data:', JSON.stringify(updateData, null, 2));
    console.log('New publishDateTime:', updateData.publishDateTime);
    
    // Update the post
    post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('authorId', 'name email');
    
    // Log activity with CRUD mode info
    await Activity.create({
      type: 'update',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { 
        ...updateData,
        updatedBy: req.user.role,
        updatedWithCRUD: req.user.hasCRUDAccess || false,
        wasPublished: true,
        previousPublishDateTime: post.publishDateTime,
        newPublishDateTime: updateData.publishDateTime
      }
    });
    
    console.log('=== UPDATE POST COMPLETED ===');
    
    res.status(200).json({
      success: true,
      message: req.user.hasCRUDAccess ? 'Post updated successfully' : 'Post update submitted for approval',
      data: post
    });
    
  } catch (error) {
    console.error('Update post error:', error);
    
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

// @desc    Request update for published post (Admin only - for those without CRUD access)
// @route   PUT /api/posts/:id/request-update
// @access  Private (Admin only)
exports.requestUpdate = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Only admin can request updates for published posts
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can request updates for published posts'
      });
    }
    
    // Admin with CRUD access should use direct update, not request update
    if (req.user.hasCRUDAccess) {
      return res.status(400).json({
        success: false,
        message: 'You have CRUD access. Please use the direct update feature instead.'
      });
    }
    
    // Check if user owns this post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only request updates for your own posts'
      });
    }
    
    // Only published posts can have update requests
    if (post.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Only published posts can have update requests'
      });
    }
    
    // Check if there's already an update request for this post
    const existingAdminPost = await AdminPost.findOne({
      postId: post._id,
      isUpdateRequest: true,
      approvalStatus: { $in: ['pending_review', 'scheduled_pending'] }
    });
    
    if (existingAdminPost) {
      return res.status(400).json({
        success: false,
        message: 'An update request is already pending for this post'
      });
    }
    
    // Create AdminPost for update request
    const adminPostData = {
      title: post.title,
      shortTitle: post.shortTitle,
      body: post.body,
      category: post.category,
      tags: post.tags,
      region: post.region,
      author: post.author,
      authorId: post.authorId,
      publishDateTime: post.publishDateTime,
      isSponsored: post.isSponsored,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      imageUrl: post.imageUrl,
      approvalStatus: 'pending_review',
      postId: post._id,
      isUpdateRequest: true,
      isScheduledPost: false,
      originalPostData: post.toObject()
    };
    
    const adminPost = await AdminPost.create(adminPostData);
    
    // Log activity
    await Activity.create({
      type: 'update_request',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      adminPostId: adminPost._id,
      details: { 
        type: 'update_request_created',
        status: 'pending_review',
        adminCRUDAccess: req.user.hasCRUDAccess || false
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Update request submitted successfully',
      data: {
        post,
        adminPost
      }
    });
    
  } catch (error) {
    console.error('Request update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Delete post with CRUD access consideration
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Superadmin can delete any post
    // Admin with CRUD access can delete their own posts
    // Admin without CRUD access cannot delete posts
    if (req.user.role === 'admin') {
      const isOwnPost = post.authorId.toString() === req.user._id.toString();
      
      if (!req.user.hasCRUDAccess) {
        return res.status(403).json({
          success: false,
          message: 'CRUD access is required to delete posts'
        });
      }
      
      if (!isOwnPost) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own posts'
        });
      }
    }
    
    // Also delete associated AdminPosts
    await AdminPost.deleteMany({ postId: post._id });
    
    // Log activity
    await Activity.create({
      type: 'delete',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { 
        category: post.category,
        deletedWithCRUD: req.user.hasCRUDAccess || false
      }
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

// @desc    Publish post with CRUD access consideration
// @route   PUT /api/posts/:id/publish
// @access  Private
exports.publishPost = async (req, res) => {
  try {
    console.log('=== PUBLISH POST STARTED ===');
    console.log('User:', req.user.name, req.user.role);
    console.log('User hasCRUDAccess:', req.user.hasCRUDAccess);
    
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    console.log('Post status before:', post.status);
    console.log('Post isScheduled:', post.isScheduled);
    console.log('Post scheduleApproved:', post.scheduleApproved);
    
    // Superadmin can publish any post
    // Admin with CRUD access can publish their own posts
    if (req.user.role === 'admin') {
      const isOwnPost = post.authorId.toString() === req.user._id.toString();
      
      if (!req.user.hasCRUDAccess) {
        return res.status(403).json({
          success: false,
          message: 'CRUD access is required to publish posts'
        });
      }
      
      if (!isOwnPost) {
        return res.status(403).json({
          success: false,
          message: 'You can only publish your own posts'
        });
      }
    }
    
    // Check if it's a scheduled post
    if (post.isScheduled) {
      // For scheduled posts, only publish if scheduled time has passed OR manually publishing
      const now = new Date();
      const scheduledTime = new Date(post.publishDateTime);
      
      if (scheduledTime > now) {
        // It's still in the future, keep it as scheduled
        post.status = 'scheduled';
        post.scheduleApproved = true;
        post.scheduleApprovedBy = req.user._id;
        post.scheduleApprovedAt = Date.now();
        console.log('Post remains scheduled for future date');
      } else {
        // Scheduled time has passed, publish it
        post.status = 'published';
        post.publishDateTime = now;
        console.log('Scheduled post published now');
      }
    } else {
      // Not a scheduled post, publish immediately
      post.status = 'published';
      post.publishDateTime = new Date();
      console.log('Regular post published');
    }
    
    post.lastApprovedBy = req.user._id;
    post.lastApprovedAt = Date.now();
    
    // If it was scheduled but not approved yet, update schedule approval
    if (post.isScheduled && !post.scheduleApproved) {
      post.scheduleApproved = true;
      post.scheduleApprovedBy = req.user._id;
      post.scheduleApprovedAt = Date.now();
    }
    
    await post.save();
    
    // Update AdminPost if exists
    await AdminPost.findOneAndUpdate(
      { postId: post._id },
      {
        scheduleApproved: true,
        scheduleApprovedBy: req.user._id,
        scheduleApprovedAt: Date.now(),
        approvalStatus: 'approved',
        status: 'published'
      }
    );
    
    // Log activity
    await Activity.create({
      type: 'publish',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: {
        publishedWithCRUD: req.user.hasCRUDAccess || false,
        previousStatus: post.status,
        isScheduled: post.isScheduled,
        publishDateTime: post.publishDateTime
      }
    });
    
    console.log('Post status after:', post.status);
    console.log('=== PUBLISH POST COMPLETED ===');
    
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

// @desc    Create draft (Admin can create drafts, CRUD access not required)
// @route   POST /api/posts/draft
// @access  Private (Admin & Superadmin)
exports.createDraft = async (req, res) => {
  try {
    let postData = {
      ...req.body,
      authorId: req.user._id,
    };
    
    // Check if it's a scheduled post
    const isScheduledPost = postData.publishDateTime && 
      new Date(postData.publishDateTime) > new Date();
    
    if (isScheduledPost) {
      // For scheduled posts, set status based on user role and CRUD access
      if (req.user.role === 'admin') {
        if (req.user.hasCRUDAccess) {
          // Admin with CRUD access can schedule directly
          postData.status = 'scheduled';
          postData.isScheduled = true;
          postData.scheduleApproved = true;
          postData.scheduleApprovedBy = req.user._id;
          postData.scheduleApprovedAt = Date.now();
        } else {
          // Admin without CRUD access needs approval
          postData.status = 'pending_approval';
          postData.isScheduled = true;
          postData.scheduleApproved = false;
        }
      } else if (req.user.role === 'superadmin') {
        // Superadmin can schedule directly
        postData.status = 'scheduled';
        postData.isScheduled = true;
        postData.scheduleApproved = true;
        postData.scheduleApprovedBy = req.user._id;
        postData.scheduleApprovedAt = Date.now();
      }
    } else {
      // Regular draft
      postData.status = 'draft';
    }
    
    // Handle tags
    if (postData.tags && typeof postData.tags === 'string') {
      postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const post = await Post.create(postData);
    
    // If admin without CRUD access created a scheduled post, also create AdminPost for approval
    if (req.user.role === 'admin' && !req.user.hasCRUDAccess && isScheduledPost) {
      const adminPostData = {
        ...postData,
        postId: post._id,
        isScheduledPost: true,
        approvalStatus: 'scheduled_pending'
      };
      
      await AdminPost.create(adminPostData);
    }
    
    // Log activity
    await Activity.create({
      type: 'create',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { 
        type: isScheduledPost ? 'scheduled_draft_created' : 'draft_created',
        category: post.category,
        status: post.status,
        isScheduled: isScheduledPost,
        createdWithCRUD: req.user.hasCRUDAccess || false
      }
    });
    
    res.status(201).json({
      success: true,
      message: isScheduledPost ? 
        (req.user.hasCRUDAccess ? 'Scheduled draft created' : 'Scheduled draft created - pending approval') : 
        'Draft created successfully',
      data: post
    });
    
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Submit draft for approval (for admin without CRUD access)
// @route   PUT /api/posts/:id/submit-for-approval
// @access  Private (Admin only)
exports.submitForApproval = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Only admin can submit their own drafts for approval
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can submit drafts for approval'
      });
    }
    
    // Admin with CRUD access should publish directly
    if (req.user.hasCRUDAccess) {
      return res.status(400).json({
        success: false,
        message: 'You have CRUD access. Please use the publish feature instead.'
      });
    }
    
    // Check if user owns this post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own drafts for approval'
      });
    }
    
    // Check if post is a scheduled post that needs approval
    if (post.isScheduled && !post.scheduleApproved) {
      // Update post status to pending_approval
      post.status = 'pending_approval';
      await post.save();
      
      // Create or update AdminPost for approval
      const adminPostData = {
        title: post.title,
        shortTitle: post.shortTitle,
        body: post.body,
        category: post.category,
        tags: post.tags,
        region: post.region,
        author: post.author,
        authorId: post.authorId,
        publishDateTime: post.publishDateTime,
        isSponsored: post.isSponsored,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        imageUrl: post.imageUrl,
        postId: post._id,
        isScheduledPost: true,
        isUpdateRequest: false,
        approvalStatus: 'scheduled_pending'
      };
      
      // Check if AdminPost already exists
      let adminPost = await AdminPost.findOne({ postId: post._id });
      if (adminPost) {
        adminPost = await AdminPost.findByIdAndUpdate(
          adminPost._id,
          adminPostData,
          { new: true, runValidators: true }
        );
      } else {
        adminPost = await AdminPost.create(adminPostData);
      }
      
      // Log activity
      await Activity.create({
        type: 'submission',
        userId: req.user._id,
        user: req.user.name,
        title: post.title,
        postId: post._id,
        adminPostId: adminPost._id,
        details: { 
          type: 'scheduled_post_submitted',
          status: 'scheduled_pending',
          publishDateTime: post.publishDateTime,
          adminCRUDAccess: req.user.hasCRUDAccess || false
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Scheduled post submitted for approval',
        data: {
          post,
          adminPost
        }
      });
    }
    
    // For regular non-scheduled posts
    // Only drafts can be submitted for approval
    if (post.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft posts can be submitted for approval'
      });
    }
    
    // Create admin post for approval
    const adminPostData = {
      title: post.title,
      shortTitle: post.shortTitle,
      body: post.body,
      category: post.category,
      tags: post.tags,
      region: post.region,
      author: post.author,
      authorId: post.authorId,
      publishDateTime: post.publishDateTime,
      isSponsored: post.isSponsored,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      imageUrl: post.imageUrl,
      approvalStatus: 'pending_review',
      isUpdateRequest: false
    };
    
    const adminPost = await AdminPost.create(adminPostData);
    
    // Update post status to pending_approval
    post.status = 'pending_approval';
    post.submittedForApprovalAt = Date.now();
    await post.save();
    
    // Link admin post to original post
    adminPost.postId = post._id;
    await adminPost.save();
    
    // Log activity
    await Activity.create({
      type: 'submission',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      adminPostId: adminPost._id,
      details: { 
        type: 'draft_submitted',
        status: 'pending_review',
        adminCRUDAccess: req.user.hasCRUDAccess || false
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Draft submitted for approval',
      data: {
        post,
        adminPost
      }
    });
    
  } catch (error) {
    console.error('Submit for approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};



// @desc    Approve scheduled post
// @route   PUT /api/posts/:id/approve-schedule
// @access  Private (Superadmin only)
exports.approveSchedule = async (req, res) => {
  try {
    console.log('=== APPROVE SCHEDULE STARTED ===');
    console.log('Approval ID:', req.params.id);
    console.log('User:', req.user.name, req.user.role);
    
    // Only superadmin can approve scheduled posts
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can approve scheduled posts'
      });
    }
    
    // Try to find in AdminPost first
    let adminPost = await AdminPost.findById(req.params.id)
      .populate('authorId', 'name email');
    
    if (adminPost) {
      console.log('Found AdminPost:', adminPost._id);
      
      // Check if there's already a Post linked
      let post = null;
      if (adminPost.postId) {
        post = await Post.findById(adminPost.postId);
        console.log('Found linked Post:', post?._id);
      }
      
      // If no Post exists, create one
      if (!post) {
        console.log('Creating new Post from AdminPost');
        post = await Post.create({
          title: adminPost.title,
          shortTitle: adminPost.shortTitle,
          body: adminPost.body,
          category: adminPost.category,
          tags: adminPost.tags,
          region: adminPost.region,
          author: adminPost.author,
          authorId: adminPost.authorId,
          publishDateTime: adminPost.publishDateTime,
          isSponsored: adminPost.isSponsored,
          metaTitle: adminPost.metaTitle,
          metaDescription: adminPost.metaDescription,
          imageUrl: adminPost.imageUrl,
          status: 'scheduled',
          isScheduled: true,
          scheduleApproved: true,
          scheduleApprovedBy: req.user._id,
          scheduleApprovedAt: new Date(),
          createdAt: adminPost.createdAt || new Date()
        });
        
        console.log('Created Post:', post._id);
        
        // Update AdminPost with Post reference
        adminPost.postId = post._id;
      } else {
        // Update existing Post
        post.isScheduled = true;
        post.scheduleApproved = true;
        post.scheduleApprovedBy = req.user._id;
        post.scheduleApprovedAt = new Date();
        post.status = 'scheduled';
        await post.save();
        console.log('Updated existing Post:', post._id);
      }
      
      // Update AdminPost status
      adminPost.scheduleApproved = true;
      adminPost.scheduleApprovedBy = req.user._id;
      adminPost.scheduleApprovedAt = new Date();
      adminPost.approvalStatus = 'scheduled_approved';
      await adminPost.save();
      console.log('Updated AdminPost:', adminPost._id);
      
      // Log activity with correct enum value
      await Activity.create({
        type: 'update', // Changed from 'approval' to 'update'
        userId: req.user._id,
        user: req.user.name,
        title: adminPost.title,
        postId: post._id,
        details: {
          type: 'schedule_approved',
          reason: 'Scheduled post approved by superadmin',
          publishDateTime: adminPost.publishDateTime,
          approvedBy: req.user.name,
          source: 'AdminPost'
        }
      });
      
      console.log('=== APPROVE SCHEDULE COMPLETED (AdminPost) ===');
      
      return res.status(200).json({
        success: true,
        message: 'Scheduled post approved successfully',
        data: {
          post,
          adminPost
        }
      });
    }
    
    // If not found in AdminPost, try Post collection
    let post = await Post.findById(req.params.id)
      .populate('authorId', 'name email');
    
    if (post) {
      console.log('Found Post:', post._id);
      
      // Check if post is scheduled
      if (!post.isScheduled) {
        return res.status(400).json({
          success: false,
          message: 'Post is not scheduled'
        });
      }
      
      // Check if already approved
      if (post.scheduleApproved) {
        return res.status(200).json({
          success: true,
          message: 'Schedule already approved',
          data: post
        });
      }
      
      // Approve the schedule
      post.scheduleApproved = true;
      post.scheduleApprovedBy = req.user._id;
      post.scheduleApprovedAt = new Date();
      post.status = 'scheduled';
      await post.save();
      
      console.log('Approved Post:', post._id);
      
      // Log activity with correct enum value
      await Activity.create({
        type: 'update', // Changed from 'approval' to 'update'
        userId: req.user._id,
        user: req.user.name,
        title: post.title,
        postId: post._id,
        details: {
          type: 'schedule_approved',
          reason: 'Scheduled post approved by superadmin',
          publishDateTime: post.publishDateTime,
          approvedBy: req.user.name,
          source: 'Post'
        }
      });
      
      console.log('=== APPROVE SCHEDULE COMPLETED (Post) ===');
      
      return res.status(200).json({
        success: true,
        message: 'Scheduled post approved successfully',
        data: post
      });
    }
    
    // If neither found
    console.log('ERROR: Post not found with ID:', req.params.id);
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
    
  } catch (error) {
    console.error('Approve schedule error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Reject scheduled post
// @route   PUT /api/posts/:id/reject-schedule
// @access  Private (Superadmin only)
exports.rejectSchedule = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    console.log('=== REJECT SCHEDULE STARTED ===');
    console.log('Post ID from request:', req.params.id);
    console.log('Rejection reason:', rejectionReason);
    
    // CRITICAL FIX: Use proper ID detection
    const postId = req.params.id;
    
    // First try to find and update Post
    let post = await Post.findById(postId);
    let adminPost = await AdminPost.findOne({ 
      $or: [
        { _id: postId },
        { postId: postId }
      ] 
    });
    
    console.log('Found Post:', !!post);
    console.log('Found AdminPost:', !!adminPost);
    
    if (!post && !adminPost) {
      console.log('ERROR: Neither Post nor AdminPost found');
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Only superadmin can reject scheduled posts
    if (req.user.role !== 'superadmin') {
      console.log('ERROR: Unauthorized user role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can reject scheduled posts'
      });
    }
    
    // CRITICAL: Track what we're processing
    let processedPost = null;
    
    // Process Post if exists
    if (post) {
      console.log('Processing Post rejection for:', post.title);
      
      // CRITICAL FIX: Always update these fields for Post
      post.scheduleApproved = false;
      post.status = 'draft';
      post.isScheduled = false;
      post.rejectionReason = rejectionReason || 'Schedule rejected by superadmin';
      post.updatedAt = new Date();
      
      // Also remove schedule approval fields
      post.scheduleApprovedBy = null;
      post.scheduleApprovedAt = null;
      
      await post.save();
      processedPost = post;
      console.log('Post rejected and saved as draft. New status:', {
        status: post.status,
        isScheduled: post.isScheduled,
        scheduleApproved: post.scheduleApproved,
        rejectionReason: post.rejectionReason
      });
    }
    
    // Process AdminPost if exists
    if (adminPost) {
      console.log('Processing AdminPost rejection for:', adminPost.title);
      
      // CRITICAL FIX: Properly update ALL relevant fields for AdminPost
      adminPost.approvalStatus = 'rejected';
      adminPost.scheduleApproved = false;
      adminPost.isScheduledPost = false;
      adminPost.rejectionReason = rejectionReason || 'Schedule rejected by superadmin';
      adminPost.updatedAt = new Date();
      
      // Remove schedule approval fields
      adminPost.scheduleApprovedBy = null;
      adminPost.scheduleApprovedAt = null;
      
      await adminPost.save();
      processedPost = adminPost;
      console.log('AdminPost rejected. New status:', {
        approvalStatus: adminPost.approvalStatus,
        scheduleApproved: adminPost.scheduleApproved,
        isScheduledPost: adminPost.isScheduledPost,
        rejectionReason: adminPost.rejectionReason
      });
      
      // Also update linked Post if it exists
      if (adminPost.postId) {
        await Post.findByIdAndUpdate(adminPost.postId, {
          scheduleApproved: false,
          status: 'draft',
          isScheduled: false,
          rejectionReason: rejectionReason || 'Schedule rejected by superadmin',
          updatedAt: new Date()
        });
        console.log('Updated linked Post:', adminPost.postId);
      }
    }
    
    // CRITICAL FIX: Create proper activity log
    try {
      await Activity.create({
        type: 'update',
        userId: req.user._id,
        user: req.user.name,
        title: processedPost?.title || 'Unknown',
        postId: processedPost?._id || postId,
        adminPostId: adminPost?._id || null,
        details: {
          type: 'schedule_rejected',
          reason: rejectionReason,
          rejectedBy: req.user.name,
          source: post ? 'Post' : 'AdminPost',
          originalStatus: 'scheduled_pending',
          newStatus: 'draft',
          publishDateTime: processedPost?.publishDateTime
        }
      });
      console.log('Activity logged: schedule_rejected');
    } catch (activityError) {
      console.error('Activity logging error:', activityError.message);
    }
    
    console.log('=== REJECT SCHEDULE COMPLETED ===');
    
    res.status(200).json({
      success: true,
      message: 'Scheduled post rejected successfully',
      data: processedPost || { _id: postId, status: 'rejected' }
    });
    
  } catch (error) {
    console.error('Reject schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// @desc    Cancel scheduled post (Admin can cancel their own, Superadmin can cancel any)
// @route   PUT /api/posts/:id/cancel-schedule
// @access  Private
exports.cancelSchedule = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'admin') {
      // Admin can only cancel their own scheduled posts
      if (post.authorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel your own scheduled posts'
        });
      }
      
      // Admin can only cancel posts that are not approved yet
      if (post.scheduleApproved) {
        return res.status(403).json({
          success: false,
          message: 'Cannot cancel approved scheduled post'
        });
      }
    }
    
    // Check if post is scheduled
    if (!post.isScheduled) {
      return res.status(400).json({
        success: false,
        message: 'Post is not scheduled'
      });
    }
    
    // Cancel the schedule
    post.isScheduled = false;
    post.scheduleApproved = false;
    post.status = 'draft';
    post.publishDateTime = null;
    await post.save();
    
    // Update or delete AdminPost
    await AdminPost.findOneAndDelete({ postId: post._id });
    
    // Log activity
    await Activity.create({
      type: 'update',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { 
        type: 'schedule_cancelled',
        cancelledBy: req.user.name
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Scheduled post cancelled and moved to drafts',
      data: post
    });
    
  } catch (error) {
    console.error('Cancel schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// In the getScheduledPosts function, use aggregation to avoid the cast error
exports.getScheduledPosts = async (req, res) => {
  try {
    console.log('=== GET SCHEDULED POSTS ===');
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?._id);
    
    const matchStage = { 
      isScheduled: true,
      scheduleApproved: true,
      status: 'scheduled'
    };
    
    // Filter by author if admin (not superadmin)
    if (req.user.role === 'admin') {
      matchStage.authorId = new mongoose.Types.ObjectId(req.user._id);
    }
    
    console.log('Match stage for scheduled posts:', JSON.stringify(matchStage, null, 2));
    
    // Use aggregation to handle category gracefully
    const posts = await Post.aggregate([
      { $match: matchStage },
      { $sort: { publishDateTime: 1 } },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$categoryId'] },
                    { $and: [
                      { $eq: [{ $type: '$$categoryId' }, 'string'] },
                      { $eq: ['$name', '$$categoryId'] }
                    ]}
                  ]
                }
              }
            }
          ],
          as: 'categoryDetails'
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'authorId',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryDetails', 0] },
          authorId: { $arrayElemAt: ['$authorDetails', 0] },
          categoryName: {
            $cond: {
              if: { $eq: [{ $type: '$category' }, 'string'] },
              then: '$category',
              else: { $arrayElemAt: ['$categoryDetails.name', 0] }
            }
          }
        }
      },
      {
        $project: {
          title: 1,
          shortTitle: 1,
          body: 1,
          category: 1,
          categoryName: 1,
          tags: 1,
          region: 1,
          author: 1,
          authorId: { 
            _id: '$authorId._id',
            name: '$authorId.name',
            email: '$authorId.email'
          },
          publishDateTime: 1,
          isSponsored: 1,
          metaTitle: 1,
          metaDescription: 1,
          imageUrl: 1,
          status: 1,
          isScheduled: 1,
          scheduleApproved: 1,
          rejectionReason: 1,
          createdAt: 1,
          updatedAt: 1,
          source: { $literal: 'Post' }
        }
      }
    ]);
    
    console.log(`Found ${posts.length} scheduled posts`);
    
    // Format category names
    const formattedPosts = posts.map(post => {
      const categoryName = post.categoryName || 
        (post.category?.name) || 
        (typeof post.category === 'string' ? post.category : 'Uncategorized');
      
      return {
        ...post,
        categoryName,
        authorName: post.authorId?.name || post.author || 'Unknown'
      };
    });
    
    res.status(200).json({
      success: true,
      count: formattedPosts.length,
      data: formattedPosts,
      message: `Found ${formattedPosts.length} scheduled posts`
    });
    
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// In the getPendingScheduleApprovals function, use similar aggregation
exports.getPendingScheduleApprovals = async (req, res) => {
  console.log('\n=== GET PENDING SCHEDULE APPROVALS ===');
  console.log('User:', req.user?.name, 'Role:', req.user?.role);
  
  try {
    // 1. Check authentication
    if (!req.user || !req.user._id) {
      console.log('ERROR: No authenticated user found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // 2. Check authorization - Allow superadmin only
    if (req.user.role !== 'superadmin') {
      console.log('ERROR: Unauthorized access attempt by role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view pending schedule approvals'
      });
    }
    
    console.log('User authorized as superadmin');
    
    // 3. Get pending approvals from Post collection using aggregation
    const postsFromPostCollection = await Post.aggregate([
      {
        $match: {
          isScheduled: true,
          scheduleApproved: false,
          status: { $in: ['pending_approval', 'draft'] },
          publishDateTime: { $ne: null }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$categoryId'] },
                    { $and: [
                      { $eq: [{ $type: '$$categoryId' }, 'string'] },
                      { $eq: ['$name', '$$categoryId'] }
                    ]}
                  ]
                }
              }
            }
          ],
          as: 'categoryDetails'
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'authorId',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryDetails', 0] },
          authorId: { $arrayElemAt: ['$authorDetails', 0] },
          categoryName: {
            $cond: {
              if: { $eq: [{ $type: '$category' }, 'string'] },
              then: '$category',
              else: { $arrayElemAt: ['$categoryDetails.name', 0] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          shortTitle: 1,
          body: 1,
          category: 1,
          categoryName: 1,
          tags: 1,
          region: 1,
          author: 1,
          authorId: { 
            _id: '$authorId._id',
            name: '$authorId.name',
            email: '$authorId.email'
          },
          publishDateTime: 1,
          isSponsored: 1,
          metaTitle: 1,
          metaDescription: 1,
          imageUrl: 1,
          status: 1,
          isScheduled: 1,
          scheduleApproved: 1,
          rejectionReason: 1,
          createdAt: 1,
          updatedAt: 1,
          source: { $literal: 'Post' },
          type: { $literal: 'scheduled_pending' }
        }
      }
    ]);
    
    console.log(`Found ${postsFromPostCollection.length} posts from Post collection`);
    
    // 4. Get pending approvals from AdminPost collection using aggregation
    const postsFromAdminPostCollection = await AdminPost.aggregate([
      {
        $match: {
          isScheduledPost: true,
          scheduleApproved: false,
          approvalStatus: { $in: ['scheduled_pending', 'pending_review'] },
          $or: [
            { postId: { $exists: false } },
            { postId: null }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: '$category' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$categoryId'] },
                    { $and: [
                      { $eq: [{ $type: '$$categoryId' }, 'string'] },
                      { $eq: ['$name', '$$categoryId'] }
                    ]}
                  ]
                }
              }
            }
          ],
          as: 'categoryDetails'
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'authorId',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryDetails', 0] },
          authorId: { $arrayElemAt: ['$authorDetails', 0] },
          categoryName: {
            $cond: {
              if: { $eq: [{ $type: '$category' }, 'string'] },
              then: '$category',
              else: { $arrayElemAt: ['$categoryDetails.name', 0] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          shortTitle: 1,
          body: 1,
          category: 1,
          categoryName: 1,
          tags: 1,
          region: 1,
          author: 1,
          authorId: { 
            _id: '$authorId._id',
            name: '$authorId.name',
            email: '$authorId.email'
          },
          publishDateTime: 1,
          isSponsored: 1,
          metaTitle: 1,
          metaDescription: 1,
          imageUrl: 1,
          status: { $literal: 'pending_approval' },
          isScheduled: { $literal: true },
          scheduleApproved: 1,
          rejectionReason: 1,
          approvalStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          source: { $literal: 'AdminPost' },
          type: { $literal: 'scheduled_pending' },
          adminPostId: '$_id'
        }
      }
    ]);
    
    console.log(`Found ${postsFromAdminPostCollection.length} posts from AdminPost collection`);
    
    // 5. Combine results
    const allPendingPosts = [
      ...postsFromPostCollection,
      ...postsFromAdminPostCollection
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`Total pending schedule approvals: ${allPendingPosts.length}`);
    
    // 6. Send response
    res.status(200).json({
      success: true,
      count: allPendingPosts.length,
      data: allPendingPosts,
      message: `Found ${allPendingPosts.length} pending schedule approvals`,
      timestamp: new Date().toISOString()
    });
    
    console.log('=== GET PENDING SCHEDULE APPROVALS COMPLETED ===');
    
  } catch (error) {
    console.error('\n=== ERROR IN getPendingScheduleApprovals ===');
    console.error('Error:', error.message);
    console.error('Error Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending schedule approvals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

// @desc    Get pending schedule approvals
// @route   GET /api/posts/pending-schedule
// @access  Private (Superadmin only)
exports.getPendingScheduleApprovals = async (req, res) => {
  console.log('\n=== GET PENDING SCHEDULE APPROVALS ===');
  console.log('User:', req.user?.name, 'Role:', req.user?.role);
  
  try {
    // 1. Check authentication
    if (!req.user || !req.user._id) {
      console.log('ERROR: No authenticated user found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // 2. Check authorization - Allow superadmin only
    if (req.user.role !== 'superadmin') {
      console.log('ERROR: Unauthorized access attempt by role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view pending schedule approvals'
      });
    }
    
    console.log('User authorized as superadmin');
    
    // 3. Get pending approvals from Post collection with custom handling for string categories
    const postQuery = {
      isScheduled: true,
      scheduleApproved: false,
      status: { $in: ['pending_approval', 'draft'] },
      publishDateTime: { $ne: null },
      rejectionReason: { $exists: false }
    };
    
    console.log('Querying Post collection:', JSON.stringify(postQuery, null, 2));
    
    // First get posts without populate to avoid cast error
    const postsFromPostCollection = await Post.find(postQuery)
      .sort({ createdAt: -1 })
      .populate('authorId', 'name email')
      .lean()
      .exec();
    
    console.log(`Found ${postsFromPostCollection.length} posts from Post collection`);
    
    // 4. Get pending approvals from AdminPost collection
    const adminPostQuery = {
  isScheduledPost: true,
  scheduleApproved: false,
  approvalStatus: { $in: ['scheduled_pending', 'pending_review'] },
  $or: [
    { postId: { $exists: false } },
    { postId: null }
  ],
  // Exclude rejected posts but include pending ones
  $or: [
    // Option 1: approvalStatus is not 'rejected' AND rejectionReason is not set
    {
      approvalStatus: { $ne: 'rejected' },
      $or: [
        { rejectionReason: null },
        { rejectionReason: { $exists: false } }
      ]
    },
    // Option 2: approvalStatus doesn't exist (old records)
    { approvalStatus: { $exists: false } }
  ]
};
    
    console.log('Querying AdminPost collection:', JSON.stringify(adminPostQuery, null, 2));
    
    const postsFromAdminPostCollection = await AdminPost.find(adminPostQuery)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`Found ${postsFromAdminPostCollection.length} posts from AdminPost collection`);
    
    // 5. Helper function to safely get category name
    const getCategoryName = async (category) => {
      if (!category) return 'Uncategorized';
      
      if (typeof category === 'object' && category.name) {
        return category.name;
      } else if (typeof category === 'string') {
        // Check if it's a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(category)) {
          try {
            // Try to find the category by ID
            const Category = require('../models/Category');
            const cat = await Category.findById(category).lean();
            return cat ? cat.name : `Category ID: ${category.substring(0, 8)}...`;
          } catch (error) {
            console.error('Error fetching category:', error.message);
            return `Category ID: ${category.substring(0, 8)}...`;
          }
        } else {
          // Treat as category name string (like "Indian")
          return category;
        }
      }
      
      return 'Uncategorized';
    };
    
    // Helper function to get author info
    const getAuthorInfo = async (authorId) => {
      if (!authorId) return { name: 'Unknown', email: '' };
      
      try {
        const Admin = require('../models/admin');
        const admin = await Admin.findById(authorId).select('name email').lean();
        return admin || { name: 'Unknown', email: '' };
      } catch (error) {
        console.error('Error fetching author:', error.message);
        return { name: 'Unknown', email: '' };
      }
    };
    
    // 6. Process Post collection results
    const formattedPosts = [];
    
    for (const post of postsFromPostCollection) {
      const categoryName = await getCategoryName(post.category);
      const authorInfo = await getAuthorInfo(post.authorId);
      
      const formattedPost = {
        _id: post._id,
        title: post.title,
        shortTitle: post.shortTitle || post.title.substring(0, 100),
        body: post.body,
        category: post.category,
        categoryName,
        tags: post.tags || [],
        region: post.region || 'India',
        author: post.author || authorInfo.name,
        authorId: {
          _id: post.authorId,
          name: authorInfo.name,
          email: authorInfo.email
        },
        publishDateTime: post.publishDateTime,
        isSponsored: post.isSponsored || false,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        imageUrl: post.imageUrl,
        status: post.status,
        isScheduled: post.isScheduled,
        scheduleApproved: post.scheduleApproved,
        rejectionReason: post.rejectionReason,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        source: 'Post',
        type: 'scheduled_pending'
      };
      
      formattedPosts.push(formattedPost);
    }
    
    // 7. Process AdminPost collection results
    for (const adminPost of postsFromAdminPostCollection) {
      const categoryName = await getCategoryName(adminPost.category);
      const authorInfo = await getAuthorInfo(adminPost.authorId);
      
      const formattedPost = {
        _id: adminPost._id,
        title: adminPost.title,
        shortTitle: adminPost.shortTitle || adminPost.title.substring(0, 100),
        body: adminPost.body,
        category: adminPost.category,
        categoryName,
        tags: adminPost.tags || [],
        region: adminPost.region || 'India',
        author: adminPost.author || authorInfo.name,
        authorId: {
          _id: adminPost.authorId,
          name: authorInfo.name,
          email: authorInfo.email
        },
        publishDateTime: adminPost.publishDateTime,
        isSponsored: adminPost.isSponsored || false,
        metaTitle: adminPost.metaTitle,
        metaDescription: adminPost.metaDescription,
        imageUrl: adminPost.imageUrl,
        status: 'pending_approval',
        isScheduled: adminPost.isScheduledPost,
        scheduleApproved: adminPost.scheduleApproved,
        rejectionReason: adminPost.rejectionReason,
        approvalStatus: adminPost.approvalStatus,
        createdAt: adminPost.createdAt,
        updatedAt: adminPost.updatedAt,
        source: 'AdminPost',
        type: 'scheduled_pending',
        adminPostId: adminPost._id
      };
      
      formattedPosts.push(formattedPost);
    }
    
    // 8. Sort by creation date (newest first)
    formattedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`Total pending schedule approvals: ${formattedPosts.length}`);
    
    // 9. Send response
    res.status(200).json({
      success: true,
      count: formattedPosts.length,
      data: formattedPosts,
      message: `Found ${formattedPosts.length} pending schedule approvals`,
      timestamp: new Date().toISOString()
    });
    
    console.log('=== GET PENDING SCHEDULE APPROVALS COMPLETED ===');
    
  } catch (error) {
    console.error('\n=== ERROR IN getPendingScheduleApprovals ===');
    console.error('Error:', error.message);
    console.error('Error Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending schedule approvals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};
