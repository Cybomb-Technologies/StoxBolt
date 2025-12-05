const Activity = require('../models/Activity');
const User = require('../models/admin');
const mongoose = require('mongoose');

// Helper function to safely log activities
const logActivity = async (activityData, req = null) => {
  try {
    // If request is provided, extract user and IP info
    let finalData = { ...activityData };
    
    if (req && req.user) {
      finalData.userId = req.user._id;
      finalData.user = req.user.email || req.user.username || req.user.name || 'Unknown User';
      finalData.userDetails = {
        name: req.user.name || req.user.username || 'Unknown',
        email: req.user.email || '',
        role: req.user.role || 'user'
      };
      
      // Add IP and user agent for audit trail
      finalData.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      finalData.userAgent = req.headers['user-agent'] || '';
    }
    
    // Create activity with context
    const activity = await Activity.createWithContext(finalData);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(activity.toLogMessage());
    }
    
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to prevent breaking main functionality
    return null;
  }
};

// @desc    Get activity log with advanced filtering
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,  // Changed from 50 to match frontend
      type, 
      severity, 
      entityType, 
      entityId,
      userId,
      startDate,
      endDate,
      search,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    // Apply filters
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (severity && severity !== 'all') {
      query.severity = severity;
    }
    
    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }
    
    if (entityId && mongoose.Types.ObjectId.isValid(entityId)) {
      query.$or = [
        { entityId: entityId },
        { postId: entityId },
        { adminPostId: entityId }
      ];
    }
    
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Text search
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }
    
    // Restrict to user's own activities if not admin/superadmin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      query.userId = req.user._id;
    }
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute query with population
    const [activities, total] = await Promise.all([
      Activity.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email username role')
        .populate('postId', 'title status category')
        .populate('adminPostId', 'title approvalStatus')
        .lean(),
      Activity.countDocuments(query)
    ]);
    
    // Format activities for frontend
    const formattedActivities = activities.map(activity => {
      // Extract user info from populated userId or use flat fields
      const populatedUser = activity.userId;
      const userEmail = populatedUser?.email || activity.userEmail || activity.user || '';
      const userName = populatedUser?.name || populatedUser?.username || activity.userName || '';
      const userRole = populatedUser?.role || activity.userRole || '';
      
      // Determine display name
      let displayName = userName;
      if (!displayName && userEmail) {
        displayName = userEmail.split('@')[0]; // Use email username part
      }
      if (!displayName) {
        displayName = activity.user || 'Unknown User';
      }
      
      // Prepare details from metadata
      const details = activity.metadata || {};
      
      // Add post-specific details if available
      if (activity.postId) {
        details.title = activity.postId.title;
        details.status = activity.postId.status;
        details.category = activity.postId.category;
      }
      
      if (activity.adminPostId) {
        details.title = activity.adminPostId.title;
        details.approvalStatus = activity.adminPostId.approvalStatus;
      }
      
      return {
        _id: activity._id,
        id: activity._id,
        type: activity.type,
        userId: activity.userId?._id || activity.userId,
        user: displayName, // For backward compatibility
        username: userName, // Add username field
        userEmail: userEmail, // Add email field
        title: activity.title,
        description: activity.description,
        details: details,
        metadata: activity.metadata,
        severity: activity.severity,
        timestamp: activity.timestamp,
        createdAt: activity.created_at || activity.timestamp,
        postId: activity.postId?._id || activity.postId,
        adminPostId: activity.adminPostId?._id || activity.adminPostId,
        icon: getIconForType(activity.type),
        color: getColorForSeverity(activity.severity),
        readableDate: activity.timestamp ? 
          new Date(activity.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'N/A'
      };
    });
    
    // Get activity statistics
    const stats = await getActivityStats(query);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      stats,
      data: formattedActivities,
      filters: {
        applied: {
          type,
          severity,
          entityType,
          entityId,
          userId,
          startDate,
          endDate,
          search
        },
        available: {
          types: await Activity.distinct('type'),
          severities: await Activity.distinct('severity'),
          entityTypes: await Activity.distinct('entityType')
        }
      }
    });
    
  } catch (error) {
    console.error('Get activities error:', error);
    
    // Log the error
    await logActivity({
      type: 'error',
      title: 'Failed to fetch activities',
      description: error.message,
      severity: 'error',
      metadata: { error: error.message, stack: error.stack }
    }, req);
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Log activity (public API)
// @route   POST /api/activities/log
// @access  Private
exports.logActivity = async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date()
    };
    
    const activity = await logActivity(activityData, req);
    
    if (!activity) {
      return res.status(500).json({
        success: false,
        message: 'Failed to log activity'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
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

// @desc    Get user activities
// @route   GET /api/activities/user/:userId
// @access  Private (Admin only)
exports.getUserActivities = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view other user activities'
      });
    }
    
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const [activities, total, user] = await Promise.all([
      Activity.find({ userId: req.params.userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('postId', 'title status')
        .populate('adminPostId', 'title approvalStatus')
        .lean(),
      Activity.countDocuments({ userId: req.params.userId }),
      User.findById(req.params.userId).select('name email username role').lean()
    ]);
    
    // Format activities
    const formattedActivities = activities.map(activity => {
      const details = activity.metadata || {};
      
      return {
        ...activity,
        userEmail: activity.userEmail || activity.userDetails?.email || activity.user || '',
        username: activity.userName || activity.userDetails?.name || activity.user || '',
        details: details,
        readableDate: new Date(activity.timestamp).toLocaleString(),
        icon: getIconForType(activity.type),
        color: getColorForSeverity(activity.severity)
      };
    });
    
    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      user,
      data: formattedActivities
    });
    
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get activity statistics
// @route   GET /api/activities/stats
// @access  Private
exports.getActivityStats = async (req, res) => {
  try {
    const query = {};
    
    // Restrict to user's own stats if not admin/superadmin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      query.userId = req.user._id;
    }
    
    const stats = await getActivityStats(query);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Clean up old activities (admin only)
// @route   DELETE /api/activities/cleanup
// @access  Private (Superadmin only)
exports.cleanupActivities = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can cleanup activities'
      });
    }
    
    const { days = 90, severity } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const cleanupQuery = {
      timestamp: { $lt: cutoffDate },
      severity: { $ne: 'critical' } // Don't delete critical logs
    };
    
    if (severity) {
      cleanupQuery.severity = severity;
    }
    
    const result = await Activity.deleteMany(cleanupQuery);
    
    // Log the cleanup
    await logActivity({
      type: 'system',
      title: 'Activity Log Cleanup',
      description: `Cleaned up ${result.deletedCount} activities older than ${days} days`,
      severity: 'info',
      metadata: { deletedCount: result.deletedCount, days, severity }
    }, req);
    
    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} activities`,
      data: result
    });
    
  } catch (error) {
    console.error('Cleanup activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Export activities (admin only)
// @route   GET /api/activities/export
// @access  Private (Admin only)
exports.exportActivities = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export activities'
      });
    }
    
    const { format = 'json', startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'name email')
      .lean();
    
    if (format === 'csv') {
      // Generate CSV
      const csv = convertToCSV(activities);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activities.csv');
      return res.send(csv);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        count: activities.length,
        data: activities
      });
    }
    
  } catch (error) {
    console.error('Export activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper functions

async function getActivityStats(query = {}) {
  const [
    totalActivities,
    byType,
    bySeverity,
    byUser,
    recentActivities,
    dailyStats
  ] = await Promise.all([
    Activity.countDocuments(query),
    Activity.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Activity.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Activity.aggregate([
      { $match: query },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'admins',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    ]),
    Activity.find(query)
      .sort({ timestamp: -1 })
      .limit(10)
      .select('type title timestamp user userEmail userName')
      .lean(),
    Activity.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 },
          types: { $addToSet: '$type' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ])
  ]);
  
  return {
    totalActivities,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    topUsers: byUser.map(item => ({
      userId: item._id,
      name: item.user?.name || 'Unknown',
      email: item.user?.email || 'N/A',
      count: item.count
    })),
    recentActivities,
    dailyStats
  };
}

function getIconForType(type) {
  const icons = {
    'create': '➕',
    'update': '✏️',
    'delete': '🗑️',
    'publish': '📢',
    'approval_request': '📋',
    'post_approved': '✅',
    'post_rejected': '❌',
    'schedule_approved': '📅✅',
    'schedule_rejected': '📅❌',
    'error': '⚠️',
    'login': '🔐',
    'logout': '🚪',
    'upload': '📤',
    'admin_created': '👤➕',
    'admin_updated': '👤✏️',
    'admin_deactivated': '👤⏸️',
    'admin_reactivated': '👤▶️'
  };
  return icons[type] || '📝';
}

function getColorForSeverity(severity) {
  const colors = {
    'info': 'blue',
    'warning': 'orange',
    'error': 'red',
    'critical': 'purple',
    'success': 'green'
  };
  return colors[severity] || 'gray';
}

function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

// Export the logActivity helper for use in other controllers
exports.logActivityHelper = logActivity;