import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import VisitorService from '../services/visitor.service';
import * as faceapi from '@vladmandic/face-api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  Users, 
  AlertTriangle, 
  UserCheck, 
  UserMinus, 
  UserX,
  Building,
  Camera
} from 'lucide-react';

const parseCheckinTime = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+(am|pm)$/i);
  if (!parts) return new Date(timeStr);
  let [, year, month, day, hours, minutes, seconds, ampm] = parts;
  let hrs = parseInt(hours, 10);
  if (ampm.toLowerCase() === 'pm' && hrs < 12) hrs += 12;
  if (ampm.toLowerCase() === 'am' && hrs === 12) hrs = 0;
  return new Date(year, month - 1, day, hrs, minutes, seconds);
};

const SecurityDesk = () => {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  
  const [checkinRemarks, setCheckinRemarks] = useState('');
  const [checkinSecurityName, setCheckinSecurityName] = useState(user?.fullName || '');
  const [checkinLoading, setCheckinLoading] = useState(false);
  
  const [exitRemarks, setExitRemarks] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  const [insideVisitors, setInsideVisitors] = useState([]);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // AI Face Scanner states & references
  const videoRef = React.useRef(null);
  const scanIntervalRef = React.useRef(null);
  const streamRef = React.useRef(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [autoScanMode, setAutoScanMode] = useState(false);
  const [cooldowns, setCooldowns] = useState({});
  const [capturedImage, setCapturedImage] = useState(null);
  const [matchedVisitor, setMatchedVisitor] = useState(null);
  const [matchConfidence, setMatchConfidence] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [aiAlert, setAiAlert] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetectionStatus, setFaceDetectionStatus] = useState('');

  // Refs to prevent stale closure in setInterval
  const autoScanModeRef = React.useRef(autoScanMode);
  const cooldownsRef = React.useRef(cooldowns);
  const cameraActiveRef = React.useRef(cameraActive);
  const userRef = React.useRef(user);
  const selectedVisitorRef = React.useRef(selectedVisitor);

  useEffect(() => { autoScanModeRef.current = autoScanMode; }, [autoScanMode]);
  useEffect(() => { cooldownsRef.current = cooldowns; }, [cooldowns]);
  useEffect(() => { cameraActiveRef.current = cameraActive; }, [cameraActive]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { selectedVisitorRef.current = selectedVisitor; }, [selectedVisitor]);

  // Load Face-API models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('[AI FACE SENTINEL] Loading Face Detection models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setModelsLoaded(true);
        console.log('[AI FACE SENTINEL] Face Detection models loaded successfully.');
      } catch (err) {
        console.error('[AI FACE SENTINEL] Error loading face detection models:', err);
        setError('Error loading local Face Sentinel AI models.');
      }
    };
    loadModels();
  }, []);

  const speakText = (text) => {
    // Text-to-speech voice feedback disabled
  };

  const startCamera = async () => {
    setError('');
    setSuccess('');
    setMatchedVisitor(null);
    setCapturedImage(null);
    setMatchConfidence(0);
    setSelectedVisitor(null);
    setSearchQuery('');
    
    if (!modelsLoaded) {
      setError('AI Face Sentinel is still loading face detection models. Please wait a moment and try again.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = stream;
      setCameraActive(true);
      
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
      console.error('Error starting camera:', err);
      setError('Could not access the webcam. Please ensure camera permissions are granted.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    cameraActiveRef.current = false; // Synchronously disable camera ref to block subsequent scan intervals
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setMatchedVisitor(null);
    setCapturedImage(null);
    setMatchConfidence(0);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const handleScanFrame = async () => {
    if (!videoRef.current || !cameraActiveRef.current || scanning || !modelsLoaded) return;
    
    try {
      const video = videoRef.current;
      setScanning(true);
      setFaceDetectionStatus('Scanning for face...');

      // Detect face using pre-trained Tiny Face Detector
      const detection = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
      );

      if (!detection) {
        setScanning(false);
        setFaceDetectionStatus('No face detected. Please align your face inside the camera frame.');
        // Clear notice after 2.5 seconds
        setTimeout(() => {
          setFaceDetectionStatus(prev => prev.startsWith('No face') ? '' : prev);
        }, 2500);
        return;
      }

      setFaceDetectionStatus('Face detected! Identifying visitor...');

      const { x, y, width, height } = detection.box;
      
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const size = Math.min(videoWidth, videoHeight);
      const sourceX = (videoWidth - size) / 2;
      const sourceY = (videoHeight - size) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setScanning(false);
        setFaceDetectionStatus('');
        return;
      }
      
      // Mirror the context so captured image matches mirrored preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      // Draw the full centered square of the video frame (unzoomed/uncropped)
      ctx.drawImage(video, sourceX, sourceY, size, size, 0, 0, 150, 150);
      
      const base64Photo = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(base64Photo);
      
      const response = await VisitorService.identifyFace(base64Photo);
      setScanning(false);
      setFaceDetectionStatus('');
      
      if (response && response.matched) {
        const vId = response.visitorId;
        
        setMatchedVisitor(response);
        setMatchConfidence(response.similarity || 85.0);
        
        // Immediately stop the camera and load visitor details
        stopCamera();
        loadVisitorDetails(vId);
      } else {
        setMatchedVisitor(null);
        setMatchConfidence(0);
        setFaceDetectionStatus('Unknown face. No matching visitor profile found.');
        setTimeout(() => {
          setFaceDetectionStatus(prev => prev.startsWith('Unknown') ? '' : prev);
        }, 3000);
      }
    } catch (err) {
      console.error('Frame scan error:', err);
      setScanning(false);
      setFaceDetectionStatus('Scan error. Try again.');
    }
  };

  useEffect(() => {
    if (cameraActive) {
      scanIntervalRef.current = setInterval(() => {
        if (autoScanModeRef.current) {
          handleScanFrame();
        }
      }, 3000);
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function fetchInsideVisitors() {
    setMonitoringLoading(true);
    try {
      const data = await VisitorService.getVisitorsByStatus('CHECKED_IN');
      setInsideVisitors(data);
    } catch (err) {
      console.error('Error fetching checked-in visitors:', err);
      setError('Failed to fetch the list of visitors inside the building.');
    } finally {
      setMonitoringLoading(false);
    }
  }

  useEffect(() => {
    fetchInsideVisitors();
  }, []);

  const overstayingVisitors = insideVisitors.filter((v) => {
    if (!v.checkinTime) return false;
    const checkinDate = parseCheckinTime(v.checkinTime);
    return checkinDate ? ((new Date() - checkinDate) / 3600000) >= 8.0 : false;
  });

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setError(''); setSuccess(''); setSelectedVisitor(null); setSearchResults([]);
    try {
      const data = await VisitorService.searchVisitors(searchQuery);
      if (data.length === 0) {
        setError(`No visitor found matching code/name "${searchQuery}"`);
      } else {
        const cleanQuery = searchQuery.trim().toLowerCase();
        const exactMatch = data.find(v => 
          v.visitorCode.toLowerCase() === cleanQuery || 
          v.visitorCode.toLowerCase() === `vis-${cleanQuery}`
        );
        
        if (exactMatch) {
          loadVisitorDetails(exactMatch.visitorId);
        } else if (data.length === 1) {
          loadVisitorDetails(data[0].visitorId);
        } else {
          setSearchResults(data);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error occurred while searching visitor records.');
    }
  };

  async function loadVisitorDetails(id) {
    setError(''); setSuccess('');
    try {
      const visitor = await VisitorService.getVisitorById(id);
      setSelectedVisitor(visitor);
      setExitRemarks(''); setCheckinRemarks(''); setSearchResults([]);
      setSearchQuery(visitor.visitorCode);
      
      // Auto open confirmation modal based on status for smooth security flow
      if (visitor.status === 'APPROVED' || visitor.status === 'PENDING') {
        setCheckinSecurityName(user?.fullName || user?.username || '');
        setCheckinRemarks('');
        setShowSecurityModal(true);
      } else if (visitor.status === 'CHECKED_IN') {
        setCheckinSecurityName(user?.fullName || user?.username || '');
        setExitRemarks('Exit verified at Security Desk');
        setShowCheckoutModal(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load visitor details.');
    }
  }

  const handleCheckInSubmitDirectly = async () => {
    if (!selectedVisitor) return;
    setError(''); setSuccess(''); setCheckinLoading(true);
    try {
      const response = await VisitorService.checkInVisitor(selectedVisitor.visitorId, checkinSecurityName, checkinRemarks || 'Checked in at Security Desk');
      setSuccess(`Visitor ${selectedVisitor.name} (${selectedVisitor.visitorCode}) checked in successfully!`);
      setSelectedVisitor(response);
      setCheckinRemarks('');
      fetchInsideVisitors();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Check-in failed. Please try again.');
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleExitCheckOutDirectly = async () => {
    if (!selectedVisitor) return;
    setError(''); setSuccess(''); setCheckoutLoading(true);
    try {
      await VisitorService.checkOutVisitor(selectedVisitor.visitorId, checkinSecurityName || user?.fullName || user?.username || 'Security', exitRemarks || 'Exit verified at Security Desk');
      setSuccess(`Visitor ${selectedVisitor.name} (${selectedVisitor.visitorCode}) checked out successfully!`);
      setSelectedVisitor(null); setSearchQuery(''); setExitRemarks('');
      fetchInsideVisitors();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Check-out failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleQuickCheckOut = (visitor) => {
    setError('');
    setSuccess('');
    setSelectedVisitor(visitor);
    setExitRemarks('Exit verified at Security Desk');
    setCheckinSecurityName(user?.fullName || user?.username || '');
    setShowCheckoutModal(true);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Security Desk Workspace</h2>
          <p>Verify gate passes, manage identity checks, and monitor building occupancies</p>
        </div>
      </div>

      {/* Overstay Warning Notification banner */}
      <AnimatePresence>
        {overstayingVisitors.length > 0 && (
          <motion.div 
            className="overstay-alert-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ marginBottom: '24px' }}
          >
            <div className="overstay-header">
              <AlertTriangle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, color: 'var(--danger)', fontWeight: 'bold' }}>Visitor Overstay Alert Triggered</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  The following visitor(s) have been checked in for more than 8 hours. Access checkout immediately:
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {overstayingVisitors.map((v) => {
                const checkinDate = parseCheckinTime(v.checkinTime);
                const durationHrs = checkinDate ? ((new Date() - checkinDate) / 3600000).toFixed(1) : '8+';
                return (
                  <div key={v.visitorId} className="justify-between" style={{ background: 'var(--bg-card-solid)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '13px' }}>
                      <strong style={{ color: 'var(--primary)' }}>{v.visitorCode}</strong> — <strong>{v.name}</strong> (Host: {v.personToMeet} in {v.department})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 'bold', background: 'var(--danger-bg)', padding: '4px 8px', borderRadius: '4px' }}>
                        Inside: {durationHrs} hrs
                      </span>
                      <button onClick={() => handleQuickCheckOut(v)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11.5px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        Checkout
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Floating AI Match Notification */}
      <AnimatePresence>
        {aiAlert && (
          <motion.div 
            className="ai-notification-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="ai-notification-content">
              <div className={`ai-notification-icon ${aiAlert.status === 'CHECKED_OUT' ? 'checkout' : ''}`}>
                {aiAlert.status === 'CHECKED_OUT' ? <UserMinus size={22} /> : <UserCheck size={22} />}
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#fff', fontWeight: 'bold' }}>
                  AI Automatic {aiAlert.status === 'CHECKED_OUT' ? 'Check-Out' : 'Check-In'} Success
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94A3B8' }}>
                  Visitor <strong>{aiAlert.name}</strong> ({aiAlert.code}) has been automatically logged at the gate.
                </p>
              </div>
            </div>
            <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>
              AUTO GATE
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Face Scanning Panel */}
      <div className="security-scanner-panel">
        <div className="webcam-card">
          <div className="webcam-card-header">
            <div className="webcam-header-title" style={{ color: 'var(--primary)' }}>
              <Shield size={18} />
              <span>AI Face Sentinel™ Scanning Gate</span>
            </div>
            <div className="webcam-header-actions">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={autoScanMode} 
                  onChange={(e) => setAutoScanMode(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                />
                Auto Check-In / Check-Out Mode
              </label>
              <button 
                onClick={cameraActive ? stopCamera : startCamera} 
                className={`webcam-toggle-btn ${cameraActive ? 'btn-active' : 'btn-inactive'}`}
              >
                {cameraActive ? 'Stop Scanner Camera' : 'Start Scanner Camera'}
              </button>
            </div>
          </div>

          {cameraActive ? (
            <div className="scanner-flex-layout" style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Webcam Viewport */}
              <div className={`webcam-viewport-wrapper ${scanning ? 'scanning' : ''}`}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="webcam-video-feed" 
                />
                {/* Laser scan line overlay */}
                <div className="scanner-laser-line" />
                {/* Reticle */}
                <div className={`scanner-target-reticle ${matchedVisitor ? 'active' : ''}`} />
                <div 
                  className="scanner-hud-text"
                  style={{
                    color: faceDetectionStatus.includes('No face') || faceDetectionStatus.includes('Unknown') ? '#f87171' : 
                           faceDetectionStatus.includes('Face detected') ? '#34d399' : '#94a3b8',
                    borderTopColor: faceDetectionStatus.includes('No face') || faceDetectionStatus.includes('Unknown') ? '#ef4444' : 
                                    faceDetectionStatus.includes('Face detected') ? '#10b981' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  {faceDetectionStatus || (!modelsLoaded ? 'INITIALIZING AI FACE SENTINEL...' : scanning ? 'ANALYZING BIOMETRICS...' : autoScanMode ? 'AUTO-GATE MONITORING ACTIVE' : 'ALIGN FACE AND CLICK SNAPSHOT')}
                </div>
              </div>

              {/* Match / Comparison results */}
              <div className="match-comparison-card">
                {matchedVisitor ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <div className="comparison-box" style={{ width: '140px', textAlign: 'center' }}>
                        <span className="comparison-box-title">Registered Photo</span>
                        <div className="comparison-photo-frame match-success" style={{ margin: '8px auto 0' }}>
                          {matchedVisitor.photo ? (
                            <img src={matchedVisitor.photo} alt="Pre-registered" />
                          ) : (
                            <div className="comparison-photo-placeholder"><UserX size={24} /></div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="similarity-meter-container">
                      <div className="similarity-meter-header">
                        <span>Biometric Similarity Match</span>
                        <span style={{ color: 'var(--success)' }}>{matchConfidence}%</span>
                      </div>
                      <div className="similarity-meter-track">
                        <div 
                          className="similarity-meter-fill match-high" 
                          style={{ width: `${matchConfidence}%` }} 
                        />
                      </div>
                    </div>

                    <div className={`similarity-status-badge match-success`}>
                      MATCH CONFIRMED: {matchedVisitor.name}
                    </div>

                    {/* Additional Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', background: 'var(--bg-card-solid)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div><strong>Visitor ID:</strong> {matchedVisitor.visitorCode}</div>
                      <div><strong>Company:</strong> {matchedVisitor.companyName || 'No Company'}</div>
                      <div><strong>Pass Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{matchedVisitor.status.replace('_', ' ')}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4" style={{ color: 'var(--text-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Shield size={36} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: '13px' }}>Scanning for faces... Align face inside circle.</span>
                    {!autoScanMode && (
                      <button onClick={handleScanFrame} disabled={scanning} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                        Snap & Identify Visitor
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : selectedVisitor ? (
            <div className="scanner-flex-layout" style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Show camera offline / inactive screen in viewport instead of photo */}
              <div className="webcam-viewport-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card-solid)' }}>
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
              </div>
              
              {/* Show the static match comparison card on the right */}
              <div className="match-comparison-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div className="comparison-box" style={{ width: '140px', textAlign: 'center' }}>
                      <span className="comparison-box-title">Registered Photo</span>
                      <div className="comparison-photo-frame match-success" style={{ margin: '8px auto 0' }}>
                        {selectedVisitor.photo ? (
                          <img src={selectedVisitor.photo} alt="Pre-registered" />
                        ) : (
                          <div className="comparison-photo-placeholder"><UserX size={24} /></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="similarity-meter-container">
                    <div className="similarity-meter-header">
                      <span>Biometric Similarity Match</span>
                      <span style={{ color: 'var(--success)' }}>{matchConfidence}%</span>
                    </div>
                    <div className="similarity-meter-track">
                      <div 
                        className="similarity-meter-fill match-high" 
                        style={{ width: `${matchConfidence}%` }} 
                      />
                    </div>
                  </div>

                  <div className={`similarity-status-badge match-success`}>
                    MATCH CONFIRMED: {selectedVisitor.name}
                  </div>
                  
                  {/* Additional Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', background: 'var(--bg-card-solid)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div><strong>Visitor ID:</strong> {selectedVisitor.visitorCode}</div>
                    <div><strong>Company:</strong> {selectedVisitor.companyName || 'No Company'}</div>
                    <div><strong>Pass Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{selectedVisitor.status.replace('_', ' ')}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="scanner-offline-screen" style={{ padding: '40px 0' }}>
              <Shield size={48} style={{ opacity: 0.2 }} />
              <p style={{ fontSize: '13.5px' }}>Webcam scanning is currently offline. Start the camera to activate AI Gate Sentinel.</p>
              <button onClick={startCamera} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                Activate AI Scanner
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="security-desk-grid">
        {/* Left Side: Gate pass check panel */}
        <div className="security-verification-panel">
          <div className="panel-card">
            <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} /> 1. Gate Pass Verification
            </h3>
            
            <form onSubmit={handleSearchSubmit} className="search-form-row">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter Pass Code (e.g. VIS-1) or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => { setSearchQuery(''); setSelectedVisitor(null); setSearchResults([]); }}>×</button>
                )}
              </div>
              <button type="submit" className="btn btn-primary">Verify Pass</button>
            </form>

            {searchResults.length > 0 && (
              <div className="search-results-box">
                <p className="search-results-title">Select matching visitor record:</p>
                <div>
                  {searchResults.map((v) => (
                    <div key={v.visitorId} className="search-result-item" onClick={() => loadVisitorDetails(v.visitorId)}>
                      <strong>{v.visitorCode}</strong> — {v.name} ({v.companyName || 'No Company'}) — Status: <strong>{v.status}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVisitor && (
              <div className="verification-details-container" style={{ animation: 'fadeIn 0.4s ease' }}>
                <div className={`status-banner status-${selectedVisitor.status.toLowerCase()}`}>
                  Pass Verification: <strong>{selectedVisitor.status.replace('_', ' ')}</strong>
                </div>

                <div className="verification-cards-row">
                  {/* Photo details */}
                  <div className="verification-sub-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <h4 className="card-subtitle">Photo Check</h4>
                    <div className="photo-verification-preview">
                      {selectedVisitor.photo ? (
                        <img src={selectedVisitor.photo} alt="Visitor Photo" className="visitor-photo-large" />
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <UserX size={36} />
                          No Photo
                        </div>
                      )}
                    </div>
                    {selectedVisitor.photo && (
                      <div className="verification-status-checkmark">
                        <CheckCircle size={14} /> ID Match Ready
                      </div>
                    )}
                  </div>

                  {/* ID & Details check */}
                  <div className="verification-sub-card">
                    <h4 className="card-subtitle">Identity Credentials</h4>
                    <div className="identity-details-list">
                      <div className="identity-row">
                        <span className="id-lbl">ID Type:</span>
                        <span className="id-val font-bold">{selectedVisitor.idProofType}</span>
                      </div>
                      <div className="identity-row">
                        <span className="id-lbl">ID Number:</span>
                        <span className="id-val font-bold">{selectedVisitor.idNumber}</span>
                      </div>
                      <div className="identity-row">
                        <span className="id-lbl">Host / Office:</span>
                        <span className="id-val">{selectedVisitor.personToMeet} ({selectedVisitor.department})</span>
                      </div>
                      <div className="identity-row">
                        <span className="id-lbl">Visit Purpose:</span>
                        <span className="id-val">{selectedVisitor.purpose}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gate Entry Action Buttons */}
                {(selectedVisitor.status === 'APPROVED' || selectedVisitor.status === 'PENDING') && (
                  <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowSecurityModal(true)} 
                      className="btn btn-primary" 
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <UserCheck size={16} /> Process Gate Check-In
                    </button>
                  </div>
                )}

                {selectedVisitor.status === 'CHECKED_IN' && (
                  <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowCheckoutModal(true)} 
                      className="btn btn-primary" 
                      style={{ background: 'linear-gradient(135deg, var(--warning) 0%, #EA580C 100%)', boxShadow: 'none', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <UserMinus size={16} /> Process Gate Exit Check-Out
                    </button>
                  </div>
                )}

                {selectedVisitor.status === 'PENDING' && (
                  <div style={{ marginTop: '16px', background: 'var(--warning-bg)', border: '1px dashed var(--warning)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '13.5px' }}>
                    <strong>Access Flagged:</strong> Visitor pass is pending approval. You can verify and check them in directly via security check-in confirmation modal.
                  </div>
                )}

                {selectedVisitor.status === 'REJECTED' && (
                  <div style={{ marginTop: '16px', background: 'var(--danger-bg)', border: '1px dashed var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '13.5px', color: 'var(--danger)' }}>
                    <strong>Access Rejected:</strong> Gate check-in blocked. This visitor registration pass has been rejected by administration.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Building monitor panel */}
        <div className="security-monitoring-panel">
          <div className="panel-card">
            <h3 className="section-title-alt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> Active Building Occupancy ({insideVisitors.length})
            </h3>

            {monitoringLoading ? (
              <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Checking occupants logs...</div>
            ) : insideVisitors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Building size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <span>No visitors currently inside the building.</span>
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '460px', overflowY: 'auto', border: 'none' }}>
                <table className="table" style={{ fontSize: '13.5px' }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Visitor</th>
                      <th>Host / Dept</th>
                      <th>Checked In</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insideVisitors.map((v) => (
                      <tr key={v.visitorId}>
                        <td className="font-bold">{v.visitorCode}</td>
                        <td>
                          <strong>{v.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.companyName || 'No Company'}</div>
                        </td>
                        <td>
                          {v.personToMeet}
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.department}</div>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {v.checkinTime?.split(' ')[1] || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <button onClick={() => handleQuickCheckOut(v)} className="btn-action btn-action-checkout">
                            Exit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Check-in Name Confirmation Modal */}
      <AnimatePresence>
        {showSecurityModal && (
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
                <h3 style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '15px' }}>SECURITY DESK CONFIRMATION</h3>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedVisitor && (
                  <div style={{ padding: '14px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                      {selectedVisitor.photo ? (
                        <img src={selectedVisitor.photo} alt="Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UserX size={20} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div><strong>Visitor:</strong> {selectedVisitor.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedVisitor.visitorCode}</div>
                      <div><strong>Host:</strong> {selectedVisitor.personToMeet}</div>
                    </div>
                  </div>
                )}
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Please confirm your name below to register the visitor entry.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="checkinSecurityNameInput" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>SECURITY OFFICER NAME *</label>
                  <input
                    type="text"
                    id="checkinSecurityNameInput"
                    value={checkinSecurityName}
                    onChange={(e) => setCheckinSecurityName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)', color: 'var(--text-dark)' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="checkinRemarksInput" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>GATE ENTRY REMARKS</label>
                  <textarea
                    id="checkinRemarksInput"
                    value={checkinRemarks}
                    onChange={(e) => setCheckinRemarks(e.target.value)}
                    placeholder="Enter any entry notes, baggage status, etc..."
                    rows="2"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)', color: 'var(--text-dark)', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', padding: '16px 20px', gap: '12px', borderTop: '1px solid var(--border-soft)', background: 'rgba(0,0,0,0.01)' }}>
                <button 
                  type="button"
                  onClick={() => setShowSecurityModal(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    if (!checkinSecurityName.trim()) {
                      alert('Security Officer Name is required.');
                      return;
                    }
                    setShowSecurityModal(false);
                    await handleCheckInSubmitDirectly();
                  }} 
                  className="btn btn-primary" 
                  disabled={checkinLoading}
                  style={{ flex: 1, padding: '10px', background: 'var(--primary)' }}
                >
                  {checkinLoading ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security Check-out Name Confirmation Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
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
              <div style={{ background: 'linear-gradient(135deg, var(--warning) 0%, #EA580C 100%)', color: 'white', padding: '16px 20px' }}>
                <h3 style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '15px' }}>SECURITY EXIT CONFIRMATION</h3>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedVisitor && (
                  <div style={{ padding: '14px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                      {selectedVisitor.photo ? (
                        <img src={selectedVisitor.photo} alt="Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UserX size={20} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div><strong>Visitor:</strong> {selectedVisitor.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedVisitor.visitorCode}</div>
                      <div><strong>Host:</strong> {selectedVisitor.personToMeet}</div>
                    </div>
                  </div>
                )}
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Please confirm your name below to register the visitor exit.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="checkoutSecurityNameInput" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>SECURITY OFFICER NAME *</label>
                  <input
                    type="text"
                    id="checkoutSecurityNameInput"
                    value={checkinSecurityName}
                    onChange={(e) => setCheckinSecurityName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)', color: 'var(--text-dark)' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="exitRemarksInput" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>GATE EXIT REMARKS</label>
                  <textarea
                    id="exitRemarksInput"
                    value={exitRemarks}
                    onChange={(e) => setExitRemarks(e.target.value)}
                    placeholder="Baggage checked, exit credentials verified, etc..."
                    rows="2"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)', color: 'var(--text-dark)', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', padding: '16px 20px', gap: '12px', borderTop: '1px solid var(--border-soft)', background: 'rgba(0,0,0,0.01)' }}>
                <button 
                  type="button"
                  onClick={() => setShowCheckoutModal(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    if (!checkinSecurityName.trim()) {
                      alert('Security Officer Name is required.');
                      return;
                    }
                    setShowCheckoutModal(false);
                    await handleExitCheckOutDirectly();
                  }} 
                  className="btn btn-primary" 
                  disabled={checkoutLoading}
                  style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, var(--warning) 0%, #EA580C 100%)' }}
                >
                  {checkoutLoading ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecurityDesk;
