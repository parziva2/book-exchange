import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  // Listen for messages and other events
  useEffect(() => {
    if (!socket) return;

    socket.on('message', (message) => {
      if (message.conversationId === activeConversation?._id) {
        setMessages((prev) => [...prev, message]);
      } else {
        // Update unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1,
        }));
      }
    });

    socket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('message');
      socket.off('online_users');
    };
  }, [socket, activeConversation]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setMessages(data);
      // Clear unread count
      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: 0,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send a message
  const sendMessage = (content) => {
    if (!socket || !activeConversation) return;

    socket.emit('message', {
      conversationId: activeConversation._id,
      content,
    });
  };

  // Start a new conversation
  const startConversation = async (userId) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId }),
      });
      const conversation = await response.json();
      setConversations((prev) => [...prev, conversation]);
      return conversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

  // Set active conversation and fetch its messages
  const setActiveChat = async (conversation) => {
    setActiveConversation(conversation);
    if (conversation) {
      await fetchMessages(conversation._id);
    }
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    unreadCounts,
    sendMessage,
    startConversation,
    setActiveChat,
    fetchConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}; 