import React, { useState, useEffect, useCallback } from 'react';
import { Container, Grid, Paper, Typography, Box, Tab, Tabs, Card, CardContent, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, LinearProgress, Chip, CircularProgress, Alert, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AvailabilityCalendar from '../components/Calendar/AvailabilityCalendar';
import Rating from '@mui/material/Rating';
import { useApi } from '../hooks/useApi';
import { formatDate } from '../utils/dateUtils';
import { useSnackbar } from 'notistack';

const MentorDashboard = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [sessionsError, setSessionsError] = useState(null);
  const [reviewsError, setReviewsError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [mentorProfileLoading, setMentorProfileLoading] = useState(true);
  const [mentorProfileError, setMentorProfileError] = useState(null);
  const api = useApi();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchMentorProfile();
  }, []);

  useEffect(() => {
    if (mentorProfile) {
      fetchStats();
      fetchSessions();
      fetchReviews();
    }
  }, [mentorProfile]);

  const fetchMentorProfile = async () => {
    try {
      setMentorProfileLoading(true);
      setMentorProfileError(null);
      console.log('Fetching mentor profile...');
      const response = await api.get(`/mentors/me`);
      console.log('Full mentor profile response:', JSON.stringify(response, null, 2));
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        throw new Error('No response data received from server');
      }

      // Check if the response indicates the mentor profile doesn't exist
      if (response.data.status === 'error' || response.data.message?.toLowerCase().includes('not found')) {
        throw new Error('Mentor profile not found. Please complete your mentor profile setup.');
      }

      // Try different possible response formats
      const mentorData = response.data.data?.mentor || response.data.mentor || response.data;
      
      if (!mentorData || typeof mentorData !== 'object') {
        console.log('Response structure:', {
          hasData: 'data' in response,
          dataType: typeof response.data,
          hasNestedData: 'data' in response.data,
          nestedDataType: typeof response.data.data,
          hasMentor: response.data.data ? 'mentor' in response.data.data : false
        });
        throw new Error('Invalid response format from server');
      }

      // Valid mentor profile found
      console.log('Setting mentor profile:', JSON.stringify(mentorData, null, 2));
      setMentorProfile(mentorData);
      
    } catch (err) {
      console.error('Error fetching mentor profile:', err);
      if (err.response) {
        console.error('Error response:', JSON.stringify(err.response, null, 2));
        if (err.response.status === 404) {
          setMentorProfileError('Mentor profile not found. Please complete your mentor profile setup.');
        } else {
          setMentorProfileError(
            err.response.data?.message || 
            err.message || 
            'Failed to load mentor profile'
          );
        }
      } else {
        setMentorProfileError(err.message || 'Failed to load mentor profile');
      }
      setMentorProfile(null);
    } finally {
      setMentorProfileLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/mentors/stats');
      if (response.data?.status === 'success') {
        setStats(response.data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStatsError('Failed to load dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      console.log('Fetching sessions...');
      const response = await api.get('/mentors/sessions', {
        params: {
          status: ['scheduled', 'pending'],
          upcoming: true
        }
      });
      console.log('Sessions response:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        throw new Error('No response data received');
      }

      // Try different possible response formats
      const sessionsData = response.data.data?.sessions || response.data.sessions || response.data;
      
      if (!Array.isArray(sessionsData)) {
        console.log('Invalid sessions data format:', {
          hasData: 'data' in response,
          dataType: typeof response.data,
          hasNestedData: 'data' in response.data,
          nestedDataType: typeof response.data.data,
          hasSessions: response.data.data ? 'sessions' in response.data.data : false
        });
        throw new Error('Invalid sessions data format');
      }

      setSessions(sessionsData);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      if (err.response) {
        console.error('Error response:', JSON.stringify(err.response.data, null, 2));
      }
      setSessionsError(err.message || 'Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await api.get('/reviews/mentor/me');
      if (response.data?.status === 'success') {
        setReviews(response.data.data.reviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviewsError('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleApproveSession = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/accept`);
      await fetchSessions();
      enqueueSnackbar('Session approved successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error approving session:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to approve session', { variant: 'error' });
    }
  };

  const handleEditProfile = () => {
    console.log('Navigating to edit profile page...');
    navigate('/mentor/edit-profile');
  };

  const renderOverview = () => {
    if (statsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (statsError) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">{statsError}</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Sessions</Typography>
              <Typography variant="h3">{stats?.totalSessions || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stats?.sessionsTrend > 0 ? '+' : ''}{stats?.sessionsTrend || 0}% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Average Rating</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" sx={{ mr: 1 }}>
                  {stats?.averageRating?.toFixed(1) || '0.0'}
                </Typography>
                <Rating value={stats?.averageRating || 0} readOnly precision={0.5} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Based on {stats?.totalReviews || 0} reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Earnings</Typography>
              <Typography variant="h3">${stats?.totalEarnings || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ${stats?.monthlyEarnings || 0} this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Success Rate</Typography>
              <Typography variant="h3">{stats?.successRate || 0}%</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Completed sessions rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 
                        activity.type === 'session' ? 'primary.main' :
                        activity.type === 'review' ? 'success.main' :
                        'info.main'
                      }}>
                        {activity.type === 'session' ? '📚' :
                         activity.type === 'review' ? '⭐' : '📝'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.description}
                      secondary={formatDate(activity.date)}
                    />
                  </ListItem>
                  {index < stats?.recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <ListItem>
                  <ListItemText primary="No recent activity" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Session Completion Rate"
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={stats?.completionRate || 0}
                          sx={{ height: 8, borderRadius: 5 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {stats?.completionRate || 0}%
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Average Session Duration"
                  secondary={`${stats?.avgSessionDuration || 0} minutes`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Student Retention Rate"
                  secondary={`${stats?.retentionRate || 0}% returning students`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Response Rate"
                  secondary={`${stats?.responseRate || 0}% messages responded within 24h`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Schedule Highlights */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Schedule Highlights
            </Typography>
            <Grid container spacing={2}>
              {stats?.upcomingHighlights?.map((highlight, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card>
                <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        {formatDate(highlight.date)}
                      </Typography>
                      <Typography variant="body1">
                        {highlight.description}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          size="small"
                          label={highlight.type}
                          color={
                            highlight.type === 'Group Session' ? 'primary' :
                            highlight.type === 'One-on-One' ? 'secondary' :
                            'default'
                          }
                        />
                  </Box>
                </CardContent>
              </Card>
                </Grid>
              ))}
              {(!stats?.upcomingHighlights || stats.upcomingHighlights.length === 0) && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    No upcoming sessions scheduled
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderSessions = () => {
    if (sessionsLoading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    if (sessionsError) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {sessionsError}
        </Alert>
      );
    }

    if (!sessions.length) {
      return (
        <Alert severity="info">
          No sessions found. Students will appear here when they book sessions with you.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {sessions.map((session) => (
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
                      <Avatar sx={{ 
                        mr: 2, 
                        width: 56, 
                        height: 56,
                        bgcolor: 'primary.main'
                      }}>
                        {session.mentee?.firstName?.[0] || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {session.mentee?.firstName && session.mentee?.lastName 
                            ? `${session.mentee.firstName} ${session.mentee.lastName}`
                            : 'Unknown Student'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Student
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                      Topic: {session.topic}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatDate(session.startTime)} • {session.duration} minutes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip 
                        label={session.status.toUpperCase()} 
                        color={
                          session.status === 'cancelled' ? 'error' :
                          session.status === 'completed' ? 'success' :
                          session.status === 'accepted' ? 'primary' :
                          'default'
                        }
                        size="small"
                        sx={{ fontWeight: 'bold', px: 1 }}
                      />
                      {session.status === 'pending' && (
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', justifyContent: 'center' }}>
                      {session.status === 'accepted' && (
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          component={Link}
                          to={`/video/${session._id}`}
                        >
                          Join Video Session
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        component={Link}
                        to={`/messages?userId=${session.mentee._id}`}
                        sx={{ mt: 1 }}
                      >
                        Message Student
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderReviews = () => {
    if (reviewsLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (reviewsError) {
    return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">{reviewsError}</Typography>
        </Box>
      );
    }

    if (!reviews || reviews.length === 0) {
    return (
        <Box sx={{ p: 3 }}>
          <Typography>No reviews yet</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {reviews.map((review) => (
          <Grid item xs={12} key={review._id}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item>
                    <ListItemAvatar>
                      <Avatar src={review.student?.avatar} />
                    </ListItemAvatar>
                  </Grid>
                  <Grid item xs>
                    <Typography variant="subtitle1">
                      {review.student?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating value={review.rating} readOnly precision={0.5} />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {formatDate(review.createdAt)}
                      </Typography>
          </Box>
                    <Typography variant="body1">
                      {review.comment}
                    </Typography>
                    {review.successStory && (
                      <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                        Success Story: {review.successStory}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render mentor profile error if exists
  if (mentorProfileError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="warning" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              component={Link} 
              to="/become-mentor"
              onClick={() => {
                console.log('Navigating to become mentor page...');
              }}
            >
              Complete Profile
            </Button>
          }
        >
          {mentorProfileError}
        </Alert>
      </Container>
    );
  }

  // Show loading state
  if (mentorProfileLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={mentorProfile?.avatar}
                  sx={{ width: 64, height: 64, mr: 2 }}
                >
                  {mentorProfile?.firstName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {mentorProfile?.firstName} {mentorProfile?.lastName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {mentorProfile?.expertise?.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" />
                    ))}
                  </Box>
                </Box>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleEditProfile}
                startIcon={<span role="img" aria-label="edit">✏️</span>}
              >
                Edit Profile
              </Button>
            </Box>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {mentorProfile?.bio}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Hourly Rate: ${mentorProfile?.hourlyRate || 0}/hr
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Languages: {mentorProfile?.languages?.join(', ') || 'Not specified'}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Time Zone: {mentorProfile?.timezone || 'Not specified'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Availability" />
            <Tab label="Sessions" />
            <Tab label="Reviews" />
          </Tabs>
        </Grid>

        {/* Tab Content */}
        <Grid item xs={12}>
          {tabValue === 0 && renderOverview()}
          {tabValue === 1 && mentorProfile && (
            <AvailabilityCalendar 
              mentorId={mentorProfile._id}
            />
          )}
          {tabValue === 2 && renderSessions()}
          {tabValue === 3 && renderReviews()}
        </Grid>
      </Grid>
    </Container>
  );
};

export default MentorDashboard; 