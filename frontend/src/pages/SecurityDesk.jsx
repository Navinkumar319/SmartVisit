import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import VisitorService from '../services/visitor.service';

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
        <h2>Security Desk Workspace</h2>
        <p>Perform gate pass verification, check visitor credentials, log entries, and check-outs</p>
      </div>

      {overstayingVisitors.length > 0 && (
        <div className="overstay-alert-banner animate-fade-in" style={{ marginBottom: '24px' }}>
          <div className="overstay-header">
            <span className="overstay-icon">⚠️</span>
            <div>
              <h4 style={{ margin: 0, color: '#c53030', fontWeight: 'bold' }}>Visitor Overstay Notification</h4>
              <p style={{ margin: '2px 0 0 0', color: '#742a2a', fontSize: '13px' }}>
                The following visitor(s) have been checked in for more than 8 hours. Please check their status or perform checkout:
              </p>
            </div>
          </div>
          <div className="overstay-list" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overstayingVisitors.map((v) => {
              const checkinDate = parseCheckinTime(v.checkinTime);
              const durationHrs = checkinDate ? ((new Date() - checkinDate) / 3600000).toFixed(1) : '8+';
              return (
                <div key={v.visitorId} className="overstay-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #feb2b2', padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '13px', color: '#2d3748' }}>
                    <strong className="text-primary">{v.visitorCode}</strong> — <strong>{v.name}</strong> (Host: {v.personToMeet} in {v.department})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="overstay-time-tag" style={{ fontSize: '12px', color: '#c53030', fontWeight: 'bold', backgroundColor: '#fff5f5', border: '1px dashed #feb2b2', padding: '3px 8px', borderRadius: '4px' }}>
                      Inside: {durationHrs} hrs
                    </span>
                    <button onClick={() => handleQuickCheckOut(v)} className="btn-action btn-action-checkout" style={{ padding: '3px 8px', fontSize: '11.5px' }}>
                      Checkout
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="security-desk-grid">
        <div className="security-verification-panel">
          <div className="panel-card">
            <h3 className="section-title-alt">1. Gate Pass Verification</h3>
            
            <form onSubmit={handleSearchSubmit} className="search-form-row">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter Gate Pass Code (e.g. VIS-1) or Visitor Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => { setSearchQuery(''); setSelectedVisitor(null); setSearchResults([]); }}>×</button>
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Search & Verify</button>
            </form>

            {searchResults.length > 0 && (
              <div className="search-results-box">
                <p className="search-results-title">Multiple matches found. Select visitor:</p>
                <div className="search-results-list">
                  {searchResults.map((v) => (
                    <div key={v.visitorId} className="search-result-item" onClick={() => loadVisitorDetails(v.visitorId)}>
                      <span className="font-bold">{v.visitorCode}</span> - {v.name} ({v.companyName || 'No Company'}) — Status: <span className="font-bold">{v.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVisitor ? (
              <div className="verification-details-container animate-fade-in">
                <div className={`status-banner status-${selectedVisitor.status.toLowerCase()}`}>
                  Current Status: <strong>{selectedVisitor.status.replace('_', ' ')}</strong>
                </div>

                <div className="verification-cards-row">
                  <div className="verification-sub-card text-center">
                    <h4 className="card-subtitle">Verify Visitor Photo</h4>
                    <div className="photo-verification-preview">
                      {selectedVisitor.photo ? (
                        <img src={selectedVisitor.photo} alt="Visitor Photo" className="visitor-photo-large" />
                      ) : (
                        <div className="no-photo-placeholder">
                          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 12zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                          <span>No Photo Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div className="verification-status-checkmark checked">
                      <span className="checkmark-icon">✓</span> Photo Verified
                    </div>
                  </div>

                  <div className="verification-sub-card">
                    <h4 className="card-subtitle">Verify Visitor Identity</h4>
                    <div className="identity-details-list">
                      <div className="identity-row">
                        <span className="id-lbl">ID Proof Type:</span>
                        <span className="id-val font-bold">{selectedVisitor.idProofType}</span>
                      </div>
                      <div className="identity-row">
                        <span className="id-lbl">ID Card Number:</span>
                        <span className="id-val font-bold highlight-val">{selectedVisitor.idNumber}</span>
                      </div>
                    </div>
                    <div className="verification-status-checkmark checked" style={{ marginTop: '24px' }}>
                      <span className="checkmark-icon">✓</span> Identity Verified
                    </div>
                  </div>
                </div>

                <div className="verification-sub-card full-width">
                  <h4 className="card-subtitle">Verify Gate Pass Details</h4>
                  <div className="details-grid-alt">
                    {[
                      { l: 'Visitor Code', v: selectedVisitor.visitorCode, c: 'font-bold text-primary' },
                      { l: 'Visitor Name', v: selectedVisitor.name, c: 'font-bold' },
                      { l: 'Company Name', v: selectedVisitor.companyName || 'N/A' },
                      { l: 'Contact Number', v: selectedVisitor.mobile },
                      { l: 'Person to Meet (Host)', v: selectedVisitor.personToMeet, c: 'font-bold' },
                      { l: 'Department', v: selectedVisitor.department },
                      { l: 'Purpose of Visit', v: selectedVisitor.purpose },
                      { l: 'Expected Arrival Time', v: selectedVisitor.expectedTime },
                      { l: 'Actual Check-in Time', v: selectedVisitor.checkinTime, c: 'text-success font-bold', s: !!selectedVisitor.checkinTime },
                      { l: 'Check-out Time', v: selectedVisitor.checkoutTime, c: 'text-secondary font-bold', s: !!selectedVisitor.checkoutTime }
                    ].filter(f => f.s !== false).map((f, i) => (
                      <div key={i} className="grid-cell">
                        <span className="cell-lbl">{f.l}</span>
                        <span className={`cell-val ${f.c || ''}`}>{f.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="verification-status-checkmark checked" style={{ marginTop: '16px' }}>
                    <span className="checkmark-icon">✓</span> Gate Pass Verified
                  </div>
                </div>

                {selectedVisitor.status === 'APPROVED' ? (
                  <div className="checkin-verification-panel" style={{ backgroundColor: 'rgba(25, 135, 84, 0.03)', border: '1px solid rgba(25, 135, 84, 0.2)', borderRadius: 'var(--radius-sm)', padding: '20px', marginTop: '20px' }}>
                    <h3 className="section-title-alt text-success" style={{ color: '#198754', borderBottom: '2px solid rgba(25, 135, 84, 0.1)' }}>Verify Credentials & Check-In</h3>
                    <p className="checkin-instruction-text" style={{ fontSize: '13px', color: '#145c32', marginBottom: '16px', lineHeight: '1.4' }}>
                      Verify that physical face matches photo and ID proof, assign a physical visitor badge, and click below to log their entry check-in.
                    </p>
                    <form onSubmit={handleCheckInSubmit} className="exit-checkout-form">
                      <div className="form-group">
                        <label htmlFor="checkinSecurityName">Security Officer Name <span className="required-star">*</span></label>
                        <input
                          type="text"
                          id="checkinSecurityName"
                          value={checkinSecurityName}
                          onChange={(e) => setCheckinSecurityName(e.target.value)}
                          placeholder="Security officer on duty"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="checkinRemarks">Check-In Remarks / Assigned Badge #</label>
                        <input
                          type="text"
                          id="checkinRemarks"
                          placeholder="e.g. Assigned badge #45, carrying work laptop"
                          value={checkinRemarks}
                          onChange={(e) => setCheckinRemarks(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn btn-success btn-block" style={{ backgroundColor: '#198754', color: '#fff', border: 'none' }} disabled={checkinLoading}>
                        {checkinLoading ? 'Verifying & Checking in...' : '✓ Verify & Check-In Visitor'}
                      </button>
                    </form>
                  </div>
                ) : selectedVisitor.status === 'CHECKED_IN' ? (
                  <div className="exit-verification-panel">
                    <h3 className="section-title-alt text-danger">Verify Exit & Check-Out</h3>
                    <p className="exit-instruction-text">
                      Please confirm that the visitor is leaving the building and has returned all badges or assets before checkout.
                    </p>
                    <form onSubmit={handleExitCheckOut} className="exit-checkout-form">
                      <div className="form-group">
                        <label htmlFor="exitRemarks">Exit Remarks / Notes</label>
                        <input
                          type="text"
                          id="exitRemarks"
                          placeholder="e.g. Returned badge #12, no keys borrowed..."
                          value={exitRemarks}
                          onChange={(e) => setExitRemarks(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn btn-danger btn-block" disabled={checkoutLoading}>
                        {checkoutLoading ? 'Verifying & Checking out...' : '✓ Verify Exit & Check-Out'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="exit-verification-panel disabled-panel" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#6c757d', padding: '16px', marginTop: '20px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <p className="text-secondary-label py-2" style={{ margin: 0 }}>
                      {selectedVisitor.status === 'CHECKED_OUT' 
                        ? 'This visitor has already checked-out.' 
                        : (selectedVisitor.status === 'PENDING'
                            ? 'This visitor is pending admin approval and cannot be checked in yet.'
                            : `Visitor status: ${selectedVisitor.status}. Check-in/out is disabled.`)}
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="empty-verification-state">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="var(--text-muted)"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                <p>Enter a Visitor Code or Name above to initiate verification, entry check-in, or exit check-out.</p>
              </div>
            )}
          </div>
        </div>

        <div className="security-monitoring-panel">
          <div className="panel-card flex-column">
            <div className="monitoring-header">
              <div>
                <h3 className="section-title-alt" style={{ marginBottom: '2px' }}>2. Live Premises Monitor</h3>
                <p className="text-secondary-label" style={{ fontSize: '12.5px' }}>Track & monitor checked-in visitors currently inside building</p>
              </div>
              <div className="visitors-inside-counter">
                <span className="counter-num">{insideVisitors.length}</span>
                <span className="counter-label">Inside</span>
              </div>
            </div>

            {monitoringLoading ? (
              <div className="text-center py-4">Loading active visitors...</div>
            ) : insideVisitors.length === 0 ? (
              <div className="empty-monitor-state">
                <svg viewBox="0 0 24 24" width="60" height="60" fill="var(--text-muted)"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"/></svg>
                <p>No checked-in visitors currently inside the premises.</p>
              </div>
            ) : (
              <div className="monitor-list-wrapper">
                <div className="table-responsive">
                  <table className="table monitor-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Code / Name</th>
                        <th>Host (Dept)</th>
                        <th>Checked-In</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insideVisitors.map((v) => (
                        <tr key={v.visitorId} className="monitor-row">
                          <td style={{ width: '50px' }}>
                            {v.photo ? (
                              <img src={v.photo} alt={v.name} className="monitor-thumbnail-img" onClick={() => loadVisitorDetails(v.visitorId)} />
                            ) : (
                              <div className="monitor-thumbnail-placeholder" onClick={() => loadVisitorDetails(v.visitorId)}>V</div>
                            )}
                          </td>
                          <td>
                            <div className="monitor-visitor-info" onClick={() => loadVisitorDetails(v.visitorId)} style={{ cursor: 'pointer' }}>
                              <span className="font-bold text-primary block-item">{v.visitorCode}</span>
                              <span className="font-bold block-item">{v.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="monitor-visitor-host">
                              <span className="block-item font-bold">{v.personToMeet}</span>
                              <span className="block-item text-secondary-label" style={{ fontSize: '11.5px' }}>{v.department}</span>
                            </div>
                          </td>
                          <td>
                            <span className="monitor-checkin-time text-success">{v.checkinTime || 'N/A'}</span>
                          </td>
                          <td>
                            <div className="action-buttons-flex">
                              <button onClick={() => handleQuickCheckOut(v)} className="btn-action btn-action-checkout" title="Verify Exit and Check-Out">
                                Checkout
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDesk;
