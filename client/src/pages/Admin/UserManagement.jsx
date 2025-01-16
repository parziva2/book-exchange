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
  DialogActions,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      const sortedUsers = response.data.data.users.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setUsers(sortedUsers);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const handleAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    try {
      if (actionType === 'block') {
        await api.put(`/admin/users/${selectedUser._id}/block`);
      } else if (actionType === 'unblock') {
        await api.put(`/admin/users/${selectedUser._id}/unblock`);
      } else if (actionType === 'delete') {
        await api.delete(`/admin/users/${selectedUser._id}`);
      }
      
      // Refresh users list
      await fetchUsers();
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${actionType} user`);
    }
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
        User Management
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.roles.join(', ')}</TableCell>
                <TableCell>
                  <Typography
                    color={user.blocked ? 'error' : 'success'}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    {user.blocked ? 'Blocked' : 'Active'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {user.blocked ? (
                      <IconButton
                        color="success"
                        onClick={() => handleAction(user, 'unblock')}
                        title="Unblock User"
                      >
                        <UnblockIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        color="warning"
                        onClick={() => handleAction(user, 'block')}
                        title="Block User"
                      >
                        <BlockIcon />
                      </IconButton>
                    )}
                    <Button
                      onClick={() => handleAction(user, 'delete')}
                      color="error"
                      variant="contained"
                      size="small"
                      startIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'block' ? 'Block User' : actionType === 'unblock' ? 'Unblock User' : 'Delete User'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionType}{' '}
            {selectedUser?.username}?
            {actionType === 'delete' && ' This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            color={actionType === 'block' ? 'warning' : actionType === 'unblock' ? 'success' : 'error'}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 