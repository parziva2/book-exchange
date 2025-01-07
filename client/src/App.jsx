import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Sessions from './pages/Sessions';
import BookSession from './pages/BookSession';
import Chat from './components/chat/Chat';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { VideoProvider } from './contexts/VideoContext';
import PrivateRoute from './components/auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <VideoProvider>
        <ChatProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <PrivateRoute>
                        <Search />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/sessions"
                    element={
                      <PrivateRoute>
                        <Sessions />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/book/:mentorId"
                    element={
                      <PrivateRoute>
                        <BookSession />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Container>
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            </Box>
          </LocalizationProvider>
        </ChatProvider>
      </VideoProvider>
    </AuthProvider>
  );
}

export default App; 