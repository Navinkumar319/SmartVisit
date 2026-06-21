import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const formatLogoSrc = (logo) => {
  if (!logo) return '';
  if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/')) {
    return logo;
  }
  return `data:image/png;base64,${logo}`;
};

const Header = ({ companyName, companyLogo }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatRole = (role) => {
    if (!role) return '';
    return role.replace('ROLE_', '');
  };

  return (
    <header className="top-header">
      <div className="header-left">
        {companyLogo ? (
          <img src={formatLogoSrc(companyLogo)} alt="Logo" className="company-logo" />
        ) : (
          <div className="default-logo-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
        )}
        <span className="system-title">{companyName || 'Smart Visitor Management System'}</span>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-profile-summary">
            <div className="profile-avatar">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-details">
              <span className="profile-name">{user.fullName}</span>
              <span className="profile-role-badge">{formatRole(user.role)}</span>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className="header-logout-btn" title="Logout Session">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
