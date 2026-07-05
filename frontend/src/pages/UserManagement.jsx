import React, { useState, useEffect, useRef } from 'react';
import UserService from '../services/user.service';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  UserCheck, 
  Key, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

const UserManagement = () => {
  const { user, refreshProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Refs to prevent duplicate submissions
  const isSendingOtpRef = useRef(false);
  const isVerifyingOtpRef = useRef(false);
  const isCreatingUserRef = useRef(false);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Form input fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    role: 'ROLE_RECEPTION',
    username: '',
    password: '',
    profilePhoto: '',
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Profile photo file size should be less than 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profilePhoto: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // OTP workflow states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Result credentials modal
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch the registered user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 1. Click "Send OTP"
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (isSendingOtpRef.current) return;
    if (!formData.email) {
      setError('Email address is required to send OTP.');
      return;
    }
    setError('');
    setSuccess('');
    setSendingOtp(true);
    isSendingOtpRef.current = true;

    try {
      const res = await UserService.adminSendOtp(formData.email);
      setOtpSent(true);
      setSuccess(res.message || 'OTP sent successfully! Please check the recipient\'s email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification OTP.');
    } finally {
      setSendingOtp(false);
      isSendingOtpRef.current = false;
    }
  };

  // 2. Click "Verify OTP"
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isVerifyingOtpRef.current) return;
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setError('');
    setSuccess('');
    setVerifyingOtp(true);
    isVerifyingOtpRef.current = true;

    try {
      const res = await UserService.adminVerifyOtp(formData.email, otpCode.trim());
      setOtpVerified(true);
      setSuccess(res.message || 'OTP verified successfully! Please customize the credentials below.');
      
      // Fetch suggested credentials
      try {
        const suggestions = await UserService.adminSuggestCredentials(formData.role);
        setFormData((prev) => ({
          ...prev,
          username: suggestions.username || '',
          password: suggestions.password || '',
        }));
      } catch (sugErr) {
        console.error('Failed to suggest credentials:', sugErr);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingOtp(false);
      isVerifyingOtpRef.current = false;
    }
  };

  // 3. Click "Create User"
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (isCreatingUserRef.current) return;
    if (!otpVerified) {
      setError('Please verify the OTP before creating the user.');
      return;
    }
    if (!formData.fullName || !formData.email || !formData.mobile || !formData.role) {
      setError('All fields are required.');
      return;
    }
    if (!formData.username || !formData.password) {
      setError('Username and Password are required.');
      return;
    }
    setError('');
    setSuccess('');
    setCreatingUser(true);
    isCreatingUserRef.current = true;

    try {
      const credentials = await UserService.adminCreateUser(formData);
      setGeneratedCredentials(credentials);
      setShowCredentialsModal(true);
      setSuccess('Account created successfully!');
      
      // Reset form states
      setFormData({
        fullName: '',
        email: '',
        mobile: '',
        role: 'ROLE_RECEPTION',
        username: '',
        password: '',
        profilePhoto: '',
      });
      setOtpCode('');
      setOtpSent(false);
      setOtpVerified(false);
      
      // Refresh list
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while creating user account.');
    } finally {
      setCreatingUser(false);
      isCreatingUserRef.current = false;
    }
  };

  // Initiate Edit Mode
  const handleEditUser = (userToEdit) => {
    setError('');
    setSuccess('');
    setIsEditing(true);
    setEditingUserId(userToEdit.userId);
    setFormData({
      fullName: userToEdit.fullName || '',
      email: userToEdit.email || '',
      mobile: userToEdit.mobile || '',
      role: userToEdit.role || 'ROLE_RECEPTION',
      username: userToEdit.username || '',
      password: userToEdit.plainPassword || '',
      profilePhoto: userToEdit.profilePhoto || '',
    });
    setOtpVerified(true); // bypass OTP for editing existing accounts
    setOtpSent(false);
  };

  // Cancel Edit Mode
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      role: 'ROLE_RECEPTION',
      username: '',
      password: '',
      profilePhoto: '',
    });
    setOtpVerified(false);
    setOtpSent(false);
    setOtpCode('');
  };

  // Submit User Update
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.mobile || !formData.role) {
      setError('All fields are required.');
      return;
    }
    if (!formData.username) {
      setError('Username is required.');
      return;
    }
    setError('');
    setSuccess('');
    setCreatingUser(true); // reuse loader state

    try {
      const updatePayload = {
        ...formData,
        confirmPassword: formData.password
      };
      await UserService.updateUser(editingUserId, updatePayload);
      setSuccess(`User account ${formData.username} updated successfully!`);
      
      if (user && formData.username === user.username) {
        if (typeof refreshProfile === 'function') {
          await refreshProfile();
        }
      }

      handleCancelEdit();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while updating user account.');
    } finally {
      setCreatingUser(false);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (id, username) => {
    if (username === 'admin') {
      alert('The primary system admin account cannot be deleted!');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user: ${username}?`)) {
      setError('');
      setSuccess('');
      try {
        await UserService.deleteUser(id);
        setSuccess(`User account ${username} deleted successfully.`);
        if (isEditing && editingUserId === id) {
          handleCancelEdit();
        }
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  const handleCloseCredentialsModal = () => {
    setShowCredentialsModal(false);
    setGeneratedCredentials(null);
  };

  const formatRole = (role) => {
    return role ? role.replace('ROLE_', '') : '';
  };

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>User Account Directory</h2>
          <p>Create staff credentials, dispatch email OTPs, and control operator system accesses</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px' }}>
        {/* Left Panel: Registered Users */}
        <div className="content-card">
          <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} /> Registered Operator Accounts
          </h3>
          
          {loading ? (
            <div style={{ padding: '20px 0', color: 'var(--text-muted)' }}>Loading accounts...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No users registered.</div>
          ) : (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId}>
                      <td className="font-bold">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-soft)', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>
                              {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <span>{u.fullName}</span>
                        </div>
                      </td>
                      <td>{u.username}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                            {visiblePasswords[u.userId] 
                              ? (u.username === 'admin' && !u.plainPassword ? 'admin123' : u.plainPassword || 'Hashed')
                              : '••••••••'
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.userId)}
                            style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                            title={visiblePasswords[u.userId] ? "Hide Password" : "Show Password"}
                          >
                            {visiblePasswords[u.userId] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          u.role === 'ROLE_ADMIN' ? 'badge-primary' : (u.role === 'ROLE_SECURITY' ? 'badge-dark' : 'badge-info')
                        }`}>
                          {formatRole(u.role)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="btn-action"
                            title="Edit User details"
                          >
                            <Edit size={13} /> Edit
                          </button>
                          {u.username !== 'admin' ? (
                            <button
                              onClick={() => handleDeleteUser(u.userId, u.username)}
                              className="btn-action btn-action-delete"
                              title="Delete Account"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', padding: '0 8px' }}>System</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel: Creation / Editing Form */}
        <div className="content-card">
          <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} /> {isEditing ? 'Edit User Details' : 'Email OTP-Based Registration'}
          </h3>
          
          <form onSubmit={isEditing ? handleUpdateUser : handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            


            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={(!isEditing && otpVerified) || sendingOtp || verifyingOtp || creatingUser}
                placeholder="Full name of staff"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={(!isEditing && (otpSent || otpVerified)) || sendingOtp || verifyingOtp || creatingUser}
                placeholder="staff@company.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="mobile">Mobile Number</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                disabled={(!isEditing && otpVerified) || sendingOtp || verifyingOtp || creatingUser}
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="role">Account Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={(!isEditing && otpVerified) || sendingOtp || verifyingOtp || creatingUser}
                required
              >
                <option value="ROLE_ADMIN">Administrator</option>
                <option value="ROLE_RECEPTION">Receptionist</option>
                <option value="ROLE_SECURITY">Security Officer</option>
              </select>
            </div>

            {/* Step 1: Send OTP trigger */}
            {!otpVerified && !isEditing && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || !formData.email || otpVerified}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {sendingOtp ? 'Sending OTP Code...' : (otpSent ? 'Resend Verification OTP' : 'Send OTP Code')}
              </button>
            )}

            {/* Step 2: OTP Verification Card */}
            {otpSent && !otpVerified && !isEditing && (
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="otpCode" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Enter Verification OTP</label>
                  <input
                    type="text"
                    id="otpCode"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="------"
                    maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }}
                    required
                  />
                  <small className="help-text-block">OTP dispatched to {formData.email}. Valid for 5 minutes.</small>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length !== 6}
                  className="btn btn-secondary"
                  style={{ width: '100%', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'var(--primary-light)' }}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}

            {/* Step 3: Username & Password Configuration */}
            {(otpVerified || isEditing) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1.5px dashed var(--border-soft)', paddingTop: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter Username"
                    disabled={creatingUser}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showFormPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter Password"
                      disabled={creatingUser}
                      required={!isEditing}
                      style={{ paddingRight: '50px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-actions-row">
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={creatingUser}>
                    {isEditing ? 'Save Updates' : 'Register Operator'}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" disabled={creatingUser}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Generated Credentials Popup Modal */}
      <AnimatePresence>
        {showCredentialsModal && generatedCredentials && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-box"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)' }}
            >
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={22} style={{ color: 'var(--success)' }} /> Staff Account Registered
                </h3>
              </div>
              <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.2)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-dark)' }}>
                  <AlertCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  Please copy these auto-generated credentials and hand them to the operator safely.
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Operator Name</span>
                  <div style={{ padding: '10px 14px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.01)', fontWeight: 'bold' }}>
                    {generatedCredentials.fullName}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Assigned Username</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.01)', fontFamily: 'monospace', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      {generatedCredentials.username}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.username);
                        setCopiedUsername(true);
                        setTimeout(() => setCopiedUsername(false), 2000);
                      }}
                      className="btn btn-secondary"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid var(--border-soft)'
                      }}
                      title="Copy Username"
                    >
                      {copiedUsername ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
                      <span style={{ fontSize: '12px' }}>{copiedUsername ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>Temporary Password</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.01)', fontFamily: 'monospace', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      {generatedCredentials.password}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.password);
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      className="btn btn-secondary"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid var(--border-soft)'
                      }}
                      title="Copy Password"
                    >
                      {copiedPassword ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
                      <span style={{ fontSize: '12px' }}>{copiedPassword ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
                <button onClick={handleCloseCredentialsModal} className="btn btn-primary">
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
