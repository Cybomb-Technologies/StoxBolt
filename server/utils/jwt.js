const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'your-fallback-secret-for-development-only',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

const verifyToken = (adminToken) => {
  try {
    return jwt.verify(adminToken, process.env.JWT_SECRET || 'your-fallback-secret-for-development-only');
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

module.exports = { generateToken, verifyToken };