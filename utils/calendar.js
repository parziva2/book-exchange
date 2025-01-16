const { google } = require('googleapis');
const { OAuth2 } = google.auth;

// Initialize OAuth2 client
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Create a calendar event for a session
 * @param {Object} session - The session object
 * @param {Object} mentor - The mentor object
 * @param {Object} mentee - The mentee object
 * @param {string} accessToken - Google Calendar access token
 * @returns {Promise<string>} Event ID
 */
const createCalendarEvent = async (session, mentor, mentee, accessToken) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const event = {
      summary: `Mentoring Session: ${session.topic}`,
      description: `Mentoring session with ${mentor.username}\n\nTopic: ${session.topic}\n\nNotes: ${session.note || 'No notes provided'}`,
      start: {
        dateTime: session.startTime,
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(new Date(session.startTime).getTime() + session.duration * 60000),
        timeZone: 'UTC'
      },
      attendees: [
        { email: mentor.email },
        { email: mentee.email }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 }
        ]
      },
      conferenceData: {
        createRequest: {
          requestId: session._id.toString(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
};

/**
 * Update a calendar event
 * @param {string} eventId - The calendar event ID
 * @param {Object} updates - The updates to apply
 * @param {string} accessToken - Google Calendar access token
 */
const updateCalendarEvent = async (eventId, updates, accessToken) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: updates,
      sendUpdates: 'all'
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
};

/**
 * Delete a calendar event
 * @param {string} eventId - The calendar event ID
 * @param {string} accessToken - Google Calendar access token
 */
const deleteCalendarEvent = async (eventId, accessToken) => {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all'
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
};

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
}; 