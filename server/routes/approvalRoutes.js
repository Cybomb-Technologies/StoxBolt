const express = require('express');
const router = express.Router();
const {
  getAdminPostsForApproval,
  getMyAdminPosts,
  createAdminPost,
  requestPostUpdate,
  approveAdminPost,
  rejectAdminPost,
  requestChanges,
  updateAdminPost,
  getAdminPost
} = require('../controllers/approvalController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get admin posts by author (admin only) - MUST COME BEFORE :id ROUTES
router.get('/my-posts', authorize('admin'), getMyAdminPosts);

// Create admin post for approval (admin only)
router.post('/posts', authorize('admin'), createAdminPost);

// Get all admin posts for approval (superadmin only)
router.get('/posts', authorize('superadmin'), getAdminPostsForApproval);

// Request update for published post (admin only)
router.post('/posts/:id/request-update', authorize('admin'), requestPostUpdate);

// Get single admin post
router.get('/posts/:id', getAdminPost);

// Approve admin post (superadmin only)
router.put('/posts/:id/approve', authorize('superadmin'), approveAdminPost);

// Reject admin post (superadmin only)
router.put('/posts/:id/reject', authorize('superadmin'), rejectAdminPost);

// Request changes for admin post (superadmin only)
router.put('/posts/:id/request-changes', authorize('superadmin'), requestChanges);

// Update admin post (admin can update their own pending posts)
router.put('/posts/:id', authorize('admin'), updateAdminPost);

module.exports = router;