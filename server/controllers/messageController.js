const Message = require('../models/Message');
const User = require('../models/User');

// Get all messages for the current user
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({
      $or: [
        { recipient: userId },
        { sender: userId }
      ]
    })
    .populate('sender', 'firstName lastName avatar')
    .populate('recipient', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      status: 'success',
      data: messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting messages'
    });
  }
};

// Get conversation with a specific user
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })
    .populate('sender', 'firstName lastName avatar')
    .populate('recipient', 'firstName lastName avatar')
    .sort({ createdAt: 1 });

    res.json({
      status: 'success',
      data: messages
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting conversation'
    });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, sessionId } = req.body;
    const sender = req.user.id;

    console.log('Sending message:', { recipientId, content, sessionId, sender });

    // Check if recipient exists
    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipient not found'
      });
    }

    const message = new Message({
      sender,
      recipient: recipientId,
      content,
      sessionId
    });

    await message.save();

    // Populate sender and recipient details
    await message.populate('sender', 'firstName lastName avatar');
    await message.populate('recipient', 'firstName lastName avatar');

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.to(recipientId.toString()).emit('new_message', message);
    }

    res.status(201).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Request body:', req.body);
    console.error('User:', req.user);
    res.status(500).json({
      status: 'error',
      message: 'Error sending message'
    });
  }
};

// Mark a message as read
exports.markAsRead = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, recipient: userId, read: false },
      { read: true },
      { new: true }
    )
    .populate('sender', 'firstName lastName avatar')
    .populate('recipient', 'firstName lastName avatar');

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found or already read'
      });
    }

    res.json({
      status: 'success',
      message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error marking message as read'
    });
  }
};

// Mark all messages as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Message.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.json({
      status: 'success',
      updatedCount: result.nModified
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error marking all messages as read'
    });
  }
}; 