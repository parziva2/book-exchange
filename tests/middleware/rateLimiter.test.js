const request = require('supertest');
const express = require('express');
const { apiLimiter, authLimiter, messageRateLimit, sessionLimiter, videoTokenLimiter } = require('../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('API Rate Limiter', () => {
    beforeEach(() => {
      app.use('/api', apiLimiter);
      app.get('/api/test', (req, res) => res.json({ message: 'success' }));
    });

    it('should allow requests within the limit', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app).get('/api/test');
        expect(res.status).toBe(200);
      }
    });

    it('should block requests over the limit', async () => {
      // Make 101 requests (over the 100 limit)
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/test');
      }
      const res = await request(app).get('/api/test');
      expect(res.status).toBe(429);
    });
  });

  describe('Auth Rate Limiter', () => {
    beforeEach(() => {
      app.use('/auth', authLimiter);
      app.post('/auth/login', (req, res) => res.json({ message: 'success' }));
    });

    it('should allow requests within the limit', async () => {
      for (let i = 0; i < 3; i++) {
        const res = await request(app).post('/auth/login');
        expect(res.status).toBe(200);
      }
    });

    it('should block requests over the limit', async () => {
      // Make 6 requests (over the 5 limit)
      for (let i = 0; i < 5; i++) {
        await request(app).post('/auth/login');
      }
      const res = await request(app).post('/auth/login');
      expect(res.status).toBe(429);
    });
  });

  describe('Message Rate Limiter', () => {
    beforeEach(() => {
      app.use('/messages', messageRateLimit);
      app.post('/messages', (req, res) => res.json({ message: 'success' }));
    });

    it('should allow messages within the limit', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(app).post('/messages');
        expect(res.status).toBe(200);
      }
    });

    it('should block messages over the limit', async () => {
      // Make 31 requests (over the 30 limit)
      for (let i = 0; i < 30; i++) {
        await request(app).post('/messages');
      }
      const res = await request(app).post('/messages');
      expect(res.status).toBe(429);
    });
  });

  describe('Session Rate Limiter', () => {
    beforeEach(() => {
      app.use('/sessions', sessionLimiter);
      app.post('/sessions', (req, res) => res.json({ message: 'success' }));
    });

    it('should allow session bookings within the limit', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app).post('/sessions');
        expect(res.status).toBe(200);
      }
    });

    it('should block session bookings over the limit', async () => {
      // Make 11 requests (over the 10 limit)
      for (let i = 0; i < 10; i++) {
        await request(app).post('/sessions');
      }
      const res = await request(app).post('/sessions');
      expect(res.status).toBe(429);
    });
  });

  describe('Video Token Rate Limiter', () => {
    beforeEach(() => {
      app.use('/video', videoTokenLimiter);
      app.post('/video/token', (req, res) => res.json({ message: 'success' }));
    });

    it('should allow token requests within the limit', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(app).post('/video/token');
        expect(res.status).toBe(200);
      }
    });

    it('should block token requests over the limit', async () => {
      // Make 21 requests (over the 20 limit)
      for (let i = 0; i < 20; i++) {
        await request(app).post('/video/token');
      }
      const res = await request(app).post('/video/token');
      expect(res.status).toBe(429);
    });
  });
}); 