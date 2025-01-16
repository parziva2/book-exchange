const express = require('express');
const router = express.Router();
const { authenticateToken, requireMentor } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Get reviews for current mentor
router.get('/mentor/me', authenticateToken, requireMentor, reviewController.getCurrentMentorReviews);

// Get reviews for a mentor
router.get('/mentor/:mentorId', reviewController.getMentorReviews);

// Get review statistics for a mentor
router.get('/mentor/:mentorId/stats', reviewController.getMentorReviewStats);

// Create a review
router.post('/', authenticateToken, reviewController.createReview);

module.exports = router; 