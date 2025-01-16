import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const Privacy = () => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            We collect information that you provide directly to us, including when you create an account,
            update your profile, or communicate with other users. This may include your name, email address,
            profile picture, and other information you choose to provide.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use the information we collect to provide, maintain, and improve our services, communicate
            with you, and protect our users. This includes personalizing your experience, processing
            transactions, and sending you updates about our services.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            3. Information Sharing
          </Typography>
          <Typography paragraph>
            We do not sell your personal information. We may share your information with third parties only
            in limited circumstances, such as when required by law or with your consent.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            4. Security
          </Typography>
          <Typography paragraph>
            We take reasonable measures to help protect your personal information from loss, theft, misuse,
            unauthorized access, disclosure, alteration, and destruction.
          </Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            5. Your Rights
          </Typography>
          <Typography paragraph>
            You have the right to access, correct, or delete your personal information. You can also object
            to or restrict certain processing of your information.
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

export default Privacy; 