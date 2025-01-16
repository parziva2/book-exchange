const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

// Protect all routes
router.use(authenticateToken);

// Session management endpoints
router.post('/', sessionController.createSession);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSession);
router.post('/:id/accept', sessionController.acceptSession);
router.post('/:id/cancel', sessionController.cancelSession);
router.post('/:id/reschedule', sessionController.rescheduleSession);

// Video chat endpoints
router.route('/:id/token')
  .get(sessionController.getVideoToken)
  .post(sessionController.getVideoToken);
router.post('/:id/join', sessionController.joinRoom);

module.exports = router; 