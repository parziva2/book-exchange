const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const resetAdminPassword = async () => {
  try {
    // Find admin user
    const admin = await User.findOne({ email: 'admin@bookexchange.com' });
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }

    // Update password
    admin.password = 'admin123';
    await admin.save();

    console.log('Admin password reset successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
};

resetAdminPassword(); 