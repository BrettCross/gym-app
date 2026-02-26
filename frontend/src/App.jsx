import { useState } from 'react'

import LoginForm from '@components/LoginForm'
import ExerciseList from '@components/ExerciseList'
import './App.css'


function App() {
    //  [current state, func to update state], useState(0) sets count to 0
    const [isAuthd, setIsAuthd] = useState(false)

    const handleLogin = (auth_status) => {
      setIsAuthd(auth_status)
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
