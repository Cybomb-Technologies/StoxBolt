// routes/protectedPostRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getPosts,
  getPostStats,
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
  requestUpdate,
  getPost
} = require('../controllers/postController');
const { protect, authorize } = require('../middleware/auth');
const { checkCRUDAccess } = require('../middleware/curdAccess');
const ensureCRUDAccess = require('../middleware/crudCheck');
router.get('/stats', getPostStats);
router.get('/', getPosts);

// All routes require authentication
router.use(protect);

// ========== GET ROUTES ==========
router.get('/scheduled', getScheduledPosts);
router.get('/pending-schedule', authorize('superadmin'), getPendingScheduleApprovals);

// ========== MIDDLEWARE FOR MODIFICATION ROUTES ==========
router.use(checkCRUDAccess);
router.use(ensureCRUDAccess);

// ========== CREATE ROUTES ==========
router.post('/', createPost);
router.post('/draft', authorize('admin', 'superadmin'), createDraft);

// ========== UPDATE ROUTES ==========
router.put('/:id', updatePost);
router.put('/:id/publish', publishPost);
router.put('/:id/submit-for-approval', authorize('admin'), submitForApproval);
router.put('/:id/request-update', authorize('admin'), requestUpdate);
router.put('/:id/approve-schedule', authorize('superadmin'), approveSchedule);
router.put('/:id/reject-schedule', authorize('superadmin'), rejectSchedule);
router.put('/:id/cancel-schedule', cancelSchedule);

// ========== DELETE ROUTES ==========
router.delete('/:id', deletePost);
router.get('/:id', getPost);
module.exports = router;