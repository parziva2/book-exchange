const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return this.isNew ? true : true; // Only validate on creation
      },
      message: 'Username is required'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  avatar: {
    type: String,
    default: null
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    validate: {
      validator: function(v) {
        return this.isNew ? true : true; // Only validate on creation
      },
      message: 'First name is required'
    }
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    validate: {
      validator: function(v) {
        return this.isNew ? true : true; // Only validate on creation
      },
      message: 'Last name is required'
    }
  },
  roles: {
    type: [String],
    default: ['user']
  },
  balance: {
    type: Number,
    default: 0
  },
  mentorProfile: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    bio: String,
    expertise: [String],
    hourlyRate: Number,
    rejectionReason: String
  },
  blocked: {
    type: Boolean,
    default: false
  },
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Format user data for client
userSchema.methods.formatForClient = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return {
    ...user,
    balance: this.balance || 0
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User; 