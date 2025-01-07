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
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 120
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true
  },
  notes: String,
  meetingDetails: {
    roomName: String,
    recordingUrl: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    givenAt: Date
  },
  messages: [{
    sender: {
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
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to update user ratings when feedback is added
sessionSchema.pre('save', async function(next) {
  if (this.isModified('feedback') && this.feedback.rating) {
    try {
      const User = mongoose.model('User');
      const mentor = await User.findById(this.mentor);
      
      const sessions = await this.constructor.find({
        mentor: this.mentor,
        'feedback.rating': { $exists: true }
      });
      
      const totalRatings = sessions.length;
      const averageRating = sessions.reduce((acc, session) => 
        acc + session.feedback.rating, 0) / totalRatings;
      
      mentor.ratings = {
        average: averageRating,
        count: totalRatings
      };
      
      await mentor.save();
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Virtual for checking if the session is upcoming
sessionSchema.virtual('isUpcoming').get(function() {
  return new Date(this.scheduledDate) > new Date();
});

// Virtual for checking if the session can be joined (within 15 minutes of scheduled time)
sessionSchema.virtual('canJoin').get(function() {
  const now = new Date();
  const sessionTime = new Date(this.scheduledDate);
  const timeDiff = Math.abs(now - sessionTime);
  return timeDiff <= 15 * 60 * 1000 && this.status === 'confirmed'; // 15 minutes in milliseconds
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session; 