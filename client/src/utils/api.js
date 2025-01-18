import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Add request interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post('/api/auth/refresh-token', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

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
  login: '/api/auth/login',
  register: '/api/auth/register',
  verifyEmail: '/api/auth/verify-email',
  forgotPassword: '/api/auth/forgot-password',
  resetPassword: '/api/auth/reset-password',
};

// Protected routes
export const protectedRoutes = {
  me: '/api/auth/me',
  updateProfile: '/api/users/profile',
  changePassword: '/api/users/change-password',
  mentors: '/api/mentors',
  mentor: (id) => `/api/mentors/${id}`,
  becomeMentor: '/api/mentors/become',
  updateMentorProfile: '/api/mentors/profile',
  conversations: '/api/conversations',
  conversation: (id) => `/api/conversations/${id}`,
  messages: (conversationId) => `/api/conversations/${conversationId}/messages`,
  notifications: '/api/notifications',
  notificationRead: (id) => `/api/notifications/${id}/read`,
  notificationReadAll: '/api/notifications/read-all',
  notificationDelete: (id) => `/api/notifications/${id}`,
  reviews: (mentorId) => `/api/mentors/${mentorId}/reviews`,
  review: (mentorId, reviewId) => `/api/mentors/${mentorId}/reviews/${reviewId}`,
  bookings: '/api/bookings',
  booking: (id) => `/api/bookings/${id}`,
  bookingAccept: (id) => `/api/bookings/${id}/accept`,
  bookingReject: (id) => `/api/bookings/${id}/reject`,
  bookingCancel: (id) => `/api/bookings/${id}/cancel`,
  bookingComplete: (id) => `/api/bookings/${id}/complete`,
  createStripeSession: '/api/payments/create-session',
  stripeAccountLink: '/api/payments/account-link',
  stripeAccountStatus: '/api/payments/account-status',
};

export default api; 