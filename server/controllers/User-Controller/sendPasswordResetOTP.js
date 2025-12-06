const User = require('../../models/User-models/User-models');
const { sendOTPEmail } = require('../../services/emailService');

const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User with this email does not exist' });
    if (user.googleId) return res.status(400).json({ success: false, message: 'This email is registered with Google. Please use Google Sign In.' });

    const otp = user.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = otpExpiry;
    await user.save();

    const emailSent = await sendOTPEmail(email, otp, user.username);
    if (!emailSent) return res.status(500).json({ success: false, message: 'Failed to send OTP email' });

    res.json({ success: true, message: 'OTP sent successfully to your email', email });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = sendPasswordResetOTP;
