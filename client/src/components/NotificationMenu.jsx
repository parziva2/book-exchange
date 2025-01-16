import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  Message as MessageIcon,
  Event as EventIcon,
  Star as StarIcon,
  AccountCircle as AccountCircleIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'new_message':
        navigate('/messages');
        break;
      case 'session_scheduled':
      case 'session_cancelled':
      case 'session_reminder':
        navigate('/sessions');
        break;
      case 'mentor_application_status':
        navigate('/mentor-dashboard');
        break;
      case 'new_review':
        navigate(`/mentor/${notification.data.mentorId}`);
        break;
      case 'credits_updated':
        navigate('/wallet');
        break;
      default:
        break;
    }

    handleClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <MessageIcon color="primary" />;
      case 'session_scheduled':
      case 'session_cancelled':
      case 'session_reminder':
        return <EventIcon color="primary" />;
      case 'mentor_application_status':
        return <AccountCircleIcon color="primary" />;
      case 'new_review':
        return <StarIcon color="primary" />;
      case 'credits_updated':
        return <CreditCardIcon color="primary" />;
      default:
        return <NotificationsIcon color="primary" />;
    }
  };

  const menuItems = [
    <MenuItem key="header">
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Typography variant="h6">Notifications</Typography>
        {unreadCount > 0 && (
          <Button size="small" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </Box>
    </MenuItem>,
    <Divider key="divider-1" />,
    loading ? (
      <MenuItem key="loading" disabled>
        <ListItemText primary="Loading notifications..." />
      </MenuItem>
    ) : notifications.length === 0 ? (
      <MenuItem key="empty" disabled>
        <ListItemText primary="No notifications" />
      </MenuItem>
    ) : (
      notifications.map((notification) => (
        <MenuItem
          key={notification._id}
          onClick={() => handleNotificationClick(notification)}
          sx={{
            backgroundColor: notification.read ? 'inherit' : 'action.hover',
            '&:hover': {
              backgroundColor: 'action.selected'
            }
          }}
        >
          <ListItemIcon>
            {getNotificationIcon(notification.type)}
          </ListItemIcon>
          <ListItemText
            primary={notification.title}
            secondary={
              <Typography component="div" variant="body2">
                {notification.message}
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </Typography>
              </Typography>
            }
          />
          {!notification.read && (
            <CircleIcon
              sx={{
                fontSize: 12,
                color: 'primary.main',
                ml: 1
              }}
            />
          )}
        </MenuItem>
      ))
    ),
    <Divider key="divider-2" />,
    <MenuItem
      key="see-all"
      onClick={() => {
        navigate('/notifications');
        handleClose();
      }}
      sx={{ justifyContent: 'center' }}
    >
      <Typography color="primary">
        See all notifications
      </Typography>
    </MenuItem>
  ];

  return (
    <Box>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label={`${unreadCount} unread notifications`}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 400,
          }
        }}
      >
        {menuItems}
      </Menu>
    </Box>
  );
};

export default NotificationMenu; 