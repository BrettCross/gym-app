import { useEffect, useState } from 'react'
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom'

import './App.css'
import apiService from './utils/apiService'
import Exercises from '@components/Exercises'
import Home from '@components/Home'
import Layout from '@components/layout'
import LoginForm from '@components/LoginForm'
import Workouts from '@components/Workouts'
import RegisterForm from './components/RegisterForm'
import WorkoutDetail from './components/WorkoutDetail'


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

    const navigate = useNavigate();

    const handleLogin = (auth_status) => {
      setIsAuthd(auth_status);
      navigate('/')
    }

  if (isLoading) {
    return (null);
  }

  return (
    <>
      <Routes>
        {isAuthd ? (
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/exercises' element={<Exercises />} />
            <Route path='/workouts' element={<Workouts />} />
            <Route path='/workouts/:id' element={<WorkoutDetail />} />
          </Route>
        ) : (
          <Route path='*' element={<Navigate to='/login' />} />
        )}
        <Route path='/login' element={<LoginForm onLogin={handleLogin} />} />
        <Route path='/register' element={<RegisterForm onLogin={handleLogin} />} />
      </Routes>
    </>
  )
}

export default App
