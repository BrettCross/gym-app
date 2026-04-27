import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../utils/apiService";
import { AuthContext } from "../context/AuthContext";

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true)
  
  const navigate = useNavigate();

    useEffect(() => {
      const verifyAuth = async () => {
        const token = localStorage.getItem('jwtToken'); 
        if (token) {
          try {
            await apiService.get('/users/me');
            setIsLoggedIn(true);
          } catch (error) {
            console.log(error);
            localStorage.removeItem('jwtToken');
            setIsLoggedIn(false);
          }
        }
        setIsLoading(false);
      };
      verifyAuth();
    }, []);

    const logout = () => {
      // TODO: use cookie instead of local storage
      localStorage.removeItem('jwtToken');
      setIsLoggedIn(false);
      navigate('/login')
    };

    const login = (token) => {
      // TODO: use cookie instead of local storage
      localStorage.setItem('jwtToken', token);
      setIsLoggedIn(true);
      navigate('/');
    };

    return (
      <AuthContext.Provider value={{ isLoading, isLoggedIn, login, logout }}>
        {children}
      </AuthContext.Provider>
    );
}