const request = require('supertest');
const { app } = require('../../server');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const http = require('http');

describe('Auth Controller', () => {
  let testServer;

  beforeAll(async () => {
    testServer = http.createServer(app);
    await new Promise((resolve) => {
      testServer.listen(0, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => testServer.close(resolve));
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      const res = await request(testServer)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', validUser.username);
      expect(res.body.user).toHaveProperty('email', validUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      await User.create(validUser);

      const res = await request(testServer)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(testServer)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(testServer)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      userId = user._id;
      token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should get user profile with valid token', async () => {
      const res = await request(testServer)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });

    it('should not get profile without token', async () => {
      const res = await request(testServer)
        .get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(testServer)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/auth/profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      userId = user._id;
      token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should update user profile successfully', async () => {
      const updates = {
        username: 'updateduser',
        profile: {
          bio: 'Updated bio'
        }
      };

      const res = await request(testServer)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', updates.username);
      expect(res.body.profile).toHaveProperty('bio', updates.profile.bio);
    });

    it('should not update with invalid data', async () => {
      const updates = {
        username: 'a' // too short
      };

      const res = await request(testServer)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
}); 