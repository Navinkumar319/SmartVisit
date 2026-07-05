import React, { useState, useEffect } from 'react';
import SystemService from '../services/system.service';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Building, 
  Upload, 
  Sliders, 
  Save, 
  BellRing,
  Mail,
  MessageSquare
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
                    placeholder="E.g., vis-"
                    required
                  />
                  <small className="help-text-block">e.g. vis-11022026-1</small>
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
