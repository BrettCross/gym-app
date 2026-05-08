/**
 * Layout.jsx
 * 
 * The primary application shell. 
 * Provides a persistent Sidebar for navigation and a main content area 
 * that swaps out different pages based on the current route.
 */

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