const Session = require('../models/Session');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { createNotification } = require('./notificationController');
const { createVideoRoom, generateToken, completeRoom } = require('../utils/twilio');
const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require('../utils/calendar');
const { scheduleSessionReminders, cancelSessionReminders } = require('../utils/reminders');

// Create a new session
exports.createSession = async (req, res) => {
  try {
    const { mentorId, topic, scheduledDate, duration, notes } = req.body;

    // Get mentor
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Get mentor's credit rate for the topic
    const expertise = mentor.expertise?.find(e => e.topic.toLowerCase() === topic.toLowerCase());
    
    if (!expertise) {
      return res.status(400).json({ message: 'Mentor does not have expertise in this topic' });
    }

    // Calculate required credits based on mentor's rate
    const halfHours = Math.ceil(duration / 30);
    const creditsRequired = halfHours * expertise.creditRate;

    // Check if user has enough credits
    const mentee = await User.findById(req.user.id);
    if (mentee.credits < creditsRequired) {
      return res.status(400).json({ 
        message: 'Insufficient credits',
        required: creditsRequired,
        available: mentee.credits
      });
    }

    // Create session
    const session = new Session({
      mentor: mentorId,
      mentee: req.user.id,
      topic,
      startTime: scheduledDate,
      duration,
      note: notes,
      price: creditsRequired // Store price in credits
    });

    await session.save();

    // Create calendar event
    try {
      const eventId = await createCalendarEvent(
        session,
        mentor,
        mentee,
        req.body.calendarAccessToken
      );
      session.calendarEventId = eventId;
      await session.save();
    } catch (calendarError) {
      console.error('Failed to create calendar event:', calendarError);
      // Don't fail the session creation if calendar fails
    }

    // Schedule reminders
    try {
      await scheduleSessionReminders(session, mentor, mentee);
    } catch (reminderError) {
      console.error('Failed to schedule reminders:', reminderError);
      // Don't fail the session creation if reminders fail
    }

    // Process payment
    const paymentTransaction = new Transaction({
      user: req.user.id,
      type: 'session_payment',
      amount: 0,
      credits: creditsRequired,
      status: 'completed',
      session: session._id,
      relatedUser: mentorId,
      description: `Payment for session: ${topic} (${creditsRequired} credits)`
    });

    const earningTransaction = new Transaction({
      user: mentorId,
      type: 'session_earning',
      amount: 0,
      credits: creditsRequired,
      status: 'completed',
      session: session._id,
      relatedUser: req.user.id,
      description: `Earnings from session: ${topic} (${creditsRequired} credits)`
    });

    // Update credits
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { credits: -creditsRequired }
    });

    await User.findByIdAndUpdate(mentorId, {
      $inc: { credits: creditsRequired }
    });

    await Promise.all([
      paymentTransaction.save(),
      earningTransaction.save(),
      createNotification(
        mentorId,
        'session_request',
        'New Session Request',
        `You have a new session request for ${topic}`,
        session._id,
        'Session'
      )
    ]);

    res.status(201).json({
      session,
      creditsRequired,
      remainingCredits: mentee.credits - creditsRequired
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Error creating session' });
  }
};

// Get all sessions for a user
exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { mentee: req.user.id },
        { mentor: req.user.id },
      ],
    })
    .populate('mentee', 'username profile')
    .populate('mentor', 'username profile')
    .sort({ startTime: -1 });

    res.json(sessions);
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ message: 'Error getting sessions' });
  }
};

// Get a specific session
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentee', 'username profile')
      .populate('mentor', 'username profile');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is authorized to view
    if (session.mentee.toString() !== req.user.id && session.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ message: 'Error getting session' });
  }
};

// Update session status
exports.updateSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const session = await Session.findById(req.params.id)
      .populate('mentee', 'username')
      .populate('mentor', 'username');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is authorized to update
    if (session.mentee.toString() !== req.user.id && session.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.status = status;
    await session.save();

    // Send notification
    const recipientId = req.user.id === session.mentee.toString() ? session.mentor : session.mentee;
    await createNotification(
      recipientId,
      'session_update',
      'Session Status Updated',
      `Session status updated to ${status}`,
      session._id,
      'Session'
    );

    res.json(session);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ message: 'Error updating session status' });
  }
};

// Cancel session
exports.cancelSession = async (req, res) => {
  try {
    const { reason } = req.body;
    const session = await Session.findById(req.params.id)
      .populate('mentee', 'username')
      .populate('mentor', 'username');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is authorized to cancel
    if (session.mentee.toString() !== req.user.id && session.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if session can be cancelled (not too close to start time)
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const hoursUntilSession = (sessionStart - now) / (1000 * 60 * 60);

    if (hoursUntilSession < 24) {
      return res.status(400).json({ message: 'Sessions can only be cancelled at least 24 hours before start time' });
    }

    // Cancel calendar event
    if (session.calendarEventId) {
      try {
        await deleteCalendarEvent(
          session.calendarEventId,
          req.body.calendarAccessToken
        );
      } catch (calendarError) {
        console.error('Failed to delete calendar event:', calendarError);
      }
    }

    // Cancel reminders
    try {
      await cancelSessionReminders(session._id);
    } catch (reminderError) {
      console.error('Failed to cancel reminders:', reminderError);
    }

    const creditsAmount = Math.ceil(session.duration / 30);

    // Process refund
    const menteeRefund = new Transaction({
      user: session.mentee,
      type: 'refund',
      amount: 0,
      credits: creditsAmount,
      status: 'completed',
      session: session._id,
      relatedUser: session.mentor,
      description: `Refund for cancelled session: ${session.topic}. Reason: ${reason}`
    });

    // Update session status
    session.status = 'cancelled';
    session.cancelReason = reason;
    session.cancelledBy = req.user.id;

    await Promise.all([
      session.save(),
      menteeRefund.save(),
      User.findByIdAndUpdate(session.mentee, {
        $inc: { credits: creditsAmount }
      }),
      User.findByIdAndUpdate(session.mentor, {
        $inc: { credits: -creditsAmount }
      }),
      createNotification(
        session.mentor.toString() === req.user.id ? session.mentee : session.mentor,
        'session_cancelled',
        'Session Cancelled',
        `Session "${session.topic}" has been cancelled. Reason: ${reason}`,
        session._id,
        'Session'
      )
    ]);

    res.json({ message: 'Session cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({ message: 'Error cancelling session' });
  }
};

// Add session feedback
exports.addFeedback = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is the mentee
    if (session.mentee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only mentees can add feedback' });
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({ message: 'Can only add feedback to completed sessions' });
    }

    session.rating = rating;
    session.review = review;
    await session.save();

    // Update mentor's average rating
    const mentorSessions = await Session.find({
      mentor: session.mentor,
      rating: { $exists: true }
    });

    const totalRating = mentorSessions.reduce((sum, s) => sum + s.rating, 0);
    const averageRating = totalRating / mentorSessions.length;

    await User.findByIdAndUpdate(session.mentor, {
      'ratings.average': averageRating,
      'ratings.count': mentorSessions.length
    });

    res.json(session);
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ message: 'Error adding feedback' });
  }
};

// Get video token for a session
exports.getVideoToken = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentee', 'username')
      .populate('mentor', 'username');
      
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is authorized
    if (session.mentee._id.toString() !== req.user.id && session.mentor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create video room if it doesn't exist
    if (!session.videoRoomId) {
      const room = await createVideoRoom(session._id);
      session.videoRoomId = room.sid;
      await session.save();
    }

    // Get user's identity (username)
    const identity = req.user.id === session.mentee._id.toString() 
      ? session.mentee.username 
      : session.mentor.username;

    // Generate token with room ID, user ID and identity
    const token = generateToken(session.videoRoomId, req.user.id, identity);
    res.json({ token });
  } catch (error) {
    console.error('Error generating video token:', error);
    res.status(500).json({ 
      message: 'Error generating video token',
      error: error.message 
    });
  }
};

// Join video session
exports.joinVideoSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is authorized
    if (session.mentee.toString() !== req.user.id && session.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create video room if it doesn't exist
    if (!session.videoRoomId) {
      const room = await createVideoRoom(session._id);
      session.videoRoomId = room.sid;
      await session.save();
    }

    res.json({ roomId: session.videoRoomId });
  } catch (error) {
    console.error('Error joining video session:', error);
    res.status(500).json({ message: 'Error joining video session' });
  }
};

// End video session
exports.endVideoSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is authorized
    if (session.mentee.toString() !== req.user.id && session.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Complete video room
    if (session.videoRoomId) {
      await completeRoom(session.videoRoomId);
      session.videoRoomId = null;
      await session.save();
    }

    res.json({ message: 'Video session ended successfully' });
  } catch (error) {
    console.error('Error ending video session:', error);
    res.status(500).json({ message: 'Error ending video session' });
  }
}; 