import React from 'react';
import { Container, Typography, Paper, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Help = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Help Center
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">How do I get started?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Getting started is easy! First, create an account by clicking the "Sign Up" button. Once registered, you can browse available mentors, book sessions, and start learning.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">How do I become a mentor?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                To become a mentor, log in to your account and click on the "Become a Mentor" button. Fill out your profile, including your expertise areas, experience, and rates. Our team will review your application and get back to you within 48 hours.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">How do payments work?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                We use secure payment processing for all transactions. You can add funds to your account using credit/debit cards or other supported payment methods. Mentors receive payments after successful completion of sessions.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">What if I need to cancel a session?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                You can cancel a session up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may be subject to our cancellation policy. Please contact support for special circumstances.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">How can I contact support?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                For any questions or concerns, you can reach our support team at support@swapexpertise.com. We aim to respond to all inquiries within 24 hours.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Paper>
    </Container>
  );
};

export default Help; 