const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check for the specific user
    const userId = '67862229810235cfb738a71b';
    const user = await User.findById(userId);
    
    if (user) {
      console.log('User found:', {
        id: user._id,
        roles: user.roles,
        email: user.email
      });
    } else {
      console.log('User not found');
      
      // List all users in the database
      const allUsers = await User.find({}, '_id email roles');
      console.log('\nAll users in database:');
      console.log(allUsers);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser(); 