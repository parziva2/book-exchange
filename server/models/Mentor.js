const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    default: ''
  },
  expertise: {
    type: [String],
    default: []
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  languages: {
    type: [String],
    default: []
  },
  timezone: {
    type: String,
    default: ''
  },
  certificates: {
    type: [String],
    default: []
  },
  linkedinProfile: {
    type: String,
    default: ''
  },
  portfolioUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  availability: {
    monday: {
      available: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    tuesday: {
      available: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    wednesday: {
      available: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    thursday: {
      available: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    friday: {
      available: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    saturday: {
      available: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String
      }]
    },
    sunday: {
      available: { type: Boolean, default: false },
      slots: [{
        startTime: String,
        endTime: String
      }]
    }
  },
  education: [{
    institution: String,
    degree: String,
    field: String,
    startYear: Number,
    endYear: Number,
    description: String
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
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

// Update the updatedAt timestamp before saving
mentorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Mentor = mongoose.model('Mentor', mentorSchema);

module.exports = Mentor; 