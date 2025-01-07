import React, { createContext, useContext, useState, useEffect } from 'react';
import { connect, createLocalTracks } from 'twilio-video';
import { useAuth } from './AuthContext';

const VideoContext = createContext(null);

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      localTracks.forEach(track => track.stop());
      if (room) {
        room.disconnect();
      }
    };
  }, []);

  // Handle participant connections
  useEffect(() => {
    if (!room) return;

    const participantConnected = participant => {
      setParticipants(prevParticipants => [...prevParticipants, participant]);
    };

    const participantDisconnected = participant => {
      setParticipants(prevParticipants =>
        prevParticipants.filter(p => p !== participant)
      );
    };

    room.on('participantConnected', participantConnected);
    room.on('participantDisconnected', participantDisconnected);
    room.participants.forEach(participantConnected);

    return () => {
      room.off('participantConnected', participantConnected);
      room.off('participantDisconnected', participantDisconnected);
    };
  }, [room]);

  // Initialize local tracks with device preferences
  const initializeTracks = async (devicePreferences = {}) => {
    try {
      const tracks = await createLocalTracks({
        audio: devicePreferences.audioDeviceId
          ? { deviceId: devicePreferences.audioDeviceId }
          : true,
        video: devicePreferences.videoDeviceId
          ? { 
              deviceId: devicePreferences.videoDeviceId,
              width: 640,
              height: 480,
            }
          : { width: 640, height: 480 }
      });
      setLocalTracks(tracks);
      return tracks;
    } catch (error) {
      setError('Failed to access camera and microphone');
      throw error;
    }
  };

  // Join a video room
  const joinRoom = async (sessionId, devicePreferences = {}) => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get Twilio token from backend
      const response = await fetch('/api/video/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const { token } = await response.json();

      // Initialize tracks with device preferences
      const tracks = localTracks.length > 0 
        ? localTracks 
        : await initializeTracks(devicePreferences);

      // Connect to the room
      const room = await connect(token, {
        name: sessionId,
        tracks,
        dominantSpeaker: true,
        preferredAudioCodecs: ['opus'],
        preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
        networkQuality: { local: 1, remote: 1 },
      });

      setRoom(room);
      setActiveSession(sessionId);
      setIsConnecting(false);

      return room;
    } catch (error) {
      setError('Failed to join video call');
      setIsConnecting(false);
      throw error;
    }
  };

  // Leave the video room
  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
    setActiveSession(null);
    localTracks.forEach(track => track.stop());
    setLocalTracks([]);
    setParticipants([]);
  };

  // Toggle audio
  const toggleAudio = () => {
    localTracks
      .find(track => track.kind === 'audio')
      ?.enable(!localTracks.find(track => track.kind === 'audio')?.isEnabled);
  };

  // Toggle video
  const toggleVideo = () => {
    localTracks
      .find(track => track.kind === 'video')
      ?.enable(!localTracks.find(track => track.kind === 'video')?.isEnabled);
  };

  // Check if audio is enabled
  const isAudioEnabled = () => {
    return localTracks.find(track => track.kind === 'audio')?.isEnabled ?? false;
  };

  // Check if video is enabled
  const isVideoEnabled = () => {
    return localTracks.find(track => track.kind === 'video')?.isEnabled ?? false;
  };

  const value = {
    room,
    localTracks,
    participants,
    activeSession,
    isConnecting,
    error,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
  };

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>;
}; 