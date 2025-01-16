const request = require('supertest');
const { app } = require('../../server');
const User = require('../../models/User');

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', validUser.username);
      expect(res.body.user).toHaveProperty('email', validUser.email);
      expect(res.body.user).toHaveProperty('firstName', validUser.firstName);
      expect(res.body.user).toHaveProperty('lastName', validUser.lastName);
    });

    it('should not register user with existing email', async () => {
      // Create a user first
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      // Try to create another user with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Username or email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('username', testUser.username);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    beforeEach(async () => {
      // Create a test user and get token
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      token = res.body.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('username', testUser.username);
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

  describe('PATCH /api/auth/profile', () => {
    let token;
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    beforeEach(async () => {
      // Create a test user and get token
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      token = res.body.token;
    });

    it('should update user profile successfully', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Test bio'
      };

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('firstName', updates.firstName);
      expect(res.body).toHaveProperty('lastName', updates.lastName);
      expect(res.body.profile).toHaveProperty('bio', updates.bio);
    });

    it('should not update with invalid data', async () => {
      const updates = {
        firstName: ''  // Invalid empty first name
      };

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'First name is required');
    });
  });
}); 