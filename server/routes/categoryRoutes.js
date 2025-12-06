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

// Public routes
router.get('/', getCategories); // Allow public access to get categories
router.get('/:id', getCategory); // Allow public access to get single category

// Protected routes
router.use(protect); // Apply protection to all routes below

// Create new category (admin and superadmin only)
router.post('/', authorize('admin', 'superadmin'), createCategory);

// Update category (admin and superadmin only)
router.put('/:id', authorize('admin', 'superadmin'), updateCategory);

// Delete category (superadmin only)
router.delete('/:id', authorize('superadmin'), deleteCategory);

module.exports = router;