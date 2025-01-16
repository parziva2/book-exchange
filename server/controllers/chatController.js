const Chat = require('../models/Chat');

// Get all chats for current user
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    })
    .populate('participants', 'username firstName lastName avatar')
    .sort('-updatedAt');

    const formattedChats = chats.map(chat => chat.formatForClient(req.user.id));

    res.json({
      status: 'success',
      data: formattedChats
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get chats'
    });
  }
};

// Get messages for a specific chat
exports.getChatMessages = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.id
    }).populate('messages.senderId', 'username firstName lastName avatar');

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    const messages = chat.messages.map(msg => chat.formatMessage(msg));

    res.json({
      status: 'success',
      data: {
        chat: chat.formatForClient(req.user.id),
        messages
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get messages'
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { content, recipientId, sessionId } = req.body;

    let chat = await Chat.findOne({
      participants: {
        $all: [req.user.id, recipientId]
      }
    });

    if (!chat) {
      chat = new Chat({
        participants: [req.user.id, recipientId],
        messages: [],
        unreadCount: new Map(),
        sessionId
      });
    }

    const message = {
      senderId: req.user.id,
      content,
      timestamp: new Date(),
      read: false
    };

    chat.messages.push(message);
    chat.lastMessage = message;

    // Update unread count for recipient
    const recipientUnreadCount = chat.unreadCount.get(recipientId) || 0;
    chat.unreadCount.set(recipientId, recipientUnreadCount + 1);

    await chat.save();

    // Populate sender info for the response
    await chat.populate('messages.senderId', 'username firstName lastName avatar');

    const lastMessage = chat.messages[chat.messages.length - 1];
    const formattedMessage = chat.formatMessage(lastMessage);

    // Emit socket event if socket.io is available
    if (req.io) {
      req.io.to(recipientId).emit('new_message', formattedMessage);
    }

    res.json({
      status: 'success',
      data: formattedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message'
    });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.id
    });

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Mark all messages from other participants as read
    let updated = false;
    chat.messages.forEach(msg => {
      if (msg.senderId.toString() !== req.user.id && !msg.read) {
        msg.read = true;
        updated = true;
      }
    });

    if (updated) {
      // Reset unread count for current user
      chat.unreadCount.set(req.user.id.toString(), 0);
      await chat.save();
    }

    res.json({
      status: 'success',
      data: {
        chatId: chat._id
      }
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark messages as read'
    });
  }
}; 