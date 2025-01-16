const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [messageSchema],
  lastMessage: {
    type: messageSchema,
    default: null
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: () => new Map()
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for common queries
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ 'messages.senderId': 1 });
chatSchema.index({ sessionId: 1 });

// Pre-save middleware to update timestamps
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to format chat for client
chatSchema.methods.formatForClient = function(userId) {
  const otherParticipant = this.participants.find(p => p._id.toString() !== userId);
  return {
    id: this._id,
    recipientId: otherParticipant._id,
    recipientName: otherParticipant.username || `${otherParticipant.firstName} ${otherParticipant.lastName}`,
    recipientAvatar: otherParticipant.avatar,
    lastMessage: this.lastMessage?.content,
    timestamp: this.updatedAt,
    unread: this.unreadCount.get(userId.toString()) || 0,
    sessionId: this.sessionId
  };
};

// Method to format message for client
chatSchema.methods.formatMessage = function(msg) {
  return {
    id: msg._id,
    content: msg.content,
    timestamp: msg.timestamp,
    senderId: msg.senderId._id,
    senderName: msg.senderId.username || `${msg.senderId.firstName} ${msg.senderId.lastName}`,
    senderAvatar: msg.senderId.avatar,
    read: msg.read
  };
};

module.exports = mongoose.model('Chat', chatSchema); 