import { useState } from 'react'
import apiService from '@utils/apiService';


// const API_URL = "http://localhost:8000/token"

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await apiService.post('/token', {
      username: username,
      password: password
    }, {
      headers: {
        "Content-Type":"multipart/form-data"
      },
      withCredentials: true // Sends cookies/session
    });

    const token = response.data.access_token
    try {
      console.log(token)
      localStorage.setItem('jwtToken', token)
      onLogin(true)
    } catch (error) {
      console.error(error.response.data)
    }
  };
  
  return (
    <>
      <div className="container">
        <div className="login-container">
          <div className="title-container">
            <h1>Login</h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                id="username"
                name="username"
                placeholder="Enter Username"
                required=""
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                id="password"
                name="password"
                placeholder="Enter Password"
                required=""
              />
            </div>
            <div className="button-container">
              <button className="button" type="submit">
                Login
              </button>
            </div>
            {/* <div className="footer-options">
              <label>
                <input type="checkbox" defaultChecked="checked" name="remember" />{" "}
                Remember me
              </label>
              <span className="psw">
                <a href="#">Forgot password?</a>
              </span>
            </div> */}
          </form>
        </div>
      </div>
    </>
  )
}