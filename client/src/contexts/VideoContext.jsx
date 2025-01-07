import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { connect } from 'twilio-video';

const VideoContext = createContext();

export function VideoProvider({ children }) {
  const [room, setRoom] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectToRoom = useCallback(async (roomName) => {
    try {
      setConnecting(true);
      setError(null);

      // Get Twilio token from backend
      const response = await axios.get(`/api/video/token?room=${roomName}`);
      if (!response.data || !response.data.token) {
        throw new Error('Video functionality is not configured');
      }

      // Connect to Twilio room
      const room = await connect(response.data.token, {
        name: roomName,
        audio: true,
        video: true
      });

      setRoom(room);
      setConnecting(false);
    } catch (err) {
      console.error('Error connecting to video room:', err);
      setError(err.message || 'Could not connect to video room');
      setConnecting(false);
    }
  }, []);

  const disconnectFromRoom = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
  }, [room]);

  const value = {
    room,
    connecting,
    error,
    connectToRoom,
    disconnectFromRoom,
    isVideoAvailable: true // You can set this based on environment variables if needed
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
} 