const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { messageRateLimit } = require('../middleware/rateLimiter');
const chatController = require('../controllers/chatController');

// Get all conversations for a user
router.get('/conversations', auth, chatController.getConversations);

// Get messages for a conversation
router.get('/conversations/:id', auth, chatController.getMessages);

// Send a message
router.post('/messages', auth, messageRateLimit, chatController.sendMessage);

module.exports = router; 