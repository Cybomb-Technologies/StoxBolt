// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesForDropdown
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getCategories);
router.get('/dropdown', getCategoriesForDropdown);
router.get('/:id', getCategory);

// Protected routes
router.use(protect);

// Admin & Superadmin routes
router.post('/', authorize('admin', 'superadmin'), createCategory);
router.put('/:id', authorize('admin', 'superadmin'), updateCategory);
router.delete('/:id', authorize('admin', 'superadmin'), deleteCategory);

module.exports = router;