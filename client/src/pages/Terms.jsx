import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const Terms = () => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography paragraph>
            By accessing or using SwapExpertise, you agree to be bound by these Terms of Service. If you
            do not agree to these terms, please do not use our services.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            2. User Accounts
          </Typography>
          <Typography paragraph>
            You must create an account to use most features of our platform. You are responsible for
            maintaining the security of your account and for all activities that occur under your account.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            3. User Conduct
          </Typography>
          <Typography paragraph>
            You agree to use our services in accordance with all applicable laws and regulations. You will
            not engage in any behavior that is harmful, offensive, or disruptive to other users.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            4. Intellectual Property
          </Typography>
          <Typography paragraph>
            All content and materials available on SwapExpertise are protected by intellectual property
            rights. You may not use, copy, or distribute our content without permission.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            5. Termination
          </Typography>
          <Typography paragraph>
            We reserve the right to terminate or suspend your account at any time for violations of these
            terms or for any other reason we deem appropriate.
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Terms; 