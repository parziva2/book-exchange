import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Chip,
  Rating,
  CircularProgress,
  Alert,
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import api from '../utils/api';

const MentorList = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await api.get('/mentors');
        setMentors(response.data.data.mentors);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch mentors');
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!mentors.length) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">No mentors available at the moment.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Available Mentors
      </Typography>

      <Grid container spacing={3}>
        {mentors.map((mentor) => (
          <Grid item key={mentor.id || mentor._id} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: '0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={mentor.avatar}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  >
                    {mentor.firstName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {mentor.firstName} {mentor.lastName}
                    </Typography>
                    <Rating value={mentor.rating || 0} readOnly size="small" />
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {mentor.bio || 'No bio available'}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  {mentor.expertise?.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      icon={<SchoolIcon />}
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>

                <Typography variant="body2" color="text.secondary">
                  <strong>Experience:</strong> {mentor.experience || 'Not specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Rate:</strong> ${mentor.hourlyRate || 0}/hour
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/mentor/${mentor.id || mentor._id}`)}
                >
                  View Profile
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MentorList; 