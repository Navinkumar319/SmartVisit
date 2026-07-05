import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import defaultLogo from '../assets/logo.png';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { 
  Bell, 
  Sun, 
  Moon, 
  ChevronDown, 
  LogOut, 
  User, 
  Shield,
  Menu,
  X,
  LayoutDashboard, 
  Users, 
  BarChart3, 
  UserCog, 
  Settings, 
  UserPlus, 
  ShieldCheck 
} from 'lucide-react';

const formatLogoSrc = (logo) => {
  if (!logo) return '';
  if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/')) {
    return logo;
  }
  return `data:image/png;base64,${logo}`;
};

const Header = ({ companyName, companyLogo, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Dropdown UI States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Refs for clicking outside dropdowns to close them
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatRole = (role) => {
    if (!role) return '';
    return role.replace('ROLE_', '');
  };

  // Mock Notifications
  const notifications = [
    { id: 1, title: 'New Visitor Registration', text: 'Sarah Connor registered for IT Dept.', time: '2 mins ago', unread: true },
    { id: 2, title: 'Visitor Checked-In', text: 'Bruce Wayne arrived at Gate 2.', time: '10 mins ago', unread: true },
    { id: 3, title: 'Overstay Alert', text: 'Clark Kent has been inside for 8+ hours.', time: '1 hr ago', unread: false },
    { id: 4, title: 'Approval Request', text: 'Peter Parker pending manager signoff.', time: '2 hrs ago', unread: false },
  ];

  // Role Navigation Links Configuration
  const linksMap = {
    ROLE_ADMIN: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/visitors', label: 'Visitor Records', icon: Users },
      { to: '/reports', label: 'Reports Scope', icon: BarChart3 },
      { to: '/users', label: 'User Accounts', icon: UserCog },
      { to: '/settings', label: 'System Settings', icon: Settings },
    ],
    ROLE_RECEPTION: [
      { to: '/register-visitor', label: 'Register Visitor', icon: UserPlus },
      { to: '/visitors', label: 'Visitor Logs', icon: Users },
    ],
    ROLE_SECURITY: [
      { to: '/security-desk', label: 'Security Workspace', icon: ShieldCheck },
      { to: '/visitors', label: 'Visitor Logs', icon: Users },
    ],
  };

  const links = user ? (linksMap[user.role] || []) : [];

  return (
    <header className="top-header">
      <div className="header-inner">
        {/* 1. Left Section: Brand Logo & Name */}
        <div className="header-left">
          {/* Company Brand Logo & Name */}
          <div className="brand-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {companyLogo ? (
              <img 
                src={formatLogoSrc(companyLogo)} 
                alt="Logo" 
                style={{ height: '32px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} 
              />
            ) : (
              <img 
                src={defaultLogo} 
                alt="Logo" 
                style={{ height: '32px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} 
              />
            )}
            <span className="system-title">
              {companyName || 'SVMS'}
            </span>
          </div>

          {user && (
            <button 
              className="hamburger-btn no-print" 
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              title="Toggle Menu"
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* 2. Middle Section: Centered Top Navigation (Dynamic by Role) */}
        {user && (
          <nav className={`top-nav-container ${isMobileOpen ? 'open' : ''} no-print`}>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to || (link.to === '/visitors' && location.pathname.startsWith('/visitors/'));

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileOpen(false)}
                  className={isActive ? 'top-nav-link active' : 'top-nav-link'}
                >
                  <Icon size={15} className="link-icon" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}

        {/* 3. Right Section: Theme switch, Notifications, and Profile */}
        <div className="header-right no-print">
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme} 
            className="header-action-btn" 
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {user && (
            <>
              {/* Profile Dropdown */}
              <div className="user-profile-summary" ref={profileRef} onClick={() => setIsProfileOpen(prev => !prev)}>
                <div className="profile-avatar" style={{ overflow: 'hidden' }}>
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="profile-details">
                  <span className="profile-name">{user.fullName}</span>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />

                {isProfileOpen && (
                  <div className="search-results-box" style={{ position: 'absolute', right: 0, top: '48px', width: '200px', zIndex: 1000, margin: 0, padding: 0 }}>
                    <div style={{ padding: '14px', borderBottom: '1px solid var(--border-soft)', background: 'var(--primary-light)' }}>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: 'var(--text-dark)' }}>{user.fullName}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>{user.email || 'user@system.com'}</p>
                    </div>
                    <div style={{ padding: '4px' }}>
                      <div 
                        className="search-result-item" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: 'var(--danger)', fontSize: '12.5px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout();
                        }}
                      >
                        <LogOut size={14} />
                        Log Out
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!user && location.pathname !== '/login' && (
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12.5px' }}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
