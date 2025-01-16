require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function updatePassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'alexfedco2@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    user.password = 'Kingalex-8';
    await user.save();
    console.log('Password updated successfully');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

updatePassword(); 