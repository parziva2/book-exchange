require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing test user if exists
    await User.deleteOne({ email: 'test@example.com' });
    console.log('Cleaned up any existing test user');

    // Create salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    // Create test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user'
    });

    await user.save();
    console.log('Created test user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hashedPassword: user.password
    });

    console.log('\nYou can now log in with:');
    console.log('Email: test@example.com');
    console.log('Password: test123');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createTestUser(); 