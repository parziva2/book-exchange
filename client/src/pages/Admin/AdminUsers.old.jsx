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
  TablePagination,
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
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BlockIcon from '@mui/icons-material/Block';
import { useApi } from '../../hooks/useApi';
import { useSnackbar } from '../../contexts/SnackbarContext';

const AdminUsers = () => {
  const api = useApi();
  const { showSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      const response = await api.get('/admin/users');
      console.log('Full API Response:', response);
      console.log('Response Headers:', response.headers);
      console.log('Response Status:', response.status);
      console.log('Response Data:', response.data);
      
      if (!response.data || !response.data.data || !response.data.data.users) {
        throw new Error('Invalid response format');
      }
      
      const fetchedUsers = response.data.data.users;
      console.log('Processed Users:', fetchedUsers);
      
      if (!Array.isArray(fetchedUsers)) {
        throw new Error('Users data is not an array');
      }
      
      setUsers(fetchedUsers);
      setError(null);
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
      setUsers([]);
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

  const handleDeleteClick = (user) => {
    console.log('Delete clicked for user:', user);
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/admin/users/${userToDelete._id}`);
      showSnackbar('User deleted successfully', 'success');
      setUsers(users.filter(user => user._id !== userToDelete._id));
      setError(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleBlockClick = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}/toggle-block`);
      showSnackbar('User block status updated successfully', 'success');
      fetchUsers(); // Refresh the user list
    } catch (err) {
      console.error('Error toggling user block status:', err);
      setError(err.response?.data?.message || 'Failed to update user block status');
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
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(users || [])
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => {
                console.log('Rendering user in map:', user);
                return (
                  <TableRow key={user._id}>
                    <TableCell>{user.username || user.email.split('@')[0]}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`}</TableCell>
                    <TableCell>{(user.roles || []).join(', ')}</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleBlockClick(user)}
                        color="warning"
                        size="small"
                        title="Block User"
                        sx={{ marginRight: 1 }}
                      >
                        <BlockIcon />
                      </IconButton>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteClick(user)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers; 