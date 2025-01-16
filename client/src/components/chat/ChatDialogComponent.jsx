import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  IconButton,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useMessages } from '../../contexts/MessageContext';
import { formatDistanceToNow } from 'date-fns';

const ChatDialog = ({ open, onClose, recipientId, recipientName, recipientAvatar }) => {
  const { currentUser: user } = useAuth();
  const { socket } = useSocket();
  const { sendMessage, getConversation, updateConversationsList } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && recipientId) {
      loadMessages();
    } else {
      setConversationMessages([]);
    }
  }, [open, recipientId]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        if (!message?.sender?._id || !message?.recipient?._id) return;
        
        if (
          (message.sender._id === recipientId && message.recipient._id === user?._id) ||
          (message.sender._id === user?._id && message.recipient._id === recipientId)
        ) {
          setConversationMessages(prevMessages => [...(prevMessages || []), message]);
          updateConversationsList(message);
        }
      };

      socket.on('newMessage', handleNewMessage);
      socket.on('private_message', handleNewMessage);
      
      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('private_message', handleNewMessage);
      };
    }
  }, [socket, recipientId, user?._id, updateConversationsList]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messages = await getConversation(recipientId);
      setConversationMessages(messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const sentMessage = await sendMessage(recipientId, newMessage.trim());
      setConversationMessages(prevMessages => [...(prevMessages || []), sentMessage]);
      setNewMessage('');
      if (socket) {
        socket.emit('private_message', {
          recipientId,
          content: newMessage.trim(),
          sender: user,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '700px',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={recipientAvatar} 
            sx={{ mr: 1 }}
          >
            {recipientName?.[0]}
          </Avatar>
          <Typography variant="h6">{recipientName}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, flexGrow: 1, overflow: 'auto', bgcolor: '#f8f9fa' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {conversationMessages.map((message, index) => {
              if (!message?.sender?._id) return null;
              const isCurrentUser = message.sender._id === user?._id;
              const messageUser = isCurrentUser ? user : message.sender;
              const messageAvatar = isCurrentUser ? 
                (user?.mentorProfile?.image || user?.profile?.image || (user?.avatar ? `/uploads/avatars/${user.avatar}` : null) || `/avatars/${user?.firstName?.[0]?.toLowerCase()}.png`) :
                (message.sender?.mentorProfile?.image || message.sender?.profile?.image || (message.sender?.avatar ? `/uploads/avatars/${message.sender.avatar}` : null) || `/avatars/${message.sender?.firstName?.[0]?.toLowerCase()}.png`);
              
              return (
                <ListItem
                  key={message._id || index}
                  sx={{
                    flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: 1,
                    px: 2,
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 'auto' }}>
                    <Avatar
                      src={messageAvatar}
                      sx={{ width: 32, height: 32 }}
                    >
                      {messageUser?.firstName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      bgcolor: isCurrentUser ? '#0084ff' : '#e4e6eb',
                      color: isCurrentUser ? '#ffffff' : '#000000',
                      borderRadius: isCurrentUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      ml: isCurrentUser ? 'auto' : 0,
                      mr: isCurrentUser ? 0 : 'auto',
                    }}
                  >
                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                      {message.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                        textAlign: isCurrentUser ? 'right' : 'left',
                      }}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </Typography>
                  </Paper>
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          variant="outlined"
          size="small"
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          endIcon={<SendIcon />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatDialog;