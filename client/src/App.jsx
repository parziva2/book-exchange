import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import MentorRoute from './components/auth/MentorRoute';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import BecomeMentor from './pages/BecomeMentor';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import AdminMentors from './pages/Admin/AdminMentors';
import Sessions from './pages/Sessions';
import Transactions from './pages/Transactions';
import MentorDashboard from './pages/MentorDashboard';
import MentorProfile from './pages/MentorProfile';
import EditMentorProfile from './pages/EditMentorProfile';
import Messages from './pages/Messages';
import JoinSession from './pages/JoinSession';
import ErrorPage from './pages/ErrorPage';
import GroupSessionList from './components/group-sessions/GroupSessionList';
import GroupSessionDetails from './components/group-sessions/GroupSessionDetails';
import GroupSessionForm from './components/group-sessions/GroupSessionForm';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Help from './pages/Help.jsx';
import Notifications from './pages/Notifications';
import { initGA, trackPageView } from './utils/analytics';

function App() {
  const location = useLocation();

  useEffect(() => {
    // Initialize Google Analytics
    initGA();
  }, []);

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/help" element={<Help />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/become-mentor" element={<BecomeMentor />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/mentor/:mentorId" element={<MentorProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/video-session/:sessionId" element={<JoinSession />} />
          <Route path="/group-sessions" element={<GroupSessionList />} />
          <Route path="/group-sessions/:id" element={<GroupSessionDetails />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Mentor Routes */}
        <Route element={<MentorRoute />}>
          <Route path="/mentor-dashboard" element={<MentorDashboard />} />
          <Route path="/mentor/edit-profile" element={<EditMentorProfile />} />
          <Route path="/group-sessions/create" element={<GroupSessionForm />} />
          <Route path="/group-sessions/:id/edit" element={<GroupSessionForm />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/mentors" element={<AdminMentors />} />
        </Route>

        {/* Error Route */}
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
}

export default App; 