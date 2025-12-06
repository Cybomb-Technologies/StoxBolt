const User = require('../../models/User-models/User-models');

const checkUserExists = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });

    res.json({ success: true, exists: !!user, loginMethod: user ? (user.googleId ? 'google' : 'manual') : null });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = checkUserExists;
