import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Rating,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import ChatDialog from '../components/chat/ChatDialogComponent.jsx';
import BookSession from '../components/sessions/BookSession';
import { useAuth } from '../contexts/AuthContext';
import { getValidAccessToken } from '../utils/tokenStorage';
import axios from 'axios';
import Reviews from '../components/reviews/Reviews';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MentorProfile = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openBooking, setOpenBooking] = useState(false);
  const [openChat, setOpenChat] = useState(false);

  useEffect(() => {
    fetchMentorProfile();
  }, [mentorId]);

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getValidAccessToken();
      if (!token) {
        setError('Please log in to view mentor profiles');
        return;
      }

      const response = await axios.get(`${API_URL}/mentors/${mentorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.status === 'success' && response.data?.data?.mentor) {
        const mentorData = response.data.data.mentor;
        setMentor({
          ...mentorData,
          _id: mentorData._id || mentorId,
          reviews: [],
          achievements: [],
          socialLinks: {}
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching mentor profile:', err);
      if (err.response?.status === 404) {
        setError('Mentor not found');
      } else if (err.response?.status === 401) {
        setError('Please log in to view mentor profiles');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch mentor profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!mentor) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="info">Mentor not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={mentor?.avatar ? `http://localhost:5000${mentor.avatar}` : undefined}
                sx={{ width: 150, height: 150, mb: 2 }}
              >
                {mentor?.firstName?.[0]}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {mentor?.firstName} {mentor?.lastName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={mentor.rating || 0} precision={0.1} readOnly />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({mentor.reviewCount || 0} reviews)
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<CalendarIcon />}
                  onClick={() => setOpenBooking(true)}
                >
                  Book Session
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MessageIcon />}
                  onClick={() => setOpenChat(true)}
                >
                  Message
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Expertise
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
              {mentor.expertise?.map((skill) => (
                <Chip key={skill} label={skill} />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Typography paragraph>
              {mentor.bio || 'No bio available'}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Experience
            </Typography>
            <Typography paragraph>
              {mentor.experience?.length > 0 ? (
                mentor.experience.map((exp, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{exp.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {exp.company} • {exp.duration}
                    </Typography>
                  </Box>
                ))
              ) : (
                'No experience listed'
              )}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Education
            </Typography>
            <Typography paragraph>
              {mentor.education?.length > 0 ? (
                mentor.education.map((edu, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{edu.degree}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {edu.institution} • {edu.year}
                    </Typography>
                  </Box>
                ))
              ) : (
                'No education listed'
              )}
            </Typography>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Reviews
              </Typography>
              <Reviews mentorId={mentor._id} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Book Session Dialog */}
      <BookSession
        mentor={mentor}
        open={openBooking}
        onClose={() => setOpenBooking(false)}
      />

      {/* Chat Dialog */}
      {openChat && (
        <ChatDialog
          open={openChat}
          onClose={() => setOpenChat(false)}
          recipientId={mentor._id}
          recipientName={`${mentor.firstName} ${mentor.lastName}`}
          recipientAvatar={mentor.avatar}
        />
      )}
    </Container>
  );
};

export default MentorProfile; 