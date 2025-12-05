const jwt = require('jsonwebtoken');
const User = require('../models/admin');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, return error
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');

    // Get user from token WITH password and curdAccess fields
    req.user = await User.findById(decoded.id).select('+password +curdAccess');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure user has proper role
    if (!req.user.role || !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add CRUD access information - FIXED LOGIC
    if (req.user.role === 'admin') {
      req.user.hasCRUDAccess = req.user.curdAccess === true;
    } else if (req.user.role === 'superadmin') {
      req.user.hasCRUDAccess = true; // Superadmin always has CRUD access
      req.user.curdAccess = true; // Ensure curdAccess is true for superadmin
    }

    // Remove password from user object for security
    req.user.password = undefined;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }

    next();
  };
};

const authorizePostAction = (action) => {
  return async (req, res, next) => {
    try {
      const Post = require('../models/Post');
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Superadmin can do anything
      if (req.user.role === 'superadmin') {
        return next();
      }

      // Admin with CRUD access can perform most actions
      if (req.user.role === 'admin') {
        const isOwnPost = post.authorId.toString() === req.user._id.toString();
        
        // For delete/publish actions, admin needs CRUD access
        if (['delete', 'publish'].includes(action) && !req.user.hasCRUDAccess) {
          return res.status(403).json({
            success: false,
            message: 'CRUD access is required for this action'
          });
        }

        // Admin can only modify their own posts
        if (!isOwnPost) {
          return res.status(403).json({
            success: false,
            message: 'You can only modify your own posts'
          });
        }

        // For published posts, admin needs CRUD access to update directly
        if (action === 'update' && post.status === 'published' && !req.user.hasCRUDAccess) {
          return res.status(403).json({
            success: false,
            message: 'Admin must use approval system to update published posts'
          });
        }

        return next();
      }

      // Other roles not allowed
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    } catch (error) {
      console.error('Authorize post action error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

module.exports = { protect, authorize, authorizePostAction };