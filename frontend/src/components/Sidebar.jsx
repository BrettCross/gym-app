/**
 * @file Sidebar.jsx
 * @description Persistent navigation menu.
 * Uses NavLink to provide automatic "active" styling for current routes.
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ className }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

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
        
        {isAdmin && (
          <div className="admin-nav-group">
            <hr className="nav-divider" />
            <span className="nav-label">Admin</span>
            <li>
              <NavLink to="/admin/users">User Management</NavLink>
            </li>
          </div>
        )}
      </ul>
      
      
      <div className="sidebar-footer">
        <button className="button-5" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}