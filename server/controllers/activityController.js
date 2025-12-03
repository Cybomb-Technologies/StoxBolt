const Activity = require('../models/Activity');

// @desc    Get activity log
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    const query = {};
    
    // Filter by activity type
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Filter by user if not admin/superadmin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      query.userId = req.user._id;
    }
    
    const skip = (page - 1) * limit;
    
    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Activity.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: activities
    });
    
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user activities
// @route   GET /api/activities/user/:userId
// @access  Private (Admin only)
exports.getUserActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const activities = await Activity.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Activity.countDocuments({ userId: req.params.userId });
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: activities
    });
    
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Log activity (internal use)
// @route   POST /api/activities/log
// @access  Private
exports.logActivity = async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      userId: req.user._id,
      user: req.user.name
    };
    
    const activity = await Activity.create(activityData);
    
    res.status(201).json({
      success: true,
      data: activity
    });
    
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};