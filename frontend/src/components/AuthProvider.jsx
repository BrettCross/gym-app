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

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import apiService from "../utils/apiService";
import { AuthContext } from "../context/AuthContext";

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const logoutTimer = useRef(null);
  
  const navigate = useNavigate();

  /**
   * Unified Logout Logic
   * 
   * Clears all local state and tokens. Wrapped in useCallback to provide 
   * a stable reference for other hooks and event listeners.
   */
  const logout = useCallback(() => {
    // TODO: use cookie instead of local storage
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    navigate('/login')
  }, [navigate]);

  /**
   * Reactive Security Listener
   * 
   * Attaches a global event listener to catch 401 Unauthorized signals 
   * from the apiService interceptor.
   */
  useEffect(() => {
    window.addEventListener('unauthorized-logout', logout);
    return () => window.removeEventListener('unauthorized-logout', logout);
  }, [logout]);

  /**
   * Proactive Auto-Logout Timer
   * 
   * Decodes the JWT expiration claim and schedules a logout event.
   * This ensures the UI reflects the token state without needing an API hit.
   */
  const setAutoLogout = useCallback((token) => {
    try {
      const { exp } = jwtDecode(token);
      const delay = (exp * 1000) - Date.now();

      // Clear existing timer if setting a new one (e.g., manual refresh)
      if (logoutTimer.current) clearTimeout(logoutTimer.current);

      if (delay > 0) {
        logoutTimer.current = setTimeout(() => {
          console.log("Token expired! Logging out...");
          logout();
        }, delay);
      } else {
        // If token is already expired, log out immediately
        logout();
      }
    } catch (error) {
      logout();
      console.error("Invalid token format", error);
    }
  }, [logout]);

  /**
   * Initialization & Session Recovery
   * 
   * Runs on app startup to verify if a stored token is still valid with the backend.
   */
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('access_token'); 
      if (token) {
        try {
          // Confirm token is valid with server
          await apiService.get('/users/me');
          setIsLoggedIn(true);
          setAutoLogout(token);
        } catch (error) {
          console.log(error);
          logout();
        }
      }
      setIsLoading(false);
    };
    verifyAuth();
  }, [logout, setAutoLogout]);

  /**
   * Login Handler
   * 
   * Stores the token, updates state, and kicks off the proactive logout timer.
   */
  const login = (token) => {
    // TODO: use cookie instead of local storage
    localStorage.setItem('access_token', token);
    setIsLoggedIn(true);
    setAutoLogout(token);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isLoading, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}