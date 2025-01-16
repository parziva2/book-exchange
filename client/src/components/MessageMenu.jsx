import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
} from '@mui/material';
import {
  Message as MessageIcon,
  MarkChatRead as MarkChatReadIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useMessages } from '../contexts/MessageContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const MessageMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { messages, unreadCount, markAsRead, markAllAsRead, loading } = useMessages();
  const { currentUser: user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMessageClick = (conversation) => {
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.lastMessage._id);
    }
    navigate(`/messages`, { state: { selectedUser: conversation.user } });
    handleClose();
  };

  const formatMessageTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Group messages by conversation
  const conversations = (messages || []).reduce((acc, message) => {
    if (!message?.sender || !message?.recipient) return acc;
    
    // Always use the other person's info for the conversation
    const otherUser = message.sender._id === user?._id ? message.recipient : message.sender;
    if (!otherUser?._id) return acc;
    
    const key = otherUser._id;

    if (!acc[key]) {
      acc[key] = {
        user: otherUser,  // This will be the other person's info
        messages: [],
        unreadCount: 0,
        lastMessage: null
      };
    }

    acc[key].messages.push(message);
    if (!message.read && message.recipient._id === user?._id) {
      acc[key].unreadCount++;
    }
    if (!acc[key].lastMessage || new Date(message.createdAt) > new Date(acc[key].lastMessage.createdAt)) {
      acc[key].lastMessage = message;
    }

    return acc;
  }, {});

  // Convert conversations object to array and sort by last message date
  const sortedConversations = Object.entries(conversations)
    .map(([id, data]) => ({
      id,
      ...data
    }))
    .sort((a, b) => {
      if (!a.lastMessage?.createdAt) return 1;
      if (!b.lastMessage?.createdAt) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

  return (
    <Box>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label={`${unreadCount} unread messages`}
      >
        <Badge badgeContent={unreadCount} color="error">
          <MessageIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 400,
          }
        }}
      >
        <MenuItem sx={{ p: 0, '&:hover': { background: 'none' } }}>
          <Box sx={{ p: 2, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Messages</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Box>
        </MenuItem>
        
        <Divider />

        {loading ? (
          <MenuItem disabled>
            <ListItemText primary="Loading messages..." />
          </MenuItem>
        ) : sortedConversations.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No messages" />
          </MenuItem>
        ) : (
          sortedConversations.map((conversation) => (
            <MenuItem
              key={conversation.id}
              onClick={() => handleMessageClick(conversation)}
              sx={{
                backgroundColor: conversation.unreadCount > 0 ? 'action.hover' : 'inherit',
                '&:hover': {
                  backgroundColor: 'action.selected'
                }
              }}
            >
              <ListItemIcon>
                <Avatar src={conversation.user?.avatar} alt={conversation.user?.firstName}>
                  {conversation.user?.firstName?.[0] || '?'}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={`${conversation.user?.firstName} ${conversation.user?.lastName}`}
                secondary={
                  <Typography component="div" variant="body2">
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'block' }}
                    >
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {conversation.lastMessage?.createdAt ? 
                        formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true }) :
                        'Never'
                      }
                    </Typography>
                  </Typography>
                }
              />
              {conversation.unreadCount > 0 && (
                <CircleIcon
                  sx={{
                    fontSize: 12,
                    color: 'primary.main',
                    ml: 1
                  }}
                />
              )}
            </MenuItem>
          ))
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            navigate('/messages');
            handleClose();
          }}
          sx={{ justifyContent: 'center' }}
        >
          <Typography color="primary">
            See all messages
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessageMenu; 