const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  profileValidation,
  passwordChangeValidation
} = require('../middleware/validate');

// Public routes with rate limiting
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.patch('/profile', [auth, profileValidation], authController.updateProfile);
router.post('/change-password', [auth, passwordChangeValidation], authController.changePassword);
router.delete('/account', auth, authController.deleteAccount);

module.exports = router; 