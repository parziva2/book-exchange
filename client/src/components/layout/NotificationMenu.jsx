import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Button,
  Divider,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Event as EventIcon,
  AccountCircle as AccountCircleIcon,
  Star as StarIcon,
  CreditCard as CreditCardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
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
      case 'session_created':
      case 'session_approved':
      case 'session_booked':
      case 'session_starting_soon':
      case 'session_cancelled':
      case 'session_rescheduled':
        navigate('/sessions');
        break;
      case 'insufficient_funds':
      case 'funds_added':
      case 'payout_processed':
      case 'refund_processed':
        navigate('/transactions');
        break;
      case 'mentor_application_status':
        navigate('/mentor-dashboard');
        break;
      case 'new_review':
        navigate(`/mentor/${notification.data.mentorId}`);
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
      case 'session_request':
      case 'session_created':
      case 'session_approved':
        return <EventIcon color="success" />;
      case 'session_booked':
        return <CheckCircleIcon color="success" />;
      case 'session_reminder':
      case 'session_starting_soon':
        return <ScheduleIcon color="warning" />;
      case 'session_cancelled':
        return <CancelIcon color="error" />;
      case 'session_rescheduled':
        return <EventIcon color="warning" />;
      case 'insufficient_funds':
        return <WarningIcon color="error" />;
      case 'funds_added':
      case 'payout_processed':
      case 'refund_processed':
        return <PaymentIcon color="primary" />;
      case 'mentor_application_status':
        return <AccountCircleIcon color="primary" />;
      case 'new_review':
        return <StarIcon color="primary" />;
      default:
        return <NotificationsIcon color="primary" />;
    }
  };

  return (
    <>
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
        {[
          <Box key="header" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Box>,
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
                    <Box>
                      <Typography variant="body2">{notification.message}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  }
                />
                {!notification.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      ml: 1
                    }}
                  />
                )}
              </MenuItem>
            ))
          ),
          <Divider key="divider-2" sx={{ my: 1 }} />,
          <MenuItem
            key="view-all"
            component={Link}
            to="/notifications"
            onClick={handleClose}
            sx={{
              justifyContent: 'center',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText'
              }
            }}
          >
            <ListItemIcon>
              <NotificationsIcon color="inherit" />
            </ListItemIcon>
            <ListItemText 
              primary="View All Notifications"
              primaryTypographyProps={{
                variant: 'button',
                sx: { fontWeight: 'medium' }
              }}
            />
          </MenuItem>
        ]}
      </Menu>
    </>
  );
};

export default NotificationMenu; 