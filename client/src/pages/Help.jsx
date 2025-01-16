import React from 'react';
import { Container, Typography, Paper, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Help = () => {
  const faqs = [
    {
      question: "How do I book a session?",
      answer: "To book a session, browse through our mentors, select one that matches your needs, and click the 'Book Session' button on their profile. Choose your preferred time slot and complete the booking process."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards and debit cards. All payments are processed securely through our platform."
    },
    {
      question: "How can I become a mentor?",
      answer: "To become a mentor, click on the 'Become a Mentor' button in your dashboard. Fill out the required information about your expertise and experience. Our team will review your application and get back to you."
    },
    {
      question: "What if I need to cancel a session?",
      answer: "You can cancel a session up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may be subject to our cancellation policy."
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team through the contact form on this page, or by emailing support@swapexpertise.com. We typically respond within 24 hours."
    }
  ];

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Help Center
        </Typography>
        
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Still Need Help?
          </Typography>
          <Typography paragraph>
            If you couldn't find the answer you were looking for, please don't hesitate to contact our
            support team. We're here to help!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: support@swapexpertise.com
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Response time: Within 24 hours
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Help; 