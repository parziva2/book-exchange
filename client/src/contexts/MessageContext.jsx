import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

// Chat API endpoints
const chatEndpoints = {
  getConversations: '/messages',
  getMessages: (userId) => `/messages/conversation/${userId}`,
  sendMessage: '/messages',
  markAsRead: (messageId) => `/messages/${messageId}/read`,
  markAllAsRead: '/messages/read-all'
};

const MessageContext = createContext();

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get(chatEndpoints.getConversations);
      const messagesData = response.data.data || [];
      
      // Group messages into unique conversations
      const conversationMap = new Map();
      
      messagesData.forEach(message => {
        if (!message.sender || !message.recipient) return;
        
        // Always use recipient's ID as conversation ID if current user is sender,
        // otherwise use sender's ID
        const isSender = message.sender._id === user?._id;
        const conversationId = isSender ? message.recipient._id : message.sender._id;
        const otherUser = isSender ? message.recipient : message.sender;
        
        const existingConv = conversationMap.get(conversationId);
        if (existingConv) {
          // Update last message if this one is newer
          if (new Date(message.createdAt) > new Date(existingConv.lastMessage.createdAt)) {
            existingConv.lastMessage = message;
            existingConv.messages = [...existingConv.messages, message];
          }
          if (!message.read && message.recipient._id === user?._id) {
            existingConv.unreadCount++;
          }
        } else {
          conversationMap.set(conversationId, {
            _id: conversationId,
            otherUser,
            lastMessage: message,
            messages: [message],
            unreadCount: !message.read && message.recipient._id === user?._id ? 1 : 0
          });
        }
      });
      
      // Convert map to array
      const uniqueConversations = Array.from(conversationMap.values());
      setConversations(uniqueConversations);
      setError(null);
      return uniqueConversations;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view messages');
      } else {
        setError('Failed to load conversations');
      }
      setConversations([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id]);

  const getConversation = useCallback(async (userId) => {
    if (!userId || !isAuthenticated) return [];
    try {
      const response = await api.get(chatEndpoints.getMessages(userId));
      const conversationMessages = response.data.data || [];
      setMessages(conversationMessages);
      setCurrentConversation(userId);

      // Update the conversation in the list with new messages
      setConversations(prevConversations => {
        const updatedConversations = [...prevConversations];
        const conversationIndex = updatedConversations.findIndex(conv => conv._id === userId);
        
        if (conversationIndex !== -1) {
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            messages: conversationMessages,
            lastMessage: conversationMessages[conversationMessages.length - 1]
          };
        }
        
        return updatedConversations;
      });

      return conversationMessages;
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setMessages([]);
      if (err.response?.status === 401) {
        setError('Please log in to view messages');
      }
      throw err;
    }
  }, [isAuthenticated]);

  const updateConversationsList = useCallback((newMessage) => {
    // Update conversations list
    setConversations(prevConversations => {
      const existingConversationIndex = prevConversations.findIndex(conv => 
        (conv.sender?._id === newMessage.sender?._id && conv.recipient?._id === newMessage.recipient?._id) ||
        (conv.sender?._id === newMessage.recipient?._id && conv.recipient?._id === newMessage.sender?._id)
      );

      if (existingConversationIndex !== -1) {
        // Update existing conversation
        const updatedConversations = [...prevConversations];
        updatedConversations[existingConversationIndex] = newMessage;
        return updatedConversations;
      } else {
        // Add new conversation
        return [...prevConversations, newMessage];
      }
    });

    // If this message belongs to the current conversation, add it to messages
    if (currentConversation && 
        (newMessage.sender?._id === currentConversation || 
         newMessage.recipient?._id === currentConversation)) {
      setMessages(prevMessages => [...prevMessages, newMessage]);
    }
  }, [currentConversation]);

  const sendMessage = useCallback(async (recipientId, content) => {
    try {
      const response = await api.post(chatEndpoints.sendMessage, {
        recipientId,
        content
      });
      const newMessage = response.data.data;
      
      // Update conversations list with new message
      updateConversationsList(newMessage);
      
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [updateConversationsList]);

  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      await api.put(chatEndpoints.markAsRead(messageId));
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  // Add effect to fetch conversations when auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations().catch(console.error);
    } else {
      setConversations([]);
      setMessages([]);
      setCurrentConversation(null);
    }
  }, [isAuthenticated, user, fetchConversations]);

  // Effect to restore current conversation if it exists
  useEffect(() => {
    if (currentConversation && isAuthenticated) {
      getConversation(currentConversation).catch(console.error);
    }
  }, [currentConversation, getConversation, isAuthenticated]);

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    setCurrentConversation,
    fetchConversations,
    getConversation,
    sendMessage,
    markMessageAsRead,
    updateConversationsList
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext; 