import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VisitorService from '../services/visitor.service';

const VisitorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await VisitorService.getVisitorById(id);
        setVisitor(data);
      } catch (err) {
        setError('Failed to load visitor details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="text-center py-4">Loading details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!visitor) return <div className="text-center py-4">Visitor record not found.</div>;

  const isRestricted = (field) => {
    return field === '[RESTRICTED]' || !field;
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

  return (
    <div className="page-wrapper">
      <div className="page-header-row justify-between">
        <div>
          <h2>Visitor Details - {visitor.visitorCode}</h2>
          <p>Registration and Visit Status Logs</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Back
        </button>
      </div>

      <div className="details-layout">
        {/* Main Details Panel */}
        <div className="details-main-card">
          <div className="details-section">
            <h3 className="section-title">Personal Profile</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value font-bold">{visitor.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mobile Number:</span>
                <span className={`detail-value ${isRestricted(visitor.mobile) ? 'restricted-text' : ''}`}>
                  {visitor.mobile}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email Address:</span>
                <span className={`detail-value ${isRestricted(visitor.email) ? 'restricted-text' : ''}`}>
                  {visitor.email}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Company Name:</span>
                <span className="detail-value">{visitor.companyName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ID Proof Type:</span>
                <span className={`detail-value ${isRestricted(visitor.idProofType) ? 'restricted-text' : ''}`}>
                  {visitor.idProofType}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ID Proof Number:</span>
                <span className={`detail-value ${isRestricted(visitor.idNumber) ? 'restricted-text' : ''}`}>
                  {visitor.idNumber}
                </span>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div className="details-section">
            <h3 className="section-title">Visit Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Person to Meet:</span>
                <span className="detail-value font-bold">{visitor.personToMeet}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department:</span>
                <span className="detail-value">{visitor.department}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Visit Date:</span>
                <span className="detail-value">{visitor.visitDate}</span>
              </div>
              <div className="detail-item double-span">
                <span className="detail-label">Purpose Of Visit:</span>
                <span className="detail-value">{visitor.purpose}</span>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div className="details-section">
            <h3 className="section-title">Visit Status</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Current Status:</span>
                <span className={getStatusBadgeClass(visitor.status)}>{visitor.status}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Registered By:</span>
                <span className={`detail-value ${isRestricted(visitor.createdBy) ? 'restricted-text' : ''}`}>
                  {visitor.createdBy}
                </span>
              </div>
              {visitor.checkinTime && (
                <div className="detail-item">
                  <span className="detail-label">Check-In Time:</span>
                  <span className="detail-value font-bold">{visitor.checkinTime}</span>
                </div>
              )}
              {visitor.checkoutTime && (
                <div className="detail-item">
                  <span className="detail-label">Check-Out Time:</span>
                  <span className="detail-value font-bold">{visitor.checkoutTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Panel for Photo Preview */}
        <div className="details-sidebar-card">
          <h3 className="section-title text-center">Visitor Photo</h3>
          <div className="visitor-photo-box">
            {visitor.photo ? (
              <img src={visitor.photo} alt="Visitor Mugshot" className="visitor-details-img" />
            ) : (
              <div className="no-photo-placeholder">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 12zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <p>No Photo Uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDetails;
