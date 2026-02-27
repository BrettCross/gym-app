import { useEffect, useState } from 'react'

import LoginForm from '@components/LoginForm'
import ExerciseList from '@components/ExerciseList'
import './App.css'
import apiService from './utils/apiService'


function App() {
    //  [current state, func to update state], useState(0) sets count to 0
    const [isAuthd, setIsAuthd] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      const verifyAuth = async () => {
        const token = localStorage.getItem('jwtToken'); 
        if (token) {
          try {
            await apiService.get('/users/me');
            setIsAuthd(true);
          } catch (error) {
            console.log(error);
            localStorage.removeItem('jwtToken');
            setIsAuthd(false);
          }
        }
        setIsLoading(false);
      };
      verifyAuth();
    }, []);

    const handleLogin = (auth_status) => {
      setIsAuthd(auth_status)
    }

  if (isLoading) {
    return (null);
  }

  return (
    <>
      {isAuthd ? 
      (<ExerciseList />) :
      (<LoginForm onLogin={handleLogin} />)}
      {/* <ExerciseList /> */}
    </>
  )
}

export default App
