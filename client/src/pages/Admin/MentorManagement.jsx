import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import api from '../../utils/api';

const MentorManagement = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await api.get('/admin/mentors/pending');
      setMentors(response.data.data.mentors);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mentors');
      setLoading(false);
    }
  };

  const handleAction = (mentor, action) => {
    setSelectedMentor(mentor);
    setActionType(action);
    setDialogOpen(true);
    if (action === 'reject') {
      setRejectionReason('');
    }
  };

  const handleConfirm = async () => {
    try {
      if (actionType === 'approve') {
        await api.put(`/admin/mentors/${selectedMentor._id}/approve`);
      } else {
        await api.put(`/admin/mentors/${selectedMentor._id}/reject`, {
          reason: rejectionReason,
        });
      }
      
      // Refresh mentors list
      await fetchMentors();
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${actionType} mentor`);
    }
  };

  const handleViewDetails = (mentor) => {
    setSelectedMentor(mentor);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Mentor Applications
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mentors.map((mentor) => (
              <TableRow key={mentor._id}>
                <TableCell>{mentor.username}</TableCell>
                <TableCell>{`${mentor.firstName} ${mentor.lastName}`}</TableCell>
                <TableCell>{mentor.email}</TableCell>
                <TableCell>
                  <Chip
                    label={mentor.mentorStatus?.status || 'Pending'}
                    color={
                      mentor.mentorStatus?.status === 'approved'
                        ? 'success'
                        : mentor.mentorStatus?.status === 'pending'
                        ? 'warning'
                        : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    color="info"
                    onClick={() => handleViewDetails(mentor)}
                    title="View Details"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    color="success"
                    onClick={() => handleAction(mentor, 'approve')}
                    title="Approve Application"
                  >
                    <ApproveIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleAction(mentor, 'reject')}
                    title="Reject Application"
                  >
                    <RejectIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {actionType} {selectedMentor?.username}'s mentor application?
          </DialogContentText>
          {actionType === 'reject' && (
            <TextField
              autoFocus
              margin="dense"
              label="Rejection Reason"
              fullWidth
              multiline
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={actionType === 'reject' && !rejectionReason.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Mentor Application Details</DialogTitle>
        <DialogContent>
          {selectedMentor && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Typography>
                <strong>Name:</strong> {selectedMentor.firstName} {selectedMentor.lastName}
              </Typography>
              <Typography>
                <strong>Email:</strong> {selectedMentor.email}
              </Typography>
              <Typography>
                <strong>Username:</strong> {selectedMentor.username}
              </Typography>

              <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                Mentor Profile
              </Typography>
              <Typography>
                <strong>Bio:</strong> {selectedMentor.bio || 'Not provided'}
              </Typography>
              <Typography>
                <strong>Expertise:</strong>{' '}
                {selectedMentor.expertise?.join(', ') || 'Not provided'}
              </Typography>
              <Typography>
                <strong>Hourly Rate:</strong> ${selectedMentor.hourlyRate || 0}
              </Typography>

              {selectedMentor.mentorStatus?.status === 'rejected' && (
                <>
                  <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                    Rejection Details
                  </Typography>
                  <Typography>
                    <strong>Reason:</strong> {selectedMentor.mentorStatus.reason}
                  </Typography>
                  <Typography>
                    <strong>Rejected At:</strong>{' '}
                    {new Date(selectedMentor.mentorStatus.rejectedAt).toLocaleString()}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorManagement; 