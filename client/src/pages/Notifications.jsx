import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Chip
} from '@mui/material';
import {
  Message as MessageIcon,
  Event as EventIcon,
  AccountCircle as AccountCircleIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon,
  Delete as DeleteIcon,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <MessageIcon color="primary" />;
      case 'session_created':
        return <EventIcon color="primary" />;
      case 'session_approved':
        return <CheckCircleIcon color="success" />;
      case 'session_booked':
        return <EventIcon color="success" />;
      case 'session_starting_soon':
        return <ScheduleIcon color="warning" />;
      case 'session_cancelled':
        return <CancelIcon color="error" />;
      case 'session_rescheduled':
        return <ScheduleIcon color="primary" />;
      case 'insufficient_funds':
        return <WarningIcon color="error" />;
      case 'funds_added':
        return <MonetizationOnIcon color="success" />;
      case 'payout_processed':
        return <PaymentIcon color="success" />;
      case 'refund_processed':
        return <MonetizationOnIcon color="info" />;
      case 'mentor_application_status':
        return <AccountCircleIcon color="primary" />;
      case 'new_review':
        return <StarIcon color="warning" />;
      default:
        return <EventIcon color="primary" />;
    }
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
  };

  const handleDelete = async (event, notificationId) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
        {notifications.some(n => !n.read) && (
          <Button
            variant="outlined"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      <Paper elevation={2}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No notifications to display
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                {index > 0 && <Divider />}
                <ListItem
                  button
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
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {notification.title}
                        {notification.priority === 'high' && (
                          <Chip
                            label="Important"
                            color="error"
                            size="small"
                            variant="outlined"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block' }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => handleDelete(e, notification._id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Notifications; 