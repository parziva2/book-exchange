const mongoose = require('mongoose');

const groupSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the session'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a description for the session'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A session must have a mentor']
    },
    startTime: {
      type: Date,
      required: [true, 'Please provide a start time for the session']
    },
    duration: {
      type: Number,
      required: [true, 'Please provide the duration in minutes'],
      min: [30, 'Session must be at least 30 minutes'],
      max: [180, 'Session cannot be longer than 3 hours']
    },
    maxParticipants: {
      type: Number,
      required: [true, 'Please provide the maximum number of participants'],
      min: [2, 'Session must allow at least 2 participants'],
      max: [20, 'Session cannot have more than 20 participants']
    },
    price: {
      type: Number,
      required: [true, 'Please provide the price per participant'],
      min: [0, 'Price cannot be negative']
    },
    topics: [{
      type: String,
      required: [true, 'Please provide at least one topic'],
      trim: true
    }],
    skillLevel: {
      type: String,
      required: [true, 'Please provide the required skill level'],
      enum: ['beginner', 'intermediate', 'advanced']
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    meetingLink: {
      type: String,
      trim: true
    },
    recordingUrl: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
groupSessionSchema.index({ startTime: 1 });
groupSessionSchema.index({ topics: 1 });
groupSessionSchema.index({ mentor: 1 });
groupSessionSchema.index({ title: 'text', description: 'text' });

// Virtual field for number of participants
groupSessionSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual field for remaining spots
groupSessionSchema.virtual('remainingSpots').get(function() {
  return this.maxParticipants - this.participants.length;
});

// Virtual field for whether the session is full
groupSessionSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.maxParticipants;
});

// Method to check if a user is enrolled
groupSessionSchema.methods.isUserEnrolled = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Pre-save middleware to update status based on time
groupSessionSchema.pre('save', function(next) {
  const now = new Date();
  if (this.startTime <= now && this.status === 'scheduled') {
    this.status = 'in-progress';
  }
  if (this.startTime.getTime() + this.duration * 60000 <= now.getTime() && 
      ['scheduled', 'in-progress'].includes(this.status)) {
    this.status = 'completed';
  }
  next();
});

const GroupSession = mongoose.model('GroupSession', groupSessionSchema);

module.exports = GroupSession; 