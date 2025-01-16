const twilio = require('twilio');

// Debug logging for Twilio configuration
console.log('Checking Twilio configuration...');
const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_API_KEY', 'TWILIO_API_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required Twilio environment variables:', missingVars);
} else {
  console.log('All required Twilio environment variables are present');
}

// Initialize Twilio client only if credentials are present
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  console.log('Initializing Twilio client...');
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
} else {
  console.error('Missing Twilio credentials, client not initialized');
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
    const roomId = `session-${sessionId}`;

    // Check if room exists
    try {
      await twilioClient.video.rooms(roomId).fetch();
    } catch (error) {
      // Room doesn't exist, create it
      if (error.code === 20404) {
        await twilioClient.video.rooms.create({
          uniqueName: roomId,
          type: 'group',
          maxParticipants: 2
        });
      } else {
        throw error;
      }
    }

    return { roomId };
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
  console.log('Checking Twilio configuration for token generation:', {
    hasSID: !!process.env.TWILIO_ACCOUNT_SID,
    hasAPIKey: !!process.env.TWILIO_API_KEY,
    hasAPISecret: !!process.env.TWILIO_API_SECRET
  });

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET) {
    console.error('Missing required Twilio credentials for token generation');
    throw new Error('Twilio is not configured');
  }

  try {
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    console.log('Creating access token with params:', {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      apiKey: process.env.TWILIO_API_KEY,
      identity: identity
    });

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity }
    );

    console.log('Adding video grant for room:', roomId);
    const videoGrant = new VideoGrant({
      room: roomId
    });

    token.addGrant(videoGrant);
    const jwt = token.toJwt();
    console.log('Token generated successfully');
    return jwt;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

module.exports = {
  createVideoRoom,
  generateToken
}; 