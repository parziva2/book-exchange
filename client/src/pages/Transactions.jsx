import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { useSnackbar } from 'notistack';

const Transactions = () => {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [openAddFunds, setOpenAddFunds] = useState(false);
  const [amount, setAmount] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      console.log('Fetching transactions...');
      const response = await api.get('/transactions');
      console.log('Transactions response:', response.data);
      
      if (response.data.status === 'success' && response.data.data.transactions) {
        setTransactions(response.data.data.transactions);
        setError('');
      } else {
        console.error('Invalid response format:', response.data);
        setError('Failed to load transactions. Invalid response format.');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    try {
      setAddingFunds(true);
      console.log('Adding funds:', amount);
      const response = await api.post('/transactions/add-funds', {
        amount: parseFloat(amount)
      });
      console.log('Add funds response:', response.data);
      
      if (response.data.status === 'success') {
        // Update transactions list
        await fetchTransactions();
        
        // Refresh user data to get updated balance
        await checkAuth();
        
        // Close dialog
        setOpenAddFunds(false);
        setAmount('');
        setError('');

        // Show success message with total amount (including bonus)
        const totalAmount = response.data.data.transaction.amount;
        enqueueSnackbar(`Successfully added $${totalAmount.toFixed(2)}!`, { variant: 'success' });
      } else {
        console.error('Invalid response format:', response.data);
        setError('Failed to add funds. Invalid response format.');
      }
    } catch (err) {
      console.error('Error adding funds:', err);
      setError('Failed to add funds. Please try again.');
    } finally {
      setAddingFunds(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Balance Card */}
      <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Your Balance
            </Typography>
            <Typography variant="h3" color="primary">
              ${user?.balance ? user.balance.toFixed(2) : '0.00'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => setOpenAddFunds(true)}
            >
              Add Funds
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Transaction History
        </Typography>
        {transactions.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No transactions yet
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>
                      <Typography
                        color={
                          transaction.type === 'session_payment' ? 'error.main' :
                          transaction.type === 'credit' ? 'success.main' :
                          transaction.type === 'session_refund' ? 'success.main' :
                          transaction.amount >= 0 ? 'success.main' : 'error.main'
                        }
                      >
                        {transaction.type === 'session_payment' ? '-' :
                         transaction.type === 'credit' ? '+' :
                         transaction.type === 'session_refund' ? '+' :
                         transaction.amount >= 0 ? '+' : '-'}$
                        {Math.abs(
                          transaction.type === 'credit' ? transaction.amount :
                          transaction.description.includes('credits') ? 
                            Number(transaction.description.match(/\((\d+) credits\)/)[1]) :
                          transaction.amount
                        ).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {transaction.description.replace(/\(\d+ credits\)/, '')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Funds Dialog */}
      <Dialog open={openAddFunds} onClose={() => setOpenAddFunds(false)}>
        <DialogTitle>Add Funds</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddFunds(false)}>Cancel</Button>
          <Button
            onClick={handleAddFunds}
            variant="contained"
            disabled={!amount || addingFunds}
          >
            {addingFunds ? <CircularProgress size={24} /> : 'Add Funds'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Transactions; 