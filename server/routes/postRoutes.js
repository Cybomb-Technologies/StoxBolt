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

// ========== PUBLIC ROUTES ==========
// GET /api/posts - Public access to get posts
router.get('/', getPosts);

// GET /api/posts/:id - Public access to get single post

// ========== PROTECTED ROUTES ==========
// All routes below require authentication
router.use(protect);

// ========== GET ROUTES FOR AUTHENTICATED USERS ==========
// IMPORTANT: Define specific routes BEFORE parameterized routes
router.get('/scheduled', getScheduledPosts);
router.get('/pending-schedule', authorize('superadmin'), getPendingScheduleApprovals);

// ========== MIDDLEWARE FOR MODIFICATION ROUTES ==========
// Apply CRUD access check for all modification routes
router.use(checkCRUDAccess);
router.use(ensureCRUDAccess);

// ========== CREATE ROUTES ==========
// POST /api/posts - Create new post
router.post('/', createPost);

// POST /api/posts/draft - Create draft
router.post('/draft', authorize('admin', 'superadmin'), createDraft);

// ========== UPDATE ROUTES ==========
// PUT /api/posts/:id - Update post
router.put('/:id', updatePost);

// PUT /api/posts/:id/publish - Publish post
router.put('/:id/publish', publishPost);

// PUT /api/posts/:id/submit-for-approval - Submit for approval
router.put('/:id/submit-for-approval', authorize('admin'), submitForApproval);

// PUT /api/posts/:id/request-update - Request update
router.put('/:id/request-update', authorize('admin'), requestUpdate);

// PUT /api/posts/:id/approve-schedule - Approve schedule
router.put('/:id/approve-schedule', authorize('superadmin'), approveSchedule);

// PUT /api/posts/:id/reject-schedule - Reject schedule
router.put('/:id/reject-schedule', authorize('superadmin'), rejectSchedule);

// PUT /api/posts/:id/cancel-schedule - Cancel schedule
router.put('/:id/cancel-schedule', cancelSchedule);

// ========== DELETE ROUTES ==========
// DELETE /api/posts/:id - Delete post
router.delete('/:id', deletePost);
router.get('/:id', getPost);
module.exports = router;