import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import * as sessionApi from '../../utils/sessionApi';
import * as twilioUtils from '../../utils/twilio';
import ChatPanel from './ChatPanel';

const VideoSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  
  // Session state
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Video state
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // UI state
  const [chatOpen, setChatOpen] = useState(false);
  const [endSessionDialog, setEndSessionDialog] = useState(false);
  const [retryAvailable, setRetryAvailable] = useState(false);
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenTrackRef = useRef(null);

  useEffect(() => {
    fetchSessionDetails();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (session) {
      setupVideoSession();
      startSessionTimer();
    }
  }, [session]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionApi.getSession(sessionId);
      setSession(data);
    } catch (error) {
      console.error('Error fetching session details:', error);
      setError('Failed to load session details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupVideoSession = async () => {
    try {
      setError(null);
      setRetryAvailable(false);
      
      // Ensure thorough cleanup before starting new session
      await cleanup();
      
      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create local tracks first
      const tracks = await twilioUtils.createLocalTracks().catch(e => {
        if (e.name === 'NotAllowedError' || e.message.includes('Permission denied')) {
          throw new Error('Camera and microphone access denied. Please check your browser permissions and try again.');
        } else if (e.name === 'NotFoundError' || e.message.includes('Requested device not found')) {
          throw new Error('No camera or microphone found. Please check your device connections.');
        }
        throw e;
      });
      
      // Store tracks in state
      setLocalTracks(tracks);

      // Attach local video track if available
      const videoTrack = tracks.find(track => track.kind === 'video');
      if (videoTrack && localVideoRef.current) {
        const videoElement = videoTrack.attach();
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        
        // Clear previous content and append new video element
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          localVideoRef.current.appendChild(videoElement);
        }
      }

      // Join the room with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const twilioRoom = await twilioUtils.joinVideoRoom(sessionId);
          setRoom(twilioRoom);
          
          // Set up room event listeners
          twilioRoom.on('participantConnected', handleParticipantConnected);
          twilioRoom.on('participantDisconnected', handleParticipantDisconnected);
          twilioRoom.on('disconnected', async (room, error) => {
            console.log('Disconnected from room:', error);
            
            if (error?.code === 53205) {
              setError('Another session with your account is already active. Please close other sessions and try again.');
              setRetryAvailable(true);
              return;
            }
            
            // Only attempt reconnection for non-fatal errors
            if (!error || (error.code !== 53204 && error.code !== 53205)) {
              setError('Connection lost. Attempting to reconnect...');
              await cleanup();
              setTimeout(() => {
                setupVideoSession().catch(e => {
                  setError('Failed to reconnect. Please try joining again.');
                  setRetryAvailable(true);
                });
              }, 3000);
            }
          });

          // Handle existing participants
          twilioRoom.participants.forEach(handleParticipantConnected);
          
          // Clear any previous error state
          setError(null);
          break; // Successfully connected, exit retry loop
        } catch (error) {
          retryCount++;
          if (error.code === 53205 || retryCount === maxRetries) {
            throw error; // Don't retry for duplicate identity or if max retries reached
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retrying
        }
      }
    } catch (error) {
      console.error('Error setting up video session:', error);
      
      if (error.code === 53205 || error.message.includes('duplicate identity')) {
        setError('Another session with your account is already active. Please close other sessions and try again.');
      } else {
        setError(error.message || 'Failed to join video session. Please try again.');
      }
      
      setRetryAvailable(true);
      await cleanup();
    }
  };

  const handleParticipantConnected = (participant) => {
    console.log('Participant connected:', participant.identity);
    setParticipants(prevParticipants => [...prevParticipants, participant]);
    
    // Handle any tracks that are already subscribed
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        handleTrackSubscribed(publication.track, participant);
      }
    });

    // Set up event listeners for this participant
    participant.on('trackSubscribed', track => handleTrackSubscribed(track, participant));
    participant.on('trackUnsubscribed', handleTrackUnsubscribed);
  };

  const handleParticipantDisconnected = (participant) => {
    setParticipants(prevParticipants => 
      prevParticipants.filter(p => p !== participant)
    );
    participant.removeAllListeners();
  };

  const handleTrackSubscribed = (track, participant) => {
    console.log('Track subscribed:', track.kind, 'from participant:', participant.identity);
    
    if (track.kind === 'video') {
      try {
        // Create and style the video element
        const element = track.attach();
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.objectFit = 'cover';
        element.style.transform = 'scaleX(-1)'; // Mirror the video
        
        if (remoteVideoRef.current) {
          // Remove any existing video elements first
          const existingVideos = remoteVideoRef.current.getElementsByTagName('video');
          Array.from(existingVideos).forEach(video => video.remove());
          
          // Append the new video element
          remoteVideoRef.current.appendChild(element);
        }
      } catch (error) {
        console.error('Error attaching video track:', error);
      }
    } else if (track.kind === 'audio') {
      try {
        // Create and attach audio element
        const element = track.attach();
        element.style.display = 'none'; // Hide audio element
        document.body.appendChild(element);
      } catch (error) {
        console.error('Error attaching audio track:', error);
      }
    }
  };

  const handleTrackUnsubscribed = (track) => {
    console.log('Track unsubscribed:', track.kind);
    track.detach().forEach(element => {
      console.log('Removing track element');
      element.remove();
    });
  };

  const startSessionTimer = () => {
    const endTime = new Date(session.startTime).getTime() + session.duration * 60000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        handleSessionEnd();
      }
    }, 1000);
    return () => clearInterval(interval);
  };

  const toggleAudio = () => {
    localTracks
      .find(track => track.kind === 'audio')
      ?.enable(!isAudioEnabled);
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = () => {
    localTracks
      .find(track => track.kind === 'video')
      ?.enable(!isVideoEnabled);
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenTrack = await twilioUtils.createScreenTrack();
        screenTrackRef.current = screenTrack;
        room.localParticipant.publishTrack(screenTrack);
        setIsScreenSharing(true);
      } else if (screenTrackRef.current) {
        room.localParticipant.unpublishTrack(screenTrackRef.current);
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleSessionEnd = async () => {
    try {
      await sessionApi.endVideoSession(sessionId);
      
      // Send notifications
      const otherUser = user.id === session.mentor.id
        ? session.mentee.name
        : session.mentor.name;

      await sendNotification('session_ended', {
        title: 'Session Ended',
        message: `Your session with ${otherUser} has ended.`,
      });

      cleanup();
      navigate(`/session/${sessionId}/feedback`);
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session properly. Please try again.');
    }
  };

  const cleanup = async () => {
    try {
      // Clear video elements first
      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
      }

      // Stop and disconnect all local tracks
    if (localTracks.length > 0) {
        for (const track of localTracks) {
          try {
            // Detach from all elements
            const elements = track.detach();
            elements.forEach(element => element.remove());
            
            // Stop the track
            track.stop();
            
            // If we're in a room, unpublish the track
            if (room?.localParticipant) {
              const publications = room.localParticipant.tracks.values();
              for (const publication of publications) {
                if (publication.track === track) {
                  await publication.unpublish();
                }
              }
            }
          } catch (e) {
            console.error('Error cleaning up track:', e);
          }
        }
      setLocalTracks([]);
    }

    // Stop screen sharing if active
    if (screenTrackRef.current) {
        try {
      screenTrackRef.current.stop();
          const elements = screenTrackRef.current.detach();
          elements.forEach(element => element.remove());
        } catch (e) {
          console.error('Error cleaning up screen share:', e);
        }
      screenTrackRef.current = null;
    }

    // Disconnect from room
    if (room) {
        try {
      // Remove all event listeners
      room.removeAllListeners();
          
          // Cleanup remote participants
      room.participants.forEach(participant => {
        participant.tracks.forEach(publication => {
              try {
          if (publication.track) {
                  const elements = publication.track.detach();
                  elements.forEach(element => element.remove());
            publication.track.stop();
                }
              } catch (e) {
                console.error('Error cleaning up participant track:', e);
          }
        });
        participant.removeAllListeners();
      });

          // Cleanup local participant
      if (room.localParticipant) {
        room.localParticipant.tracks.forEach(publication => {
              try {
          if (publication.track) {
                  const elements = publication.track.detach();
                  elements.forEach(element => element.remove());
            publication.track.stop();
            publication.unpublish();
                }
              } catch (e) {
                console.error('Error cleaning up local participant track:', e);
          }
        });
      }

          // Disconnect the room
      room.disconnect();
        } catch (e) {
          console.error('Error disconnecting from room:', e);
        }
      setRoom(null);
    }

    // Reset all state
    setParticipants([]);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setIsScreenSharing(false);
    setChatOpen(false);
    setEndSessionDialog(false);
    
      // Wait a moment to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          gap: 2
        }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          {retryAvailable && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setRetryAvailable(false);
                setupVideoSession();
              }}
            >
              Retry Connection
            </Button>
          )}
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => navigate('/sessions')}
          >
            Back to Sessions
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Grid container spacing={2}>
          {/* Local Video */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                position: 'relative',
                height: '400px',
                overflow: 'hidden'
              }}
            >
              <Box 
                ref={localVideoRef} 
                sx={{ 
                  width: '100%',
                  height: '100%',
                  bgcolor: 'black'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 1,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  padding: 1,
                  borderRadius: 2
                }}
              >
                <IconButton 
                  onClick={toggleAudio}
                  color={isAudioEnabled ? 'primary' : 'error'}
                  data-testid="audio-toggle"
                >
                  {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
                <IconButton 
                  onClick={toggleVideo}
                  color={isVideoEnabled ? 'primary' : 'error'}
                  data-testid="video-toggle"
                >
                  {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
                <IconButton 
                  onClick={toggleScreenShare}
                  color={isScreenSharing ? 'primary' : 'inherit'}
                  data-testid="screen-share"
                >
                  {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>
              </Box>
            </Paper>
          </Grid>

          {/* Remote Video */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                position: 'relative',
                height: '400px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'black'
              }}
            >
              {participants.length === 0 ? (
                <Typography color="white">
                  Waiting for other participant to join...
                </Typography>
              ) : (
                <Box 
                  ref={remoteVideoRef} 
                  sx={{ 
                    width: '100%',
                    height: '100%'
                  }}
                />
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Session Controls */}
        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon />
            <Typography>
              Time Remaining: {formatTime(timeRemaining)}
            </Typography>
          </Box>
          <Box>
            <IconButton 
              onClick={() => setChatOpen(!chatOpen)}
              color={chatOpen ? 'primary' : 'inherit'}
            >
              <ChatIcon />
            </IconButton>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => setEndSessionDialog(true)}
              sx={{ ml: 2 }}
            >
              End Session
            </Button>
          </Box>
        </Box>

        {/* Chat Panel */}
        <Dialog
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Chat</DialogTitle>
          <DialogContent>
            <ChatPanel sessionId={sessionId} />
          </DialogContent>
        </Dialog>

        {/* End Session Dialog */}
        <Dialog
          open={endSessionDialog}
          onClose={() => setEndSessionDialog(false)}
        >
          <DialogTitle>End Session</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to end this session?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEndSessionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSessionEnd}
              color="error"
              variant="contained"
            >
              End Session
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default VideoSession; 