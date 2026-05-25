/**
 * RegisterForm.jsx
 * 
 * Handles new user registration. Upon successful account creation,
 * it automatically authenticates the user to provide a seamless UX.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '@utils/apiService';
import { useAuth } from '../context/AuthContext'


export default function RegisterForm() {
  const { login } = useAuth();

  // Grouped state for the registration form
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    
    try {
      // Create the account
      const response = await apiService.post('/register', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        full_name: fullName
      });

      if (response.status === 201) {
        // Auto-login after successful registration
        const loginData = new FormData();
        loginData.append('username', formData.username);
        loginData.append('password', formData.password);

        const tokenResponse = await apiService.post('/token', loginData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        const { access_token } = tokenResponse.data;
        login(access_token);
      }

    } catch (err) {
      const message = err.response?.data?.detail || "Registration failed. Please try again."
      setError(message);
      setIsSubmitting(false); 
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="container">
        <div className="login-container">
          <div className="title-container">
            <h1>Create Account</h1>
          </div>

          { error && <div className="error-banner">{error}</div> }

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="Name">Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName} 
                onChange={handleChange} 
                placeholder="First Name"
                required
                disabled={isSubmitting}
              />
              <br/>
              <input
                type="text"
                name="lastName"
                value={formData.lastName} 
                onChange={handleChange} 
                placeholder="Last Name"
                disabled={isSubmitting}
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email} 
                onChange={handleChange} 
                placeholder="gym@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username} 
                onChange={handleChange} 
                placeholder="Choose a Username"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Create a Password"
                required
                disabled={isSubmitting}
              />
            </div>

            <button 
              className="button" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="footer-options">
              <p>Already have an account?</p>
              <Link to='/login'>Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}