const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  createAdmin,
  getAdmins,
  deactivateAdmin,
  reactivateAdmin
} = require('../controllers/adminController');

// All routes are protected
router.use(protect);

// Admin management routes (Superadmin only)
router.route('/admins')
  .get(authorize('superadmin'), getAdmins)
  .post(authorize('superadmin'), createAdmin);

router.route('/admins/:id/deactivate')
  .put(authorize('superadmin'), deactivateAdmin);

router.route('/admins/:id/reactivate')
  .put(authorize('superadmin'), reactivateAdmin);

module.exports = router;