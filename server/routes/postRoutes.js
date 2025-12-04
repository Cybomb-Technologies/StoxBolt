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
  getScheduledPosts 
} = require('../controllers/postController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get all posts
router.get('/', getPosts);

// Get single post
router.get('/:id', getPost);

// Create new post (superadmin only)
router.post('/', authorize('superadmin'), createPost);

// Create draft (admin and superadmin)
router.post('/draft', authorize('admin', 'superadmin'), createDraft);

// Update post
router.put('/:id', updatePost);

// Delete post (superadmin only)
router.delete('/:id', authorize('superadmin'), deletePost);

// Publish post (superadmin only)
router.put('/:id/publish', authorize('superadmin'), publishPost);

// Submit draft for approval (admin only)
router.put('/:id/submit-for-approval', authorize('admin'), submitForApproval);

// Get scheduled posts
router.get('/scheduled', getScheduledPosts);

module.exports = router;