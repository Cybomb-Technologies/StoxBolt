// approvalRoutes.js - Add the new route
const express = require('express');
const router = express.Router();
const {
  getAdminPostsForApproval,
  getMyAdminPosts,
  getMySubmissions,
  getPendingScheduleApprovalsForAdmin,  // Add this
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

// Route for getting admin's own posts
router.get('/my-posts', authorize('admin'), getMyAdminPosts);

// Route for getting all user submissions
router.get('/my-submissions', authorize('admin'), getMySubmissions);

// NEW ROUTE for superadmin to see pending schedule approvals
router.get('/pending-schedule', authorize('superadmin'), getPendingScheduleApprovalsForAdmin);

// Routes for admin posts collection
router.route('/posts')
  .get(authorize('superadmin'), getAdminPostsForApproval)
  .post(authorize('admin'), createAdminPost);

// Routes for specific admin post by ID
router.route('/posts/:id')
  .get(getAdminPost)
  .put(authorize('admin'), updateAdminPost);

// Action routes for specific admin post
router.post('/posts/:id/request-update', authorize('admin'), requestPostUpdate);
router.put('/posts/:id/approve', authorize('superadmin'), approveAdminPost);
router.put('/posts/:id/reject', authorize('superadmin'), rejectAdminPost);
router.put('/posts/:id/request-changes', authorize('superadmin'), requestChanges);

module.exports = router;