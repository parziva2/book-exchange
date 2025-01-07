const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const auth = require('../middleware/auth');
const { sessionLimiter, videoTokenLimiter } = require('../middleware/rateLimiter');
const { sessionValidation, feedbackValidation } = require('../middleware/validate');

// Apply rate limiting before auth checks
router.post('/', sessionLimiter);
router.post('/:id/video-token', videoTokenLimiter);

// All routes require authentication
router.use(auth);

// Session management
router.post('/', sessionValidation, sessionController.createSession);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSession);
router.patch('/:id/status', sessionController.updateStatus);
router.post('/:id/feedback', feedbackValidation, sessionController.addFeedback);

// Video call
router.post('/:id/video-token', sessionController.getVideoToken);

module.exports = router; 