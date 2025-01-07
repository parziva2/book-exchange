const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const { messageRateLimit } = require('../middleware/rateLimiter');

// Create a new message
router.post('/messages', auth, messageRateLimit, chatController.createMessage);

// Get conversation messages
router.get('/conversations/:conversationId/messages', auth, chatController.getMessages);

// Get user conversations
router.get('/conversations', auth, chatController.getConversations);

// Create a new conversation
router.post('/conversations', auth, chatController.createConversation);

module.exports = router; 