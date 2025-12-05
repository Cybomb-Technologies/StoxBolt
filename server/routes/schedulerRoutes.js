const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getScheduledPosts,
  updateTimezone,
  deleteScheduledPost,
  triggerAutoPublish  // Add this
} = require('../controllers/schedulerController');

// All routes are protected
router.use(protect);

router.route('/posts')
  .get(getScheduledPosts);

router.route('/posts/:id')
  .delete(authorize('admin', 'superadmin', 'editor'), deleteScheduledPost);

router.route('/timezone')
  .put(updateTimezone);

// Add manual trigger route for testing
router.route('/trigger-auto-publish')
  .get(authorize('superadmin'), triggerAutoPublish);

// Add this route for schedule approvals page
router.get('/schedule-approvals', protect, authorize('superadmin'), (req, res) => {
  // This would render your React component
  res.render('schedule-approvals');
});

module.exports = router;