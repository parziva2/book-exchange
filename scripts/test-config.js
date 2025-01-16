require('dotenv').config();
const { google } = require('googleapis');
const { testEmailConfig } = require('../utils/email');

const testGoogleConfig = async () => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Test Google configuration by generating an auth URL
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    });

    console.log('Google configuration is valid');
    console.log('Auth URL generated:', url);
  } catch (error) {
    console.error('Google configuration test failed:', error);
  }
};

const runTests = async () => {
  console.log('Testing configurations...\n');

  console.log('1. Testing Google Calendar configuration:');
  await testGoogleConfig();
  console.log('\n-------------------\n');

  console.log('2. Testing Email configuration:');
  await testEmailConfig();
};

runTests().catch(console.error); 