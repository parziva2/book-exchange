const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

/**
 * Create a test user and return the user data and auth token
 * @param {Object} userData Optional user data to override defaults
 * @returns {Promise<{user: Object, token: string}>}
 */
async function createTestUser(userData = {}) {
  const defaultUser = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    ...userData
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(defaultUser);

  return {
    user: res.body.user,
    token: res.body.token
  };
}

/**
 * Clear all collections in the test database
 */
async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
}

/**
 * Create an auth header with the given token
 * @param {string} token JWT token
 * @returns {Object} Headers object with Authorization
 */
function authHeader(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

module.exports = {
  createTestUser,
  clearDatabase,
  authHeader
}; 