const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate token middleware
exports.authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    // Check if user is blocked
    if (user.blocked) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been blocked'
      });
    }

    // Add user to request
    req.user = {
      _id: user._id,
      roles: user.roles
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};

// Require admin role middleware
exports.requireAdmin = (req, res, next) => {
  if (!req.user.roles.includes('admin')) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

// Require mentor role middleware
exports.requireMentor = (req, res, next) => {
  if (!req.user.roles.includes('mentor')) {
    return res.status(403).json({
      status: 'error',
      message: 'Mentor access required'
    });
  }
  next();
}; 