const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

const setupSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = { id: user._id };
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.id);

    // Join chat room
    socket.on('join_chat', ({ sessionId }) => {
      socket.join(`session_${sessionId}`);
      console.log(`User ${socket.user.id} joined session ${sessionId}`);
    });

    // Leave chat room
    socket.on('leave_chat', ({ sessionId }) => {
      socket.leave(`session_${sessionId}`);
      console.log(`User ${socket.user.id} left session ${sessionId}`);
    });

    // Send message
    socket.on('send_message', async (message) => {
      try {
        // Save message to database
        const newMessage = new Message({
          sessionId: message.sessionId,
          sender: socket.user.id,
          senderName: message.senderName,
          text: message.text,
          timestamp: message.timestamp
        });
        await newMessage.save();

        // Broadcast message to room
        io.to(`session_${message.sessionId}`).emit('new_message', newMessage);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Get chat history
    socket.on('get_chat_history', async ({ sessionId }, callback) => {
      try {
        const messages = await Message.find({ sessionId })
          .sort({ timestamp: 1 })
          .limit(100);
        callback(messages);
      } catch (error) {
        console.error('Error fetching chat history:', error);
        callback([]);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.id);
    });
  });
};

module.exports = setupSocket; 