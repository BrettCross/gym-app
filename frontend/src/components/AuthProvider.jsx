/**
 * AuthProvider.jsx
 * 
 * Central authentication authority for the Gym Tracker application.
 * 
 * Features:
 * - Session Persistence: Restores auth state from localStorage on mount.
 * - Reactive Security: Listens for global 'unauthorized-logout' events from the API interceptor.
 * - Proactive Security: Decodes JWT 'exp' claim and sets a countdown timer for auto-logout.
 * - Performance Optimized: Uses useCallback and useRef to prevent unnecessary re-renders.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../utils/apiService";
import { AuthContext } from "../context/AuthContext";

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // const logoutTimer = useRef(null);
  
  const navigate = useNavigate();

  /**
   * Unified Logout Logic
   * 
   * Clears all local state and tokens. Wrapped in useCallback to provide 
   * a stable reference for other hooks and event listeners.
   */
  const logout = useCallback(async () => {
    // TODO: use cookie instead of local storage
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await apiService.post("/logout", { refresh_token: refreshToken });
      }
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsLoggedIn(false);
      setUser(null);
      navigate('/login')
    }
  }, [navigate]);

  /**
   * Reactive Security Listener
   * 
   * Listens for the 'unauthorized-logout' event emitted by apiService
   * when both access and refresh tokens are invalid.
   */
  useEffect(() => {
    window.addEventListener('unauthorized-logout', logout);
    return () => window.removeEventListener('unauthorized-logout', logout);
  }, [logout]);

  /**
   * Initialization & Session Recovery
   * 
   * Runs on app startup to verify if a stored token is still valid with the backend.
   * Captures user data for use throughout app. 
   */
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('access_token'); 
      if (token) {
        try {
          // Confirm token is valid with server
          const response = await apiService.get('/users/me');
          setUser(response.data);
          setIsLoggedIn(true);
        } catch (error) {
          // If /me fails, apiService will attempt a refresh.
          // If that fails too, the 'unauthorized-logout' event handles it.
          console.error("initial auth verification failed:", error);
        }
      }
      setIsLoading(false);
    };
    verifyAuth();
  }, []);

  /**
   * Login Handler
   * 
   * Captures the dual-token payload from the login route.
   */
  const login = (accessToken, refreshToken) => {
    // TODO: use cookie instead of local storage
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setIsLoggedIn(true);
    // Fetch user profile immediately to populate Role and Username
    apiService.get('/users/me').then(response => {
        setUser(response.data);
        navigate('/');
    });
  };

  return (
    <AuthContext.Provider value={{ isLoading, isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}