import React, { useState, useRef, useEffect } from 'react';
import VisitorService from '../services/visitor.service';
import DepartmentService from '../services/department.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Building2, 
  Briefcase, 
  Camera, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw
} from 'lucide-react';

const RegisterVisitor = () => {
  const { user } = useAuth();
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
  const initialFormState = {
    name: '',
    mobile: '',
    email: '',
    companyName: '',
    purpose: '',
    personToMeet: '',
    department: '',
    visitDate: '',
    idProofType: 'Aadhaar Card',
    idNumber: '',
    photo: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);



  // Receptionist Confirmation Modal State
  const [showReceptionistModal, setShowReceptionistModal] = useState(false);
  const [receptionistNameInput, setReceptionistNameInput] = useState('');

  useEffect(() => {
    if (user) {
      setReceptionistNameInput(user.fullName || user.username || '');
    }
  }, [user]);

  // Webcam Capture Specific State & Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);

  const steps = [
    { id: 1, label: 'Visitor Photo', icon: Camera },
    { id: 2, label: 'Personal Information', icon: User },
    { id: 3, label: 'Company & Identity', icon: Building2 },
    { id: 4, label: 'Visit Details', icon: Briefcase },
    { id: 5, label: 'Review & Submit', icon: CheckCircle2 }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // Webcam lifecycle controls
  useEffect(() => {
    if (currentStep === 1) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentStep]);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setIsCaptured(false);
      
      // Set stream to video ref with a tiny delay to ensure React has mounted the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(playErr => {
            console.error('Video play error:', playErr);
          });
        }
      }, 50);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access webcam. Please check permissions or upload a photo.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      setError('');
      try {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        
        // Capture the center square of the camera stream (unzoomed/uncropped)
        const size = Math.min(videoWidth, videoHeight);
        const sourceX = (videoWidth - size) / 2;
        const sourceY = (videoHeight - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Failed to initialize canvas context.');
          return;
        }
        
        // Mirror image horizontally for intuitive selfie style capture
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        
        // Draw the full centered square of the video frame
        ctx.drawImage(videoRef.current, sourceX, sourceY, size, size, 0, 0, 300, 300);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData((prev) => ({
          ...prev,
          photo: dataUrl,
        }));
        setPhotoPreview(dataUrl);
        setIsCaptured(true);
        stopCamera();
      } catch (err) {
        console.error('Photo capture failed:', err);
        setError('Error capturing photo from camera stream.');
      }
    }
  };

  const retakePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photo: '',
    }));
    setPhotoPreview('');
    setIsCaptured(false);
    startCamera();
  };

  // Convert uploaded image to Base64 string
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size should be less than 5MB.');
        return;
      }
      
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result;
        setFormData((prev) => ({
          ...prev,
          photo: photoData,
        }));
        setPhotoPreview(photoData);
        setIsCaptured(true);
        stopCamera();
      };
      reader.onerror = () => {
        setError('Failed to process the uploaded photo file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    stopCamera();
    setFormData(initialFormState);
    setPhotoPreview('');
    setError('');
    setSuccess('');
    setIsCaptured(false);
    setCurrentStep(1);
  };

  const nextStep = () => {
    // Basic validation before going next
    if (currentStep === 1) {
      if (!formData.photo) {
        setError('Please capture visitor photo using the webcam or upload a photo to proceed.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.name || !formData.mobile || !formData.email) {
        setError('Please fill in all mandatory personal details.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.idProofType || !formData.idNumber) {
        setError('Please fill in identity details.');
        return;
      }
    }
    if (currentStep === 4) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Final Validations
    if (!formData.name || !formData.mobile || !formData.email || !formData.purpose || 
        !formData.personToMeet || !formData.department || !formData.idProofType || !formData.idNumber) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    // Trigger receptionist confirmation modal
    setShowReceptionistModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!receptionistNameInput.trim()) {
      alert('Receptionist Name is required to save visitor.');
      return;
    }

    setShowReceptionistModal(false);
    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        visitDate: formData.visitDate || null,
        createdBy: receptionistNameInput.trim(),
      };
      const savedVisitor = await VisitorService.registerVisitor(dataToSend);
      setSuccess(`Visitor registered successfully with ID Code: ${savedVisitor.visitorCode}`);
      // Clear form
      setFormData(initialFormState);
      setPhotoPreview('');
      setCurrentStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving visitor details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Register Visitor</h2>
          <p>Register a new visitor entry details in the system</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}



      {/* Steps Progress Tracker */}
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
              
              {/* Connector lines */}
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

      <form onSubmit={handleSubmit} noValidate className="visitor-register-form content-card">
        {/* Step 1: Visitor Photo (Webcam Capture First) */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <div className="form-section-title">Visitor Photo Capture</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
            
            {/* Camera Viewport Container */}
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '440px', 
              aspectRatio: '4/3', 
              borderRadius: 'var(--radius-lg)', 
              overflow: 'hidden', 
              background: '#090D16', 
              border: '2px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)'
            }}>
              {isCameraActive && !isCaptured && (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                />
              )}
              {isCaptured && photoPreview && (
                <img 
                  src={photoPreview} 
                  alt="Captured visitor snapshot" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              )}
              {!isCameraActive && !isCaptured && (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px' }}>
                  <Camera size={48} style={{ color: 'var(--text-light)', marginBottom: '12px', opacity: 0.6 }} />
                  <p style={{ fontSize: '13.5px', margin: 0 }}>Camera is currently inactive</p>
                  <button 
                    type="button" 
                    onClick={startCamera} 
                    className="btn btn-outline" 
                    style={{ marginTop: '16px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    Activate Webcam
                  </button>
                </div>
              )}
            </div>

            {/* Camera Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {isCameraActive && !isCaptured && (
                <button 
                  type="button" 
                  onClick={capturePhoto} 
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '13.5px' }}
                >
                  <Camera size={16} />
                  Capture Photo
                </button>
              )}
              {isCaptured && (
                <button 
                  type="button" 
                  onClick={retakePhoto} 
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '13.5px' }}
                >
                  <RotateCcw size={16} />
                  Retake Photo
                </button>
              )}
              {isCameraActive && (
                <button 
                  type="button" 
                  onClick={stopCamera} 
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '13.5px' }}
                >
                  Turn Off Camera
                </button>
              )}
            </div>


          </div>
        </div>

        {/* Step 2: Personal Details */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <div className="form-section-title">Personal Details</div>
          <div className="form-grid-3">
            <div className="form-group">
              <label htmlFor="visitorCode">Visitor Code</label>
              <input
                type="text"
                id="visitorCode"
                value="Auto-Generated by System"
                disabled
                className="disabled-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Visitor Name <span className="required-star">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name of visitor"
                required={currentStep === 2}
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
                placeholder="10-digit mobile number"
                required={currentStep === 2}
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
                placeholder="visitor@company.com"
                required={currentStep === 2}
              />
            </div>
          </div>
        </div>

        {/* Step 3: Company & Identity Details */}
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <div className="form-section-title">Company & Identity Verification</div>
          <div className="form-grid-3">
            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Visitor's company name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="idProofType">ID Proof Type <span className="required-star">*</span></label>
              <select
                id="idProofType"
                name="idProofType"
                value={formData.idProofType}
                onChange={handleChange}
                required={currentStep === 3}
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
                placeholder="Enter ID card number"
                required={currentStep === 3}
              />
            </div>
          </div>
        </div>

        {/* Step 4: Visit Details */}
        <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
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
                placeholder="Host/Employee name"
                required={currentStep === 4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department <span className="required-star">*</span></label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required={currentStep === 4}
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
                placeholder="E.g., Business Meeting, Job Interview, Delivery, Maintenance"
                required={currentStep === 4}
              />
            </div>
          </div>
        </div>

        {/* Step 5: Review & Submit */}
        <div style={{ display: currentStep === 5 ? 'block' : 'none' }}>
          <div className="form-section-title">Review & Save Visitor Record</div>
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

        {/* Form Wizard Actions */}
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
              <>
                <button type="button" onClick={handleReset} className="btn btn-secondary">
                  <RotateCcw size={16} />
                  Reset Form
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving Visitor...' : 'Save Visitor'}
                </button>
              </>
            )}
          </div>
        </div>
      </form>

      {/* Receptionist Name Confirmation Modal */}
      <AnimatePresence>
        {showReceptionistModal && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <motion.div 
              className="visitor-pass-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ width: '400px', padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card-solid)' }}
            >
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white', padding: '16px 20px' }}>
                <h3 style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '15px' }}>RECEPTIONIST CONFIRMATION</h3>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Please confirm your name below to register the visitor entry.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="receptionistNameInput" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>RECEPTIONIST NAME *</label>
                  <input
                    type="text"
                    id="receptionistNameInput"
                    value={receptionistNameInput}
                    onChange={(e) => setReceptionistNameInput(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)', color: 'var(--text-dark)' }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', padding: '16px 20px', gap: '12px', borderTop: '1px solid var(--border-soft)', background: 'rgba(0,0,0,0.01)' }}>
                <button 
                  type="button"
                  onClick={() => setShowReceptionistModal(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmRegistration} 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '10px', background: 'var(--primary)' }}
                >
                  Confirm & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterVisitor;
