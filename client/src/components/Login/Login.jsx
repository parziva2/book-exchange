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
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (authError) {
      setError(authError);
      if (authError.includes('wait')) {
        const seconds = parseInt(authError.match(/\d+/)?.[0] || '0');
        if (seconds > 0) {
          setCountdown(seconds);
        }
      }
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (countdown > 0) {
      return;
    }

    try {
      setError('');
      await login(email, password);
    } catch (error) {
      // Error is handled by AuthContext and will be shown through authError
    }
  };

  const isDisabled = loading || countdown > 0;

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
              {countdown > 0 && (
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
              disabled={isDisabled}
              error={!!error && !error.includes('wait')}
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
              disabled={isDisabled}
              error={!!error && !error.includes('wait')}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isDisabled}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : countdown > 0 ? (
                `Try again in ${countdown}s`
              ) : (
                'Login'
              )}
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