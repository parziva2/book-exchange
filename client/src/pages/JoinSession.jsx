import React from 'react';
import { useParams } from 'react-router-dom';
import VideoChat from '../components/VideoChat/VideoChat';
import { Box, Container, Paper } from '@mui/material';

const JoinSession = () => {
  const { sessionId } = useParams();

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 2 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          height: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ height: '100%' }}>
          <VideoChat sessionId={sessionId} />
        </Box>
      </Paper>
    </Container>
  );
};

export default JoinSession; 