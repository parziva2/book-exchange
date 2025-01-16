const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }
});

const dayAvailabilitySchema = new mongoose.Schema({
  available: {
    type: Boolean,
    default: false
  },
  slots: [timeSlotSchema]
});

const expertiseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    required: true
  },
  description: String,
  yearsOfExperience: Number
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  field: String,
  startDate: Date,
  endDate: Date,
  current: Boolean
});

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  description: String,
  startDate: Date,
  endDate: Date,
  current: Boolean
});

const mentorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true,
    maxlength: 1000
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  expertise: [expertiseSchema],
  languages: [{
    type: String,
    required: true
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  location: {
    country: String,
    city: String,
    timezone: String
  },
  education: [educationSchema],
  experience: [experienceSchema],
  availability: {
    monday: dayAvailabilitySchema,
    tuesday: dayAvailabilitySchema,
    wednesday: dayAvailabilitySchema,
    thursday: dayAvailabilitySchema,
    friday: dayAvailabilitySchema,
    saturday: dayAvailabilitySchema,
    sunday: dayAvailabilitySchema
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Index for search performance
mentorSchema.index({ 'expertise.category': 1, 'expertise.level': 1 });
mentorSchema.index({ rating: -1, totalReviews: -1 });
mentorSchema.index({ hourlyRate: 1 });
mentorSchema.index({ languages: 1 });

// Virtual for average rating
mentorSchema.virtual('averageRating').get(function() {
  return this.totalReviews > 0 ? this.rating / this.totalReviews : 0;
});

// Method to update rating
mentorSchema.methods.updateRating = async function(newRating) {
  const oldTotal = this.rating * this.totalReviews;
  this.totalReviews += 1;
  this.rating = (oldTotal + newRating) / this.totalReviews;
  await this.save();
};

const Mentor = mongoose.model('Mentor', mentorSchema);

module.exports = Mentor; 