require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function deleteNonAdminUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-exchange');
    console.log('Connected to MongoDB');
    
    const result = await User.deleteMany({
      roles: { $nin: ['admin'] }
    });
    
    console.log(`Deleted ${result.deletedCount} non-admin users`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteNonAdminUsers(); 