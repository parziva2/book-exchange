import React, { useState } from 'react';
import {
  Drawer,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  VideoCall as VideoCallIcon,
  Schedule as ScheduleIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate based on notification type
    switch (notification.type) {
      case 'session_reminder':
      case 'session_started':
        navigate(`/session/${notification.sessionId}`);
        break;
      case 'feedback_request':
        navigate(`/session/${notification.sessionId}?feedback=true`);
        break;
      default:
        break;
    }

    setOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_reminder':
        return <ScheduleIcon color="primary" />;
      case 'session_started':
        return <VideoCallIcon color="success" />;
      case 'feedback_request':
        return <WarningIcon color="warning" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatNotificationDate = (date) => {
    if (isToday(date)) {
      return `Today ${format(date, 'p')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'p')}`;
    }
    return format(date, 'PPp');
  };

  return (
    <>
      <IconButton color="inherit" onClick={() => setOpen(true)}>
        <Badge badgeContent={getUnreadCount()} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          <Box>
            {getUnreadCount() > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                startIcon={<CheckIcon />}
              >
                Mark all read
              </Button>
            )}
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                secondary="You're all caught up!"
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {notification.title}
                        {notification.priority === 'high' && (
                          <Chip
                            label="Important"
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        {notification.message}
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {formatNotificationDate(new Date(notification.createdAt))}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))
          )}
        </List>
      </Drawer>
    </>
  );
};

export default NotificationCenter; 