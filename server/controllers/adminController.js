const Admin = require('../models/admin');
const Activity = require('../models/Activity');
const bcrypt = require('bcryptjs');

// @desc    Create new admin user (Superadmin only)
// @route   POST /api/users/admins
// @access  Private/Superadmin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if admin exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists'
      });
    }

    // Validate role
    const allowedRoles = ['admin']; // Superadmin cannot create another superadmin
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Can only create admin users'
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
      role: role || 'admin'
    });

    // Log activity
    await Activity.create({
      type: 'admin_created',
      userId: req.user._id,
      user: req.user.name,
      title: `Created admin user: ${name}`,
      details: { email, role: role || 'admin' }
    });

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: adminResponse
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all admin users (Superadmin only)
// @route   GET /api/users/admins
// @access  Private/Superadmin
exports.getAdmins = async (req, res) => {
  try {
    // Don't show superadmin users to other admins
    // Only show admin users
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
    const { name, email, password, isActive } = req.body;
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Cannot update superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update superadmin user'
      });
    }

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (typeof isActive === 'boolean') admin.isActive = isActive;
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    await admin.save();

    // Log activity
    await Activity.create({
      type: 'admin_updated',
      userId: req.user._id,
      user: req.user.name,
      title: `Updated admin: ${admin.name}`,
      details: { email: admin.email, isActive: admin.isActive }
    });

    // Remove password from response
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

    // Cannot deactivate superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot deactivate superadmin'
      });
    }

    admin.isActive = false;
    await admin.save();

    // Log activity
    await Activity.create({
      type: 'admin_deactivated',
      userId: req.user._id,
      user: req.user.name,
      title: `Deactivated admin: ${admin.name}`,
      details: { email: admin.email }
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

    // Log activity
    await Activity.create({
      type: 'admin_reactivated',
      userId: req.user._id,
      user: req.user.name,
      title: `Reactivated admin: ${admin.name}`,
      details: { email: admin.email }
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

// @desc    Get admin statistics (Superadmin only)
// @route   GET /api/users/admins/stats
// @access  Private/Superadmin
exports.getAdminStats = async (req, res) => {
  try {
    const totalAdmins = await Admin.countDocuments({ role: 'admin' });
    const activeAdmins = await Admin.countDocuments({ role: 'admin', isActive: true });
    const inactiveAdmins = await Admin.countDocuments({ role: 'admin', isActive: false });

    res.status(200).json({
      success: true,
      data: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        superadminCount: 1 // Usually only one superadmin
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