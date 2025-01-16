import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Badge,
  Button,
  MenuItem,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import NotificationMenu from './NotificationMenu';
import MessageMenu from '../MessageMenu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar sx={{ px: 1 }}>
        <Typography
          component={Link}
          to={user?._id ? "/explore" : "/"}
          variant="h6"
          sx={{
            mr: 2,
            fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
            textDecoration: 'none',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            fontWeight: 500
          }}
        >
          <span style={{ color: '#888888' }}>Swap</span>
          <span style={{ 
            color: '#4CAF50',
            textShadow: '0 0 12px rgba(76, 175, 80, 0.6)'
          }}>Expertise</span>
        </Typography>

        {user?._id ? (
          <>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              {!user.roles?.includes('admin') && (
                <>
                  <Button
                    component={Link}
                    to="/explore"
                    color={isActive('/explore') ? 'primary' : 'inherit'}
                    sx={{ 
                      color: isActive('/explore') ? '#1976d2' : 'inherit',
                      '&:hover': { color: '#1976d2' }
                    }}
                  >
                    Explore
                  </Button>
                  <Button
                    component={Link}
                    to="/sessions"
                    color={isActive('/sessions') ? 'primary' : 'inherit'}
                    sx={{ 
                      color: isActive('/sessions') ? '#1976d2' : 'inherit',
                      '&:hover': { color: '#1976d2' }
                    }}
                  >
                    Sessions
                  </Button>
                  <Button
                    component={Link}
                    to="/transactions"
                    color={isActive('/transactions') ? 'primary' : 'inherit'}
                    sx={{ 
                      color: isActive('/transactions') ? '#1976d2' : 'inherit',
                      '&:hover': { color: '#1976d2' }
                    }}
                  >
                    Balance: ${user.balance || 0}
                  </Button>
                  {!user.roles?.includes('mentor') && user.mentorProfile?.status !== 'pending' && (
                    <Button
                      component={Link}
                      to="/become-mentor"
                      color={isActive('/become-mentor') ? 'primary' : 'inherit'}
                      sx={{ 
                        color: isActive('/become-mentor') ? '#1976d2' : 'inherit',
                        '&:hover': { color: '#1976d2' }
                      }}
                    >
                      Become Mentor
                    </Button>
                  )}
                  {user.roles?.includes('mentor') && user.mentorProfile?.status === 'approved' && !user.blocked && (
                    <Button
                      component={Link}
                      to="/mentor-dashboard"
                      color={isActive('/mentor-dashboard') ? 'primary' : 'inherit'}
                      sx={{ 
                        color: isActive('/mentor-dashboard') ? '#1976d2' : 'inherit',
                        '&:hover': { color: '#1976d2' }
                      }}
                    >
                      Mentor Dashboard
                    </Button>
                  )}
                </>
              )}
              {user.roles?.includes('admin') && (
                <Button
                  component={Link}
                  to="/admin"
                  color={isActive('/admin') ? 'primary' : 'inherit'}
                  sx={{ 
                    color: isActive('/admin') ? '#1976d2' : 'inherit',
                    '&:hover': { color: '#1976d2' }
                  }}
                >
                  Admin Dashboard
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationMenu />
              <MessageMenu />
              <IconButton
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircleIcon />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem 
                  component={Link} 
                  to="/profile" 
                  onClick={handleClose}
                  sx={{ 
                    color: isActive('/profile') ? '#1976d2' : 'inherit',
                    '&:hover': { color: '#1976d2' }
                  }}
                >
                  Profile
                </MenuItem>
                {user.roles?.includes('admin') && (
                  <MenuItem 
                    component={Link} 
                    to="/admin" 
                    onClick={handleClose}
                    sx={{ 
                      color: isActive('/admin') ? '#1976d2' : 'inherit',
                      '&:hover': { color: '#1976d2' }
                    }}
                  >
                    Admin Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              component={Link}
              to="/login"
              color="inherit"
              sx={{ 
                color: isActive('/login') ? '#1976d2' : 'inherit',
                '&:hover': { color: '#1976d2' }
              }}
            >
              Sign In
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              color="primary"
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 