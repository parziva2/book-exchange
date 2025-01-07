import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge,
  InputAdornment,
  CircularProgress,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  FiberManualRecord as OnlineIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

const Chat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const {
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    unreadCounts,
    sendMessage,
    setActiveChat,
    fetchConversations,
  } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(newMessage);
    setNewMessage('');
  };

  const handleConversationClick = async (conversation) => {
    await setActiveChat(conversation);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const getOtherUser = (conversation) => {
    return conversation.participants.find(
      (participant) => participant._id !== user._id
    );
  };

  const formatTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const renderConversationList = () => (
    <List sx={{ width: 300, bgcolor: 'background.paper' }}>
      {conversations.map((conversation) => {
        const otherUser = getOtherUser(conversation);
        const isOnline = onlineUsers.includes(otherUser._id);
        const unreadCount = unreadCounts[conversation._id] || 0;

        return (
          <React.Fragment key={conversation._id}>
            <ListItem
              button
              selected={activeConversation?._id === conversation._id}
              onClick={() => handleConversationClick(conversation)}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={isOnline ? 'success' : 'error'}
                >
                  <Avatar>
                    {otherUser.username[0].toUpperCase()}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={otherUser.username}
                secondary={conversation.lastMessage?.content || 'No messages yet'}
                primaryTypographyProps={{
                  fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                }}
              />
              {unreadCount > 0 && (
                <Badge
                  badgeContent={unreadCount}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </ListItem>
            <Divider />
          </React.Fragment>
        );
      })}
    </List>
  );

  const renderMessages = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Chat Header */}
      {activeConversation && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">
            {getOtherUser(activeConversation).username}
          </Typography>
        </Box>
      )}

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.map((message) => {
          const isOwnMessage = message.sender === user._id;

          return (
            <Box
              key={message._id}
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  bgcolor: isOwnMessage ? 'primary.main' : 'grey.200',
                  color: isOwnMessage ? 'white' : 'text.primary',
                  borderRadius: 2,
                  p: 1,
                  px: 2,
                }}
              >
                <Typography variant="body1">{message.content}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'right',
                    mt: 0.5,
                    opacity: 0.8,
                  }}
                >
                  {formatTime(message.createdAt)}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      {activeConversation && (
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <TextField
            fullWidth
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" disabled={!newMessage.trim()}>
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Mobile Chat Toggle */}
      {isMobile && (
        <IconButton
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
          onClick={() => setDrawerOpen(true)}
        >
          <ChatIcon />
        </IconButton>
      )}

      {/* Chat Interface */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: isMobile ? '100%' : 'auto',
          height: '600px',
          display: 'flex',
          boxShadow: 3,
          bgcolor: 'background.paper',
          ...(isMobile
            ? {
                top: 0,
                left: 0,
              }
            : {
                maxWidth: '900px',
                width: '80%',
                m: 2,
              }),
        }}
      >
        {/* Conversation List */}
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              position: 'relative',
              width: 300,
              height: '100%',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6">Conversations</Typography>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
          {renderConversationList()}
        </Drawer>

        {/* Messages Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeConversation ? (
            renderMessages()
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Chat; 