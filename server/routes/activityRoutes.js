const express = require('express');
const router = express.Router();
const {
  getActivities,
  logActivity,
  getUserActivities,
  getActivityStats,
  cleanupActivities,
  exportActivities
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get activities with filters
router.get('/', getActivities);

// Log activity
router.post('/log', logActivity);

// Get activity statistics
router.get('/stats', getActivityStats);

// Get user activities (admin only)
router.get('/user/:userId', authorize('admin', 'superadmin'), getUserActivities);

// Export activities (admin only)
router.get('/export', authorize('admin', 'superadmin'), exportActivities);

// Cleanup old activities (superadmin only)
router.delete('/cleanup', authorize('superadmin'), cleanupActivities);

module.exports = router;