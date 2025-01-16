require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Mentor = require('../src/models/mentor');

async function approveMentors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with mentor role
    const mentorUsers = await User.find({ role: 'mentor' });
    console.log(`Found ${mentorUsers.length} mentor users`);

    // Update each user's mentor profile status
    for (const user of mentorUsers) {
      const mentor = await Mentor.findOne({ user: user._id });
      if (mentor) {
        mentor.status = 'approved';
        mentor.approvedAt = new Date();
        await mentor.save();
        console.log(`Approved mentor profile for: ${user.name}`);
      }
    }

    console.log('All mentor profiles approved');
  } catch (error) {
    console.error('Error approving mentors:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

approveMentors(); 