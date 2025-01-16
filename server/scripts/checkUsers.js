require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find().select('+password');
    
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`\nName: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password: ${user.password}`);
    });

    console.log(`\nTotal users: ${users.length}`);
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUsers(); 