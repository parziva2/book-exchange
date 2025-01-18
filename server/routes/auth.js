const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Generate username from email
    const username = email.split('@')[0];
    let finalUsername = username;
    let counter = 1;

    // Check if username exists and append number if needed
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${username}${counter}`;
      counter++;
    }

    // Create user
    user = new User({
      email,
      password,
      username: finalUsername,
      firstName,
      lastName,
      roles: ['user']
    });

    await user.save();

    // Create tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      status: 'success',
      data: {
        user: user.formatForClient(),
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error registering user'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    console.log('Checking password for user:', user._id);
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user._id);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is blocked
    if (user.blocked) {
      console.log('Blocked user attempted to login:', user._id);
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been blocked'
      });
    }

    // Create tokens
    console.log('Creating tokens for user:', user._id);
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // Skip validation

    console.log('Login successful for user:', user._id);
    res.json({
      status: 'success',
      data: {
        user: user.formatForClient(),
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging in'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting user'
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear refresh token
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false }); // Skip validation
    }

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging out'
    });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      console.log('Refresh token missing in request');
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
    
    // Find user and check if refresh token matches
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found for refresh token');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    if (user.refreshToken !== refreshToken) {
      console.log('Stored refresh token does not match provided token');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    if (user.blocked) {
      console.log('Blocked user attempted to refresh token');
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been blocked'
      });
    }

    // Generate new tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    console.log('Token refresh successful for user:', user._id);
    res.json({
      status: 'success',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: user.formatForClient()
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token'
    });
  }
});

module.exports = router; 