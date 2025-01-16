const cron = require('node-cron');
const Session = require('../models/Session');
const { createNotification } = require('../controllers/notificationController');
const { sendEmail } = require('./email');

/**
 * Schedule reminders for a session
 * @param {Object} session - The session object
 * @param {Object} mentor - The mentor object
 * @param {Object} mentee - The mentee object
 */
const scheduleSessionReminders = async (session, mentor, mentee) => {
  const sessionStart = new Date(session.startTime);
  
  // Schedule 24-hour reminder
  const twentyFourHourReminder = new Date(sessionStart);
  twentyFourHourReminder.setHours(twentyFourHourReminder.getHours() - 24);
  
  if (twentyFourHourReminder > new Date()) {
    scheduleReminder(session, mentor, mentee, twentyFourHourReminder, '24h');
  }

  // Schedule 1-hour reminder
  const oneHourReminder = new Date(sessionStart);
  oneHourReminder.setHours(oneHourReminder.getHours() - 1);
  
  if (oneHourReminder > new Date()) {
    scheduleReminder(session, mentor, mentee, oneHourReminder, '1h');
  }

  // Schedule 15-minute reminder
  const fifteenMinReminder = new Date(sessionStart);
  fifteenMinReminder.setMinutes(fifteenMinReminder.getMinutes() - 15);
  
  if (fifteenMinReminder > new Date()) {
    scheduleReminder(session, mentor, mentee, fifteenMinReminder, '15min');
  }
};

/**
 * Schedule a single reminder
 * @param {Object} session - The session object
 * @param {Object} mentor - The mentor object
 * @param {Object} mentee - The mentee object
 * @param {Date} reminderTime - When to send the reminder
 * @param {string} reminderType - Type of reminder (24h, 1h, 15min)
 */
const scheduleReminder = async (session, mentor, mentee, reminderTime, reminderType) => {
  const cronExpression = `${reminderTime.getMinutes()} ${reminderTime.getHours()} ${reminderTime.getDate()} ${reminderTime.getMonth() + 1} *`;

  cron.schedule(cronExpression, async () => {
    try {
      // Fetch latest session status
      const currentSession = await Session.findById(session._id);
      if (!currentSession || currentSession.status === 'cancelled') {
        return;
      }

      // Send notifications
      const timeText = reminderType === '24h' ? '24 hours' : 
                      reminderType === '1h' ? '1 hour' : 
                      '15 minutes';

      const message = `Your session "${session.topic}" starts in ${timeText}`;

      // Notify mentor
      await createNotification(
        mentor._id,
        'session_reminder',
        'Session Reminder',
        message,
        session._id,
        'Session'
      );

      // Notify mentee
      await createNotification(
        mentee._id,
        'session_reminder',
        'Session Reminder',
        message,
        session._id,
        'Session'
      );

      // Send emails
      await Promise.all([
        sendEmail(mentor.email, 'Session Reminder', message),
        sendEmail(mentee.email, 'Session Reminder', message)
      ]);

      // Update session remindersSent
      await Session.findByIdAndUpdate(session._id, {
        $addToSet: { remindersSent: reminderType }
      });
    } catch (error) {
      console.error('Error sending session reminder:', error);
    }
  });
};

/**
 * Cancel all reminders for a session
 * @param {string} sessionId - The session ID
 */
const cancelSessionReminders = async (sessionId) => {
  // Since we're using node-cron, we don't need to explicitly cancel the jobs
  // They will be garbage collected if the session is cancelled
  // However, we should mark all reminders as sent to prevent new ones
  await Session.findByIdAndUpdate(sessionId, {
    remindersSent: ['24h', '1h', '15min']
  });
};

module.exports = {
  scheduleSessionReminders,
  cancelSessionReminders
}; 