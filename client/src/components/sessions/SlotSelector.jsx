import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { format } from 'date-fns';
import api from '../../utils/api';

const SlotSelector = ({ mentorId, onSlotSelect, onClose, open }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (open && mentorId) {
      fetchAvailability();
    }
  }, [selectedDate, mentorId, open]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/mentors/${mentorId}/availability`, {
        params: {
          date: format(selectedDate, 'yyyy-MM-dd')
        }
      });

      if (response.data?.status === 'success') {
        // Filter out any slots that are in the past
        const now = new Date();
        const slots = response.data.data.slots || [];
        const futureSlots = slots.filter(slot => {
          const [hours, minutes] = slot.startTime.split(':');
          const slotDate = new Date(slot.date);
          slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return slotDate > now;
        });

        setAvailableSlots(futureSlots);
      } else {
        setAvailableSlots([]);
        setError('Failed to load availability slots');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (selectedSlot) {
      onSlotSelect(selectedSlot);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Select Session Time</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Select Date
                </Typography>
                <DateCalendar
                  value={selectedDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  renderDay={(day, _value, DayComponentProps) => {
                    const hasSlots = availableSlots.some(slot => {
                      const slotDate = new Date(slot.date);
                      return slotDate.getDate() === day.getDate() &&
                             slotDate.getMonth() === day.getMonth() &&
                             slotDate.getFullYear() === day.getFullYear();
                    });

                    return (
                      <Box
                        sx={{
                          position: 'relative',
                          '&::after': hasSlots ? {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: 'primary.main'
                          } : {}
                        }}
                      >
                        {day.getDate()}
                      </Box>
                    );
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Available Times for {format(selectedDate, 'MMMM d, yyyy')}
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : (
                  <List>
                    {availableSlots.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="No available slots for this date" />
                      </ListItem>
                    ) : (
                      availableSlots.map((slot) => (
                        <ListItem key={slot._id} disablePadding>
                          <ListItemButton
                            selected={selectedSlot?._id === slot._id}
                            onClick={() => handleSlotSelect(slot)}
                          >
                            <ListItemText 
                              primary={`${slot.startTime} - ${slot.endTime}`}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))
                    )}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={!selectedSlot}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlotSelector; 