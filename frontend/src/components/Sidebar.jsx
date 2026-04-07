import { Link } from 'react-router-dom'
import './Sidebar.css';

export default function Sidebar() {
  return (
    <nav className='nav-sidebar'>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/exercises">Exercises</Link></li>
        <li><Link to="/workouts">Workouts</Link></li>
      </ul>
    </nav>
  );
}