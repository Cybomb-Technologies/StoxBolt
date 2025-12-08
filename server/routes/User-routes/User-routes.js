// routes/User-routes/User-routes.js
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

const {
  toggleBookmark,
  getBookmarkedPosts,
  checkBookmarkStatus,
  removeBookmark,
  clearAllBookmarks,
  getBookmarkCount
} = require('../../controllers/bookmarkController');

const User = require('../../models/User-models/User-models');
const { authenticateToken } = require('../../middleware/authMiddleware');

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

// ===== BOOKMARK ROUTES =====
// Toggle bookmark for a post
router.post('/posts/:postId/bookmark', authenticateToken, toggleBookmark);

// Get all bookmarked posts
router.get('/bookmarks', authenticateToken, getBookmarkedPosts);

// Check if a post is bookmarked
router.get('/bookmarks/:postId/status', authenticateToken, checkBookmarkStatus);

// Remove specific bookmark
router.delete('/bookmarks/:postId', authenticateToken, removeBookmark);

// Clear all bookmarks
router.delete('/bookmarks', authenticateToken, clearAllBookmarks);

// Get bookmark count
router.get('/bookmarks/count', authenticateToken, getBookmarkCount);

// ===== COMPATIBILITY ROUTES (keep for backward compatibility) =====
router.get('/saved-posts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'savedPosts',
        select: '-__v -updatedAt',
        populate: [
          {
            path: 'author',
            select: 'username name email profilePicture'
          },
          {
            path: 'category',
            select: 'name slug'
          }
        ]
      })
      .select('savedPosts');
    
    // Transform data for compatibility
    const savedPosts = user.savedPosts.map(post => ({
      _id: post._id,
      title: post.title,
      slug: post.slug || post._id,
      summary: post.summary || post.excerpt || '',
      image: post.image || post.imageUrl || post.thumbnail,
      category: post.category?.name || post.category || 'General',
      tags: post.tags || [],
      isSponsored: post.isSponsored || false,
      createdAt: post.createdAt,
      author: post.author?.name || post.author?.username || 'Admin'
    }));
    
    res.json({ success: true, data: savedPosts || [] });
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

// Change password route
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Find user by ID from token
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be different from current password' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;