import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const Privacy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Privacy Policy
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            We collect information you provide directly to us, including name, email, profile information, and payment details. We also collect data about your usage of our platform and technical information about your device.
          </Typography>

          <Typography variant="h6" gutterBottom>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use your information to provide our services, process payments, communicate with you, improve our platform, and ensure security. We may also use your data to personalize your experience and analyze platform usage.
          </Typography>

          <Typography variant="h6" gutterBottom>
            3. Information Sharing
          </Typography>
          <Typography paragraph>
            We do not sell your personal information. We share your information only with service providers who assist in operating our platform, or when required by law. Mentors only receive information necessary for conducting sessions.
          </Typography>

          <Typography variant="h6" gutterBottom>
            4. Data Security
          </Typography>
          <Typography paragraph>
            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </Typography>

          <Typography variant="h6" gutterBottom>
            5. Your Rights
          </Typography>
          <Typography paragraph>
            You have the right to access, correct, or delete your personal information. You can also request a copy of your data or object to its processing. Contact us to exercise these rights.
          </Typography>

          <Typography variant="h6" gutterBottom>
            6. Cookies and Tracking
          </Typography>
          <Typography paragraph>
            We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookie preferences through your browser settings.
          </Typography>

          <Typography variant="h6" gutterBottom>
            7. Changes to Privacy Policy
          </Typography>
          <Typography paragraph>
            We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the effective date.
          </Typography>

          <Typography variant="h6" gutterBottom>
            8. Contact Us
          </Typography>
          <Typography paragraph>
            If you have any questions about this privacy policy or our practices, please contact us at privacy@swapexpertise.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Privacy; 