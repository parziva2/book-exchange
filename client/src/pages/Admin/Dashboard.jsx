import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, mentorId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, mentorsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/mentors/pending')
      ]);

      setStats(statsRes.data.data.stats);
      setPendingMentors(mentorsRes.data.data.mentors);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (mentorId) => {
    try {
      await api.put(`/admin/mentors/${mentorId}/approve`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving mentor');
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/admin/mentors/${rejectDialog.mentorId}/reject`, {
        reason: rejectReason
      });
      setRejectDialog({ open: false, mentorId: null });
      setRejectReason('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting mentor');
    }
  };

  if (loading) {
    return <Box p={3}>Loading...</Box>;
  }

  if (error) {
    return <Box p={3} color="error.main">{error}</Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h5">
                  {stats.totalUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Mentors
                </Typography>
                <Typography variant="h5">
                  {stats.totalMentors}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Approvals
                </Typography>
                <Typography variant="h5">
                  {stats.pendingMentors}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Typography variant="h5" gutterBottom>
        Pending Mentor Applications
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Expertise</TableCell>
              <TableCell>Hourly Rate</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingMentors.map((mentor) => (
              <TableRow key={mentor._id}>
                <TableCell>{mentor.username}</TableCell>
                <TableCell>{mentor.email}</TableCell>
                <TableCell>{mentor.expertise?.join(', ')}</TableCell>
                <TableCell>${mentor.hourlyRate}/hr</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleApprove(mentor._id)}
                    sx={{ mr: 1 }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => setRejectDialog({ open: true, mentorId: mentor._id })}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pendingMentors.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No pending applications
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, mentorId: null })}>
        <DialogTitle>Reject Mentor Application</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for rejection"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, mentorId: null })}>
            Cancel
          </Button>
          <Button onClick={handleReject} color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 