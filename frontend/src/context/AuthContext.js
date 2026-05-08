/**
 * AuthContext.js
 * Defines the context and a custom hook for managing 
 * authentication state throughout the application.
 */

import { createContext, useContext } from "react";

/**
 * The raw Context object. 
 * This is exported primarily so that the AuthProvider (defined elsewhere) 
 * can provide the actual values (user, login, logout, etc.).
 */
export const AuthContext = createContext();

/**
 * useAuth Custom Hook
 * 
 * Provides a convenient way for functional components to consume the 
 * authentication context.
 * 
 * @returns {Object} The current context value (e.g., { user, login, logout })
 * @example
 * const { user, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Safety check: Ensure the hook is being used within an AuthProvider
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}