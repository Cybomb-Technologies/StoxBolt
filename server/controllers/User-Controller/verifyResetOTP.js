const User = require('../../models/User-models/User-models');

const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.resetPasswordOTPExpiry < new Date()) return res.status(400).json({ success: false, message: 'OTP has expired' });

    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpiry = null;
    await user.save();

    res.json({ success: true, message: 'OTP verified successfully', email });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = verifyResetOTP;
