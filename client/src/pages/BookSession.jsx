import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BookSession = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({
    topic: '',
    date: null,
    duration: 30,
    notes: '',
  });

  useEffect(() => {
    fetchMentorDetails();
  }, [mentorId]);

  const fetchMentorDetails = async () => {
    try {
      const response = await axios.get(`/api/users/${mentorId}`);
      setMentor(response.data);
    } catch (err) {
      setError('Failed to fetch mentor details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setBookingData((prev) => ({
      ...prev,
      date,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingData.date) {
      return setError('Please select a date');
    }

    try {
      setError('');
      setLoading(true);

      const response = await axios.post('/api/sessions', {
        mentorId,
        topic: bookingData.topic,
        scheduledDate: bookingData.date,
        duration: bookingData.duration,
        notes: bookingData.notes,
      });

      navigate('/sessions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book session');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mentor) {
    return (
      <Container>
        <Alert severity="error">Mentor not found</Alert>
      </Container>
    );
  }

  const creditsRequired = Math.ceil(bookingData.duration / 30);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Book a Session
        </Typography>

        {/* Mentor Info */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
            {mentor.username[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{mentor.username}</Typography>
            <Box sx={{ mt: 1 }}>
              {mentor.expertise.map((exp, index) => (
                <Chip
                  key={index}
                  label={`${exp.topic} (${exp.level})`}
                  sx={{ mr: 1 }}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {user.credits < creditsRequired && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You don't have enough credits for this session duration.
            Required: {creditsRequired} credits, Available: {user.credits} credits
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Topic</InputLabel>
                <Select
                  name="topic"
                  value={bookingData.topic}
                  onChange={handleChange}
                  required
                  label="Topic"
                >
                  {mentor.expertise.map((exp, index) => (
                    <MenuItem key={index} value={exp.topic}>
                      {exp.topic}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Session Date"
                  value={bookingData.date}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Duration (minutes)</InputLabel>
                <Select
                  name="duration"
                  value={bookingData.duration}
                  onChange={handleChange}
                  label="Duration (minutes)"
                >
                  <MenuItem value={30}>30 minutes (1 credit)</MenuItem>
                  <MenuItem value={60}>60 minutes (2 credits)</MenuItem>
                  <MenuItem value={90}>90 minutes (3 credits)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="notes"
                label="Session Notes"
                multiline
                rows={4}
                value={bookingData.notes}
                onChange={handleChange}
                placeholder="Describe what you'd like to learn or discuss in this session"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  Credits Required: {creditsRequired}
                </Typography>
                <Box>
                  <Button
                    type="button"
                    onClick={() => navigate('/search')}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || user.credits < creditsRequired}
                  >
                    {loading ? 'Booking...' : 'Book Session'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default BookSession; 