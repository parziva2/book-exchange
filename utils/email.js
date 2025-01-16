const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Test email configuration
 */
const testEmailConfig = async () => {
  try {
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email configuration is valid');

    // Send test email
    await sendEmail(
      process.env.SMTP_USER, // Send to yourself
      'Test Email from Book Exchange',
      'If you receive this email, your email configuration is working correctly!'
    );
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Email configuration test failed:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  testEmailConfig
}; 