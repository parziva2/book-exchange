const Session = require('../models/Session');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { createVideoRoom, generateToken, completeRoom } = require('../utils/twilio');
const mongoose = require('mongoose');

// Create a new session
exports.createSession = async (req, res) => {
  let mongoSession;
  try {
    mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    const { mentorId, startTime, topic, duration = 60 } = req.body;
    const menteeId = req.user._id;

    console.log('Creating session with params:', {
      mentorId,
      startTime,
      topic,
      duration,
      menteeId: menteeId.toString()
    });

    // Validate input
    if (!mentorId || !startTime || !topic) {
      console.log('Missing required fields:', { mentorId, startTime, topic });
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    // Convert IDs to ObjectId
    const menteeObjectId = menteeId instanceof mongoose.Types.ObjectId ? menteeId : new mongoose.Types.ObjectId(menteeId);
    const mentorObjectId = new mongoose.Types.ObjectId(mentorId);

    console.log('Converted IDs:', {
      menteeObjectId: menteeObjectId.toString(),
      mentorObjectId: mentorObjectId.toString()
    });

    // Check if mentor exists and is active
    const mentor = await User.findOne({ 
      _id: mentorObjectId,
      roles: { $in: ['mentor'] }
    }).populate('mentorProfile').session(mongoSession);

    console.log('Found mentor:', {
      exists: !!mentor,
      hasProfile: !!mentor?.mentorProfile,
      id: mentor?._id?.toString()
    });

    if (!mentor || !mentor.mentorProfile) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found or inactive'
      });
    }

    // Check if slot is available
    const sessionStart = new Date(startTime);
    const sessionEnd = new Date(sessionStart);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + duration);

    console.log('Session timing:', {
      start: sessionStart.toISOString(),
      end: sessionEnd.toISOString(),
      duration
    });

    // Check for existing sessions in this time slot
    const existingSession = await Session.findOne({
      mentor: mentorObjectId,
      startTime: {
        $lt: sessionEnd
      },
      endTime: {
        $gt: sessionStart
      },
      status: { $nin: ['cancelled', 'rejected'] }
    }).session(mongoSession);

    console.log('Existing session check:', {
      exists: !!existingSession,
      id: existingSession?._id?.toString()
    });

    if (existingSession) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'This time slot is already booked'
      });
    }

    // Check if mentee has sufficient balance
    const mentee = await User.findById(menteeObjectId).select('+balance').session(mongoSession);
    console.log('Found mentee:', {
      exists: !!mentee,
      id: mentee?._id?.toString(),
      balance: mentee?.balance
    });
    
    if (!mentee) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'Mentee not found'
      });
    }

    const sessionPrice = mentor.mentorProfile.hourlyRate * (duration / 60);
    console.log('Session price calculation:', {
      hourlyRate: mentor.mentorProfile.hourlyRate,
      duration,
      price: sessionPrice,
      menteeBalance: mentee.balance
    });

    if (mentee.balance < sessionPrice) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
      return res.status(400).json({
        status: 'error',
        message: `Insufficient balance. Session costs $${sessionPrice.toFixed(2)} but your balance is $${mentee.balance.toFixed(2)}`
      });
    }

    // Create the session
    const newSession = new Session({
      mentor: mentorObjectId,
      mentee: menteeObjectId,
      startTime: sessionStart,
      endTime: sessionEnd,
      duration,
      topic,
      price: sessionPrice,
      status: 'pending'
    });

    console.log('Created new session:', {
      id: newSession._id.toString(),
      mentor: newSession.mentor.toString(),
      mentee: newSession.mentee.toString(),
      price: newSession.price
    });

    await newSession.save({ session: mongoSession });

    // Deduct balance from mentee
    mentee.balance -= sessionPrice;
    await mentee.save({ session: mongoSession });

    console.log('Updated mentee balance:', {
      oldBalance: mentee.balance + sessionPrice,
      newBalance: mentee.balance
    });

    // Create notifications
    const mentorNotification = new Notification({
      recipient: mentorObjectId,
      type: 'session_created',
      title: 'New Session Request',
      message: `${mentee.firstName} ${mentee.lastName} has requested a session on ${topic}`,
      data: {
        sessionId: newSession._id,
        mentee: {
          name: `${mentee.firstName} ${mentee.lastName}`,
          id: mentee._id
        },
        topic,
        startTime: sessionStart
      }
    });

    const menteeNotification = new Notification({
      recipient: menteeObjectId,
      type: 'session_created',
      title: 'Session Booked',
      message: `Your session with ${mentor.firstName} ${mentor.lastName} has been booked`,
      data: {
        sessionId: newSession._id,
        mentor: {
          name: `${mentor.firstName} ${mentor.lastName}`,
          id: mentor._id
        },
        topic,
        startTime: sessionStart
      }
    });

    console.log('Creating notifications for:', {
      mentor: mentorObjectId.toString(),
      mentee: menteeObjectId.toString()
    });

    await mentorNotification.save({ session: mongoSession });
    await menteeNotification.save({ session: mongoSession });

    await mongoSession.commitTransaction();
    await mongoSession.endSession();

    console.log('Session creation completed successfully');

    res.status(201).json({
      status: 'success',
      data: {
        session: newSession
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    console.error('Error stack:', error.stack);
    if (mongoSession) {
      await mongoSession.abortTransaction();
      await mongoSession.endSession();
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to create session',
      details: error.message
    });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting sessions for user:', userId);
    
    const sessions = await Session.find({
      $or: [
        { mentee: userId },
        { mentor: userId }
      ]
    })
    .populate('mentor', 'firstName lastName email avatar expertise')
    .populate('mentee', 'firstName lastName email avatar')
    .sort({ startTime: -1 });

    console.log('Found sessions:', {
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s._id,
        mentor: s.mentor?._id,
        mentee: s.mentee?._id,
        status: s.status
      }))
    });

    // Ensure all required fields are present and properly formatted
    const validSessions = sessions.map(session => {
      const { _id, mentor, mentee, topic, startTime, duration, status, price } = session;
      return {
        _id,
        mentor: mentor ? {
          _id: mentor._id,
          firstName: mentor.firstName,
          lastName: mentor.lastName,
          email: mentor.email,
          avatar: mentor.avatar,
          expertise: mentor.expertise
        } : null,
        mentee: mentee ? {
          _id: mentee._id,
          firstName: mentee.firstName,
          lastName: mentee.lastName,
          email: mentee.email,
          avatar: mentee.avatar
        } : null,
        topic,
        startTime,
        duration,
        status,
        price
      };
    });

    console.log('Sending response:', {
      status: 'success',
      data: {
        sessions: validSessions
      }
    });

    res.json({
      status: 'success',
      data: {
        sessions: validSessions
      }
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting sessions'
    });
  }
};

exports.getSession = async (req, res) => {
  try {
    console.log('Getting session details:', req.params.id);

    const session = await Session.findById(req.params.id)
      .populate('mentee', 'username profile firstName lastName email avatar')
      .populate('mentor', 'username profile firstName lastName email avatar');

    if (!session) {
      console.log('Session not found:', req.params.id);
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    console.log('Session found:', {
      id: session._id.toString(),
      status: session.status,
      mentor: session.mentor._id.toString(),
      mentee: session.mentee._id.toString()
    });

    // Check if user is authorized to view
    const userId = req.user._id;
    const menteeId = session.mentee._id.toString();
    const mentorId = session.mentor._id.toString();
    const userIdStr = userId.toString();

    if (userIdStr !== menteeId && userIdStr !== mentorId) {
      console.log('User not authorized:', {
        userIdStr,
        menteeId,
        mentorId
      });
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this session'
      });
    }

    res.json({
      status: 'success',
      data: {
        session
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting session'
    });
  }
};

exports.getVideoToken = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;

    console.log('getVideoToken - Request received:', { 
      sessionId, 
      userId: userId.toString(),
      userObject: req.user 
    });

    // Validate session ID format
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.log('Invalid session ID format:', sessionId);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid session ID format'
      });
    }

    // Get the session document with explicit population
    const session = await Session.findById(sessionId)
      .populate('mentor', 'firstName lastName')
      .populate('mentee', 'firstName lastName')
      .lean();  // Convert to plain JavaScript object

    if (!session) {
      console.log('Session not found:', sessionId);
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    // Log the raw session object for debugging
    console.log('Raw session object:', JSON.stringify(session, null, 2));

    // Check if session is in the correct status
    const validStatuses = ['accepted', 'confirmed'];
    if (!session.status || !validStatuses.includes(session.status)) {
      console.log('Invalid session status:', {
        status: session.status,
        type: typeof session.status,
        exists: 'status' in session
      });
      return res.status(400).json({
        status: 'error',
        message: `Session must be in one of these statuses: ${validStatuses.join(', ')}. Current status: ${session.status || 'undefined'}`
      });
    }

    // Convert IDs to strings for comparison
    const menteeId = session.mentee._id.toString();
    const mentorId = session.mentor._id.toString();
    const requestUserId = userId.toString();

    // Check if user is authorized
    if (menteeId !== requestUserId && mentorId !== requestUserId) {
      console.log('User not authorized:', {
        requestUserId,
        menteeId,
        mentorId
      });
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to join this session'
      });
    }

    const roomId = `session-${sessionId}`;
    const isStudent = menteeId === requestUserId;
    const identity = `${isStudent ? 'mentee' : 'mentor'}-${requestUserId}`;

    try {
      console.log('Generating token with params:', { 
        roomId, 
        userId: requestUserId, 
        identity,
        sessionStatus: session.status
      });
      const token = generateToken(roomId, requestUserId, identity);
      
      return res.json({
        status: 'success',
        data: {
          token,
          roomId,
          identity
        }
      });
    } catch (error) {
      console.error('Error in token generation:', error);
      if (error.message === 'Twilio is not configured') {
        return res.status(503).json({
          status: 'error',
          message: 'Video chat is not configured'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in getVideoToken:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error generating video token'
    });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user._id;

    console.log('joinRoom - Request received:', { 
      sessionId, 
      userId: userId.toString(),
      userObject: req.user 
    });

    // Validate session ID format
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.log('Invalid session ID format:', sessionId);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid session ID format'
      });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      console.log('Session not found:', sessionId);
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    console.log('Session found:', {
      id: session._id.toString(),
      status: session.status,
      mentor: session.mentor.toString(),
      mentee: session.mentee.toString()
    });

    // Check if session is in the correct status
    if (session.status !== 'accepted' && session.status !== 'confirmed') {
      console.log('Invalid session status:', session.status);
      return res.status(403).json({
        status: 'error',
        message: session.status === 'pending' 
          ? 'Session must be accepted by the mentor before joining video chat'
          : `Session must be accepted or confirmed to join video chat (current status: ${session.status})`
      });
    }

    // Convert IDs to strings for comparison
    const menteeId = session.mentee.toString();
    const mentorId = session.mentor.toString();
    const requestUserId = userId.toString();

    // Check if user is authorized
    if (menteeId !== requestUserId && mentorId !== requestUserId) {
      console.log('User not authorized:', {
        requestUserId,
        menteeId,
        mentorId
      });
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to join this session'
      });
    }

    const roomId = `session-${sessionId}`;
    
    console.log('Joining room:', {
      roomId,
      sessionId: session._id.toString(),
      status: session.status
    });

    return res.json({
      status: 'success',
      data: {
        roomId,
        sessionId: session._id
      }
    });
  } catch (error) {
    console.error('Error in joinRoom:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error joining video session'
    });
  }
};

// Get all sessions for a user
exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { mentee: req.user._id },
        { mentor: req.user._id },
      ],
    })
    .populate('mentee', 'username profile firstName lastName avatar')
    .populate('mentor', 'username profile firstName lastName avatar')
    .sort({ startTime: -1 });

    res.json({
      status: 'success',
      data: {
        sessions
      }
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting sessions'
    });
  }
};

// Accept session
exports.acceptSession = async (req, res) => {
  try {
    console.log('Accepting session:', req.params.id);
    console.log('User:', req.user._id);

    const session = await Session.findById(req.params.id)
      .populate('mentee', 'username firstName lastName')
      .populate('mentor', 'username firstName lastName');

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    console.log('Found session:', {
      id: session._id,
      mentor: session.mentor._id,
      status: session.status
    });

    // Only the mentor can accept the session
    const mentorId = session.mentor._id.toString();
    const requestUserId = req.user._id.toString();
                    
    if (mentorId !== requestUserId) {
      console.log('Authorization failed:', {
        mentorId,
        requestUserId,
        mentor: session.mentor
      });
      return res.status(403).json({
        status: 'error',
        message: 'Only the mentor can accept the session'
      });
    }

    // Check if session is in a state that can be accepted
    if (session.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Session cannot be accepted (current status: ${session.status})`
      });
    }

    // Update session status
    session.status = 'accepted';
    await session.save();

    // Create notification for mentee
    const notification = new Notification({
      recipient: session.mentee._id,
      type: 'session_accepted',
      title: 'Session Accepted',
      message: `${session.mentor.firstName} has accepted your session request for ${session.topic}`,
      metadata: { sessionId: session._id }
    });

    await notification.save();

    console.log('Session accepted successfully');

    res.json({
      status: 'success',
      data: {
        session
      }
    });
  } catch (error) {
    console.error('Error accepting session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error accepting session',
      details: error.message
    });
  }
};

// Cancel session
exports.cancelSession = async (req, res) => {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    console.log('Starting session cancellation for session:', req.params.id);
    
    const sessionDoc = await Session.findById(req.params.id)
      .populate('mentee', 'username firstName lastName balance')
      .populate('mentor', 'username firstName lastName balance');

    console.log('Found session:', {
      id: sessionDoc?._id,
      mentee: sessionDoc?.mentee?._id,
      mentor: sessionDoc?.mentor?._id,
      status: sessionDoc?.status,
      price: sessionDoc?.price
    });

    if (!sessionDoc) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    // Check if user is authorized to cancel
    const userId = req.user._id.toString();
    const menteeId = sessionDoc.mentee._id.toString();
    const mentorId = sessionDoc.mentor._id.toString();

    console.log('Authorization check:', {
      userId,
      menteeId,
      mentorId,
      isAuthorized: userId === menteeId || userId === mentorId
    });

    if (userId !== menteeId && userId !== mentorId) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to cancel this session'
      });
    }

    // Check if session can be cancelled
    if (!['pending', 'accepted'].includes(sessionDoc.status)) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(400).json({
        status: 'error',
        message: `Session cannot be cancelled (current status: ${sessionDoc.status})`
      });
    }

    // Refund amount to mentee
    const mentee = await User.findById(menteeId).session(mongoSession);
    const mentor = await User.findById(mentorId).session(mongoSession);

    if (!mentee || !mentor) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      return res.status(404).json({
        status: 'error',
        message: 'Mentee or mentor not found'
      });
    }
    
    console.log('Before balance update:', {
      menteeBalance: mentee.balance,
      mentorBalance: mentor.balance,
      sessionPrice: sessionDoc.price
    });
    
    mentee.balance += sessionDoc.price;
    mentor.balance -= sessionDoc.price;
    
    await mentee.save({ session: mongoSession });
    await mentor.save({ session: mongoSession });

    console.log('After balance update:', {
      menteeBalance: mentee.balance,
      mentorBalance: mentor.balance
    });

    // Create refund transaction
    const refundTransaction = new Transaction({
      user: menteeId,
      type: 'session_refund',
      amount: sessionDoc.price,
      status: 'completed',
      session: sessionDoc._id,
      relatedUser: mentorId,
      description: `Refund for cancelled session: ${sessionDoc.topic} ($${sessionDoc.price.toFixed(2)})`
    });

    // Create deduction transaction for mentor
    const deductionTransaction = new Transaction({
      user: mentorId,
      type: 'session_refund',
      amount: -sessionDoc.price,
      status: 'completed',
      session: sessionDoc._id,
      relatedUser: menteeId,
      description: `Deduction for cancelled session: ${sessionDoc.topic} ($${sessionDoc.price.toFixed(2)})`
    });

    await refundTransaction.save({ session: mongoSession });
    await deductionTransaction.save({ session: mongoSession });

    // Update session status
    sessionDoc.status = 'cancelled';
    await sessionDoc.save({ session: mongoSession });

    // Create notifications
    const cancelledBy = userId === menteeId ? sessionDoc.mentee : sessionDoc.mentor;
    const notifyUser = userId === menteeId ? sessionDoc.mentor : sessionDoc.mentee;

    const notification = new Notification({
      recipient: notifyUser._id,
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: `${cancelledBy.firstName} has cancelled the session for ${sessionDoc.topic}`,
      metadata: { sessionId: sessionDoc._id }
    });

    await notification.save({ session: mongoSession });

    await mongoSession.commitTransaction();
    mongoSession.endSession();
    
    console.log('Session cancellation completed successfully');
    
    res.json({
      status: 'success',
      message: 'Session cancelled successfully',
      data: {
        session: sessionDoc
      }
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    res.status(500).json({
      status: 'error',
      message: 'Error cancelling session',
      details: error.message
    });
  }
};

// Reschedule session
exports.rescheduleSession = async (req, res) => {
  try {
    const { startTime } = req.body;
    const sessionId = req.params.id;
    const userId = req.user._id;

    console.log('Rescheduling session:', {
      sessionId,
      userId: userId.toString(),
      startTime
    });

    const session = await Session.findById(sessionId)
      .populate('mentee', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email');

    if (!session) {
      console.log('Session not found:', sessionId);
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    console.log('Session found:', {
      id: session._id.toString(),
      status: session.status,
      mentor: session.mentor._id.toString(),
      mentee: session.mentee._id.toString()
    });

    // Check if user is authorized to reschedule
    const menteeId = session.mentee._id.toString();
    const mentorId = session.mentor._id.toString();
    const requestUserId = userId.toString();

    if (requestUserId !== menteeId && requestUserId !== mentorId) {
      console.log('User not authorized:', {
        requestUserId,
        menteeId,
        mentorId
      });
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to reschedule this session'
      });
    }

    // Check if session can be rescheduled
    if (!['pending', 'accepted'].includes(session.status)) {
      console.log('Invalid session status for rescheduling:', session.status);
      return res.status(400).json({
        status: 'error',
        message: `Session cannot be rescheduled (current status: ${session.status})`
      });
    }

    // Update session time
    const oldStartTime = session.startTime;
    session.startTime = new Date(startTime);
    await session.save();

    console.log('Session rescheduled:', {
      id: session._id.toString(),
      oldStartTime,
      newStartTime: session.startTime
    });

    // Format the date/time nicely
    const formattedDateTime = new Date(startTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Send notifications to both users
    const rescheduledBy = requestUserId === menteeId ? session.mentee : session.mentor;
    
    // Notify the other party
    await notificationController.createNotification(
      requestUserId === menteeId ? mentorId : menteeId,
      'session_rescheduled',
      'Session Rescheduled',
      `${rescheduledBy.firstName} has rescheduled the session "${session.topic}" to ${formattedDateTime}`,
      { sessionId: session._id }
    );

    // Notify the user who rescheduled (confirmation)
    await notificationController.createNotification(
      requestUserId,
      'session_rescheduled',
      'Session Rescheduled Successfully',
      `You have successfully rescheduled your session "${session.topic}" to ${formattedDateTime}`,
      { sessionId: session._id }
    );

    res.json({
      status: 'success',
      message: 'Session rescheduled successfully',
      data: {
        session
      }
    });
  } catch (error) {
    console.error('Error rescheduling session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error rescheduling session',
      details: error.message
    });
  }
}; 