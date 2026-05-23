import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search } from 'lucide-react';
import './CitizenComplaint.css';
import { toast } from 'sonner'; 

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
];

export default function CitizenComplaint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef(null);

  // --- NEW STATE: Mode Selection ---
  const [locationMode, setLocationMode] = useState('auto'); // 'auto' or 'manual'

  const [form, setForm] = useState({
    citizenName: user?.name || '',
    email: user?.email || '',
    phone: '',
    otp: '',
    description: '',
    location: '',
    ward: '',
    language: 'en',
  });

  const [coords, setCoords] = useState({ latitude: 19.2184, longitude: 73.0867 });
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(!!user);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [mapSearch, setMapSearch] = useState('');

  // --- LOCATION LOGIC ---
  const handleLocationDiscovery = async (lat, lon) => {
    setCoords({ latitude: lat, longitude: lon });
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      if (res.data && res.data.address) {
        const addr = res.data.address;
        const street = addr.road || addr.suburb || addr.neighbourhood || "Point on Map";
        const ward = addr.city_district || addr.suburb || "Dombivli East";
        setForm(prev => ({ ...prev, location: street, ward: ward }));
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
  };

  const requestAutoLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationDiscovery(position.coords.latitude, position.coords.longitude);
          setShowModal(false);
        },
        () => setShowModal(true),
        { enableHighAccuracy: true }
      );
    }
  };

  // landmark search
  const handleLandmarkSearch = async () => {
    if (!mapSearch) return;
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}`
      );
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);

        // Update coordinates and the form data
        setCoords({ latitude: newLat, longitude: newLon });
        updateLocationData(newLat, newLon);
        toast.success("Area found. Please drop the exact pin.");
      } else {
        toast.error("Landmark not recognized. Try a different name.");
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  // Leaflet Component to handle Map Clicks
  function MapPicker() {
    useMapEvents({
      click(e) {
        if (locationMode === 'manual') {
          handleLocationDiscovery(e.latlng.lat, e.latlng.lng);
        }
      },
    });
    return coords.latitude ? <Marker position={[coords.latitude, coords.longitude]} /> : null;
  }



  function MapRecenter({ center }) {
    const map = useMap();
    useEffect(() => {
      if (center && center[0] && center[1]) {
        map.setView(center, 15); // Zooms into the new area
      }
    }, [center, map]);
    return null;
  }

  useEffect(() => {
    if (locationMode === 'auto') requestAutoLocation();
  }, [locationMode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Auto-suggest manual mode if user is uploading from files (likely reporting later)
      if (locationMode === 'auto') setLocationMode('manual');
    }
  };

  const handleSendOTP = async () => {
    if (!form.email || !form.citizenName) {
      alert("Please enter your name and email first.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/send-otp`, {
        email: form.email,
        name: form.citizenName,
        role: "citizen",
        is_signup: true
      });
      setOtpSent(true);
      alert("OTP sent to your email!");
    } catch (err) {
      alert("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setVerifyingOtp(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/verify-otp`, {
        email: form.email,
        code: form.otp
      });
      if (res.data.status === "success") {
        setOtpVerified(true);
        alert("Email verified successfully!");
      }
    } catch (err) {
      alert("Invalid OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  };




  const validate = () => {
    const newErrors = {};
    if (!form.citizenName.trim()) newErrors.citizenName = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) newErrors.phone = 'Valid phone required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    if (!imageFile) newErrors.image = 'Photo evidence is required';
    if (!otpVerified) newErrors.otp = "Verification required";
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    // 🚩 ADD THIS LOG TO SEE WHAT IS WRONG
    console.log("Validation Errors:", validationErrors);
    console.log("Current Form State:", form);
    console.log("OTP Verified Status:", otpVerified);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Form Validation Failed", {
      description: "Please ensure all fields are filled correctly.",
    });
      return;
    }

    setLoading(true);
    setPipelineStep(1);

    const formData = new FormData();
    // PRESERVING YOUR EXACT BACKEND KEYS
    formData.append("full_name", form.citizenName);
    formData.append("phone", form.phone);
    formData.append("email", form.email);
    formData.append("language", form.language);
    formData.append("description", form.description);
    formData.append("location", form.location);
    formData.append("ward_zone", form.ward);
    formData.append("file", imageFile);
    formData.append("latitude", coords.latitude);
    formData.append("longitude", coords.longitude);

    try {
      setTimeout(() => setPipelineStep(2), 1500);
      setTimeout(() => setPipelineStep(3), 3000);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/citizen/submit-complaint`, formData);
      if (res.data.status === "success") {
        setPipelineStep(4);
        setTimeout(() => setSubmitted(true), 1000);
      }
    } catch (err) {
      setPipelineStep(0);
      // 🚩 Capture the specific AI rejection message from your backend
    const errorMessage = err.response?.data?.detail || "Submission Failed";
    
    toast.error("AI Verification Rejected", {
      description: errorMessage,
      duration: 5000, // Show longer so user can read the reason
    });
    } finally {
      setLoading(false);
    }
  };

   const handleResetForNewReport = () => {
    // 1. Clear grievance-specific data
    setForm(prev => ({
      ...prev,
      description: '',
      location: '',
      ward: '',
      otp: '' // Clear the OTP input but keep verified state
    }));

    // 2. Clear Visuals
    setImageFile(null);
    setImagePreview(null);
    setPipelineStep(0);

    // 3. Reset the submission state to show the form again
    setSubmitted(false);
    setLoading(false);

    // 4. Note: otpVerified remains TRUE and user object remains in AuthContext
    // If user was in 'auto' location mode, trigger a re-discovery
    if (locationMode === 'auto') requestAutoLocation();
  };
  
  if (submitted) {
    return (
      <div className="citizen-page flex items-center justify-center">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>Submission Successful!</h2>
          <p>We is now analyzing the grievance.</p>
          <button className="btn-primary" onClick={handleResetForNewReport}>New Report</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="citizen-page">
      <header className="citizen-header">
        <div className="header-emblem">🏛️</div>
        <h1>NIVARAN CITIZEN PORTAL</h1>
        <p>Verified Identity • Geospatial Ground-Truth</p>
      </header>

      <form className="complaint-form" onSubmit={handleSubmit}>
        {/* SECTION 1: IDENTITY */}
        <div className="form-section">
          <h3>1. Identity Verification</h3>
          <div className="form-group">
            <label>Full Name</label>
            <input name="citizenName" value={form.citizenName} onChange={handleChange} placeholder="Full Name" readOnly={otpVerified || !!user} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mobile Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="9821XXXXXX" />
            </div>
            <div className="form-group">
              <label>Official Email</label>
              <div className="flex gap-2">
                <input name="email" value={form.email} onChange={handleChange} placeholder="Email" disabled={otpVerified || !!user} />
                {!otpVerified && !user && <button type="button" onClick={handleSendOTP} className="btn-action">OTP</button>}
              </div>
            </div>
          </div>
          {/* Only show OTP button if NOT verified */}
          {!otpVerified && !user && (
            <button type="button" onClick={handleSendOTP} className="btn-action">OTP</button>
          )}
          {otpVerified && <span className="text-emerald-500 font-bold self-center">✓ Verified</span>}
        </div>

        {/* SECTION 2: LOCATION (THE DUAL MODE) */}
        <div className="form-section">
          <h3>2. Geospatial Context</h3>

          <div className="location-mode-toggle">
            <button
              type="button"
              onClick={() => setLocationMode('auto')}
              className={locationMode === 'auto' ? 'active' : ''}
            >
              <Navigation size={14} /> At Spot
            </button>
            <button
              type="button"
              onClick={() => setLocationMode('manual')}
              className={locationMode === 'manual' ? 'active' : ''}
            >
              <MapPin size={14} /> Report Later
            </button>
          </div>

          {locationMode === 'manual' && (
            <div className="map-search-wrapper animate-pop">
              <div className="map-search-input-group">
                <input
                  type="text"
                  placeholder="Search landmark, street, or area..."
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLandmarkSearch()} // Trigger on Enter key
                />
                <button type="button" onClick={handleLandmarkSearch} className="btn-map-search">
                  <Search size={18} />
                </button>
              </div>

              <div className="map-picker-container">
                <MapContainer
                  center={[coords.latitude, coords.longitude]}
                  zoom={15}
                  style={{ height: '220px' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  {/* 🚩 THE FIX: This component will listen for changes and move the map */}
                  <MapRecenter center={[coords.latitude, coords.longitude]} />

                  <MapPicker />
                  <Marker position={[coords.latitude, coords.longitude]} />
                </MapContainer>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase italic text-center">
                Click the map to set the exact incident coordinate
              </p>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Resolved Address</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Address" readOnly={locationMode === 'auto'} />
            </div>
            <div className="form-group">
              <label>Ward / Admin Zone</label>
              <input name="ward" value={form.ward} onChange={handleChange} placeholder="Ward" readOnly={locationMode === 'auto'} />
            </div>
          </div>
        </div>

        {/* SECTION 3: EVIDENCE */}
        <div className="form-section">
          <h3>3. Visual Evidence</h3>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the issue..." rows={3} />
          <div className="upload-area mt-4" onClick={() => fileRef.current.click()}>
            {imagePreview ? (
              <img src={imagePreview} className="image-preview" alt="Preview" />
            ) : (
              <div className="p-4 flex flex-col items-center gap-2">
                <div className="text-2xl">📸</div>
                <div className="text-sm font-bold text-slate-600">
                  Tap to Take Photo or Upload Evidence
                </div>
                <div className="text-[10px] text-slate-400 uppercase">
                  Camera Access Enabled
                </div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleImage}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary btn-submit" disabled={loading}>
          {loading ? "Initializing..." : "Submit Grievance"}
        </button>
      </form>
    </div>
  );
}