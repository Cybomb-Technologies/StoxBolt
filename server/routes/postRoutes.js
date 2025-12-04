const express = require('express');
const router = express.Router();
const { 
  getPosts, 
  getPost, 
  createPost, 
  updatePost, 
  deletePost, 
  publishPost,
  createDraft,
  submitForApproval,
  getScheduledPosts,
  approveSchedule,
  rejectSchedule,
  cancelSchedule,
  getPendingScheduleApprovals
} = require('../controllers/postController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get all posts
router.get('/', getPosts);

// Get pending schedule approvals (superadmin only) - MUST COME BEFORE :id ROUTES
router.get('/pending-schedule', authorize('superadmin'), getPendingScheduleApprovals);

// Get scheduled posts
router.get('/scheduled', getScheduledPosts);

// Create new post (superadmin only)
router.post('/', authorize('superadmin'), createPost);

// Create draft (admin and superadmin)
router.post('/draft', authorize('admin', 'superadmin'), createDraft);

// Get single post - MUST COME AFTER SPECIFIC ROUTES
router.get('/:id', getPost);

// Update post
router.put('/:id', updatePost);

// Delete post (superadmin only)
router.delete('/:id', authorize('superadmin'), deletePost);

// Publish post (superadmin only)
router.put('/:id/publish', authorize('superadmin'), publishPost);

// Submit draft for approval (admin only)
router.put('/:id/submit-for-approval', authorize('admin'), submitForApproval);

// Schedule approval routes
router.put('/:id/approve-schedule', authorize('superadmin'), approveSchedule);
router.put('/:id/reject-schedule', authorize('superadmin'), rejectSchedule);

// Cancel scheduled post
router.put('/:id/cancel-schedule', cancelSchedule);

module.exports = router;