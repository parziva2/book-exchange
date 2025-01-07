import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack,
} from '@mui/material';
import {
  School,
  Psychology,
  CreditScore,
  StarBorder,
  Schedule,
  Chat,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const features = [
  {
    icon: <School sx={{ fontSize: 40 }} />,
    title: 'Share Your Knowledge',
    description: 'Teach others in your area of expertise and earn credits.',
  },
  {
    icon: <Psychology sx={{ fontSize: 40 }} />,
    title: 'Learn from Experts',
    description: 'Connect with experienced mentors in various fields.',
  },
  {
    icon: <CreditScore sx={{ fontSize: 40 }} />,
    title: 'Credit System',
    description: 'Earn credits by teaching, spend them on learning.',
  },
  {
    icon: <StarBorder sx={{ fontSize: 40 }} />,
    title: 'Quality Assurance',
    description: 'Rate and review your learning experience.',
  },
  {
    icon: <Schedule sx={{ fontSize: 40 }} />,
    title: 'Flexible Scheduling',
    description: 'Book sessions that fit your schedule.',
  },
  {
    icon: <Chat sx={{ fontSize: 40 }} />,
    title: 'Real-time Interaction',
    description: 'Connect through chat and video calls.',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
          borderRadius: 2,
        }}
      >
        <Container maxWidth="md">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Share Knowledge, Grow Together
          </Typography>
          <Typography variant="h5" align="center" paragraph>
            A platform where you can exchange your expertise with others.
            Teach what you know, learn what you want.
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            {!user && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </>
            )}
            {user && (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/search')}
              >
                Find Mentors
              </Button>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          component="h2"
          variant="h3"
          align="center"
          sx={{ mb: 6 }}
        >
          Platform Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                }}
                elevation={2}
              >
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    borderRadius: '50%',
                    p: 2,
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <CardContent>
                  <Typography
                    gutterBottom
                    variant="h5"
                    component="h3"
                    align="center"
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    align="center"
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box sx={{ bgcolor: 'secondary.light', py: 8 }}>
        <Container maxWidth="md">
          <Typography
            variant="h4"
            align="center"
            color="text.primary"
            gutterBottom
          >
            Ready to Start Learning?
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            paragraph
          >
            Join our community of learners and experts today.
            Share your knowledge and learn from others.
          </Typography>
          {!user && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/register')}
              >
                Join Now
              </Button>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 