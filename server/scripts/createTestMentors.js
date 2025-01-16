require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Mentor = require('../src/models/mentor');

const testMentors = [
  {
    user: {
      name: 'John Developer',
      email: 'john@example.com',
      password: 'Password123',
      role: 'mentor',
      username: 'johndeveloper'
    },
    profile: {
      bio: 'Full-stack developer with focus on React and Node.js',
      expertise: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      experience: '7 years in web development',
      education: 'MS in Computer Science',
      hourlyRate: 75,
      languages: ['English'],
      certificates: 'AWS Solutions Architect',
      rating: 4.8
    }
  },
  {
    user: {
      name: 'Maria Designer',
      email: 'maria@example.com',
      password: 'Password123',
      role: 'mentor',
      username: 'mariadesigner'
    },
    profile: {
      bio: 'UI/UX designer specializing in user-centered design',
      expertise: ['UI Design', 'UX Design', 'Figma', 'Adobe XD'],
      experience: '5 years in design',
      education: 'BFA in Design',
      hourlyRate: 60,
      languages: ['English', 'Spanish'],
      certificates: 'Google UX Design Certificate',
      rating: 4.6
    }
  },
  {
    user: {
      name: 'Alex Data',
      email: 'alex@example.com',
      password: 'Password123',
      role: 'mentor',
      username: 'alexdata'
    },
    profile: {
      bio: 'Data scientist with expertise in machine learning',
      expertise: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
      experience: '4 years in data science',
      education: 'PhD in Statistics',
      hourlyRate: 90,
      languages: ['English', 'French'],
      certificates: 'TensorFlow Developer Certificate',
      rating: 4.9
    }
  }
];

async function createTestMentors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const testMentor of testMentors) {
      // Create user
      const user = new User(testMentor.user);
      await user.save();
      console.log('Created user:', user.name);

      // Create mentor profile
      const mentor = new Mentor({
        user: user._id,
        ...testMentor.profile
      });
      await mentor.save();
      console.log('Created mentor profile for:', user.name);
    }

    console.log('All test mentors created successfully');
  } catch (error) {
    console.error('Error creating test mentors:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestMentors(); 