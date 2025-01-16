const rateLimit = require('express-rate-limit');

// Skip rate limiting in test environment
const skipRateLimit = (req, res, next) => next();

// General API rate limit
exports.apiLimiter = process.env.NODE_ENV === 'test' ? skipRateLimit : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

// Auth rate limit
exports.authLimiter = process.env.NODE_ENV === 'test' ? skipRateLimit : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many auth attempts from this IP, please try again later'
});

// Message rate limit
exports.messageRateLimit = process.env.NODE_ENV === 'test' ? skipRateLimit : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many messages sent, please try again later'
});

// Session booking rate limit
exports.sessionLimiter = process.env.NODE_ENV === 'test' ? skipRateLimit : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many session booking attempts, please try again later'
});

// Video token rate limit
exports.videoTokenLimiter = process.env.NODE_ENV === 'test' ? skipRateLimit : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many video token requests, please try again later'
}); 