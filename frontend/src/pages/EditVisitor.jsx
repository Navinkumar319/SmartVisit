import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VisitorService from '../services/visitor.service';

const EditVisitor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    companyName: '',
    purpose: '',
    personToMeet: '',
    department: '',
    visitDate: '',
    expectedTime: '',
    idProofType: '',
    idNumber: '',
    photo: '',
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const data = await VisitorService.getVisitorById(id);
        if (data) {
          setFormData({
            name: data.name,
            mobile: data.mobile,
            email: data.email,
            companyName: data.companyName || '',
            purpose: data.purpose,
            personToMeet: data.personToMeet,
            department: data.department,
            visitDate: data.visitDate,
            expectedTime: data.expectedTime,
            idProofType: data.idProofType,
            idNumber: data.idNumber,
            photo: data.photo || '',
          });
          if (data.photo) {
            setPhotoPreview(data.photo);
          }
        }
      } catch (err) {
        setError('Failed to load visitor details.');
      } finally {
        setLoading(false);
      }
    };
    fetchVisitor();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size should be less than 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo: reader.result,
        }));
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photo: '',
    }));
    setPhotoPreview('');
    const fileInput = document.getElementById('photo');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSaving(true);
    try {
      await VisitorService.updateVisitor(id, formData);
      setSuccess('Visitor details updated successfully!');
      setTimeout(() => {
        navigate('/visitors');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving updates.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-4">Loading details...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <h2>Edit Visitor Details</h2>
        <p>Modify registration details for visitor record</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="visitor-register-form">
        <div className="form-section-title">Visitor Information</div>
        <div className="form-grid-3">
          <div className="form-group">
            <label htmlFor="name">Visitor Name <span className="required-star">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Mobile Number <span className="required-star">*</span></label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address <span className="required-star">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="idProofType">ID Proof Type <span className="required-star">*</span></label>
            <select
              id="idProofType"
              name="idProofType"
              value={formData.idProofType}
              onChange={handleChange}
              required
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="PAN Card">PAN Card</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
              <option value="Office ID Card">Office ID Card</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="idNumber">ID Proof Number <span className="required-star">*</span></label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-section-title">Visit Details</div>
        <div className="form-grid-3">
          <div className="form-group">
            <label htmlFor="personToMeet">Person to Meet <span className="required-star">*</span></label>
            <input
              type="text"
              id="personToMeet"
              name="personToMeet"
              value={formData.personToMeet}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department <span className="required-star">*</span></label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="HR / Recruitment">HR / Recruitment</option>
              <option value="IT / Software Engineering">IT / Software Engineering</option>
              <option value="Sales / Marketing">Sales / Marketing</option>
              <option value="Finance / Accounts">Finance / Accounts</option>
              <option value="Operations / Admin">Operations / Admin</option>
              <option value="Executive Management">Executive Management</option>
            </select>
          </div>

          <div className="form-group double-span">
            <label htmlFor="purpose">Purpose Of Visit <span className="required-star">*</span></label>
            <input
              type="text"
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-section-title">Visitor Photo</div>
        <div className="form-photo-upload-section">
          <div className="form-group">
            <label htmlFor="photo">Update Visitor Photo</label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              className="file-input"
            />
            <small className="help-text-block">Upload a new photo to replace current photo (Max 5MB)</small>
          </div>
          {photoPreview && (
            <div className="photo-upload-preview-box">
              <span className="preview-label">Current Photo:</span>
              <img src={photoPreview} alt="Preview" className="uploaded-photo-preview" />
              <button 
                type="button" 
                onClick={handleRemovePhoto} 
                className="btn-remove-photo"
                style={{
                  display: 'block',
                  marginTop: '8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Delete Photo
              </button>
            </div>
          )}
        </div>

        <div className="form-actions-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Updating...' : 'Save Updates'}
          </button>
          <button type="button" onClick={() => navigate('/visitors')} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditVisitor;
