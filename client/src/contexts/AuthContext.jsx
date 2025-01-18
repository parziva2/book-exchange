import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const clearError = () => setError(null);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const userData = response.data.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshResponse = await api.post('/auth/refresh-token', { refreshToken });
              const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
              
              // Update tokens
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              // Retry the original request
              const retryResponse = await api.get('/auth/me');
              const userData = retryResponse.data.data.user;
              setUser(userData);
              setIsAuthenticated(true);
              setError(null);
              return;
            } catch (refreshErr) {
              console.error('Token refresh failed:', refreshErr);
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            localStorage.removeItem('accessToken');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
        throw err;
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, tokens } = response.data.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      const from = location.state?.from?.pathname || '/explore';
      navigate(from, { replace: true });
      
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      const { user: registeredUser, tokens } = response.data.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      setUser(registeredUser);
      setIsAuthenticated(true);
      
      navigate('/explore', { replace: true });
      
      return registeredUser;
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to register';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    navigate('/login');
  }, [navigate]);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    checkAuth,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 