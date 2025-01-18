import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`,
  withCredentials: true,
});

// Add request interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for login and register endpoints
    const isAuthEndpoint = ['/auth/login', '/auth/register'].includes(originalRequest.url);
    
    // If the error is 401 and we haven't already tried to refresh the token
    // and it's not an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token using the configured api instance
        const response = await api.post('/auth/refresh-token', { refreshToken });
        
        if (!response.data?.data?.accessToken) {
          throw new Error('Invalid token refresh response');
        }

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update the authorization header
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and throw error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

// Add request interceptor to add authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Public routes
export const publicRoutes = {
  login: '/auth/login',
  register: '/auth/register',
  verifyEmail: '/auth/verify-email',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
};

// Protected routes
export const protectedRoutes = {
  me: '/auth/me',
  updateProfile: '/users/profile',
  changePassword: '/users/change-password',
  mentors: '/mentors',
  mentor: (id) => `/mentors/${id}`,
  becomeMentor: '/mentors/become',
  updateMentorProfile: '/mentors/profile',
  conversations: '/conversations',
  conversation: (id) => `/conversations/${id}`,
  messages: (conversationId) => `/conversations/${conversationId}/messages`,
  notifications: '/notifications',
  notificationRead: (id) => `/notifications/${id}/read`,
  notificationReadAll: '/notifications/read-all',
  notificationDelete: (id) => `/notifications/${id}`,
  reviews: (mentorId) => `/mentors/${mentorId}/reviews`,
  review: (mentorId, reviewId) => `/mentors/${mentorId}/reviews/${reviewId}`,
  bookings: '/bookings',
  booking: (id) => `/bookings/${id}`,
  bookingAccept: (id) => `/bookings/${id}/accept`,
  bookingReject: (id) => `/bookings/${id}/reject`,
  bookingCancel: (id) => `/bookings/${id}/cancel`,
  bookingComplete: (id) => `/bookings/${id}/complete`,
  createStripeSession: '/payments/create-session',
  stripeAccountLink: '/payments/account-link',
  stripeAccountStatus: '/payments/account-status',
};

export default api; 