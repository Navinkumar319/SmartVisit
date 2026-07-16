import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SystemService from '../services/system.service';
import VisitorService from '../services/visitor.service';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlowCard from '../components/GlowCard';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp
} from 'lucide-react';


const parseCheckinTime = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+(am|pm)$/i);
  if (!parts) return new Date(timeStr);
  let [, year, month, day, hours, minutes, seconds, ampm] = parts;
  let hrs = parseInt(hours, 10);
  if (ampm.toLowerCase() === 'pm' && hrs < 12) hrs += 12;
  if (ampm.toLowerCase() === 'am' && hrs === 12) hrs = 0;
  return new Date(year, month - 1, day, hrs, minutes, seconds);
};

const getOverstayingVisitors = (visitors) => {
  return visitors.filter((v) => {
    if (v.status !== 'CHECKED_IN' || !v.checkinTime) return false;
    const checkinDate = parseCheckinTime(v.checkinTime);
    return checkinDate ? ((new Date() - checkinDate) / 3600000) >= 8.0 : false;
  });
};



const getOverstayDurationText = (timeStr) => {
  const date = parseCheckinTime(timeStr);
  if (!date) return '0 min';
  const diffMs = new Date() - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `${diffMins} min`;
  }
  return `${(diffMins / 60).toFixed(1)} hrs`;
};

const formatCleanDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(month, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${day} ${months[mIdx]} ${year}`;
    }
  }
  return dateStr;
};

const formatCleanMobile = (mobileStr) => {
  if (!mobileStr) return 'N/A';
  const cleaned = mobileStr.replace(/\s+/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return mobileStr;
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'PENDING': return 'badge badge-warning';
    case 'APPROVED': return 'badge badge-success';
    case 'REJECTED': return 'badge badge-danger';
    case 'CHECKED_IN': return 'badge badge-info';
    case 'CHECKED_OUT': return 'badge badge-dark';
    default: return 'badge';
  }
};

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
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [compilationRecords, setCompilationRecords] = useState([]);
  const [loadingCompilations, setLoadingCompilations] = useState(true);
  const [error, setError] = useState('');
  const [overstayingVisitors, setOverstayingVisitors] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsData, visitorsData, aiMatchesData] = await Promise.all([
          SystemService.getDashboardStats(),
          VisitorService.getAllVisitors(),
          SystemService.getReportData('ai_matches')
        ]);
        setStats(statsData);
        setOverstayingVisitors(getOverstayingVisitors(visitorsData));
        setCompilationRecords(aiMatchesData);

        const activities = [];
        visitorsData.forEach(v => {
          if (v.checkinTime && v.checkinTime !== 'N/A') {
            const dateObj = parseCheckinTime(v.checkinTime);
            activities.push({
              key: `${v.visitorId}-in`,
              id: v.visitorId,
              code: v.visitorCode,
              name: v.name,
              host: v.personToMeet,
              dept: v.department,
              purpose: v.purpose,
              status: 'CHECKED_IN',
              time: v.checkinTime,
              timestamp: dateObj ? dateObj.getTime() : v.visitorId
            });
          }
          if (v.checkoutTime && v.checkoutTime !== 'N/A') {
            const dateObj = parseCheckinTime(v.checkoutTime);
            activities.push({
              key: `${v.visitorId}-out`,
              id: v.visitorId,
              code: v.visitorCode,
              name: v.name,
              host: v.personToMeet,
              dept: v.department,
              purpose: v.purpose,
              status: 'CHECKED_OUT',
              time: v.checkoutTime,
              timestamp: dateObj ? dateObj.getTime() : (v.visitorId + 0.5)
            });
          }
        });

        // Sort by timestamp descending (latest first)
        activities.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivities(activities.slice(0, 5));
      } catch (err) {
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
        setLoadingActivities(false);
        setLoadingCompilations(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Loading metrics...</div>;

  return (
    <div className="page-wrapper" style={{ animation: 'fadeIn 0.6s ease' }}>
      <div className="page-header-row">
        <div>
          <h2>Dashboard Overview</h2>
          <p>Welcome back, <strong>{user?.fullName}</strong>. Quick overview of the visitor logs.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Consolidated System Alerts & Notifications Banner */}
      {(overstayingVisitors.length > 0 || compilationRecords.length > 0) && (
        <GlowCard 
          className="alert-glow-card glow-danger"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', fontSize: '15px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>System Alerts & Notifications</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
            {/* 1. Overstay Warning Section */}
            {overstayingVisitors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  ⏳ Visitor Overstay Alert ({overstayingVisitors.length})
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  The following visitor(s) have been checked in for longer than expected. Please check them out:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                  {overstayingVisitors.map(v => (
                    <div 
                      key={v.visitorId}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        background: 'var(--bg-card)',
                        padding: '12px 18px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: 'var(--primary)', fontSize: '13.5px' }}>{v.visitorCode}</strong>
                          <span style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '13.5px' }}>{v.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span>👤 <strong>Host:</strong> {v.personToMeet} ({v.department})</span>
                          <span>🏢 <strong>Purpose:</strong> {v.purpose}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          Inside: {getOverstayDurationText(v.checkinTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider line if both are present */}
            {overstayingVisitors.length > 0 && compilationRecords.length > 0 && (
              <div style={{ height: '1px', background: 'rgba(239, 68, 68, 0.1)', margin: '4px 0' }}></div>
            )}

            {/* 2. AI Matches Warning Section */}
            {compilationRecords.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  ✨ Data Integrity Warning: AI Matches Detected ({compilationRecords.length})
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  We detected duplicate visitor records with identical mobile numbers or email addresses:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                  {compilationRecords.map(v => (
                    <div 
                      key={v.visitorId}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        background: 'var(--bg-card)',
                        padding: '12px 18px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#ef4444', fontSize: '13.5px' }}>{v.visitorCode}</strong>
                          <span style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '13.5px' }}>{v.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {v.mobile && <span>📞 <strong>Mobile:</strong> {formatCleanMobile(v.mobile)}</span>}
                          {v.email && <span>✉️ <strong>Email:</strong> {v.email}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', marginTop: '2px' }}>
                          <span style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                            {v.matchReason}
                          </span>
                          <span style={{ color: 'var(--text-light)' }}>•</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Matched with: <strong style={{ color: 'var(--text-dark)' }}>{v.matchedWithCode}</strong>
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/visitors/${v.visitorId}`)}
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlowCard>
      )}

      {/* 6 Metric Statistics Cards with Animations */}
      <div className="dashboard-cards-grid">
        {/* Total Visitors */}
        <GlowCard 
          className="stat-card glow-primary" 
          onClick={() => navigate('/visitors')}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon icon-total">
            <Users size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.totalVisitors}</span>
            <span className="stat-label">Total Visitors</span>
          </div>
        </GlowCard>

        {/* Visitors Today */}
        <GlowCard 
          className="stat-card glow-info" 
          onClick={() => navigate('/visitors?date=' + new Date().toISOString().split('T')[0])}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon icon-today">
            <TrendingUp size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.visitorsToday}</span>
            <span className="stat-label">Visitors Today</span>
          </div>
        </GlowCard>

        {/* Checked In */}
        <GlowCard 
          className="stat-card glow-success" 
          onClick={() => navigate('/visitors?status=CHECKED_IN')}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon icon-checkedin">
            <CheckCircle size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.checkedInVisitors}</span>
            <span className="stat-label">Checked-In</span>
          </div>
        </GlowCard>

        {/* Checked Out */}
        <GlowCard 
          className="stat-card glow-muted" 
          onClick={() => navigate('/visitors?status=CHECKED_OUT')}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon icon-checkedout">
            <Clock size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.checkedOutVisitors}</span>
            <span className="stat-label">Checked-Out</span>
          </div>
        </GlowCard>

        {/* Pending Approvals */}
        <GlowCard 
          className="stat-card glow-warning" 
          onClick={() => navigate('/visitors?status=PENDING')}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon icon-pending">
            <Clock size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.pendingApprovals}</span>
            <span className="stat-label">Pending</span>
          </div>
        </GlowCard>

        {/* Rejected Visitors */}
        <GlowCard 
          className="stat-card glow-danger" 
          onClick={() => navigate('/visitors?status=REJECTED')}
          whileHover={{ y: -5 }}
        >
          <div className="stat-icon icon-rejected">
            <XCircle size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.rejectedVisitors}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </GlowCard>
      </div>

      {/* Dynamic Live Activity Tracking Timeline */}
      <div className="content-card" style={{ marginTop: '30px', padding: '24px' }}>
        <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', marginBottom: '20px' }}>
          <Clock size={20} style={{ color: 'var(--primary)' }} /> Live Gate Check-In & Check-Out Activity Log
        </h3>
        
        {loadingActivities ? (
          <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Loading live activity logs...</div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No recent gate check-in/checkout activity logged today.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivities.map((act) => (
              <div 
                key={act.key} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 18px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  background: act.status === 'CHECKED_OUT' ? 'rgba(100,116,139,0.02)' : 'var(--primary-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: act.status === 'CHECKED_OUT' ? 'var(--text-light)' : 'var(--primary)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}>
                    {act.status === 'CHECKED_OUT' ? 'OUT' : 'IN'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>
                      {act.name} <span style={{ color: 'var(--text-light)', fontWeight: 'normal', fontSize: '12px' }}>({act.code})</span>
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Host: <strong>{act.host}</strong> ({act.dept}) | Purpose: {act.purpose}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${act.status === 'CHECKED_OUT' ? 'badge-dark' : 'badge-success'}`} style={{ fontSize: '10px', textTransform: 'uppercase', padding: '4px 8px' }}>
                    {act.status.replace('_', ' ')}
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-light)', fontWeight: '600' }}>
                    {act.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
