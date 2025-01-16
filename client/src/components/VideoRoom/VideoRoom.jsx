import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Drawer,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge,
  Tooltip,
  Zoom
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  CallEnd as CallEndIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ScreenShare as ScreenShareIcon
} from '@mui/icons-material';
import { connect, createLocalTracks } from 'twilio-video';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../contexts/SocketContext';
import { useMessages } from '../../contexts/MessageContext';
import { formatDistanceToNow } from 'date-fns';

const VideoRoom = ({ sessionId, onSessionEnd }) => {
  const { user } = useAuth();
  const api = useApi();
  const { socket } = useSocket();
  const { sendMessage, getConversation } = useMessages();
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;
  const connectionTimeoutRef = useRef(null);
  const currentIdentityRef = useRef(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localTracks = useRef([]);
  const messagesEndRef = useRef(null);
  const mainContainerRef = useRef(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const connectionLock = useRef(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrack = useRef(null);

  const cleanup = async () => {
    console.log('Running cleanup...');
    stopScreenSharing();
    if (room) {
      room.disconnect();
    }
    if (localTracks.current) {
      localTracks.current.forEach(track => {
        track.stop();
        const elements = track.detach();
        elements.forEach(element => element.remove());
      });
      localTracks.current = [];
    }
    setRoom(null);
    setParticipants([]);
    setError(null);
    connectionLock.current = false;
  };

  // Initialize room on mount
  useEffect(() => {
    let mounted = true;
    console.log('Initializing room...');

    const initializeRoom = async () => {
      try {
        // First check if session is in valid state
        const response = await api.get(`/sessions/${sessionId}`);
        if (!mounted) return;

        // Handle both response formats
        const session = response?.data?.data || response?.data;
        if (!session) {
          throw new Error('Invalid session response format');
        }
        
        // Check session status and show appropriate message
        if (session.status === 'pending') {
          setError('This session is pending acceptance. Please wait for the mentor to accept it.');
          setLoading(false);
          return;
        } else if (session.status === 'cancelled') {
          setError('This session has been cancelled.');
          setLoading(false);
          return;
        } else if (session.status === 'completed') {
          setError('This session has already been completed.');
          setLoading(false);
          return;
        } else if (!['accepted', 'confirmed', 'in_progress'].includes(session.status)) {
          setError(`Invalid session status: ${session.status}`);
          setLoading(false);
          return;
        }

        // If session is in valid state, proceed with joining
        await joinRoom();
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Error initializing room:', err);
        if (err?.response?.status === 404) {
          setError('Session not found');
        } else if (err?.response?.status === 403) {
          setError('You do not have permission to access this session');
        } else {
          setError(err.message || 'Failed to initialize video session');
        }
        setLoading(false);
      }
    };

    initializeRoom();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [sessionId]);

  useEffect(() => {
    if (room && room.participants.size > 0) {
      const participant = Array.from(room.participants.values())[0];
      const participantId = participant.identity.split('-')[1]; // Extract user ID from identity
      
      // Load existing messages
      loadMessages(participantId);

      // Listen for new messages
      if (socket) {
        socket.on('newMessage', (message) => {
          setMessages(prev => [...prev, message]);
          if (!isChatOpen) {
            setUnreadMessages(prev => prev + 1);
          }
          // Scroll to bottom for new messages
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        });

        return () => socket.off('newMessage');
      }
    }
  }, [room, socket, isChatOpen]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      mainContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        const track = stream.getTracks()[0];
        
        screenTrack.current = new LocalVideoTrack(track, {
          name: 'screen'
        });

        // Publish screen track
        await room.localParticipant.publishTrack(screenTrack.current);
        
        // Handle screen share stop
        track.onended = () => {
          stopScreenSharing();
        };
        
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
        setError('Failed to share screen: ' + error.message);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = async () => {
    if (screenTrack.current) {
      await room.localParticipant.unpublishTrack(screenTrack.current);
      screenTrack.current.stop();
      screenTrack.current = null;
      setIsScreenSharing(false);
    }
  };

  const attachLocalTrack = (track) => {
    if (track.kind === 'video' && localVideoRef.current) {
      const element = track.attach();
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.objectFit = 'cover';
      element.style.transform = 'scaleX(-1)';
      element.setAttribute('playsinline', 'true');
      element.setAttribute('autoplay', 'true');
      element.setAttribute('muted', 'true');

      // Clear existing content
      while (localVideoRef.current.firstChild) {
        localVideoRef.current.firstChild.remove();
      }
      localVideoRef.current.appendChild(element);

      // Ensure video plays
      element.play().catch(error => {
        console.warn('Error auto-playing video:', error);
        // Video will play when user interacts
      });
    }
  };

  const getSessionToken = async () => {
    try {
      console.log('Fetching session token for session:', sessionId);
      const tokenResponse = await api.post(`/api/sessions/${sessionId}/token`);
      
      console.log('Token response received:', tokenResponse);
      
      // Handle both response formats
      const token = tokenResponse?.data?.data?.token || tokenResponse?.data?.token;
      if (!token) {
        console.error('Invalid token response structure:', tokenResponse?.data);
        throw new Error('Failed to get room access token');
      }
      
      console.log('Successfully received session token');
      setSessionToken(token);
      return token;
    } catch (error) {
      console.error('Error getting session token:', error);
      if (error?.response?.status === 400) {
        setError('Invalid session ID. Please check the URL and try again.');
      } else if (error?.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (error?.response?.status === 403) {
        const message = error?.response?.data?.message;
        if (message === 'Session must be accepted to join video chat') {
          setError('This session has not been accepted yet. Please wait for acceptance before joining.');
        } else {
          setError('You do not have permission to join this session.');
        }
      } else if (error?.response?.status === 404) {
        setError('Session not found. Please check the session ID.');
      } else if (error?.response?.status === 503) {
        setError('Video chat is not configured on the server. Please contact support.');
      } else {
        setError('Failed to get room access token. Please try again.');
      }
      throw error;
    }
  };

  const generateUniqueIdentity = () => {
    // Create a stable identity that includes a timestamp to prevent duplicates
    const timestamp = Date.now();
    return `${user.role || 'user'}-${user._id}-${sessionId}-${timestamp}`;
  };

  const joinRoom = async () => {
    if (connectionLock.current) {
      console.log('Connection already in progress, skipping...');
      return;
    }

    try {
      connectionLock.current = true;
      setIsConnecting(true);
      setError(null);

      // Add delay before reconnection attempt
      if (connectionAttempts > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Get session token first
      const tokenResponse = await api.get(`/sessions/${sessionId}/token`);
      const token = tokenResponse?.data?.token;
      if (!token) {
        throw new Error('Failed to get session token');
      }

      // Request media permissions
      const tracks = await createLocalTracks({
        audio: true,
        video: { 
          width: 640,
          height: 480,
          frameRate: 24
        }
      });

      // Store tracks and attach local video immediately
      localTracks.current = tracks;
      const videoTrack = tracks.find(track => track.kind === 'video');
      if (videoTrack) {
        attachLocalTrack(videoTrack);
      }

      // Create room name and identity
      const roomName = `session-${sessionId}`;
      const identity = generateUniqueIdentity();
      console.log('Joining room with identity:', identity);
      currentIdentityRef.current = identity;

      // Connect to room
      const twilioRoom = await connect(token, {
        name: roomName,
        tracks: localTracks.current,
        maxAudioBitrate: 16000,
        preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
        automaticSubscription: true,
        identity: identity,
        dominantSpeaker: true,
        maxVideoBitrate: 2500000,
        networkQuality: {
          local: 1,
          remote: 1
        },
        bandwidthProfile: {
          video: {
            mode: 'collaboration',
            maxSubscriptionBitrate: 2500000,
            dominantSpeakerPriority: 'high',
            contentPreferencesMode: 'auto'
          }
        }
      });

      // Reset connection attempts on successful connection
      setConnectionAttempts(0);
      
      // Set up room event listeners
      twilioRoom.on('participantConnected', handleParticipantConnected);
      twilioRoom.on('participantDisconnected', handleParticipantDisconnected);
      twilioRoom.on('disconnected', handleRoomDisconnected);
      twilioRoom.on('dominantSpeakerChanged', handleDominantSpeakerChanged);

      // Connect to existing participants
      twilioRoom.participants.forEach(handleParticipantConnected);

      // Mark session as joined
      await api.post(`/sessions/${sessionId}/join`);

      setRoom(twilioRoom);
      setLoading(false);
      setIsConnecting(false);

    } catch (error) {
      console.error('Error joining room:', error);
      setIsConnecting(false);
      
      if (error.name === 'NotAllowedError') {
        setError('Please allow camera and microphone access to join the session.');
      } else if (error.code === 53205) {
        // Handle duplicate identity error
        const newAttempts = connectionAttempts + 1;
        setConnectionAttempts(newAttempts);
        
        if (newAttempts < maxConnectionAttempts) {
          console.log(`Retrying connection (attempt ${newAttempts}/${maxConnectionAttempts})...`);
          await cleanup();
          // Schedule retry
          connectionTimeoutRef.current = setTimeout(() => {
            joinRoom();
          }, 2000);
          return;
        } else {
          setError('Unable to join room after multiple attempts. Please try refreshing the page.');
        }
      } else {
        setError(error.message || 'Failed to join video session');
      }
      
      throw error;
    } finally {
      connectionLock.current = false;
    }
  };

  const handleParticipantConnected = (participant) => {
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        handleTrackSubscribed(publication.track);
      }
    });

    participant.on('trackSubscribed', handleTrackSubscribed);
  };

  const handleParticipantDisconnected = (participant) => {
    participant.removeAllListeners();
    const elements = document.querySelectorAll(`[data-participant-id="${participant.sid}"]`);
    elements.forEach(element => element.remove());
  };

  const handleRoomDisconnected = (room, error) => {
    console.log('Room disconnected:', error ? `due to error: ${error}` : 'normally');
    stopScreenSharing();
    room.localParticipant.tracks.forEach(publication => {
      if (publication.track) {
        publication.track.stop();
        const attachedElements = publication.track.detach();
        attachedElements.forEach(element => element.remove());
      }
    });
    setRoom(null);
    setParticipants([]);
    if (error) {
      setError('Disconnected from room: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDominantSpeakerChanged = (participant) => {
    console.log('Dominant speaker changed:', participant ? participant.identity : 'No dominant speaker');
    if (participant) {
      // Move the dominant speaker's video to a more prominent position
      const participantElements = document.querySelectorAll(`[data-participant-id="${participant.sid}"]`);
      participantElements.forEach(element => {
        element.style.border = '2px solid #1a73e8';
        element.style.transform = 'scale(1.05)';
        element.style.zIndex = '2';
      });

      // Reset styles for other participants
      const otherElements = document.querySelectorAll(`[data-participant-id]:not([data-participant-id="${participant.sid}"])`);
      otherElements.forEach(element => {
        element.style.border = 'none';
        element.style.transform = 'none';
        element.style.zIndex = '1';
      });
    }
  };

  const handleTrackSubscribed = (track) => {
    if (track.kind === 'video') {
      const element = track.attach();
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.objectFit = 'cover';
      element.setAttribute('playsinline', 'true');
      element.setAttribute('autoplay', 'true');

      if (remoteVideoRef.current) {
        // Clear existing content
        while (remoteVideoRef.current.firstChild) {
          remoteVideoRef.current.firstChild.remove();
        }
        remoteVideoRef.current.appendChild(element);
      }
    } else if (track.kind === 'audio') {
      const element = track.attach();
      element.setAttribute('autoplay', 'true');
      document.body.appendChild(element);
    }
  };

  const toggleAudio = () => {
    if (localTracks.current[1]) {
      const audioTrack = localTracks.current[1];
      if (isAudioEnabled) {
        audioTrack.disable();
      } else {
        audioTrack.enable();
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localTracks.current[0]) {
      const videoTrack = localTracks.current[0];
      if (isVideoEnabled) {
        videoTrack.disable();
      } else {
        videoTrack.enable();
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleEndSession = async () => {
    try {
      await api.post(`/sessions/${sessionId}/end`);
      localTracks.current.forEach(track => track.stop());
      room?.disconnect();
      
      if (onSessionEnd) {
        onSessionEnd();
      }
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
    }
  };

  const loadMessages = async () => {
    try {
      // Get the session data
      const sessionResponse = await api.get(`/sessions/${sessionId}`);
      const session = sessionResponse?.data;
      
      if (!session) {
        console.error('Session response is empty');
        return;
      }

      // Determine the other user's ID based on current user's role
      const otherUserId = user._id === session.mentee 
        ? session.mentor
        : session.mentee;

      console.log('Loading messages for conversation with:', otherUserId);
      const conversationMessages = await getConversation(otherUserId);
      
      if (conversationMessages) {
        setMessages(conversationMessages);
        // Scroll to bottom after loading messages
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    try {
      // Get the session data
      const sessionResponse = await api.get(`/sessions/${sessionId}`);
      const session = sessionResponse?.data;
      
      if (!session) {
        setError('Session data not found');
        return;
      }

      // Determine the recipient ID based on current user's role
      const recipientId = user._id === session.mentee 
        ? session.mentor
        : session.mentee;

      console.log('Sending message to recipient:', recipientId);
      
      // Include all required fields in the message object
      const messageData = {
        recipientId,
        content: newMessage.trim(),
        sessionId: sessionId,
        senderId: user._id
      };
      
      const sentMessage = await sendMessage(recipientId, newMessage.trim(), messageData);
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        // Scroll to bottom after sending
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        setError('Failed to send message - no response from server');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleChatOpen = () => {
    setIsChatOpen(true);
    setUnreadMessages(0);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  // Local Video Container
  const LocalVideoContainer = () => (
    <Zoom in={true}>
      <Paper 
        elevation={3}
        sx={{ 
          position: 'absolute',
          bottom: 16,
          right: 16,
          width: '280px',
          height: '158px',
          bgcolor: 'black',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: 3,
          transition: 'all 0.3s ease',
          zIndex: 1000,
          '&:hover': {
            transform: 'scale(1.05)'
          }
        }}
      >
        <Box
          ref={localVideoRef}
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& video': {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              position: 'relative',
              zIndex: 1
            }
          }}
        >
          {!isVideoEnabled && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              zIndex: 2
            }}>
              <VideocamOffIcon sx={{ fontSize: 40 }} />
            </Box>
          )}
        </Box>
      </Paper>
    </Zoom>
  );

  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  // Listen for new messages
  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        setMessages(prev => [...prev, message]);
        if (!isChatOpen) {
          setUnreadMessages(prev => prev + 1);
        }
        // Scroll to bottom for new messages
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      });

      return () => socket.off('newMessage');
    }
  }, [socket, isChatOpen]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={joinRoom} 
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      ref={mainContainerRef}
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Main content area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Video container with controls */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex',
          position: 'relative',
          bgcolor: 'black',
          overflow: 'hidden'
        }}>
          {/* Remote video */}
          <Box
            ref={remoteVideoRef}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: '120px',
              '& video': {
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }
            }}
          />
          {/* Local video */}
          <Box
            ref={localVideoRef}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              width: '200px',
              height: '150px',
              borderRadius: 2,
              overflow: 'hidden',
              zIndex: 2,
              bgcolor: 'black',
              boxShadow: 3,
              '& video': {
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }
            }}
          />

          {/* Control bar */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 3,
            paddingBottom: 5,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            minHeight: '120px',
            zIndex: 3,
            '& .MuiIconButton-root': {
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'background.default'
              }
            }
          }}>
            <IconButton onClick={toggleAudio} color={isAudioEnabled ? 'primary' : 'error'} sx={{ bgcolor: 'background.paper' }}>
              {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            <IconButton onClick={toggleVideo} color={isVideoEnabled ? 'primary' : 'error'} sx={{ bgcolor: 'background.paper' }}>
              {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton 
              onClick={toggleScreenShare} 
              color={isScreenSharing ? 'primary' : 'inherit'}
              sx={{ bgcolor: 'background.paper' }}
            >
              <ScreenShareIcon />
            </IconButton>
            <IconButton onClick={toggleFullScreen} color="inherit" sx={{ bgcolor: 'background.paper' }}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
            <Button
              variant="contained"
              color="error"
              startIcon={<CallEndIcon />}
              onClick={handleEndSession}
              sx={{ minWidth: 120 }}
            >
              End Session
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Chat panel */}
      <Box sx={{
        width: 300,
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Chat header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          flexShrink: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Chat</Typography>
        </Box>
        
        {/* Messages container */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          marginBottom: '64px'
        }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                alignSelf: message.senderId === user._id ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                bgcolor: message.senderId === user._id ? 'primary.main' : 'grey.200',
                color: message.senderId === user._id ? 'white' : 'text.primary',
                borderRadius: 2,
                p: 1.5,
                mb: 0.5
              }}
            >
              <Typography variant="body2">{message.content}</Typography>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message input */}
        <Box sx={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 100%)',
          zIndex: 10,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          p: 2,
          transform: 'translateY(-32px)'
        }}>
          <TextField
            fullWidth
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSendMessage} size="small" color="primary">
                  <SendIcon />
                </IconButton>
              )
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'background.paper'
              }
            }}
          />
        </Box>
      </Box>

      {/* Loading and error overlays */}
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10
        }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Box sx={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
    </Box>
  );
};

export default VideoRoom; 