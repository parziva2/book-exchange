const jwt = require('jsonwebtoken');
const { withRetry } = require('../utils/mongoRetry');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
      return res.status(401).json({ 
        status: 'error',
        message: 'No authentication token, access denied',
        code: 'AUTH_NO_TOKEN'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database with retry
      const user = await withRetry(async () => {
        const user = await User.findById(decoded.userId)
          .select('-password')
          .lean();
        
        if (!user) {
          throw new Error('User not found');
        }
        
        return user;
      });

      // Add user and token to request
      req.user = user;
      req.token = token;

      next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid authentication token',
          code: 'AUTH_INVALID_TOKEN'
        });
      }
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication token expired',
          code: 'AUTH_TOKEN_EXPIRED'
        });
      }

      if (err.message === 'User not found') {
        return res.status(401).json({
          status: 'error',
          message: 'User no longer exists',
          code: 'AUTH_USER_NOT_FOUND'
        });
      }

      throw err;
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
}; 