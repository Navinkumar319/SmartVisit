import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import VisitorService from '../services/visitor.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  AlertTriangle, 
  UserCheck, 
  UserMinus, 
  UserX,
  FileText,
  Building
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

const SecurityDesk = () => {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  
  const [checkinRemarks, setCheckinRemarks] = useState('');
  const [checkinSecurityName, setCheckinSecurityName] = useState(user?.fullName || '');
  const [checkinLoading, setCheckinLoading] = useState(false);
  
  const [exitRemarks, setExitRemarks] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const [insideVisitors, setInsideVisitors] = useState([]);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInsideVisitors = async () => {
    setMonitoringLoading(true);
    try {
      const data = await VisitorService.getVisitorsByStatus('CHECKED_IN');
      setInsideVisitors(data);
    } catch (err) {
      console.error('Error fetching checked-in visitors:', err);
      setError('Failed to fetch the list of visitors inside the building.');
    } finally {
      setMonitoringLoading(false);
    }
  };

  useEffect(() => {
    fetchInsideVisitors();
  }, []);

  const overstayingVisitors = insideVisitors.filter((v) => {
    if (!v.checkinTime) return false;
    const checkinDate = parseCheckinTime(v.checkinTime);
    return checkinDate ? ((new Date() - checkinDate) / 3600000) >= 8.0 : false;
  });

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setError(''); setSuccess(''); setSelectedVisitor(null); setSearchResults([]);
    try {
      const data = await VisitorService.searchVisitors(searchQuery);
      if (data.length === 0) {
        setError(`No visitor found matching code/name "${searchQuery}"`);
      } else if (data.length === 1) {
        loadVisitorDetails(data[0].visitorId);
      } else {
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
      setError('Error occurred while searching visitor records.');
    }
  };

  const loadVisitorDetails = async (id) => {
    setError(''); setSuccess('');
    try {
      const visitor = await VisitorService.getVisitorById(id);
      setSelectedVisitor(visitor);
      setExitRemarks(''); setCheckinRemarks(''); setSearchResults([]);
      setSearchQuery(visitor.visitorCode);
    } catch (err) {
      console.error(err);
      setError('Failed to load visitor details.');
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;
    setError(''); setSuccess(''); setCheckinLoading(true);
    try {
      const response = await VisitorService.checkInVisitor(selectedVisitor.visitorId, checkinSecurityName, checkinRemarks || 'Checked in at Security Desk');
      setSuccess(`Visitor ${selectedVisitor.name} (${selectedVisitor.visitorCode}) checked in successfully!`);
      setSelectedVisitor(response);
      setCheckinRemarks('');
      fetchInsideVisitors();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Check-in failed. Please try again.');
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleExitCheckOut = async (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;
    setError(''); setSuccess(''); setCheckoutLoading(true);
    try {
      await VisitorService.checkOutVisitor(selectedVisitor.visitorId, exitRemarks || 'Exit verified at Security Desk');
      setSuccess(`Visitor ${selectedVisitor.name} (${selectedVisitor.visitorCode}) checked out successfully!`);
      setSelectedVisitor(null); setSearchQuery(''); setExitRemarks('');
      fetchInsideVisitors();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Check-out failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleQuickCheckOut = async (visitor) => {
    setError(''); setSuccess('');
    const remarks = prompt(`Enter Exit Remarks for ${visitor.name}:`, 'Exit verified at Security Desk');
    if (remarks === null) return;
    try {
      await VisitorService.checkOutVisitor(visitor.visitorId, remarks);
      setSuccess(`Visitor ${visitor.name} checked out successfully!`);
      if (selectedVisitor && selectedVisitor.visitorId === visitor.visitorId) {
        setSelectedVisitor(null); setSearchQuery('');
      }
      fetchInsideVisitors();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to check-out visitor.');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Security Desk Workspace</h2>
          <p>Verify gate passes, manage identity checks, and monitor building occupancies</p>
        </div>
      </div>

      {/* Overstay Warning Notification banner */}
      <AnimatePresence>
        {overstayingVisitors.length > 0 && (
          <motion.div 
            className="overstay-alert-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ marginBottom: '24px' }}
          >
            <div className="overstay-header">
              <AlertTriangle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, color: 'var(--danger)', fontWeight: 'bold' }}>Visitor Overstay Alert Triggered</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  The following visitor(s) have been checked in for more than 8 hours. Access checkout immediately:
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {overstayingVisitors.map((v) => {
                const checkinDate = parseCheckinTime(v.checkinTime);
                const durationHrs = checkinDate ? ((new Date() - checkinDate) / 3600000).toFixed(1) : '8+';
                return (
                  <div key={v.visitorId} className="justify-between" style={{ background: 'var(--bg-card-solid)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '13px' }}>
                      <strong style={{ color: 'var(--primary)' }}>{v.visitorCode}</strong> — <strong>{v.name}</strong> (Host: {v.personToMeet} in {v.department})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 'bold', background: 'var(--danger-bg)', padding: '4px 8px', borderRadius: '4px' }}>
                        Inside: {durationHrs} hrs
                      </span>
                      <button onClick={() => handleQuickCheckOut(v)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11.5px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        Checkout
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="security-desk-grid">
        {/* Left Side: Gate pass check panel */}
        <div className="security-verification-panel">
          <div className="panel-card">
            <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} /> 1. Gate Pass Verification
            </h3>
            
            <form onSubmit={handleSearchSubmit} className="search-form-row">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter Pass Code (e.g. VIS-1) or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => { setSearchQuery(''); setSelectedVisitor(null); setSearchResults([]); }}>×</button>
                )}
              </div>
              <button type="submit" className="btn btn-primary">Verify Pass</button>
            </form>

            {searchResults.length > 0 && (
              <div className="search-results-box">
                <p className="search-results-title">Select matching visitor record:</p>
                <div>
                  {searchResults.map((v) => (
                    <div key={v.visitorId} className="search-result-item" onClick={() => loadVisitorDetails(v.visitorId)}>
                      <strong>{v.visitorCode}</strong> — {v.name} ({v.companyName || 'No Company'}) — Status: <strong>{v.status}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVisitor && (
              <div className="verification-details-container" style={{ animation: 'fadeIn 0.4s ease' }}>
                <div className={`status-banner status-${selectedVisitor.status.toLowerCase()}`}>
                  Pass Verification: <strong>{selectedVisitor.status.replace('_', ' ')}</strong>
                </div>

                <div className="verification-cards-row">
                  {/* Photo details */}
                  <div className="verification-sub-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <h4 className="card-subtitle">Photo Check</h4>
                    <div className="photo-verification-preview">
                      {selectedVisitor.photo ? (
                        <img src={selectedVisitor.photo} alt="Visitor Photo" className="visitor-photo-large" />
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <UserX size={36} />
                          No Photo
                        </div>
                      )}
                    </div>
                    {selectedVisitor.photo && (
                      <div className="verification-status-checkmark">
                        <CheckCircle size={14} /> ID Match Ready
                      </div>
                    )}
                  </div>

                  {/* ID & Details check */}
                  <div className="verification-sub-card">
                    <h4 className="card-subtitle">Identity Credentials</h4>
                    <div className="identity-details-list">
                      <div className="identity-row">
                        <span className="id-lbl">ID Type:</span>
                        <span className="id-val font-bold">{selectedVisitor.idProofType}</span>
                      </div>
                      <div className="identity-row">
                        <span className="id-lbl">ID Number:</span>
                        <span className="id-val font-bold">{selectedVisitor.idNumber}</span>
                      </div>
                      <div className="identity-row">
                        <span className="id-lbl">Host / Office:</span>
                        <span className="id-val">{selectedVisitor.personToMeet} ({selectedVisitor.department})</span>
                      </div>
                      <div className="identity-row">
                        <span className="id-lbl">Visit Purpose:</span>
                        <span className="id-val">{selectedVisitor.purpose}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gate Entry Submission Forms */}
                {selectedVisitor.status === 'APPROVED' && (
                  <form onSubmit={handleCheckInSubmit} style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="checkinSecurityName">Gate Security Officer Name</label>
                      <input 
                        type="text" 
                        id="checkinSecurityName"
                        value={checkinSecurityName} 
                        onChange={(e) => setCheckinSecurityName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="checkinRemarks">Gate Entry Log Remarks</label>
                      <textarea 
                        id="checkinRemarks" 
                        rows="2" 
                        placeholder="Enter any entry notes, baggage status, host confirmation, etc..."
                        value={checkinRemarks} 
                        onChange={(e) => setCheckinRemarks(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={checkinLoading} style={{ width: '100%' }}>
                      <UserCheck size={16} /> {checkinLoading ? 'Logging Check-In...' : 'Confirm Gate Check-In & Grant Entry'}
                    </button>
                  </form>
                )}

                {selectedVisitor.status === 'CHECKED_IN' && (
                  <form onSubmit={handleExitCheckOut} style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="exitRemarks">Gate Exit Remarks</label>
                      <textarea 
                        id="exitRemarks" 
                        rows="2" 
                        placeholder="Baggage checked, exit credentials verified, etc..."
                        value={exitRemarks} 
                        onChange={(e) => setExitRemarks(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--warning) 0%, #EA580C 100%)', boxShadow: 'none' }} disabled={checkoutLoading}>
                      <UserMinus size={16} /> {checkoutLoading ? 'Logging Exit...' : 'Confirm Exit Check-Out'}
                    </button>
                  </form>
                )}

                {selectedVisitor.status === 'PENDING' && (
                  <div style={{ marginTop: '16px', background: 'var(--warning-bg)', border: '1px dashed var(--warning)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '13.5px' }}>
                    <strong>Access Flagged:</strong> Visitor requires Admin/Host approval check. Once approved, gate check-in can be processed.
                  </div>
                )}

                {selectedVisitor.status === 'REJECTED' && (
                  <div style={{ marginTop: '16px', background: 'var(--danger-bg)', border: '1px dashed var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '13.5px', color: 'var(--danger)' }}>
                    <strong>Access Rejected:</strong> Gate check-in blocked. This visitor registration pass has been rejected by administration.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Building monitor panel */}
        <div className="security-monitoring-panel">
          <div className="panel-card">
            <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> Active Building Occupancy ({insideVisitors.length})
            </h3>

            {monitoringLoading ? (
              <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Checking occupants logs...</div>
            ) : insideVisitors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Building size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <span>No visitors currently inside the building.</span>
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '460px', overflowY: 'auto', border: 'none' }}>
                <table className="table" style={{ fontSize: '13.5px' }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Visitor</th>
                      <th>Host / Dept</th>
                      <th>Checked In</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insideVisitors.map((v) => (
                      <tr key={v.visitorId}>
                        <td className="font-bold">{v.visitorCode}</td>
                        <td>
                          <strong>{v.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.companyName || 'No Company'}</div>
                        </td>
                        <td>
                          {v.personToMeet}
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.department}</div>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {v.checkinTime?.split(' ')[1] || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <button onClick={() => handleQuickCheckOut(v)} className="btn-action btn-action-checkout">
                            Exit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDesk;
