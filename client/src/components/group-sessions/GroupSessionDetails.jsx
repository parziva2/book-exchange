import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  VideoCall as VideoCallIcon
} from '@mui/icons-material';
import { useGroupSession } from '../../contexts/GroupSessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatTime, formatDuration } from '../../utils/dateUtils';

const GroupSessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentSession,
    loading,
    error,
    fetchGroupSession,
    joinGroupSession,
    leaveGroupSession,
    cancelGroupSession
  } = useGroupSession();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  useEffect(() => {
    fetchGroupSession(id);
  }, [fetchGroupSession, id]);

  const handleJoin = async () => {
    try {
      await joinGroupSession(id);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroupSession(id);
      setShowLeaveDialog(false);
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelGroupSession(id);
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel session:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/group-sessions/${id}/edit`);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading session details...</Typography>
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

  if (!currentSession) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Session not found</Typography>
      </Box>
    );
  }

  const isUserEnrolled = currentSession.participants.some(
    p => p.user._id === user?._id
  );
  const isMentor = currentSession.mentor._id === user?._id;
  const canJoin = !isUserEnrolled && !isMentor && currentSession.status === 'scheduled';
  const canLeave = isUserEnrolled && currentSession.status === 'scheduled';
  const canEdit = isMentor && currentSession.status === 'scheduled';
  const canCancel = isMentor && currentSession.status === 'scheduled';
  const showMeetingLink = (isUserEnrolled || isMentor) && 
    ['scheduled', 'in-progress'].includes(currentSession.status);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h4" gutterBottom>
                        {currentSession.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          src={currentSession.mentor.avatar}
                          alt={`${currentSession.mentor.firstName} ${currentSession.mentor.lastName}`}
                        />
                        <Box>
                          <Typography variant="subtitle1">
                            {currentSession.mentor.firstName} {currentSession.mentor.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Mentor
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Box>
                      <Chip
                        label={currentSession.status}
                        color={
                          currentSession.status === 'scheduled' ? 'primary' :
                          currentSession.status === 'in-progress' ? 'secondary' :
                          currentSession.status === 'completed' ? 'success' :
                          'error'
                        }
                      />
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Session Details
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EventIcon color="action" />
                      <Typography>
                        {formatDate(currentSession.startTime)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TimeIcon color="action" />
                      <Typography>
                        {formatTime(currentSession.startTime)} ({formatDuration(currentSession.duration)})
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon color="action" />
                      <Typography>
                        {currentSession.participants.length} / {currentSession.maxParticipants} participants
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MoneyIcon color="action" />
                      <Typography>${currentSession.price}</Typography>
                    </Stack>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Topics
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {currentSession.topics.map(topic => (
                      <Chip
                        key={topic}
                        label={topic}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {currentSession.description}
                  </Typography>
                </Box>

                {showMeetingLink && currentSession.meetingLink && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Meeting Link
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography
                          component="a"
                          href={currentSession.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'none' }}
                        >
                          {currentSession.meetingLink}
                        </Typography>
                        <Tooltip title="Join Meeting">
                          <IconButton
                            color="primary"
                            href={currentSession.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <VideoCallIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  {canJoin && (
                    <Button
                      variant="contained"
                      onClick={handleJoin}
                      disabled={currentSession.isFull}
                    >
                      {currentSession.isFull ? 'Session Full' : 'Join Session'}
                    </Button>
                  )}
                  {canLeave && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setShowLeaveDialog(true)}
                    >
                      Leave Session
                    </Button>
                  )}
                  {canEdit && (
                    <Tooltip title="Edit Session">
                      <IconButton onClick={handleEdit} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canCancel && (
                    <Tooltip title="Cancel Session">
                      <IconButton
                        onClick={() => setShowCancelDialog(true)}
                        color="error"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Participants ({currentSession.participants.length})
              </Typography>
              <List>
                {currentSession.participants.map(({ user: participant }) => (
                  <ListItem key={participant._id}>
                    <ListItemAvatar>
                      <Avatar
                        src={participant.avatar}
                        alt={`${participant.firstName} ${participant.lastName}`}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${participant.firstName} ${participant.lastName}`}
                    />
                  </ListItem>
                ))}
              </List>
              {currentSession.participants.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center">
                  No participants yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cancel Session Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Group Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this group session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>No, Keep Session</Button>
          <Button onClick={handleCancel} color="error" variant="contained">
            Yes, Cancel Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Session Dialog */}
      <Dialog open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)}>
        <DialogTitle>Leave Group Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to leave this group session?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaveDialog(false)}>No, Stay</Button>
          <Button onClick={handleLeave} color="error" variant="contained">
            Yes, Leave Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupSessionDetails; 