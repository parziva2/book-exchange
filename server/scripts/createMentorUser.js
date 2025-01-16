const mongoose = require('mongoose');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createMentorUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create user
    const hashedPassword = await bcrypt.hash('your_password_here', 10);
    const user = new User({
      username: 'mentor_user',
      email: 'mentor@example.com',
      password: hashedPassword,
      firstName: 'Mentor',
      lastName: 'User',
      roles: ['user', 'mentor'],
      mentorProfile: {
        status: 'approved',
        bio: 'Experienced mentor ready to help',
        expertise: ['Programming', 'Web Development'],
        hourlyRate: 50
      }
    });

    await user.save();
    console.log('User created:', {
      id: user._id,
      roles: user.roles,
      mentorProfile: user.mentorProfile
    });

    // Create mentor document
    const mentor = new Mentor({
      user: user._id,
      bio: user.mentorProfile.bio,
      expertise: user.mentorProfile.expertise,
      hourlyRate: user.mentorProfile.hourlyRate,
      status: 'approved'
    });

    await mentor.save();
    console.log('Mentor document created');

    console.log('Setup complete. Your user ID:', user._id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createMentorUser(); 