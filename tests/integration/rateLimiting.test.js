const request = require('supertest');
const { app } = require('../../server');
const User = require('../../models/User');
const mongoose = require('mongoose');

describe('Rate Limiting Integration Tests', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});

    // Create test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    userId = user._id;

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    token = loginRes.body.token;
  });

  describe('Auth Rate Limiting', () => {
    it('should block excessive login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple login attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData);
      }

      // This attempt should be rate limited
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many login attempts');
    });
  });

  describe('Session Rate Limiting', () => {
    it('should block excessive session creation attempts', async () => {
      const sessionData = {
        mentorId: new mongoose.Types.ObjectId(),
        startTime: new Date(),
        duration: 30
      };

      // Make multiple session creation attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/sessions')
          .set('Authorization', `Bearer ${token}`)
          .send(sessionData);
      }

      // This attempt should be rate limited
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send(sessionData);

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many session booking attempts');
    });
  });

  describe('Chat Rate Limiting', () => {
    let conversationId;

    beforeAll(async () => {
      // Create a test conversation
      const conversation = await mongoose.model('Conversation').create({
        participants: [userId, new mongoose.Types.ObjectId()],
        type: 'direct'
      });
      conversationId = conversation._id;
    });

    it('should block excessive message sending', async () => {
      const messageData = {
        conversationId,
        content: 'Test message'
      };

      // Send multiple messages
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/chat/messages')
          .set('Authorization', `Bearer ${token}`)
          .send(messageData);
      }

      // This attempt should be rate limited
      const res = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData);

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many messages');
    });
  });

  describe('Video Token Rate Limiting', () => {
    it('should block excessive video token requests', async () => {
      // Create a session first
      const session = await mongoose.model('Session').create({
        mentor: new mongoose.Types.ObjectId(),
        mentee: userId,
        startTime: new Date(),
        duration: 30,
        status: 'scheduled'
      });

      // Make multiple token requests
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post(`/api/sessions/${session._id}/video-token`)
          .set('Authorization', `Bearer ${token}`);
      }

      // This attempt should be rate limited
      const res = await request(app)
        .post(`/api/sessions/${session._id}/video-token`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many video token requests');
    });
  });
}); 