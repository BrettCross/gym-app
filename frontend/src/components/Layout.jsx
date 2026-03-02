import { Outlet } from 'react-router-dom';
import Sidebar from "./Sidebar";
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout-container">
      <Sidebar className="sidebar" />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}