
const User = require('../../models/User-models/User-models');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'postmessage');

const generateToken = (user) => jwt.sign({ userId: user._id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

const googleLoginWithToken = async (req, res) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ success: false, message: 'Google token is required' });

    const ticket = await googleClient.verifyIdToken({ idToken: tokenId, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, email, name: username, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) { user.googleId = googleId; user.googleProfilePicture = picture; await user.save(); }
    } else {
      user = new User({ username, email, googleId, googleProfilePicture: picture });
      await user.save();
    }

    const token = generateToken(user);

    res.json({ success: true, message: 'Google login successful', user: { id: user._id, username: user.username, email: user.email, profilePicture: user.googleProfilePicture }, token });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, message: 'Google authentication failed', error: error.message });
  }
};

module.exports = googleLoginWithToken;
