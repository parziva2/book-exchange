import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Badge,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { useSocket } from '../contexts/SocketContext';
import ChatDialog from '../components/chat/ChatDialogComponent.jsx';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'react-router-dom';

const Messages = () => {
  const { currentUser: user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { conversations, messages, fetchConversations, markMessageAsRead } = useMessages();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const location = useLocation();

  // Group messages by conversation using useMemo
  const sortedConversations = useMemo(() => {
    console.log('Messages in sortedConversations:', conversations); // Debug log
    return (conversations || [])
      .sort((a, b) => {
        if (!a.lastMessage?.createdAt) return 1;
        if (!b.lastMessage?.createdAt) return -1;
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      });
  }, [conversations]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        await fetchConversations();
      } catch (error) {
        console.error('Error loading messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [fetchConversations]);

  useEffect(() => {
    // Set selected recipient from navigation state if available
    if (location.state?.selectedUser) {
      const selectedUser = location.state.selectedUser;
      setSelectedRecipient(selectedUser);
      
      // Find the conversation for this user and mark messages as read
      const conversation = sortedConversations.find(conv => 
        conv?.otherUser?._id === selectedUser?._id
      );
      if (conversation?.unreadCount > 0 && conversation?.messages) {
        const unreadMessages = conversation.messages
          .filter(msg => msg && !msg.read && msg.recipient?._id === user?._id)
          .map(msg => msg?._id ? markMessageAsRead(msg._id) : null)
          .filter(Boolean);
        
        if (unreadMessages.length > 0) {
          Promise.all(unreadMessages);
        }
      }
    }
  }, [location.state, sortedConversations, user?._id, markMessageAsRead]);

  const handleChatSelect = async (conversation) => {
    if (!conversation?.otherUser?._id) return;
    
    setSelectedRecipient(conversation.otherUser);
    
    // Mark unread messages as read
    if (conversation.unreadCount > 0 && conversation.messages) {
      const unreadMessages = conversation.messages
        .filter(msg => msg && !msg.read && msg.recipient?._id === user?._id)
        .map(msg => msg?._id ? markMessageAsRead(msg._id) : null)
        .filter(Boolean);
      
      if (unreadMessages.length > 0) {
        await Promise.all(unreadMessages);
      }
    }
  };

  const handleCloseChat = () => {
    setSelectedRecipient(null);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={2}>
        <Box p={3}>
          <Typography variant="h5" gutterBottom>
            Conversations
          </Typography>
          {sortedConversations.length === 0 ? (
            <Typography variant="body1" color="textSecondary" align="center" py={4}>
              No conversations yet
            </Typography>
          ) : (
            <List>
              {sortedConversations.map((conversation) => (
                conversation?.otherUser && conversation?._id && (
                  <React.Fragment key={conversation._id}>
                    <ListItem 
                      button 
                      onClick={() => handleChatSelect(conversation)}
                      sx={{
                        backgroundColor: conversation.unreadCount > 0 ? 'action.hover' : 'inherit',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="success"
                          variant="dot"
                          invisible={!onlineUsers?.has(conversation.otherUser._id)}
                        >
                          <Avatar 
                            src={conversation.otherUser.mentorProfile?.image || 
                                 conversation.otherUser.profile?.image || 
                                 (conversation.otherUser.avatar ? `/uploads/avatars/${conversation.otherUser.avatar}` : null) || 
                                 `/avatars/${conversation.otherUser.firstName?.[0]?.toLowerCase()}.png`} 
                            alt={conversation.otherUser.firstName || ''}
                            sx={{ width: 40, height: 40 }}
                          >
                            {conversation.otherUser.firstName?.[0] || ''}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography component="span" variant="subtitle1">
                              {`${conversation.otherUser.firstName || ''} ${conversation.otherUser.lastName || ''}`}
                            </Typography>
                            {conversation.unreadCount > 0 && (
                              <Badge badgeContent={conversation.unreadCount} color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          conversation.lastMessage && (
                            <Box component="span" display="flex" justifyContent="space-between" alignItems="center">
                              <Typography
                                component="span"
                                variant="body2"
                                color="textSecondary"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '70%'
                                }}
                              >
                                {conversation.lastMessage.content || ''}
                              </Typography>
                              <Typography component="span" variant="caption" color="textSecondary">
                                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                              </Typography>
                            </Box>
                          )
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                )
              ))}
            </List>
          )}
        </Box>
      </Paper>

      <ChatDialog
        open={Boolean(selectedRecipient)}
        onClose={handleCloseChat}
        recipientId={selectedRecipient?._id}
        recipientName={selectedRecipient ? `${selectedRecipient.firstName || ''} ${selectedRecipient.lastName || ''}` : ''}
        recipientAvatar={selectedRecipient?.mentorProfile?.image || 
                        selectedRecipient?.profile?.image || 
                        (selectedRecipient?.avatar ? `/uploads/avatars/${selectedRecipient.avatar}` : null) || 
                        `/avatars/${selectedRecipient?.firstName?.[0]?.toLowerCase()}.png`}
      />
    </Container>
  );
};

export default Messages; 