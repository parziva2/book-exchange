require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const userByEmail = await User.findOne({ email: 'alexfedco2@gmail.com' });
    console.log('User found by email:', userByEmail ? {
      id: userByEmail._id,
      username: userByEmail.username,
      email: userByEmail.email,
      firstName: userByEmail.firstName,
      lastName: userByEmail.lastName,
      createdAt: userByEmail.createdAt
    } : null);

    const userByUsername = await User.findOne({ username: 'alexfedco' });
    console.log('User found by username:', userByUsername ? {
      id: userByUsername._id,
      username: userByUsername.username,
      email: userByUsername.email,
      firstName: userByUsername.firstName,
      lastName: userByUsername.lastName,
      createdAt: userByUsername.createdAt
    } : null);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser(); 