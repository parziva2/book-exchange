import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Toolbar } from '@mui/material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const linkStyle = {
    textDecoration: 'none',
    color: 'text.secondary',
    '&:hover': {
      color: 'primary.main'
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.background.paper,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ px: 1 }}>
        <Typography variant="body2" color="text.secondary">
          © {currentYear} SwapExpertise. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, ml: 'auto' }}>
          <Link
            to="/privacy"
            style={{ textDecoration: 'none' }}
          >
            <Typography variant="body2" sx={linkStyle}>
              Privacy Policy
            </Typography>
          </Link>
          <Link
            to="/terms"
            style={{ textDecoration: 'none' }}
          >
            <Typography variant="body2" sx={linkStyle}>
              Terms of Service
            </Typography>
          </Link>
          <Link
            to="/help"
            style={{ textDecoration: 'none' }}
          >
            <Typography variant="body2" sx={linkStyle}>
              Help Center
            </Typography>
          </Link>
        </Box>
      </Toolbar>
    </Box>
  );
};

export default Footer; 
