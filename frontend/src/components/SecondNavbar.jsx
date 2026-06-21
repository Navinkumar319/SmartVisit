import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SecondNavbar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  // Render navigation links based on user role
  const renderLinks = () => {
    switch (role) {
      case 'ROLE_ADMIN':
        return (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
            <NavLink to="/visitors" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Visitor List</NavLink>
            <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Reports</NavLink>
            <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Manage Users</NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Settings</NavLink>
          </>
        );
      case 'ROLE_RECEPTION':
        return (
          <>
            <NavLink to="/register-visitor" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Register Visitor</NavLink>
            <NavLink to="/visitors" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Visitor List</NavLink>
          </>
        );
      case 'ROLE_SECURITY':
        return (
          <>
            <NavLink to="/security-desk" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Security Desk</NavLink>
            <NavLink to="/visitors" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Visitor List</NavLink>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="role-navbar">
      <div className="nav-links-container">
        {renderLinks()}
      </div>
    </nav>
  );
};

export default SecondNavbar;
