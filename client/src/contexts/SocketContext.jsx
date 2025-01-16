import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  const connectSocket = useCallback(async () => {
    try {
      console.log('Initiating socket connection...');
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found, skipping socket connection');
        return () => {};
      }

      const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
      console.log('Creating socket connection to:', baseURL);

      const socketOptions = {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        query: { token }
      };

      const newSocket = io(baseURL, socketOptions);

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setError(`Socket connection error: ${error.message}`);
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully with ID:', newSocket.id);
        setError(null);
        setIsConnecting(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected. Reason:', reason);
        setIsConnecting(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection...');
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error in socket connection:', error);
      setError(`Socket connection error: ${error.message}`);
      return () => {};
    }
  }, []);

  useEffect(() => {
    let cleanupFn = () => {};
    
    const initSocket = async () => {
      try {
        const cleanup = await connectSocket();
        if (typeof cleanup === 'function') {
          cleanupFn = cleanup;
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initSocket();

    return () => {
      cleanupFn();
    };
  }, [connectSocket]);

  // Clean up typing status after 3 seconds of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        for (const [userId, timestamp] of newMap) {
          if (now - timestamp > 3000) {
            newMap.delete(userId);
          }
        }
        return newMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback((recipientId, content, sessionId = null) => {
    if (!socket?.connected) {
      console.warn('Cannot send message: Socket not connected');
      return;
    }
    socket.emit('private_message', { recipientId, content, sessionId });
  }, [socket]);

  const sendTypingStatus = useCallback((recipientId, typing) => {
    if (!socket?.connected) {
      console.warn('Cannot send typing status: Socket not connected');
      return;
    }
    socket.emit('typing', { recipientId, typing });
  }, [socket]);

  const value = {
    socket,
    isConnecting,
    error,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTypingStatus,
    isConnected: socket?.connected || false
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketProvider; 