require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/user');

async function createSpecificUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing user if exists
    await User.deleteOne({ email: 'alexfedco2@gmail.com' });
    console.log('Cleaned up any existing user');

    // Create user with password hashing handled by the User model
    const user = new User({
      name: 'Alex Fedco',
      email: 'alexfedco2@gmail.com',
      password: 'Kingalex-8',
      role: 'user'
    });

    await user.save();
    console.log('Created user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hashedPassword: user.password
    });

    console.log('\nUser created successfully with:');
    console.log('Email: alexfedco2@gmail.com');
    console.log('Password: Kingalex-8');
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createSpecificUser(); 