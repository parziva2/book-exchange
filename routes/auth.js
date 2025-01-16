const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { withRetry } = require('../utils/mongoRetry');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
} = require('../utils/tokenUtils');

const router = express.Router();

// Register user
router.post(
  '/register',
  [
    body('email')
      .exists()
      .withMessage('Email field is missing')
      .notEmpty()
      .withMessage('Email cannot be empty')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .exists()
      .withMessage('Password field is missing')
      .notEmpty()
      .withMessage('Password cannot be empty')
      .isString()
      .withMessage('Password must be a string')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/[a-zA-Z]/)
      .withMessage('Password must contain at least one letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
    body('username')
      .exists()
      .withMessage('Username field is missing')
      .notEmpty()
      .withMessage('Username cannot be empty')
      .trim()
      .isString()
      .withMessage('Username must be a string')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores and hyphens')
  ],
  async (req, res) => {
    try {
      // Log the raw request body
      console.log('Raw request body:', {
        ...req.body,
        password: req.body.password ? '[REDACTED]' : undefined
      });
      console.log('Registration request received:', {
        username: req.body.username,
        email: req.body.email,
        hasPassword: !!req.body.password,
        passwordLength: req.body.password?.length,
        bodyKeys: Object.keys(req.body)
      });
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        console.log('Validation errors:', {
          errors: validationErrors,
          requestBody: {
            username: req.body.username,
            email: req.body.email,
            hasPassword: !!req.body.password,
            passwordLength: req.body.password?.length,
            bodyKeys: Object.keys(req.body)
          }
        });

        // Return detailed validation error messages
        return res.status(400).json({
          status: 'error',
          message: validationErrors[0].msg,
          errors: validationErrors.map(err => ({
            field: err.param,
            message: err.msg,
            value: err.param === 'password' ? '[REDACTED]' : err.value
          })),
          code: 'VALIDATION_ERROR'
        });
      }

      // Extract and trim fields
      const email = req.body.email.trim().toLowerCase();
      const username = req.body.username.trim();
      const { password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'username';
        console.log(`User already exists with ${field}:`, field === 'email' ? email : username);
        return res.status(400).json({
          status: 'error',
          message: `This ${field} is already registered`,
          code: 'USER_EXISTS'
        });
      }

      // Create user
      const user = new User({
        email,
        password,
        username
      });

      await user.save();
      console.log('User created successfully:', { id: user._id, username: user.username });

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = await generateRefreshToken(user._id);

      res.status(201).json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: ACCESS_TOKEN_EXPIRY
          }
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({
        status: 'error',
        message: err.message || 'Error registering user',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await withRetry(async () => {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('Invalid credentials');
        }
        return user;
      });

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = await generateRefreshToken(user._id);

      res.json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: ACCESS_TOKEN_EXPIRY
          }
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'Invalid credentials') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Error logging in',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

// Refresh access token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Verify refresh token and get user
    const user = await verifyRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = await generateRefreshToken(user._id);

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    res.json({
      status: 'success',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: ACCESS_TOKEN_EXPIRY
        }
      }
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;
    
    if (refreshToken) {
      // Revoke the specific refresh token
      await revokeRefreshToken(refreshToken);
    } else {
      // If no specific token provided, revoke all user's tokens
      await revokeAllUserTokens(req.user._id);
    }

    res.json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error logging out',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Get current user
router.get('/user', auth, async (req, res) => {
  try {
    const user = await withRetry(async () => {
      return await User.findById(req.user._id).select('-password');
    });

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user data',
      code: 'USER_FETCH_ERROR'
    });
  }
});

module.exports = router; 