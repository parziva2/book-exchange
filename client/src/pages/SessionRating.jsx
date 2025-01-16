import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Rating,
  TextField,
  Button,
  Chip,
  Avatar,
  Grid,
  Alert,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

// Mock session data - replace with API call
const mockSession = {
  id: '123',
  topic: 'React Hooks Deep Dive',
  mentor: {
    id: 'mentor1',
    name: 'John Doe',
    avatar: '',
    expertise: ['React', 'Node.js', 'System Design'],
  },
  mentee: {
    id: 'mentee1',
    name: 'Alice Smith',
    avatar: '',
  },
  date: new Date(),
  duration: 60,
  description: 'Understanding useEffect and custom hooks',
};

const learningOutcomes = [
  'Gained new knowledge/skills',
  'Clarified concepts',
  'Solved specific problems',
  'Improved understanding',
  'Received practical advice',
  'Got career guidance',
];

const SessionRating = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [outcomes, setOutcomes] = useState([]);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);

  useEffect(() => {
    fetchSessionDetails();
  }, []);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSession(mockSession);
    } catch (error) {
      console.error('Error fetching session details:', error);
      setError('Failed to load session details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOutcomeToggle = (outcome) => {
    setOutcomes(prev =>
      prev.includes(outcome)
        ? prev.filter(o => o !== outcome)
        : [...prev, outcome]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Prepare feedback data
      const feedbackData = {
        sessionId,
        rating,
        feedback,
        outcomes,
        strengths,
        improvements,
        wouldRecommend,
        mentorId: session.mentor.id,
        menteeId: session.mentee.id,
      };

      // Send notification to mentor
      await sendNotification('session_rated', {
        title: 'Session Feedback Received',
        message: `${session.mentee.name} has provided feedback for your session on ${session.topic}`,
        recipientId: session.mentor.id,
      });

      // Navigate back to sessions page
      navigate('/sessions');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading session details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Rate Your Session
        </Typography>

        {/* Session Info */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 64, height: 64 }}>
                {session.mentor.name[0]}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6">
                {session.topic}
              </Typography>
              <Typography color="text.secondary">
                with {session.mentor.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {session.mentor.expertise.map((skill) => (
                  <Chip key={skill} label={skill} size="small" />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Rating */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            How would you rate this session?
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            size="large"
            icon={<StarIcon fontSize="inherit" color="primary" />}
            emptyIcon={<StarBorderIcon fontSize="inherit" />}
          />
        </Box>

        {/* Learning Outcomes */}
        <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }}>
          <FormLabel component="legend">
            What did you achieve in this session? (Select all that apply)
          </FormLabel>
          <FormGroup>
            <Grid container spacing={2}>
              {learningOutcomes.map((outcome) => (
                <Grid item xs={12} sm={6} key={outcome}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={outcomes.includes(outcome)}
                        onChange={() => handleOutcomeToggle(outcome)}
                      />
                    }
                    label={outcome}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>
        </FormControl>

        {/* Detailed Feedback */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Overall Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              multiline
              rows={4}
              placeholder="Share your thoughts about the session..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="What went well?"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              multiline
              rows={3}
              placeholder="Mentor's strengths, helpful aspects..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="What could be improved?"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              multiline
              rows={3}
              placeholder="Suggestions for improvement..."
            />
          </Grid>
        </Grid>

        {/* Recommendation */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
              />
            }
            label="I would recommend this mentor to other students"
          />
        </Box>

        {/* Submit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/sessions')}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SessionRating; 