const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes (require authentication)
router.post('/apply', authenticateToken, mentorController.applyAsMentor);
router.get('/stats', authenticateToken, mentorController.getMentorStats);
router.get('/sessions', authenticateToken, mentorController.getUpcomingSessions);
router.get('/recommended', authenticateToken, mentorController.getRecommendedMentors);
router.get('/me', authenticateToken, mentorController.getCurrentMentor);
router.put('/profile', authenticateToken, mentorController.updateMentorProfile);

// Availability management routes
router.post('/:mentorId/availability', authenticateToken, mentorController.addAvailability);
router.delete('/:mentorId/availability/:slotId', authenticateToken, mentorController.removeAvailability);
router.put('/:mentorId/availability', authenticateToken, mentorController.updateAvailability);
router.post('/setup-availability', authenticateToken, mentorController.setupDefaultAvailability);

// Public routes
router.get('/', mentorController.getMentors); // Route for getting all mentors with filters
router.get('/:mentorId', mentorController.getMentorById); // Route for getting a specific mentor
router.get('/:mentorId/availability', mentorController.getAvailability); // Public route to view availability

module.exports = router; 