const Admin = require('../models/admin');
const Activity = require('../models/Activity');
const bcrypt = require('bcryptjs');

// Helper function to safely create activity log
const createActivityLog = async (activityData) => {
  try {
    return await Activity.create(activityData);
  } catch (activityError) {
    if (activityError.name === 'ValidationError' && activityError.errors?.type?.kind === 'enum') {
      console.warn(`Activity type "${activityData.type}" not in enum, trying fallback`);
      
      const typeMapping = {
        'admin_created': 'user_created',
        'admin_updated': 'user_updated',
        'admin_deactivated': 'user_deactivated',
        'admin_reactivated': 'user_activated',
        'curd_access_toggle': 'user_updated'
      };
      
      const fallbackType = typeMapping[activityData.type] || 'system';
      
      try {
        return await Activity.create({
          ...activityData,
          type: fallbackType
        });
      } catch (fallbackError) {
        console.error('Fallback activity creation failed:', fallbackError.message);
      }
    } else {
      console.error('Activity creation error:', activityError.message);
    }
    return null;
  }
};

// @desc    Create new admin user (Superadmin only)
// @route   POST /api/users/admins
// @access  Private/Superadmin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    // Check if admin exists
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      const existingAdmin = adminExists.toObject();
      delete existingAdmin.password;

      return res.status(200).json({
        success: true,
        message: 'Admin already exists',
        data: existingAdmin,
      });
    }

    // Validate role
    const allowedRoles = ['admin'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Can only create admin users',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'admin',
      curdAccess: false, // Default to false
      isActive: true,
      createdBy: req.user._id,
    });

    // Log activity
    await createActivityLog({
      type: 'admin_created',
      userId: req.user._id,
      user: req.user.name,
      title: `Created admin user: ${name}`,
      details: { 
        email, 
        role: role || 'admin', 
        userType: 'admin',
        action: 'created',
        curdAccess: false
      },
      targetId: admin._id,
      targetType: 'Admin'
    });

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: adminResponse,
    });
  } catch (error) {
    console.error('Create admin error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all admin users (Superadmin only)
// @route   GET /api/users/admins
// @access  Private/Superadmin
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single admin user (Superadmin only)
// @route   GET /api/users/admins/:id
// @access  Private/Superadmin
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update admin user (Superadmin only)
// @route   PUT /api/users/admins/:id
// @access  Private/Superadmin
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, password, isActive, curdAccess } = req.body;
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update superadmin user'
      });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (typeof isActive === 'boolean') admin.isActive = isActive;
    
    // Update CRUD access if provided
    if (typeof curdAccess === 'boolean') {
      admin.curdAccess = curdAccess;
    }
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    await admin.save();

    // Log activity with error handling
    await createActivityLog({
      type: 'admin_updated',
      userId: req.user._id,
      user: req.user.name,
      title: `Updated admin: ${admin.name}`,
      details: { 
        email: admin.email, 
        isActive: admin.isActive,
        curdAccess: admin.curdAccess,
        changes: Object.keys(req.body).filter(key => key !== 'password')
      },
      targetId: admin._id,
      targetType: 'Admin'
    });

    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: adminResponse
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Deactivate admin user (Superadmin only)
// @route   PUT /api/users/admins/:id/deactivate
// @access  Private/Superadmin
exports.deactivateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate superadmin'
      });
    }

    admin.isActive = false;
    await admin.save();

    // Log activity with error handling
    await createActivityLog({
      type: 'admin_deactivated',
      userId: req.user._id,
      user: req.user.name,
      title: `Deactivated admin: ${admin.name}`,
      details: { 
        email: admin.email,
        isActive: false,
        curdAccess: admin.curdAccess,
        action: 'deactivated'
      },
      targetId: admin._id,
      targetType: 'Admin'
    });

    res.status(200).json({
      success: true,
      message: 'Admin deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reactivate admin user (Superadmin only)
// @route   PUT /api/users/admins/:id/reactivate
// @access  Private/Superadmin
exports.reactivateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    admin.isActive = true;
    await admin.save();

    // Log activity with error handling
    await createActivityLog({
      type: 'admin_reactivated',
      userId: req.user._id,
      user: req.user.name,
      title: `Reactivated admin: ${admin.name}`,
      details: { 
        email: admin.email,
        isActive: true,
        curdAccess: admin.curdAccess,
        action: 'reactivated'
      },
      targetId: admin._id,
      targetType: 'Admin'
    });

    res.status(200).json({
      success: true,
      message: 'Admin reactivated successfully'
    });

  } catch (error) {
    console.error('Reactivate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle CRUD access for admin user (Superadmin only)
// @route   PUT /api/users/admins/:id/toggle-curd
// @access  Private/Superadmin
exports.toggleCRUDAccess = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify CRUD access for superadmin'
      });
    }

    // Toggle CRUD access
    const newCRUDAccess = !admin.curdAccess;
    admin.curdAccess = newCRUDAccess;
    await admin.save();

    // Log activity
    await createActivityLog({
      type: 'curd_access_toggle',
      userId: req.user._id,
      user: req.user.name,
      title: `CRUD access ${newCRUDAccess ? 'enabled' : 'disabled'} for ${admin.name}`,
      details: { 
        email: admin.email, 
        isActive: admin.isActive,
        curdAccess: newCRUDAccess,
        action: 'curd_access_toggle',
        changedBy: req.user.name
      },
      targetId: admin._id,
      targetType: 'Admin'
    });

    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: `CRUD access ${newCRUDAccess ? 'enabled' : 'disabled'} successfully`,
      data: adminResponse
    });

  } catch (error) {
    console.error('Toggle CRUD access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling CRUD access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get admin statistics (Superadmin only)
// @route   GET /api/users/admins/stats
// @access  Private/Superadmin
exports.getAdminStats = async (req, res) => {
  try {
    const totalAdmins = await Admin.countDocuments({ role: 'admin' });
    const activeAdmins = await Admin.countDocuments({ role: 'admin', isActive: true });
    const inactiveAdmins = await Admin.countDocuments({ role: 'admin', isActive: false });
    const adminsWithCRUD = await Admin.countDocuments({ role: 'admin', curdAccess: true });

    res.status(200).json({
      success: true,
      data: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        adminsWithCRUD,
        adminsWithoutCRUD: totalAdmins - adminsWithCRUD,
        superadminCount: 1
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};