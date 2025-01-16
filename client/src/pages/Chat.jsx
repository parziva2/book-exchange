import React from 'react';
import { Container, Typography } from '@mui/material';

const Chat = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Chat
      </Typography>
      {/* Add chat content here */}
    </Container>
  );
};

export default Chat; 