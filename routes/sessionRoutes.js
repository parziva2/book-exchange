const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Session routes
router.post('/', sessionController.createSession);
router.get('/', sessionController.getUserSessions);
router.patch('/:id/status', sessionController.updateSessionStatus);
router.post('/:id/feedback', sessionController.addFeedback);

module.exports = router; 