const Session = require('../models/Session');
const User = require('../models/User');
const twilio = require('twilio');
const AccessToken = require('twilio').AccessToken;
const VideoGrant = require('twilio').VideoGrant;

// Create a new session
exports.createSession = async (req, res) => {
  try {
    const { mentorId, topic, scheduledDate, duration, notes } = req.body;

    // Find mentor
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Check if mentor has expertise in the topic
    const hasExpertise = mentor.expertise.some(exp => exp.topic === topic);
    if (!hasExpertise) {
      return res.status(400).json({ error: 'Mentor does not have expertise in this topic' });
    }

    // Calculate price based on mentor's hourly rate
    const expertise = mentor.expertise.find(exp => exp.topic === topic);
    const price = (expertise.hourlyRate / 60) * duration;

    // Check if mentee has enough credits
    const mentee = await User.findById(req.user._id);
    if (mentee.credits < price) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Create session
    const session = new Session({
      mentor: mentorId,
      mentee: req.user._id,
      topic,
      scheduledDate,
      duration,
      price,
      notes
    });

    await session.save();

    // Deduct credits from mentee
    mentee.credits -= price;
    await mentee.save();

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Error creating session' });
  }
};

// Get all sessions for current user
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { mentor: req.user._id },
        { mentee: req.user._id }
      ]
    })
    .populate('mentor', 'username profile.avatar')
    .populate('mentee', 'username profile.avatar')
    .sort({ scheduledDate: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Error fetching sessions' });
  }
};

// Get session by ID
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentor', 'username profile expertise')
      .populate('mentee', 'username profile');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is part of the session
    if (session.mentor._id.toString() !== req.user._id.toString() &&
        session.mentee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this session' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Error fetching session' });
  }
};

// Update session status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only mentor can confirm/cancel, both can mark as completed
    if ((status === 'confirmed' || status === 'cancelled') && 
        session.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only mentor can perform this action' });
    }

    session.status = status;
    await session.save();

    // If cancelled, refund credits to mentee
    if (status === 'cancelled') {
      const mentee = await User.findById(session.mentee);
      mentee.credits += session.price;
      await mentee.save();
    }

    res.json(session);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Error updating session status' });
  }
};

// Add feedback to session
exports.addFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only mentee can add feedback
    if (session.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only mentee can add feedback' });
    }

    // Can only add feedback to completed sessions
    if (session.status !== 'completed') {
      return res.status(400).json({ error: 'Can only add feedback to completed sessions' });
    }

    session.feedback = {
      rating,
      comment,
      givenAt: new Date()
    };

    await session.save();

    res.json(session);
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ error: 'Error adding feedback' });
  }
};

// Get video token for session
exports.getVideoToken = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Validate that the session exists and the user is a participant
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is either the mentor or mentee
    if (session.mentor.toString() !== userId && session.mentee.toString() !== userId) {
      return res.status(403).json({ error: 'User is not a participant in this session' });
    }

    // Generate Twilio token
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET
    );

    // Set the identity of the token
    token.identity = userId;

    // Grant access to Video
    const videoGrant = new VideoGrant({
      room: `session-${sessionId}`
    });
    token.addGrant(videoGrant);

    res.json({ token: token.toJwt() });
  } catch (error) {
    console.error('Get video token error:', error);
    res.status(500).json({ error: 'Error generating video token' });
  }
}; 