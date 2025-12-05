// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

// Get all categories (public or protected based on your needs)
router.get('/', protect, getCategories);

// Get single category
router.get('/:id', protect, getCategory);

// Create new category (admin and superadmin only)
router.post('/', protect, authorize('admin', 'superadmin'), createCategory);

// Update category (admin and superadmin only)
router.put('/:id', protect, authorize('admin', 'superadmin'), updateCategory);

// Delete category (superadmin only)
router.delete('/:id', protect, authorize('superadmin'), deleteCategory);

module.exports = router;