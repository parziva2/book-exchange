import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// List of public routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh-token',
  '/api/auth/me'
];

// Maximum number of retries for failed requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create API instance with error handling
const createApi = () => {
  console.log('Initializing API with base URL:', BASE_URL);
  
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: true,
    timeout: 10000
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      console.log('Making request to:', `${config.baseURL}${config.url}`);
      
      // Add cache busting parameter to GET requests
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        };
      }
      
      // Add retry count to config
      config.retryCount = config.retryCount || 0;
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      console.log('Response received:', response.data);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle network errors with retry logic
      if (!error.response) {
        console.error('Network error:', error);
        
        // Retry the request if we haven't reached the maximum retries
        if (originalRequest.retryCount < MAX_RETRIES) {
          originalRequest.retryCount += 1;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * originalRequest.retryCount));
          
          console.log(`Retrying request (${originalRequest.retryCount}/${MAX_RETRIES})...`);
          return instance(originalRequest);
        }
        
        return Promise.reject(new Error('Network error. Please check your connection.'));
      }

      // Handle token refresh
      if (error.response.status === 401 && !publicRoutes.includes(originalRequest.url) && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await instance.post('/auth/refresh-token', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Update the Authorization header for all subsequent requests
            instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // Update the failed request's Authorization header
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            // Retry the original request
            return instance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create and export the API instance
const api = createApi();
export default api; 