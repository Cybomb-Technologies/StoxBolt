const mongoose = require('mongoose');
const Post = require('../models/Post');
const AdminPost = require('../models/AdminPost');
const Activity = require('../models/Activity');

// @desc    Get all posts (published only for public, all for admin/superadmin)
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
    } else if (req.user.role === 'admin') {
      // Admin can only see their own posts
      query.authorId = req.user._id;
    }
    // Superadmin can see all posts (no filter needed)
    
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

// @desc    Create new post (Only for superadmin, admin should use approval system)
// @route   POST /api/posts
// @access  Private (Superadmin only)
exports.createPost = async (req, res) => {
  try {
    // Only superadmin can create posts directly
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin must use approval system to create posts'
      });
    }
    
    const postData = {
      ...req.body,
      authorId: req.user._id
    };
    
    // Handle tags
    if (postData.tags && typeof postData.tags === 'string') {
      postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Check if it's a scheduled post
    if (postData.publishDateTime && new Date(postData.publishDateTime) > new Date()) {
      postData.isScheduled = true;
      postData.scheduleApproved = true; // Superadmin can schedule directly
      postData.scheduleApprovedBy = req.user._id;
      postData.scheduleApprovedAt = Date.now();
      postData.status = 'scheduled';
    } else {
      postData.status = 'published';
    }
    
    const post = await Post.create(postData);
    
    // Log activity
    await Activity.create({
      type: 'create',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      details: { 
        category: post.category, 
        status: post.status,
        isScheduled: post.isScheduled
      }
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
      // Admin can only update their own posts
      if (post.authorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own posts'
        });
      }
      
      // Admin cannot directly update published posts - must use approval system
      if (post.status === 'published') {
        return res.status(403).json({
          success: false,
          message: 'Admin must use approval system to update published posts. Please use the "Request Update" feature.'
        });
      }
      
      // Admin cannot update scheduled posts that are already approved
      if (post.isScheduled && post.scheduleApproved) {
        return res.status(403).json({
          success: false,
          message: 'Cannot update approved scheduled post. Please cancel and create new.'
        });
      }
    }
    
    // Superadmin can update any post
    
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
    
    // Check if updating to scheduled post
    if (updateData.publishDateTime && new Date(updateData.publishDateTime) > new Date()) {
      updateData.isScheduled = true;
      
      if (req.user.role === 'admin') {
        // Admin needs approval for scheduled posts
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
    }
    
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
      details: { 
        ...updateData,
        updatedBy: req.user.role
      }
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
    
    // Also delete associated AdminPosts
    await AdminPost.deleteMany({ postId: post._id });
    
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
    post.lastApprovedBy = req.user._id;
    post.lastApprovedAt = Date.now();
    
    // If it was scheduled, update schedule approval
    if (post.isScheduled) {
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
        approvalStatus: 'approved'
      }
    );
    
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

// @desc    Create draft (Admin can create drafts)
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
      // For scheduled posts, set status based on user role
      if (req.user.role === 'admin') {
        // Admin needs approval for scheduled posts
        postData.status = 'pending_approval';
        postData.isScheduled = true;
        postData.scheduleApproved = false;
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
    
    // If admin created a scheduled post, also create AdminPost for approval
    if (req.user.role === 'admin' && isScheduledPost) {
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
        isScheduled: isScheduledPost
      }
    });
    
    res.status(201).json({
      success: true,
      message: isScheduledPost ? 'Scheduled draft created - pending approval' : 'Draft created successfully',
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

// @desc    Submit draft for approval (including scheduled posts)
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
          publishDateTime: post.publishDateTime
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
        status: 'pending_review'
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

exports.approveSchedule = async (req, res) => {
  try {
    console.log('=== APPROVE SCHEDULE STARTED ===');
    console.log('Post ID from request:', req.params.id);
    console.log('User:', req.user.name, req.user.role);
    
    // Validate post ID
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      console.log('ERROR: Invalid post ID provided:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID provided'
      });
    }
    // At the beginning of approveSchedule
// if (!isValidObjectId(req.params.id)) {
//   console.log('ERROR: Invalid ObjectId format:', req.params.id);
//   return res.status(400).json({
//     success: false,
//     message: 'Invalid post ID format'
//   });
// }
    
    // First check if it's an AdminPost ID (might be from AdminPost collection)
    let post = await Post.findById(req.params.id);
    let adminPost = await AdminPost.findOne({ 
      $or: [
        { _id: req.params.id },
        { postId: req.params.id }
      ] 
    });
    
    console.log('Post found:', !!post);
    console.log('AdminPost found:', !!adminPost);
    
    // If no Post found but AdminPost exists, check if we need to create a Post
    if (!post && adminPost) {
      console.log('Creating Post from AdminPost data');
      // Check if there's already a post linked to this AdminPost
      if (adminPost.postId) {
        post = await Post.findById(adminPost.postId);
      }
      
      // If still no post, create one
      if (!post) {
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
          scheduleApprovedAt: Date.now(),
          createdAt: adminPost.createdAt || Date.now()
        });
        
        console.log('New Post created with ID:', post._id);
      }
      
      // Update AdminPost with the new postId if not already set
      if (!adminPost.postId) {
        adminPost.postId = post._id;
        await adminPost.save();
        console.log('Updated AdminPost with postId:', post._id);
      }
    }
    
    if (!post && !adminPost) {
      console.log('ERROR: Neither Post nor AdminPost found');
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Only superadmin can approve scheduled posts
    if (req.user.role !== 'superadmin') {
      console.log('ERROR: Unauthorized user role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can approve scheduled posts'
      });
    }
    
    // If post exists, approve it
    if (post) {
      console.log('Processing Post approval for:', post.title);
      
      // Check if post is scheduled
      if (!post.isScheduled) {
        console.log('ERROR: Post is not scheduled');
        return res.status(400).json({
          success: false,
          message: 'Post is not scheduled'
        });
      }
      
      // Check if schedule is already approved
      if (post.scheduleApproved) {
        console.log('WARNING: Schedule already approved for post:', post.title);
        
        // Even if already approved, update AdminPost status
        if (adminPost && adminPost.approvalStatus !== 'scheduled_approved') {
          adminPost.approvalStatus = 'scheduled_approved';
          adminPost.scheduleApproved = true;
          adminPost.scheduleApprovedBy = req.user._id;
          adminPost.scheduleApprovedAt = Date.now();
          await adminPost.save();
          console.log('AdminPost updated even though Post was already approved');
        }
        
        return res.status(200).json({
          success: true,
          message: 'Schedule already approved',
          data: post
        });
      }
      
      // Approve the schedule
      post.scheduleApproved = true;
      post.scheduleApprovedBy = req.user._id;
      post.scheduleApprovedAt = Date.now();
      post.status = 'scheduled';
      await post.save();
      console.log('Post approved and saved');
    }
    
    // Update AdminPost status if it exists
    if (adminPost) {
      console.log('Updating AdminPost status for:', adminPost.title);
      adminPost.scheduleApproved = true;
      adminPost.scheduleApprovedBy = req.user._id;
      adminPost.scheduleApprovedAt = Date.now();
      adminPost.approvalStatus = 'scheduled_approved';
      adminPost.status = 'scheduled';
      
      // If this is a scheduled pending approval, update all relevant fields
      if (adminPost.approvalStatus === 'scheduled_pending') {
        adminPost.approvalStatus = 'scheduled_approved';
      }
      
      await adminPost.save();
      console.log('AdminPost updated successfully');
    }
    
    // Log activity
    await Activity.create({
      type: 'approval',
      userId: req.user._id,
      user: req.user.name,
      title: post ? post.title : adminPost.title,
      postId: post ? post._id : adminPost.postId,
      details: { 
        type: 'schedule_approved',
        publishDateTime: post ? post.publishDateTime : adminPost.publishDateTime,
        approvedBy: req.user.name,
        source: adminPost ? 'AdminPost' : 'Post'
      }
    });
    
    console.log('=== APPROVE SCHEDULE COMPLETED ===');
    
    res.status(200).json({
      success: true,
      message: 'Scheduled post approved',
      data: post || adminPost
    });
    
  } catch (error) {
    console.error('Approve schedule error:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Server error: ' + error.message;
    if (error.name === 'CastError') {
      errorMessage = `Invalid ID format: ${req.params.id}`;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// In postController.js - Update the rejectSchedule function
exports.rejectSchedule = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    console.log('=== REJECT SCHEDULE STARTED ===');
    console.log('Post ID from request:', req.params.id);
    console.log('Rejection reason:', rejectionReason);
    
    // First check if it's an AdminPost ID
    let post = await Post.findById(req.params.id);
    let adminPost = await AdminPost.findOne({ 
      $or: [
        { _id: req.params.id },
        { postId: req.params.id }
      ] 
    });
    
    console.log('Post found:', !!post);
    console.log('AdminPost found:', !!adminPost);
    if (adminPost) {
      console.log('AdminPost current status:', {
        approvalStatus: adminPost.approvalStatus,
        scheduleApproved: adminPost.scheduleApproved,
        rejectionReason: adminPost.rejectionReason,
        isScheduledPost: adminPost.isScheduledPost
      });
    }
    
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
    
    // Helper function to create activity log
    const createActivityLog = async (type, details) => {
      try {
        await Activity.create({
          type: type,
          userId: req.user._id,
          user: req.user.name,
          title: details.title,
          postId: details.postId,
          details: details
        });
        console.log(`Activity logged: ${type}`);
      } catch (activityError) {
        console.error('Activity logging error:', activityError.message);
      }
    };
    
    // Update Post if exists
    if (post) {
      console.log('Processing Post rejection for:', post.title);
      
      post.scheduleApproved = false;
      post.status = 'draft';
      post.isScheduled = false;
      post.rejectionReason = rejectionReason || 'Schedule rejected by superadmin';
      await post.save();
      console.log('Post rejected and saved as draft');
      
      await createActivityLog('update', { 
        type: 'schedule_rejected',
        reason: rejectionReason,
        rejectedBy: req.user.name,
        source: 'Post',
        originalStatus: 'scheduled_pending',
        newStatus: 'draft',
        publishDateTime: post.publishDateTime
      });
    }
    
    // CRITICAL FIX: Update AdminPost properly
    if (adminPost) {
      console.log('Updating AdminPost rejection for:', adminPost.title);
      
      // Properly update all relevant fields
      adminPost.approvalStatus = 'rejected';  // This was probably still 'scheduled_pending'
      adminPost.rejectionReason = rejectionReason || 'Schedule rejected by superadmin';
      adminPost.status = 'rejected';
      adminPost.scheduleApproved = false;
      adminPost.isScheduledPost = false;  // Also mark as not scheduled
      
      // Remove any pending schedule flags
      if (adminPost.approvalStatus === 'scheduled_pending') {
        adminPost.approvalStatus = 'rejected';
      }
      
      await adminPost.save();
      console.log('AdminPost updated with rejection. New status:', {
        approvalStatus: adminPost.approvalStatus,
        scheduleApproved: adminPost.scheduleApproved,
        rejectionReason: adminPost.rejectionReason,
        isScheduledPost: adminPost.isScheduledPost
      });
      
      await createActivityLog('update', { 
        type: 'schedule_rejected',
        reason: rejectionReason,
        rejectedBy: req.user.name,
        source: 'AdminPost',
        originalStatus: 'scheduled_pending',
        newStatus: 'rejected',
        publishDateTime: adminPost.publishDateTime,
        adminPostId: adminPost._id
      });
    }
    
    console.log('=== REJECT SCHEDULE COMPLETED ===');
    
    res.status(200).json({
      success: true,
      message: 'Scheduled post rejected',
      data: post || adminPost
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

// @desc    Get scheduled posts
// @route   GET /api/posts/scheduled
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

// In postController.js - Update the getPendingScheduleApprovals function
exports.getPendingScheduleApprovals = async (req, res) => {
  console.log('\n=== GET PENDING SCHEDULE APPROVALS STARTED ===');
  
  try {
    // 1. Check authentication
    if (!req.user || !req.user._id) {
      console.log('ERROR: No authenticated user found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // 2. Check authorization
    if (req.user.role !== 'superadmin') {
      console.log('ERROR: Unauthorized access attempt by', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view pending schedule approvals'
      });
    }
    
    // 3. Unified query to get ALL pending schedule approvals
    const pendingPosts = [];
    
    // Query 1: Get pending schedule approvals from Post collection
    const postQuery = {
      isScheduled: true,
      scheduleApproved: false,
      $or: [
        { status: 'pending_approval' },
        { status: 'draft' }
      ]
    };
    
    const postsFromPostCollection = await Post.find(postQuery)
      .sort({ createdAt: -1 })
      .populate('authorId', 'name email')
      .lean();
    
    console.log(`Found ${postsFromPostCollection.length} posts from Post collection`);
    
    // Transform Post collection results
    postsFromPostCollection.forEach(post => {
      pendingPosts.push({
        ...post,
        source: 'Post',
        approvalId: post._id,
        isFromPost: true,
        // Ensure consistent approvalStatus
        approvalStatus: 'scheduled_pending'
      });
    });
    
    // Query 2: Get pending schedule approvals from AdminPost collection
    // In the query section of getPendingScheduleApprovals
// Query 2: Get pending schedule approvals from AdminPost collection
const adminPostQuery = {
  $or: [
    { 
      isScheduledPost: true,
      scheduleApproved: false,
      // EXCLUDE REJECTED POSTS
      approvalStatus: { $ne: 'rejected' }
    }
  ],
  // ALSO EXCLUDE BASED ON REJECTION REASON
  rejectionReason: { $in: [null, ''] }  // Only posts without rejection reason
};

const postsFromAdminPostCollection = await AdminPost.find(adminPostQuery)
  .sort({ createdAt: -1 })
  .populate('authorId', 'name email')
  .populate('postId', 'title status')
  .lean();
    console.log(`Found ${postsFromAdminPostCollection.length} posts from AdminPost collection`);
    
    // Transform AdminPost collection results
    postsFromAdminPostCollection.forEach(adminPost => {
      // Skip if already processed as a Post
      if (adminPost.postId) {
        const alreadyExists = postsFromPostCollection.some(post => 
          post._id.toString() === adminPost.postId._id.toString()
        );
        if (alreadyExists) return;
      }
      
      const postData = {
        _id: adminPost.postId?._id || adminPost._id,
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
        status: 'pending_approval',
        isScheduled: true,
        scheduleApproved: false,
        createdAt: adminPost.createdAt,
        updatedAt: adminPost.updatedAt,
        rejectionReason: adminPost.rejectionReason,
        approvalStatus: adminPost.approvalStatus || 'scheduled_pending',
        source: 'AdminPost',
        approvalId: adminPost._id,
        adminPostId: adminPost._id,
        isFromAdminPost: true
      };
      
      pendingPosts.push(postData);
    });
    
    // Sort all posts by creation date
    pendingPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`Total pending schedule approvals: ${pendingPosts.length}`);
    
    // Log sample for debugging
    if (pendingPosts.length > 0) {
      console.log('\nSample pending posts:');
      pendingPosts.slice(0, 3).forEach((post, index) => {
        console.log(`${index + 1}. ID: ${post._id}`);
        console.log(`   Title: ${post.title}`);
        console.log(`   Source: ${post.source}`);
        console.log(`   Approval Status: ${post.approvalStatus}`);
        console.log(`   Schedule Approved: ${post.scheduleApproved}`);
        console.log('---');
      });
    }
    
    res.status(200).json({
      success: true,
      count: pendingPosts.length,
      data: pendingPosts,
      debug: process.env.NODE_ENV === 'development' ? {
        postCollectionCount: postsFromPostCollection.length,
        adminPostCollectionCount: postsFromAdminPostCollection.length,
        totalUnique: pendingPosts.length
      } : undefined
    });
    
  } catch (error) {
    console.error('\n=== CRITICAL ERROR IN getPendingScheduleApprovals ===');
    console.error('Error:', error.message);
    console.error('Error Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending schedule approvals',
      error: error.message,
      errorType: error.name
    });
  }
};