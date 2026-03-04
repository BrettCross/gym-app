import { useState } from "react";
import { Link } from "react-router-dom";
import apiService from "@utils/apiService";

export default function RegisterForm({ onLogin }) {
  const [user, setUser] = useState(
    {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: ""
    }  
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullName = `${user.firstName} ${user.lastName}`;
    
    const response = await apiService.post('/users', {
      email: user.email,
      username: user.username,
      password: user.password,
      full_name: fullName
    });
    console.log(response);
    
    if (response.status == 201) {
      const tokenResponse = await apiService.post('/token', {
        username: user.username,
        password: user.password
      }, {
        headers: {
          "Content-Type":"multipart/form-data"
        },
        withCredentials: true // Sends cookies/session
      });

      const token = tokenResponse.data.access_token;
      try {
        console.log(token)
        localStorage.setItem('jwtToken', token)
        onLogin(true)
      } catch (error) {
        console.error(error.response.data)
      }
    }

    // if successful, log them in
    // call post('/token') -> store token -> onLogin(true)
  };

  return (
    <>
      <div className="container">
        <div className="login-container">
          <div className="title-container">
            <h1>Register</h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="Name">Name</label>
              <input
                type="text"
                value={user.firstName} 
                onChange={(e) => setUser({...user, firstName: e.target.value})} 
                id="first_name"
                name="first_name"
                placeholder="First Name"
                required=""
              />
              <input
                type="text"
                value={user.lastName} 
                onChange={(e) => setUser({...user, lastName: e.target.value})} 
                id="last_name"
                name="last_name"
                placeholder="Last Name (optional)"
              />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                value={user.email} 
                onChange={(e) => setUser({...user, email: e.target.value})} 
                id="email"
                name="email"
                placeholder="Enter an Email"
                required=""
              />
            </div>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                value={user.username} 
                onChange={(e) => setUser({...user, username: e.target.value})} 
                id="username"
                name="username"
                placeholder="Enter a Username"
                required=""
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                value={user.password} 
                onChange={(e) => setUser({...user, password: e.target.value})} 
                id="password"
                name="password"
                placeholder="Enter a Password"
                required=""
              />
            </div>
            <div className="button-container">
              <button className="button" type="submit">
                Sign Up
              </button>
            </div>
            <div className="footer-options">
              <p>Already have an account?</p>
              <Link to='/login'>Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}