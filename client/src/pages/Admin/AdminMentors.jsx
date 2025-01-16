import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tab,
  Rating,
  DialogContentText
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Visibility as ViewIcon, Check as ApproveIcon, Close as RejectIcon, Block as BlockIcon, Cancel as CancelIcon } from '@mui/icons-material';
import api from '../../utils/api';
import { useSnackbar } from 'notistack';

const AdminMentors = () => {
  const [mentors, setMentors] = useState({ pending: [], active: [], approved: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rejectDialog, setRejectDialog] = useState({ open: false, mentorId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [tabValue, setTabValue] = useState('1');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [revokeDialog, setRevokeDialog] = useState({ open: false, mentorId: null });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const [pendingRes, activeRes, approvedRes] = await Promise.all([
        api.get('/admin/mentors/pending'),
        api.get('/admin/mentors/active'),
        api.get('/admin/mentors/approved')
      ]);
      console.log('Pending mentors response:', pendingRes.data);
      console.log('Active mentors response:', activeRes.data);
      console.log('Approved mentors response:', approvedRes.data);
      setMentors({
        pending: pendingRes.data.data.mentors || [],
        active: activeRes.data.data.mentors || [],
        approved: approvedRes.data.data.mentors || []
      });
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError(err.response?.data?.message || 'Failed to fetch mentor applications');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApprove = async (mentorId) => {
    try {
      await api.put(`/admin/mentors/${mentorId}/approve`);
      fetchMentors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve mentor');
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/admin/mentors/${rejectDialog.mentorId}/reject`, {
        reason: rejectReason
      });
      setRejectDialog({ open: false, mentorId: null });
      setRejectReason('');
      fetchMentors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject mentor');
    }
  };

  const handleBlock = async (mentorId, isBlocked) => {
    try {
      await api.put(`/admin/mentors/${mentorId}/toggle-block`);
      fetchMentors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update mentor status');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleRevokeMentor = async () => {
    try {
      await api.post(`/admin/mentors/${revokeDialog.mentorId}/revoke`);
      setRevokeDialog({ open: false, mentorId: null });
      fetchMentors();
      enqueueSnackbar('Mentor status revoked successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error revoking mentor status:', error);
      enqueueSnackbar('Failed to revoke mentor status', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mentor Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label="mentor management tabs">
            <Tab label="Pending Applications" value="1" />
            <Tab label="Active Mentors" value="2" />
            <Tab label="Approved Mentors" value="3" />
          </TabList>
        </Box>
        
        <TabPanel value="1">
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
                {mentors.pending
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((mentor) => (
                    <TableRow key={mentor._id}>
                      <TableCell>{mentor.username || 'N/A'}</TableCell>
                      <TableCell>{`${mentor.firstName || ''} ${mentor.lastName || ''}`}</TableCell>
                      <TableCell>{mentor.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={mentor.mentorProfile?.status || 'Pending'}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="info"
                          title="View Details"
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          color="success"
                          title="Approve Application"
                          size="small"
                          onClick={() => handleApprove(mentor._id)}
                        >
                          <ApproveIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          title="Reject Application"
                          size="small"
                          onClick={() => setRejectDialog({ open: true, mentorId: mentor._id })}
                        >
                          <RejectIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {mentors.pending.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No pending mentor applications
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value="2">
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
                {mentors.active
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((mentor) => (
                    <TableRow key={mentor._id}>
                      <TableCell>{mentor.username || 'N/A'}</TableCell>
                      <TableCell>{`${mentor.firstName || ''} ${mentor.lastName || ''}`}</TableCell>
                      <TableCell>{mentor.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={mentor.blocked ? 'Blocked' : 'Active'}
                          color={mentor.blocked ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="info"
                          title="View Details"
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          color={mentor.blocked ? 'success' : 'error'}
                          title={mentor.blocked ? 'Unblock Mentor' : 'Block Mentor'}
                          size="small"
                          onClick={() => handleBlock(mentor._id, mentor.blocked)}
                        >
                          <BlockIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {mentors.active.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No active mentors
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value="3">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mentors.approved
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((mentor) => (
                    <TableRow key={mentor._id}>
                      <TableCell>{mentor.username || 'N/A'}</TableCell>
                      <TableCell>{`${mentor.firstName || ''} ${mentor.lastName || ''}`}</TableCell>
                      <TableCell>{mentor.email}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating value={mentor.mentorProfile?.rating || 0} readOnly size="small" />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({mentor.mentorProfile?.reviewCount || 0})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{mentor.mentorProfile?.studentCount || 0}</TableCell>
                      <TableCell>
                        <IconButton
                          color="info"
                          title="View Details"
                          size="small"
                          onClick={() => handleViewDetails(mentor)}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          title="Revoke Mentor Status"
                          size="small"
                          onClick={() => setRevokeDialog({ open: true, mentorId: mentor._id })}
                        >
                          <CancelIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </TabContext>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, mentorId: null })}
      >
        <DialogTitle>Reject Mentor Application</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Reason for Rejection"
              multiline
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this application"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, mentorId: null })}>
            Cancel
          </Button>
          <Button onClick={handleReject} variant="contained" color="error">
            Reject Application
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={revokeDialog.open}
        onClose={() => setRevokeDialog({ open: false, mentorId: null })}
      >
        <DialogTitle>Revoke Mentor Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to revoke this user's mentor status? This action cannot be undone.
            The user will no longer be able to mentor students and will be removed from search results.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialog({ open: false, mentorId: null })}>Cancel</Button>
          <Button onClick={handleRevokeMentor} color="error" variant="contained">
            Revoke Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminMentors; 