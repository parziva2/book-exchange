import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';

const SessionFeedback = ({ open, onClose, onSubmit, sessionId, mentorName }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    if (feedback.length < 10) {
      setError('Please provide more detailed feedback (minimum 10 characters)');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        sessionId,
        rating,
        feedback,
        timestamp: new Date(),
      });
      handleClose();
    } catch (error) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setFeedback('');
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Rate Your Session with {mentorName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="legend" gutterBottom>
            How would you rate this session?
          </Typography>
          <Rating
            name="session-rating"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            precision={0.5}
            size="large"
            emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
          />
        </Box>

        <TextField
          label="Your Feedback"
          multiline
          rows={4}
          fullWidth
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Please share your experience with the mentor and what you learned from the session..."
          helperText={`${feedback.length}/500 characters (minimum 10)`}
          error={feedback.length > 0 && feedback.length < 10}
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            bgcolor: '#1a73e8',
            '&:hover': { bgcolor: '#1557b0' },
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionFeedback; 