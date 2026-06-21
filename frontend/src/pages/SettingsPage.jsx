import React, { useState, useEffect } from 'react';
import SystemService from '../services/system.service';

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
      // Refresh page after delay to reload Layout Header
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-4">Loading configurations...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <h2>System Settings</h2>
        <p>Configure company profile and system notifications preferences</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="visitor-register-form">
        <div className="form-section-title">Company Profile Settings</div>
        
        <div className="form-grid-3">
          <div className="form-group double-span">
            <label htmlFor="companyName">Company Name <span className="required-star">*</span></label>
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
            <label htmlFor="visitorIdFormat">Visitor ID Format Prefix <span className="required-star">*</span></label>
            <input
              type="text"
              id="visitorIdFormat"
              name="visitorIdFormat"
              value={formData.visitorIdFormat}
              onChange={handleChange}
              placeholder="E.g., VIS-"
              required
            />
            <small className="help-text-block">Prefix prefixing incremental numbers (e.g. VIS-1001)</small>
          </div>
        </div>

        <div className="form-photo-upload-section">
          <div className="form-group">
            <label htmlFor="logoFile">Upload Company Logo</label>
            <input
              type="file"
              id="logoFile"
              accept="image/*"
              onChange={handleLogoChange}
              className="file-input"
            />
            <small className="help-text-block">Upload your corporate logo (Max 2MB, square format recommended)</small>
          </div>
          {logoPreview && (
            <div className="photo-upload-preview-box">
              <span className="preview-label">Current Logo:</span>
              <img src={formatLogoSrc(logoPreview)} alt="Logo Preview" className="settings-logo-preview" />
            </div>
          )}
        </div>

        <div className="form-actions-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
