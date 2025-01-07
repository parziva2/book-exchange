const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const { generateToken } = require('../../utils/auth');

describe('Chat Controller', () => {
  let token;
  let user;
  let conversation;

  beforeAll(async () => {
    user = new mongoose.Types.ObjectId();
    token = generateToken(user);
  });

  beforeEach(async () => {
    // Create a test conversation before each test
    conversation = await Conversation.create({
      participants: [user, new mongoose.Types.ObjectId()],
      type: 'direct'
    });
  });

  describe('POST /api/chat/messages', () => {
    it('should create a new message', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          conversationId: conversation._id,
          content: 'Test message'
        });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Test message');
      expect(response.body.sender.toString()).toBe(user.toString());
    });

    it('should return 400 if conversation ID is missing', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test message'
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 if conversation does not exist', async () => {
      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          conversationId: new mongoose.Types.ObjectId(),
          content: 'Test message'
        });

      expect(response.status).toBe(404);
    });

    it('should return 403 if user is not a participant', async () => {
      const nonParticipantUser = new mongoose.Types.ObjectId();
      const nonParticipantToken = generateToken(nonParticipantUser);

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${nonParticipantToken}`)
        .send({
          conversationId: conversation._id,
          content: 'Test message'
        });

      expect(response.status).toBe(403);
    });
  });
}); 