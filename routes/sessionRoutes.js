const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const auth = require('../middleware/auth');

// Session routes
router.get('/', auth, sessionController.getUserSessions);
router.post('/', auth, sessionController.createSession);
router.get('/:id', auth, sessionController.getSession);
router.put('/:id/status', auth, sessionController.updateSessionStatus);
router.post('/:id/cancel', auth, sessionController.cancelSession);

// Video session routes
router.post('/:id/token', auth, sessionController.getVideoToken);
router.post('/:id/join', auth, sessionController.joinVideoSession);
router.post('/:id/end', auth, sessionController.endVideoSession);

module.exports = router; 