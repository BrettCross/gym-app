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
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
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
 * Implements a silent refresh loop: on 401, it attempts to rotate tokens 
 * and retry the original request once before logging the user out.
 */
apiService.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh for this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error("No refresh token available");

        // Attempt to rotate tokens via the backend refresh endpoint
        const { data } = await axios.post(`${apiService.defaults.baseURL}/refresh`, {
          refresh_token: refreshToken,
        });

        // Security: Store the newly rotated pair
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Update the original request header and retry it
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        return apiService(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails, the session is dead; perform a clean logout
        // localStorage.removeItem('access_token');
        // localStorage.removeItem('refresh_token');
        localStorage.clear();
        window.dispatchEvent(new Event('unauthorized-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiService;
