const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60 // minutes
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'scheduled', 'in_progress'],
    default: 'pending'
  },
  topic: {
    type: String,
    required: true
  },
  note: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending'
  },
  twilioRoomId: {
    type: String,
    unique: true,
    sparse: true
  },
  twilioRoomStatus: {
    type: String,
    enum: ['created', 'in_progress', 'completed', 'failed'],
    default: 'created'
  },
  participantTokens: {
    mentor: String,
    mentee: String
  },
  meetingUrl: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String
  },
  cancelReason: {
    type: String
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  calendarEventId: {
    type: String
  },
  remindersSent: [{
    type: String,
    enum: ['24h', '1h', '15min'],
    default: []
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for common queries
sessionSchema.index({ mentor: 1, startTime: 1 });
sessionSchema.index({ mentee: 1, startTime: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ twilioRoomId: 1 });

module.exports = mongoose.model('Session', sessionSchema); 