import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SystemService from '../services/system.service';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVisitors: 0,
    visitorsToday: 0,
    checkedInVisitors: 0,
    checkedOutVisitors: 0,
    pendingApprovals: 0,
    rejectedVisitors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await SystemService.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-4">Loading metrics...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <h2>Dashboard Overview</h2>
        <p>Welcome back, <strong>{user?.fullName}</strong>. Quick overview of the visitor logs.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="dashboard-cards-grid">
        {/* Total Visitors */}
        <div className="stat-card" onClick={() => navigate('/visitors')}>
          <div className="stat-icon icon-total">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 8 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.totalVisitors}</span>
            <span className="stat-label">Total Visitors</span>
          </div>
        </div>

        {/* Visitors Today */}
        <div className="stat-card" onClick={() => navigate('/visitors?date=' + new Date().toISOString().split('T')[0])}>
          <div className="stat-icon icon-today">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.visitorsToday}</span>
            <span className="stat-label">Visitors Today</span>
          </div>
        </div>

        {/* Checked-In Visitors */}
        <div className="stat-card" onClick={() => navigate('/visitors')}>
          <div className="stat-icon icon-checkedin">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.checkedInVisitors}</span>
            <span className="stat-label">Checked-In</span>
          </div>
        </div>

        {/* Checked-Out Visitors */}
        <div className="stat-card" onClick={() => navigate('/visitors')}>
          <div className="stat-icon icon-checkedout">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.checkedOutVisitors}</span>
            <span className="stat-label">Checked-Out</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="stat-card" onClick={() => navigate('/visitors?status=PENDING')}>
          <div className="stat-icon icon-pending">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 11h-2V7h2v6zm0 4h-2v-2h2v2z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.pendingApprovals}</span>
            <span className="stat-label">Pending Approvals</span>
          </div>
        </div>

        {/* Rejected Visitors */}
        <div className="stat-card" onClick={() => navigate('/visitors')}>
          <div className="stat-icon icon-rejected">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.rejectedVisitors}</span>
            <span className="stat-label">Rejected Visitors</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
