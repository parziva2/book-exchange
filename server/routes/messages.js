const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// Protect all routes
router.use(authenticateToken);

// Get all messages for the current user
router.get('/', messageController.getMessages);

// Get conversation with a specific user
router.get('/conversation/:userId', messageController.getConversation);

// Send a new message
router.post('/', messageController.sendMessage);

// Mark a message as read
router.put('/:messageId/read', messageController.markAsRead);

// Mark all messages as read
router.put('/read-all', messageController.markAllAsRead);

module.exports = router; 