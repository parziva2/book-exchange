import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const CalendarIntegration = ({ onCalendarConnected }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError('');

      // Get Google OAuth URL from backend
      const response = await axios.get('/api/auth/google/calendar/url');
      const { url } = response.data;

      // Open Google OAuth in a popup
      const popup = window.open(url, 'Google Calendar Auth', 'width=600,height=600');
      
      // Listen for the OAuth callback
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'google-calendar-auth') {
          const { code } = event.data;
          
          try {
            // Exchange code for tokens
            const tokenResponse = await axios.post('/api/auth/google/calendar/callback', { code });
            const { accessToken } = tokenResponse.data;

            // Store the access token (you might want to handle this in your auth context)
            localStorage.setItem('googleCalendarToken', accessToken);

            if (onCalendarConnected) {
              onCalendarConnected(accessToken);
            }

            setIsDialogOpen(true);
          } catch (err) {
            console.error('Error exchanging code:', err);
            setError('Failed to connect to Google Calendar');
          }
        }
      });
    } catch (err) {
      console.error('Error initiating Google auth:', err);
      setError('Failed to initiate Google Calendar connection');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      setError('');

      // Revoke Google Calendar access
      await axios.post('/api/auth/google/calendar/revoke');
      
      // Remove stored token
      localStorage.removeItem('googleCalendarToken');

      if (onCalendarConnected) {
        onCalendarConnected(null);
      }
    } catch (err) {
      console.error('Error disconnecting calendar:', err);
      setError('Failed to disconnect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {localStorage.getItem('googleCalendarToken') ? (
          <>
            <Typography variant="body1" color="success.main">
              ✓ Connected to Google Calendar
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDisconnect}
              disabled={loading}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              'Connect Google Calendar'
            )}
          </Button>
        )}
      </Box>

      {/* Success Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Calendar Connected</DialogTitle>
        <DialogContent>
          <Typography>
            Your Google Calendar has been successfully connected. Your mentoring sessions will now be automatically added to your calendar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarIntegration; 