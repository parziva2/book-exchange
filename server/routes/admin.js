const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Protected admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:userId', adminController.deleteUser);

// Mentor management
router.get('/mentors/pending', adminController.getPendingMentors);
router.get('/mentors/active', adminController.getActiveMentors);
router.get('/mentors/approved', adminController.getApprovedMentors);
router.put('/mentors/:mentorId/approve', adminController.approveMentor);
router.post('/mentors/:mentorId/reject', authenticateToken, requireAdmin, adminController.rejectMentor);
router.post('/mentors/:mentorId/revoke', authenticateToken, requireAdmin, adminController.revokeMentorStatus);
router.put('/mentors/:mentorId/toggle-block', adminController.toggleBlockMentor);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router; 