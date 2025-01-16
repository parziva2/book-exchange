import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Container, Alert, CircularProgress, Button, Box } from '@mui/material';

const MentorRoute = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If not a mentor at all, show become mentor message
  if (!user.roles?.includes('mentor') || !user.mentorProfile) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          You need to be a mentor to access this page. Would you like to become a mentor?
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/become-mentor')}
          >
            Become a Mentor
          </Button>
        </Box>
      </Container>
    );
  }

  // If mentor profile is pending
  if (user.mentorProfile.status === 'pending') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          Your mentor application is pending approval. Our team will review your application and get back to you soon. Please check back later or contact support for more information.
        </Alert>
      </Container>
    );
  }

  // If mentor profile is rejected
  if (user.mentorProfile.status === 'rejected') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Your mentor application was not approved. Please contact support for more information about why your application was rejected and how you can improve it.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/support')}
          >
            Contact Support
          </Button>
        </Box>
      </Container>
    );
  }

  // If mentor profile is approved, allow access to mentor routes
  if (user.mentorProfile.status === 'approved') {
    return <Outlet />;
  }

  // Default case: redirect to become-mentor page
  return <Navigate to="/become-mentor" replace />;
};

export default MentorRoute; 