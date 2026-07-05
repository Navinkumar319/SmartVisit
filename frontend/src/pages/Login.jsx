import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Lock, User, Eye, EyeOff, Building, Users, Calendar } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      if (result.role === 'ROLE_ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/visitors');
      }
    } else {
      setError(result.message);
    }
  };

  const handleForgotPassword = () => {
    alert('Please contact your System Administrator to reset your password.');
  };

  return (
    <div className="auth-split-layout">
      {/* Left Screen: Branding & Slogan Illustration */}
      <div className="auth-illustration-side">
        <div className="illustration-logo-row">
          <Shield size={32} style={{ color: 'var(--accent)' }} />
          <span className="illustration-title">SmartVisitor AI</span>
        </div>

        <div className="illustration-main-text">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Securing Corporate Gates with AI.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Manage check-ins, approvals, identity verification, and access logs dynamically through our unified SaaS platform.
          </motion.p>
        </div>

        {/* Stats Mockups */}
        <motion.div 
          className="illustration-stats-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="illustration-stat-item">
            <Users size={20} style={{ color: 'var(--accent)', marginBottom: '4px' }} />
            <span className="illustration-stat-val">1.2k+</span>
            <span className="illustration-stat-lbl">Daily Visits</span>
          </div>
          <div className="illustration-stat-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
            <Calendar size={20} style={{ color: 'var(--accent)', marginBottom: '4px' }} />
            <span className="illustration-stat-val">99.9%</span>
            <span className="illustration-stat-lbl">Uptime</span>
          </div>
          <div className="illustration-stat-item">
            <Building size={20} style={{ color: 'var(--accent)', marginBottom: '4px' }} />
            <span className="illustration-stat-val">50+</span>
            <span className="illustration-stat-lbl">Departments</span>
          </div>
        </motion.div>
      </div>

      {/* Right Screen: Form Panel */}
      <div className="auth-form-side">
        <motion.div 
          className="auth-wrapper"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="auth-box">
            <div className="auth-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <img src={logoImg} alt="SVMS Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
            </div>
            
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Enter details to log in to your portal</p>
            </div>

            {error && <div className="auth-error-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    style={{ paddingLeft: '44px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '13.5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  Remember Me
                </label>
                <button type="button" onClick={handleForgotPassword} className="forgot-password-link">
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Signing In...' : 'Login'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
