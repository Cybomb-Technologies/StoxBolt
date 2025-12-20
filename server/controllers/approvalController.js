const AdminPost = require('../models/AdminPost');
const Post = require('../models/Post');
const Activity = require('../models/Activity');
const Notification = require('../models/inAppNotification/Notification');

// approvalController.js - Complete fixed getMySubmissions function
exports.getMySubmissions = async (req, res) => {
  try {
    console.log('=== GET MY SUBMISSIONS STARTED ===');
    console.log('User ID:', req.user._id, 'Role:', req.user.role);

    const { status, page = 1, limit = 20, search, type = 'all' } = req.query;

    const skip = (page - 1) * limit;

    // Get ALL AdminPosts for this user (including scheduled posts)
    const adminPostQuery = { authorId: req.user._id };

    // Get ALL Posts for this user
    const postQuery = { authorId: req.user._id };

    // Filter by status if provided
    if (status && status !== 'all') {
      adminPostQuery.approvalStatus = status;

      // Map status for Posts
      const statusMap = {
        'pending_review': 'pending_approval',
        'approved': 'published',
        'scheduled_pending': {
          $or: [
            { status: 'pending_approval', isScheduled: true },
            { status: 'draft', isScheduled: true }
          ]
        },
        'scheduled_approved': { status: 'scheduled', isScheduled: true },
        'published': 'published',
        'draft': 'draft'
      };

      if (statusMap[status]) {
        postQuery.$or = Array.isArray(statusMap[status]) ?
          statusMap[status] :
          [{ ...postQuery, ...(typeof statusMap[status] === 'object' ? statusMap[status] : { status: statusMap[status] }) }];
      }
    }

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };

      adminPostQuery.$or = [
        { title: searchRegex },
        { shortTitle: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
        { approvalStatus: searchRegex }
      ];

      postQuery.$or = [
        { title: searchRegex },
        { shortTitle: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
        { status: searchRegex }
      ];
    }

    console.log('AdminPost Query:', JSON.stringify(adminPostQuery, null, 2));
    console.log('Post Query:', JSON.stringify(postQuery, null, 2));

    // Fetch AdminPosts
    const [adminPosts, adminTotal] = await Promise.all([
      AdminPost.find(adminPostQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('authorId', 'name email')
        .populate('approvedBy', 'name email')
        .populate('scheduleApprovedBy', 'name email')
        .populate('postId', 'title status shortTitle category')
        .lean(),
      AdminPost.countDocuments(adminPostQuery)
    ]);

    // Fetch Posts
    const [posts, postTotal] = await Promise.all([
      Post.find(postQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('authorId', 'name email')
        .populate('lastApprovedBy', 'name email')
        .populate('scheduleApprovedBy', 'name email')
        .lean(),
      Post.countDocuments(postQuery)
    ]);

    console.log(`Found ${adminPosts.length} AdminPosts and ${posts.length} Posts`);

    // Transform ALL AdminPosts (including scheduled)
    const transformedAdminPosts = adminPosts.map(post => {
      // Determine if it's a scheduled post
      const isScheduledPost = post.isScheduledPost ||
        (post.publishDateTime && new Date(post.publishDateTime) > new Date());

      // Determine the status for display
      let displayStatus = post.approvalStatus;

      // Special handling for scheduled posts in AdminPost
      if (isScheduledPost) {
        if (post.scheduleApproved) {
          displayStatus = 'scheduled_approved';
        } else if (post.approvalStatus === 'scheduled_pending') {
          displayStatus = 'scheduled_pending';
        } else {
          displayStatus = 'scheduled_pending';
        }
      }

      // Check if this is linked to a Post
      const hasLinkedPost = post.postId && post.postId._id;

      return {
        ...post,
        _id: post._id,
        type: 'approval',
        isScheduledPost: isScheduledPost,
        isScheduled: isScheduledPost,
        approvalStatus: displayStatus,
        scheduleApproved: post.scheduleApproved || false,
        scheduleApprovedBy: post.scheduleApprovedBy,
        scheduleApprovedAt: post.scheduleApprovedAt,
        isUpdateRequest: post.isUpdateRequest || false,
        version: post.version || 1,
        // Ensure we have all necessary fields
        title: post.title || 'Untitled',
        shortTitle: post.shortTitle || '',
        category: post.category || 'Uncategorized',
        createdAt: post.createdAt || new Date(),
        // For UI consistency
        status: displayStatus,
        // Add linked post info if exists
        linkedPostId: hasLinkedPost ? post.postId._id : null,
        linkedPostTitle: hasLinkedPost ? post.postId.title : null,
        linkedPostStatus: hasLinkedPost ? post.postId.status : null
      };
    });

    // Transform Posts (focus on scheduled posts)
    const transformedPosts = posts.map(post => {
      // Determine if it's a scheduled post
      const isScheduled = post.isScheduled ||
        (post.publishDateTime && new Date(post.publishDateTime) > new Date());

      // Determine approval status
      let approvalStatus = '';
      if (isScheduled) {
        approvalStatus = post.scheduleApproved ? 'scheduled_approved' : 'scheduled_pending';
      } else {
        approvalStatus = post.status === 'published' ? 'approved' :
          post.status === 'pending_approval' ? 'pending_review' :
            post.status;
      }

      return {
        ...post,
        _id: post._id,
        type: 'post',
        isScheduledPost: isScheduled,
        isScheduled: isScheduled,
        approvalStatus: approvalStatus,
        scheduleApproved: post.scheduleApproved || false,
        scheduleApprovedBy: post.scheduleApprovedBy,
        scheduleApprovedAt: post.scheduleApprovedAt,
        isUpdateRequest: false,
        version: 1,
        // For UI consistency
        reviewerNotes: '',
        rejectionReason: post.rejectionReason || '',
        status: approvalStatus
      };
    });

    // Combine ALL submissions
    const allSubmissions = [...transformedAdminPosts, ...transformedPosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination after sorting
    const paginatedSubmissions = allSubmissions.slice(0, limit);

    const total = adminTotal + postTotal;
    const totalPages = Math.ceil(total / limit);

    console.log(`Total submissions: ${total}, Showing: ${paginatedSubmissions.length}`);

    // Debug: Log what we're sending - ESPECIALLY scheduled posts
    console.log('=== SCHEDULED POSTS ANALYSIS ===');

    // Count scheduled posts
    const scheduledAdminPosts = transformedAdminPosts.filter(p => p.isScheduledPost);
    const scheduledPosts = transformedPosts.filter(p => p.isScheduled);

    console.log(`Scheduled AdminPosts: ${scheduledAdminPosts.length}`);
    console.log(`Scheduled Posts: ${scheduledPosts.length}`);
    console.log(`Total Scheduled: ${scheduledAdminPosts.length + scheduledPosts.length}`);

    // Log details of scheduled posts
    if (scheduledAdminPosts.length > 0) {
      console.log('Scheduled AdminPosts details:');
      scheduledAdminPosts.forEach((post, index) => {
        console.log(`${index + 1}. ID: ${post._id}`);
        console.log(`   Title: ${post.title}`);
        console.log(`   Approval Status: ${post.approvalStatus}`);
        console.log(`   Schedule Approved: ${post.scheduleApproved}`);
        console.log(`   Publish Date: ${post.publishDateTime}`);
        console.log(`   Has Linked Post: ${post.linkedPostId ? 'Yes' : 'No'}`);
        console.log('---');
      });
    }

    if (scheduledPosts.length > 0) {
      console.log('Scheduled Posts details:');
      scheduledPosts.forEach((post, index) => {
        console.log(`${index + 1}. ID: ${post._id}`);
        console.log(`   Title: ${post.title}`);
        console.log(`   Approval Status: ${post.approvalStatus}`);
        console.log(`   Schedule Approved: ${post.scheduleApproved}`);
        console.log(`   Publish Date: ${post.publishDateTime}`);
        console.log('---');
      });
    }

    res.status(200).json({
      success: true,
      count: paginatedSubmissions.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      data: paginatedSubmissions,
      // Add debug info for scheduled posts
      debug: process.env.NODE_ENV === 'development' ? {
        scheduled: {
          adminPosts: scheduledAdminPosts.length,
          posts: scheduledPosts.length,
          total: scheduledAdminPosts.length + scheduledPosts.length
        }
      } : undefined
    });

    console.log('=== GET MY SUBMISSIONS COMPLETED ===');

  } catch (error) {
    console.error('Get all submissions error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// approvalController.js - Add this function for admin approval page
exports.getPendingScheduleApprovalsForAdmin = async (req, res) => {
  try {
    console.log('=== GET PENDING SCHEDULE APPROVALS FOR ADMIN ===');
    console.log('User:', req.user.name, 'Role:', req.user.role);

    // Only superadmin can access this
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can access pending schedule approvals'
      });
    }

    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    // Query for AdminPosts with scheduled pending status
    const adminPostQuery = {
      $or: [
        { approvalStatus: 'scheduled_pending' },
        {
          isScheduledPost: true,
          scheduleApproved: false,
          approvalStatus: { $ne: 'scheduled_approved' }
        },
        {
          publishDateTime: { $exists: true, $ne: null, $gt: new Date() },
          scheduleApproved: false
        }
      ]
    };

    // Query for Posts with scheduled pending status
    const postQuery = {
      isScheduled: true,
      scheduleApproved: false,
      status: { $in: ['pending_approval', 'draft'] }
    };

    // Apply search if provided
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };

      adminPostQuery.$and = [
        { ...adminPostQuery.$or ? { $or: adminPostQuery.$or } : {} },
        {
          $or: [
            { title: searchRegex },
            { shortTitle: searchRegex },
            { category: searchRegex },
            { author: searchRegex }
          ]
        }
      ];
      delete adminPostQuery.$or;

      postQuery.$or = [
        { title: searchRegex },
        { shortTitle: searchRegex },
        { category: searchRegex },
        { author: searchRegex }
      ];
    }

    console.log('AdminPost Query:', JSON.stringify(adminPostQuery, null, 2));
    console.log('Post Query:', JSON.stringify(postQuery, null, 2));

    // Fetch pending AdminPosts
    const adminPosts = await AdminPost.find(adminPostQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('authorId', 'name email')
      .populate('postId', 'title status');

    // Fetch pending Posts
    const posts = await Post.find(postQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('authorId', 'name email');

    console.log(`Found ${adminPosts.length} AdminPosts and ${posts.length} Posts pending schedule approval`);

    // Transform AdminPosts
    const transformedAdminPosts = adminPosts.map(post => ({
      ...post.toObject(),
      type: 'adminpost',
      source: 'AdminPost',
      approvalId: post._id,
      isFromAdminPost: true
    }));

    // Transform Posts
    const transformedPosts = posts.map(post => ({
      ...post.toObject(),
      type: 'post',
      source: 'Post',
      approvalId: post._id,
      isFromPost: true,
      approvalStatus: 'scheduled_pending'
    }));

    // Combine and sort
    const allPending = [...transformedAdminPosts, ...transformedPosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Count totals
    const adminTotal = await AdminPost.countDocuments(adminPostQuery);
    const postTotal = await Post.countDocuments(postQuery);
    const total = adminTotal + postTotal;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: allPending.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      data: allPending,
      debug: process.env.NODE_ENV === 'development' ? {
        adminPostsCount: adminPosts.length,
        postsCount: posts.length,
        adminTotal,
        postTotal
      } : undefined
    });

  } catch (error) {
    console.error('Get pending schedule approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
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
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get admin posts by author
// @route   GET /api/approval/my-posts
// @access  Private (Admin only)
exports.getMyAdminPosts = async (req, res) => {
  try {
    console.log('Fetching my admin posts for user:', req.user._id);

    const { status, page = 1, limit = 20, search } = req.query;

    const query = { authorId: req.user._id };

    // Filter by approval status
    if (status && status !== 'all') {
      query.approvalStatus = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { approvalStatus: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    console.log('Query:', query);

    const posts = await AdminPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('approvedBy', 'name email')
      .populate('postId', 'title status');

    const total = await AdminPost.countDocuments(query);

    console.log(`Found ${posts.length} posts for user ${req.user._id}`);

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
    console.error('Error stack:', error.stack);
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

    // Handle tags if sent as comma-separated string
    if (postData.tags && typeof postData.tags === 'string') {
      postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Create AdminPost
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

    // Create Notification for Superadmin
    await Notification.create({
      type: 'admin-post',
      title: 'Admin can submit posts for approval',
      message: `${req.user.name} submitted a post titled "${adminPost.title}" for approval.`,
      userId: req.user._id, // Who submitted
      recipients: ['superadmin'], // Array of roles/users who should get notified
      referenceId: adminPost._id, // Reference to adminPost
      status: 'unread'
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
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// In approvalController.js - Updated rejectAdminPost function
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

    // Helper function to safely log activity
    const logActivitySafely = async (activityData) => {
      try {
        await Activity.create(activityData);
      } catch (activityError) {
        console.error('Activity logging error:', activityError.message);
        // Continue even if activity logging fails
      }
    };

    // Log activity with safe type
    await logActivitySafely({
      type: 'post_rejected', // Use a valid enum value
      userId: req.user._id,
      user: req.user.name,
      title: adminPost.title,
      postId: adminPost._id,
      details: {
        type: 'rejected',
        reason: reason,
        rejectedBy: req.user.name,
        approvalStatus: 'rejected',
        isScheduledPost: adminPost.isScheduledPost || false
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
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};  