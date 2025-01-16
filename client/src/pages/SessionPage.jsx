import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Chat as ChatIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const SessionPage = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useAuth();

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      setSession(response.data.data);
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'in-progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAcceptSession = async () => {
    try {
      await api.post(`/sessions/${session._id}/accept`);
      await fetchSession();
      setSnackbar({
        open: true,
        message: 'Session accepted successfully',
        severity: 'success'
      });
      setConfirmDialog(false);
    } catch (error) {
      console.error('Error accepting session:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to accept session',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="md">
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Session not found
          </Typography>
        </Paper>
      </Container>
    );
  }

  const otherParticipant = session.mentor._id === user._id ? session.mentee : session.mentor;

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ flexGrow: 1 }}>
                Session Details
              </Typography>
              <Chip
                label={session.status}
                color={getStatusColor(session.status)}
                sx={{ ml: 2 }}
              />
            </Box>
            <Divider />
          </Grid>

          {/* Participant Info */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={otherParticipant.profile?.image}
                alt={otherParticipant.username}
                sx={{ width: 64, height: 64, mr: 2 }}
              />
              <Box>
                <Typography variant="h6">
                  {otherParticipant.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.mentor._id === user._id ? 'Mentee' : 'Mentor'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Session Time */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Scheduled Time
              </Typography>
              <Typography variant="h6">
                {format(new Date(session.startTime), 'PPp')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duration: {session.duration} minutes
              </Typography>
            </Box>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {session.status === 'pending' && session.mentor._id === user._id && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setConfirmDialog(true)}
                >
                  Accept Session
                </Button>
              )}
              {(session.status === 'accepted' || session.status === 'confirmed') && (
                <Button
                  variant="contained"
                  startIcon={<VideoCallIcon />}
                  onClick={() => navigate(`/video-session/${session._id}`)}
                >
                  Join Session
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<ChatIcon />}
                onClick={() => navigate(`/chat/${session.chatId}`)}
              >
                Open Chat
              </Button>
              {session.status === 'completed' && !session.rating && session.mentor._id !== user._id && (
                <Button
                  variant="outlined"
                  startIcon={<StarIcon />}
                  onClick={() => navigate(`/session/${session._id}/rate`)}
                >
                  Rate Session
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Accept Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to accept this session with {session?.mentee?.username}?
            Once accepted, you will be able to start the video chat at the scheduled time.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleAcceptSession} color="success" variant="contained">
            Accept Session
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SessionPage; 