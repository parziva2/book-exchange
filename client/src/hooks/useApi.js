import { useState, useCallback } from 'react';
import api from '../utils/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const config = {
        method,
        url,
        ...options
      };

      if (data) {
        config.data = data;
      }

      const response = await api(config);
      return response.data;
    } catch (err) {
      console.error('API request failed:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'An unexpected error occurred';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, options = {}) => 
    request('GET', url, null, options), [request]);

  const post = useCallback((url, data, options = {}) => 
    request('POST', url, data, options), [request]);

  const put = useCallback((url, data, options = {}) => 
    request('PUT', url, data, options), [request]);

  const del = useCallback((url, options = {}) => 
    request('DELETE', url, null, options), [request]);

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    del
  };
};

export default useApi; 