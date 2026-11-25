import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Utils } from '../utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Report() {
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);
  const [address, setAddress] = useState('');
  const [images, setImages] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const miniMapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      showToast('warning', 'Login Required', 'Please log in to report an issue');
      navigate('/login');
    }
  }, [isLoggedIn, navigate, showToast]);

  // AI Suggestion debounce
  useEffect(() => {
    if (description.length < 20) return;
    const timer = setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        const res = await API.analyzeIssue(formData);
        setAiSuggestion(res);
        if (!category && res.category) {
          setCategory(res.category);
        }
      } catch (e) {
        // ignore
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, description, category]);

  // Mini map for Step 3
  useEffect(() => {
    if (step === 3 && miniMapRef.current && !mapInstance.current) {
      const map = L.map(miniMapRef.current).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      });

      mapInstance.current = map;
      markerInstance.current = marker;
    }
  }, [step, lat, lng]);

  const handleUseLocation = async () => {
    try {
      const pos = await Utils.getCurrentPosition();
      setLat(pos.lat);
      setLng(pos.lng);
      if (mapInstance.current && markerInstance.current) {
        mapInstance.current.setView([pos.lat, pos.lng], 16);
        markerInstance.current.setLatLng([pos.lat, pos.lng]);
      }
      showToast('success', 'Location updated');
    } catch (e) {
      showToast('error', 'Location Access Denied');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      showToast('warning', 'Maximum 5 files allowed');
      return;
    }
    setImages(files);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category || aiSuggestion?.category || 'other');
      formData.append('severity', severity);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('address', address);

      if (images.length > 0) {
        formData.append('image', images[0]);
      }

      const res = await API.createIssue(formData);
      showToast('success', 'Issue Reported! +10 pts', 'Thank you for your civic contribution');
      navigate(`/issue/${res.issue.id}`);
    } catch (err) {
      showToast('error', 'Submission Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="container report-container">
        <div className="section-header text-center" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="section-title">Report an Issue</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>Help your community by reporting local problems</p>
        </div>

        {/* Steps header */}
        <div className="steps" id="report-steps">
          <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}><span className="step-number">1</span><span className="step-label">Details</span></div>
          <div className={`step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}><span className="step-number">2</span><span className="step-label">Media</span></div>
          <div className={`step ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}><span className="step-number">3</span><span className="step-label">Location</span></div>
          <div className={`step ${step === 4 ? 'active' : ''}`}><span className="step-number">4</span><span className="step-label">Review</span></div>
        </div>

        <div className="report-step-content animate-fade-in-up">
          {step === 1 && (
            <>
              <h3 className="report-step-title">Issue Details</h3>
              <div className="form-group">
                <label className="form-label">Title <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Broken streetlight on 5th Avenue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description <span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Auto-detect with AI ✨</option>
                  {Object.entries(Utils.categoryConfig).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {aiSuggestion && (
                <div className="ai-suggestion" style={{ margin: 'var(--space-3) 0' }}>
                  <div className="ai-suggestion-text">
                    🤖 <strong>AI Suggestion:</strong> {aiSuggestion.category} ({Math.round(aiSuggestion.confidence * 100)}% confidence)
                  </div>
                </div>
              )}

              <div className="report-nav" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (!title.trim() || !description.trim()) {
                      showToast('warning', 'Please provide a title and description');
                      return;
                    }
                    setStep(2);
                  }}
                >
                  Next: Add Media →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="report-step-title">Add Photos or Videos</h3>
              <div className="form-group">
                <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} />
                <p className="form-help" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Max 5 files. Supports JPG, PNG, MP4, WebM.</p>
              </div>

              <div className="report-nav" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Location →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="report-step-title">Issue Location</h3>
              <div ref={miniMapRef} style={{ width: '100%', height: '240px', borderRadius: '8px', marginBottom: 'var(--space-3)' }}></div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleUseLocation} style={{ marginBottom: 'var(--space-3)' }}>
                📍 Use My Current Location
              </button>
              <div className="form-group">
                <label className="form-label">Address / Landmark</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Near Rajiv Chowk Metro Gate 2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="report-nav" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(4)}>Next: Review →</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="report-step-title">Review & Submit</h3>
              <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <p><strong>Title:</strong> {title}</p>
                <p><strong>Category:</strong> {category || aiSuggestion?.category || 'Other'}</p>
                <p><strong>Address:</strong> {address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</p>
                <p><strong>Media:</strong> {images.length} file(s) attached</p>
              </div>

              <div className="report-nav" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-secondary" onClick={() => setStep(3)}>← Edit</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Report (+10 pts)'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
