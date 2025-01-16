const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can only review a session once
reviewSchema.index({ session: 1, reviewer: 1 }, { unique: true });

// Add a static method to calculate average rating for a mentor
reviewSchema.statics.calculateAverageRating = async function(mentorId) {
  const result = await this.aggregate([
    { $match: { mentor: mentorId } },
    { $group: {
      _id: '$mentor',
      averageRating: { $avg: '$rating' },
      totalReviews: { $sum: 1 }
    }}
  ]);
  return result[0] || { averageRating: 0, totalReviews: 0 };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 