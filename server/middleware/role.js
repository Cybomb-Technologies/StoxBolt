const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Superadmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user role is in allowed roles
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  };
};

// Special middleware for post actions
const authorizePostAction = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Superadmin can do everything
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Admin permissions
    if (req.user.role === 'admin') {
      const adminAllowedActions = ['create', 'update', 'edit'];
      if (adminAllowedActions.includes(action)) {
        return next();
      }
    }

    res.status(403).json({
      success: false,
      message: `Not authorized to ${action} posts`
    });
  };
};

module.exports = { authorize, authorizePostAction };