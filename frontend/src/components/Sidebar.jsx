/**
 * @file Sidebar.jsx
 * @description Persistent navigation menu.
 * Uses NavLink to provide automatic "active" styling for current routes.
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

// Pass 'className' as a prop so the Layout can style the sidebar's position
export default function Sidebar({ className }) {
  const { logout } = useAuth();

  return (
    <nav className={`${className} nav-sidebar`}>
      <div className="sidebar-logo">
        <h2>GymTracker</h2>
      </div>
      <ul>
        <li>
          <NavLink to="/" end>Home</NavLink>
        </li>
        <li>
          <NavLink to="/exercises">Exercises</NavLink>
        </li>
        <li>
          <NavLink to="/workouts">Workouts</NavLink>
        </li>
        <li>
          <NavLink to="/sessions">Sessions</NavLink>
        </li>
      </ul>
      
      <div className="sidebar-footer">
        <button className="button-5" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}