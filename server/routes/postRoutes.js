const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize, authorizePostAction } = require('../middleware/role');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  getScheduledPosts
} = require('../controllers/postController');

// All routes are protected
router.use(protect);

// Get posts (both admin and superadmin can view)
router.route('/')
  .get(getPosts)
  .post(authorize('admin', 'superadmin'), createPost);

// Get scheduled posts
router.route('/scheduled')
  .get(getScheduledPosts);

// Single post routes
router.route('/:id')
  .get(getPost)
  .put(updatePost)
  .delete(authorize('superadmin'), deletePost);

// Publish post - only superadmin
router.route('/:id/publish')
  .put(authorize('superadmin'), publishPost);

module.exports = router;