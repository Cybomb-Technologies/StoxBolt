const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getScheduledPosts,
  updateTimezone,
  deleteScheduledPost
} = require('../controllers/schedulerController');

// All routes are protected
router.use(protect);

router.route('/posts')
  .get(getScheduledPosts);

router.route('/posts/:id')
  .delete(authorize('admin', 'superadmin', 'editor'), deleteScheduledPost);

router.route('/timezone')
  .put(updateTimezone);

module.exports = router;