const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  googleLoginWithToken,
  checkUserExists,
  sendPasswordResetOTP,
  verifyResetOTP,
  resetPassword
} = require('../../controllers/User-Controller/userControllers');

const User = require('../../models/User-models/User-models');
const { authenticateToken } = require('../../middleware/authMiddleware'); // Add this import

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/google-login-token', googleLoginWithToken);
router.get('/check-user', checkUserExists);
router.post('/forgot-password/send-otp', sendPasswordResetOTP);
router.post('/forgot-password/verify-otp', verifyResetOTP);
router.post('/forgot-password/reset', resetPassword);

// Protected routes - require authentication
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -resetPasswordOTP');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/saved-posts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('savedPosts')
      .select('savedPosts');
    
    res.json({ success: true, data: user.savedPosts || [] });
  } catch (error) {
    console.error('Saved posts error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/saved-posts/:postId', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { savedPosts: req.params.postId } }
    );
    res.json({ success: true, message: 'Post removed from saved' });
  } catch (error) {
    console.error('Remove saved post error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/saved-posts', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { savedPosts: [] } }
    );
    res.json({ success: true, message: 'All saved posts removed' });
  } catch (error) {
    console.error('Remove all saved posts error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;