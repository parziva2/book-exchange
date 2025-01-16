import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const GroupSessionContext = createContext();

const groupSessionEndpoints = {
  getAll: '/api/group-sessions',
  getOne: (id) => `/api/group-sessions/${id}`,
  create: '/api/group-sessions',
  update: (id) => `/api/group-sessions/${id}`,
  cancel: (id) => `/api/group-sessions/${id}/cancel`,
  join: (id) => `/api/group-sessions/${id}/join`,
  leave: (id) => `/api/group-sessions/${id}/leave`
};

export const GroupSessionProvider = ({ children }) => {
  const [groupSessions, setGroupSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const { showNotification } = useNotifications();

  const fetchGroupSessions = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const queryString = new URLSearchParams(filters).toString();
      const response = await axios.get(`${groupSessionEndpoints.getAll}?${queryString}`);
      setGroupSessions(response.data.data.groupSessions);
      return response.data.data.groupSessions;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch group sessions');
      showNotification('error', 'Failed to fetch group sessions');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const fetchGroupSession = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(groupSessionEndpoints.getOne(id));
      setCurrentSession(response.data.data.groupSession);
      return response.data.data.groupSession;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch group session');
      showNotification('error', 'Failed to fetch group session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const createGroupSession = useCallback(async (sessionData) => {
    try {
      setLoading(true);
      const response = await axios.post(groupSessionEndpoints.create, sessionData);
      setGroupSessions(prev => [...prev, response.data.data.groupSession]);
      showNotification('success', 'Group session created successfully');
      return response.data.data.groupSession;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create group session');
      showNotification('error', 'Failed to create group session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const updateGroupSession = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      const response = await axios.patch(groupSessionEndpoints.update(id), updateData);
      setGroupSessions(prev => 
        prev.map(session => 
          session._id === id ? response.data.data.groupSession : session
        )
      );
      if (currentSession?._id === id) {
        setCurrentSession(response.data.data.groupSession);
      }
      showNotification('success', 'Group session updated successfully');
      return response.data.data.groupSession;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update group session');
      showNotification('error', 'Failed to update group session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentSession, showNotification]);

  const cancelGroupSession = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await axios.patch(groupSessionEndpoints.cancel(id));
      setGroupSessions(prev => 
        prev.map(session => 
          session._id === id ? response.data.data.groupSession : session
        )
      );
      if (currentSession?._id === id) {
        setCurrentSession(response.data.data.groupSession);
      }
      showNotification('success', 'Group session cancelled successfully');
      return response.data.data.groupSession;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to cancel group session');
      showNotification('error', 'Failed to cancel group session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentSession, showNotification]);

  const joinGroupSession = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await axios.post(groupSessionEndpoints.join(id));
      setGroupSessions(prev => 
        prev.map(session => 
          session._id === id ? response.data.data.groupSession : session
        )
      );
      if (currentSession?._id === id) {
        setCurrentSession(response.data.data.groupSession);
      }
      showNotification('success', 'Joined group session successfully');
      return response.data.data.groupSession;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join group session');
      showNotification('error', 'Failed to join group session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentSession, showNotification]);

  const leaveGroupSession = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await axios.delete(groupSessionEndpoints.leave(id));
      setGroupSessions(prev => 
        prev.map(session => 
          session._id === id ? response.data.data.groupSession : session
        )
      );
      if (currentSession?._id === id) {
        setCurrentSession(response.data.data.groupSession);
      }
      showNotification('success', 'Left group session successfully');
      return response.data.data.groupSession;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to leave group session');
      showNotification('error', 'Failed to leave group session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentSession, showNotification]);

  const value = {
    groupSessions,
    currentSession,
    loading,
    error,
    fetchGroupSessions,
    fetchGroupSession,
    createGroupSession,
    updateGroupSession,
    cancelGroupSession,
    joinGroupSession,
    leaveGroupSession
  };

  return (
    <GroupSessionContext.Provider value={value}>
      {children}
    </GroupSessionContext.Provider>
  );
};

export const useGroupSession = () => {
  const context = useContext(GroupSessionContext);
  if (!context) {
    throw new Error('useGroupSession must be used within a GroupSessionProvider');
  }
  return context;
}; 