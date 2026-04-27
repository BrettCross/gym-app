import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';

import './Sidebar.css';

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <nav className='nav-sidebar'>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/exercises">Exercises</Link></li>
        <li><Link to="/workouts">Workouts</Link></li>
        <li><Link to="/sessions">Sessions</Link></li>
        <li><button className="button-5" onClick={logout}>Logout</button></li>
      </ul>
    </nav>
  );
}