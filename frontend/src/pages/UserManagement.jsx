import React, { useState, useEffect, useRef } from 'react';
import UserService from '../services/user.service';

const UserManagement = () => {
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

  // Form input fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    role: 'ROLE_RECEPTION',
    username: '',
    password: '',
  });

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
    });
    setOtpVerified(true); // bypass OTP for editing
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
    if (!formData.username || !formData.password) {
      setError('Username and Password are required.');
      return;
    }
    setError('');
    setSuccess('');
    setCreatingUser(true); // reuse loader state

    try {
      const updatePayload = {
        ...formData,
        confirmPassword: formData.password // fulfill password verification match on backend
      };
      await UserService.updateUser(editingUserId, updatePayload);
      setSuccess(`User account ${formData.username} updated successfully!`);
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
        <h2>User Management</h2>
        <p>Admin workspace to manage staff accounts, edit user details, and verify email OTPs</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="manage-users-layout">
        {/* Left Side: Existing Users */}
        <div className="users-list-panel">
          <h3 className="panel-title">Registered Staff Accounts</h3>
          {loading ? (
            <div style={{ padding: '20px 0' }}>Loading accounts...</div>
          ) : users.length === 0 ? (
            <div className="card-empty-state">No users registered in the system.</div>
          ) : (
            <div className="table-responsive">
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
                      <td className="font-bold">{u.fullName}</td>
                      <td>{u.username}</td>
                      <td>
                        {u.username === 'admin' ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>admin123 (Seeded)</span>
                        ) : (
                          u.plainPassword || <span style={{ fontStyle: 'italic', fontSize: '11px', color: 'var(--text-muted)' }}>Hashed</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'ROLE_ADMIN' ? 'badge-primary' : (u.role === 'ROLE_SECURITY' ? 'badge-dark' : 'badge-info')}`}>
                          {formatRole(u.role)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-flex">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="btn-action btn-action-edit"
                            title="Edit User details"
                          >
                            Edit
                          </button>
                          {u.username !== 'admin' ? (
                            <button
                              onClick={() => handleDeleteUser(u.userId, u.username)}
                              className="btn-action btn-action-delete"
                              title="Delete Account"
                            >
                              Delete
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '4px' }}>Default</span>
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

        {/* Right Side: Secure User Creation / Editing Form */}
        <div className="user-form-panel">
          <h3 className="panel-title">{isEditing ? 'Edit User Details' : 'OTP-Based User Registration'}</h3>
          <div className="user-crud-form" style={{ marginTop: '16px' }}>
            
            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isEditing || otpSent || otpVerified || sendingOtp || verifyingOtp || creatingUser}
                placeholder="staff@company.com"
                required
              />
              {isEditing && <small className="help-text-block" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email address cannot be changed while editing.</small>}
            </div>

            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="role">Account Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={(!isEditing && otpVerified) || sendingOtp || verifyingOtp || creatingUser}
                required
              >
                <option value="ROLE_RECEPTION">Receptionist</option>
                <option value="ROLE_SECURITY">Security Officer</option>
              </select>
            </div>

            {/* OTP Sending Button */}
            {!otpVerified && !isEditing && (
              <div style={{ marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !formData.email || otpVerified}
                  className="btn btn-primary btn-block"
                >
                  {sendingOtp ? 'Sending OTP...' : (otpSent ? 'Resend Verification OTP' : 'Send OTP')}
                </button>
              </div>
            )}

            {/* Step 2: OTP Verification Box */}
            {otpSent && !otpVerified && !isEditing && (
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="otpCode" style={{ color: 'var(--primary)', fontWeight: '600' }}>Enter Verification OTP</label>
                  <input
                    type="text"
                    id="otpCode"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }}
                    required
                  />
                  <small className="help-text-block">An OTP has been dispatched to {formData.email}. It is valid for 5 minutes.</small>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length !== 6}
                  className="btn btn-secondary btn-block"
                  style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                >
                  {verifyingOtp ? 'Verifying OTP...' : 'Verify OTP'}
                </button>
              </div>
            )}

             {/* Step 3: Account Creation / Edit Actions (Only shown once verified/editing) */}
            {(otpVerified || isEditing) && (
              <div style={{ marginTop: '20px' }}>
                {!isEditing && (
                  <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '12.5px', marginBottom: '16px', textAlign: 'center' }}>
                    Email verified successfully. Please review and customize the login credentials below:
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '12px' }}>
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

                <div className="form-group" style={{ marginBottom: '16px' }}>
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
                      required
                      style={{ paddingRight: '60px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {showFormPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <small className="help-text-block" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit, and 1 special char.
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={isEditing ? handleUpdateUser : handleCreateUser}
                    disabled={creatingUser}
                    className="btn btn-primary"
                    style={{ flex: 2, backgroundColor: isEditing ? 'var(--primary)' : 'var(--success)', border: 'none' }}
                  >
                    {creatingUser 
                      ? (isEditing ? 'Updating Details...' : 'Creating Account...') 
                      : (isEditing ? 'Update User Details' : 'Create User')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credentials Modal (Generated Credentials displayed exactly once) */}
      {showCredentialsModal && generatedCredentials && (
        <div className="otp-modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
          <div className="otp-modal-card" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: 'var(--radius-lg)', maxWidth: '480px', width: '90%', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
            <div className="otp-modal-header" style={{ marginBottom: '20px' }}>
              <div className="otp-modal-icon" style={{ display: 'inline-flex', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--success-light)', color: 'var(--success)', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-dark)' }}>User Account Registered</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                The account has been created successfully. Below are the final credentials.
                <br />
                <strong style={{ color: 'var(--danger)', display: 'block', marginTop: '6px' }}>Copy and save these credentials now. They will only be shown once!</strong>
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Account Username</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={generatedCredentials.username}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', backgroundColor: '#fff', color: 'var(--text-dark)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCredentials.username);
                      alert('Username copied to clipboard!');
                    }}
                    style={{ padding: '8px 12px', fontSize: '11.5px', height: '36px' }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Account Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={generatedCredentials.password}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', backgroundColor: '#fff', color: 'var(--text-dark)', fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCredentials.password);
                      alert('Password copied to clipboard!');
                    }}
                    style={{ padding: '8px 12px', fontSize: '11.5px', height: '36px' }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseCredentialsModal}
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              Okay, Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
