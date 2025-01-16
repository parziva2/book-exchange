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
  topic: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'confirmed', 'completed', 'cancelled', 'scheduled', 'in_progress'],
    default: 'pending',
    required: true
  },
  meetingLink: String,
  studentReview: {
    rating: Number,
    comment: String
  },
  mentorReview: {
    rating: Number,
    comment: String
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add a virtual getter for status to ensure it's always accessible
sessionSchema.virtual('sessionStatus').get(function() {
  return this.status || 'pending';
});

// Add indexes for common queries
sessionSchema.index({ mentor: 1, startTime: 1 });
sessionSchema.index({ mentee: 1, startTime: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ twilioRoomId: 1 });

module.exports = mongoose.model('Session', sessionSchema); 