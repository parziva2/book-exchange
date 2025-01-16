import api from './api';

/**
 * Fetches a specific session by ID
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Session data
 */
export const getSession = async (sessionId) => {
  try {
    const response = await api.get(`/api/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw new Error('Failed to fetch session details');
  }
};

/**
 * Fetches all sessions for the current user
 * @returns {Promise<Array>} Array of session objects
 */
export const getUserSessions = async () => {
  try {
    const response = await api.get('/api/sessions');
    return response.data;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw new Error('Failed to fetch sessions');
  }
};

/**
 * Creates a new session
 * @param {Object} sessionData - Session data including mentor, time, duration, etc.
 * @returns {Promise<Object>} Created session data
 */
export const createSession = async (sessionData) => {
  try {
    const response = await api.post('/api/sessions', sessionData);
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
};

/**
 * Updates a session's status
 * @param {string} sessionId - The session ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated session data
 */
export const updateSessionStatus = async (sessionId, status) => {
  try {
    const response = await api.put(`/sessions/${sessionId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating session status:', error);
    throw new Error('Failed to update session status');
  }
};

/**
 * Cancels a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Cancelled session data
 */
export const cancelSession = async (sessionId) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling session:', error);
    throw new Error('Failed to cancel session');
  }
};

/**
 * Joins a video session
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Session connection data
 */
export const joinVideoSession = async (sessionId) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/join`);
    return response.data;
  } catch (error) {
    console.error('Error joining video session:', error);
    throw new Error('Failed to join video session');
  }
};

/**
 * Ends a video session
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Session data
 */
export const endVideoSession = async (sessionId) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/end`);
    return response.data;
  } catch (error) {
    console.error('Error ending video session:', error);
    throw new Error('Failed to end video session');
  }
}; 