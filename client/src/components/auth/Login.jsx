import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';

const Login = () => {
  const { login, error: authError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [retryTimeout, setRetryTimeout] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsRateLimited(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (authError) {
      if (authError.includes('Too many') || authError.includes('rate limit')) {
        const seconds = parseInt(authError.match(/\d+/)?.[0] || '30');
        setIsRateLimited(true);
        setCountdown(seconds);
        setError(`Please wait ${seconds} seconds before trying again.`);
      } else {
        setError(authError);
      }
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRateLimited) {
      setError(`Please wait ${countdown} seconds before trying again.`);
      return;
    }

    try {
      setError('');
      console.log('Submitting login form:', { email, password });
      await login(email, password);
    } catch (error) {
      console.error('Login form error:', error);
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || 30;
        setIsRateLimited(true);
        setCountdown(retryAfter);
        setError(`Too many login attempts. Please wait ${retryAfter} seconds.`);
      } else {
        setError(error.message || 'Failed to log in');
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
              {isRateLimited && countdown > 0 && (
                <Typography component="div" sx={{ mt: 1 }}>
                  Time remaining: {countdown} seconds
                </Typography>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || isRateLimited}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || isRateLimited}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || isRateLimited}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  Register here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 