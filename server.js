require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const chatRoutes = require('./routes/chat');

const app = express();

// Create server only if not in test environment
const server = process.env.NODE_ENV !== 'test' 
  ? http.createServer(app)
  : require('http').createServer();

// Initialize Socket.IO only if not in test environment
const io = process.env.NODE_ENV !== 'test'
  ? socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })
  : null;

// Middleware
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://book-exchange-client.onrender.com', process.env.CLIENT_URL].filter(Boolean)
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Connect to MongoDB (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/chat', chatRoutes);

// Add a simple health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Socket.IO setup only if not in test environment
if (process.env.NODE_ENV !== 'test' && io) {
  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Join user's personal room
    socket.join(socket.userId);

    // Handle joining conversation rooms
    socket.on('join conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle new messages
    socket.on('new message', (message) => {
      io.to(`conversation:${message.conversation}`).emit('message received', message);
    });

    // Handle typing indicators
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle video call signals
    socket.on('video signal', ({ to, signal }) => {
      io.to(to).emit('video signal', {
        from: socket.userId,
        signal
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Send detailed error in development, generic in production
  const error = process.env.NODE_ENV === 'production'
    ? { error: 'Something went wrong!' }
    : { 
        error: err.message,
        stack: err.stack,
        details: err
      };
  
  res.status(err.status || 500).json(error);
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server }; 