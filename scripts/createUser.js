require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const user = new User({
      username: 'alexfedco2',
      email: 'alexfedco2@gmail.com',
      password: 'Kingalex-8',
      firstName: 'Alexandru',
      lastName: 'Fedco'
    });

    await user.save();
    console.log('User created successfully:', {
      id: user._id,
      username: user.username,
      email: user.email
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

createUser(); 