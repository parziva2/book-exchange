import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const ReminderPreferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preferences, setPreferences] = useState({
    email: {
      '24h': true,
      '1h': true,
      '15min': true
    },
    push: {
      '24h': true,
      '1h': true,
      '15min': true
    }
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/api/users/reminder-preferences');
      setPreferences(response.data.preferences);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('Failed to load reminder preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (type, timing) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [timing]: !prev[type][timing]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await axios.put('/api/users/reminder-preferences', { preferences });
      setSuccess('Reminder preferences updated successfully');
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save reminder preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Reminder Preferences</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Email Reminders
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.email['24h']}
                  onChange={() => handleToggle('email', '24h')}
                />
              }
              label="24 hours before session"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.email['1h']}
                  onChange={() => handleToggle('email', '1h')}
                />
              }
              label="1 hour before session"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.email['15min']}
                  onChange={() => handleToggle('email', '15min')}
                />
              }
              label="15 minutes before session"
            />
          </FormGroup>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Push Notifications
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.push['24h']}
                  onChange={() => handleToggle('push', '24h')}
                />
              }
              label="24 hours before session"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.push['1h']}
                  onChange={() => handleToggle('push', '1h')}
                />
              }
              label="1 hour before session"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.push['15min']}
                  onChange={() => handleToggle('push', '15min')}
                />
              }
              label="15 minutes before session"
            />
          </FormGroup>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Preferences'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReminderPreferences; 