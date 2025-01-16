// Mock email service for development
// In production, this would integrate with your backend email service

const emailTemplates = {
  sessionReminder: {
    subject: 'Upcoming Session Reminder',
    template: (data) => `
      Hi ${data.userName},
      
      This is a reminder that you have an upcoming session with ${data.mentorName} 
      scheduled for ${data.sessionTime}.
      
      Session Details:
      - Topic: ${data.topic}
      - Duration: ${data.duration} minutes
      - Link: ${data.sessionLink}
      
      Please make sure to join the session on time.
      
      Best regards,
      SwapExpertise Team
    `,
  },
  sessionUpdate: {
    subject: 'Session Update',
    template: (data) => `
      Hi ${data.userName},
      
      Your session with ${data.mentorName} has been ${data.updateType}.
      
      ${data.updateMessage}
      
      If you have any questions, please don't hesitate to contact us.
      
      Best regards,
      SwapExpertise Team
    `,
  },
  mentorMessage: {
    subject: 'New Message from Your Mentor',
    template: (data) => `
      Hi ${data.userName},
      
      You have received a new message from ${data.mentorName}:
      
      "${data.message}"
      
      To reply, please log in to your account.
      
      Best regards,
      SwapExpertise Team
    `,
  },
  balanceUpdate: {
    subject: 'Balance Update',
    template: (data) => `
      Hi ${data.userName},
      
      Your account balance has been updated.
      
      Transaction Details:
      - Type: ${data.transactionType}
      - Amount: ${data.amount}
      - New Balance: ${data.newBalance}
      
      Best regards,
      SwapExpertise Team
    `,
  },
};

class EmailService {
  constructor() {
    // Initialize email service configuration
    this.enabled = true;
  }

  async sendEmail(type, data, userPreferences) {
    if (!this.enabled || !userPreferences.emailNotifications[type]) {
      return;
    }

    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Email template '${type}' not found`);
    }

    try {
      // In production, this would send a real email through your backend
      console.log('Sending email:', {
        to: data.userEmail,
        subject: template.subject,
        body: template.template(data),
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendSessionReminder(sessionData, userPreferences) {
    return this.sendEmail('sessionReminder', sessionData, userPreferences);
  }

  async sendSessionUpdate(updateData, userPreferences) {
    return this.sendEmail('sessionUpdate', updateData, userPreferences);
  }

  async sendMentorMessage(messageData, userPreferences) {
    return this.sendEmail('mentorMessage', messageData, userPreferences);
  }

  async sendBalanceUpdate(balanceData, userPreferences) {
    return this.sendEmail('balanceUpdate', balanceData, userPreferences);
  }
}

export const emailService = new EmailService(); 