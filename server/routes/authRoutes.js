const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);

// Private routes (require authentication)
router.get('/me', protect, authController.getMe);
router.get('/logout', protect, authController.logout);

module.exports = router;