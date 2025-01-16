import jwt_decode from 'jwt-decode';

/**
 * Token storage and management utilities
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Get the access token from storage
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get the refresh token from storage
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Set both tokens in storage
 */
export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

/**
 * Remove both tokens from storage
 */
export const removeTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Get a valid access token (not expired)
 */
export const getValidAccessToken = () => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;

    // Add some buffer time (30 seconds) to prevent edge cases
    if (decoded.exp && decoded.exp > (currentTime + 30)) {
      return token;
    }

    console.warn('Token expired or close to expiry:', {
      exp: decoded.exp,
      currentTime,
      timeLeft: decoded.exp - currentTime
    });

    // Token is expired or close to expiry
    removeTokens();
    return null;
  } catch (error) {
    // Only remove tokens if the token is malformed, not on decode errors
    if (error.name === 'InvalidTokenError') {
      console.error('Invalid token format:', error);
      removeTokens();
    } else {
      console.warn('Error decoding token:', error);
      // Don't remove tokens on decode errors, but log them
      console.debug('Token that caused error:', token);
    }
    return token; // Return the token anyway if it's just a decode error
  }
}; 