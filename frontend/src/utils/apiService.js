/**
 * apiService.js
 * 
 * Centralized Axios instance for all API communication.
 * 
 * Features:
 * - Environment Awareness: Dynamically sets baseURL via Vite environment variables.
 * - Global Interceptors: Automates JWT injection and error handling.
 * - Cross-Origin Security: Configured with 'withCredentials' for future cookie-based auth.
 * - Reactive Error Handling: Emits 'unauthorized-logout' events to trigger global state resets.
 */

import axios from 'axios';

const apiService = axios.create({
  // Use VITE_API_URL for production/docker, fallback to localhost for development
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  // Required for sharing cookies/session headers across origins
  withCredentials: true,
});

/**
 * Request Interceptor
 * 
 * Automatically injects the JWT access token into the Authorization header
 * for every outgoing request.
 */
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * 
 * Acts as a global safety net for API responses. If the backend returns 
 * 401 Unauthorized, it signals the AuthProvider to perform a clean logout.
 */
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');

      // Dispatch a global event that the AuthContext listener is tuned to
      window.dispatchEvent(new Event('unauthorized-logout'));
    }
    return Promise.reject(error);
  }
);

export default apiService;
