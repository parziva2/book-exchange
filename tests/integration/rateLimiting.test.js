const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app } = require('../../server');
const User = require('../../models/User');
const Session = require('../../models/Session');
const http = require('http');

describe('Rate Limiting Integration Tests', () => {
  let testServer;
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create test server
    testServer = http.createServer(app);
    await new Promise((resolve) => {
      testServer.listen(0, () => resolve());
    });

    // Create a test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      credits: 1000 // Add credits for session creation
    });

    userId = user._id;
    authToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await new Promise((resolve) => testServer.close(resolve));
  });

  describe('Auth Rate Limiting', () => {
    it('should block excessive login attempts', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };

      // Make multiple login attempts
      for (let i = 0; i < 5; i++) {
        await request(testServer)
          .post('/api/auth/login')
          .send(loginData);
      }

      // Next attempt should be blocked
      const res = await request(testServer)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(429);
      expect(res.body.error).toContain('Too many login attempts');
    });
  });

  describe('Session Rate Limiting', () => {
    let mentorId;

    beforeAll(async () => {
      // Create a mentor user
      const mentor = await User.create({
        username: 'testmentor',
        email: 'mentor@example.com',
        password: 'password123',
        expertise: [{
          topic: 'Test Topic',
          level: 'expert',
          hourlyRate: 50
        }]
      });
      mentorId = mentor._id;
    });

    it('should block excessive session creation attempts', async () => {
      const sessionData = {
        mentorId,
        topic: 'Test Topic',
        scheduledDate: new Date(Date.now() + 86400000),
        duration: 60
      };

      // Make multiple session creation attempts
      for (let i = 0; i < 10; i++) {
        await request(testServer)
          .post('/api/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sessionData);
      }

      // Next attempt should be blocked
      const res = await request(testServer)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData);

      expect(res.status).toBe(429);
      expect(res.body.error).toContain('Too many session booking attempts');
    });
  });

  describe('Chat Rate Limiting', () => {
    let conversationId;

    beforeAll(async () => {
      // Create a test conversation
      const conversation = await Conversation.create({
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

      // Make multiple message sending attempts
      for (let i = 0; i < 30; i++) {
        await request(testServer)
          .post('/api/chat/messages')
          .set('Authorization', `Bearer ${authToken}`)
          .send(messageData);
      }

      // Next attempt should be blocked
      const res = await request(testServer)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData);

      expect(res.status).toBe(429);
      expect(res.body.error).toContain('sending messages too quickly');
    });
  });

  describe('Video Token Rate Limiting', () => {
    let sessionId;

    beforeAll(async () => {
      // Create a test session
      const session = await Session.create({
        mentor: new mongoose.Types.ObjectId(),
        mentee: userId,
        topic: 'Test Topic',
        scheduledDate: new Date(Date.now() + 86400000),
        duration: 60,
        price: 50 // Add price to satisfy validation
      });
      sessionId = session._id;
    });

    it('should block excessive video token requests', async () => {
      // Make multiple token requests
      for (let i = 0; i < 5; i++) {
        await request(testServer)
          .get(`/api/sessions/${sessionId}/video-token`)
          .set('Authorization', `Bearer ${authToken}`);
      }

      // Next attempt should be blocked
      const res = await request(testServer)
        .get(`/api/sessions/${sessionId}/video-token`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(429);
      expect(res.body.error).toContain('Too many video token requests');
    });
  });
}); 