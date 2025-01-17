const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let io;

const initializeSocket = (server) => {
  console.log('Initializing socket.io server...');
  
  io = socketIO(server, {
    cors: {
      origin: function(origin, callback) {
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
          'https://www.swapexpertise.com',
          'https://swapexpertise.com',
          'https://book-exchange-clien.onrender.com',
          'https://book-exchange.onrender.com'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('swapexpertise.com')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
      ]
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  console.log('Socket.io server created with config:', {
    cors: io.opts.cors,
    path: io.opts.path,
    transports: io.opts.transports
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Try to get token from auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        console.log('Socket auth failed: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        // First try to verify as JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
          console.log('Socket auth failed: User not found');
          return next(new Error('Authentication error: User not found'));
        }

        console.log('Socket auth successful for user:', user._id);
        socket.user = user;
        next();
      } catch (jwtError) {
        // If JWT verification fails, try to verify as Twilio token
        if (jwtError.name === 'JsonWebTokenError') {
          // For Twilio tokens, we'll just allow the connection
          // since Twilio tokens are verified when joining the room
          socket.user = { id: 'twilio-user' };
          next();
        } else {
          throw jwtError;
        }
      }
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error(`Authentication error: ${error.message}`));
    }
  });

  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user?._id, 'Socket ID:', socket.id);
    
    // Only add to connected users if we have a valid user
    if (socket.user?._id) {
      const userId = socket.user._id.toString();
      connectedUsers.set(userId, socket.id);
      console.log('Added to connected users. Current connected users:', Array.from(connectedUsers.keys()));

      // Join user's own room for private messages and notifications
      socket.join(userId);
      console.log('User joined room:', userId);
      console.log('Current rooms for socket:', Array.from(socket.rooms));

      // Update user's online status
      User.findByIdAndUpdate(socket.user._id, { online: true })
        .then(() => console.log('User online status updated'))
        .catch(err => console.error('Error updating online status:', err));

      // Send a welcome message to confirm connection
      socket.emit('welcome', { 
        message: 'Connected successfully', 
        userId: socket.user._id 
      });
    }

    // Handle disconnection
    socket.on('disconnect', async () => {
      if (socket.user?._id) {
        const userId = socket.user._id.toString();
        connectedUsers.delete(userId);
        console.log('User disconnected:', userId);
        console.log('Remaining connected users:', Array.from(connectedUsers.keys()));

        try {
          // Update user's online status
          await User.findByIdAndUpdate(socket.user._id, { 
            online: false,
            lastSeen: new Date()
          });
          console.log('User offline status updated');

          // Notify other users about offline status
          io.emit('user_offline', userId);
        } catch (err) {
          console.error('Error updating offline status:', err);
        }
      }
    });
  });

  console.log('Socket.io initialization complete');
  return io;
};

// Export both the initialization function and the io instance
module.exports = {
  initializeSocket,
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  }
}; 