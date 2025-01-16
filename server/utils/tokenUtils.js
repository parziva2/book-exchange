const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Token expiry times (in seconds)
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// Store active refresh tokens (in production, use Redis or a database)
const activeRefreshTokens = new Map();

/**
 * Generate an access token for a user
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate a refresh token for a user
 */
const generateRefreshToken = async (userId) => {
  // Generate a random token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Store the token with user ID and expiry
  activeRefreshTokens.set(refreshToken, {
    userId: userId.toString(),
    expiresAt: Date.now() + (REFRESH_TOKEN_EXPIRY * 1000)
  });

  return refreshToken;
};

/**
 * Verify a refresh token and return the associated user
 */
const verifyRefreshToken = async (refreshToken) => {
  const tokenData = activeRefreshTokens.get(refreshToken);
  
  if (!tokenData) {
    throw new Error('Invalid refresh token');
  }

  if (Date.now() >= tokenData.expiresAt) {
    activeRefreshTokens.delete(refreshToken);
    throw new Error('Refresh token expired');
  }

  const user = await mongoose.model('User').findById(tokenData.userId).select('-password');
  if (!user) {
    activeRefreshTokens.delete(refreshToken);
    throw new Error('User not found');
  }

  return user;
};

/**
 * Revoke a specific refresh token
 */
const revokeRefreshToken = async (refreshToken) => {
  activeRefreshTokens.delete(refreshToken);
};

/**
 * Revoke all refresh tokens for a user
 */
const revokeAllUserTokens = async (userId) => {
  const userIdStr = userId.toString();
  
  // Remove all tokens belonging to the user
  for (const [token, data] of activeRefreshTokens.entries()) {
    if (data.userId === userIdStr) {
      activeRefreshTokens.delete(token);
    }
  }
};

/**
 * Clean up expired tokens (should be called periodically)
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [token, data] of activeRefreshTokens.entries()) {
    if (now >= data.expiresAt) {
      activeRefreshTokens.delete(token);
    }
  }
};

// Clean up expired tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
}; 