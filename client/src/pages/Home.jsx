import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SchoolIcon fontSize="large" sx={{ color: '#4285f4' }} />,
      title: 'Expert Mentors',
      description: 'Connect with experienced mentors who are passionate about sharing their knowledge.'
    },
    {
      icon: <GroupIcon fontSize="large" sx={{ color: '#34a853' }} />,
      title: 'Interactive Sessions',
      description: 'Engage in real-time video sessions with screen sharing and collaborative tools.'
    },
    {
      icon: <TrendingUpIcon fontSize="large" sx={{ color: '#fbbc05' }} />,
      title: 'Skill Growth',
      description: 'Learn at your own pace and track your progress with personalized feedback.'
    },
    {
      icon: <SecurityIcon fontSize="large" sx={{ color: '#ea4335' }} />,
      title: 'Secure Platform',
      description: 'Your learning experience is protected with enterprise-grade security.'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box 
        sx={{ 
          textAlign: 'center', 
          pt: { xs: 8, sm: 10 },
          pb: { xs: 8, sm: 12 }
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 500,
            fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
            background: 'linear-gradient(45deg, #4285f4, #34a853, #fbbc05, #ea4335)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 3
          }}
        >
          SwapExpertise
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
        >
          Connect with mentors, share knowledge, and grow together in a collaborative learning environment
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mb: 8 }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              bgcolor: '#1a73e8',
              '&:hover': { bgcolor: '#1557b0' },
              px: 4,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              borderColor: '#1a73e8',
              color: '#1a73e8',
              '&:hover': {
                borderColor: '#1557b0',
                bgcolor: 'rgba(26, 115, 232, 0.04)'
              },
              px: 4,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Sign In
          </Button>
        </Stack>

        {/* Features Section */}
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: 'transparent',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Home; 