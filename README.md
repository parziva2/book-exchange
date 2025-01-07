# SwapExperience - Knowledge Sharing Platform

SwapExperience is a platform that connects mentors and mentees for knowledge sharing sessions. Users can book sessions with experts in various fields, conduct video calls, and engage in real-time chat conversations.

## Features

- **User Authentication**
  - Register and login with JWT authentication
  - Profile management with expertise and availability settings
  - Role-based access control (user, mentor, admin)

- **Session Management**
  - Book sessions with mentors
  - Real-time video calls using Twilio
  - Session feedback and rating system
  - Credit-based payment system

- **Real-time Communication**
  - Instant messaging with Socket.IO
  - One-on-one chat conversations
  - Message read receipts
  - Typing indicators

- **Video Calls**
  - High-quality video conferencing
  - Screen sharing capability
  - Audio controls
  - Device selection

## Tech Stack

- **Frontend**
  - React.js with Material-UI
  - Socket.IO client
  - Twilio Video
  - Context API for state management

- **Backend**
  - Node.js with Express
  - MongoDB with Mongoose
  - Socket.IO for real-time features
  - JWT for authentication
  - Twilio SDK

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Twilio Account
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/book-exchange.git
   cd book-exchange
   ```

2. Install dependencies for both backend and frontend:
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   ```

3. Create environment variables:
   ```bash
   # In root directory
   cp .env.example .env
   ```
   Fill in your environment variables in the `.env` file.

4. Start the development servers:
   ```bash
   # Start backend server (from root directory)
   npm run dev

   # Start frontend server (from client directory)
   cd client
   npm start
   ```

## API Documentation

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `DELETE /api/auth/account` - Delete account

### Session Routes
- `POST /api/sessions` - Create a new session
- `GET /api/sessions` - Get all user sessions
- `GET /api/sessions/:id` - Get session by ID
- `PATCH /api/sessions/:id/status` - Update session status
- `POST /api/sessions/:id/feedback` - Add session feedback
- `POST /api/sessions/:id/video-token` - Get video call token

### Chat Routes
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/conversations/:userId` - Get/create conversation
- `GET /api/chat/conversations/:conversationId/messages` - Get messages
- `POST /api/chat/conversations/:conversationId/messages` - Send message
- `DELETE /api/chat/messages/:messageId` - Delete message

## Socket.IO Events

### Client Events
- `join conversation` - Join a conversation room
- `leave conversation` - Leave a conversation room
- `new message` - Send a new message
- `typing` - Indicate user is typing

### Server Events
- `message received` - New message notification
- `user typing` - User typing notification
- `video signal` - Video call signaling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Twilio for video call functionality
- Socket.IO for real-time features
- Material-UI for the component library 