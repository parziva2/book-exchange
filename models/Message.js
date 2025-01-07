const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.post('save', async function(doc) {
  // Update the conversation's lastMessage
  await mongoose.model('Conversation').findByIdAndUpdate(
    doc.conversation,
    { lastMessage: doc._id, updatedAt: Date.now() }
  );
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 