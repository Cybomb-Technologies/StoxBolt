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

// Debug route to check user info
router.get('/debug', (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      role: req.user.role,
      name: req.user.name,
      email: req.user.email
    },
    message: 'Debug info - check if user is properly authenticated'
  });
});

// Get posts (both admin and superadmin can view)
router.route('/')
  .get(getPosts)
  .post(authorize('admin', 'superadmin'), createPost);

// Get scheduled posts
router.route('/scheduled')
  .get(authorize('admin', 'superadmin'), getScheduledPosts);

// Single post routes
router.route('/:id')
  .get(getPost)
  .put(authorize('admin', 'superadmin'), updatePost)
  .delete(authorize('superadmin'), deletePost);

// Publish post - only superadmin
router.route('/:id/publish')
  .put(authorize('superadmin'), publishPost);

module.exports = router;