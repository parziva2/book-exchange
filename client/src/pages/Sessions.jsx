import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Schedule,
  CheckCircle,
  Cancel,
  AccessTime,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import VideoCall from '../components/video/VideoCall';

const Sessions = () => {
  const [tab, setTab] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    sessionId: null,
    rating: 0,
    comment: '',
  });
  const [activeVideoSession, setActiveVideoSession] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/sessions');
      setSessions(response.data);
    } catch (err) {
      setError('Failed to fetch sessions');
      console.error('Fetch sessions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      await axios.patch(`/api/sessions/${sessionId}/status`, {
        status: newStatus,
      });
      fetchSessions();
    } catch (err) {
      setError('Failed to update session status');
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      await axios.post(`/api/sessions/${feedbackDialog.sessionId}/feedback`, {
        rating: feedbackDialog.rating,
        comment: feedbackDialog.comment,
      });
      setFeedbackDialog({ open: false, sessionId: null, rating: 0, comment: '' });
      fetchSessions();
    } catch (err) {
      setError('Failed to submit feedback');
    }
  };

  const handleJoinVideoCall = (session) => {
    setActiveVideoSession(session);
  };

  const handleEndVideoCall = () => {
    setActiveVideoSession(null);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <Schedule />, label: 'Pending' },
      confirmed: { color: 'info', icon: <CheckCircle />, label: 'Confirmed' },
      completed: { color: 'success', icon: <CheckCircle />, label: 'Completed' },
      cancelled: { color: 'error', icon: <Cancel />, label: 'Cancelled' },
    };

    const config = statusConfig[status];
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  const renderSessionCard = (session) => {
    const isMentor = session.mentor._id === user._id;
    const otherUser = isMentor ? session.mentee : session.mentor;
    const isUpcoming = new Date(session.scheduledDate) > new Date();
    const canJoinCall = session.status === 'confirmed' && 
      Math.abs(new Date(session.scheduledDate) - new Date()) < 1000 * 60 * 15; // 15 minutes before/after

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2 }}>
                  {otherUser.username[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {isMentor ? 'Mentee' : 'Mentor'}: {otherUser.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Topic: {session.topic}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">
                  {format(new Date(session.scheduledDate), 'PPp')} ({session.duration} minutes)
                </Typography>
              </Box>

              {session.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Notes: {session.notes}
                </Typography>
              )}

              {session.feedback && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Feedback:</Typography>
                  <Rating value={session.feedback.rating} readOnly size="small" />
                  <Typography variant="body2">{session.feedback.comment}</Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', height: '100%' }}>
                {getStatusChip(session.status)}

                {canJoinCall && (
                  <Button
                    variant="contained"
                    startIcon={<VideoCallIcon />}
                    onClick={() => handleJoinVideoCall(session)}
                    sx={{ mt: 2 }}
                  >
                    Join Video Call
                  </Button>
                )}

                {isUpcoming && session.status === 'pending' && (
                  <Box sx={{ mt: 2 }}>
                    {isMentor && (
                      <>
                        <Button
                          color="primary"
                          onClick={() => handleStatusChange(session._id, 'confirmed')}
                          sx={{ mr: 1 }}
                        >
                          Accept
                        </Button>
                        <Button
                          color="error"
                          onClick={() => handleStatusChange(session._id, 'cancelled')}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                  </Box>
                )}

                {!isUpcoming && session.status === 'confirmed' && (
                  <Button
                    color="primary"
                    onClick={() => handleStatusChange(session._id, 'completed')}
                    sx={{ mt: 2 }}
                  >
                    Mark Complete
                  </Button>
                )}

                {session.status === 'completed' && !session.feedback && !isMentor && (
                  <Button
                    color="primary"
                    onClick={() => setFeedbackDialog({
                      open: true,
                      sessionId: session._id,
                      rating: 0,
                      comment: '',
                    })}
                    sx={{ mt: 2 }}
                  >
                    Give Feedback
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.scheduledDate);
    const now = new Date();
    return tab === 0 ? sessionDate >= now : sessionDate < now;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          My Sessions
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab label="Upcoming Sessions" />
            <Tab label="Past Sessions" />
          </Tabs>
        </Box>

        {filteredSessions.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center">
            No {tab === 0 ? 'upcoming' : 'past'} sessions found.
          </Typography>
        ) : (
          filteredSessions.map((session) => renderSessionCard(session))
        )}

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialog.open} onClose={() => setFeedbackDialog({ ...feedbackDialog, open: false })}>
          <DialogTitle>Provide Feedback</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box>
                <Typography component="legend">Rating</Typography>
                <Rating
                  value={feedbackDialog.rating}
                  onChange={(event, newValue) => {
                    setFeedbackDialog({ ...feedbackDialog, rating: newValue });
                  }}
                />
              </Box>
              <TextField
                label="Comments"
                multiline
                rows={4}
                value={feedbackDialog.comment}
                onChange={(e) => setFeedbackDialog({ ...feedbackDialog, comment: e.target.value })}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialog({ ...feedbackDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit} variant="contained">
              Submit Feedback
            </Button>
          </DialogActions>
        </Dialog>
      </Container>

      {/* Video Call */}
      {activeVideoSession && (
        <VideoCall
          sessionId={activeVideoSession._id}
          onClose={handleEndVideoCall}
        />
      )}
    </>
  );
};

export default Sessions; 