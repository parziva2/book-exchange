import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const NotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    emailNotifications: {
      sessionReminders: true,
      sessionUpdates: true,
      mentorMessages: true,
      promotionalEmails: false,
    },
    pushNotifications: {
      sessionReminders: true,
      sessionUpdates: true,
      mentorMessages: true,
      balanceUpdates: true,
    },
    reminderTiming: {
      beforeSession: 30, // minutes
    },
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Mock fetching user preferences
    // In production, this would fetch from your backend
    const fetchPreferences = async () => {
      try {
        // Simulated API call
        // const response = await api.get('/user/notification-preferences');
        // setPreferences(response.data);
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      }
    };

    fetchPreferences();
  }, [user]);

  const handleToggle = (category, setting) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting],
      },
    }));
  };

  const handleSave = async () => {
    try {
      // Simulated API call
      // await api.put('/user/notification-preferences', preferences);
      setSnackbar({
        open: true,
        message: 'Notification preferences saved successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save notification preferences',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Notification Preferences
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Email Notifications
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications.sessionReminders}
                  onChange={() => handleToggle('emailNotifications', 'sessionReminders')}
                />
              }
              label="Session Reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications.sessionUpdates}
                  onChange={() => handleToggle('emailNotifications', 'sessionUpdates')}
                />
              }
              label="Session Updates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications.mentorMessages}
                  onChange={() => handleToggle('emailNotifications', 'mentorMessages')}
                />
              }
              label="Mentor Messages"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications.promotionalEmails}
                  onChange={() => handleToggle('emailNotifications', 'promotionalEmails')}
                />
              }
              label="Promotional Emails"
            />
          </FormGroup>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Push Notifications
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.pushNotifications.sessionReminders}
                  onChange={() => handleToggle('pushNotifications', 'sessionReminders')}
                />
              }
              label="Session Reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.pushNotifications.sessionUpdates}
                  onChange={() => handleToggle('pushNotifications', 'sessionUpdates')}
                />
              }
              label="Session Updates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.pushNotifications.mentorMessages}
                  onChange={() => handleToggle('pushNotifications', 'mentorMessages')}
                />
              }
              label="Mentor Messages"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.pushNotifications.balanceUpdates}
                  onChange={() => handleToggle('pushNotifications', 'balanceUpdates')}
                />
              }
              label="Balance Updates"
            />
          </FormGroup>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            bgcolor: '#1a73e8',
            '&:hover': {
              bgcolor: '#1557b0',
            },
          }}
        >
          Save Preferences
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationPreferences; 