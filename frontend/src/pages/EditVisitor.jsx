import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VisitorService from '../services/visitor.service';
import DepartmentService from '../services/department.service';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  Briefcase, 
  Camera, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  Trash2
} from 'lucide-react';

const EditVisitor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const list = await DepartmentService.getAllDepartments();
        setDepartments(list);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    companyName: '',
    purpose: '',
    personToMeet: '',
    department: '',
    visitDate: '',
    idProofType: '',
    idNumber: '',
    photo: '',
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, label: 'Personal Information', icon: User },
    { id: 2, label: 'Company & Identity', icon: Building2 },
    { id: 3, label: 'Visit Details', icon: Briefcase },
    { id: 4, label: 'Photo Upload', icon: Camera },
    { id: 5, label: 'Review & Submit', icon: CheckCircle2 }
  ];

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

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.mobile || !formData.email) {
        setError('Please fill in all mandatory personal details.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.idProofType || !formData.idNumber) {
        setError('Please fill in identity details.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.personToMeet || !formData.department || !formData.purpose) {
        setError('Please fill in meeting details.');
        return;
      }
    }
    
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        visitDate: formData.visitDate || null,
      };
      await VisitorService.updateVisitor(id, dataToSend);
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

  if (loading) return <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Loading details...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-header-row justify-between">
        <div>
          <h2>Edit Visitor Details</h2>
          <p>Modify registration details for visitor record</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Steps Tracker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative', overflowX: 'auto', padding: '10px 0' }}>
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          
          return (
            <div 
              key={step.id} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                flex: 1, 
                minWidth: '90px',
                position: 'relative' 
              }}
            >
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: isCompleted || isActive ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' : 'var(--border-soft)',
                  color: isCompleted || isActive ? 'white' : 'var(--text-muted)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '700',
                  boxShadow: isActive ? '0 0 12px var(--primary-glow)' : 'none',
                  border: isActive ? '2px solid white' : 'none',
                  zIndex: 2,
                  transition: 'all 0.3s ease'
                }}
              >
                <StepIcon size={18} />
              </div>
              <span 
                style={{ 
                  fontSize: '11.5px', 
                  fontWeight: '600', 
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  marginTop: '8px', 
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {step.label}
              </span>
              
              {/* connector lines */}
              {i < steps.length - 1 && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    right: '-50%',
                    height: '2px',
                    background: step.id < currentStep ? 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)' : 'var(--border-soft)',
                    zIndex: 1
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="visitor-register-form content-card">
        {/* Step 1 */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <div className="form-section-title">Personal Information</div>
          <div className="form-grid-3">
            <div className="form-group">
              <label htmlFor="name">Visitor Name <span className="required-star">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={currentStep === 1}
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
                required={currentStep === 1}
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
                required={currentStep === 1}
              />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <div className="form-section-title">Company & Identity Details</div>
          <div className="form-grid-3">
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
                required={currentStep === 2}
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
                required={currentStep === 2}
              />
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
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
                required={currentStep === 3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department <span className="required-star">*</span></label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required={currentStep === 3}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="visitDate">Visit Date</label>
              <input
                type="date"
                id="visitDate"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
              />
            </div>


            <div className="form-group double-span">
              <label htmlFor="purpose">Purpose Of Visit <span className="required-star">*</span></label>
              <input
                type="text"
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required={currentStep === 3}
              />
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
          <div className="form-section-title">Visitor Photo</div>
          <div className="form-photo-upload-section">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="photo">Upload Visitor Photo</label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="file-input"
              />
              <small className="help-text-block">Upload a clear visitor photo to replace current (Max 5MB)</small>
            </div>
            {photoPreview && (
              <div className="photo-upload-preview-box">
                <span className="preview-label">Photo Preview:</span>
                <div style={{ position: 'relative' }}>
                  <img src={photoPreview} alt="Preview" className="uploaded-photo-preview" />
                  <button 
                    type="button" 
                    onClick={handleRemovePhoto}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 5 */}
        <div style={{ display: currentStep === 5 ? 'block' : 'none' }}>
          <div className="form-section-title">Review & Save Updates</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '24px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Name:</strong> {formData.name}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Mobile:</strong> {formData.mobile}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Email:</strong> {formData.email}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Company:</strong> {formData.companyName || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>ID Type:</strong> {formData.idProofType} ({formData.idNumber})</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Host to Meet:</strong> {formData.personToMeet} ({formData.department})</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Visit Date:</strong> {formData.visitDate || 'N/A'}</div>

              <div style={{ gridColumn: 'span 2' }}><strong style={{ color: 'var(--text-muted)' }}>Purpose:</strong> {formData.purpose}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="preview-label" style={{ marginBottom: '8px' }}>Photo</span>
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--primary)' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', background: 'var(--border-soft)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>No Photo</div>
              )}
            </div>
          </div>
        </div>

        {/* Wizard Navigation */}
        <div className="form-actions-row" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border-soft)', paddingTop: '20px' }}>
          <div>
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn btn-secondary">
                <ChevronLeft size={16} />
                Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep < 5 ? (
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving Updates...' : 'Save Updates'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditVisitor;
