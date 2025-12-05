// Middleware to ensure CRUD access is properly checked
const Admin = require('../models/admin');

const ensureCRUDAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Re-fetch user to ensure we have latest CRUD access status
    const freshUser = await Admin.findById(req.user._id).select('+curdAccess');
    
    if (!freshUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update req.user with fresh data
    req.user.curdAccess = freshUser.curdAccess;
    
    // Determine CRUD access based on role
    if (req.user.role === 'superadmin') {
      req.user.hasCRUDAccess = true;
    } else if (req.user.role === 'admin') {
      req.user.hasCRUDAccess = freshUser.curdAccess === true;
    } else {
      req.user.hasCRUDAccess = false;
    }

    console.log('CRUD Check - User:', req.user.name);
    console.log('CRUD Check - Role:', req.user.role);
    console.log('CRUD Check - curdAccess:', req.user.curdAccess);
    console.log('CRUD Check - hasCRUDAccess:', req.user.hasCRUDAccess);

    next();
  } catch (error) {
    console.error('Ensure CRUD access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking CRUD access'
    });
  }
};

module.exports = ensureCRUDAccess;