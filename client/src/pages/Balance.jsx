import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Check as CheckIcon, AttachMoney } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

// Balance packages
const BALANCE_PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Package',
    amount: 10,
    description: 'Perfect for getting started',
    features: [
      'Add $10 to your balance',
      'Access to all mentors',
      'No expiration'
    ]
  },
  {
    id: 'standard',
    name: 'Standard Package',
    amount: 25,
    description: 'Most popular choice',
    features: [
      'Add $25 to your balance',
      'Access to all mentors',
      'No expiration'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Package',
    amount: 60,
    description: 'Best value for active learners',
    features: [
      'Add $60 to your balance',
      'Access to all mentors',
      'No expiration'
    ]
  }
];

const Balance = () => {
  const { user, checkAuth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openCustomDialog, setOpenCustomDialog] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const handlePackageSelect = async (amount) => {
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/transactions/add-funds', { amount });

      if (response.data.status === 'success') {
        await checkAuth();
        const totalAmount = response.data.data.transaction.amount;
        enqueueSnackbar(`Successfully added $${totalAmount.toFixed(2)}!`, { variant: 'success' });
      } else {
        throw new Error(response.data.message || 'Failed to add funds');
      }
    } catch (err) {
      console.error('Error adding funds:', err);
      setError(err.response?.data?.message || 'Failed to add funds');
      enqueueSnackbar('Failed to add funds', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAmount = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    await handlePackageSelect(amount);
    setOpenCustomDialog(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Add Funds
        </Typography>
        <Button
          component={RouterLink}
          to="/transactions"
          variant="outlined"
          startIcon={<AttachMoney />}
        >
          View Transaction History
        </Button>
      </Box>
      
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Current Balance: ${(user?.balance || 0).toFixed(2)}
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {BALANCE_PACKAGES.map((pkg) => (
          <Grid item xs={12} md={4} key={pkg.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {pkg.name}
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  ${pkg.amount}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {pkg.description}
                </Typography>
                <List>
                  {pkg.features.map((feature, index) => (
                    <ListItem key={index} dense>
                      <ListItemIcon>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handlePackageSelect(pkg.amount)}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Select Package'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => setOpenCustomDialog(true)}
          disabled={loading}
        >
          Custom Amount
        </Button>
      </Box>

      <Dialog open={openCustomDialog} onClose={() => setOpenCustomDialog(false)}>
        <DialogTitle>Add Custom Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            inputProps={{ min: 1 }}
            InputProps={{
              startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomDialog(false)}>Cancel</Button>
          <Button onClick={handleCustomAmount} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Add Funds'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Balance; 