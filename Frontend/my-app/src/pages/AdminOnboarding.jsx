import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AdminOnboarding.css';

export default function AdminOnboarding() {
  const navigate = useNavigate();
  const { user, login, error, setError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [resolvedName, setResolvedName] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [adminDetails, setAdminDetails] = useState(null); // Added for handshake feedback

  const [form, setForm] = useState({
    name: user?.name || localStorage.getItem('gov_signup_name') || '', 
    email: user?.email || localStorage.getItem('gov_signup_email') || '', 
    phone: '', uid_number: '', password: '', 
    location: '', adminBody: '', specificRole: '', workspaceCode: '',
    // name: user?.name || '',
    // email: user?.email || localStorage.getItem('gov_signup_email') || '',
    // phone: '', uid: '', password: '',
    // location: '', adminBody: '', specificRole: '', workspaceCode: '', adminDomain: ''
  });

  const BODY_DATA = {
    'Gram Panchayat': { roles: ['Sarpanch', 'Gram Sevak', 'Gram Rozgar Sahayak'], leads: ['Sarpanch'] },
    'Municipal Corporation': { roles: ['Assistant Commissioner', 'Junior Engineer', 'Zonal Agency'], leads: ['Assistant Commissioner'] },
    'Municipality': { roles: ['Chief Officer', 'Sanitary Inspector', 'Dept Contractor'], leads: ['Chief Officer'] }
  };

  // Technical comment: Determines branching logic for Lead vs Staff role
  const isLeadRole = (role) => {
    if (!form.adminBody) return false;
    return BODY_DATA[form.adminBody]?.leads.includes(role);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // --- SOVEREIGN RESUMPTION PROTOCOL ---
  useEffect(() => {
    const fetchStatus = async () => {
      const currentEmail = user?.email || localStorage.getItem('gov_signup_email');
      const storedEmailForName = user?.name || localStorage.getItem('gov_signup_email_owner');
      const backupName = (storedEmailForName === currentEmail) 
        ? localStorage.getItem('gov_signup_name') 
        : '';
      if (!currentEmail) {setStep(1); return;}
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}:8000/api/onboarding/status?email=${currentEmail}`, getAuthHeaders());
        if (res.data && res.data.step > 1) {
          setForm(prev => ({
            ...prev,
            name: res.data.name || backupName || prev.name || "",
            email: currentEmail,
            adminBody: res.data.admin_body || '',
            specificRole: res.data.specific_role || '',
            location: res.data.location || '',
            workspaceCode: res.data.workspace_code || ''
          }));
          if (res.data.location) setResolvedName(res.data.location);
          setStep(res.data.step);
          if (res.data.step > 1) {
            toast.success("Resuming your Nivaran setup from Stage " + res.data.step);
          } else {
            localStorage.removeItem('onboarding_step'); // Clear the 'Boring' cache
          }
        }
      } catch (err) {
        console.error("Administrative Sync Failed - Resetting to Stage 1", err);
        localStorage.removeItem('gov_signup_email');
        setStep(1);
      }
    };
    fetchStatus();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const syncStep = async (targetStep, field = null, value = null) => {
    if (targetStep <= step) {
      console.warn("Invalid sequence: Cannot move backwards or stay on the same step.");
      return; 
    }
    try {
      const fd = new FormData();
      fd.append('email', form.email);
      fd.append('step', targetStep);
      if (field) {
        fd.append('field', field);
        fd.append('value', value);
      }
      await axios.patch(`${import.meta.env.VITE_API_URL}:8000/api/onboarding/update-step`, fd, getAuthHeaders());
      toast.success(`Stage ${targetStep} Synchronized`, { style: { background: '#10B981', color: '#fff', border: 'none' } });
      setStep(targetStep);
    } catch (err) {
      console.error("Sync failed:", err);
      setStep(targetStep);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation Unsupported.");
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const addr = res.data.address;
          const areaName = addr.city_district || addr.suburb || addr.road || addr.village || "Sovereign Zone";
          setResolvedName(areaName);
          setForm(prev => ({ ...prev, location: areaName }));
          await syncStep(5, 'location', areaName);
        } catch (err) {
          const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setForm(prev => ({ ...prev, location: coords }));
          await syncStep(5, 'location', coords);
        } finally { setSubmitting(false); }
      },
      () => { setError("Satellite Lockdown Denied."); setSubmitting(false); }
    );
  };

  const handleVerifyWorkspace = async () => {
    // Technical comment: Lead Role bypasses validation to generate their own new key
    if (isLeadRole(form.specificRole)) {
      await syncStep(10, 'workspace_code', form.workspaceCode);
      return;
    }
    setIsValidatingCode(true);
    setAdminDetails(null);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}:8000/api/onboarding/check-code?code=${form.workspaceCode}&location=${form.location}`, getAuthHeaders());
      toast.success(res.data.message || "Workspace Validated!");
      setAdminDetails(res.data);
      // Brief pause to show the Emerald Green pulsing animation
      setTimeout(async () => {
        await syncStep(9, 'workspace_code', form.workspaceCode);
      }, 1800);
    } catch (err) {
      let msg = "Invalid Key.";
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail);
      }
      setError(msg);
    }
    finally { setIsValidatingCode(false); }
  };

  // --- UPDATED HANDLE ACTIVATE (STAGE 10) ---
  const handleActivate = async () => {
    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem('token'); // 1. Get the Key
      console.log("Current Token in Storage:", token);

  if (!token) {
    setError("No security token found. Please sign in again.");
    setSubmitting(false);
    return;
  }
      const fd = new FormData();

      // Sync these names EXACTLY with the Python Form(...) above
      fd.append('full_name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('uid_number', form.uid_number);
      fd.append('password', form.password);
      fd.append('scope', form.adminBody);
      fd.append('specific_role', form.specificRole);
      fd.append('workspace_code', form.workspaceCode);
      fd.append('admin_domain', form.adminDomain || "All");
      fd.append('sla', 24);
      fd.append('desks', 5);
      fd.append('workers', 20);

      const res = await axios.post(`${import.meta.env.VITE_API_URL}:8000/api/v1/system/configure`, fd, {
        headers: { 
          Authorization: "Bearer " + token,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        // 3. Update Auth state so the system knows you are DONE with onboarding
        login({
          ...user,
          email: form.email,
          name: form.name,
          role: 'government',             // Force lock base role
          admin_role: res.data.admin_role, // Get technical role (Admin/Contractor/etc)
          is_setup_complete: 1,
          is_onboarded: true,
          specific_role: form.specificRole,
          is_setup_complete: 1,
          is_onboarded: true,
          specific_role: form.specificRole
        }, token);

        navigate('/dashboard');
        toast.success("✅ Protocol Finalized.");
      }
    } catch (err) {
      // 4. FIX: Ensure setError only receives a string. If the error is an object, use setError(err.response.data.detail)
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object') {
        setError(JSON.stringify(detail));
      } else {
        setError(detail || "Setup Error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { n: 1, title: 'Mobile Sync' },
    { n: 2, title: 'Sovereign ID' },
    { n: 3, title: 'Digital Signature' },
    { n: 4, title: 'Satellite Lock' },
    { n: 5, title: 'Resolution' },
    { n: 6, title: 'Body Selection' },
    { n: 7, title: 'Mandate' },
    { n: 8, title: 'Workspace' },
    // Technical comment: Dynamic branching of UI text based on role
    { n: 9, title: isLeadRole(form.specificRole) ? 'Evidence' : 'Department' },
    { n: 10, title: 'Finalize' }
  ];

  const slideVar = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  console.log(form)

  return (
    <div className="auth-page digital-sunlight">
      <button className="auth-theme-toggle" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="auth-emblem">🏛️</span>
          <h1>Administrative Setup</h1>
          <div className="stepper-wrap">
            {steps.map(s => <div key={s.n} className={`step-dot ${step >= s.n ? 'active' : ''}`} />)}
          </div>
          <p className="step-label">Stage {step}: {steps[step - 1]?.title}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="stage-content" style={{ minHeight: '320px' }}>
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key={1} {...slideVar}>
                <div className="auth-field"><label>Mobile Synchronization</label>
                  <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" /></div>
                <button onClick={() => syncStep(2, 'phone', form.phone)} className="btn-auth">SYNCHRONIZE MOBILE</button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key={2} {...slideVar}>
                <div className="auth-field"><label>Sovereign Identity </label>
                  <input type="text" name="uid_number" value={form.uid_number} onChange={handleChange} placeholder="0000 0000 0000" />
                </div>
                <button onClick={() => syncStep(3, 'uid_number', form.uid_number)} className="btn-auth">VERIFY ID</button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key={3} {...slideVar}>
                <div className="auth-field"><label>Establish Digital Signature (Password)</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" /></div>
                <button onClick={() => syncStep(4, 'password_hash', form.password)} className="btn-auth">LOCK SIGNATURE</button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key={4} {...slideVar} className="text-center">
                <span className="big-icon">🛰️</span>
                <h3>Satellite Lockdown</h3>
                <p>Lock your physical office coordinates to your identity.</p>
                <button onClick={handleGetLocation} className="btn-auth bg-emerald" disabled={submitting}>
                  {submitting ? 'Locking...' : 'ACTIVATE POSITION LOCK'}
                </button>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key={5} {...slideVar}>
                <div className="pulsing-badge-sovereign">📍 Verified Area: {resolvedName}</div>
                <div className="auth-field" style={{ marginTop: '20px' }}>
                  <label>Service Jurisdiction</label>
                  <input type="text" value={form.location} readOnly className="input-locked" />
                </div>
                <button onClick={() => syncStep(6)} className="btn-auth">CONFIRM JURISDICTION</button>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div key={6} {...slideVar}>
                <label className="field-label">Administrative Body</label>
                <div className="gov-post-grid">
                  {Object.keys(BODY_DATA).map(b => (
                    <button key={b} className={`post-btn ${form.adminBody === b ? 'active' : ''}`}
                      onClick={() => { setForm({ ...form, adminBody: b, specificRole: '' }); syncStep(7, 'admin_body', b); }}>{b}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 7 && (
              <motion.div key={7} {...slideVar}>
                <label className="field-label">Official Mandate (Role)</label>
                <div className="gov-post-grid">
                  {BODY_DATA[form.adminBody].roles.map(r => (
                    <button key={r} className={`post-btn ${form.specificRole === r ? 'active' : ''}`}
                      onClick={() => { setForm({ ...form, specificRole: r }); syncStep(8, 'specific_role', r); }}>{r}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 8 && (
              <motion.div key={8} {...slideVar}>
                <h3>Workspace Handshake</h3>
                {/* Branching UI text based on Role */}
                <p className="text-muted">{isLeadRole(form.specificRole) ? "Generate Workspace Key for your staff." : "Enter Administrative Key provided by your Admin."}</p>
                <input type="text" name="workspaceCode" value={form.workspaceCode} onChange={handleChange}
                  placeholder={isLeadRole(form.specificRole) ? "CREATE YOUR KEY" : "ENTER ADMIN KEY"} className="text-center" style={{ letterSpacing: '4px', fontWeight: 900 }} />

                {isValidatingCode && <p style={{ color: '#10B981', marginTop: '10px' }}>Validating handshake...</p>}

                {/* Visual Freshness: Emerald Green pulse on successful handshake */}
                {adminDetails && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="pulsing-badge-sovereign mt-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid #10B981', padding: '10px', borderRadius: '8px' }}>
                    Handshake Unlocked: Welcome to {adminDetails.admin_title} {adminDetails.admin_name}'s Workspace
                  </motion.div>
                )}

                <button onClick={handleVerifyWorkspace} className="btn-auth" disabled={isValidatingCode}>
                  {isLeadRole(form.specificRole) ? 'CREATE WORKSPACE' : 'SYNC WORKSPACE'}
                </button>
              </motion.div>
            )}

            {step === 9 && (
              <motion.div key={9} {...slideVar}>
                {/* Branching Logic: Department selection is skipped for Lead Roles */}
                {!isLeadRole(form.specificRole) && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3>Administrative Department</h3>
                    <p className="text-muted">Select your operation domain.</p>
                    <div className="gov-post-grid">
                      {['Roads', 'Water', 'Electricity', 'Sanitation'].map(d => (
                        <button key={d} className={`post-btn ${form.adminDomain === d ? 'active' : ''}`}
                          onClick={() => { setForm({ ...form, adminDomain: d }); }}>{d}</button>
                      ))}
                    </div>
                  </div>
                )}

                <label>Appointment Documentary Proof <span style={{ color: '#6B7280', fontWeight: 400, fontSize: '0.8rem' }}>(Optional)</span></label>
                <div
                  className="upload-box-sovereign"
                  onClick={() => fileRef.current.click()}
                  style={{ cursor: 'pointer', borderStyle: proofFile ? 'solid' : 'dashed', marginBottom: '15px' }}
                >
                  {proofFile
                    ? <span style={{ color: '#10B981', fontWeight: 600 }}>✅ {proofFile.name}</span>
                    : <span>📄 Click here to Select Document (PDF/JPG)</span>
                  }
                  <input type="file" ref={fileRef} hidden onChange={(e) => setProofFile(e.target.files[0])} />
                </div>

                <button onClick={() => syncStep(10)} className="btn-auth" disabled={!isLeadRole(form.specificRole) && !form.adminDomain}>
                  PROCEED TO FINALIZE
                </button>
              </motion.div>
            )}

            {step === 10 && (
              <motion.div key={10} {...slideVar}>
                <h3>Identity Finalization</h3>
                <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>All stages complete. Activate your Sovereign account.</p>
                <button
                  onClick={handleActivate}
                  className="btn-auth"
                  disabled={submitting}
                  style={submitting ? { background: '#6EE7B7', animation: 'pulse 1.5s infinite' } : {}}
                >
                  {submitting ? '⚓ Anchoring Administrative Data...' : 'INITIALIZE SOVEREIGN ACCOUNT'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="auth-footer">
          <Link to="/gov-signup">← Review Core Identity</Link>
        </div>
      </div>
    </div>
  );
}