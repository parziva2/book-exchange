import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material';
import api from '../../utils/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Paper
    sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      bgcolor: `${color}.light`,
      color: `${color}.dark`,
    }}
  >
    <Box display="flex" alignItems="center" mb={2}>
      <Icon sx={{ fontSize: 40, mr: 2, color: `${color}.main` }} />
      <Typography variant="h5" component="div">
        {value}
      </Typography>
    </Box>
    <Typography variant="subtitle1" color="text.secondary">
      {title}
    </Typography>
  </Paper>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard/stats');
        setStats(response.data.data.stats);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
        Admin Dashboard
      </Typography>

      {/* Quick Actions */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              component={Link}
              to="/admin/users"
              variant="contained"
              color="primary"
              startIcon={<PeopleIcon />}
            >
              Manage Users
            </Button>
          </Grid>
          <Grid item>
            <Button
              component={Link}
              to="/admin/mentors"
              variant="contained"
              color="secondary"
              startIcon={<SchoolIcon />}
            >
              Manage Mentors
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Statistics */}
      <Typography variant="h6" gutterBottom>
        Statistics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={PeopleIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Mentors"
            value={stats.totalMentors}
            icon={SchoolIcon}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Applications"
            value={stats.pendingMentors}
            icon={PendingIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Approved Mentors"
            value={stats.approvedMentors}
            icon={ApprovedIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Rejected Applications"
            value={stats.rejectedMentors}
            icon={RejectedIcon}
            color="error"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 