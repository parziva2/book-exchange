import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const ChatPanel = ({ sessionId, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (socket) {
      // Join the chat room
      socket.emit('join_chat', { sessionId });

      // Listen for new messages
      socket.on('new_message', handleNewMessage);

      // Load chat history
      socket.emit('get_chat_history', { sessionId }, (history) => {
        setMessages(history);
      });

      return () => {
        socket.off('new_message');
        socket.emit('leave_chat', { sessionId });
      };
    }
  }, [socket, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const message = {
        sessionId,
        sender: user.id,
        senderName: user.name,
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      socket.emit('send_message', message);
      setNewMessage('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
      }}>
        <Typography variant="h6">Chat</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <List sx={{ flexGrow: 1, overflow: 'auto', px: 2 }}>
        {messages.map((message, index) => (
          <React.Fragment key={message.timestamp}>
            {index > 0 && 
              shouldShowDateDivider(messages[index - 1].timestamp, message.timestamp) && (
              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(message.timestamp)}
                </Typography>
              </Divider>
            )}
            <ListItem
              alignItems="flex-start"
              sx={{
                flexDirection: message.sender === user.id ? 'row-reverse' : 'row',
                px: 0,
              }}
            >
              <ListItemAvatar>
                <Avatar alt={message.senderName}>
                  {message.senderName[0].toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={message.text}
                secondary={formatTime(message.timestamp)}
                sx={{
                  maxWidth: '70%',
                  '& .MuiListItemText-primary': {
                    bgcolor: message.sender === user.id ? 'primary.main' : 'grey.100',
                    color: message.sender === user.id ? 'white' : 'text.primary',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'inline-block',
                    wordBreak: 'break-word',
                  },
                  '& .MuiListItemText-secondary': {
                    textAlign: message.sender === user.id ? 'right' : 'left',
                    mt: 0.5,
                  },
                }}
              />
            </ListItem>
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </List>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            multiline
            maxRows={4}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

const shouldShowDateDivider = (prevTimestamp, currentTimestamp) => {
  const prev = new Date(prevTimestamp);
  const current = new Date(currentTimestamp);
  return prev.toDateString() !== current.toDateString();
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

export default ChatPanel; 