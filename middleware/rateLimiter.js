const rateLimit = require('express-rate-limit');

// General API rate limit
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Auth rate limit
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login/register attempts per hour
  message: 'Too many auth attempts from this IP, please try again later'
});

// Message rate limit
exports.messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 messages per minute
  message: 'Too many messages sent, please try again later'
});

// Session booking rate limit
exports.sessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 session bookings per hour
  message: 'Too many session booking attempts, please try again later'
});

// Video token rate limit
exports.videoTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 video token requests per hour
  message: 'Too many video token requests, please try again later'
}); 