const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  createAdmin,
  getAdmins,
  getAdmin,
  updateAdmin,
  deactivateAdmin,
  reactivateAdmin,
  getAdminStats,
  toggleCRUDAccess,
  getUsers
} = require('../controllers/adminController');

// All routes are protected
router.use(protect);

// Admin management routes (Superadmin only)
router.route('/admins')
  .get(authorize('superadmin'), getAdmins)
  .post(authorize('superadmin'), createAdmin);

router.route('/admins/stats')
  .get(authorize('superadmin'), getAdminStats);

// Single admin routes
router.route('/admins/:id')
  .get(authorize('superadmin'), getAdmin)
  .put(authorize('superadmin'), updateAdmin);

// CRUD access toggle route
router.route('/admins/:id/toggle-curd')
  .put(authorize('superadmin'), toggleCRUDAccess);

router.route('/admins/:id/deactivate')
  .put(authorize('superadmin'), deactivateAdmin);

router.route('/admins/:id/reactivate')
  .put(authorize('superadmin'), reactivateAdmin);

// Regular User management routes (Superadmin only)
router.route('/regular')
  .get(authorize('superadmin'), getUsers);


module.exports = router;