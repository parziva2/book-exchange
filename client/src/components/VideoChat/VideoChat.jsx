import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import VideoRoom from '../VideoRoom/VideoRoom';
import SessionFeedback from '../SessionFeedback/SessionFeedback';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';

const VideoChat = ({ sessionId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/${sessionId}`);
      const sessionData = response.data?.data || response.data;
      if (!sessionData) {
        throw new Error('Invalid session data received');
      }
      setSession(sessionData);
      setError('');
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err.response?.data?.message || 'Failed to load session details');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionEnd = async () => {
    setShowEndDialog(true);
  };

  const confirmEndSession = async () => {
    try {
      await api.post(`/sessions/${sessionId}/end`);
      setShowEndDialog(false);
      setShowFeedbackDialog(true);
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
    }
  };

  const handleFeedbackSubmit = async (rating, feedback) => {
    try {
      await api.post(`/sessions/${sessionId}/feedback`, { rating, feedback });
      navigate('/sessions');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback');
    }
  };

  const handleSkipFeedback = () => {
    navigate('/sessions');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!session || !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Session not found or user not authenticated</Alert>
      </Box>
    );
  }

  const isStudent = user._id === (session.mentee?._id || session.student?._id);
  const otherUser = isStudent ? (session.mentor || {}) : (session.mentee || session.student || {});

  return (
    <>
      <VideoRoom 
        sessionId={sessionId} 
        onSessionEnd={handleSessionEnd}
      />

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
        <DialogTitle>End Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end this session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={confirmEndSession} 
            variant="contained" 
            color="error"
          >
            End Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog 
        open={showFeedbackDialog} 
        onClose={() => setShowFeedbackDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Session Feedback</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            How was your session with {otherUser.username || otherUser.firstName || 'your partner'}?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <SessionFeedback
              onSubmit={handleFeedbackSubmit}
              onSkip={handleSkipFeedback}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoChat; 