// routes/postRoutes.js
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
  getPendingScheduleApprovals,
  requestUpdate
} = require('../controllers/postController');
const { protect, authorize } = require('../middleware/auth');
const { checkCRUDAccess } = require('../middleware/curdAccess');
const ensureCRUDAccess = require('../middleware/crudCheck');

// Public routes - no authentication required
router.get('/', getPosts); // Allow public access to get posts
router.get('/:id', getPost); // Allow public access to get single post

// Protected routes
router.use(protect); // Apply protection to all routes below
router.use(checkCRUDAccess);
router.use(ensureCRUDAccess);

// Get pending schedule approvals (superadmin only)
router.get('/pending-schedule', authorize('superadmin'), getPendingScheduleApprovals);

// Get scheduled posts
router.get('/scheduled', getScheduledPosts);

// Create new post (now accessible to admin with CRUD access)
router.post('/', createPost);

// Create draft (admin and superadmin)
router.post('/draft', authorize('admin', 'superadmin'), createDraft);

// Update post (now accessible to admin with CRUD access)
router.put('/:id', updatePost);

// Delete post (now accessible to admin with CRUD access)
router.delete('/:id', deletePost);

// Publish post (now accessible to admin with CRUD access)
router.put('/:id/publish', publishPost);

// Submit draft for approval (admin only - for those without CRUD access)
router.put('/:id/submit-for-approval', authorize('admin'), submitForApproval);

// Request update for published post (admin only - for those without CRUD access)
router.put('/:id/request-update', authorize('admin'), requestUpdate);

// Schedule approval routes (superadmin only)
router.put('/:id/approve-schedule', authorize('superadmin'), approveSchedule);
router.put('/:id/reject-schedule', authorize('superadmin'), rejectSchedule);

// Cancel scheduled post
router.put('/:id/cancel-schedule', cancelSchedule);

module.exports = router;