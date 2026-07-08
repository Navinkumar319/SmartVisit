import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VisitorService from '../services/visitor.service';
import { motion } from 'framer-motion';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  FileText, 
  Briefcase, 
  Users, 
  Calendar, 
  Clock, 
  ShieldCheck,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';

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

const getEffectiveStatus = (v, userRole) => {
  if (!v || !v.status) return '';
  if (v.status === 'APPROVED' && userRole !== 'ROLE_ADMIN' && !isScheduledDateTimePassed(v.visitDate, v.visitTime)) {
    return 'PENDING';
  }
  return v.status;
};

const VisitorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

  if (loading) return <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Loading details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!visitor) return <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Visitor record not found.</div>;

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

  const getFormattedCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours < 10 ? `0${hours}` : hours;
    return `${strHours}:${minutes} ${ampm}`;
  };

  const displayDate = visitor.visitDate || (visitor.createdAt ? visitor.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);

  const displayTime = visitor.visitTime 
    ? formatTimeHM(visitor.visitTime) 
    : (visitor.createdAt 
        ? formatTimeHM(visitor.createdAt.split('T')[1]?.split('.')[0]) 
        : getFormattedCurrentTime());

  return (
    <div className="page-wrapper">
      <div className="page-header-row justify-between">
        <div>
          <h2>Visitor Details - <span style={{ color: 'var(--primary)' }}>{visitor.visitorCode}</span></h2>
          <p>Detailed profile logs and check-in history information</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Main Details Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Section 1: Personal Profile */}
          <div className="content-card">
            <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} /> Personal Profile Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14.5px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Full Name</span>
                <strong style={{ color: 'var(--text-dark)' }}>{visitor.name}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Mobile Number</span>
                <span className={isRestricted(visitor.mobile) ? 'restricted-text' : ''} style={{ color: 'var(--text-dark)', fontWeight: '600' }}>
                  {visitor.mobile}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Email Address</span>
                <span className={isRestricted(visitor.email) ? 'restricted-text' : ''} style={{ color: 'var(--text-dark)', fontWeight: '600' }}>
                  {visitor.email}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Company Name</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{visitor.companyName || 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Identity ID Proof Type</span>
                <span className={isRestricted(visitor.idProofType) ? 'restricted-text' : ''} style={{ color: 'var(--text-dark)', fontWeight: '600' }}>
                  {visitor.idProofType}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Identity Card Number</span>
                <span className={isRestricted(visitor.idNumber) ? 'restricted-text' : ''} style={{ color: 'var(--text-dark)', fontWeight: '600' }}>
                  {visitor.idNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Meeting details */}
          <div className="content-card">
            <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Briefcase size={20} /> Visit & Host details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14.5px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Host Name (Person to Meet)</span>
                <strong style={{ color: 'var(--text-dark)' }}>{visitor.personToMeet}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Department</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{visitor.department}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Visit Date</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{displayDate}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Visit Time</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{displayTime}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Purpose of Visit</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '500', lineHeight: '1.5' }}>{visitor.purpose}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Status Details */}
          <div className="content-card">
            <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} /> Check-In Logs & Status
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14.5px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Current Status</span>
                <span className={getStatusBadgeClass(getEffectiveStatus(visitor, user ? user.role : ''))} style={{ width: 'fit-content' }}>
                  {getEffectiveStatus(visitor, user ? user.role : '').replace('_', ' ')}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Created / Logged By</span>
                <span className={isRestricted(visitor.createdBy) ? 'restricted-text' : ''} style={{ color: 'var(--text-dark)', fontWeight: '600' }}>
                  {visitor.createdBy}
                </span>
              </div>

              {visitor.checkinTime && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Check-In Time</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{visitor.checkinTime}</span>
                  {visitor.checkinBy && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Desk: <strong style={{ color: 'var(--text-dark)' }}>{visitor.checkinBy}</strong>
                    </span>
                  )}
                </div>
              )}

              {visitor.checkoutTime && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>Check-Out Time</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{visitor.checkoutTime}</span>
                  {visitor.checkoutBy && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Desk: <strong style={{ color: 'var(--text-dark)' }}>{visitor.checkoutBy}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Panel for Visitor Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="content-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 className="section-title-alt" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ImageIcon size={18} /> Visitor Image
            </h3>
            
            <div style={{ width: '100%', height: '240px', borderRadius: 'var(--radius-md)', border: '2.5px solid var(--primary)', overflow: 'hidden', margin: '16px 0', boxShadow: 'var(--shadow-md)', background: 'var(--bg-app)' }}>
              {visitor.photo ? (
                <img src={visitor.photo} alt="Visitor Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Users size={48} style={{ marginBottom: '8px' }} />
                  <span>No Photo Uploaded</span>
                </div>
              )}
            </div>
            
            <div className="profile-role-badge" style={{ marginTop: '8px', fontSize: '12px' }}>
              Access Pass Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDetails;
