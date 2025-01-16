const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Profile Routes', () => {
  let token;
  let testUser;

  beforeEach(async () => {
    await User.deleteMany({});

    // Create a test user and get token
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    token = registerRes.body.token;
    testUser = registerRes.body.user;
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('username', testUser.username);
      expect(res.body).toHaveProperty('firstName', testUser.firstName);
      expect(res.body).toHaveProperty('lastName', testUser.lastName);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'No token, authorization denied');
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Token is not valid');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Test bio',
        expertise: ['JavaScript', 'React']
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('firstName', updateData.firstName);
      expect(res.body).toHaveProperty('lastName', updateData.lastName);
      expect(res.body).toHaveProperty('bio', updateData.bio);
      expect(res.body.expertise).toEqual(expect.arrayContaining(updateData.expertise));

      // Verify changes in database
      const updatedUser = await User.findById(testUser.id);
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      expect(updatedUser.bio).toBe(updateData.bio);
    });

    it('should not update email through profile update', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Email cannot be updated through profile');

      // Verify email hasn't changed in database
      const user = await User.findById(testUser.id);
      expect(user.email).toBe(testUser.email);
    });

    it('should validate profile update data', async () => {
      const updateData = {
        firstName: '' // Invalid empty first name
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'First name is required');
    });
  });
}); 