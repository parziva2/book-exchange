const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createGroupSession,
  getGroupSessions,
  getGroupSession,
  joinGroupSession,
  updateGroupSession,
  cancelGroupSession,
  leaveGroupSession
} = require('../controllers/groupSessionController');

// Public routes
router.get('/', getGroupSessions);
router.get('/:id', getGroupSession);

// Protected routes
router.use(protect);

// Mentor only routes
router.post('/', restrictTo('mentor'), createGroupSession);
router.patch('/:id', restrictTo('mentor'), updateGroupSession);
router.patch('/:id/cancel', restrictTo('mentor'), cancelGroupSession);

// Participant routes
router.post('/:id/join', joinGroupSession);
router.delete('/:id/leave', leaveGroupSession);

module.exports = router; 