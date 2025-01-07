const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Session = require('../../models/Session');
const jwt = require('jsonwebtoken');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Session.deleteMany({});
});

describe('Session Controller', () => {
  let mentee, mentor, menteeToken, session;

  beforeEach(async () => {
    // Create test users
    mentee = await User.create({
      username: 'testmentee',
      email: 'mentee@test.com',
      password: 'password123',
      role: 'mentee'
    });

    mentor = await User.create({
      username: 'testmentor',
      email: 'mentor@test.com',
      password: 'password123',
      role: 'mentor',
      expertise: ['JavaScript', 'React']
    });

    // Create JWT token for mentee
    menteeToken = jwt.sign({ userId: mentee._id }, process.env.JWT_SECRET);

    // Create a test session
    session = await Session.create({
      mentee: mentee._id,
      mentor: mentor._id,
      topic: 'JavaScript Basics',
      date: new Date(),
      duration: 60,
      status: 'scheduled'
    });
  });

  describe('POST /api/sessions/book', () => {
    it('should book a session successfully', async () => {
      const sessionData = {
        mentorId: mentor._id.toString(),
        topic: 'React Fundamentals',
        date: new Date().toISOString(),
        duration: 60
      };

      const response = await request(app)
        .post('/api/sessions/book')
        .set('Authorization', `Bearer ${menteeToken}`)
        .send(sessionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.topic).toBe(sessionData.topic);
      expect(response.body.mentee.toString()).toBe(mentee._id.toString());
      expect(response.body.mentor.toString()).toBe(mentor._id.toString());
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/sessions/book')
        .send({
          mentorId: mentor._id.toString(),
          topic: 'React Fundamentals',
          date: new Date().toISOString(),
          duration: 60
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sessions', () => {
    it('should get user sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${menteeToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]._id.toString()).toBe(session._id.toString());
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/sessions');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sessions/video-token/:sessionId', () => {
    it('should generate a video token successfully', async () => {
      const response = await request(app)
        .get(`/api/sessions/video-token/${session._id}`)
        .set('Authorization', `Bearer ${menteeToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get(`/api/sessions/video-token/${session._id}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not a participant', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@test.com',
        password: 'password123'
      });
      const otherToken = jwt.sign({ userId: otherUser._id }, process.env.JWT_SECRET);

      const response = await request(app)
        .get(`/api/sessions/video-token/${session._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/sessions/:sessionId/status', () => {
    it('should update session status successfully', async () => {
      const response = await request(app)
        .put(`/api/sessions/${session._id}/status`)
        .set('Authorization', `Bearer ${menteeToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put(`/api/sessions/${session._id}/status`)
        .send({ status: 'completed' });

      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not a participant', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@test.com',
        password: 'password123'
      });
      const otherToken = jwt.sign({ userId: otherUser._id }, process.env.JWT_SECRET);

      const response = await request(app)
        .put(`/api/sessions/${session._id}/status`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(403);
    });
  });
}); 