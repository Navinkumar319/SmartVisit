import React, { useState, useEffect } from 'react';
import SystemService from '../services/system.service';
import DepartmentService from '../services/department.service';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Building, 
  Upload, 
  Sliders, 
  Save, 
  BellRing,
  Mail,
  MessageSquare,
  MapPin,
  Plus,
  Trash2,
  Edit,
  Check,
  X
} from 'lucide-react';

const formatLogoSrc = (logo) => {
  if (!logo) return '';
  if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/')) {
    return logo;
  }
  return `data:image/png;base64,${logo}`;
};

const SettingsPage = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
    visitorIdFormat: 'VIS-',
    emailNotification: true,
    smsNotification: false,
  });

  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Department state variables
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', roomNo: '', floor: '' });
  const [newDeptData, setNewDeptData] = useState({ name: '', roomNo: '', floor: '' });
  const [deptError, setDeptError] = useState('');
  const [deptSuccess, setDeptSuccess] = useState('');
  const [deptSaving, setDeptSaving] = useState(false);

  const fetchDepartments = async () => {
    setDeptLoading(true);
    try {
      const list = await DepartmentService.getAllDepartments();
      setDepartments(list);
    } catch (err) {
      setDeptError('Failed to load departments.');
    } finally {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleEditClick = (dept) => {
    setEditingDeptId(dept.id);
    setEditFormData({
      name: dept.name,
      roomNo: dept.roomNo || '',
      floor: dept.floor || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingDeptId(null);
    setEditFormData({ name: '', roomNo: '', floor: '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewDeptChange = (e) => {
    const { name, value } = e.target;
    setNewDeptData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateDept = async (id) => {
    if (!editFormData.name) {
      setDeptError('Department Name is required.');
      return;
    }
    setDeptSaving(true);
    setDeptError('');
    setDeptSuccess('');
    try {
      const updated = await DepartmentService.updateDepartment(id, editFormData);
      setDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setEditingDeptId(null);
      setDeptSuccess('Department updated successfully!');
    } catch (err) {
      setDeptError(err.response?.data?.message || 'Failed to update department.');
    } finally {
      setDeptSaving(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDeptData.name) {
      setDeptError('Department Name is required.');
      return;
    }
    setDeptSaving(true);
    setDeptError('');
    setDeptSuccess('');
    try {
      const created = await DepartmentService.createDepartment(newDeptData);
      setDepartments((prev) => [...prev, created]);
      setNewDeptData({ name: '', roomNo: '', floor: '' });
      setDeptSuccess('Department added successfully!');
    } catch (err) {
      setDeptError(err.response?.data?.message || 'Failed to add department.');
    } finally {
      setDeptSaving(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    setDeptSaving(true);
    setDeptError('');
    setDeptSuccess('');
    try {
      await DepartmentService.deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      setDeptSuccess('Department deleted successfully!');
    } catch (err) {
      setDeptError(err.response?.data?.message || 'Failed to delete department.');
    } finally {
      setDeptSaving(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await SystemService.getSettings();
        if (data) {
          setFormData({
            companyName: data.companyName,
            companyLogo: data.companyLogo || '',
            visitorIdFormat: data.visitorIdFormat,
            emailNotification: data.emailNotification,
            smsNotification: data.smsNotification,
          });
          if (data.companyLogo) {
            setLogoPreview(data.companyLogo);
          }
        }
      } catch (err) {
        setError('Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size should be less than 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          companyLogo: reader.result,
        }));
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.companyName) {
      setError('Company Name is required.');
      return;
    }
    if (!formData.visitorIdFormat) {
      setError('Visitor ID Format prefix is required.');
      return;
    }

    setSaving(true);
    try {
      await SystemService.saveSettings(formData);
      setSuccess('System settings updated successfully! Please refresh or navigate to see changes in header.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Loading configurations...</div>;

  return (
    <div className="page-wrapper" style={{ animation: 'fadeIn 0.6s ease' }}>
      <div className="page-header-row">
        <div>
          <h2>System Settings</h2>
          <p>Configure corporate profile preferences and customize notification endpoints</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="visitor-register-form">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          
          {/* Left Columns: Configs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Profile Panel */}
            <div className="content-card">
              <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} /> Company Profile Settings
              </h3>
              
              <div className="form-grid-3">
                <div className="form-group double-span">
                  <label htmlFor="companyName">Corporate Company Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="E.g., Acma Corporation Ltd"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="visitorIdFormat">Gate Pass Code Prefix <span className="required-star">*</span></label>
                  <input
                    type="text"
                    id="visitorIdFormat"
                    name="visitorIdFormat"
                    value={formData.visitorIdFormat}
                    onChange={handleChange}
                    placeholder="E.g., VIS-"
                    required
                    readOnly
                    style={{ backgroundColor: 'var(--border-soft)', cursor: 'not-allowed', textTransform: 'uppercase' }}
                  />
                  <small className="help-text-block">e.g. VIS-11022026-1</small>
                </div>
              </div>
            </div>

            {/* Notification channels configuration */}
            <div className="content-card">
              <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} /> Dispatch Notification preferences
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Mail size={20} style={{ color: 'var(--primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 'bold' }}>Email Notification Dispatch</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automate visitor pass approvals to hosts over email.</span>
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      name="emailNotification"
                      checked={formData.emailNotification}
                      onChange={handleChange}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: formData.emailNotification ? 'var(--primary)' : 'var(--border-soft)',
                      borderRadius: '34px', transition: '0.4s'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                        backgroundColor: 'white', borderRadius: '50%', transition: '0.4s',
                        transform: formData.emailNotification ? 'translateX(24px)' : 'translateX(0)'
                      }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <MessageSquare size={20} style={{ color: 'var(--accent)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 'bold' }}>SMS Gateway Alert Dispatch</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Send SMS passcode links to visitor mobiles on check-in.</span>
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      name="smsNotification"
                      checked={formData.smsNotification}
                      onChange={handleChange}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: formData.smsNotification ? 'var(--primary)' : 'var(--border-soft)',
                      borderRadius: '34px', transition: '0.4s'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                        backgroundColor: 'white', borderRadius: '50%', transition: '0.4s',
                        transform: formData.smsNotification ? 'translateX(24px)' : 'translateX(0)'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Department Locations & Routing Configurations */}
            <div className="content-card">
              <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <MapPin size={18} style={{ color: 'var(--primary)' }} /> Department Locations & Routing
              </h3>
              
              {deptError && <div className="alert alert-danger" style={{ marginBottom: '15px' }}>{deptError}</div>}
              {deptSuccess && <div className="alert alert-success" style={{ marginBottom: '15px' }}>{deptSuccess}</div>}

              {/* Add New Department Form */}
              <div style={{ padding: '16px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} style={{ color: 'var(--primary)' }} /> Add New Department Routing Location
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', marginBottom: '4px' }}>Department Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newDeptData.name}
                      onChange={handleNewDeptChange}
                      placeholder="e.g. R&D Department"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', marginBottom: '4px' }}>Floor Location</label>
                    <input
                      type="text"
                      name="floor"
                      value={newDeptData.floor}
                      onChange={handleNewDeptChange}
                      placeholder="e.g. 3rd Floor"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', marginBottom: '4px' }}>Room Number</label>
                    <input
                      type="text"
                      name="roomNo"
                      value={newDeptData.roomNo}
                      onChange={handleNewDeptChange}
                      placeholder="e.g. Room 305"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateDept}
                    className="btn btn-primary"
                    disabled={deptSaving || !newDeptData.name}
                    style={{ padding: '9px 16px', height: 'fit-content' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Department Locations List */}
              {deptLoading ? (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading departments...</div>
              ) : departments.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No department routing configured. Add one above.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1.5px solid var(--border-soft)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)' }}>Department Name</th>
                        <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)' }}>Floor</th>
                        <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)' }}>Room Number</th>
                        <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'center', width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((dept) => {
                        const isEditing = editingDeptId === dept.id;
                        return (
                          <tr key={dept.id} style={{ borderBottom: '1px solid var(--border-soft)', transition: 'background 0.2s' }}>
                            {isEditing ? (
                              <>
                                <td style={{ padding: '8px 12px' }}>
                                  <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditChange}
                                    style={{ padding: '6px 10px', fontSize: '13px', width: '100%' }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                  <input
                                    type="text"
                                    name="floor"
                                    value={editFormData.floor}
                                    onChange={handleEditChange}
                                    style={{ padding: '6px 10px', fontSize: '13px', width: '100%' }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                  <input
                                    type="text"
                                    name="roomNo"
                                    value={editFormData.roomNo}
                                    onChange={handleEditChange}
                                    style={{ padding: '6px 10px', fontSize: '13px', width: '100%' }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDept(dept.id)}
                                    className="btn btn-primary"
                                    style={{ padding: '6px', minWidth: 'auto', background: 'var(--success)', borderColor: 'var(--success)' }}
                                    title="Save changes"
                                    disabled={deptSaving}
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px', minWidth: 'auto' }}
                                    title="Cancel"
                                    disabled={deptSaving}
                                  >
                                    <X size={14} />
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ padding: '12px 16px', fontSize: '13.5px', color: 'var(--text-dark)', fontWeight: '500' }}>{dept.name}</td>
                                <td style={{ padding: '12px 16px', fontSize: '13.5px', color: 'var(--text-muted)' }}>{dept.floor || 'N/A'}</td>
                                <td style={{ padding: '12px 16px', fontSize: '13.5px', color: 'var(--text-muted)' }}>{dept.roomNo || 'N/A'}</td>
                                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEditClick(dept)}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px', minWidth: 'auto' }}
                                    title="Edit routing details"
                                    disabled={deptSaving}
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDept(dept.id)}
                                    className="btn"
                                    style={{ padding: '6px', minWidth: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                    title="Delete department"
                                    disabled={deptSaving}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="form-actions-row">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving System Preferences...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Right Columns: Logo Upload preview */}
          <div className="content-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: 'fit-content' }}>
            <h3 className="section-title-alt" style={{ width: '100%' }}>Company Branding</h3>
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '14px', border: '2px solid var(--primary)', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '10px' }}>
                {logoPreview ? (
                  <img src={formatLogoSrc(logoPreview)} alt="Branding Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Upload size={28} />
                    <span>Upload Logo</span>
                  </div>
                )}
              </div>

              <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                <button type="button" className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
                  Choose Logo
                </button>
                <input
                  type="file"
                  id="logoFile"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ position: 'absolute', fontSize: '100px', left: 0, top: 0, opacity: 0, cursor: 'pointer' }}
                />
              </div>
              <small className="help-text-block">Corporate corporate branding logo. Recommended square PNG format (Max 2MB).</small>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
