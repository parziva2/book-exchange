import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const Terms = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Terms of Service
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography paragraph>
            By accessing and using SwapExpertise, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </Typography>

          <Typography variant="h6" gutterBottom>
            2. User Accounts
          </Typography>
          <Typography paragraph>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </Typography>

          <Typography variant="h6" gutterBottom>
            3. Service Description
          </Typography>
          <Typography paragraph>
            SwapExpertise provides a platform for users to connect with mentors for knowledge sharing and learning purposes. We do not guarantee the quality or accuracy of any advice or information provided by mentors.
          </Typography>

          <Typography variant="h6" gutterBottom>
            4. Payment Terms
          </Typography>
          <Typography paragraph>
            All payments are processed securely through our platform. Refunds may be issued according to our refund policy. Users agree to pay all charges at the prices listed for their selected services.
          </Typography>

          <Typography variant="h6" gutterBottom>
            5. User Conduct
          </Typography>
          <Typography paragraph>
            Users agree not to engage in any behavior that may be harmful to the platform or other users, including but not limited to harassment, spam, or fraudulent activities.
          </Typography>

          <Typography variant="h6" gutterBottom>
            6. Intellectual Property
          </Typography>
          <Typography paragraph>
            All content on SwapExpertise, including text, graphics, logos, and software, is the property of SwapExpertise or its content suppliers and is protected by copyright laws.
          </Typography>

          <Typography variant="h6" gutterBottom>
            7. Limitation of Liability
          </Typography>
          <Typography paragraph>
            SwapExpertise shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
          </Typography>

          <Typography variant="h6" gutterBottom>
            8. Changes to Terms
          </Typography>
          <Typography paragraph>
            We reserve the right to modify these terms at any time. We will notify users of any material changes to these terms.
          </Typography>

          <Typography variant="h6" gutterBottom>
            9. Contact Information
          </Typography>
          <Typography paragraph>
            For questions about these Terms of Service, please contact us at support@swapexpertise.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Terms; 