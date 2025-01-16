import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Event as EventIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useGroupSession } from '../../contexts/GroupSessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatTime, formatDuration } from '../../utils/dateUtils';

const skillLevels = ['beginner', 'intermediate', 'advanced'];

const GroupSessionList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    groupSessions,
    loading,
    error,
    fetchGroupSessions
  } = useGroupSession();

  const [filters, setFilters] = useState({
    search: '',
    skillLevel: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchGroupSessions(filters);
  }, [fetchGroupSessions, filters]);

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const handleViewSession = (sessionId) => {
    navigate(`/group-sessions/${sessionId}`);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading group sessions...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            placeholder="Search sessions..."
            value={filters.search}
            onChange={handleFilterChange('search')}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1 }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <Tooltip title="Toggle filters">
            <IconButton onClick={toggleFilters}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          {user?.role === 'mentor' && (
            <Button
              variant="contained"
              onClick={() => navigate('/group-sessions/create')}
            >
              Create Session
            </Button>
          )}
        </Stack>

        {showFilters && (
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              label="Skill Level"
              value={filters.skillLevel}
              onChange={handleFilterChange('skillLevel')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Levels</MenuItem>
              {skillLevels.map(level => (
                <MenuItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={filters.status}
              onChange={handleFilterChange('status')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <TextField
              type="date"
              label="Start Date"
              value={filters.startDate}
              onChange={handleFilterChange('startDate')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="End Date"
              value={filters.endDate}
              onChange={handleFilterChange('endDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        )}
      </Box>

      <Grid container spacing={3}>
        {groupSessions.map(session => (
          <Grid item xs={12} sm={6} md={4} key={session._id}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {session.title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={session.mentor.avatar}
                        alt={`${session.mentor.firstName} ${session.mentor.lastName}`}
                        sx={{ width: 24, height: 24 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {session.mentor.firstName} {session.mentor.lastName}
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {session.topics.map(topic => (
                      <Chip
                        key={topic}
                        label={topic}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>

                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatDate(session.startTime)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatTime(session.startTime)} ({formatDuration(session.duration)})
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {session.participants.length} / {session.maxParticipants} participants
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MoneyIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        ${session.price}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Box>
                    <Chip
                      label={session.status}
                      color={
                        session.status === 'scheduled' ? 'primary' :
                        session.status === 'in-progress' ? 'secondary' :
                        session.status === 'completed' ? 'success' :
                        'error'
                      }
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleViewSession(session._id)}
                    >
                      View Details
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {groupSessions.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No group sessions found
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GroupSessionList; 