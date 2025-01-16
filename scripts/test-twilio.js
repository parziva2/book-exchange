require('dotenv').config();
const twilio = require('twilio');

const testTwilioConfig = async () => {
  try {
    console.log('Testing Twilio configuration...\n');

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Test account access
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✓ Successfully connected to Twilio account:', account.friendlyName);

    // Create a test room
    const room = await client.video.rooms.create({
      uniqueName: `test-room-${Date.now()}`,
      type: 'go'
    });
    console.log('✓ Successfully created test room:', room.sid);

    // Generate a test token
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity: 'test-user' }
    );

    const videoGrant = new VideoGrant({
      room: room.uniqueName
    });

    token.addGrant(videoGrant);
    const accessToken = token.toJwt();
    console.log('✓ Successfully generated access token');

    // Complete the test room
    await client.video.rooms(room.sid).update({ status: 'completed' });
    console.log('✓ Successfully completed test room');

    console.log('\nAll Twilio tests passed successfully! ✨');
  } catch (error) {
    console.error('Error testing Twilio configuration:', error);
  }
};

testTwilioConfig(); 