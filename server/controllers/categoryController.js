// controllers/categoryController.js
const Category = require('../models/Category');
const Notification = require('../models/Notification');

// @desc    Get all categories with pagination and filtering
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = {};
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await Category.countDocuments(searchQuery);

    // Get categories with pagination
    const categories = await Category.find(searchQuery)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin & Superadmin)



exports.createCategory = async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin and superadmin can create categories'
      });
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      createdBy: req.user._id
    };

    console.log('Creating category with data:', categoryData);

    const category = await Category.create(categoryData);

    // 🔔 NOTIFICATION (ONLY ADDITION)
    await Notification.create({
      type: 'create-category',
      title: 'New Category Created',
      message: `Category "${category.name}" has been created`,
      referenceId: category._id,
      createdBy: req.user._id,
      isRead: false
    });

    // Populate the createdBy field before sending response
    const populatedCategory = await Category.findById(category._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });

  } catch (error) {
    console.error('Create category error:', error);

    let errorMessage = 'Server error';
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors)
        .map(val => val.message)
        .join(', ');
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development'
        ? error.message
        : undefined
    });
  }
};


// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin & Superadmin)
exports.updateCategory = async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin and superadmin can update categories'
      });
    }

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category name already exists (excluding current category)
    if (req.body.name && req.body.name.toLowerCase() !== category.name.toLowerCase()) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update category
    category.name = req.body.name || category.name;
    category.description = req.body.description !== undefined ? req.body.description : category.description;
    category.updatedAt = Date.now();

    await category.save();

    const updatedCategory = await Category.findById(req.params.id)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin & Superadmin)
exports.deleteCategory = async (req, res) => {
  try {
    // Only admin and superadmin can delete categories
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin and superadmin can delete categories'
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category is being used in any posts
    const Post = require('../models/Post');
    const postCount = await Post.countDocuments({ category: req.params.id });

    if (postCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is being used in ${postCount} post(s).`
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get categories for dropdown
// @route   GET /api/categories/dropdown
// @access  Public
exports.getCategoriesForDropdown = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 })
      .select('name _id')
      .lean();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories dropdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};