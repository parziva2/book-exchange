const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

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
  const token = crypto.randomBytes(40).toString('hex');
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  // Create and save the refresh token
  const refreshToken = new RefreshToken({
    token,
    user: userId,
    expiresAt
  });
  
  await refreshToken.save();
  return token;
};

/**
 * Verify a refresh token and return the associated user
 */
const verifyRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).populate('user', '-password');
  
  if (!refreshToken) {
    throw new Error('Invalid or expired refresh token');
  }
  
  return refreshToken.user;
};

/**
 * Revoke a refresh token
 */
const revokeRefreshToken = async (token) => {
  await RefreshToken.findOneAndUpdate(
    { token },
    { isRevoked: true }
  );
};

/**
 * Revoke all refresh tokens for a user
 */
const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany(
    { user: userId },
    { isRevoked: true }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
}; 