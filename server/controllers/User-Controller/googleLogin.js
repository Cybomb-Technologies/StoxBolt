const User = require('../../models/User-models/User-models');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'postmessage');

const generateToken = (user) => jwt.sign({ userId: user._id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

const getGoogleTokens = async (code) => {
  const { tokens } = await googleClient.getToken({ code, redirect_uri: 'postmessage' });
  return tokens;
};

const googleLogin = async (req, res) => {
  try {
    const { authorizationCode } = req.body;
    if (!authorizationCode) return res.status(400).json({ success: false, message: 'Authorization code is required' });

    const tokens = await getGoogleTokens(authorizationCode);
    if (!tokens.id_token) throw new Error('No ID token received from Google');

    const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
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
    if (error.message.includes('invalid_grant')) return res.status(401).json({ success: false, message: 'Google authorization code is invalid or expired' });
    res.status(401).json({ success: false, message: 'Google authentication failed', error: error.message });
  }
};

module.exports = googleLogin;
