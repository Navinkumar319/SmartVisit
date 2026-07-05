import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VisitorService from '../services/visitor.service';
import SystemService from '../services/system.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  UserCheck, 
  UserMinus, 
  FileText, 
  Printer, 
  XSquare,
  Users,
  Bell
} from 'lucide-react';

const formatLogoSrc = (logo) => {
  if (!logo) return '';
  if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/')) {
    return logo;
  }
  return `data:image/png;base64,${logo}`;
};

const isScheduledDateTimePassed = (visitDate, visitTime) => {
  if (!visitDate) return true;
  const now = new Date();
  const scheduledDate = new Date(visitDate);
  if (visitTime) {
    const [hours, minutes] = visitTime.split(':');
    scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  } else {
    scheduledDate.setHours(0, 0, 0, 0);
  }
  return now >= scheduledDate;
};

const formatTimeHM = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours < 10 ? `0${hours}` : hours;
    return `${strHours}:${minutes} ${ampm}`;
  }
  return timeStr;
};

const getEffectiveStatus = (v, userRole) => {
  if (!v || !v.status) return '';
  if (v.status === 'APPROVED' && userRole !== 'ROLE_ADMIN' && !isScheduledDateTimePassed(v.visitDate, v.visitTime)) {
    return 'PENDING';
  }
  return v.status;
};

const VisitorList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedInVisitorPass, setCheckedInVisitorPass] = useState(null);
  const [settings, setSettings] = useState({ companyName: 'Smart Visitor Management System', companyLogo: '' });

  const [selectedVisitorForApproval, setSelectedVisitorForApproval] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [approvalVisitDate, setApprovalVisitDate] = useState('');
  const [approvalVisitTime, setApprovalVisitTime] = useState('');
  const [ticker, setTicker] = useState(0);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const notifiedVisitorsRef = useRef(new Set());

  useEffect(() => {
    if (visitors.length > 0 && notifiedVisitorsRef.current.size === 0) {
      visitors.forEach((v) => {
        if (v.status === 'APPROVED' && isScheduledDateTimePassed(v.visitDate, v.visitTime)) {
          notifiedVisitorsRef.current.add(v.visitorId);
        }
      });
    }
  }, [visitors]);

  useEffect(() => {
    if (user && user.role !== 'ROLE_ADMIN' && visitors.length > 0) {
      visitors.forEach((v) => {
        if (v.status === 'APPROVED' && v.visitDate && isScheduledDateTimePassed(v.visitDate, v.visitTime)) {
          if (!notifiedVisitorsRef.current.has(v.visitorId)) {
            notifiedVisitorsRef.current.add(v.visitorId);
            const msg = `Pass for visitor ${v.name} (${v.visitorCode}) is now active and ready to print.`;
            const id = Date.now() + Math.random();
            setActiveNotifications((prev) => [...prev, { id, message: msg, visitorCode: v.visitorCode, visitorId: v.visitorId }]);
            setTimeout(() => {
              setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
            }, 10000);
          }
        }
      });
    }
  }, [ticker, visitors, user]);




  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const data = await VisitorService.getAllVisitors();
      setVisitors(data);
    } catch (err) {
      setError('Failed to fetch visitor records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await SystemService.getSettings();
      if (data) {
        setSettings({
          companyName: data.companyName || 'Smart Visitor Management System',
          companyLogo: data.companyLogo || ''
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const statusParam = queryParams.get('status');
    const dateParam = queryParams.get('date');
    if (statusParam) {
      setStatusFilter(statusParam.toUpperCase());
    }
    if (dateParam) {
      setDateFilter(dateParam);
    }
    fetchVisitors();
    fetchSettings();
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      fetchVisitors();
      return;
    }

    try {
      const data = await VisitorService.searchVisitors(query);
      setVisitors(data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this visitor record?')) {
      try {
        await VisitorService.deleteVisitor(id);
        setVisitors((prev) => prev.filter((v) => v.visitorId !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete record.');
      }
    }
  };

  const handleQuickAction = async (action, visitorId) => {
    try {
      if (action === 'approve') {
        await VisitorService.approveVisitor(visitorId, 'Approved');
        alert('Visitor approved successfully.');
      } else if (action === 'checkin') {
        const securityName = prompt('Enter Security Officer Name:', user.fullName);
        if (securityName) {
          await VisitorService.checkInVisitor(visitorId, securityName, 'Checked In');
          alert('Visitor checked in successfully.');
        }
      } else if (action === 'checkout') {
        await VisitorService.checkOutVisitor(visitorId, 'Checked Out');
        alert('Visitor checked out successfully.');
      } else if (action === 'reject') {
        await VisitorService.rejectVisitor(visitorId, 'Rejected');
        alert('Visitor rejected successfully.');
      }
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.message || `Action ${action} failed.`);
    }
  };

  const filteredVisitors = visitors.filter((v) => {
    const effectiveStatus = getEffectiveStatus(v, user ? user.role : '');
    if (statusFilter && effectiveStatus !== statusFilter) return false;
    if (dateFilter && v.visitDate !== dateFilter) return false;
    if (yearFilter && v.visitDate && v.visitDate.substring(0, 4) !== yearFilter) return false;
    return true;
  });

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

  return (
    <div className={`page-wrapper ${checkedInVisitorPass ? 'print-pass-active' : ''}`}>
      <div className="page-header-row no-print">
        <div>
          <h2>Visitor Records</h2>
          <p>Manage and track visitor access statuses across all gates</p>
        </div>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="reports-actions-bar no-print" style={{ gap: '20px' }}>
        <div className="form-group flex-grow" style={{ marginBottom: 0 }}>
          <label htmlFor="search" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} /> Search Visitor
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by Code, Name, Host..."
          />
        </div>

        <div className="form-group" style={{ minWidth: '180px', marginBottom: 0 }}>
          <label htmlFor="statusFilter" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} /> Filter Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CHECKED_IN">Checked-In</option>
            <option value="CHECKED_OUT">Checked-Out</option>
          </select>
        </div>

        <div className="form-group" style={{ minWidth: '180px', marginBottom: 0 }}>
          <label htmlFor="dateFilter" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Filter Date
          </label>
          <input
            type="date"
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ minWidth: '150px', marginBottom: 0 }}>
          <label htmlFor="yearFilter" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Filter Year
          </label>
          <select
            id="yearFilter"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="">All Years</option>
            {(() => {
              const currentYear = new Date().getFullYear();
              const years = [];
              for (let y = currentYear + 1; y >= 2024; y--) {
                years.push(y.toString());
              }
              return years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ));
            })()}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Visitor Log Table */}
      {loading ? (
        <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Loading records...</div>
      ) : filteredVisitors.length === 0 ? (
        <div className="text-center py-4 card-empty-state content-card">No visitor records found matching current criteria.</div>
      ) : (
        <div className="table-responsive content-card">
          <table className="table">
            <thead>
              <tr>
                <th>Visitor ID</th>
                <th>Visitor Name</th>
                <th>Company</th>
                <th>Purpose</th>
                <th>Status</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map((v) => (
                <tr key={v.visitorId}>
                  <td className="font-bold">{v.visitorCode}</td>
                  <td>{v.name}</td>
                  <td>{v.companyName || 'N/A'}</td>
                  <td>{v.purpose}</td>
                  <td>
                    <span className={getStatusBadgeClass(getEffectiveStatus(v, user?.role || ''))}>
                      {(getEffectiveStatus(v, user?.role || '') || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="no-print">
                    <div className="action-buttons-group">
                      {/* View details */}
                      <button
                        onClick={() => navigate(`/visitors/${v.visitorId}`)}
                        className="btn-action"
                        title="View Details"
                      >
                        <Eye size={13} /> View
                      </button>

                      {/* Edit Details */}
                      {user?.role === 'ROLE_RECEPTION' && (
                        <button
                          onClick={() => navigate(`/visitors/edit/${v.visitorId}`)}
                          className="btn-action"
                          title="Edit Details"
                        >
                          <Edit size={13} /> Edit
                        </button>
                      )}

                      {/* Delete Details */}
                      {user?.role === 'ROLE_ADMIN' && (
                        <button
                          onClick={() => handleDelete(v.visitorId)}
                          className="btn-action btn-action-delete"
                          title="Delete Record"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}

                      {/* Approvals (Approve / Reject) */}
                      {user?.role === 'ROLE_ADMIN' && v.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedVisitorForApproval(v);
                              setApprovalRemarks('');
                              setApprovalVisitDate(v.visitDate || '');
                              setApprovalVisitTime(v.visitTime || '');
                            }}
                            className="btn-action"
                            style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                            title="Approve Visitor"
                          >
                            <Check size={13} /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVisitorForApproval(v);
                              setApprovalRemarks('');
                              setApprovalVisitDate(v.visitDate || '');
                              setApprovalVisitTime(v.visitTime || '');
                            }}
                            className="btn-action btn-action-delete"
                            title="Reject Visitor"
                          >
                            <X size={13} /> Reject
                          </button>
                        </>
                      )}

                      {/* Gate Actions */}
                      {user?.role === 'ROLE_SECURITY' && getEffectiveStatus(v, user?.role || '') === 'APPROVED' && (
                        <button
                          onClick={() => handleQuickAction('checkin', v.visitorId)}
                          className="btn-action"
                          style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                          title="Check-In Visitor"
                        >
                          <UserCheck size={13} /> Check-In
                        </button>
                      )}

                      {user?.role === 'ROLE_SECURITY' && getEffectiveStatus(v, user?.role || '') === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleQuickAction('checkout', v.visitorId)}
                          className="btn-action btn-action-checkout"
                          title="Check-Out Visitor"
                        >
                          <UserMinus size={13} /> Check-Out
                        </button>
                      )}

                      {/* Print Pass */}
                      {user?.role !== 'ROLE_SECURITY' && (getEffectiveStatus(v, user?.role || '') === 'APPROVED' || getEffectiveStatus(v, user?.role || '') === 'CHECKED_IN' || getEffectiveStatus(v, user?.role || '') === 'CHECKED_OUT') && (
                        <button
                          onClick={() => {
                            setCheckedInVisitorPass({
                              ...v,
                              checkinTime: v.checkinTime || 'N/A',
                              securityName: 'Security Desk Operations',
                              remarks: 'Identity Checked'
                            });
                          }}
                          className="btn-action"
                          style={{ color: 'var(--primary)', borderColor: 'var(--border-glow)' }}
                          title="View Gate Pass"
                        >
                          <FileText size={13} /> Pass
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable Visitor Pass Modal */}
      <AnimatePresence>
        {checkedInVisitorPass && (
          <div className="modal-overlay">
            <motion.div 
              className="visitor-pass-card print-pass-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card-solid)' }}
            >
              {/* Top Card Section */}
              <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white', padding: '24px 20px', textAlign: 'center' }}>

                <h3 style={{ margin: 0, color: 'white', fontWeight: '800', letterSpacing: '0.05em', fontSize: '18px' }}>VISITOR GATE PASS</h3>
                <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '12px' }}>{settings.companyName}</p>
              </div>

              {/* Photo & Main details */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '12px', border: '2.5px solid var(--primary)', overflow: 'hidden', marginBottom: '12px', boxShadow: 'var(--shadow-sm)' }}>
                  {checkedInVisitorPass.photo ? (
                    <img src={checkedInVisitorPass.photo} alt="Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--border-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                      <Users size={32} style={{ marginBottom: '4px' }} />
                      No Photo
                    </div>
                  )}
                </div>
                
                <span className="badge badge-primary" style={{ marginBottom: '20px' }}>{checkedInVisitorPass.visitorCode}</span>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1.5px dashed var(--border-soft)', paddingTop: '20px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Visitor Name:</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{checkedInVisitorPass.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Company:</span>
                    <span style={{ color: 'var(--text-dark)' }}>{checkedInVisitorPass.companyName || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Host Name:</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{checkedInVisitorPass.personToMeet}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                    <span style={{ color: 'var(--text-dark)' }}>{checkedInVisitorPass.department}</span>
                  </div>
                  {checkedInVisitorPass.checkinTime && checkedInVisitorPass.checkinTime !== 'N/A' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Check-In Time:</span>
                      <span style={{ color: 'var(--text-dark)' }}>{checkedInVisitorPass.checkinTime}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Verification Officer:</span>
                    <span style={{ color: 'var(--text-dark)' }}>{checkedInVisitorPass.securityName}</span>
                  </div>
                </div>
              </div>

              {/* Pass Actions */}
              <div className="no-print" style={{ display: 'flex', padding: '16px 20px', gap: '12px', borderTop: '1px solid var(--border-soft)', background: 'rgba(0,0,0,0.01)' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1, padding: '10px' }}>
                  <Printer size={15} /> Print Pass
                </button>
                <button onClick={() => setCheckedInVisitorPass(null)} className="btn btn-secondary" style={{ flex: 1, padding: '10px' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Visitor Approval Details Modal */}
      <AnimatePresence>
        {selectedVisitorForApproval && (
          <div className="modal-overlay">
            <motion.div 
              className="visitor-pass-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ width: '480px', padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card-solid)' }}
            >
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '16px' }}>REVIEW & APPROVE VISITOR</h3>
                <button 
                  onClick={() => setSelectedVisitorForApproval(null)} 
                  style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px', maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px solid var(--primary)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-app)' }}>
                    {selectedVisitorForApproval.photo ? (
                      <img src={selectedVisitorForApproval.photo} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Users size={28} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-dark)' }}>{selectedVisitorForApproval.name}</h4>
                    <span className="badge badge-warning" style={{ fontSize: '10.5px' }}>{selectedVisitorForApproval.status}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>VISITOR CODE</span>
                    <strong style={{ color: 'var(--primary)' }}>{selectedVisitorForApproval.visitorCode}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>MOBILE NUMBER</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{selectedVisitorForApproval.mobile}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>EMAIL</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{selectedVisitorForApproval.email}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>COMPANY</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{selectedVisitorForApproval.companyName || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>ID PROOF</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{selectedVisitorForApproval.idProofType} ({selectedVisitorForApproval.idNumber})</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>HOST TO MEET</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{selectedVisitorForApproval.personToMeet} ({selectedVisitorForApproval.department})</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>VISIT DATE</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{selectedVisitorForApproval.visitDate || 'N/A'}</span>
                  </div>
                  {selectedVisitorForApproval.visitTime && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>VISIT TIME</span>
                      <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{formatTimeHM(selectedVisitorForApproval.visitTime)}</span>
                    </div>
                  )}
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600' }}>PURPOSE OF VISIT</span>
                    <span style={{ color: 'var(--text-dark)', fontWeight: '500' }}>{selectedVisitorForApproval.purpose}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>SET VISIT SCHEDULE (OPTIONAL)</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="approvalVisitDate" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Visit Date</label>
                        <input
                          type="date"
                          id="approvalVisitDate"
                          value={approvalVisitDate}
                          onChange={(e) => setApprovalVisitDate(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', color: 'var(--text-dark)' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="approvalVisitTime" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Visit Time</label>
                        <input
                          type="time"
                          id="approvalVisitTime"
                          value={approvalVisitTime}
                          onChange={(e) => setApprovalVisitTime(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', color: 'var(--text-dark)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-soft)', paddingTop: '12px' }}>
                    <label htmlFor="remarks" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px' }}>REMARKS / NOTES</label>
                    <textarea
                      id="remarks"
                      rows={2}
                      value={approvalRemarks}
                      onChange={(e) => setApprovalRemarks(e.target.value)}
                      placeholder="Enter approval remarks (optional)..."
                      style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-app)', color: 'var(--text-dark)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', padding: '16px 20px', gap: '12px', borderTop: '1px solid var(--border-soft)', background: 'rgba(0,0,0,0.01)' }}>
                <button 
                  onClick={async () => {
                    try {
                      await VisitorService.approveVisitor(
                        selectedVisitorForApproval.visitorId, 
                        approvalRemarks || 'Approved',
                        approvalVisitDate,
                        approvalVisitTime ? approvalVisitTime.slice(0, 5) : null
                      );
                      alert('Visitor approved successfully.');
                      setSelectedVisitorForApproval(null);
                      fetchVisitors();
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to approve visitor.');
                    }
                  }} 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '10px', background: 'var(--success)' }}
                >
                  <Check size={15} /> Approve
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await VisitorService.rejectVisitor(selectedVisitorForApproval.visitorId, approvalRemarks || 'Rejected');
                      alert('Visitor rejected successfully.');
                      setSelectedVisitorForApproval(null);
                      fetchVisitors();
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to reject visitor.');
                    }
                  }} 
                  className="btn btn-danger" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  <X size={15} /> Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications Container */}
      <div style={{ position: 'fixed', top: '85px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', width: '360px', pointerEvents: 'none' }}>
        <AnimatePresence>
          {activeNotifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              style={{
                pointerEvents: 'auto',
                background: 'linear-gradient(135deg, var(--bg-card-solid) 0%, rgba(30, 41, 59, 0.95) 100%)',
                color: 'var(--text-dark)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--success)',
                borderTop: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
                display: 'flex',
                gap: '12px',
                alignItems: 'start'
              }}
            >
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '6px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}>
                <Bell size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-dark)' }}>Pass Activated</h5>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{n.message}</p>
                <button 
                  onClick={() => {
                    const vObj = visitors.find((v) => v.visitorId === n.visitorId);
                    if (vObj) {
                      setCheckedInVisitorPass({
                        ...vObj,
                        checkinTime: vObj.checkinTime || 'N/A',
                        securityName: 'Security Desk Operations',
                        remarks: 'Identity Checked'
                      });
                    }
                    setActiveNotifications((prev) => prev.filter((notif) => notif.id !== n.id));
                  }} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '11.5px', padding: '0', marginTop: '8px', cursor: 'pointer', display: 'block' }}
                >
                  Print Pass Now →
                </button>
              </div>
              <button 
                onClick={() => setActiveNotifications((prev) => prev.filter((notif) => notif.id !== n.id))} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '0', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VisitorList;
