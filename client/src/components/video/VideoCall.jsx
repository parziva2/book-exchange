import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Grid,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  CallEnd as CallEndIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { useVideo } from '../../contexts/VideoContext';

const ParticipantVideo = ({ participant, isLocal = false }) => {
  const [videoTrack, setVideoTrack] = useState(null);
  const [audioTrack, setAudioTrack] = useState(null);
  const videoRef = useRef();
  const audioRef = useRef();

  const trackSubscribed = (track) => {
    if (track.kind === 'video') {
      setVideoTrack(track);
    } else if (track.kind === 'audio') {
      setAudioTrack(track);
    }
  };

  const trackUnsubscribed = (track) => {
    if (track.kind === 'video') {
      setVideoTrack(null);
    } else if (track.kind === 'audio') {
      setAudioTrack(null);
    }
  };

  useEffect(() => {
    if (isLocal) {
      const videoTrack = participant.find(track => track.kind === 'video');
      const audioTrack = participant.find(track => track.kind === 'audio');
      setVideoTrack(videoTrack);
      setAudioTrack(audioTrack);
    } else {
      participant.tracks.forEach(publication => {
        if (publication.track) {
          trackSubscribed(publication.track);
        }
      });

      participant.on('trackSubscribed', trackSubscribed);
      participant.on('trackUnsubscribed', trackUnsubscribed);

      return () => {
        participant.off('trackSubscribed', trackSubscribed);
        participant.off('trackUnsubscribed', trackUnsubscribed);
      };
    }
  }, [participant]);

  useEffect(() => {
    if (videoTrack) {
      videoTrack.attach(videoRef.current);
      return () => {
        videoTrack.detach();
      };
    }
  }, [videoTrack]);

  useEffect(() => {
    if (audioTrack) {
      audioTrack.attach(audioRef.current);
      return () => {
        audioTrack.detach();
      };
    }
  }, [audioTrack]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: 'black',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isLocal ? 'scaleX(-1)' : 'none',
        }}
      />
      <audio ref={audioRef} autoPlay />
      <Typography
        variant="subtitle2"
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          color: 'white',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          px: 1,
          py: 0.5,
          borderRadius: 1,
        }}
      >
        {isLocal ? 'You' : participant.identity}
      </Typography>
    </Box>
  );
};

const PreCallSetup = ({ onJoin, onCancel }) => {
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');
  const [devices, setDevices] = useState({ audioInputs: [], videoInputs: [] });
  const [isTestingDevices, setIsTestingDevices] = useState(false);
  const videoPreviewRef = useRef();

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          audioInputs: devices.filter(device => device.kind === 'audioinput'),
          videoInputs: devices.filter(device => device.kind === 'videoinput'),
        });
        
        // Set defaults
        const defaultAudio = devices.find(device => device.kind === 'audioinput');
        const defaultVideo = devices.find(device => device.kind === 'videoinput');
        if (defaultAudio) setSelectedAudioInput(defaultAudio.deviceId);
        if (defaultVideo) setSelectedVideoInput(defaultVideo.deviceId);
      } catch (error) {
        console.error('Error getting devices:', error);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    let stream;

    const startDeviceTest = async () => {
      try {
        if (isTestingDevices) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: selectedAudioInput ? { deviceId: selectedAudioInput } : true,
            video: selectedVideoInput ? { deviceId: selectedVideoInput } : true,
          });
          
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        }
      } catch (error) {
        console.error('Error testing devices:', error);
      }
    };

    startDeviceTest();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isTestingDevices, selectedAudioInput, selectedVideoInput]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Test Your Devices
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Microphone</InputLabel>
            <Select
              value={selectedAudioInput}
              onChange={(e) => setSelectedAudioInput(e.target.value)}
              label="Microphone"
            >
              {devices.audioInputs.map((device) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Camera</InputLabel>
            <Select
              value={selectedVideoInput}
              onChange={(e) => setSelectedVideoInput(e.target.value)}
              label="Camera"
            >
              {devices.videoInputs.map((device) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              width: '100%',
              height: 300,
              bgcolor: 'black',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
            {!isTestingDevices && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => setIsTestingDevices(true)}
                >
                  Start Device Test
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onJoin({ audioDeviceId: selectedAudioInput, videoDeviceId: selectedVideoInput })}
        >
          Join Call
        </Button>
      </Box>
    </Box>
  );
};

const VideoCall = ({ sessionId, onClose }) => {
  const {
    room,
    localTracks,
    participants,
    isConnecting,
    error,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
  } = useVideo();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showPreCallSetup, setShowPreCallSetup] = useState(true);
  const containerRef = useRef();

  useEffect(() => {
    // Don't join immediately, wait for pre-call setup
    return () => {
      leaveRoom();
    };
  }, [sessionId]);

  const handleJoinCall = async (devicePreferences) => {
    setShowPreCallSetup(false);
    await joinRoom(sessionId, devicePreferences);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenTrack = await navigator.mediaDevices.getDisplayMedia();
        room.localParticipant.publishTrack(screenTrack.getVideoTracks()[0]);
        setIsScreenSharing(true);
      } else {
        room.localParticipant.unpublishTrack('screen');
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const handleEndCall = () => {
    leaveRoom();
    onClose();
  };

  if (showPreCallSetup) {
    return (
      <Dialog open fullWidth maxWidth="md">
        <DialogContent>
          <PreCallSetup
            onJoin={handleJoinCall}
            onCancel={() => {
              onClose();
              setShowPreCallSetup(false);
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (isConnecting) {
    return (
      <Dialog open fullWidth maxWidth="md">
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open fullWidth maxWidth="md">
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      fullScreen
      PaperProps={{
        ref: containerRef,
        sx: { bgcolor: 'background.default' },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Video Grid */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Grid
            container
            spacing={2}
            sx={{ height: '100%' }}
          >
            {/* Local Video */}
            <Grid
              item
              xs={participants.length > 0 ? 6 : 12}
              sx={{ height: participants.length > 0 ? '50%' : '100%' }}
            >
              <ParticipantVideo participant={localTracks} isLocal />
            </Grid>

            {/* Remote Videos */}
            {participants.map(participant => (
              <Grid
                key={participant.sid}
                item
                xs={participants.length === 1 ? 6 : 12}
                sx={{ height: '50%' }}
              >
                <ParticipantVideo participant={participant} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Controls */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <IconButton
            onClick={toggleAudio}
            color={isAudioEnabled() ? 'primary' : 'error'}
          >
            {isAudioEnabled() ? <MicIcon /> : <MicOffIcon />}
          </IconButton>

          <IconButton
            onClick={toggleVideo}
            color={isVideoEnabled() ? 'primary' : 'error'}
          >
            {isVideoEnabled() ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>

          <IconButton
            onClick={handleScreenShare}
            color={isScreenSharing ? 'primary' : 'default'}
          >
            {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>

          <IconButton onClick={handleToggleFullscreen}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>

          <IconButton
            onClick={handleEndCall}
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': { bgcolor: 'error.dark' },
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Paper>
      </Box>
    </Dialog>
  );
};

export default VideoCall; 