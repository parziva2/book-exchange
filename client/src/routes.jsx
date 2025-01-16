import React from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import VideoChat from './components/VideoChat/VideoChat';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Balance from './pages/Balance';
import TransactionHistory from './pages/TransactionHistory';
import BecomeMentor from './pages/BecomeMentor';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

const VideoSessionRoute = () => {
  const { sessionId } = useParams();
  return (
    <Box 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
        zIndex: 1200
      }}
    >
      <VideoChat sessionId={sessionId} />
    </Box>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Video Session Route - Outside Layout */}
      <Route
        path="/video-session/:sessionId"
        element={
          <PrivateRoute>
            <VideoSessionRoute />
          </PrivateRoute>
        }
      />

      {/* Standard Layout Routes */}
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        // ... rest of the routes ...
      </Route>
    </Routes>
  );
};

export default AppRoutes; 