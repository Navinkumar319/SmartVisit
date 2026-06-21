import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VisitorService from '../services/visitor.service';
import SystemService from '../services/system.service';

const formatLogoSrc = (logo) => {
  if (!logo) return '';
  if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/')) {
    return logo;
  }
  return `data:image/png;base64,${logo}`;
};

const VisitorList = () => {
  const [visitors, setVisitors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedInVisitorPass, setCheckedInVisitorPass] = useState(null);
  const [settings, setSettings] = useState({ companyName: 'Smart Visitor Management System', companyLogo: '' });

  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Handle live search
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

  // Handle delete
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

  // Perform quick actions (Approve, Check-In, etc.) directly from list
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
      fetchVisitors(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || `Action ${action} failed.`);
    }
  };

  // Filter list locally
  const filteredVisitors = visitors.filter((v) => {
    // 1. Status filter
    if (statusFilter && v.status !== statusFilter) return false;

    // 2. Date filter
    if (dateFilter && v.visitDate !== dateFilter) return false;

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
      <div className="page-header-row">
        <h2>Visitor List</h2>
        <p>Manage and track visitors entry status</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="filters-bar-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
        <div className="form-group">
          <label htmlFor="search">Search Visitor</label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by Code, Name, Host..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="statusFilter">Filter Status</label>
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

        <div className="form-group">
          <label htmlFor="dateFilter">Filter Date</label>
          <input
            type="date"
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-4">Loading records...</div>
      ) : filteredVisitors.length === 0 ? (
        <div className="text-center py-4 card-empty-state">No visitor records found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Visitor ID</th>
                <th>Visitor Name</th>
                <th>Company</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
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
                    <span className={getStatusBadgeClass(v.status)}>{v.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons-flex">
                      {/* View Action - Available to All roles */}
                      <button
                        onClick={() => navigate(`/visitors/${v.visitorId}`)}
                        className="btn-action btn-action-view"
                        title="View Details"
                      >
                        View
                      </button>

                      {/* Edit Action - Reception only */}
                      {user.role === 'ROLE_RECEPTION' && (
                        <button
                          onClick={() => navigate(`/visitors/edit/${v.visitorId}`)}
                          className="btn-action btn-action-edit"
                          title="Edit Details"
                        >
                          Edit
                        </button>
                      )}

                      {/* Delete Action - Admin only */}
                      {user.role === 'ROLE_ADMIN' && (
                        <button
                          onClick={() => handleDelete(v.visitorId)}
                          className="btn-action btn-action-delete"
                          title="Delete Record"
                        >
                          Delete
                        </button>
                      )}

                      {/* Approval Action - Admin only, if status is PENDING */}
                      {user.role === 'ROLE_ADMIN' && v.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleQuickAction('approve', v.visitorId)}
                            className="btn-action btn-action-approve"
                            title="Approve Visitor"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleQuickAction('reject', v.visitorId)}
                            className="btn-action btn-action-reject"
                            title="Reject Visitor"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Check-In Action - Security only, if status is APPROVED */}
                      {user.role === 'ROLE_SECURITY' && v.status === 'APPROVED' && (
                        <button
                          onClick={() => handleQuickAction('checkin', v.visitorId)}
                          className="btn-action btn-action-checkin"
                          title="Check-In Visitor"
                        >
                          Check-In
                        </button>
                      )}

                      {/* Check-Out Action - Security only, if status is CHECKED_IN */}
                      {user.role === 'ROLE_SECURITY' && v.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleQuickAction('checkout', v.visitorId)}
                          className="btn-action btn-action-checkout"
                          title="Check-Out Visitor"
                        >
                          Check-Out
                        </button>
                      )}

                      {/* Pass View Action - Available to Admin & Reception, if status is APPROVED, CHECKED_IN, or CHECKED_OUT */}
                      {user.role !== 'ROLE_SECURITY' && (v.status === 'APPROVED' || v.status === 'CHECKED_IN' || v.status === 'CHECKED_OUT') && (
                        <button
                          onClick={() => {
                            setCheckedInVisitorPass({
                              ...v,
                              checkinTime: v.checkinTime || 'N/A',
                              securityName: 'Security Desk',
                              remarks: 'Verified'
                            });
                          }}
                          className="btn-action btn-action-pass"
                          title="View Gate Pass"
                        >
                          Pass
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
      {checkedInVisitorPass && (
        <div className="visitor-pass-modal-overlay">
          <div className="visitor-pass-card print-pass-container">
            <div className="pass-header">
              {settings.companyLogo && (
                <img src={formatLogoSrc(settings.companyLogo)} alt="Logo" className="company-logo" style={{ maxHeight: '40px', marginBottom: '8px' }} />
              )}
              <h2>VISITOR GATE PASS</h2>
              <p>{settings.companyName}</p>
            </div>
            
            <div className="pass-body">
              <div className="pass-photo-side">
                {checkedInVisitorPass.photo ? (
                  <img src={checkedInVisitorPass.photo} alt="Visitor" className="pass-photo-img" />
                ) : (
                  <div className="pass-no-photo-box">
                    <svg viewBox="0 0 24 24" width="60" height="60" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 12zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span>No Photo</span>
                  </div>
                )}
                <div className="pass-badge-code">{checkedInVisitorPass.visitorCode}</div>
              </div>
              
              <div className="pass-details-side">
                <div className="pass-detail-row">
                  <span className="pass-item-lbl">Name:</span>
                  <span className="pass-item-val font-bold">{checkedInVisitorPass.name}</span>
                </div>
                <div className="pass-detail-row">
                  <span className="pass-item-lbl">Company:</span>
                  <span className="pass-item-val">{checkedInVisitorPass.companyName || 'N/A'}</span>
                </div>
                <div className="pass-detail-row">
                  <span className="pass-item-lbl">Host Name:</span>
                  <span className="pass-item-val font-bold">{checkedInVisitorPass.personToMeet}</span>
                </div>
                <div className="pass-detail-row">
                  <span className="pass-item-lbl">Department:</span>
                  <span className="pass-item-val">{checkedInVisitorPass.department}</span>
                </div>

                {checkedInVisitorPass.checkinTime && checkedInVisitorPass.checkinTime !== 'N/A' && (
                  <div className="pass-detail-row">
                    <span className="pass-item-lbl">Check-In:</span>
                    <span className="pass-item-val">{checkedInVisitorPass.checkinTime}</span>
                  </div>
                )}
                {checkedInVisitorPass.checkoutTime && (
                  <div className="pass-detail-row">
                    <span className="pass-item-lbl">Check-Out:</span>
                    <span className="pass-item-val">{checkedInVisitorPass.checkoutTime}</span>
                  </div>
                )}
                <div className="pass-detail-row">
                  <span className="pass-item-lbl">Officer:</span>
                  <span className="pass-item-val">{checkedInVisitorPass.securityName}</span>
                </div>
                <div className="pass-detail-row">
                  <span className="pass-item-lbl">Remarks:</span>
                  <span className="pass-item-val">{checkedInVisitorPass.remarks}</span>
                </div>
              </div>
            </div>
            
            <div className="pass-actions-row no-print">
              <button onClick={() => window.print()} className="btn btn-primary">
                Print Pass
              </button>
              <button onClick={() => setCheckedInVisitorPass(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorList;
