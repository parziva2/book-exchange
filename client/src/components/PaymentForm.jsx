import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const PaymentForm = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (error) {
      setError('An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom align="center">
        Payment Details
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Amount to pay: ${amount}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <PaymentElement />
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!stripe || processing}
          sx={{ mt: 2 }}
        >
          {processing ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            `Pay $${amount}`
          )}
        </Button>
      </form>

      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        display="block"
        sx={{ mt: 2 }}
      >
        Your payment is processed securely with Stripe.
        All card information is encrypted.
      </Typography>
    </Paper>
  );
};

export default PaymentForm; 