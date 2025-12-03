const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getActivities,
  getUserActivities,
  logActivity
} = require('../controllers/activityController');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getActivities);

router.route('/log')
  .post(logActivity);

router.route('/user/:userId')
  .get(authorize('admin', 'superadmin'), getUserActivities);

module.exports = router;