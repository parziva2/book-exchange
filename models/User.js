const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isMentor: {
    type: Boolean,
    default: false
  },
  roles: {
    type: [String],
    default: ['user']
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
  experience: {
    type: String,
    default: ''
  },
  education: {
    type: String,
    default: ''
  },
  availability: {
    type: String,
    default: ''
  },
  languages: {
    type: [String],
    default: []
  },
  mentorSince: {
    type: Date,
    default: null
  },
  rating: {
    type: Number,
    default: 0
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  balance: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Create indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isMentor: 1 });
userSchema.index({ roles: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 