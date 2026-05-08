/**
 * LoginForm.jsx
 * 
 * Handles user authentication via the OAuth2 Password Flow.
 * Communicates with the /token endpoint to retrieve a JWT access token.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '@utils/apiService';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const { login } = useAuth();

  // Local state for form inputs and UI feedback
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Form Submission Handler
   * 
   * Uses FormData to comply with the OAuth2 standard expected 
   * by the FastAPI backend.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Prepare the payload as form-data per OAuth2 specification
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    try {
      const response = await apiService.post('/token', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Extract the access token and update global Auth state
      const { access_token } = response.data;
      login(access_token);
    } catch (err) {
      // Handle server-side validation or credential errors
      const message = err.response?.data?.detail || "Invalid username or password";
      setError(message);
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <div className="container">
        <div className="login-container">
          <div className="title-container">
            <h1>Login</h1>
          </div>

          {/* Display errors to the user, not just the console! */}
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Username"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter Password"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="button-container">
              <button 
                className="button" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </div>

            <div className="footer-options">
              <p>Don't have an account?</p>
              <Link to='/register'>Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}