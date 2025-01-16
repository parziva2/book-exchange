const mongoose = require('mongoose');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
require('dotenv').config();

async function checkAndFixMentorProfile() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Your user ID from the token
    const userId = '67862229810235cfb738a71b';

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      return;
    }

    console.log('User found:', {
      id: user._id,
      roles: user.roles,
      mentorProfile: user.mentorProfile
    });

    // Find mentor document
    const mentor = await Mentor.findOne({ user: userId });
    console.log('Mentor document:', mentor);

    // If user has mentor role but no mentor profile, create one
    if (user.roles.includes('mentor') && !user.mentorProfile) {
      user.mentorProfile = {
        status: 'approved',
        bio: 'Experienced mentor ready to help',
        expertise: ['Programming', 'Web Development'],
        hourlyRate: 50
      };
      await user.save();
      console.log('Created mentor profile for user');
    }

    // If no mentor document exists, create one
    if (!mentor) {
      const newMentor = new Mentor({
        user: userId,
        bio: user.mentorProfile?.bio || 'Experienced mentor ready to help',
        expertise: user.mentorProfile?.expertise || ['Programming', 'Web Development'],
        hourlyRate: user.mentorProfile?.hourlyRate || 50,
        status: 'approved'
      });
      await newMentor.save();
      console.log('Created mentor document');
    }

    console.log('Mentor profile check complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAndFixMentorProfile(); 