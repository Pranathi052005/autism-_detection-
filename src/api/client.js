import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || ''),
  timeout: 120000, // 2 minutes default timeout for AI processing
});

// Request Interceptor
client.interceptors.request.use(
  (config) => {
    // Add Auth token from multiple possible keys
    const token = localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling, e.g., 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn("Unauthorized request.");
    }
    return Promise.reject(error);
  }
);

export default client;
