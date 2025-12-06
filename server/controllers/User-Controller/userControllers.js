const registerUser = require('./registerUser');
const loginUser = require('./loginUser');
const googleLogin = require('./googleLogin');
const googleLoginWithToken = require('./googleLoginWithToken');
const checkUserExists = require('./checkUserExists');
const sendPasswordResetOTP = require('./sendPasswordResetOTP');
const verifyResetOTP = require('./verifyResetOTP');
const resetPassword = require('./resetPassword');

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  googleLoginWithToken,
  checkUserExists,
  sendPasswordResetOTP,
  verifyResetOTP,
  resetPassword
};
