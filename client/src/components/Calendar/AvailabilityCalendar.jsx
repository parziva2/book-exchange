import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControlLabel,
  Switch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../utils/api';

const AvailabilityCalendar = ({ mentorId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: ''
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [numberOfWeeks, setNumberOfWeeks] = useState(1);

  // Generate time slots from 00:00 to 23:30 in 30-minute intervals
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = (i % 2 === 0 ? '00' : '30');
    return `${hour}:${minute}`;
  });

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate, mentorId]);

  const fetchAvailability = async () => {
    try {
      if (!mentorId) {
        setError('Mentor ID is required to fetch availability slots');
        return;
      }

      setLoading(true);
      setError('');

      const response = await api.get(`/mentors/${mentorId}/availability`, {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd')
        }
      });

      if (response.data?.status === 'success') {
        setAvailableSlots(response.data.data.slots || []);
      } else {
        setAvailableSlots([]);
        setError('Failed to load availability slots');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(`Failed to load availability: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      if (!selectedDate || !newSlot.startTime || !newSlot.endTime) {
        enqueueSnackbar('Please select both start and end times', { variant: 'error' });
        return;
      }

      if (newSlot.startTime >= newSlot.endTime) {
        enqueueSnackbar('End time must be after start time', { variant: 'error' });
        return;
      }

      if (!mentorId) {
        enqueueSnackbar('Mentor ID is required to add availability slots', { variant: 'error' });
        return;
      }

      setLoading(true);
      setError(null);

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const response = await api.post(`/mentors/${mentorId}/availability`, {
        date: formattedDate,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        recurring: isRecurring,
        numberOfWeeks: isRecurring ? numberOfWeeks : undefined
      });

      if (response.data.status === 'success') {
        enqueueSnackbar('Availability slot(s) added successfully', { variant: 'success' });
        setOpenDialog(false);
        setNewSlot({ startTime: '', endTime: '' });
        setIsRecurring(false);
        setNumberOfWeeks(1);
        await fetchAvailability();
      }
    } catch (err) {
      console.error('Error adding availability slot:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to add availability slot', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSlot = async (slotId) => {
    try {
      if (!mentorId) {
        enqueueSnackbar('Mentor ID is required to remove availability slots', { variant: 'error' });
        return;
      }

      setLoading(true);
      setError('');
      
      const response = await api.delete(`/mentors/${mentorId}/availability/${slotId}`);
      
      if (response.data?.status === 'success') {
        await fetchAvailability();
        enqueueSnackbar('Availability slot removed successfully', { variant: 'success' });
      } else {
        setError('Failed to remove availability slot. Please try again.');
        enqueueSnackbar('Failed to remove availability slot', { variant: 'error' });
      }
    } catch (err) {
      console.error('Error removing availability slot:', err);
      setError(`Failed to remove availability slot: ${err.response?.data?.message || err.message}`);
      enqueueSnackbar(err.response?.data?.message || 'Failed to remove availability slot', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <DateCalendar
              value={selectedDate}
              onChange={setSelectedDate}
              loading={loading}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => setOpenDialog(true)}
                disabled={loading}
              >
                Add Availability
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Available Slots for {format(selectedDate, 'MMMM d, yyyy')}
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <List>
                {availableSlots.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No availability slots for this date" />
                  </ListItem>
                ) : (
                  availableSlots.map((slot) => (
                    <ListItem key={slot._id}>
                      <ListItemText
                        primary={`${slot.startTime} - ${slot.endTime}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveSlot(slot._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Availability Slot</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Start Time</InputLabel>
              <Select
                value={newSlot.startTime}
                label="Start Time"
                onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
              >
                {timeSlots.map((time) => (
                  <MenuItem 
                    key={time} 
                    value={time}
                    disabled={time >= newSlot.endTime && newSlot.endTime !== ''}
                  >
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>End Time</InputLabel>
              <Select
                value={newSlot.endTime}
                label="End Time"
                onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
              >
                {timeSlots.map((time) => (
                  <MenuItem 
                    key={time} 
                    value={time}
                    disabled={time <= newSlot.startTime}
                  >
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              }
              label="Repeat weekly"
            />
          </Box>
          {isRecurring && (
            <Box sx={{ mt: 2 }}>
              <TextField
                type="number"
                label="Number of weeks"
                value={numberOfWeeks}
                onChange={(e) => setNumberOfWeeks(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                inputProps={{ min: 1, max: 12 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddSlot} variant="contained">
            Add Slot
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AvailabilityCalendar; 