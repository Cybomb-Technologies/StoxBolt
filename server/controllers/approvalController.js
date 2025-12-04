const AdminPost = require('../models/AdminPost');
const Post = require('../models/Post');
const Activity = require('../models/Activity');

// @desc    Get all admin posts for approval
// @route   GET /api/approval/posts
// @access  Private (Superadmin only)
exports.getAdminPostsForApproval = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Filter by approval status
    if (status && status !== 'all') {
      query.approvalStatus = status;
    } else {
      // Default: show pending and needs_review
      query.approvalStatus = { $in: ['pending_review', 'changes_requested'] };
    }
    
    const skip = (page - 1) * limit;
    
    const posts = await AdminPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('authorId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('postId', 'title status');
    
    const total = await AdminPost.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: posts
    });
    
  } catch (error) {
    console.error('Get admin posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get admin posts by author
// @route   GET /api/approval/my-posts
// @access  Private (Admin only)
exports.getMyAdminPosts = async (req, res) => {
  try {
    console.log('Fetching my admin posts for user:', req.user._id); // Add logging
    
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { authorId: req.user._id };
    
    // Filter by approval status
    if (status && status !== 'all') {
      query.approvalStatus = status;
    }
    
    const skip = (page - 1) * limit;
    
    console.log('Query:', query); // Add logging
    
    const posts = await AdminPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('approvedBy', 'name email')
      .populate('postId', 'title status');
    
    const total = await AdminPost.countDocuments(query);
    
    console.log(`Found ${posts.length} posts for user ${req.user._id}`); // Add logging
    
    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: posts
    });
    
  } catch (error) {
    console.error('Get my admin posts error:', error);
    console.error('Error stack:', error.stack); // Add stack trace
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create admin post (for approval)
// @route   POST /api/approval/posts
// @access  Private (Admin only)
exports.createAdminPost = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can submit posts for approval'
      });
    }
    
    const postData = {
      ...req.body,
      authorId: req.user._id,
      approvalStatus: 'pending_review'
    };
    
    // Handle tags
    if (postData.tags && typeof postData.tags === 'string') {
      postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const adminPost = await AdminPost.create(postData);
    
    // Log activity
    await Activity.create({
      type: 'approval_request',
      userId: req.user._id,
      user: req.user.name,
      title: adminPost.title,
      postId: adminPost._id,
      details: { 
        type: 'new_post',
        status: 'pending_review'
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Post submitted for approval',
      data: adminPost
    });
    
  } catch (error) {
    console.error('Create admin post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Request update for published post
// @route   POST /api/approval/posts/:id/request-update
// @access  Private (Admin only)
exports.requestPostUpdate = async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can request updates for published posts'
      });
    }
    
    // Check if post exists and is published
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if admin owns this post
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only request updates for your own posts'
      });
    }
    
    // Create admin post for update request
    const updateData = {
      ...req.body,
      authorId: req.user._id,
      postId: post._id,
      isUpdateRequest: true,
      approvalStatus: 'pending_review',
      originalPostData: {
        title: post.title,
        shortTitle: post.shortTitle,
        body: post.body,
        category: post.category,
        tags: post.tags,
        region: post.region,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        imageUrl: post.imageUrl,
        isSponsored: post.isSponsored
      }
    };
    
    // Handle tags
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const adminPost = await AdminPost.create(updateData);
    
    // Log activity
    await Activity.create({
      type: 'update_request',
      userId: req.user._id,
      user: req.user.name,
      title: post.title,
      postId: post._id,
      adminPostId: adminPost._id,
      details: { 
        type: 'update_request',
        status: 'pending_review'
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Update request submitted for approval',
      data: adminPost
    });
    
  } catch (error) {
    console.error('Request post update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve admin post
// @route   PUT /api/approval/posts/:id/approve
// @access  Private (Superadmin only)
exports.approveAdminPost = async (req, res) => {
  try {
    const adminPostId = req.params.id;
    const { notes } = req.body;
    
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can approve posts'
      });
    }
    
    const adminPost = await AdminPost.findById(adminPostId)
      .populate('authorId', 'name email');
    
    if (!adminPost) {
      return res.status(404).json({
        success: false,
        message: 'Admin post not found'
      });
    }
    
    // Update approval status
    adminPost.approvalStatus = 'approved';
    adminPost.approvedBy = req.user._id;
    adminPost.approvedAt = Date.now();
    adminPost.reviewerNotes = notes || '';
    adminPost.status = 'published';
    await adminPost.save();
    
    if (adminPost.isUpdateRequest && adminPost.postId) {
      // Update existing post
      const post = await Post.findById(adminPost.postId);
      
      if (post) {
        // Update post with new data
        post.title = adminPost.title;
        post.shortTitle = adminPost.shortTitle;
        post.body = adminPost.body;
        post.category = adminPost.category;
        post.tags = adminPost.tags;
        post.region = adminPost.region;
        post.metaTitle = adminPost.metaTitle;
        post.metaDescription = adminPost.metaDescription;
        post.imageUrl = adminPost.imageUrl;
        post.isSponsored = adminPost.isSponsored;
        post.lastApprovedBy = req.user._id;
        post.lastApprovedAt = Date.now();
        await post.save();
        
        // Log activity
        await Activity.create({
          type: 'update_approved',
          userId: req.user._id,
          user: req.user.name,
          title: post.title,
          postId: post._id,
          details: { 
            type: 'update_approved',
            approvedBy: req.user.name
          }
        });
        
        return res.status(200).json({
          success: true,
          message: 'Post update approved and published',
          data: { adminPost, post }
        });
      }
    } else {
      // Create new post from admin post
      const postData = {
        title: adminPost.title,
        shortTitle: adminPost.shortTitle,
        body: adminPost.body,
        category: adminPost.category,
        tags: adminPost.tags,
        region: adminPost.region,
        author: adminPost.author,
        authorId: adminPost.authorId._id,
        publishDateTime: adminPost.publishDateTime || Date.now(),
        isSponsored: adminPost.isSponsored,
        metaTitle: adminPost.metaTitle,
        metaDescription: adminPost.metaDescription,
        imageUrl: adminPost.imageUrl,
        status: 'published',
        lastApprovedBy: req.user._id,
        lastApprovedAt: Date.now()
      };
      
      const post = await Post.create(postData);
      
      // Update adminPost with post reference
      adminPost.postId = post._id;
      await adminPost.save();
      
      // Log activity
      await Activity.create({
        type: 'post_approved',
        userId: req.user._id,
        user: req.user.name,
        title: post.title,
        postId: post._id,
        details: { 
          type: 'new_post_approved',
          approvedBy: req.user.name
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Post approved and published',
        data: { adminPost, post }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Post approved',
      data: adminPost
    });
    
  } catch (error) {
    console.error('Approve admin post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reject admin post
// @route   PUT /api/approval/posts/:id/reject
// @access  Private (Superadmin only)
exports.rejectAdminPost = async (req, res) => {
  try {
    const adminPostId = req.params.id;
    const { reason } = req.body;
    
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can reject posts'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason'
      });
    }
    
    const adminPost = await AdminPost.findById(adminPostId);
    
    if (!adminPost) {
      return res.status(404).json({
        success: false,
        message: 'Admin post not found'
      });
    }
    
    // Update approval status
    adminPost.approvalStatus = 'rejected';
    adminPost.approvedBy = req.user._id;
    adminPost.approvedAt = Date.now();
    adminPost.rejectionReason = reason;
    adminPost.status = 'rejected';
    await adminPost.save();
    
    // If this was from a draft, update the draft status
    if (adminPost.postId) {
      const post = await Post.findById(adminPost.postId);
      if (post && post.status === 'pending_approval') {
        post.status = 'draft';
        post.rejectionReason = reason;
        await post.save();
      }
    }
    
    // Log activity
    await Activity.create({
      type: 'post_rejected',
      userId: req.user._id,
      user: req.user.name,
      title: adminPost.title,
      postId: adminPost._id,
      details: { 
        type: 'rejected',
        reason: reason,
        rejectedBy: req.user.name
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Post rejected',
      data: adminPost
    });
    
  } catch (error) {
    console.error('Reject admin post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Request changes for admin post
// @route   PUT /api/approval/posts/:id/request-changes
// @access  Private (Superadmin only)
exports.requestChanges = async (req, res) => {
  try {
    const adminPostId = req.params.id;
    const { notes } = req.body;
    
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can request changes'
      });
    }
    
    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'Please provide feedback for changes'
      });
    }
    
    const adminPost = await AdminPost.findById(adminPostId);
    
    if (!adminPost) {
      return res.status(404).json({
        success: false,
        message: 'Admin post not found'
      });
    }
    
    // Update approval status
    adminPost.approvalStatus = 'changes_requested';
    adminPost.reviewerNotes = notes;
    await adminPost.save();
    
    // If this was from a draft, update the draft status
    if (adminPost.postId) {
      const post = await Post.findById(adminPost.postId);
      if (post && post.status === 'pending_approval') {
        post.status = 'draft';
        await post.save();
      }
    }
    
    // Log activity
    await Activity.create({
      type: 'changes_requested',
      userId: req.user._id,
      user: req.user.name,
      title: adminPost.title,
      postId: adminPost._id,
      details: { 
        type: 'changes_requested',
        notes: notes,
        requestedBy: req.user.name
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Changes requested',
      data: adminPost
    });
    
  } catch (error) {
    console.error('Request changes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update admin post (admin can update their own pending posts)
// @route   PUT /api/approval/posts/:id
// @access  Private (Admin only)
exports.updateAdminPost = async (req, res) => {
  try {
    const adminPostId = req.params.id;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update their approval posts'
      });
    }
    
    const adminPost = await AdminPost.findById(adminPostId);
    
    if (!adminPost) {
      return res.status(404).json({
        success: false,
        message: 'Admin post not found'
      });
    }
    
    // Check if admin owns this post
    if (adminPost.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own posts'
      });
    }
    
    // Only allow updates if status is pending_review or changes_requested
    if (!['pending_review', 'changes_requested'].includes(adminPost.approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update post that is already approved or rejected'
      });
    }
    
    // Update post data
    const updateData = { ...req.body };
    
    // Handle tags
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // If changes were requested, reset status to pending_review
    if (adminPost.approvalStatus === 'changes_requested') {
      updateData.approvalStatus = 'pending_review';
      updateData.reviewerNotes = '';
      updateData.rejectionReason = '';
    }
    
    // Update version
    updateData.version = (adminPost.version || 0) + 1;
    
    const updatedPost = await AdminPost.findByIdAndUpdate(
      adminPostId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Log activity
    await Activity.create({
      type: 'admin_post_updated',
      userId: req.user._id,
      user: req.user.name,
      title: updatedPost.title,
      postId: updatedPost._id,
      details: { 
        type: 'resubmitted',
        status: updatedPost.approvalStatus
      }
    });
    
    res.status(200).json({
      success: true,
      message: adminPost.approvalStatus === 'changes_requested' 
        ? 'Post updated and resubmitted for review' 
        : 'Post updated',
      data: updatedPost
    });
    
  } catch (error) {
    console.error('Update admin post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single admin post
// @route   GET /api/approval/posts/:id
// @access  Private
exports.getAdminPost = async (req, res) => {
  try {
    const adminPost = await AdminPost.findById(req.params.id)
      .populate('authorId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('postId', 'title status');
    
    if (!adminPost) {
      return res.status(404).json({
        success: false,
        message: 'Admin post not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'admin' && adminPost.authorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own admin posts'
      });
    }
    
    res.status(200).json({
      success: true,
      data: adminPost
    });
    
  } catch (error) {
    console.error('Get admin post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};