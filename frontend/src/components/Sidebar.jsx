import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/exercises">Exercises</Link></li>
        <li><Link to="/routines">Routines</Link></li>
      </ul>
    </nav>
  );
}