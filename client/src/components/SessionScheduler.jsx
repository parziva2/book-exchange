import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Paper,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import {
  addMinutes,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
  format,
  addDays,
  parse,
} from 'date-fns';
import api from '../services/api';

const SessionScheduler = ({ open, onClose, onSchedule, mentorId, duration = 60 }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      fetchAvailability();
    }
  }, [open, mentorId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/mentors/${mentorId}/availability`, {
        params: {
          date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
        }
      });

      if (response.data?.status === 'success') {
        const slots = response.data.data.slots || [];
        const formattedSlots = slots.map(slot => ({
          start: parse(`${format(selectedDate || new Date(), 'yyyy-MM-dd')} ${slot.startTime}`, 'yyyy-MM-dd HH:mm', new Date()),
          end: parse(`${format(selectedDate || new Date(), 'yyyy-MM-dd')} ${slot.endTime}`, 'yyyy-MM-dd HH:mm', new Date()),
          available: true
        }));
        setAvailableSlots(formattedSlots);
      } else {
        setAvailableSlots([]);
        setError('Failed to load availability slots');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(`Failed to load availability: ${err.response?.data?.message || err.message}`);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedSlot(null);
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    
    // Find matching slot
    const slot = availableSlots.find(
      (slot) =>
        format(slot.start, 'yyyy-MM-dd HH:mm') ===
        format(time, 'yyyy-MM-dd HH:mm')
    );
    
    setSelectedSlot(slot);
  };

  const handleSchedule = () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    onSchedule({
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      notes: notes.trim(),
    });
    
    handleClose();
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedSlot(null);
    setNotes('');
    setError('');
    onClose();
  };

  const isTimeDisabled = (time) => {
    if (!selectedDate) return true;

    const slot = availableSlots.find(
      (slot) =>
        format(slot.start, 'yyyy-MM-dd HH:mm') ===
        format(time, 'yyyy-MM-dd HH:mm')
    );

    return !slot || !slot.available;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Schedule Session</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Select Date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    minDate={addDays(new Date(), 1)}
                    maxDate={addDays(new Date(), 30)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TimePicker
                    label="Select Time"
                    value={selectedTime}
                    onChange={handleTimeChange}
                    disabled={!selectedDate}
                    shouldDisableTime={isTimeDisabled}
                    minutesStep={30}
                    minTime={setHours(new Date(), 9)}
                    maxTime={setHours(new Date(), 17)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>

              {selectedSlot && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Time Slot
                  </Typography>
                  <Typography variant="body1">
                    {format(selectedSlot.start, 'PPP')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(selectedSlot.start, 'p')} - {format(selectedSlot.end, 'p')}
                  </Typography>
                </Paper>
              )}

              <TextField
                label="Session Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or specific topics you'd like to discuss..."
                fullWidth
              />
            </Stack>
          </LocalizationProvider>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSchedule}
          variant="contained"
          color="primary"
          disabled={!selectedSlot}
        >
          Schedule Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionScheduler; 