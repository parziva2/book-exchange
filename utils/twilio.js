const twilio = require('twilio');

// Initialize Twilio client only if credentials are present
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Create a new Twilio video room for a session
 * @param {string} sessionId - The session ID to create a room for
 * @returns {Promise<{roomId: string, roomSid: string}>}
 */
const createVideoRoom = async (sessionId) => {
  if (!twilioClient) {
    throw new Error('Twilio is not configured');
  }
  try {
    const room = await twilioClient.video.rooms.create({
      uniqueName: `session-${sessionId}`,
      type: 'group',
      recordParticipantsOnConnect: false
    });

    return {
      roomId: room.uniqueName,
      roomSid: room.sid
    };
  } catch (error) {
    console.error('Error creating Twilio video room:', error);
    throw new Error('Failed to create video room');
  }
};

/**
 * Generate access token for a participant
 * @param {string} roomId - The Twilio room ID
 * @param {string} userId - The user's ID
 * @param {string} identity - The user's display name
 * @returns {string} Access token
 */
const generateToken = (roomId, userId, identity) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET) {
    throw new Error('Twilio is not configured');
  }
  const AccessToken = twilio.jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity: identity }
  );

  const videoGrant = new VideoGrant({
    room: roomId
  });

  token.addGrant(videoGrant);
  return token.toJwt();
};

/**
 * Complete a video room session
 * @param {string} roomSid - The Twilio room SID
 */
const completeRoom = async (roomSid) => {
  if (!twilioClient) {
    throw new Error('Twilio is not configured');
  }
  try {
    await twilioClient.video.rooms(roomSid).update({ status: 'completed' });
  } catch (error) {
    console.error('Error completing Twilio video room:', error);
    throw new Error('Failed to complete video room');
  }
};

module.exports = {
  createVideoRoom,
  generateToken,
  completeRoom
}; 