const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
    };

    mongoose.connection.on('connecting', () => {
      console.log('Connecting to MongoDB...');
    });

    mongoose.connection.on('connected', () => {
      console.log('Successfully connected to MongoDB');
      console.log(`Database: ${mongoose.connection.name}`);
      console.log(`Host: ${mongoose.connection.host}`);
    });

    mongoose.connection.on('disconnecting', () => {
      console.log('Disconnecting from MongoDB...');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Disconnected from MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
    });

    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    await mongoose.connect(process.env.MONGODB_URI, options);
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    // Exit process with failure if we can't connect to database
    process.exit(1);
  }
};

module.exports = connectDB; 