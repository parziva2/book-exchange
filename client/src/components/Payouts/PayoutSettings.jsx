import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Divider,
  CircularProgress,
  Stack
} from '@mui/material';
import { useApi } from '../../hooks/useApi';

const PayoutSettings = () => {
  const { get, put, post } = useApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    paymentMethod: '',
    paypalEmail: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      routingNumber: '',
      bankName: ''
    }
  });
  const [stats, setStats] = useState({
    totalPaidOut: 0,
    count: 0,
    lastPayout: null,
    currentBalance: 0
  });

  useEffect(() => {
    fetchPayoutSettings();
  }, []);

  const fetchPayoutSettings = async () => {
    try {
      setLoading(true);
      const response = await get('/payouts/settings');
      setSettings(response.data.settings);
      setStats({
        ...response.data.stats,
        currentBalance: response.data.currentBalance
      });
      setError(null);
    } catch (err) {
      setError('Failed to load payout settings');
      console.error('Error fetching payout settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await put('/payouts/settings', settings);
      setSuccess('Payout settings updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update payout settings');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      setLoading(true);
      await post('/payouts/request');
      setSuccess('Payout request submitted successfully');
      fetchPayoutSettings(); // Refresh stats
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request payout');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading && !settings.paymentMethod) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payout Settings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={settings.paymentMethod}
                  label="Payment Method"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="paypal">PayPal</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                </Select>
              </FormControl>

              {settings.paymentMethod === 'paypal' && (
                <TextField
                  name="paypalEmail"
                  label="PayPal Email"
                  value={settings.paypalEmail}
                  onChange={handleChange}
                  fullWidth
                  required
                  type="email"
                />
              )}

              {settings.paymentMethod === 'bank_transfer' && (
                <Stack spacing={2}>
                  <TextField
                    name="bankDetails.accountName"
                    label="Account Name"
                    value={settings.bankDetails.accountName}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                  <TextField
                    name="bankDetails.accountNumber"
                    label="Account Number"
                    value={settings.bankDetails.accountNumber}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                  <TextField
                    name="bankDetails.routingNumber"
                    label="Routing Number"
                    value={settings.bankDetails.routingNumber}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                  <TextField
                    name="bankDetails.bankName"
                    label="Bank Name"
                    value={settings.bankDetails.bankName}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Stack>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                Save Settings
              </Button>
            </Stack>
          </form>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Payout Summary
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Current Balance
                </Typography>
                <Typography variant="h4">
                  ${stats.currentBalance.toFixed(2)}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Total Paid Out
                </Typography>
                <Typography variant="h6">
                  ${stats.totalPaidOut.toFixed(2)}
                </Typography>
              </Box>
              
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Last Payout
                </Typography>
                <Typography>
                  {stats.lastPayout 
                    ? new Date(stats.lastPayout).toLocaleDateString()
                    : 'No payouts yet'}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleRequestPayout}
                disabled={loading || stats.currentBalance < 50}
              >
                Request Payout
              </Button>
              
              {stats.currentBalance < 50 && (
                <Typography variant="body2" color="text.secondary">
                  Minimum payout amount is $50
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PayoutSettings; 