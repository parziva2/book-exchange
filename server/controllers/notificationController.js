const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// Helper function to create and emit notification
const createAndEmitNotification = async (recipientId, type, title, message, data = {}, priority = 'low') => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      data,
      priority,
      createdAt: new Date()
    });

    // Emit via socket
    const io = getIO();
    const notificationData = {
      ...notification.toObject(),
      _id: notification._id.toString()
    };
    io.to(recipientId.toString()).emit('notification', notificationData);

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

// Session notifications
exports.notifySessionCreated = async (userId, sessionData) => {
  return createAndEmitNotification(
    userId,
    'session_created',
    'New Session Created',
    'Your session request has been submitted for approval.',
    sessionData
  );
};

exports.notifySessionApproved = async (userId, sessionData) => {
  return createAndEmitNotification(
    userId,
    'session_approved',
    'Session Approved',
    'Your session request has been approved and is now available for booking.',
    sessionData
  );
};

exports.notifySessionBooked = async (mentorId, sessionData) => {
  return createAndEmitNotification(
    mentorId,
    'session_booked',
    'New Session Booked',
    `A student has booked your session: ${sessionData.title}`,
    sessionData,
    'high'
  );
};

exports.notifySessionStartingSoon = async (userId, sessionData) => {
  return createAndEmitNotification(
    userId,
    'session_starting_soon',
    'Session Starting Soon',
    `Your session "${sessionData.title}" will begin in 1 hour.`,
    sessionData,
    'high'
  );
};

exports.notifySessionCancelled = async (userId, sessionData, reason) => {
  return createAndEmitNotification(
    userId,
    'session_cancelled',
    'Session Cancelled',
    `The session "${sessionData.title}" has been cancelled. Reason: ${reason}`,
    sessionData,
    'high'
  );
};

exports.notifySessionRescheduled = async (userId, sessionData) => {
  return createAndEmitNotification(
    userId,
    'session_rescheduled',
    'Session Rescheduled',
    `The session "${sessionData.title}" has been rescheduled.`,
    sessionData,
    'high'
  );
};

// Payment notifications
exports.notifyInsufficientFunds = async (userId, amount, sessionData) => {
  return createAndEmitNotification(
    userId,
    'insufficient_funds',
    'Insufficient Funds',
    `You need $${amount} more to book this session.`,
    { amount, ...sessionData },
    'high'
  );
};

exports.notifyFundsAdded = async (userId, amount) => {
  return createAndEmitNotification(
    userId,
    'funds_added',
    'Funds Added',
    `$${amount} has been added to your balance.`,
    { amount }
  );
};

exports.notifyPayoutProcessed = async (userId, amount) => {
  return createAndEmitNotification(
    userId,
    'payout_processed',
    'Payout Processed',
    `Your payout of $${amount} has been processed.`,
    { amount }
  );
};

exports.notifyRefundProcessed = async (userId, amount, sessionData) => {
  return createAndEmitNotification(
    userId,
    'refund_processed',
    'Refund Processed',
    `$${amount} has been refunded to your balance for the cancelled session.`,
    { amount, ...sessionData }
  );
};

// Mentor notifications
exports.notifyMentorApplicationStatus = async (userId, status, reason = '') => {
  const title = status === 'approved' 
    ? 'Mentor Application Approved!'
    : 'Mentor Application Update';
  
  const message = status === 'approved'
    ? 'Congratulations! Your mentor application has been approved.'
    : status === 'rejected'
    ? `Your mentor application was not approved. Reason: ${reason}`
    : 'Your mentor application is being reviewed.';

  return createAndEmitNotification(
    userId,
    'mentor_application_status',
    title,
    message,
    { status, reason },
    status === 'approved' ? 'high' : 'medium'
  );
};

exports.notifyNewReview = async (mentorId, reviewData) => {
  return createAndEmitNotification(
    mentorId,
    'new_review',
    'New Review Received',
    `You've received a ${reviewData.rating}-star review from a student.`,
    reviewData
  );
};

// Message notifications
exports.notifyNewMessage = async (userId, messageData) => {
  return createAndEmitNotification(
    userId,
    'new_message',
    'New Message',
    `You have a new message from ${messageData.senderName}`,
    messageData
  );
};

// Get all notifications for the current user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Error deleting notification' });
  }
}; 