const User = require('../models/admin');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // IMPORTANT: Use .select('+password') to include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('User active:', user.isActive);
    console.log('User role:', user.role);
    console.log('User CRUD access:', user.curdAccess);
    console.log('Password field exists:', !!user.password);
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    // DIRECT password comparison
    console.log('Attempting direct bcrypt comparison...');
    
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log('Direct bcrypt compare result:', isPasswordMatch);
    
    // Also try the method
    const methodMatch = await user.matchPassword(password);
    console.log('Method match result:', methodMatch);
    
    if (!isPasswordMatch) {
      console.log('❌ Password does not match');
      console.log('Input password:', password);
      console.log('Stored hash:', user.password);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // Create token
    const token = generateToken(user._id, user.role);
    
    console.log('✅ Login successful!');
    console.log('Generated token length:', token.length);
    
    // Response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      curdAccess: user.curdAccess,
      hasCRUDAccess: user.role === 'superadmin' ? true : user.curdAccess,
      isAdmin: ['admin', 'superadmin'].includes(user.role),
      lastLogin: user.lastLogin
    };
    
    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      curdAccess: user.curdAccess,
      hasCRUDAccess: user.role === 'superadmin' ? true : user.curdAccess,
      isAdmin: ['admin', 'superadmin'].includes(user.role),
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
    
    res.status(200).json({
      success: true,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

// Make sure to export all functions
module.exports = {
  login,
  getMe,
  logout
};