import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Lock, User, Eye, EyeOff, Building, Users } from 'lucide-react';
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
      {/* Left Screen: Branding & About Website */}
      <div className="auth-illustration-side">
        <div className="illustration-logo-row">
          <img src={logoImg} alt="SmartVisitor Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          <span className="illustration-title">SmartVisitor</span>
        </div>

        <div className="illustration-main-text">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontSize: '32px', marginBottom: '16px' }}
          >
            About SmartVisitor
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '28px', color: 'rgba(255, 255, 255, 0.8)' }}
          >
            The Smart Visitor Management System (SVMS) is an enterprise digital logbook designed to manage, track, and secure visitor flows in real-time. It ensures safety and operational efficiency across corporate gates.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                <Users size={18} />
              </div>
              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600' }}>Quick Visitor Check-In</h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12.5px', marginTop: '2px', lineHeight: '1.4' }}>Seamlessly record visitor logs, capture digital photos, and process host approvals quickly.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                <Shield size={18} />
              </div>
              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600' }}>Real-time Security Tracking</h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12.5px', marginTop: '2px', lineHeight: '1.4' }}>Monitor active visitors, print badges, flag overstays, and maintain complete digital audit trails.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                <Building size={18} />
              </div>
              <div>
                <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600' }}>Role-based Access & Dashboards</h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12.5px', marginTop: '2px', lineHeight: '1.4' }}>Provide specialized views for security officers, admins, and hosts to streamline approvals.</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', zIndex: 10 }}>
          &copy; {new Date().getFullYear()} SVMS. All rights reserved.
        </div>
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
