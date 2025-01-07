const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.userId,
      content
    });

    await message.populate('sender');
    res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Error creating message' });
  }
};

// Get conversation messages
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error getting messages' });
  }
};

// Get user conversations
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.userId
    }).populate('participants lastMessage');

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Error getting conversations' });
  }
};

// Create a new conversation
exports.createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user.userId, participantId] },
      type: 'direct'
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    const conversation = await Conversation.create({
      participants: [req.user.userId, participantId],
      type: 'direct'
    });

    await conversation.populate('participants');
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Error creating conversation' });
  }
}; 