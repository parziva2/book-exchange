import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import NotificationMenu from './NotificationMenu';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // More detailed logging of user state
    console.log('Navbar - Auth State:', {
      isAuthenticated,
      user,
      hasMentorProfile: !!user?.mentorProfile,
      mentorStatus: user?.mentorProfile?.status,
      roles: user?.roles
    });
  }, [user, isAuthenticated]);

  const renderBecomeMentorButton = () => {
    // Always show button if authenticated and not an approved mentor
    const isApprovedMentor = user?.mentorProfile?.status === 'approved';
    const shouldShowButton = isAuthenticated && !isApprovedMentor;

    console.log('Navbar - Button State:', {
      shouldShowButton,
      isApprovedMentor,
      mentorStatus: user?.mentorProfile?.status
    });
    
    if (shouldShowButton) {
      const buttonText = user?.mentorProfile?.status === 'pending' 
        ? 'Application Pending' 
        : 'Become a Mentor';
      
      return (
        <Button
          component={Link}
          to="/become-mentor"
          color="inherit"
          variant="outlined"
          sx={{ 
            textTransform: 'none',
            ml: 2,
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {buttonText}
        </Button>
      );
    }
    return null;
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          SwapExpertise
        </Typography>

        {isAuthenticated && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {renderBecomeMentorButton()}
            <NotificationMenu />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 