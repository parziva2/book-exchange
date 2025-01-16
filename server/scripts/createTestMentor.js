require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Mentor = require('../src/models/mentor');

async function createTestMentor() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test user
    const user = new User({
      name: 'Test Mentor',
      email: 'testmentor@example.com',
      password: 'Password123',
      role: 'mentor'
    });

    await user.save();
    console.log('Created test user:', user._id);

    // Create mentor profile
    const mentor = new Mentor({
      user: user._id,
      bio: 'Experienced software developer with 5+ years of experience',
      expertise: ['JavaScript', 'React', 'Node.js'],
      experience: '5+ years in web development',
      education: 'BS in Computer Science',
      hourlyRate: 50,
      languages: ['English', 'Spanish'],
      certificates: 'AWS Certified Developer',
      linkedinProfile: 'https://linkedin.com/testmentor',
      portfolioUrl: 'https://github.com/testmentor',
      rating: 4.5
    });

    await mentor.save();
    console.log('Created mentor profile:', mentor._id);

    console.log('Test mentor created successfully');
  } catch (error) {
    console.error('Error creating test mentor:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestMentor(); 