// Middleware to check CRUD access and temporarily elevate permissions
const checkCRUDAccess = (req, res, next) => {
  // Skip for superadmin (they always have full access)
  if (req.user.role === 'superadmin') {
    req.user.hasCRUDAccess = true;
    return next();
  }
  
  // For admin, check curdAccess flag
  if (req.user.role === 'admin') {
    req.user.hasCRUDAccess = req.user.curdAccess === true;
  } else {
    req.user.hasCRUDAccess = false;
  }
  
  next();
};

// Middleware to restrict certain actions based on CRUD access
const requireCRUDAccess = (req, res, next) => {
  if (req.user.role === 'admin' && !req.user.hasCRUDAccess) {
    return res.status(403).json({
      success: false,
      message: 'CRUD access is required for this action. Please switch to CRUD mode.'
    });
  }
  next();
};

module.exports = { checkCRUDAccess, requireCRUDAccess };