// controllers/User-Controller/bookmarkController.js
const User = require('../models/User-models/User-models');
const Post = require('../models/Post');

// Add/Remove Bookmark
const toggleBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already bookmarked
    const isBookmarked = user.savedPosts.includes(postId);

    if (isBookmarked) {
      // Remove bookmark
      user.savedPosts = user.savedPosts.filter(
        savedPost => savedPost.toString() !== postId
      );
      await user.save();
      
      return res.json({
        success: true,
        message: 'Post removed from bookmarks',
        isBookmarked: false,
        action: 'removed'
      });
    } else {
      // Add bookmark
      user.savedPosts.push(postId);
      await user.save();
      
      return res.json({
        success: true,
        message: 'Post added to bookmarks',
        isBookmarked: true,
        action: 'added'
      });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all bookmarked posts with details
const getBookmarkedPosts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Transform the data to ensure consistency
    const bookmarkedPosts = user.savedPosts.map(post => ({
      _id: post._id,
      title: post.title,
      slug: post.slug || post._id,
      summary: post.summary || post.excerpt || post.description,
      body: post.body || post.content,
      image: post.image || post.imageUrl || post.thumbnail,
      category: post.category?.name || post.category || 'General',
      author: post.author?.name || post.author?.username || post.author || 'Admin',
      tags: post.tags || [],
      isSponsored: post.isSponsored || false,
      createdAt: post.createdAt || post.publishedAt,
      updatedAt: post.updatedAt,
      views: post.views || 0,
      readTime: post.readTime || '5 min'
    }));

    res.json({
      success: true,
      count: bookmarkedPosts.length,
      data: bookmarkedPosts
    });
  } catch (error) {
    console.error('Get bookmarked posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Check if a post is bookmarked
const checkBookmarkStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isBookmarked = user.savedPosts.some(
      savedPost => savedPost.toString() === postId
    );

    res.json({
      success: true,
      isBookmarked
    });
  } catch (error) {
    console.error('Check bookmark status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove bookmark for specific post
const removeBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if post exists in bookmarks
    const postIndex = user.savedPosts.findIndex(
      savedPost => savedPost.toString() === postId
    );

    if (postIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Post is not in your bookmarks'
      });
    }

    // Remove the post
    user.savedPosts.splice(postIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Post removed from bookmarks'
    });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Clear all bookmarks
const clearAllBookmarks = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clear all saved posts
    user.savedPosts = [];
    await user.save();

    res.json({
      success: true,
      message: 'All bookmarks cleared successfully'
    });
  } catch (error) {
    console.error('Clear all bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get bookmark count
const getBookmarkCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('savedPosts');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      count: user.savedPosts.length
    });
  } catch (error) {
    console.error('Get bookmark count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  toggleBookmark,
  getBookmarkedPosts,
  checkBookmarkStatus,
  removeBookmark,
  clearAllBookmarks,
  getBookmarkCount
};