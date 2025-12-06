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

// User Registration Route
router.post('/register', registerUser);

// User Login Route
router.post('/login', loginUser);

// Google Login with Authorization Code (Recommended - more secure)
router.post('/google-login', googleLogin);

// Google Login with ID Token (Alternative)
router.post('/google-login-token', googleLoginWithToken);

// Check if user exists
router.get('/check-user', checkUserExists);

// Forgot Password Routes
router.post('/forgot-password/send-otp', sendPasswordResetOTP);
router.post('/forgot-password/verify-otp', verifyResetOTP);
router.post('/forgot-password/reset', resetPassword);

module.exports = router;   // <-- THIS WAS MISSING (main issue)
