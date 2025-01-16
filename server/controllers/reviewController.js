const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;
    
    // Verify the session exists and belongs to the user
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Verify the user was the student in this session
    if (session.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the mentee can review this session'
      });
    }
    
    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed sessions' });
    }
    
    // Check if user has already reviewed this session
    const existingReview = await Review.findOne({ session: sessionId, reviewer: req.user._id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this session' });
    }
    
    // Create the review
    const review = new Review({
      session: sessionId,
      reviewer: req.user._id,
      mentor: session.mentor,
      rating,
      comment
    });
    
    await review.save();
    
    // Calculate new average rating for mentor
    const { averageRating, totalReviews } = await Review.calculateAverageRating(session.mentor);
    
    // Update mentor's rating in User model
    await User.findByIdAndUpdate(session.mentor, {
      'mentorInfo.rating': averageRating,
      'mentorInfo.reviewCount': totalReviews
    });
    
    res.status(201).json({
      message: 'Review created successfully',
      review,
      mentorStats: { averageRating, totalReviews }
    });
    
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

// Get reviews for a mentor
exports.getMentorReviews = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('Fetching reviews for mentor:', mentorId);
    
    // Verify mentor exists first
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      console.log('Mentor not found:', mentorId);
      return res.status(404).json({ 
        status: 'error',
        message: 'Mentor not found' 
      });
    }
    
    console.log('Found mentor:', mentor._id);
    
    const reviews = await Review.find({ mentor: mentorId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reviewer', 'firstName lastName avatar')
      .populate('session', 'topic startTime');
      
    const total = await Review.countDocuments({ mentor: mentorId });
    
    console.log('Found reviews:', reviews.length, 'Total:', total);
    
    // Always return a valid response, even if no reviews exist
    res.json({
      status: 'success',
      data: {
        reviews: reviews || [],
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching mentor reviews:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching reviews', 
      error: error.message,
      stack: error.stack 
    });
  }
};

// Get review statistics for a mentor
exports.getMentorReviewStats = async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    console.log('Fetching review stats for mentor:', mentorId);
    
    // Verify mentor exists first
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      console.log('Mentor not found:', mentorId);
      return res.status(404).json({ 
        status: 'error',
        message: 'Mentor not found' 
      });
    }
    
    console.log('Found mentor:', mentor._id);
    
    const stats = await Review.aggregate([
      { $match: { mentor: mongoose.Types.ObjectId(mentorId) } },
      { $group: {
        _id: '$mentor',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }}
    ]);
    
    console.log('Review stats:', stats);
    
    // Always return a valid response with default values if no stats exist
    const response = {
      status: 'success',
      data: {
        averageRating: stats[0]?.averageRating || 0,
        totalReviews: stats[0]?.totalReviews || 0,
        ratingDistribution: stats[0] ? stats[0].ratingDistribution.reduce((acc, rating) => {
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }) : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching mentor review stats:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching review stats', 
      error: error.message,
      stack: error.stack
    });
  }
};

// Get reviews for current mentor
exports.getCurrentMentorReviews = async (req, res) => {
  try {
    console.log('Getting reviews for mentor:', req.user._id);
    
    const reviews = await Review.find({ mentor: req.user._id })
      .populate('reviewer', 'firstName lastName avatar')
      .populate('session', 'topic startTime duration')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('Found reviews:', reviews.length);

    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: {
        _id: review.reviewer._id,
        name: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
        avatar: review.reviewer.avatar
      },
      session: {
        _id: review.session._id,
        topic: review.session.topic,
        startTime: review.session.startTime,
        duration: review.session.duration
      }
    }));

    res.json({
      status: 'success',
      data: {
        reviews: formattedReviews
      }
    });
  } catch (error) {
    console.error('Error getting mentor reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting mentor reviews',
      details: error.message
    });
  }
}; 