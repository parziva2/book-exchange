import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { format, parse, addMinutes, isWithinInterval } from 'date-fns';
import { useSnackbar } from 'notistack';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' }
];

const BookSession = ({ mentor, onClose, open }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  // Effect for fetching availability when date or mentor changes
  useEffect(() => {
    if (open && mentor?._id && selectedDate) {
      console.log('Fetching availability for date change:', {
        date: format(selectedDate, 'yyyy-MM-dd'),
        mentorId: mentor._id,
        isOpen: open
      });
      fetchAvailability();
    }
  }, [selectedDate, mentor?._id, open]);

  // Effect for resetting form when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Dialog opened, resetting form');
      setSelectedSlot(null);
      setSelectedDuration(null);
      setTopic('');
      setDescription('');
      setError('');
      setAvailableSlots([]);
      setAvailableTimeSlots([]);
      // Fetch availability for current date when dialog opens
      if (mentor?._id && selectedDate) {
        fetchAvailability();
      }
    }
  }, [open]);

  // Get available durations from all slots
  const getAvailableDurations = () => {
    const allDurations = new Set();
    availableSlots.forEach(slot => {
      slot.availableDurations?.forEach(duration => allDurations.add(duration));
    });
    return Array.from(allDurations).sort((a, b) => a - b);
  };

  // Filter DURATION_OPTIONS based on available durations
  const availableDurationOptions = DURATION_OPTIONS.filter(option => 
    getAvailableDurations().includes(option.value)
  );

  // Effect to set initial duration when slots change
  useEffect(() => {
    const availableDurations = getAvailableDurations();
    console.log('Available durations:', availableDurations);
    
    if (availableDurations.length > 0) {
      if (!selectedDuration || !availableDurations.includes(selectedDuration)) {
        console.log('Setting initial duration to:', availableDurations[0]);
        setSelectedDuration(availableDurations[0]);
      }
    } else {
      setSelectedDuration(null);
    }
  }, [availableSlots]);

  const generateTimeSlots = () => {
    if (!selectedDuration) return [];
    
    const timeSlots = [];
    availableSlots.forEach(slot => {
      console.log('Processing slot for time slots:', slot);
      if (!slot.availableDurations?.includes(selectedDuration)) {
        console.log('Selected duration not available for this slot');
        return;
      }

      const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
      const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
      
      const slotStart = new Date(slot.date);
      slotStart.setHours(startHours, startMinutes, 0, 0);
      
      const slotEnd = new Date(slot.date);
      slotEnd.setHours(endHours, endMinutes, 0, 0);

      let currentTime = new Date(slotStart);
      while (addMinutes(currentTime, selectedDuration) <= slotEnd) {
        timeSlots.push({
          startTime: format(currentTime, 'HH:mm'),
          endTime: format(addMinutes(currentTime, selectedDuration), 'HH:mm'),
          date: slot.date,
          originalSlot: slot
        });
        currentTime = addMinutes(currentTime, 30);
      }
    });

    return timeSlots;
  };

  // Effect to update time slots when duration changes
  useEffect(() => {
    if (selectedDuration) {
      const slots = generateTimeSlots();
      console.log('Generated new time slots:', slots);
      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedDuration, availableSlots]);

  const fetchAvailability = async () => {
    if (!mentor?._id) {
      console.error('Cannot fetch availability: mentor ID is missing');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Clear slots before fetching
      setAvailableSlots([]);
      setAvailableTimeSlots([]);
      setSelectedSlot(null);

      const response = await api.get(`/mentors/${mentor._id}/availability`, {
        params: { date: formattedDate }
      });

      console.log('Availability response:', response.data);

      const slots = response.data?.data?.slots || [];
      console.log('Parsed slots:', slots);
      
      if (slots.length === 0) {
        console.log('No slots found');
        setError('No availability slots for this date');
        return;
      }

      // Sort slots by time
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setAvailableSlots(slots);
      console.log('Set available slots:', slots);
      setError('');
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err.response?.data?.message || 'Failed to load availability slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!selectedSlot) {
        setError('Please select a time slot');
        return;
      }

      if (!topic.trim()) {
        setError('Please enter a topic');
        return;
      }

      // Create a Date object for the session start time
      const [hours, minutes] = selectedSlot.startTime.split(':');
      const sessionDate = new Date(selectedSlot.date);
      sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const sessionData = {
        mentorId: mentor._id,
        startTime: sessionDate.toISOString(),
        topic: topic.trim(),
        duration: selectedDuration
      };

      const response = await api.post('/sessions', sessionData);

      if (response.data?.status === 'success') {
        enqueueSnackbar('Session booked successfully', { variant: 'success' });
        onClose();
      } else {
        throw new Error(response.data?.message || 'Failed to book session');
      }
    } catch (err) {
      console.error('Error booking session:', err);
      setError(err.response?.data?.message || err.message || 'Failed to book session');
      enqueueSnackbar(err.response?.data?.message || 'Failed to book session. Please try again.', { 
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Book Session with {mentor?.firstName} {mentor?.lastName}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Select Date
              </Typography>
              <DateCalendar
                value={selectedDate}
                onChange={(newDate) => {
                  console.log('Date selected:', format(newDate, 'yyyy-MM-dd'));
                  setSelectedDate(newDate);
                }}
                minDate={new Date()}
                sx={{
                  width: '100%',
                  '& .MuiPickersDay-root.Mui-selected': {
                    backgroundColor: 'primary.main',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="duration-select-label">Session Duration</InputLabel>
                  <Select
                    labelId="duration-select-label"
                    value={selectedDuration || ''}
                    onChange={(e) => {
                      setSelectedDuration(e.target.value);
                      setSelectedSlot(null);
                    }}
                    label="Session Duration"
                    sx={{
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: '1.4375em'
                      }
                    }}
                  >
                    {availableDurationOptions.map(option => (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          minHeight: '1.4375em'
                        }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="subtitle1" gutterBottom>
                  Available Time Slots {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
                </Typography>

                {error && error !== 'No availability slots for this date' && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <List sx={{ 
                  maxHeight: 200, 
                  overflow: 'auto', 
                  border: 1, 
                  borderColor: 'divider',
                  borderRadius: 1
                }}>
                  {availableTimeSlots.map((slot, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton
                        selected={selectedSlot?.startTime === slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <ListItemText 
                          primary={`${slot.startTime} - ${slot.endTime}`}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {availableTimeSlots.length === 0 && !loading && (
                    <ListItem>
                      <ListItemText 
                        primary="No available time slots for this date"
                        sx={{ textAlign: 'center', color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Topic</InputLabel>
                <Select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  label="Topic"
                  required
                >
                  {(mentor?.expertise || []).map((exp) => (
                    <MenuItem key={exp} value={exp}>{exp}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                />
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedSlot || !topic.trim()}
        >
          Book Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookSession; 