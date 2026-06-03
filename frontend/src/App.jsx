import { useState, useEffect } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'

import './App.css'
import Exercises from '@components/Exercises'
import Home from '@components/Home'
import Layout from '@components/layout'
import LoginForm from '@components/LoginForm'
import Workouts from '@components/Workouts'
import RegisterForm from './components/RegisterForm'
import WorkoutDetail from './components/WorkoutDetail'
import ActiveSession from './components/ActiveSession'
import SessionHistory from './components/SessionHistory'
import SessionDetail from './components/SessionDetail'
import { useAuth } from './context/AuthContext'
import apiService from './utils/apiService'
import UserManagement from './components/UserManagement'


function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  // redirect non-admins
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children;
}

export default function App() {
  const { isLoggedIn, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  // Check API connectivity
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkPing = async () => {
      try {
        await apiService.get('/ping');
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
        console.error("Could not connect to API:", error.resonse?.data);
      }
    };

    // Check once immediately, then every 60 seconds
    checkPing();
    const interval = setInterval(checkPing, 60000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  if (isLoading) {
    return <div>Loading your gym data...</div>; 
  }

  return (
    <>
      {!isOnline && (
        <div className="offline-banner">
          Connection lost. Progress will be saved locally.
        </div>
      )}
      <Routes>
        {isLoggedIn ? (
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
            <Route path='/exercises' element={<Exercises />} />
            <Route path='/workouts' element={<Workouts />} />
            <Route path='/workouts/:id' element={<WorkoutDetail />} />
            <Route path='/session/:sessionID' element={<ActiveSession />} />
            <Route path='/sessions/' element={<SessionHistory />} />
            <Route path='/sessions/:id' element={<SessionDetail />} />
            <Route 
              path='/admin/users' 
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } 
            />
          </Route>
        ) : (
          <Route path='*' element={<Navigate to='/login' />} />
        )}
        <Route path='/login' element={<LoginForm />} />
        <Route path='/register' element={<RegisterForm />} />
      </Routes>
    </>
  )
}
