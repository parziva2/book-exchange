import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  Tabs,
  Tab,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Radio,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Message as MessageIcon,
  VideoCall as VideoCallIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import ChatDialog from '../components/chat/ChatDialogComponent.jsx';
import ReviewForm from '../components/reviews/ReviewForm';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' }
];

const Sessions = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = React.useState(0);
  const { user } = useAuth();
  const api = useApi();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [reviewSession, setReviewSession] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [newDateTime, setNewDateTime] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      console.log('Fetching sessions...');
      const response = await api.get('/sessions');
      console.log('Raw API Response:', {
        fullResponse: response,
        data: response?.data,
        nestedData: response?.data?.data,
        sessions: response?.data?.data?.sessions,
        responseType: typeof response,
        dataType: typeof response?.data,
        nestedDataType: typeof response?.data?.data,
        sessionsType: typeof response?.data?.data?.sessions,
      });
      
      // Extract sessions from the response
      const sessionsData = response?.data?.data?.sessions;
      
      // If sessionsData is undefined but we have a data array directly, use that
      const sessions = Array.isArray(sessionsData) ? sessionsData : 
                      Array.isArray(response?.data?.sessions) ? response.data.sessions :
                      Array.isArray(response?.data) ? response.data : [];
      
      console.log('Parsed sessions data:', {
        dataStructure: {
          hasDataProperty: !!response?.data,
          hasNestedDataProperty: !!response?.data?.data,
          hasSessionsArray: Array.isArray(sessions)
        },
        sessions,
        totalSessions: sessions.length
      });

      // Transform session data to ensure all required fields are present
      const transformedSessions = sessions.map(session => ({
        _id: session._id,
        mentor: session.mentor || {},
        mentee: session.mentee || {},
        startTime: session.startTime,
        duration: session.duration || 60,
        topic: session.topic || 'No topic specified',
        status: session.status || 'pending'
      }));

      setSessions(transformedSessions);
      setError(null);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error?.response?.data?.message || 'Failed to load sessions. Please try again.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleApproveSession = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/accept`);
      await fetchSessions();
      enqueueSnackbar('Session accepted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error accepting session:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to accept session', { variant: 'error' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFilteredSessions = () => {
    console.log('Filtering sessions...');
    console.log('Total sessions before filtering:', sessions?.length || 0);
    console.log('Current tab:', ['Upcoming', 'Past', 'Cancelled'][tabValue]);
    
    if (!Array.isArray(sessions)) {
      console.error('Sessions is not an array:', sessions);
      return [];
    }

    const filtered = sessions.filter(session => {
      if (!session?.startTime) {
        console.log('Session missing startTime:', session);
        return false;
      }
      
      const sessionDate = new Date(session.startTime);
      if (isNaN(sessionDate.getTime())) {
        console.log('Invalid session date:', session.startTime);
        return false;
      }

      const now = new Date();
      const isUpcoming = sessionDate > now;
      const isPast = sessionDate < now;
      const isCancelled = session.status === 'cancelled';
      
      console.log('Session details:', {
        id: session._id,
        startTime: session.startTime,
        status: session.status,
        isUpcoming,
        isPast,
        isCancelled,
        mentor: session.mentor?._id,
        mentee: session.mentee?._id
      });

      let shouldInclude = false;
      switch (tabValue) {
        case 0: // Upcoming
          shouldInclude = isUpcoming && !isCancelled && session.status !== 'completed';
          break;
        case 1: // Past
          shouldInclude = (isPast && !isCancelled) || session.status === 'completed';
          break;
        case 2: // Cancelled
          shouldInclude = isCancelled;
          break;
        default:
          shouldInclude = true;
      }
      
      console.log(`Session ${session._id} ${shouldInclude ? 'included' : 'excluded'} in ${['Upcoming', 'Past', 'Cancelled'][tabValue]} tab`);
      return shouldInclude;
    });

    console.log('Total sessions after filtering:', filtered.length);
    return filtered;
  };

  const handleCancelSession = async (sessionId) => {
    try {
      await api.post(`/api/sessions/${sessionId}/cancel`);
      await fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      setError('Failed to cancel session. Please try again.');
    }
  };

  const handleRescheduleSession = async (session) => {
    setSelectedSession(session);
    setSelectedDuration(session.duration || 60);
    const startDate = new Date(session.startTime);
    // Set the time to noon to avoid timezone issues
    startDate.setHours(12, 0, 0, 0);
    setSelectedDate(startDate);
    await fetchAvailableSlots(session.mentor._id, startDate);
  };

  const handleCloseReschedule = () => {
    setSelectedSession(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setRescheduling(false);
    setSelectedDuration(60);
  };

  const fetchAvailableSlots = async (mentorId, date) => {
    try {
      setLoadingSlots(true);
      
      // Format date for API request
      const formattedDate = date.toISOString().split('T')[0];
      
      const response = await api.get(`/api/mentors/${mentorId}/availability`, {
        params: { date: formattedDate }
      });
      
      const slots = response.data?.data?.slots || response.data?.slots || [];
      
      // Generate time slots for each availability slot
      const timeSlots = [];
      slots.forEach(slot => {
        // Parse start and end times
        const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
        const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
        
        // Create start and end times
        const slotStartTime = new Date(slot.date);
        slotStartTime.setHours(startHours, startMinutes, 0, 0);
        
        const slotEndTime = new Date(slot.date);
        slotEndTime.setHours(endHours, endMinutes, 0, 0);
        
        // Generate slots based on selected duration
        let currentTime = new Date(slotStartTime);
        
        while (currentTime.getTime() + (selectedDuration * 60 * 1000) <= slotEndTime.getTime()) {
          const endTime = new Date(currentTime.getTime() + (selectedDuration * 60 * 1000));
          
          timeSlots.push({
            date: formattedDate,
            startTime: `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`,
            endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
            duration: selectedDuration
          });
          
          // Move to next potential start time (30-minute increments)
          currentTime = new Date(currentTime.getTime() + (30 * 60 * 1000));
        }
      });

      // Sort time slots by time
      timeSlots.sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.startTime}`);
        const timeB = new Date(`${b.date}T${b.startTime}`);
        return timeA - timeB;
      });

      setAvailableSlots(timeSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    if (selectedSession?.mentor?._id) {
      await fetchAvailableSlots(selectedSession.mentor._id, newDate);
    }
  };

  const handleSlotSelect = (slot) => {
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const selectedDateTime = new Date(slot.date);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    setSelectedSlot(slot);
    setNewDateTime(selectedDateTime);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSlot) {
      setError('Please select an available time slot');
      return;
    }

    try {
      setRescheduling(true);
      const startTime = new Date(`${selectedSlot.date}T${selectedSlot.startTime}`);
      
      await api.post(`/sessions/${selectedSession._id}/reschedule`, {
        startTime: startTime.toISOString(),
        duration: selectedDuration
      });
      
      await fetchSessions();
      handleCloseReschedule();
      
      setSnackbar({
        open: true,
        message: 'Session rescheduled successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error rescheduling session:', error);
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Failed to reschedule session. Please try again.',
        severity: 'error'
      });
    } finally {
      setRescheduling(false);
    }
  };

  const handleMessage = (otherUser) => {
    setSelectedChatUser(otherUser);
    setShowChatDialog(true);
  };

  const handleCloseChatDialog = () => {
    setShowChatDialog(false);
    setSelectedChatUser(null);
  };

  const handleReviewSubmitted = async (reviewData) => {
    fetchSessions();
    setSnackbar({
      open: true,
      message: 'Review submitted successfully',
      severity: 'success'
    });
  };

  const handleCancelClick = (session) => {
    setSessionToCancel(session);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    try {
      await api.post(`/sessions/${sessionToCancel._id}/cancel`);
      await fetchSessions();
      setShowCancelDialog(false);
      setSessionToCancel(null);
      setSnackbar({
        open: true,
        message: 'Session cancelled successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error cancelling session:', error);
      setError('Failed to cancel session. Please try again.');
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setSessionToCancel(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const filteredSessions = getFilteredSessions();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Sessions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Upcoming" />
          <Tab label="Past" />
          <Tab label="Cancelled" />
        </Tabs>
      </Box>

      {filteredSessions.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No sessions found for this tab.
        </Alert>
      )}

      <Grid container spacing={3}>
        {filteredSessions.map((session) => {
          const otherUser = user?._id === session.mentor?._id ? session.mentee : session.mentor;
          const isUpcoming = new Date(session.startTime) > new Date();
          const isWithin15Min = isUpcoming && Math.abs(new Date(session.startTime) - new Date()) <= 1000 * 60 * 15;
          
          console.log('Other user data:', otherUser);
          console.log('Profile picture path:', otherUser?.profilePicture);

          return (
            <Grid item xs={12} key={session._id}>
              <Card sx={{ 
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                }
              }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          src={otherUser?.avatar ? `http://localhost:5000${otherUser.avatar}` : undefined}
                          alt={`${otherUser?.firstName} ${otherUser?.lastName}`}
                          sx={{ 
                            mr: 2, 
                            width: 56, 
                            height: 56,
                            bgcolor: user?._id === session.mentor?._id ? 'secondary.main' : 'primary.main'
                          }}
                        >
                          {otherUser?.firstName?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6">
                              {otherUser?.firstName && otherUser?.lastName 
                                ? `${otherUser.firstName} ${otherUser.lastName}`
                                : 'User'}
                            </Typography>
                            {user?._id === session.mentor?._id && (
                              <Chip 
                                label="You are the Mentor" 
                                color="secondary" 
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                            {user?._id === session.mentee?._id && (
                              <Chip 
                                label="You are the Student" 
                                color="primary" 
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                            {session.mentor?.expertise?.map((skill, index) => (
                              <Chip 
                                key={`${skill}-${index}`}
                                label={skill} 
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                  fontWeight: 500
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                        Topic: {session.topic || 'No topic specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {formatDate(session.startTime)} • {session.duration || 0} minutes
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={(session.status || 'UNKNOWN').toUpperCase()} 
                          color={
                            session.status === 'cancelled' ? 'error' :
                            session.status === 'completed' ? 'success' :
                            session.status === 'accepted' ? 'primary' :
                            'default'
                          }
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            px: 1
                          }}
                        />
                        {user?._id === session.mentor?._id && session.status === 'pending' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApproveSession(session._id)}
                          >
                            Approve Session
                          </Button>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2, 
                        height: '100%', 
                        justifyContent: 'center',
                        alignItems: 'stretch'
                      }}>
                        {isUpcoming && session.status !== 'cancelled' && (
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<VideoCallIcon />}
                            onClick={() => navigate(`/video-session/${session._id}`)}
                            fullWidth
                            disabled={!session.status === 'accepted'}
                            sx={{ 
                              background: isWithin15Min 
                                ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                                : 'linear-gradient(45deg, #66bb6a 30%, #81c784 90%)',
                              boxShadow: isWithin15Min
                                ? '0 3px 5px 2px rgba(33, 203, 243, .3)'
                                : '0 3px 5px 2px rgba(102, 187, 106, .3)',
                              '&:hover': {
                                background: isWithin15Min
                                  ? 'linear-gradient(45deg, #1976D2 30%, #21CBF3 90%)'
                                  : 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                              },
                              '&.Mui-disabled': {
                                background: 'rgba(0, 0, 0, 0.12)',
                                color: 'rgba(0, 0, 0, 0.26)'
                              }
                            }}
                          >
                            {isWithin15Min ? 'Join Now' : 'Join Video Session'}
                          </Button>
                        )}
                        
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<MessageIcon />}
                          onClick={() => handleMessage(otherUser)}
                          fullWidth
                        >
                          Message
                        </Button>
                        
                        {isUpcoming && (session.status === 'pending' || session.status === 'accepted') && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<ScheduleIcon />}
                              onClick={() => handleRescheduleSession(session)}
                              sx={{ flex: 1 }}
                            >
                              RESCHEDULE
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => handleCancelClick(session)}
                              sx={{ flex: 1 }}
                            >
                              CANCEL
                            </Button>
                          </Box>
                        )}
                        
                        {session.status === 'completed' && !session.studentReview && user?._id === session.student?._id && (
                          <Button 
                            variant="contained" 
                            color="primary" 
                            fullWidth 
                            onClick={() => navigate(`/session/${session._id}/rate`)}
                            sx={{ mt: 1 }}
                          >
                            Rate Session
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredSessions.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No sessions found
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/explore')}>
            Find a Mentor
          </Button>
        </Box>
      )}

      {/* Chat Dialog */}
      {showChatDialog && selectedChatUser && (
        <ChatDialog
          open={showChatDialog}
          onClose={handleCloseChatDialog}
          recipientId={selectedChatUser._id}
          recipientName={`${selectedChatUser.firstName} ${selectedChatUser.lastName}`}
          recipientAvatar={selectedChatUser.avatar}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onClose={handleCancelDialogClose}>
        <DialogTitle>Cancel Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this session? This action cannot be undone.
            {sessionToCancel && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Session Details:
                </Typography>
                <Typography variant="body2">
                  Topic: {sessionToCancel.topic}
                </Typography>
                <Typography variant="body2">
                  Date: {formatDate(sessionToCancel.startTime)}
                </Typography>
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose}>No, Keep Session</Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained">
            Yes, Cancel Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Reschedule Dialog */}
      <Dialog open={!!selectedSession} onClose={handleCloseReschedule} maxWidth="md" fullWidth>
        <DialogTitle>Reschedule Session</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Current session details:
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Topic: {selectedSession.topic}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Time: {formatDate(selectedSession.startTime)}
              </Typography>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Select Date
                    </Typography>
                    <DateCalendar
                      value={selectedDate}
                      onChange={(newDate) => {
                        const date = new Date(newDate);
                        date.setHours(12, 0, 0, 0);
                        setSelectedDate(date);
                        setSelectedSlot(null);
                        if (selectedSession?.mentor?._id) {
                          fetchAvailableSlots(selectedSession.mentor._id, date);
                        }
                      }}
                      minDate={new Date()}
                      disablePast
                      views={['day']}
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
                        <InputLabel>Session Duration</InputLabel>
                        <Select
                          value={selectedDuration}
                          onChange={(e) => {
                            setSelectedDuration(e.target.value);
                            setSelectedSlot(null);
                            if (selectedDate && selectedSession?.mentor?._id) {
                              fetchAvailableSlots(selectedSession.mentor._id, selectedDate);
                            }
                          }}
                          label="Session Duration"
                        >
                          {DURATION_OPTIONS.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Typography variant="subtitle1" gutterBottom>
                        Available Time Slots {loadingSlots && <CircularProgress size={20} sx={{ ml: 1 }} />}
                      </Typography>

                      <List sx={{ 
                        maxHeight: 300, 
                        overflow: 'auto', 
                        border: 1, 
                        borderColor: 'divider',
                        borderRadius: 1
                      }}>
                        {availableSlots.map((slot, index) => {
                          const startDateTime = new Date(slot.date);
                          const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
                          startDateTime.setHours(startHours, startMinutes, 0, 0);

                          const endDateTime = new Date(slot.date);
                          const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
                          endDateTime.setHours(endHours, endMinutes, 0, 0);

                          return (
                            <ListItem key={`${slot.date}-${slot.startTime}`} disablePadding>
                              <ListItemButton
                                selected={selectedSlot === slot}
                                onClick={() => handleSlotSelect(slot)}
                              >
                                <ListItemText 
                                  primary={`${startDateTime.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })} - ${endDateTime.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}`}
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                        {availableSlots.length === 0 && !loadingSlots && (
                          <ListItem>
                            <ListItemText 
                              primary="No available time slots"
                              sx={{ textAlign: 'center', color: 'text.secondary' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReschedule} disabled={rescheduling}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRescheduleSubmit}
            disabled={rescheduling || !selectedSlot}
          >
            {rescheduling ? 'Rescheduling...' : 'Reschedule Session'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add review dialog */}
      <ReviewForm
        sessionId={reviewSession?._id}
        open={Boolean(reviewSession)}
        onClose={() => setReviewSession(null)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </Container>
  );
};

export default Sessions; 